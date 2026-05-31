import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthRequest } from './_auth';
import { query, queryOne, queryRun } from './_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const action = (req.query.action as string) || '';

  // CHALLENGE STATUS
  if (action === 'challenge-status' && req.method === 'GET') {
    const challenge = await queryOne("SELECT * FROM challenges WHERE user_id = $1 AND status = 'active'", [userId]);
    const missions = await queryOne('SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE', [userId]);
    return res.json({ challenge, missions: missions || { protein_met: 0, training_done: 0, cardio_done: 0 } });
  }

  // CHALLENGE START
  if (action === 'challenge-start' && req.method === 'POST') {
    await queryRun('INSERT INTO challenges (user_id) VALUES ($1)', [userId]);
    return res.json({ success: true });
  }

  // CHALLENGE MISSION
  if (action === 'challenge-mission' && req.method === 'POST') {
    const { type, value } = req.body;
    const allowed = ['protein_met', 'training_done', 'cardio_done'];
    if (!allowed.includes(type)) return res.status(400).json({ error: 'Tipo inválido' });

    const existing = await queryOne('SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE', [userId]);
    if (existing) {
      await queryRun(`UPDATE daily_missions SET ${type} = $1 WHERE id = $2`, [value ? 1 : 0, existing.id]);
    } else {
      await queryRun(`INSERT INTO daily_missions (user_id, date, ${type}) VALUES ($1, CURRENT_DATE, $2)`, [userId, value ? 1 : 0]);
    }
    if (value) await queryRun('UPDATE users SET points = points + 50 WHERE id = $1', [userId]);

    const missions: any = await queryOne('SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE', [userId]);
    if (missions?.protein_met && missions?.training_done && missions?.cardio_done) {
      const profile: any = await queryOne('SELECT last_mission_date, streak FROM profiles WHERE user_id = $1', [userId]);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (profile && profile.last_mission_date !== today) {
        let newStreak = profile.last_mission_date === yesterdayStr ? (profile.streak || 0) + 1 : 1;
        const user: any = await queryOne('SELECT points FROM users WHERE id = $1', [userId]);
        let newLevel = user.points > 5000 ? 'Lenda' : user.points > 2000 ? 'Guerreiro' : user.points > 500 ? 'Atleta' : 'Frango';
        await queryRun('UPDATE profiles SET streak = $1, last_mission_date = $2, level = $3 WHERE user_id = $4', [newStreak, today, newLevel, userId]);
      }
    }
    return res.json({ success: true });
  }

  // SHAPE HISTORY
  if (action === 'shape-history' && req.method === 'GET') {
    const history = await query('SELECT * FROM shape_history WHERE user_id = $1 ORDER BY timestamp DESC', [userId]);
    return res.json(history);
  }
  if (action === 'shape-analysis' && req.method === 'POST') {
    const { image_data, analysis, fat_percentage } = req.body;
    await queryRun('INSERT INTO shape_history (user_id, image_data, analysis, fat_percentage) VALUES ($1,$2,$3,$4)', [userId, image_data, analysis, fat_percentage]);
    return res.json({ success: true });
  }
  if (action === 'shape-delete' && req.method === 'DELETE') {
    const { id } = req.query;
    await queryRun('DELETE FROM shape_history WHERE id = $1 AND user_id = $2', [id, userId]);
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Rota não encontrada' });
});
