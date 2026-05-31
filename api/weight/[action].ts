// api/weight/[action].ts  (history | add)
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { query, queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const { action } = req.query;

  if (req.method === 'GET' && action === 'history') {
    const history = await query(
      'SELECT * FROM weight_history WHERE user_id = $1 ORDER BY timestamp ASC',
      [userId]
    );
    return res.json(history);
  }

  if (req.method === 'POST') {
    const { weight } = req.body;
    await queryRun('INSERT INTO weight_history (user_id, weight) VALUES ($1,$2)', [userId, weight]);
    await queryRun('UPDATE profiles SET weight = $1 WHERE user_id = $2', [weight, userId]);
    return res.json({ success: true });
  }

  res.status(405).end();
});
