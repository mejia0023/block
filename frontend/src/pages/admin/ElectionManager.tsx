import { useState } from 'react';
import { useElections } from '../../hooks/useElections';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import type { Election, ElectionStatus, Candidate } from '../../types';

const NEXT_STATUS: Partial<Record<ElectionStatus, ElectionStatus>> = {
  PROGRAMADA: 'ACTIVA',
  ACTIVA: 'CERRADA',
  CERRADA: 'ESCRUTADA',
};

const POSITION_OPTIONS = [
  'DECANO',
  'DIRECTOR_SISTEMAS',
  'DIRECTOR_INFORMATICA',
  'DIRECTOR_REDES',
] as const;

export default function ElectionManager() {
  const {
    elections,
    loading,
    createElection,
    updateStatus,
    deleteElection,
    addCandidate,
    removeCandidate,
  } = useElections();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidateForm, setCandidateForm] = useState({
    frontName: '',
    candidateName: '',
    position: 'DECANO' as Candidate['position'],
    mission: '',
    photoUrl: '',
  });

  const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createElection({
        title: form.title,
        description: form.description || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setForm({ title: '', description: '', startDate: '', endDate: '' });
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
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
      frontName: candidateForm.frontName,
      candidateName: candidateForm.candidateName,
      position: candidateForm.position,
      mission: candidateForm.mission || undefined,
      photoUrl: candidateForm.photoUrl || undefined,
    });
    setCandidateForm({ frontName: '', candidateName: '', position: 'DECANO', mission: '', photoUrl: '' });
  }

  if (loading) return <p>Cargando…</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Gestión de Elecciones</h2>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nueva elección'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <h3>Nueva elección</h3>
          <label>
            Título
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Descripción
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label>
            Fecha inicio
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </label>
          <label>
            Fecha fin
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </label>
          {formError && <p className="error-msg">{formError}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Crear'}
          </button>
        </form>
      )}

      <div className="elections-list">
        {elections.map((election) => (
          <div key={election.id} className="card election-card">
            <div className="election-header">
              <div>
                <strong>{election.title}</strong>
                <StatusBadge status={election.status} />
              </div>
              <div className="election-actions">
                {NEXT_STATUS[election.status] && (
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      confirmAction(
                        `¿Cambiar estado a ${NEXT_STATUS[election.status]}?`,
                        () => updateStatus(election.id, NEXT_STATUS[election.status]!),
                      )
                    }
                  >
                    → {NEXT_STATUS[election.status]}
                  </button>
                )}
                {election.status === 'PROGRAMADA' && (
                  <button
                    className="btn-danger"
                    onClick={() =>
                      confirmAction('¿Eliminar esta elección?', () =>
                        deleteElection(election.id),
                      )
                    }
                  >
                    Eliminar
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setExpandedId(expandedId === election.id ? null : election.id)
                  }
                >
                  {expandedId === election.id ? 'Cerrar' : 'Candidatos'}
                </button>
              </div>
            </div>

            <div className="election-meta">
              {new Date(election.startDate).toLocaleString()} —{' '}
              {new Date(election.endDate).toLocaleString()}
            </div>

            {expandedId === election.id && (
              <CandidatePanel
                election={election}
                candidateForm={candidateForm}
                setCandidateForm={setCandidateForm}
                onAdd={() => handleAddCandidate(election.id)}
                onRemove={(cid) =>
                  confirmAction('¿Eliminar este candidato?', () =>
                    removeCandidate(election.id, cid),
                  )
                }
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

function CandidatePanel({
  election,
  candidateForm,
  setCandidateForm,
  onAdd,
  onRemove,
}: {
  election: Election;
  candidateForm: {
    frontName: string;
    candidateName: string;
    position: Candidate['position'];
    mission: string;
    photoUrl: string;
  };
  setCandidateForm: React.Dispatch<React.SetStateAction<typeof candidateForm>>;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const candidates = election.candidates ?? [];
  return (
    <div className="candidate-panel">
      <h4>Candidatos ({candidates.length})</h4>
      {candidates.length === 0 && <p>Sin candidatos aún.</p>}
      <ul>
        {candidates.map((c) => (
          <li key={c.id}>
            <strong>{c.candidateName}</strong> — {c.frontName} — {c.position}
            {election.status === 'PROGRAMADA' && (
              <button className="btn-danger btn-sm" onClick={() => onRemove(c.id)}>
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {election.status === 'PROGRAMADA' && (
        <div className="candidate-form">
          <h5>Agregar candidato</h5>
          <input
            placeholder="Nombre completo"
            value={candidateForm.candidateName}
            onChange={(e) => setCandidateForm((f) => ({ ...f, candidateName: e.target.value }))}
          />
          <input
            placeholder="Nombre del frente"
            value={candidateForm.frontName}
            onChange={(e) => setCandidateForm((f) => ({ ...f, frontName: e.target.value }))}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Cargo al que postula
            <select
              value={candidateForm.position}
              onChange={(e) =>
                setCandidateForm((f) => ({
                  ...f,
                  position: e.target.value as Candidate['position'],
                }))
              }
            >
              {POSITION_OPTIONS.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
          <input
            placeholder="Misión / propuesta (opcional)"
            value={candidateForm.mission}
            onChange={(e) => setCandidateForm((f) => ({ ...f, mission: e.target.value }))}
          />
          <input
            placeholder="URL foto (opcional)"
            value={candidateForm.photoUrl}
            onChange={(e) => setCandidateForm((f) => ({ ...f, photoUrl: e.target.value }))}
          />
          <button className="btn-primary btn-sm" onClick={onAdd}>
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}
