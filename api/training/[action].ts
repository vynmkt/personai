// api/training/[action].ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { query, queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const { action } = req.query;

  if (req.method === 'GET' && action === 'loads') {
    const loads = await query(
      'SELECT * FROM load_tracking WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );
    return res.json(loads);
  }

  if (req.method === 'POST' && action === 'load') {
    const { exercise_name, weight, reps, sets } = req.body;
    await queryRun(
      'INSERT INTO load_tracking (user_id, exercise_name, weight, reps, sets) VALUES ($1,$2,$3,$4,$5)',
      [userId, exercise_name, weight, reps, sets]
    );
    return res.json({ success: true });
  }

  res.status(405).end();
});
