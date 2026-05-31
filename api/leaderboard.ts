// api/leaderboard.ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from './_auth';
import { query } from './_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  if (req.method !== 'GET') return res.status(405).end();
  const rows = await query(`
    SELECT users.name, users.points,
           COALESCE(profiles.level, 'Frango') as level,
           COALESCE(profiles.streak, 0) as streak
    FROM users
    LEFT JOIN profiles ON users.id = profiles.user_id
    ORDER BY users.points DESC
    LIMIT 10
  `);
  res.json(rows);
});
