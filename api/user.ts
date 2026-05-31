import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthRequest } from './_auth';
import { query, queryOne, queryRun } from './_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;
  const action = (req.query.action as string) || '';

  // PROFILE
  if (action === 'profile') {
    if (req.method === 'GET') {
      const profile = await queryOne('SELECT * FROM profiles WHERE user_id = $1', [userId]);
      const user = await queryOne('SELECT id, name, email, is_premium, role, points, theme, language FROM users WHERE id = $1', [userId]);
      return res.json({ ...profile, ...user, user_id: userId });
    }
    if (req.method === 'POST') {
      const { age, height, weight, fat_percentage, gender, activity_level, personality_mode, training_time, routine, sleep, current_diet, financial_condition, objective, rest_days, level, days_per_week, limitation } = req.body;
      await queryRun(`INSERT INTO profiles (user_id,age,height,weight,fat_percentage,gender,activity_level,personality_mode,training_time,routine,sleep,current_diet,financial_condition,objective,rest_days,level,days_per_week,limitation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (user_id) DO UPDATE SET age=$2,height=$3,weight=$4,fat_percentage=$5,gender=$6,activity_level=$7,personality_mode=$8,training_time=$9,routine=$10,sleep=$11,current_diet=$12,financial_condition=$13,objective=$14,rest_days=$15,level=$16,days_per_week=$17,limitation=$18`,
        [userId, age, height, weight, fat_percentage || 0, gender, activity_level || 'moderate', personality_mode || 'motivational', training_time || '60', routine || '', sleep || '7', current_diet || '', financial_condition || 'medium', objective, rest_days || '[]', level || 'beginner', days_per_week || 3, limitation || '']);
      return res.json({ success: true });
    }
  }

  // PLANS
  if (action === 'plans') {
    if (req.method === 'GET') {
      const plans = await queryOne('SELECT * FROM plans WHERE user_id = $1', [userId]);
      return res.json(plans || { training_plan: null, nutrition_plan: null, last_analysis: null, target_calories: null, target_protein: null, target_carbs: null, target_fat: null, training_schedule: null, nutrition_schedule: null });
    }
    if (req.method === 'POST') {
      const { training_plan, nutrition_plan, last_analysis, target_calories, target_protein, target_carbs, target_fat, training_schedule, nutrition_schedule } = req.body;
      const ts = typeof training_schedule === 'string' ? training_schedule : JSON.stringify(training_schedule);
      const ns = typeof nutrition_schedule === 'string' ? nutrition_schedule : JSON.stringify(nutrition_schedule);
      await queryRun(`INSERT INTO plans (user_id,training_plan,nutrition_plan,last_analysis,target_calories,target_protein,target_carbs,target_fat,training_schedule,nutrition_schedule) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (user_id) DO UPDATE SET training_plan=$2,nutrition_plan=$3,last_analysis=$4,target_calories=$5,target_protein=$6,target_carbs=$7,target_fat=$8,training_schedule=$9,nutrition_schedule=$10`,
        [userId, training_plan, nutrition_plan, last_analysis, target_calories, target_protein, target_carbs, target_fat, ts, ns]);
      return res.json({ success: true });
    }
  }

  // SETTINGS
  if (action === 'settings' && req.method === 'POST') {
    const { theme, language } = req.body;
    await queryRun('UPDATE users SET theme = $1, language = $2 WHERE id = $3', [theme || 'dark', language || 'pt', userId]);
    return res.json({ success: true });
  }

  // WEIGHT
  if (action === 'weight') {
    if (req.method === 'GET') {
      const history = await query('SELECT * FROM weight_history WHERE user_id = $1 ORDER BY timestamp ASC', [userId]);
      return res.json(history);
    }
    if (req.method === 'POST') {
      const { weight } = req.body;
      await queryRun('INSERT INTO weight_history (user_id, weight) VALUES ($1,$2)', [userId, weight]);
      await queryRun('UPDATE profiles SET weight = $1 WHERE user_id = $2', [weight, userId]);
      return res.json({ success: true });
    }
  }

  // WATER
  if (action === 'water') {
    if (req.method === 'GET') {
      const row = await queryOne('SELECT SUM(amount) as total FROM water_logs WHERE user_id = $1 AND timestamp > CURRENT_DATE', [userId]);
      return res.json({ total: row?.total || 0 });
    }
    if (req.method === 'POST') {
      const { amount } = req.body;
      await queryRun('INSERT INTO water_logs (user_id, amount) VALUES ($1,$2)', [userId, amount]);
      return res.json({ success: true });
    }
  }

  // NUTRITION
  if (action === 'nutrition-daily' && req.method === 'GET') {
    const meals = await query('SELECT * FROM meals WHERE user_id = $1 AND timestamp > CURRENT_DATE', [userId]);
    return res.json(meals);
  }
  if (action === 'nutrition-meal' && req.method === 'POST') {
    const { name, calories, protein, carbs, fat } = req.body;
    await queryRun('INSERT INTO meals (user_id, name, calories, protein, carbs, fat) VALUES ($1,$2,$3,$4,$5,$6)', [userId, name, calories, protein, carbs, fat]);
    await queryRun('UPDATE users SET points = points + 10 WHERE id = $1', [userId]);
    return res.json({ success: true });
  }

  // STATS
  if (action === 'consistency' && req.method === 'GET') {
    const row = await queryOne(`SELECT COUNT(DISTINCT date) as count FROM daily_missions WHERE user_id = $1 AND (protein_met = 1 AND training_done = 1) AND date > CURRENT_DATE - INTERVAL '30 days'`, [userId]);
    return res.json({ percentage: Math.round(((row?.count || 0) / 30) * 100) });
  }

  // LEADERBOARD
  if (action === 'leaderboard' && req.method === 'GET') {
    const rows = await query(`SELECT users.name, users.points, COALESCE(profiles.level,'Frango') as level, COALESCE(profiles.streak,0) as streak FROM users LEFT JOIN profiles ON users.id = profiles.user_id ORDER BY users.points DESC LIMIT 10`);
    return res.json(rows);
  }

  // TRAINING LOADS
  if (action === 'training-loads' && req.method === 'GET') {
    const loads = await query('SELECT * FROM load_tracking WHERE user_id = $1 ORDER BY timestamp DESC', [userId]);
    return res.json(loads);
  }
  if (action === 'training-load' && req.method === 'POST') {
    const { exercise_name, weight, reps, sets } = req.body;
    await queryRun('INSERT INTO load_tracking (user_id, exercise_name, weight, reps, sets) VALUES ($1,$2,$3,$4,$5)', [userId, exercise_name, weight, reps, sets]);
    return res.json({ success: true });
  }

  // USAGE LOG
  if (action === 'usage-log' && req.method === 'POST') {
    const { type, tokens } = req.body;
    await queryRun('INSERT INTO usage_logs (user_id, type, tokens) VALUES ($1,$2,$3)', [userId, type, tokens || 0]);
    return res.json({ success: true });
  }

  // ERROR LOG
  if (action === 'error-log' && req.method === 'POST') {
    const { message, stack, context } = req.body;
    await queryRun('INSERT INTO error_logs (user_id, error_message, stack_trace, context) VALUES ($1,$2,$3,$4)', [userId, message, stack, JSON.stringify(context)]);
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Rota não encontrada' });
});
