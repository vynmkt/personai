import React, { useState, useEffect } from 'react';
import { Save, User, Ruler, Weight, Target, Clock, Moon, Utensils, DollarSign, Activity, TrendingUp, Calendar, Award, Camera, AlertCircle, Sun, Globe, Loader2 } from 'lucide-react';
import { Profile as ProfileType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface ProfileProps {
  profile: ProfileType;
  onSave: (data: ProfileType) => void;
  user: any;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
}

export default function Profile({ profile, onSave, user, onToggleTheme, onToggleLanguage }: ProfileProps) {
  const [formData, setFormData] = useState<ProfileType>(profile);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [consistency, setConsistency] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<any[]>([]);

  const isEn = user.language === 'en';

  const t = {
    title: isEn ? 'MY PROGRESS' : 'MEU PROGRESSO',
    subtitle: isEn ? 'Track your physical evolution and consistency.' : 'Acompanhe sua evolução física e consistência.',
    score: isEn ? 'Physical Score' : 'Score Físico',
    points: isEn ? 'Points' : 'Pontos',
    evolution: isEn ? 'Weight Evolution' : 'Evolução de Peso',
    last30: isEn ? 'LAST 30 DAYS' : 'ÚLTIMOS 30 DIAS',
    consistency: isEn ? 'Daily Consistency' : 'Consistência Diária',
    dietGoal: isEn ? 'Diet Goal' : 'Meta de Dieta',
    consistencyDesc: isEn ? 'You followed the plan in {n}% of the last 30 days. Elite athletes stay above 90%.' : 'Você seguiu o plano em {n}% dos últimos 30 dias. Atletas de elite mantêm acima de 90%.',
    achievements: isEn ? 'Achievements' : 'Conquistas',
    visual: isEn ? 'Visual Evolution' : 'Evolução Visual',
    compare: isEn ? 'COMPARE PHOTOS' : 'COMPARAR FOTOS',
    editData: isEn ? 'Edit Data' : 'Editar Dados',
    update: isEn ? 'UPDATE DATA' : 'ATUALIZAR DADOS',
    settings: isEn ? 'Profile Settings' : 'Configurações do Perfil',
    save: isEn ? 'SAVE CHANGES' : 'SALVAR ALTERAÇÕES',
    mandatory: isEn ? 'Please fill all mandatory fields.' : 'Por favor, preencha todos os campos obrigatórios.',
    gender: isEn ? 'Gender' : 'Sexo',
    activity: isEn ? 'Activity Level' : 'Nível de Atividade',
    personality: isEn ? 'AI Personality' : 'Personalidade da IA',
    theme: isEn ? 'Theme' : 'Tema',
    language: isEn ? 'Language' : 'Idioma',
    male: isEn ? 'Male' : 'Masculino',
    female: isEn ? 'Female' : 'Feminino',
    other: isEn ? 'Other' : 'Outro',
    sedentary: isEn ? 'Sedentary' : 'Sedentário',
    light: isEn ? 'Light' : 'Leve',
    moderate: isEn ? 'Moderate' : 'Moderado',
    active: isEn ? 'Active' : 'Ativo',
    very_active: isEn ? 'Very Active' : 'Muito Ativo',
    motivational: isEn ? 'Motivational' : 'Motivacional',
    raiz: isEn ? 'Raiz (Hardcore)' : 'Raiz (Sem Filtro)',
    age: isEn ? 'Age' : 'Idade',
    height: isEn ? 'Height (cm)' : 'Altura (cm)',
    weight: isEn ? 'Weight (kg)' : 'Peso (kg)',
    fat: isEn ? '% Fat (Estimated by AI)' : '% Gordura (Estimado pela IA)',
    objective: isEn ? 'Objective' : 'Objetivo',
    sleep: isEn ? 'Sleep' : 'Sono',
    finance: isEn ? 'Financial Condition' : 'Condição Financeira'
  };

  useEffect(() => {
    fetchWeightHistory();
    fetchConsistency();
    fetchShapeHistory();
  }, []);

  const fetchShapeHistory = async () => {
    try {
      const res = await fetch('/api/shape/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const fetchWeightHistory = async () => {
    try {
      const res = await fetch('/api/weight/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWeightHistory(data.map((h: any) => ({
          date: new Date(h.timestamp).toLocaleDateString(),
          weight: h.weight
        })));
      }
    } catch (e) { console.error(e); }
  };

  const fetchConsistency = async () => {
    try {
      const res = await fetch('/api/stats/consistency', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConsistency(data.percentage);
      }
    } catch (e) { console.error(e); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mandatory = ['age', 'height', 'weight', 'gender', 'activity_level', 'personality_mode'];
    const missing = mandatory.filter(f => {
      const val = formData[f as keyof ProfileType];
      return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
      setError(t.mandatory);
      return;
    }

    const dataToSave = {
      ...formData,
      age: parseInt(formData.age.toString()) || 0,
      height: parseFloat(formData.height.toString()) || 0,
      weight: parseFloat(formData.weight.toString()) || 0,
      fat_percentage: parseFloat(formData.fat_percentage.toString()) || 0
    };

    onSave(dataToSave);
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
    
    // Log weight update if weight changed
    if (dataToSave.weight !== profile.weight) {
      fetch('/api/weight', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ weight: dataToSave.weight })
      }).then(() => fetchWeightHistory());
    }
  };

  const physicalScore = Math.min(Math.round((consistency * 0.4) + (formData.fat_percentage < 15 ? 40 : 20) + (formData.training_time ? 20 : 0)), 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">{t.title}</h2>
          <p className="text-white/60">{t.subtitle}</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="glass-card px-6 py-3 text-center flex-1 md:flex-none">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{t.score}</p>
            <p className="text-2xl font-display font-bold text-brand-red">{physicalScore}</p>
          </div>
          <div className="glass-card px-6 py-3 text-center flex-1 md:flex-none">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{t.points}</p>
            <p className="text-2xl font-display font-bold text-white">{(user as any).points || 0}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Consistency & Weight Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp size={24} className="text-brand-red" />
                {t.evolution}
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-brand-red/10 text-brand-red text-[10px] font-bold rounded-full border border-brand-red/20">{t.last30}</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#ff0000' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#ff0000" strokeWidth={3} dot={{ fill: '#ff0000', r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-brand-red" />
                {t.consistency}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-white/40">{t.dietGoal}</span>
                  <span className="text-brand-red">{consistency}%</span>
                </div>
                <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${consistency}%` }}
                    className="h-full bg-brand-red shadow-lg shadow-brand-red/20"
                  />
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  {t.consistencyDesc.replace('{n}', consistency.toString())}
                </p>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award size={20} className="text-brand-red" />
                {t.achievements}
              </h3>
              <div className="flex flex-wrap gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${consistency >= 70 ? 'bg-brand-red/20 border-brand-red text-brand-red' : 'bg-white/5 border-white/10 text-white/10'}`} title="7 Dias de Fogo">
                  <TrendingUp size={24} />
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${consistency >= 90 ? 'bg-brand-red/20 border-brand-red text-brand-red' : 'bg-white/5 border-white/10 text-white/10'}`} title="Mestre da Dieta">
                  <Utensils size={24} />
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${weightHistory.length >= 5 ? 'bg-brand-red/20 border-brand-red text-brand-red' : 'bg-white/5 border-white/10 text-white/10'}`} title="Consistência de Peso">
                  <Weight size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Camera size={20} className="text-brand-red" />
              {t.visual}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
                  {history.length > 0 ? (
                    <img src={history[history.length - 1].image_data} alt="Before" className="w-full h-full object-cover grayscale opacity-50" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[10px] text-white/20 text-center p-4">Sem fotos antigas</div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-[8px] font-bold rounded">INÍCIO</span>
                </div>
                <p className="text-[10px] text-center text-white/40 font-bold uppercase">Início</p>
              </div>
              <div className="space-y-2">
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-brand-red/30 flex items-center justify-center overflow-hidden relative">
                  {history.length > 0 ? (
                    <img src={history[0].image_data} alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[10px] text-white/20 text-center p-4">Sem fotos atuais</div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-brand-red text-[8px] font-bold rounded">HOJE</span>
                </div>
                <p className="text-[10px] text-center text-brand-red font-bold uppercase">Atual</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">{t.editData}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-white/40">{t.weight}</label>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="input-field w-full py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-white/40">{t.fat}</label>
                  <input type="number" name="fat_percentage" value={formData.fat_percentage} onChange={handleChange} className="input-field w-full py-2 text-sm" readOnly />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-2 text-xs">{t.update}</button>
            </form>
          </div>
        </div>
      </div>

      {/* Profile Form Section */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <User size={24} className="text-brand-red" />
          {t.settings}
        </h3>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.age} *</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="input-field w-full" required />
              <p className="text-[10px] text-white/20">Sua idade em anos</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.height} *</label>
              <input type="number" name="height" value={formData.height} onChange={handleChange} className="input-field w-full" required />
              <p className="text-[10px] text-white/20">Sua altura em centímetros (ex: 175)</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.gender} *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input-field w-full appearance-none" required>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
                <option value="other">{t.other}</option>
              </select>
              <p className="text-[10px] text-white/20">Seu sexo biológico</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.activity} *</label>
              <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="input-field w-full appearance-none" required>
                <option value="sedentary">{t.sedentary}</option>
                <option value="light">{t.light}</option>
                <option value="moderate">{t.moderate}</option>
                <option value="active">{t.active}</option>
                <option value="very_active">{t.very_active}</option>
              </select>
              <p className="text-[10px] text-white/20">Quanto você se move no dia a dia</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.personality} *</label>
              <select name="personality_mode" value={formData.personality_mode} onChange={handleChange} className="input-field w-full appearance-none" required>
                <option value="motivational">{t.motivational}</option>
                <option value="raiz">{t.raiz}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.objective}</label>
              <input 
                type="text" 
                name="objective" 
                value={formData.objective} 
                onChange={handleChange} 
                className="input-field w-full" 
                placeholder={isEn ? "Ex: Hypertrophy" : "Ex: Hipertrofia"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.sleep}</label>
              <input type="text" name="sleep" value={formData.sleep} onChange={handleChange} className="input-field w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.finance}</label>
              <select name="financial_condition" value={formData.financial_condition} onChange={handleChange} className="input-field w-full appearance-none">
                <option value="Limitada">Limitada</option>
                <option value="Moderada">Moderada</option>
                <option value="Alta">Alta</option>
              </select>
            </div>

            <div className="space-y-4 col-span-full">
              <label className="text-xs font-bold uppercase text-white/40">{isEn ? 'Rest Days' : 'Dias de Descanso'}</label>
              <div className="flex flex-wrap gap-2">
                {['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'].map(day => {
                  const restDays = JSON.parse(formData.rest_days || '[]');
                  const isRest = restDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newRest = isRest 
                          ? restDays.filter((d: string) => d !== day)
                          : [...restDays, day];
                        setFormData(prev => ({ ...prev, rest_days: JSON.stringify(newRest) }));
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${isRest ? 'bg-brand-red border-brand-red text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/20 italic">{isEn ? 'The AI will respect these days when generating your next plan.' : 'A IA respeitará estes dias ao gerar seu próximo plano.'}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase text-white/40">{t.theme}</h4>
              <button 
                type="button"
                onClick={onToggleTheme}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all w-full md:w-auto"
              >
                {user.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span className="font-bold uppercase text-xs tracking-widest">{user.theme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}</span>
              </button>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase text-white/40">{t.language}</h4>
              <button 
                type="button"
                onClick={onToggleLanguage}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all w-full md:w-auto"
              >
                <Globe size={20} />
                <span className="font-bold uppercase text-xs tracking-widest">{user.language === 'pt' ? 'PORTUGUÊS (BR)' : 'ENGLISH (US)'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button type="submit" className="btn-primary px-12 py-4 flex items-center gap-2">
              {loading && <Loader2 className="animate-spin" size={20} />}
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
