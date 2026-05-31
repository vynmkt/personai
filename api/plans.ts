// api/plans.ts
import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthRequest } from './_auth';
import { queryOne, queryRun } from './_db';

export default withAuth(async (req: AuthRequest, res: VercelResponse) => {
  const userId = req.user!.id;

  if (req.method === 'GET') {
    const plans = await queryOne('SELECT * FROM plans WHERE user_id = $1', [userId]);
    return res.json(plans || {
      training_plan: null, nutrition_plan: null, last_analysis: null,
      target_calories: null, target_protein: null, target_carbs: null,
      target_fat: null, training_schedule: null, nutrition_schedule: null
    });
  }

  if (req.method === 'POST') {
    const {
      training_plan, nutrition_plan, last_analysis,
      target_calories, target_protein, target_carbs, target_fat,
      training_schedule, nutrition_schedule
    } = req.body;

    const ts = typeof training_schedule === 'string' ? training_schedule : JSON.stringify(training_schedule);
    const ns = typeof nutrition_schedule === 'string' ? nutrition_schedule : JSON.stringify(nutrition_schedule);

    await queryRun(`
      INSERT INTO plans (user_id, training_plan, nutrition_plan, last_analysis,
        target_calories, target_protein, target_carbs, target_fat, training_schedule, nutrition_schedule)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (user_id) DO UPDATE SET
        training_plan=$2, nutrition_plan=$3, last_analysis=$4,
        target_calories=$5, target_protein=$6, target_carbs=$7,
        target_fat=$8, training_schedule=$9, nutrition_schedule=$10
    `, [userId, training_plan, nutrition_plan, last_analysis,
        target_calories, target_protein, target_carbs, target_fat, ts, ns]);

    return res.json({ success: true });
  }

  res.status(405).end();
});
