import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Zap, Info, Video, Camera, Send, Loader2, AlertCircle, CheckCircle2, BrainCircuit, History, ChevronRight, ChevronLeft, Scale, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';



interface TrainingProps {
  plan: string | null;
  schedule: string | null;
  user: any;
}

export default function Training({ plan, schedule, user }: TrainingProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'analysis' | 'schedule'>('schedule');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('segunda');
  const [loads, setLoads] = useState<any[]>([]);
  const [isLoggingLoad, setIsLoggingLoad] = useState<{ exercise: string, open: boolean }>({ exercise: '', open: false });
  const [newLoad, setNewLoad] = useState({ weight: '', reps: '', sets: '' });

  const isEn = user.language === 'en';

  const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  const parsedSchedule = schedule ? JSON.parse(schedule) : null;

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const res = await fetch('/api/training/loads', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setLoads(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleLogLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoad.weight) return;

    try {
      const res = await fetch('/api/training/load', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          exercise_name: isLoggingLoad.exercise,
          weight: parseFloat(newLoad.weight),
          reps: parseInt(newLoad.reps) || 0,
          sets: parseInt(newLoad.sets) || 0
        })
      });

      if (res.ok) {
        setIsLoggingLoad({ exercise: '', open: false });
        setNewLoad({ weight: '', reps: '', sets: '' });
        fetchLoads();
      }
    } catch (e) { console.error(e); }
  };

  const t = {
    title: isEn ? 'TRAINING' : 'TREINO',
    subtitle: isEn ? 'Your war strategy for maximum hypertrophy.' : 'Sua estratégia de guerra para máxima hipertrofia.',
    noPlan: isEn ? 'No Training Generated' : 'Nenhum Treino Gerado',
    noPlanDesc: isEn ? 'Go to the AI Coach tab and request an analysis to generate your personalized training plan.' : 'Vá até a aba IA Coach e solicite uma análise para gerar seu plano de treino personalizado.',
    consistency: isEn ? 'Consistency' : 'Consistência',
    consistencyDesc: isEn ? 'The plan only works if you show up every day. No excuses.' : 'O plano só funciona se você aparecer todos os dias. Sem desculpas.',
    intensity: isEn ? 'Intensity' : 'Intensidade',
    intensityDesc: isEn ? 'Don\'t count reps, make every rep count. Go to failure.' : 'Não conte repetições, faça cada repetição contar. Vá até a falha.',
    execution: isEn ? 'Execution' : 'Execução',
    executionDesc: isEn ? 'Technique precedes load. In Premium, AI corrects your execution via video.' : 'A técnica precede a carga. No Premium, a IA corrige sua execução por vídeo.',
    schedule: isEn ? 'Weekly Schedule' : 'Calendário Semanal',
    logLoad: isEn ? 'Log Load' : 'Registrar Carga',
    lastLoad: isEn ? 'Last Load' : 'Última Carga'
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">PLANO DE <span className="text-brand-red">{t.title}</span> <span className="text-white/20">ELITE</span></h2>
          <p className="text-white/60">{t.subtitle}</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'schedule' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
          >
            {t.schedule}
          </button>
          <button 
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'plan' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
          >
            {isEn ? 'Full Plan' : 'Plano Completo'}
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'analysis' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
          >
            {isEn ? 'Exercise Analysis' : 'Análise de Execução'}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'schedule' ? (
          <motion.div 
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {parsedSchedule ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Day Selection */}
                <div className="lg:col-span-1 space-y-2">
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${selectedDay === day ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                    >
                      <span className="font-bold uppercase text-xs tracking-widest">{day}</span>
                      <span className="text-[10px] opacity-60">{parsedSchedule[day]?.muscle_group}</span>
                    </button>
                  ))}
                </div>

                {/* Exercises for Selected Day */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-display font-bold uppercase tracking-tight">
                          {selectedDay} <span className="text-brand-red">| {parsedSchedule[selectedDay]?.muscle_group}</span>
                        </h3>
                        <p className="text-xs text-white/40">{isEn ? 'Follow the sequence for best results' : 'Siga a sequência para melhores resultados'}</p>
                      </div>
                      <Dumbbell className="text-brand-red opacity-20" size={40} />
                    </div>

                    <div className="space-y-4">
                      {parsedSchedule[selectedDay]?.exercises.length > 0 ? (
                        parsedSchedule[selectedDay].exercises.map((ex: any, idx: number) => {
                          const lastLoad = loads.find(l => l.exercise_name === ex.name);
                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 
                                      className={`font-bold ${ex.gif_url ? 'cursor-pointer hover:text-brand-red transition-colors' : ''}`}
                                      onClick={() => ex.gif_url && window.open(ex.gif_url, '_blank')}
                                    >
                                      {ex.name}
                                    </h4>
                                    {ex.gif_url && (
                                      <button 
                                        onClick={() => window.open(ex.gif_url, '_blank')}
                                        className="p-1 text-brand-red hover:bg-brand-red/10 rounded transition-colors"
                                        title={isEn ? 'View Execution' : 'Ver Execução'}
                                      >
                                        <Video size={14} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                                    {ex.sets} SETS × {ex.reps} REPS | {ex.rest} REST
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {lastLoad && (
                                  <div className="text-right">
                                    <p className="text-[8px] text-white/40 uppercase font-bold">{t.lastLoad}</p>
                                    <p className="text-xs font-bold text-brand-red">{lastLoad.weight}kg</p>
                                  </div>
                                )}
                                <button 
                                  onClick={() => setIsLoggingLoad({ exercise: ex.name, open: true })}
                                  className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                  title={t.logLoad}
                                >
                                  <Scale size={18} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="py-20 text-center text-white/20">
                          <History size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="font-bold uppercase tracking-widest">{isEn ? 'REST DAY' : 'DIA DE DESCANSO'}</p>
                          <p className="text-xs">{isEn ? 'Enjoy your recovery, legend.' : 'Aproveite sua recuperação, lenda.'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Dumbbell size={40} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t.noPlan}</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  {t.noPlanDesc}
                </p>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'plan' ? (
          <motion.div 
            key="plan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {plan ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 border-t-4 border-brand-red"
              >
                <div className="prose prose-invert max-w-none markdown-body training-plan-content">
                  <Markdown>{plan}</Markdown>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Dumbbell size={40} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t.noPlan}</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  {t.noPlanDesc}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-brand-red bg-gradient-to-br from-brand-red/5 to-transparent">
                <Calendar size={24} className="text-brand-red mb-4" />
                <h4 className="font-bold mb-2">{t.consistency}</h4>
                <p className="text-sm text-white/60">{t.consistencyDesc}</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-brand-red bg-gradient-to-br from-brand-red/5 to-transparent">
                <Zap size={24} className="text-brand-red mb-4" />
                <h4 className="font-bold mb-2">{t.intensity}</h4>
                <p className="text-sm text-white/60">{t.intensityDesc}</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-brand-red bg-gradient-to-br from-brand-red/5 to-transparent">
                <Info size={24} className="text-brand-red mb-4" />
                <h4 className="font-bold mb-2">{t.execution}</h4>
                <p className="text-sm text-white/60">{t.executionDesc}</p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Video size={20} className="text-brand-red" />
                  {isEn ? 'Video Analysis' : 'Análise de Vídeo'}
                </h3>
                
                <div className="aspect-video bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                  {videoPreview ? (
                    <video src={videoPreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="text-center p-6">
                      <Video size={40} className="text-white/20 mx-auto mb-4" />
                      <p className="text-sm text-white/40">{isEn ? 'Upload video (max 2 min)' : 'Envie um vídeo (máx 2 min)'}</p>
                    </div>
                  )}
                  {!videoPreview && (
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVideoFile(file);
                          setVideoPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  )}
                </div>

                {videoPreview && (
                  <button 
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                      setAnalysis(null);
                    }}
                    className="w-full mt-4 text-xs font-bold text-white/40 hover:text-brand-red uppercase tracking-widest transition-colors"
                  >
                    {isEn ? 'Remove Video' : 'Remover Vídeo'}
                  </button>
                )}

                {!user.is_premium && (
                  <div className="mt-4 p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg flex gap-3">
                    <AlertCircle size={18} className="text-brand-red flex-shrink-0" />
                    <p className="text-[10px] text-brand-red font-bold uppercase tracking-wider">
                      {isEn ? 'PREMIUM: Video analysis locked.' : 'PREMIUM: Análise de vídeo bloqueada.'}
                    </p>
                  </div>
                )}

                <button
                  onClick={async () => {
                    setError(isEn 
                      ? "Video analysis will be available soon in the premium plan." 
                      : "Análise de vídeo estará disponível em breve no plano premium.");
                  }}
                  disabled={loading || !videoFile || !user.is_premium}
                  className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {processing ? (isEn ? 'PROCESSING VIDEO...' : 'PROCESSANDO VÍDEO...') : (isEn ? 'ANALYZING...' : 'ANALISANDO...')}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {isEn ? 'ANALYZE EXECUTION' : 'ANALISAR EXECUÇÃO'}
                    </>
                  )}
                </button>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info size={20} className="text-brand-red" />
                  {isEn ? 'Analysis Tips' : 'Dicas de Análise'}
                </h3>
                <ul className="space-y-3 text-sm text-white/60">
                  <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                    {isEn ? 'Record from a side or 45-degree angle.' : 'Grave de lado ou em um ângulo de 45 graus.'}
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                    {isEn ? 'Ensure good lighting and visibility.' : 'Garanta boa iluminação e visibilidade.'}
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                    {isEn ? 'Videos must be under 1 minute.' : 'Vídeos devem ter menos de 1 minuto.'}
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="glass-card min-h-[500px] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BrainCircuit size={120} />
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                {analysis ? (
                  <div className="prose prose-invert max-w-none markdown-body">
                    <Markdown>{analysis}</Markdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <BrainCircuit size={40} className="text-white/20" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">{isEn ? 'Waiting for Video' : 'Aguardando Vídeo'}</h4>
                    <p className="text-white/40 max-w-md">
                      {isEn ? 'Upload a video of your exercise execution to receive technical feedback from our AI.' : 'Envie um vídeo da sua execução para receber feedback técnico da nossa IA.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Load Modal */}
      <AnimatePresence>
        {isLoggingLoad.open && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-sm p-8"
            >
              <h3 className="text-xl font-bold mb-2">{t.logLoad}</h3>
              <p className="text-xs text-white/40 mb-6 uppercase tracking-widest">{isLoggingLoad.exercise}</p>
              
              <form onSubmit={handleLogLoad} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-white/40">{isEn ? 'Weight' : 'Peso'} (kg)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={newLoad.weight}
                      onChange={(e) => setNewLoad(prev => ({ ...prev, weight: e.target.value }))}
                      className="input-field w-full text-center"
                      placeholder="0.0"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-white/40">{isEn ? 'Reps' : 'Reps'}</label>
                    <input 
                      type="number" 
                      value={newLoad.reps}
                      onChange={(e) => setNewLoad(prev => ({ ...prev, reps: e.target.value }))}
                      className="input-field w-full text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-white/40">{isEn ? 'Sets' : 'Séries'}</label>
                    <input 
                      type="number" 
                      value={newLoad.sets}
                      onChange={(e) => setNewLoad(prev => ({ ...prev, sets: e.target.value }))}
                      className="input-field w-full text-center"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsLoggingLoad({ exercise: '', open: false })}
                    className="flex-1 btn-secondary"
                  >
                    {isEn ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {isEn ? 'Save' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
