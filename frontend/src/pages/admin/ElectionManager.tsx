import { useState } from 'react';
import { useElections } from '../../hooks/useElections';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import type { Election, ElectionStatus, Candidate } from '../../types';

const NEXT_STATUS: Partial<Record<ElectionStatus, ElectionStatus>> = {
  PROGRAMADA: 'ACTIVA',
  ACTIVA:     'CERRADA',
  CERRADA:    'ESCRUTADA',
};

const POSITION_OPTIONS = [
  'DECANO',
  'DIRECTOR_SISTEMAS',
  'DIRECTOR_INFORMATICA',
  'DIRECTOR_REDES',
] as const;

const inputCls = 'border border-slate-300 rounded-md px-2.5 py-1.5 text-[13px]';

export default function ElectionManager() {
  const { elections, loading, createElection, updateStatus, deleteElection, addCandidate, removeCandidate } = useElections();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidateForm, setCandidateForm] = useState({
    frontName: '', candidateName: '', position: 'DECANO' as Candidate['position'], mission: '', photoUrl: '',
  });
  const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createElection({ title: form.title, description: form.description || undefined, startDate: form.startDate, endDate: form.endDate });
      setForm({ title: '', description: '', startDate: '', endDate: '' });
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al crear'));
    } finally {
      setSaving(false);
    }
  }

  function confirmAction(message: string, action: () => void) {
    setConfirm({ message, action });
  }

  async function handleAddCandidate(electionId: string) {
    await addCandidate(electionId, {
      frontName: candidateForm.frontName, candidateName: candidateForm.candidateName,
      position: candidateForm.position, mission: candidateForm.mission || undefined, photoUrl: candidateForm.photoUrl || undefined,
    });
    setCandidateForm({ frontName: '', candidateName: '', position: 'DECANO', mission: '', photoUrl: '' });
  }

  if (loading) return <p className="p-6">Cargando…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Gestión de Elecciones</h2>
        <button
          className="bg-indigo-500 text-white border-none px-4 py-2 rounded-md cursor-pointer text-[13px] font-semibold"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancelar' : '+ Nueva elección'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-5 mb-4 max-w-lg flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Nueva elección</h3>
          <label className="flex flex-col gap-1 text-[13px] font-medium">
            Título
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium">
            Descripción
            <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium">
            Fecha inicio
            <input className={inputCls} type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium">
            Fecha fin
            <input className={inputCls} type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </label>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
          <button type="submit" disabled={saving} className="bg-indigo-500 text-white border-none px-4 py-2 rounded-md cursor-pointer text-[13px] font-semibold disabled:opacity-60 self-start">
            {saving ? 'Guardando…' : 'Crear'}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {elections.map((election) => (
          <div key={election.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <strong className="text-sm">{election.title}</strong>
                <StatusBadge status={election.status} />
              </div>
              <div className="flex gap-2">
                {NEXT_STATUS[election.status] && (
                  <button
                    className="bg-slate-200 text-slate-800 border-none px-3.5 py-1.5 rounded-md cursor-pointer text-xs"
                    onClick={() => confirmAction(`¿Cambiar estado a ${NEXT_STATUS[election.status]}?`, () => updateStatus(election.id, NEXT_STATUS[election.status]!))}
                  >
                    → {NEXT_STATUS[election.status]}
                  </button>
                )}
                {election.status === 'PROGRAMADA' && (
                  <button
                    className="bg-red-500 text-white border-none px-3.5 py-1.5 rounded-md cursor-pointer text-xs"
                    onClick={() => confirmAction('¿Eliminar esta elección?', () => deleteElection(election.id))}
                  >
                    Eliminar
                  </button>
                )}
                <button
                  className="bg-slate-200 text-slate-800 border-none px-3.5 py-1.5 rounded-md cursor-pointer text-xs"
                  onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
                >
                  {expandedId === election.id ? 'Cerrar' : 'Candidatos'}
                </button>
              </div>
            </div>

            <div className="text-slate-500 text-xs mt-1.5">
              {new Date(election.startDate).toLocaleString()} — {new Date(election.endDate).toLocaleString()}
            </div>

            {expandedId === election.id && (
              <CandidatePanel
                election={election}
                candidateForm={candidateForm}
                setCandidateForm={setCandidateForm}
                onAdd={() => handleAddCandidate(election.id)}
                onRemove={(cid) => confirmAction('¿Eliminar este candidato?', () => removeCandidate(election.id, cid))}
              />
            )}
          </div>
        ))}
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={() => { confirm.action(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function CandidatePanel({ election, candidateForm, setCandidateForm, onAdd, onRemove }: {
  election: Election;
  candidateForm: { frontName: string; candidateName: string; position: Candidate['position']; mission: string; photoUrl: string; };
  setCandidateForm: React.Dispatch<React.SetStateAction<typeof candidateForm>>;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const candidates = election.candidates ?? [];
  const inputCls = 'border border-slate-300 rounded-md px-2.5 py-1.5 text-xs';

  return (
    <div className="mt-4 border-t border-slate-100 pt-3.5">
      <h4 className="text-[13px] font-semibold mb-2">Candidatos ({candidates.length})</h4>
      {candidates.length === 0 && <p className="text-[13px] text-slate-400">Sin candidatos aún.</p>}
      <ul className="list-none flex flex-col gap-1.5 my-2">
        {candidates.map((c) => (
          <li key={c.id} className="flex items-center gap-2.5 text-[13px]">
            <strong>{c.candidateName}</strong> — {c.frontName} — {c.position}
            {election.status === 'PROGRAMADA' && (
              <button className="bg-red-500 text-white border-none px-2.5 py-0.5 rounded-md cursor-pointer text-xs" onClick={() => onRemove(c.id)}>✕</button>
            )}
          </li>
        ))}
      </ul>

      {election.status === 'PROGRAMADA' && (
        <div className="flex gap-2 flex-wrap mt-3 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Cargo</span>
            <select className={inputCls} value={candidateForm.position} onChange={(e) => setCandidateForm((f) => ({ ...f, position: e.target.value as Candidate['position'] }))}>
              {POSITION_OPTIONS.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <input className={inputCls} placeholder="Nombre completo" value={candidateForm.candidateName} onChange={(e) => setCandidateForm((f) => ({ ...f, candidateName: e.target.value }))} />
          <input className={inputCls} placeholder="Nombre del frente" value={candidateForm.frontName} onChange={(e) => setCandidateForm((f) => ({ ...f, frontName: e.target.value }))} />
          <input className={inputCls} placeholder="Misión (opcional)" value={candidateForm.mission} onChange={(e) => setCandidateForm((f) => ({ ...f, mission: e.target.value }))} />
          <input className={inputCls} placeholder="URL foto (opcional)" value={candidateForm.photoUrl} onChange={(e) => setCandidateForm((f) => ({ ...f, photoUrl: e.target.value }))} />
          <button className="bg-indigo-500 text-white border-none px-2.5 py-1.5 rounded-md cursor-pointer text-xs font-semibold" onClick={onAdd}>Agregar</button>
        </div>
      )}
    </div>
  );
}
