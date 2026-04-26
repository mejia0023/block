import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, AlertCircle, Vote, Minus, Ban, Users } from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/axios.config';

export default function VotingPage() {
  const { elections, loading } = useElections();
  const user = useAuthStore((s) => s.user);

  // Mapa de electionId -> candidateId o 'votos_blancos'/'votos_nulos'
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Array<{ title: string, txId: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const activeElections = elections.filter((e) => e.status === 'ACTIVA');
  
  // Verificamos si ya ha votado o si ya tenemos resultados en esta sesión
  const allVoted = user?.hasVoted || (results.length > 0 && results.length === activeElections.length);

  function toggleSelection(electionId: string, choiceId: string) {
    setSelections(prev => ({
      ...prev,
      [electionId]: choiceId
    }));
  }

  async function handleVote() {
    if (activeElections.length === 0) return;
    
    const missing = activeElections.filter(e => !selections[e.id]);
    if (missing.length > 0) {
      setError(`Pendiente: Marca una opción en todas las papeletas.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    const newResults: Array<{ title: string, txId: string }> = [];

    try {
      for (const election of activeElections) {
        const candidateId = selections[election.id];
        const { data } = await api.post<{ txId: string }>('/fabric/vote', {
          electionId: election.id,
          candidateId,
        });
        newResults.push({ title: election.title, txId: data.txId });
      }

      setResults(newResults);
      useAuthStore.getState().setAuth({
        access_token: useAuthStore.getState().token!,
        user: { ...user!, hasVoted: true },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al registrar los votos.');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (allVoted) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-8 animate-fade-in py-12">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-sm">
          <CheckCircle2 size={48} />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-800">¡Votación Completada!</h2>
          <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest">Tus votos han sido blindados con éxito</p>
        </div>

        <div className="w-full flex flex-col gap-4">
          {(results.length > 0 ? results : [{ title: 'Proceso Electoral', txId: 'Registrado anteriormente' }]).map((res, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{res.title}</span>
              <code className="text-[10px] text-slate-400 break-all font-mono">{res.txId}</code>
            </div>
          ))}
        </div>

        <a href="/elecciones" className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
          Ver Resultados en Vivo
        </a>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96 text-indigo-600">
      <Loader2 size={48} className="animate-spin opacity-20" />
    </div>
  );

  if (activeElections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 text-slate-300">
        <Vote size={64} className="opacity-20" />
        <p className="text-sm font-black uppercase tracking-widest">No hay papeletas activas</p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-5xl mx-auto flex flex-col gap-16 animate-slide-up pb-40 pt-6">
      
      <div className="text-center border-b border-slate-100 pb-10">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic text-slate-800">Centro de Votación</h2>
        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.3em]">Emita su voto marcando una casilla por papeleta</p>
      </div>

      {activeElections.map((election, index) => (
        <section key={election.id} className="flex flex-col gap-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-black italic">
              {index + 1}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{election.title}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{election.description || 'Elección Oficial'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {election.candidates.map((c) => {
              const isSelected = selections[election.id] === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => toggleSelection(election.id, c.id)}
                  className={`group relative flex flex-col bg-white rounded-[1.5rem] overflow-hidden border-2 transition-all duration-300 ${
                    isSelected ? 'border-indigo-600 shadow-xl ring-4 ring-indigo-500/5 scale-[1.02]' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="h-40 bg-slate-50 relative overflow-hidden">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.candidateName} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 gap-1">
                        <Users size={32} />
                        <span className="text-[8px] font-black uppercase opacity-30">Candidato</span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                        <div className="bg-white text-indigo-600 p-2 rounded-full shadow-lg">
                          <CheckCircle2 size={24} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500">{c.frontName}</span>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight mt-0.5">{c.candidateName}</h4>
                  </div>
                </button>
              );
            })}
            
            <div className="grid grid-cols-2 gap-2 col-span-1 sm:col-span-2 lg:col-span-4 mt-2">
               <button 
                onClick={() => toggleSelection(election.id, 'votos_blancos')}
                className={`flex items-center justify-center gap-3 p-3 rounded-xl border-2 transition-all ${selections[election.id] === 'votos_blancos' ? 'bg-slate-50 border-slate-800' : 'bg-white border-slate-50 opacity-40'}`}
               >
                 <Minus size={14} className="text-slate-400" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Blanco</span>
               </button>
               <button 
                onClick={() => toggleSelection(election.id, 'votos_nulos')}
                className={`flex items-center justify-center gap-3 p-3 rounded-xl border-2 transition-all ${selections[election.id] === 'votos_nulos' ? 'bg-red-50 border-red-600' : 'bg-white border-slate-50 opacity-40'}`}
               >
                 <Ban size={14} className="text-red-400" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Nulo</span>
               </button>
            </div>
          </div>
        </section>
      ))}

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col items-center gap-3 z-40">
        {error && <p className="text-[10px] text-red-600 font-black uppercase bg-red-50 px-4 py-2 rounded-full border border-red-100">{error}</p>}
        <button
          onClick={() => setConfirming(true)}
          className={`flex items-center gap-4 px-16 py-6 rounded-full text-sm font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 ${
            Object.keys(selections).length === activeElections.length ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-200 text-slate-400 grayscale cursor-not-allowed'
          }`}
        >
          <Vote size={20} />
          Registrar Votos Oficiales
        </button>
      </div>

    </div>
    {/* MODAL MOVIDO FUERA DEL CONTENEDOR ANIMADO PARA CENTRADO PERFECTO */}
    {confirming && (
      <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 flex flex-col gap-6 shadow-2xl animate-scale-in border border-slate-100">
          <div className="text-center">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Resumen Final</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Verifique sus selecciones antes del registro inmutable</p>
          </div>

          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {activeElections.map(e => {
              const choiceId = selections[e.id];
              const candidate = e.candidates.find(c => c.id === choiceId);
              const label = choiceId === 'votos_blancos' ? 'Blanco' : choiceId === 'votos_nulos' ? 'Nulo' : candidate?.candidateName;
              return (
                <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-slate-400">{e.title}</span>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{label}</span>
                  </div>
                  <CheckCircle2 size={16} className="text-indigo-600" />
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleVote}
              disabled={submitting}
              className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'SÍ, CONFIRMO MI VOTO'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
}
