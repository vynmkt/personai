import React, { useState, useEffect } from 'react';
import { calculateBMR } from '../utils/fitness';
import { Camera, Video, Send, Loader2, AlertCircle, CheckCircle2, Info, BrainCircuit, History, TrendingUp, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { ShapeAnalysis } from '../types';


interface AICoachProps {
  user: any;
  profile: any;
  onUpdatePlans: (training: string, nutrition: string, analysis: string, targets?: any, schedule?: any, nutrition_schedule?: any) => void;
  onUpdateProfile: (data: any) => void;
}

export default function AICoach({ user, profile, onUpdatePlans, onUpdateProfile }: AICoachProps) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'evolution'>('analysis');
  const [history, setHistory] = useState<ShapeAnalysis[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<ShapeAnalysis | null>(null);

  const deleteHistoryItem = async (id: number) => {
    try {
      const res = await fetch(`/api/shape/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isEn = user.language === 'en';

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'evolution') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/shape/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setHistory(await res.json());
    } catch (e) { console.error(e); }
  };

  const t = {
    title: isEn ? 'AI COACH' : 'IA COACH',
    subtitle: isEn ? 'Your elite team is ready to analyze your progress.' : 'Sua equipe de elite está pronta para analisar seu progresso.',
    visual: isEn ? 'Shape Analysis' : 'Análise de Shape',
    evolution: isEn ? 'Evolution' : 'Evolução',
    drag: isEn ? 'Drag or click to send shape photo' : 'Arraste ou clique para enviar foto do shape',
    changeFile: isEn ? 'Change Photo' : 'Trocar Foto',
    premiumAlert: isEn ? 'PREMIUM: Photo analysis locked.' : 'PREMIUM: Análise de fotos bloqueada.',
    analyzing: isEn ? 'ANALYZING...' : 'ANALISANDO...',
    request: isEn ? 'REQUEST ANALYSIS' : 'SOLICITAR ANÁLISE',
    roast: isEn ? 'ROAST MY SHAPE (VIRAL)' : 'ZOE MEU SHAPE (VIRAL)',
    tips: isEn ? 'Coach Tips' : 'Dicas do Coach',
    tip1: isEn ? 'Send photos on an empty stomach for better fat analysis.' : 'Envie fotos em jejum para melhor análise de gordura.',
    tip2: isEn ? 'Use consistent lighting and poses for evolution tracking.' : 'Use iluminação e poses consistentes para acompanhar a evolução.',
    tip3: isEn ? 'Be honest in profile data for real results.' : 'Seja honesto nos dados do perfil para resultados reais.',
    waiting: isEn ? 'Waiting for Data' : 'Aguardando Dados',
    waitingDesc: isEn ? 'Fill your profile and click "Request Analysis" to receive your elite planning.' : 'Preencha seu perfil e clique em "Solicitar Análise" para receber seu planejamento de elite.',
    errorAnalysis: isEn ? 'Error processing analysis. Check your connection or try again.' : 'Erro ao processar análise. Verifique sua conexão ou tente novamente.',
    premiumRequired: isEn ? 'Image upload available only in the PREMIUM plan.' : 'Envio de imagens disponível apenas no plano PREMIUM.',
    missingFields: isEn ? 'Please fill the mandatory fields in your profile: ' : 'Por favor, preencha os campos obrigatórios no seu perfil: '
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isVideo = selectedFile.type.startsWith('video/');
      const isImage = selectedFile.type.startsWith('image/');
      
      if (!user.is_premium) {
        if (isVideo) {
          setError(isEn ? "Video analysis is a PREMIUM feature." : "Análise de vídeo é um recurso PREMIUM.");
          return;
        }
        if (isImage && history.length >= 1) {
          setError(isEn ? "Free plan allows only 1 photo analysis. Upgrade to PREMIUM for unlimited access." : "O plano gratuito permite apenas 1 análise por foto. Assine o PREMIUM para acesso ilimitado.");
          return;
        }
      }
      
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const runAnalysis = async () => {
    if (file && file.size > 200 * 1024 * 1024) {
      setError(isEn ? "File too large. Max 200MB for video/image." : "Arquivo muito grande. Máximo 200MB para vídeo/imagem.");
      return;
    }

    if (!user.is_premium) {
      const isVideo = file?.type.startsWith('video/');
      const isImage = file?.type.startsWith('image/');
      
      if (isVideo) {
        setError(isEn ? "Video analysis is a PREMIUM feature." : "Análise de vídeo é um recurso PREMIUM.");
        return;
      }
      if (isImage && history.length >= 1) {
        setError(isEn ? "Free plan allows only 1 photo analysis. Upgrade to PREMIUM for unlimited access." : "O plano gratuito permite apenas 1 análise por foto. Assine o PREMIUM para acesso ilimitado.");
        return;
      }
    }

    const mandatoryFields = ['age', 'height', 'weight', 'activity_level', 'gender'];
    const missingFields = mandatoryFields.filter(f => {
      const val = profile[f];
      return val === undefined || val === null || val === '';
    });

    if (missingFields.length > 0) {
      setError(`${t.missingFields}${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setProcessing(true);
    setError(null);

    try {
      const tdee = calculateBMR(profile);
      const isRaiz = profile.personality_mode === 'raiz';
      const lang = user.language || 'pt';

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ profile, lang, isRaiz, tdee })
      });

      setProcessing(false);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro na análise');
      }

      const result = await res.json();

      if (result) {
        setAnalysis(result.analysis);

        if (result.fat_percentage_estimate) {
          await onUpdateProfile({ fat_percentage: result.fat_percentage_estimate });
        }

        await onUpdatePlans(result.training_plan, result.nutrition_plan, result.analysis, result.targets, result.training_schedule, result.nutrition_schedule);

        // Log usage
        fetch('/api/usage/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ type: 'analysis', tokens: 1000 })
        });
      }
    } catch (err: any) {
      console.error(err);
      const currentLang = user.language || 'pt';
      setError(currentLang === 'pt' ? "Erro ao processar análise. Verifique sua conexão ou tente novamente." : "Error processing analysis. Check your connection or try again.");
      
      // Log error to backend
      fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ message: err.message, stack: err.stack, context: { profile, file: !!file } })
      });
    } finally {
      setLoading(false);
    }
  };

  const compareEvolution = async () => {
    if (history.length < 2) return;
    setLoading(true);
    try {
      const latest = history[0];
      const previous = history[1];

      const res = await fetch('/api/ai/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ latest, previous })
      });

      if (!res.ok) throw new Error('Erro na comparação');
      const result = await res.json();
      setAnalysis(result);
      setActiveTab('analysis');
    } catch (e) {
      console.error(e);
      setError("Erro ao comparar evolução.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">{t.title}</h2>
          <p className="text-white/60">{t.subtitle}</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'analysis' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
          >
            {t.visual}
          </button>
          <button 
            onClick={() => setActiveTab('evolution')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'evolution' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
          >
            {t.evolution}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {activeTab === 'analysis' ? (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera size={20} className="text-brand-red" />
                {t.visual}
              </h3>
              
              <div className="aspect-square bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                {preview ? (
                  file?.type.startsWith('video/') ? (
                    <video src={preview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="text-center p-6">
                    <Camera size={40} className="text-white/20 mx-auto mb-4" />
                    <p className="text-sm text-white/40">{t.drag}</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {preview && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-sm font-bold">{t.changeFile}</p>
                  </div>
                )}
              </div>

              {!user.is_premium && (
                <div className="mt-4 p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg flex gap-3">
                  <AlertCircle size={18} className="text-brand-red flex-shrink-0" />
                  <p className="text-[10px] text-brand-red font-bold uppercase tracking-wider">
                    {t.premiumAlert}
                  </p>
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={loading}
                className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {processing ? (isEn ? 'Processing File...' : 'Processando Arquivo...') : t.analyzing}
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {t.request}
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-white/20 mt-2 uppercase tracking-widest font-bold">
                {isEn ? 'Tip: Good lighting helps the AI be more precise' : 'Dica: Boa iluminação ajuda a IA a ser mais precisa'}
              </p>

              <button
                onClick={async () => {
                  const mandatoryFields = ['age', 'height', 'weight', 'gender'];
                  const missingFields = mandatoryFields.filter(f => !profile[f]);
                  if (missingFields.length > 0) {
                    setError(`${t.missingFields}${missingFields.join(', ')}`);
                    return;
                  }

                  setLoading(true);
                  setError(null);
                  try {
                    const res = await fetch('/api/ai/roast', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ profile })
                    });
                    if (!res.ok) throw new Error('Erro no roast');
                    const data = await res.json();
                    setAnalysis(data.text);
                  } catch (e: any) { 
                    console.error(e);
                    setError(e.message);
                  }
                  finally { setLoading(false); }
                }}
                disabled={loading}
                className="w-full btn-secondary mt-3 flex items-center justify-center gap-2 border-brand-red/20 text-brand-red hover:bg-brand-red/5"
              >
                <AlertCircle size={20} />
                {t.roast}
              </button>
            </div>
          ) : (
            <div className="glass-card p-6 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History size={20} className="text-brand-red" />
                {t.evolution}
              </h3>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <p className="text-center text-white/20 py-10 text-sm">Nenhuma análise salva ainda.</p>
                ) : (
                  history.map((item) => (
                    <motion.div 
                      key={item.id}
                      onClick={() => setSelectedHistory(item)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedHistory?.id === item.id ? 'bg-brand-red/10 border-brand-red' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                    >
                      <img src={item.image_data} className="w-12 h-12 rounded-lg object-cover" alt="History" />
                      <div className="flex-1" onClick={() => setSelectedHistory(item)}>
                        <p className="text-xs font-bold">{new Date(item.timestamp).toLocaleDateString()}</p>
                        <p className="text-[10px] text-white/40 uppercase font-bold">{item.fat_percentage}% Gordura</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        className="p-2 text-white/20 hover:text-brand-red transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {history.length >= 2 && (
                <button 
                  onClick={compareEvolution}
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />}
                  COMPARAR EVOLUÇÃO
                </button>
              )}
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info size={20} className="text-brand-red" />
              {t.tips}
            </h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                {t.tip1}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                {t.tip2}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                {t.tip3}
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

            {selectedHistory && activeTab === 'evolution' ? (
              <div className="space-y-6">
                <button 
                  onClick={() => setSelectedHistory(null)}
                  className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest"
                >
                  <ChevronLeft size={16} /> Voltar para Análise Atual
                </button>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <img src={selectedHistory.image_data} className="w-full rounded-2xl shadow-2xl" alt="Selected" />
                    <div className="mt-4 p-4 glass-card text-center">
                      <p className="text-2xl font-bold text-brand-red">{selectedHistory.fat_percentage}%</p>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Gordura Estimada</p>
                    </div>
                  </div>
                  <div className="md:w-2/3 prose prose-invert max-w-none markdown-body">
                    <Markdown>{selectedHistory.analysis}</Markdown>
                  </div>
                </div>
              </div>
            ) : analysis ? (
              <div className="prose prose-invert max-w-none markdown-body">
                {typeof analysis === 'string' ? (
                  <Markdown>{analysis}</Markdown>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-brand-red/10 border border-brand-red/20 rounded-xl">
                      <h4 className="text-brand-red font-bold uppercase text-xs mb-2">Resumo</h4>
                      <p className="text-sm">{analysis.summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <h4 className="text-emerald-500 font-bold uppercase text-xs mb-2">Melhorias</h4>
                        <ul className="space-y-1">
                          {analysis.improvements?.map((item: string, i: number) => (
                            <li key={i} className="text-xs flex gap-2">
                              <span className="text-emerald-500">✓</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <h4 className="text-yellow-500 font-bold uppercase text-xs mb-2">Focar Agora</h4>
                        <ul className="space-y-1">
                          {analysis.to_improve?.map((item: string, i: number) => (
                            <li key={i} className="text-xs flex gap-2">
                              <span className="text-yellow-500">→</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <h4 className="text-white/40 font-bold uppercase text-xs mb-4">Detalhes Técnicos</h4>
                      <div className="prose prose-invert prose-xs">
                        <Markdown>{analysis.technical_details}</Markdown>
                      </div>
                    </div>

                    <div className="text-center py-4 border-t border-white/10">
                      <p className="text-lg font-display font-bold italic text-brand-red">"{analysis.motivation}"</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit size={40} className="text-white/20" />
                </div>
                <h4 className="text-xl font-bold mb-2">{t.waiting}</h4>
                <p className="text-white/40 max-w-md">
                  {t.waitingDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
