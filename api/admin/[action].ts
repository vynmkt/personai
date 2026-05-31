// api/admin/[action].ts
import type { VercelResponse } from '@vercel/node';
import { withAdminAuth, type AuthRequest } from '../_auth';
import { query, queryOne, queryRun } from '../_db';

export default withAdminAuth(async (req: AuthRequest, res: VercelResponse) => {
  const { action } = req.query;

  // GET /api/admin/users
  if (req.method === 'GET' && action === 'users') {
    const search = `%${req.query.search || ''}%`;
    const users = await query(
      'SELECT id, name, email, is_premium, role, created_at FROM users WHERE name ILIKE $1 OR email ILIKE $2 ORDER BY created_at DESC',
      [search, search]
    );
    return res.json(users);
  }

  // GET /api/admin/stats
  if (req.method === 'GET' && action === 'stats') {
    const totalUsers = await queryOne('SELECT COUNT(*) as count FROM users');
    const premiumUsers = await queryOne('SELECT COUNT(*) as count FROM users WHERE is_premium = 1');
    const totalTokens = await queryOne('SELECT SUM(tokens) as count FROM usage_logs');
    return res.json({
      totalUsers: parseInt(totalUsers?.count || 0),
      premiumUsers: parseInt(premiumUsers?.count || 0),
      totalTokens: parseInt(totalTokens?.count || 0),
    });
  }

  res.status(404).end();
});
