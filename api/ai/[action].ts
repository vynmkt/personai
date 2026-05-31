// api/ai/[action].ts — OpenAI endpoints
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from '../_auth';
import { queryOne, queryRun } from '../_db';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = 'gpt-4o-mini';

async function callOpenAI(messages: { role: string; content: any }[], jsonMode = false): Promise<string> {
  const body: any = { model: MODEL, messages, max_tokens: 8192, temperature: 0.7 };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('OpenAI error:', err);
    throw new Error(`OpenAI API error ${r.status}`);
  }

  const data = await r.json();
  return data.choices[0].message.content;
}

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Chave da OpenAI não configurada. Contate o suporte.' });

  const { action } = req.query;

  // ── CHAT ──────────────────────────────────────────────────────
  if (action === 'chat') {
    const { message, history, profile } = req.body;
    const objMap: Record<string, string> = { lose: 'emagrecer', gain: 'ganhar músculo', maintain: 'manter a forma' };
    const levelMap: Record<string, string> = { beginner: 'iniciante', intermediate: 'intermediário', advanced: 'avançado' };

    const messages = [
      { role: 'system', content: `Você é um coach fitness pessoal. Responda APENAS sobre treino, nutrição e saúde física. Fale de forma simples, sem termos técnicos. Seja breve — máximo 3 parágrafos curtos. Use emojis com moderação. Contexto: objetivo ${objMap[profile?.objective] || profile?.objective}, nível ${levelMap[profile?.level] || profile?.level}, ${profile?.weight}kg, ${profile?.height}cm.` },
      ...(history || []).map((m: any) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
      { role: 'user', content: message }
    ];
    try {
      const text = await callOpenAI(messages, false);
      return res.json({ text });
    } catch (e: any) {
      return res.status(500).json({ error: 'Erro ao processar mensagem. Tente novamente.' });
    }
  }

  // ── COMPARE PHOTOS ────────────────────────────────────────────
  if (action === 'compare-photos') {
    const { profile, beforeImage, afterImage } = req.body;
    const objMap: Record<string, string> = { lose: 'emagrecer', gain: 'ganhar músculo', maintain: 'manter a forma' };

    let messages: any[];
    if (beforeImage && afterImage) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: `Analise estas fotos de antes e depois. Perfil: objetivo ${objMap[profile?.objective] || profile?.objective}, ${profile?.weight}kg, nível ${profile?.level}. Faça uma análise técnica e motivacional da evolução. Destaque melhorias e o que ainda pode evoluir. Responda em Português, máximo 4 parágrafos.` },
          { type: 'image_url', image_url: { url: beforeImage, detail: 'low' } },
          { type: 'image_url', image_url: { url: afterImage, detail: 'low' } }
        ]
      }];
    } else {
      messages = [{ role: 'user', content: `Dê uma análise motivacional sobre evolução fitness. Perfil: objetivo ${objMap[profile?.objective]}, ${profile?.weight}kg, nível ${profile?.level}. Escreva 3-4 parágrafos encorajadores. Responda em Português.` }];
    }
    try {
      const text = await callOpenAI(messages, false);
      return res.json({ text });
    } catch {
      return res.status(500).json({ error: 'Erro ao analisar. Tente novamente.' });
    }
  }

  // ── MEAL PARSE ────────────────────────────────────────────────
  if (action === 'meal-parse') {
    const { description } = req.body;
    const prompt = `Analise esta refeição: "${description}". Retorne APENAS JSON: { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number }. Use porções padrão brasileiras se quantidade não informada.`;
    try {
      const text = await callOpenAI([{ role: 'user', content: prompt }], true);
      return res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      return res.status(500).json({ error: 'Não consegui analisar essa refeição. Tente descrever de outra forma.' });
    }
  }

  // ── RECIPE ───────────────────────────────────────────────────
  if (action === 'recipe') {
    const { goals } = req.body;
    const prompt = `Sugira uma receita fitness rápida e deliciosa com aproximadamente:
Calorias: ${Math.round(goals.calories / 5)} kcal, Proteína: ${Math.round(goals.protein / 5)}g, Carbs: ${Math.round(goals.carbs / 5)}g, Gordura: ${Math.round(goals.fat / 5)}g.
Use ingredientes acessíveis. Inclua modo de preparo. Responda em Português com Markdown.`;
    try {
      const text = await callOpenAI([{ role: 'user', content: prompt }], false);
      return res.json({ text });
    } catch {
      return res.status(500).json({ error: 'Erro ao gerar receita. Tente novamente.' });
    }
  }

  // ── ANALYZE (gerar plano completo) ───────────────────────────
  if (action === 'analyze') {
    const { profile, lang, isRaiz, tdee } = req.body;
    const prompt = `Você é Personai, uma equipe de elite de preparação física.
Personalidade: ${isRaiz ? 'MODO RAIZ. Brutalmente honesto, direto, use gírias de maromba.' : 'MODO MOTIVACIONAL. Encorajador, positivo, focado em superação.'}
Idioma: ${lang === 'pt' ? 'Português (Brasil)' : 'Inglês'}

DADOS DO ATLETA:
- Sexo: ${profile.gender}, Idade: ${profile.age}, Altura: ${profile.height}cm, Peso: ${profile.weight}kg
- % Gordura: ${profile.fat_percentage || 'não informado'}%
- Nível de atividade: ${profile.activity_level}, TDEE Estimado: ${tdee} kcal
- Tempo de treino: ${profile.training_time} min, Objetivo: ${profile.objective}
- Dias de Descanso: ${profile.rest_days || '[]'}, Nível: ${profile.level}
- Sono: ${profile.sleep}h, Dieta atual: ${profile.current_diet || 'não informada'}
- Limitações: ${profile.limitation || 'nenhuma'}

TAREFA: Gere um plano personalizado completo e retorne APENAS um JSON válido:
{
  "fat_percentage_estimate": number,
  "analysis": "Markdown com Avaliação Técnica e Estratégia",
  "training_plan": "Markdown detalhado do Plano de Treino",
  "training_schedule": {
    "segunda": { "muscle_group": "string", "exercises": [{ "name": "string", "sets": "string", "reps": "string", "rest": "string", "gif_url": "string" }] },
    "terça": { "muscle_group": "string", "exercises": [] },
    "quarta": { "muscle_group": "string", "exercises": [] },
    "quinta": { "muscle_group": "string", "exercises": [] },
    "sexta": { "muscle_group": "string", "exercises": [] },
    "sábado": { "muscle_group": "string", "exercises": [] },
    "domingo": { "muscle_group": "string", "exercises": [] }
  },
  "nutrition_plan": "Markdown detalhado do Plano de Nutrição",
  "nutrition_schedule": [
    { "name": "string", "time": "string", "items": ["string"], "calories": number, "protein": number, "carbs": number, "fat": number }
  ],
  "targets": { "calories": number, "protein": number, "carbs": number, "fat": number }
}
Se um dia for descanso, muscle_group = "Descanso" e exercises = [].`;

    try {
      const text = await callOpenAI([{ role: 'user', content: prompt }], true);
      const result = JSON.parse(text.replace(/```json|```/g, '').trim());
      return res.json(result);
    } catch (e: any) {
      console.error('Analyze error:', e);
      return res.status(500).json({ error: 'Erro ao gerar plano. Verifique sua conexão e tente novamente.' });
    }
  }

  // ── EVOLUTION ────────────────────────────────────────────────
  if (action === 'evolution') {
    const { previous, latest } = req.body;
    const prompt = `Analise a evolução deste atleta.

ANÁLISE ANTERIOR (${new Date(previous.timestamp).toLocaleDateString('pt-BR')}):
${previous.analysis} — % Gordura: ${previous.fat_percentage}%

ANÁLISE ATUAL (${new Date(latest.timestamp).toLocaleDateString('pt-BR')}):
${latest.analysis} — % Gordura: ${latest.fat_percentage}%

Retorne APENAS JSON:
{
  "summary": "Breve resumo da evolução",
  "improvements": ["Ponto 1", "Ponto 2"],
  "to_improve": ["O que focar agora 1", "O que focar agora 2"],
  "technical_details": "Markdown com detalhes técnicos",
  "motivation": "Frase motivadora curta"
}`;
    try {
      const text = await callOpenAI([{ role: 'user', content: prompt }], true);
      return res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      return res.status(500).json({ error: 'Erro ao analisar evolução. Tente novamente.' });
    }
  }

  // ── ROAST ────────────────────────────────────────────────────
  if (action === 'roast') {
    const { profile } = req.body;
    const prompt = `ROAST fitness do atleta: Sexo ${profile.gender}, ${profile.age} anos, ${profile.height}cm, ${profile.weight}kg, objetivo ${profile.objective || 'não definido'}.
Use gírias de maromba brasileiras (frango, retido, shape de grilo...). Seja curto, grosso e hilário. Máximo 200 palavras. Responda em Português.`;
    try {
      const text = await callOpenAI([{ role: 'user', content: prompt }], false);
      return res.json({ text });
    } catch {
      return res.status(500).json({ error: 'Erro ao gerar roast. Tente novamente.' });
    }
  }

  res.status(404).json({ error: 'Rota não encontrada' });
});
