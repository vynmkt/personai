import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { queryRun, queryOne } from './_db';
import { signToken, withAuth, AuthRequest } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || '';

  if (req.method === 'POST' && action === 'signup') {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Preencha todos os campos' });
    if (password.length < 6) return res.status(400).json({ error: 'Senha muito curta' });
    try {
      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing) return res.status(409).json({ error: 'Este e-mail já está cadastrado' });
      const hash = await bcrypt.hash(password, 10);
      const result = await queryRun('INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, is_premium, role', [email.toLowerCase(), hash, name]);
      const user = result.rows[0];
      return res.json({ token: signToken(user.id, user.email), user });
    } catch (e: any) {
      return res.status(500).json({ error: 'Erro ao criar conta.' });
    }
  }

  if (req.method === 'POST' && action === 'login') {
    const { email, password } = req.body;
    try {
      const user = await queryOne('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'E-mail ou senha incorretos' });
      return res.json({ token: signToken(user.id, user.email), user: { id: user.id, email: user.email, name: user.name, is_premium: user.is_premium, role: user.role, theme: user.theme, language: user.language } });
    } catch (e: any) {
      return res.status(500).json({ error: 'Erro ao fazer login.' });
    }
  }

  res.status(404).json({ error: 'Rota não encontrada' });
}
