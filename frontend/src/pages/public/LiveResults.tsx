import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, ShieldCheck, Landmark, RefreshCw } from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import api from '../../api/axios.config';

export default function LiveResults() {
  const { elections, loading: loadingElections, refresh: refreshElections } = useElections();
  const [tallies, setTallies] = useState<Record<string, any>>({});
  const [loadingTallies, setLoadingTallies] = useState(false);

  const fetchAllTallies = async () => {
    if (elections.length === 0) return;
    setLoadingTallies(true);
    const newTallies: Record<string, any> = {};
    try {
      await Promise.all(
        elections.map(async (e) => {
          if (e.status === 'ACTIVA') {
            try {
              const { data } = await api.get(`/fabric/results/${e.id}`);
              newTallies[e.id] = data.results || {};
            } catch (err) {
              // Silencioso
            }
          }
        })
      );
      setTallies(newTallies);
    } finally {
      setLoadingTallies(false);
    }
  };

  useEffect(() => {
    if (elections.length > 0) {
      fetchAllTallies();
    }
  }, [elections]);

  const refresh = () => {
    refreshElections();
    fetchAllTallies();
  };

  if (loadingElections || loadingTallies) return (
    <div className="flex items-center justify-center h-96 text-indigo-600">
      <RefreshCw size={48} className="animate-spin opacity-20" />
    </div>
  );

  const displayElections = elections.filter(e => e.status === 'ACTIVA');

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-12 animate-fade-in pb-40 pt-4">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-800">Monitoreo de Elecciones Activas</h2>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">Datos en Tiempo Real</p>
      </div>

      {displayElections.length === 0 && (
        <div className="text-center py-20 opacity-20">
          <p className="font-black uppercase tracking-widest text-sm">No hay procesos activos en este momento</p>
        </div>
      )}

      {displayElections.map((election, idx) => {
        const currentTally = tallies[election.id] || {};
        const totalVotos = Object.values(currentTally).reduce((a: any, b: any) => a + b, 0);
        const habilitados = 100;
        const emitidos = totalVotos;
        const pendientes = Math.max(0, habilitados - emitidos);
        const sortedCandidates = [...election.candidates].sort((a, b) => a.candidateName.localeCompare(b.candidateName));

        return (
          <section key={election.id} className="flex flex-col gap-4 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="bg-slate-900 text-white rounded-[2rem] shadow-xl overflow-hidden">
               <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Servicio en Vivo</span>
                   </div>
                   <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">{election.title}</h3>
                 </div>
                 <button onClick={refresh} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl">
                    <RefreshCw size={14} />
                 </button>
               </div>
               <div className="grid grid-cols-3 bg-indigo-600 text-white py-3 border-t border-white/10">
                  <div className="flex flex-col items-center border-r border-white/20">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Habilitados</span>
                    <span className="text-xl font-black italic">{habilitados}</span>
                  </div>
                  <div className="flex flex-col items-center border-r border-white/20">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Ya Votaron</span>
                    <span className="text-xl font-black italic text-emerald-300">{emitidos}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Pendientes</span>
                    <span className="text-xl font-black italic text-amber-300">{pendientes}</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {sortedCandidates.map((c) => {
                const votos = currentTally[c.id] || 0;
                const pct = totalVotos > 0 ? ((votos / totalVotos) * 100).toFixed(1) : '0.0';
                return (
                  <div key={c.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                    <div className="h-28 bg-slate-50 relative overflow-hidden">
                      {c.photoUrl ? <img src={c.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Users size={28} /></div>}
                    </div>
                    <div className="p-4 flex-1 flex flex-col items-center text-center">
                      <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest mb-1 line-clamp-1">{c.frontName}</span>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight line-clamp-2 h-8 flex items-center mb-3">{c.candidateName}</h4>
                      <div className="w-full mt-auto bg-red-600 text-white rounded-xl p-2 shadow-lg shadow-red-600/20">
                        <div className="text-2xl font-black italic tracking-tighter leading-none">{pct}%</div>
                        <div className="text-[9px] font-bold uppercase opacity-60 mt-0.5">{votos} Votos</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex flex-col md:flex-row items-center justify-between gap-10 p-12 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm mt-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 shadow-inner">
            <ShieldCheck size={40} />
          </div>
          <div className="flex flex-col">
            <h4 className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-2">Integridad del Proceso</h4>
            <p className="text-xs text-slate-500 font-medium max-w-lg leading-relaxed">
              Los datos mostrados son oficiales e inmutables, respaldados por Blockchain.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 opacity-20 text-[10px] font-black uppercase tracking-[0.5em]">
           <Landmark size={18} /> FICCT 2026
        </div>
      </div>
    </div>
  );
}
