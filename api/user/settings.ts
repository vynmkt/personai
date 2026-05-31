// api/user/settings.ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { queryRun } from '../_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { theme, language } = req.body;
  await queryRun(
    'UPDATE users SET theme = $1, language = $2 WHERE id = $3',
    [theme || 'dark', language || 'pt', req.user!.id]
  );
  res.json({ success: true });
});
