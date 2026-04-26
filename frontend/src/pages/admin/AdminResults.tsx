import { useState, useEffect } from 'react';
import { Users, RefreshCw, BarChart2, Search, Info } from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import api from '../../api/axios.config';

export default function AdminResults() {
  const { elections, loading: loadingElections, error, refresh: refreshElections } = useElections();
  const [tallies, setTallies] = useState<Record<string, any>>({});
  const [loadingTallies, setLoadingTallies] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  const fetchAllTallies = async () => {
    if (elections.length === 0) return;
    setLoadingTallies(true);
    const newTallies: Record<string, any> = {};
    try {
      await Promise.all(
        elections.map(async (e) => {
          if (e.status !== 'BORRADOR') {
            const { data } = await api.get(`/fabric/results/${e.id}`);
            newTallies[e.id] = data.results || {};
          }
        })
      );
      setTallies(newTallies);
    } catch (err) {
      console.error("Error al cargar resultados:", err);
    } finally {
      setLoadingTallies(false);
    }
  };

  useEffect(() => {
    if (elections.length > 0) {
      fetchAllTallies();
      if (!selectedId) setSelectedId(elections[0].id);
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

  const selectedElection = elections.find(e => e.id === selectedId);
  const currentTally = tallies[selectedId] || {};
  const totalVotos = Object.values(currentTally).reduce((a: any, b: any) => a + b, 0);

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-6xl mx-auto">
      {/* Cabecera de Gestión */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
            <BarChart2 size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Panel de Resultados</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Auditoría y Escrutinio Administrativo</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <select 
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-xs font-black uppercase tracking-widest text-slate-600 appearance-none cursor-pointer hover:bg-slate-100 transition-all"
            >
              <option value="" disabled>Seleccionar Proceso...</option>
              {elections.map(e => (
                <option key={e.id} value={e.id}>{e.title.toUpperCase()} — ({e.status})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={refresh} 
            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {selectedElection ? (
        <div className="flex flex-col gap-8">
          {/* Info Card */}
          <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between relative overflow-hidden">
             <div className="relative z-10">
                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{selectedElection.status}</span>
                <h3 className="text-3xl font-black tracking-tighter uppercase italic">{selectedElection.title}</h3>
                <div className="flex items-center gap-6 mt-4">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold opacity-60 uppercase">Votos Registrados</span>
                      <span className="text-2xl font-black italic">{totalVotos}</span>
                   </div>
                   <div className="w-px h-8 bg-white/20" />
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold opacity-60 uppercase">Candidatos</span>
                      <span className="text-2xl font-black italic">{selectedElection.candidates.length}</span>
                   </div>
                </div>
             </div>
             <Info size={120} className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12" />
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedElection.candidates.map(c => {
              const v = currentTally[c.id] || 0;
              const pct = totalVotos > 0 ? ((v / totalVotos) * 100).toFixed(1) : '0';
              return (
                <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-xl transition-all duration-300">
                  <div className="w-24 h-24 bg-slate-50 rounded-[1.5rem] overflow-hidden mb-6 shadow-inner">
                     {c.photoUrl ? <img src={c.photoUrl} className="w-full h-full object-cover" /> : <Users className="w-full h-full p-8 text-slate-200" />}
                  </div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{c.frontName}</span>
                  <h4 className="text-base font-black text-slate-800 uppercase tracking-tight mb-6 line-clamp-1">{c.candidateName}</h4>
                  
                  <div className="w-full bg-slate-900 text-white rounded-[1.5rem] p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black opacity-40 uppercase">Escrutinio</span>
                       <span className="text-indigo-400 font-black italic text-lg">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                       <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest">{v} Votos Oficiales</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 opacity-40 flex flex-col items-center gap-4">
           <BarChart2 size={48} />
           <p className="font-black uppercase tracking-[0.3em] text-xs">Seleccione una elección para ver el detalle</p>
        </div>
      )}
    </div>
  );
}
