// api/admin/user/[id]/[action].ts
import type { VercelResponse } from '@vercel/node';
import { withAdminAuth, type AuthRequest } from '../../../_auth';
import { query, queryRun } from '../../../_db';

export default withAdminAuth(async (req: AuthRequest, res: VercelResponse) => {
  const { id, action } = req.query;

  // GET /api/admin/user/:id/stats
  if (req.method === 'GET' && action === 'stats') {
    const logs = await query(
      'SELECT type, SUM(tokens) as total_tokens, COUNT(*) as count FROM usage_logs WHERE user_id = $1 GROUP BY type',
      [id]
    );
    return res.json(logs);
  }

  // POST /api/admin/user/:id/plan
  if (req.method === 'POST' && action === 'plan') {
    const { is_premium } = req.body;
    await queryRun('UPDATE users SET is_premium = $1 WHERE id = $2', [is_premium ? 1 : 0, id]);
    return res.json({ success: true });
  }

  res.status(404).end();
});
