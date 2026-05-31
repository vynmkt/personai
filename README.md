# PersonAI — Deploy Gratuito (Supabase + Vercel)

Guia completo para publicar o PersonAI de graça em produção.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com) (gratuita)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (gratuita)
- Chave da [OpenAI](https://platform.openai.com/api-keys) (paga por uso)

---

## Passo 1 — Configurar o banco de dados (Supabase)

1. Acesse [app.supabase.com](https://app.supabase.com) e clique em **New Project**
2. Escolha um nome (ex: `personai`) e uma senha forte para o banco
3. Aguarde ~2 minutos até o projeto estar pronto
4. No menu lateral, clique em **SQL Editor**
5. Copie todo o conteúdo do arquivo `supabase/schema.sql` e cole no editor
6. Clique em **Run** — todas as tabelas serão criadas

### Pegar a Connection String:
1. No menu lateral: **Project Settings → Database**
2. Role até **Connection string** e selecione **URI**
3. Copie a string (parece com: `postgresql://postgres:[senha]@db.xxx.supabase.co:5432/postgres`)
4. **Substitua `[YOUR-PASSWORD]` pela senha que você criou no passo 2**
5. Guarde essa string — vai precisar no Passo 3

---

## Passo 2 — Subir o código no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Crie um repositório chamado `personai` (pode ser privado)
3. No seu computador, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "PersonAI v3 — deploy inicial"
git remote add origin https://github.com/SEU-USUARIO/personai.git
git push -u origin main
```

---

## Passo 3 — Publicar no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. Clique em **Add New Project**
3. Selecione o repositório `personai` e clique em **Import**
4. Na tela de configuração, **antes de clicar em Deploy**, clique em **Environment Variables**
5. Adicione as 3 variáveis abaixo:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | A connection string do Supabase (Passo 1) |
| `OPENAI_API_KEY` | Sua chave da OpenAI (`sk-...`) |
| `JWT_SECRET` | Qualquer string aleatória longa (ex: `personai-super-secret-2024-xyzabc`) |

6. Clique em **Deploy** e aguarde ~2 minutos
7. Pronto! Seu app estará em `https://personai-xxx.vercel.app`

---

## Domínio personalizado (opcional)

1. No Vercel: **Project → Settings → Domains**
2. Adicione seu domínio e siga as instruções de DNS

---

## Variáveis de ambiente

```bash
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres"

# OpenAI (gpt-4o-mini — cobrado por uso, muito barato)
OPENAI_API_KEY="sk-..."

# JWT (qualquer string secreta longa)
JWT_SECRET="string-aleatoria-longa-e-segura"
```

---

## Arquitetura do deploy

```
Usuário → Vercel (React SPA + Serverless Functions)
                ↓
         /api/* → TypeScript functions
                ↓
         Supabase PostgreSQL (banco de dados)
                ↓
         OpenAI API (IA — gpt-4o-mini)
```

- **Frontend**: Vite + React → Vercel CDN (edge)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Banco**: Supabase PostgreSQL (free tier: 500MB, até 50k linhas)
- **IA**: OpenAI gpt-4o-mini (~$0.001 por análise)

---

## Limites do plano gratuito

| Serviço | Limite gratuito |
|---------|----------------|
| Vercel | 100GB bandwidth/mês, 100h funções/mês |
| Supabase | 500MB banco, 2GB storage, 50k requisições/dia |
| OpenAI | Sem limite gratuito — pago por uso (muito barato) |

Para um app pessoal ou pequeno, esses limites são mais que suficientes.

---

## Atualizar o app

Toda vez que fizer push para o GitHub, o Vercel faz o deploy automático:

```bash
git add .
git commit -m "Minha atualização"
git push
```

---

## Solução de problemas

**Erro "DATABASE_URL not set"**: Verifique as variáveis de ambiente no Vercel

**Erro de conexão com o banco**: Certifique-se que a senha na connection string está correta e que o projeto Supabase está ativo

**Erro da OpenAI**: Verifique se a chave começa com `sk-` e tem créditos disponíveis

**Tabelas não criadas**: Execute novamente o `schema.sql` no SQL Editor do Supabase
