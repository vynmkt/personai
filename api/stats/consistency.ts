// api/stats/consistency.ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { queryOne } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).end();
  const row = await queryOne(
    `SELECT COUNT(DISTINCT date) as count FROM daily_missions
     WHERE user_id = $1 AND (protein_met = 1 AND training_done = 1)
     AND date > CURRENT_DATE - INTERVAL '30 days'`,
    [req.user!.id]
  );
  const percentage = Math.round(((row?.count || 0) / 30) * 100);
  res.json({ percentage });
});
