// api/shape/[action].ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { query, queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const { action } = req.query;

  // GET /api/shape/history
  if (req.method === 'GET' && action === 'history') {
    const history = await query(
      'SELECT * FROM shape_history WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );
    return res.json(history);
  }

  // POST /api/shape/analysis
  if (req.method === 'POST' && action === 'analysis') {
    const { image_data, analysis, fat_percentage } = req.body;
    await queryRun(
      'INSERT INTO shape_history (user_id, image_data, analysis, fat_percentage) VALUES ($1,$2,$3,$4)',
      [userId, image_data, analysis, fat_percentage]
    );
    return res.json({ success: true });
  }

  res.status(405).end();
});
