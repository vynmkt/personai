import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, TrendingUp, Activity, Target, ChevronRight, Crown, Loader2, Scale, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { User, Profile } from '../types';

interface DashboardProps {
  user: User;
  profile: Profile;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ user, profile, setActiveTab }: DashboardProps) {
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [isAddingWeight, setIsAddingWeight] = useState(false);

  const isEn = user.language === 'en';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [weightRes, leaderRes] = await Promise.all([
        fetch('/api/weight/history', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (weightRes.ok && leaderRes.ok) {
        setWeightHistory(await weightRes.json());
        setLeaderboard(await leaderRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ weight: parseFloat(newWeight) })
      });
      if (res.ok) {
        setNewWeight('');
        setIsAddingWeight(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sleepHours = parseFloat(profile.sleep) || 7;
  const recoveryScore = Math.min(100, Math.round((sleepHours / 8) * 100));

  const mindsetQuotes = [
    "A dor é temporária, o orgulho é para sempre.",
    "Seu único limite é você mesmo.",
    "O que não te desafia, não te transforma.",
    "Trabalhe em silêncio, deixe o sucesso ser seu barulho.",
    "Disciplina é fazer o que precisa ser feito, mesmo quando você não quer.",
    "Não pare quando estiver cansado, pare quando tiver terminado."
  ];
  const dailyQuote = mindsetQuotes[new Date().getDate() % mindsetQuotes.length];

  const chartData = weightHistory.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { day: '2-digit', month: '2-digit' }),
    weight: item.weight
  }));

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-red" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 flex items-center gap-4 border-l-4 border-brand-red"
        >
          <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center text-brand-red">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{isEn ? 'Streak' : 'Fogo'}</p>
            <p className="text-2xl font-display font-bold">{user.streak} {isEn ? 'Days' : 'Dias'}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 flex items-center gap-4 border-l-4 border-yellow-500"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{isEn ? 'Points' : 'Pontos'}</p>
            <p className="text-2xl font-display font-bold">{user.points}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex items-center gap-4 border-l-4 border-emerald-500"
        >
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{isEn ? 'Recovery' : 'Recuperação'}</p>
            <p className="text-2xl font-display font-bold">{recoveryScore}%</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 flex items-center gap-4 border-l-4 border-blue-500"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <Crown size={24} />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{isEn ? 'Rank' : 'Nível'}</p>
            <p className="text-2xl font-display font-bold">{user.level}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weight Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp size={20} className="text-brand-red" />
                  {isEn ? 'Weight Progression' : 'Evolução de Peso'}
                </h3>
                <p className="text-xs text-white/40">{isEn ? 'Track your physical transformation' : 'Acompanhe sua transformação física'}</p>
              </div>
              <button 
                onClick={() => setIsAddingWeight(true)}
                className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
              >
                <Scale size={16} />
                {isEn ? 'Log Weight' : 'Registrar Peso'}
              </button>
            </div>

            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff0000" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff0000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#ffffff40" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#ffffff40" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#ff0000' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#ff0000" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorWeight)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <Scale size={48} className="mb-4 opacity-10" />
                  <p>{isEn ? 'No weight logs yet' : 'Nenhum registro de peso ainda'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Next Mission */}
          <div className="glass-card p-8 bg-gradient-to-r from-brand-red/10 to-transparent border-brand-red/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center shadow-lg shadow-brand-red/20">
                  <Target size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{isEn ? 'Next Mission' : 'Próxima Missão'}</h3>
                  <p className="text-white/60">{isEn ? 'Complete your daily challenge to keep the streak!' : 'Complete seu desafio diário para manter o fogo!'}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('challenge')}
                className="btn-primary px-8 flex items-center gap-2"
              >
                {isEn ? 'Go to Challenge' : 'Ir para o Desafio'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" />
              {isEn ? 'Leaderboard' : 'Ranking de Lendas'}
            </h3>
            <div className="space-y-4">
              {leaderboard.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-600 text-black' : 'bg-white/10 text-white/40'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{item.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-red">{item.points} pts</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Flame size={10} className="text-brand-red" />
                      <span className="text-[10px] text-white/40">{item.streak}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 bg-brand-red/5 border-brand-red/20">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Brain size={18} className="text-brand-red" />
              {isEn ? 'Mindset: Daily Quote' : 'Mindset: Frase do Dia'}
            </h3>
            <p className="text-xs text-white/60 italic leading-relaxed">
              "{isEn ? 'The only bad workout is the one that didn\'t happen.' : dailyQuote}"
            </p>
          </div>
        </div>
      </div>

      {/* Add Weight Modal */}
      {isAddingWeight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 w-full max-w-sm"
          >
            <h3 className="text-xl font-bold mb-6">{isEn ? 'Log New Weight' : 'Registrar Novo Peso'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-white/40 mb-2 block">{isEn ? 'Weight (kg)' : 'Peso (kg)'}</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="input-field w-full text-center text-2xl"
                  placeholder="00.0"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsAddingWeight(false)}
                  className="flex-1 btn-secondary"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button 
                  onClick={handleAddWeight}
                  className="flex-1 btn-primary"
                >
                  {isEn ? 'Save' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
