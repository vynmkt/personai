// api/shape/history/[id].ts — DELETE /api/shape/history/:id
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../../_auth';
import { queryRun } from '../../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  if (req.method !== 'DELETE') return res.status(405).end();
  const { id } = req.query;
  await queryRun(
    'DELETE FROM shape_history WHERE id = $1 AND user_id = $2',
    [id, req.user!.id]
  );
  res.json({ success: true });
});
