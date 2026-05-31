// api/water/[action].ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { queryOne, queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const { action } = req.query;

  if (req.method === 'GET' && action === 'daily') {
    const row = await queryOne(
      'SELECT SUM(amount) as total FROM water_logs WHERE user_id = $1 AND timestamp > CURRENT_DATE',
      [userId]
    );
    return res.json({ total: row?.total || 0 });
  }

  if (req.method === 'POST') {
    const { amount } = req.body;
    await queryRun('INSERT INTO water_logs (user_id, amount) VALUES ($1,$2)', [userId, amount]);
    return res.json({ success: true });
  }

  res.status(405).end();
});
