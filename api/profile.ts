// api/profile.ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from './_auth';
import { query, queryOne, queryRun } from './_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;

  if (req.method === 'GET') {
    const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    const user = await queryOne(
      'SELECT id, name, email, is_premium, role, points, theme, language FROM users WHERE id = $1',
      [userId]
    );
    return res.json({ ...profile, ...user, user_id: userId });
  }

  if (req.method === 'POST') {
    const {
      age, height, weight, fat_percentage, gender, activity_level,
      personality_mode, training_time, routine, sleep, current_diet,
      financial_condition, objective, rest_days, level, days_per_week, limitation
    } = req.body;

    await queryRun(`
      INSERT INTO profiles (user_id, age, height, weight, fat_percentage, gender, activity_level,
        personality_mode, training_time, routine, sleep, current_diet, financial_condition,
        objective, rest_days, level, days_per_week, limitation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (user_id) DO UPDATE SET
        age=$2, height=$3, weight=$4, fat_percentage=$5, gender=$6, activity_level=$7,
        personality_mode=$8, training_time=$9, routine=$10, sleep=$11, current_diet=$12,
        financial_condition=$13, objective=$14, rest_days=$15, level=$16,
        days_per_week=$17, limitation=$18
    `, [userId, age, height, weight, fat_percentage || 0, gender, activity_level || 'moderate',
        personality_mode || 'motivational', training_time || '60', routine || '',
        sleep || '7', current_diet || '', financial_condition || 'medium',
        objective, rest_days || '[]', level || 'beginner', days_per_week || 3, limitation || '']);

    return res.json({ success: true });
  }

  res.status(405).end();
});
