import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, ShieldAlert, TrendingUp, Cpu, UserCheck, UserX, Loader2 } from 'lucide-react';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_premium: boolean;
  role: string;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalTokens: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?search=${search}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (usersRes.ok && statsRes.ok) {
        setUsers(await usersRes.json());
        setStats(await statsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = async (userId: number, currentPremium: boolean) => {
    try {
      const res = await fetch(`/api/admin/user/${userId}/plan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_premium: !currentPremium })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">PAINEL <span className="text-brand-red">ADMIN</span></h2>
          <p className="text-white/60">Gestão de usuários, custos e infraestrutura.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <TrendingUp className="text-brand-red" size={20} />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Usuários</p>
              <p className="text-xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <Cpu className="text-brand-red" size={20} />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Tokens IA</p>
              <p className="text-xl font-bold">{(stats?.totalTokens || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field w-full pl-12"
            />
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          </div>
          <button onClick={fetchData} className="btn-secondary py-3 px-6">
            ATUALIZAR
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase font-bold tracking-widest">
                <th className="px-4 py-4">Usuário</th>
                <th className="px-4 py-4">Plano</th>
                <th className="px-4 py-4">Cargo</th>
                <th className="px-4 py-4">Cadastro</th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="animate-spin text-brand-red mx-auto" size={32} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-white/40">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold">{user.name}</div>
                      <div className="text-xs text-white/40">{user.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.is_premium ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' : 'bg-white/10 text-white/40'
                      }`}>
                        {user.is_premium ? 'Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        {user.role === 'admin' ? <Shield size={14} className="text-brand-red" /> : <ShieldAlert size={14} className="text-white/20" />}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-white/40">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => togglePlan(user.id, user.is_premium)}
                        className={`p-2 rounded-lg transition-all ${
                          user.is_premium ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-brand-red hover:bg-brand-red/10'
                        }`}
                        title={user.is_premium ? "Remover Premium" : "Ativar Premium"}
                      >
                        {user.is_premium ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
