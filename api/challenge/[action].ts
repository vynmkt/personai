// api/challenge/[action].ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { query, queryOne, queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const { action } = req.query;

  // GET /api/challenge/status
  if (req.method === 'GET' && action === 'status') {
    const challenge = await queryOne(
      "SELECT * FROM challenges WHERE user_id = $1 AND status = 'active'",
      [userId]
    );
    const missions = await queryOne(
      'SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );
    return res.json({ challenge, missions: missions || { protein_met: 0, training_done: 0, cardio_done: 0 } });
  }

  // POST /api/challenge/start
  if (req.method === 'POST' && action === 'start') {
    await queryRun('INSERT INTO challenges (user_id) VALUES ($1)', [userId]);
    return res.json({ success: true });
  }

  // POST /api/challenge/mission
  if (req.method === 'POST' && action === 'mission') {
    const { type, value } = req.body;
    const allowedTypes = ['protein_met', 'training_done', 'cardio_done'];
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Tipo inválido' });

    const existing = await queryOne(
      'SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );

    if (existing) {
      await queryRun(
        `UPDATE daily_missions SET ${type} = $1 WHERE id = $2`,
        [value ? 1 : 0, existing.id]
      );
    } else {
      await queryRun(
        `INSERT INTO daily_missions (user_id, date, ${type}) VALUES ($1, CURRENT_DATE, $2)`,
        [userId, value ? 1 : 0]
      );
    }

    if (value) {
      await queryRun('UPDATE users SET points = points + 50 WHERE id = $1', [userId]);
    }

    // Update streak if all missions done
    const missions: any = await queryOne(
      'SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );
    if (missions?.protein_met && missions?.training_done && missions?.cardio_done) {
      const profile: any = await queryOne(
        'SELECT last_mission_date, streak FROM profiles WHERE user_id = $1',
        [userId]
      );
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (profile && profile.last_mission_date !== today) {
        let newStreak = 1;
        if (profile.last_mission_date === yesterdayStr) newStreak = (profile.streak || 0) + 1;

        const user: any = await queryOne('SELECT points FROM users WHERE id = $1', [userId]);
        let newLevel = 'Frango';
        if (user.points > 5000) newLevel = 'Lenda';
        else if (user.points > 2000) newLevel = 'Guerreiro';
        else if (user.points > 500) newLevel = 'Atleta';

        await queryRun(
          'UPDATE profiles SET streak = $1, last_mission_date = $2, level = $3 WHERE user_id = $4',
          [newStreak, today, newLevel, userId]
        );
      }
    }

    return res.json({ success: true });
  }

  res.status(405).end();
});
