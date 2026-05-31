-- PersonAI — Supabase Schema
-- Execute este arquivo no SQL Editor do Supabase (https://app.supabase.com → SQL Editor)

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  is_premium INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  points INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'pt',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de erro
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  error_message TEXT,
  stack_trace TEXT,
  context TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Refeições
CREATE TABLE IF NOT EXISTS meals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  name TEXT,
  calories REAL,
  protein REAL,
  carbs REAL,
  fat REAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de peso
CREATE TABLE IF NOT EXISTS weight_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  weight REAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Desafios
CREATE TABLE IF NOT EXISTS challenges (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active'
);

-- Missões diárias
CREATE TABLE IF NOT EXISTS daily_missions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  date DATE DEFAULT CURRENT_DATE,
  protein_met INTEGER DEFAULT 0,
  training_done INTEGER DEFAULT 0,
  cardio_done INTEGER DEFAULT 0
);

-- Conquistas
CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  type TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de uso de IA
CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  type TEXT,
  tokens INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de água
CREATE TABLE IF NOT EXISTS water_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  amount REAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de shape (fotos/análises)
CREATE TABLE IF NOT EXISTS shape_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  image_data TEXT,
  analysis TEXT,
  fat_percentage REAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO system_settings (key, value) VALUES
  ('free_daily_limit', '1'),
  ('premium_daily_limit', '20'),
  ('token_price_per_1k', '0.01')
ON CONFLICT (key) DO NOTHING;

-- Perfis
CREATE TABLE IF NOT EXISTS profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id),
  age INTEGER,
  height REAL,
  weight REAL,
  fat_percentage REAL DEFAULT 0,
  gender TEXT DEFAULT 'male',
  activity_level TEXT DEFAULT 'moderate',
  personality_mode TEXT DEFAULT 'motivational',
  training_time TEXT DEFAULT '60',
  routine TEXT DEFAULT '',
  sleep TEXT DEFAULT '7',
  current_diet TEXT DEFAULT '',
  financial_condition TEXT DEFAULT 'medium',
  objective TEXT,
  rest_days TEXT DEFAULT '[]',
  streak INTEGER DEFAULT 0,
  last_mission_date TEXT,
  level TEXT DEFAULT 'beginner',
  days_per_week INTEGER DEFAULT 3,
  limitation TEXT DEFAULT ''
);

-- Registro de carga de treino
CREATE TABLE IF NOT EXISTS load_tracking (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  exercise_name TEXT,
  weight REAL,
  reps INTEGER,
  sets INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Planos de treino e nutrição
CREATE TABLE IF NOT EXISTS plans (
  user_id BIGINT PRIMARY KEY REFERENCES users(id),
  training_plan TEXT,
  nutrition_plan TEXT,
  last_analysis TEXT,
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fat INTEGER,
  training_schedule TEXT,
  nutrition_schedule TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_weight_user ON weight_history(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_user_date ON daily_missions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_shape_user ON shape_history(user_id);
