// api/auth/signup.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { queryRun, queryOne } from '../_db';
import { signToken } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Preencha todos os campos' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha muito curta' });

  try {
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing) return res.status(409).json({ error: 'Este e-mail já está cadastrado' });

    const hash = await bcrypt.hash(password, 10);
    const result = await queryRun(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, is_premium, role',
      [email.toLowerCase(), hash, name]
    );
    const user = result.rows[0];
    const token = signToken(user.id, user.email);
    res.json({ token, user });
  } catch (e: any) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
  }
}
