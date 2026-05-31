// api/nutrition/[action].ts  (daily | meal)
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { query, queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const { action } = req.query;

  // GET /api/nutrition/daily
  if (req.method === 'GET' && action === 'daily') {
    const meals = await query(
      `SELECT * FROM meals WHERE user_id = $1 AND timestamp > CURRENT_DATE`,
      [userId]
    );
    return res.json(meals);
  }

  // POST /api/nutrition/meal
  if (req.method === 'POST' && action === 'meal') {
    const { name, calories, protein, carbs, fat } = req.body;
    await queryRun(
      'INSERT INTO meals (user_id, name, calories, protein, carbs, fat) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, name, calories, protein, carbs, fat]
    );
    await queryRun('UPDATE users SET points = points + 10 WHERE id = $1', [userId]);
    return res.json({ success: true });
  }

  res.status(405).end();
});
