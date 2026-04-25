import { useState, useEffect, useCallback } from 'react';
import { Layers, PlusCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
import api from '../../api/axios.config';

interface FabricChannel {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creadoEn: string;
}

const emptyForm = { nombre: '', descripcion: '' };

export default function ChannelsPage() {
  const [channels, setChannels]     = useState<FabricChannel[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [logs, setLogs]             = useState<string | null>(null);
  const [showLogs, setShowLogs]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<FabricChannel[]>('/channels');
      setChannels(data);
    } catch {
      setError('Error cargando canales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.nombre) return;
    setCreating(true);
    setError(null);
    setLogs(null);
    try {
      const { data } = await api.post<{ channel: FabricChannel; logs: string }>('/channels', {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
      });
      setLogs(data.logs);
      setShowLogs(true);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Error al crear canal';
      setError(msg);
      setLogs(msg);
      setShowLogs(true);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-slide-up max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Canales Fabric</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            Cada canal es un ledger independiente — las elecciones se asignan a un canal al crearse
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand)' }}
        >
          <PlusCircle size={15} />
          Crear Canal
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Nuevo canal</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              Genera el bloque génesis, une todos los peers activos y despliega el chaincode (~1 min).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Nombre del canal</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="evoting-ficct"
                className="rounded-lg px-3 py-2 text-sm font-mono"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Minúsculas, letras/números/guiones, 3–49 chars
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Descripción (opcional)</label>
              <input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Canal de elecciones FICCT 2026"
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span className="break-all">{error}</span>
            </div>
          )}

          {creating && (
            <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
              <Loader2 size={13} className="animate-spin shrink-0" />
              Creando canal… puede tardar ~1 minuto.
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm); setError(null); }}
              className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)', borderColor: 'var(--border)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || form.nombre.length < 3}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--brand)' }}
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
              Crear
            </button>
          </div>
        </div>
      )}

      {/* Logs */}
      {logs !== null && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <button
            onClick={() => setShowLogs((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold cursor-pointer border-0"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            <span>Logs de creación</span>
            {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showLogs && (
            <pre
              className="p-4 text-xs overflow-x-auto whitespace-pre-wrap"
              style={{ background: '#0f172a', color: '#94a3b8', maxHeight: '300px', overflowY: 'auto' }}
            >
              {logs}
            </pre>
          )}
        </div>
      )}

      {/* Lista de canales */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-3)' }}>
            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Layers size={32} style={{ color: 'var(--text-3)' }} />
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No hay canales registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {['Estado', 'Canal', 'Descripción', 'Creado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => (
                <tr
                  key={ch.id}
                  style={{
                    background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {ch.activo
                        ? <CheckCircle2 size={14} style={{ color: 'var(--status-active)' }} />
                        : <Circle size={14} style={{ color: 'var(--text-3)' }} />}
                      <span className="text-xs font-semibold" style={{ color: ch.activo ? 'var(--status-active)' : 'var(--text-3)' }}>
                        {ch.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Layers size={14} style={{ color: 'var(--text-3)' }} />
                      <code className="text-xs px-2 py-1 rounded font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}>
                        {ch.nombre}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-2)' }}>
                    {ch.descripcion ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-3)' }}>
                    {new Date(ch.creadoEn).toLocaleDateString('es-BO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        Al crear una elección, selecciona el canal donde se registrarán sus votos en blockchain.
      </p>
    </div>
  );
}
