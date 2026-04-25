import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, ArrowRight, UserPlus, X, AlertCircle, Search } from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../api/axios.config';
import type { Election, ElectionStatus, Candidate, User } from '../../types';

const NEXT_STATUS: Partial<Record<ElectionStatus, ElectionStatus>> = {
  PROGRAMADA: 'ACTIVA',
  ACTIVA:     'CERRADA',
  CERRADA:    'ESCRUTADA',
};

const NEXT_LABEL: Partial<Record<ElectionStatus, string>> = {
  PROGRAMADA: 'Activar',
  ACTIVA:     'Cerrar',
  CERRADA:    'Escrutar',
};

const inputBase: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-1)',
  outline: 'none',
};

export default function ElectionManager() {
  const { elections, loading, createElection, updateStatus, deleteElection, addCandidate, removeCandidate } = useElections();

  const [users, setUsers]       = useState<User[]>([]);
  const [channels, setChannels] = useState<{ nombre: string }[]>([]);

  useEffect(() => {
    api.get<User[]>('/users').then(({ data }) => setUsers(data)).catch(() => {});
    api.get<{ nombre: string }[]>('/channels').then(({ data }) => setChannels(data)).catch(() => {});
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', channelName: 'evoting' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidateForm, setCandidateForm] = useState({
    frontName: '', candidateName: '', position: '' as Candidate['position'], mission: '', photoUrl: '',
  });
  const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createElection({ title: form.title, description: form.description || undefined, startDate: form.startDate, endDate: form.endDate, channelName: form.channelName });
      setForm({ title: '', description: '', startDate: '', endDate: '', channelName: 'evoting' });
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
    setCandidateForm({ frontName: '', candidateName: '', position: '', mission: '', photoUrl: '' });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-3)' }}>
      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Gestión de Elecciones</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{elections.length} elección{elections.length !== 1 ? 'es' : ''} registrada{elections.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
          style={
            showForm
              ? { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }
              : { background: 'var(--brand)', color: '#fff' }
          }
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Nueva elección'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl p-6 flex flex-col gap-4 animate-slide-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Nueva elección</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Título *</label>
              <input className="rounded-lg px-3.5 py-2.5 text-sm w-full" style={inputBase} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Descripción</label>
              <input className="rounded-lg px-3.5 py-2.5 text-sm w-full" style={inputBase} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Fecha inicio *</label>
              <input className="rounded-lg px-3.5 py-2.5 text-sm w-full" style={inputBase} type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Fecha fin *</label>
              <input className="rounded-lg px-3.5 py-2.5 text-sm w-full" style={inputBase} type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Canal Fabric *</label>
              <select
                className="rounded-lg px-3.5 py-2.5 text-sm w-full"
                style={inputBase}
                value={form.channelName}
                onChange={(e) => setForm({ ...form, channelName: e.target.value })}
              >
                {channels.length === 0
                  ? <option value="evoting">evoting (por defecto)</option>
                  : channels.map((ch) => (
                      <option key={ch.nombre} value={ch.nombre}>{ch.nombre}</option>
                    ))
                }
              </select>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
              <AlertCircle size={13} className="shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer transition-opacity disabled:opacity-60"
              style={{ background: 'var(--brand)' }}
            >
              {saving ? 'Guardando…' : 'Crear elección'}
            </button>
          </div>
        </form>
      )}

      {/* Election list */}
      <div className="flex flex-col gap-3">
        {elections.length === 0 && !showForm && (
          <div className="text-center py-16 text-sm rounded-2xl" style={{ color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            No hay elecciones. Crea la primera.
          </div>
        )}
        {elections.map((election) => {
          const isExpanded = expandedId === election.id;
          return (
            <div
              key={election.id}
              className="rounded-2xl overflow-hidden transition-shadow"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={election.status} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{election.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {new Date(election.startDate).toLocaleString()} — {new Date(election.endDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {NEXT_STATUS[election.status] && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-opacity hover:opacity-75"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                      onClick={() => confirmAction(`¿Cambiar estado a ${NEXT_STATUS[election.status]}?`, () => updateStatus(election.id, NEXT_STATUS[election.status]!))}
                    >
                      <ArrowRight size={11} />
                      {NEXT_LABEL[election.status]}
                    </button>
                  )}
                  {election.status === 'PROGRAMADA' && (
                    <button
                      aria-label="Eliminar elección"
                      className="p-1.5 rounded-lg border-0 cursor-pointer transition-opacity hover:opacity-75"
                      style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                      onClick={() => confirmAction('¿Eliminar esta elección?', () => deleteElection(election.id))}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border-0 cursor-pointer transition-colors"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                    onClick={() => setExpandedId(isExpanded ? null : election.id)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    Candidatos ({(election.candidates ?? []).length})
                  </button>
                </div>
              </div>

              {/* Candidate panel */}
              {isExpanded && (
                <CandidatePanel
                  election={election}
                  users={users}
                  candidateForm={candidateForm}
                  setCandidateForm={setCandidateForm}
                  onAdd={() => handleAddCandidate(election.id)}
                  onRemove={(cid) => confirmAction('¿Eliminar este candidato?', () => removeCandidate(election.id, cid))}
                />
              )}
            </div>
          );
        })}
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

function CandidatePanel({ election, users, candidateForm, setCandidateForm, onAdd, onRemove }: {
  election: Election;
  users: User[];
  candidateForm: { frontName: string; candidateName: string; position: Candidate['position']; mission: string; photoUrl: string; };
  setCandidateForm: React.Dispatch<React.SetStateAction<typeof candidateForm>>;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const candidates = election.candidates ?? [];

  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Resetear el selector cuando el form se limpia después de agregar
  useEffect(() => {
    if (!candidateForm.candidateName) {
      setSelectedUserId('');
      setUserSearch('');
    }
  }, [candidateForm.candidateName]);

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.ru.toLowerCase().includes(q);
  });

  function handleUserSelect(userId: string) {
    const user = users.find((u) => u.id === userId);
    setSelectedUserId(userId);
    setCandidateForm((f) => ({ ...f, candidateName: user?.name ?? '' }));
  }

  const iStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    outline: 'none',
  };

  return (
    <div
      className="border-t px-5 py-4 flex flex-col gap-4 animate-slide-up"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
    >
      {/* Candidate list */}
      {candidates.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin candidatos aún.</p>
      ) : (
        <ul className="list-none flex flex-col gap-2">
          {candidates.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
              >
                {c.candidateName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{c.candidateName}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{c.frontName} · {c.position}</p>
              </div>
              {election.status === 'PROGRAMADA' && (
                <button
                  aria-label="Eliminar candidato"
                  className="p-1.5 rounded-lg border-0 cursor-pointer transition-opacity hover:opacity-75 shrink-0"
                  style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                  onClick={() => onRemove(c.id)}
                >
                  <X size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add candidate form */}
      {election.status === 'PROGRAMADA' && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
            <UserPlus size={12} /> Agregar candidato
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Selector de usuario */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>
                Nombre completo (usuario del sistema) *
              </label>
              <div className="flex flex-col gap-1">
                {/* Búsqueda */}
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
                  <input
                    className="w-full rounded-lg pl-7 pr-3 py-2 text-xs"
                    style={iStyle}
                    placeholder="Buscar por nombre o R.U.…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                {/* Select */}
                <select
                  className="w-full rounded-lg px-3 py-2 text-xs cursor-pointer"
                  style={{
                    ...iStyle,
                    background: selectedUserId ? 'var(--brand-light)' : 'var(--surface)',
                    color: selectedUserId ? 'var(--brand)' : 'var(--text-2)',
                    fontWeight: selectedUserId ? 600 : 400,
                  }}
                  value={selectedUserId}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  size={Math.min(filteredUsers.length + 1, 5)}
                >
                  <option value="">— Seleccionar usuario —</option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.ru})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cargo, frente, misión, foto */}
            {[
              { ph: 'Cargo *',             key: 'position' as const },
              { ph: 'Nombre del frente *', key: 'frontName' as const },
              { ph: 'Misión (opcional)',   key: 'mission' as const },
              { ph: 'URL foto (opcional)', key: 'photoUrl' as const },
            ].map(({ ph, key }) => (
              <input
                key={key}
                className="rounded-lg px-3 py-2 text-xs"
                style={iStyle}
                placeholder={ph}
                value={candidateForm[key]}
                onChange={(e) => setCandidateForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            ))}

            <button
              className="sm:col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand)' }}
              disabled={!candidateForm.candidateName || !candidateForm.position || !candidateForm.frontName}
              onClick={onAdd}
            >
              <Plus size={12} />
              Agregar candidato
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
