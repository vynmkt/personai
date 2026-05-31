// api/usage/log.ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { type, tokens } = req.body;
  await queryRun(
    'INSERT INTO usage_logs (user_id, type, tokens) VALUES ($1,$2,$3)',
    [req.user!.id, type, tokens || 0]
  );
  res.json({ success: true });
});
