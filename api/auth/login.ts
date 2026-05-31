// api/auth/login.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { queryOne } from '../_db';
import { signToken } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

  try {
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }
    const token = signToken(user.id, user.email);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, is_premium: user.is_premium, role: user.role, theme: user.theme, language: user.language }
    });
  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Erro ao fazer login. Tente novamente.' });
  }
}
