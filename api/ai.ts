import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthRequest } from './_auth';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = 'gpt-4o-mini';

async function callOpenAI(messages: any[], jsonMode = false): Promise<string> {
  const body: any = { model: MODEL, messages, max_tokens: 8192, temperature: 0.7 };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`OpenAI error ${r.status}`);
  const data = await r.json();
  return data.choices[0].message.content;
}

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Chave da OpenAI não configurada.' });

  const action = (req.query.action as string) || '';

  if (action === 'chat') {
    const { message, history, profile } = req.body;
    const objMap: any = { lose: 'emagrecer', gain: 'ganhar músculo', maintain: 'manter a forma' };
    const levelMap: any = { beginner: 'iniciante', intermediate: 'intermediário', advanced: 'avançado' };
    const messages = [
      { role: 'system', content: `Você é um coach fitness pessoal. Responda APENAS sobre treino, nutrição e saúde física. Fale de forma simples. Seja breve — máximo 3 parágrafos. Contexto: objetivo ${objMap[profile?.objective]}, nível ${levelMap[profile?.level]}, ${profile?.weight}kg, ${profile?.height}cm.` },
      ...(history || []).map((m: any) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
      { role: 'user', content: message }
    ];
    try {
      const text = await callOpenAI(messages, false);
      return res.json({ text });
    } catch { return res.status(500).json({ error: 'Erro ao processar mensagem.' }); }
  }

  if (action === 'analyze') {
    const { profile, lang, isRaiz, tdee } = req.body;
    const prompt = `Você é Personai, coach de elite fitness.
Personalidade: ${isRaiz ? 'MODO RAIZ. Brutalmente honesto, gírias de maromba.' : 'MODO MOTIVACIONAL. Encorajador, positivo.'}
Idioma: ${lang === 'pt' ? 'Português (Brasil)' : 'Inglês'}
DADOS: Sexo ${profile.gender}, ${profile.age} anos, ${profile.height}cm, ${profile.weight}kg, gordura ${profile.fat_percentage || 'n/a'}%, TDEE ${tdee} kcal, objetivo ${profile.objective}, nível ${profile.level}, limitações: ${profile.limitation || 'nenhuma'}
Retorne APENAS JSON válido:
{"fat_percentage_estimate":number,"analysis":"Markdown","training_plan":"Markdown","training_schedule":{"segunda":{"muscle_group":"string","exercises":[{"name":"string","sets":"string","reps":"string","rest":"string","gif_url":"string"}]},"terça":{"muscle_group":"string","exercises":[]},"quarta":{"muscle_group":"string","exercises":[]},"quinta":{"muscle_group":"string","exercises":[]},"sexta":{"muscle_group":"string","exercises":[]},"sábado":{"muscle_group":"string","exercises":[]},"domingo":{"muscle_group":"string","exercises":[]}},"nutrition_plan":"Markdown","nutrition_schedule":[{"name":"string","time":"string","items":["string"],"calories":0,"protein":0,"carbs":0,"fat":0}],"targets":{"calories":0,"protein":0,"carbs":0,"fat":0}}
Se dia for descanso: muscle_group="Descanso", exercises=[].`;
    try {
      const text = await callOpenAI([{ role: 'user', content: prompt }], true);
      return res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch (e: any) {
      return res.status(500).json({ error: 'Erro ao gerar plano.' });
    }
  }

  if (action === 'meal-parse') {
    const { description } = req.body;
    try {
      const text = await callOpenAI([{ role: 'user', content: `Analise: "${description}". Retorne APENAS JSON: {"name":string,"calories":number,"protein":number,"carbs":number,"fat":number}. Porções padrão brasileiras.` }], true);
      return res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { return res.status(500).json({ error: 'Erro ao analisar refeição.' }); }
  }

  if (action === 'recipe') {
    const { goals } = req.body;
    try {
      const text = await callOpenAI([{ role: 'user', content: `Sugira receita fitness: ~${Math.round(goals.calories/5)}kcal, ${Math.round(goals.protein/5)}g proteína. Ingredientes acessíveis. Markdown. Português.` }], false);
      return res.json({ text });
    } catch { return res.status(500).json({ error: 'Erro ao gerar receita.' }); }
  }

  if (action === 'compare-photos') {
    const { profile, beforeImage, afterImage } = req.body;
    const objMap: any = { lose: 'emagrecer', gain: 'ganhar músculo', maintain: 'manter a forma' };
    let messages: any[];
    if (beforeImage && afterImage) {
      messages = [{ role: 'user', content: [{ type: 'text', text: `Analise evolução fitness. Perfil: ${objMap[profile?.objective]}, ${profile?.weight}kg, nível ${profile?.level}. Análise técnica motivacional. Português, 4 parágrafos.` }, { type: 'image_url', image_url: { url: beforeImage, detail: 'low' } }, { type: 'image_url', image_url: { url: afterImage, detail: 'low' } }] }];
    } else {
      messages = [{ role: 'user', content: `Análise motivacional evolução fitness. ${objMap[profile?.objective]}, ${profile?.weight}kg. 3 parágrafos. Português.` }];
    }
    try {
      const text = await callOpenAI(messages, false);
      return res.json({ text });
    } catch { return res.status(500).json({ error: 'Erro ao analisar fotos.' }); }
  }

  if (action === 'evolution') {
    const { previous, latest } = req.body;
    try {
      const text = await callOpenAI([{ role: 'user', content: `Compare evolução: ANTERIOR ${previous.analysis} (${previous.fat_percentage}% gordura) vs ATUAL ${latest.analysis} (${latest.fat_percentage}% gordura). JSON: {"summary":"string","improvements":["string"],"to_improve":["string"],"technical_details":"string","motivation":"string"}` }], true);
      return res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { return res.status(500).json({ error: 'Erro ao analisar evolução.' }); }
  }

  if (action === 'roast') {
    const { profile } = req.body;
    try {
      const text = await callOpenAI([{ role: 'user', content: `ROAST fitness: ${profile.gender}, ${profile.age} anos, ${profile.height}cm, ${profile.weight}kg. Gírias maromba brasileiras. Curto, hilário. Máx 200 palavras. Português.` }], false);
      return res.json({ text });
    } catch { return res.status(500).json({ error: 'Erro ao gerar roast.' }); }
  }

  res.status(404).json({ error: 'Ação não encontrada' });
});
