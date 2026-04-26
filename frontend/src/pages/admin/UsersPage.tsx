import { useEffect, useState } from 'react';
import { Search, UserPlus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import api from '../../api/axios.config';
import type { CareerType, RoleType, User } from '../../types';

const ROLES: RoleType[] = ['VOTANTE', 'ADMINISTRADOR', 'AUDITOR'];
const CAREERS: CareerType[] = ['SISTEMAS', 'INFORMATICA', 'REDES'];

const ROLE_LABELS: Partial<Record<RoleType, string>> = {
  ESTUDIANTE: 'Estudiante', DOCENTE: 'Docente', ADMIN: 'Administrador',
  VOTANTE: 'Votante', ADMINISTRADOR: 'Administrador', AUDITOR: 'Auditor',
};

const CAREER_LABELS: Record<CareerType, string> = {
  SISTEMAS: 'Sistemas', INFORMATICA: 'Informática', REDES: 'Redes',
};

const ROLE_STYLE: Partial<Record<RoleType, { color: string; bg: string }>> = {
  ADMIN:         { color: 'var(--status-closed)',  bg: 'var(--status-closed-bg)' },
  ADMINISTRADOR: { color: 'var(--status-closed)',  bg: 'var(--status-closed-bg)' },
  DOCENTE:       { color: 'var(--status-sched)',   bg: 'var(--status-sched-bg)' },
  ESTUDIANTE:    { color: 'var(--status-active)',  bg: 'var(--status-active-bg)' },
  VOTANTE:       { color: 'var(--status-active)',  bg: 'var(--status-active-bg)' },
  AUDITOR:       { color: 'var(--status-counted)', bg: 'var(--status-counted-bg)' },
};

const EMPTY_FORM = { identificador: '', name: '', email: '', password: '', career: 'SISTEMAS' as CareerType, role: 'VOTANTE' as RoleType };
type FormMode = { type: 'create' } | { type: 'edit'; user: User };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<RoleType | ''>('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<User[]>('/users');
      setUsers(data);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() { setForm(EMPTY_FORM); setFormError(''); setMode({ type: 'create' }); }
  function openEdit(user: User) {
    setForm({ 
      identificador: user.ru || user.identificador || '', 
      name: user.name, 
      email: user.email, 
      password: '', 
      career: user.career, 
      role: user.role 
    });
    setFormError(''); setMode({ type: 'edit', user });
  }
  function closeForm() { setMode(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      if (mode?.type === 'create') {
        await api.post('/users', form);
      } else if (mode?.type === 'edit') {
        const payload: any = { ...form };
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${mode.user.id}`, payload);
      }
      await load(); closeForm();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar'));
    } finally { setSaving(false); }
  }

  async function handleDelete(user: User) {
    if (!confirm(`¿Eliminar al usuario ${user.name}?`)) return;
    try { await api.delete(`/users/${user.id}`); setUsers((prev) => prev.filter((u) => u.id !== user.id)); }
    catch { alert('No se pudo eliminar el usuario'); }
  }

  async function handleToggle(user: User) {
    try {
      const { data } = await api.patch<User>(`/users/${user.id}`, { isEnabled: !user.isEnabled });
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    } catch { alert('Error al cambiar estado'); }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.ru || u.identificador || '').toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchSearch && (!filterRole || u.role === filterRole);
  });

  const inputBase: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    outline: 'none',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-3)' }}>
      <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 rounded-xl px-5 py-4 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
      <AlertCircle size={15} />
      {error}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Gestión de Usuarios</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{users.length} usuario{users.length !== 1 ? 's' : ''} registrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand)' }}
        >
          <UserPlus size={14} />
          Nuevo usuario
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 p-4 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
            style={inputBase}
            placeholder="Buscar por registro, nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg text-sm cursor-pointer"
          style={inputBase}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as RoleType | '')}
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <span className="flex items-center text-xs px-3 rounded-lg" style={{ color: 'var(--text-3)', background: 'var(--surface-2)' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Registro', 'Nombre', 'Email', 'Carrera', 'Rol', 'Votó', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold border-b whitespace-nowrap"
                    style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center px-5 py-10 text-sm" style={{ color: 'var(--text-3)' }}>
                    Sin resultados
                  </td>
                </tr>
              )}
              {filtered.map((user, i) => {
                const rs = ROLE_STYLE[user.role];
                return (
                  <tr
                    key={user.id}
                    className="transition-colors"
                    style={{
                      borderBottom: i < filtered.length - 1 ? `1px solid var(--border)` : 'none',
                      opacity: user.isEnabled ? 1 : 0.45,
                    }}
                  >
                    <td className="px-5 py-3">
                      <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', fontFamily: 'monospace' }}>
                        {user.identificador || user.ru}
                      </code>
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-1)' }}>{user.name}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-2)' }}>{user.email}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-2)' }}>{CAREER_LABELS[user.career]}</td>
                    <td className="px-5 py-3">
                      {rs && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: rs.color, background: rs.bg }}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: user.hasVoted ? 'var(--status-active)' : 'var(--text-3)' }}>
                      {user.hasVoted ? '✓ Sí' : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggle(user)}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-opacity hover:opacity-75"
                        style={
                          user.isEnabled
                            ? { background: 'var(--status-active-bg)', color: 'var(--status-active)' }
                            : { background: 'var(--error-bg)', color: 'var(--error)' }
                        }
                      >
                        {user.isEnabled ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(user)}
                          aria-label="Editar usuario"
                          className="p-1.5 rounded-lg cursor-pointer border-0 transition-colors"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          aria-label="Eliminar usuario"
                          className="p-1.5 rounded-lg cursor-pointer border-0 transition-colors hover:opacity-80"
                          style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mode && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in"
          style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)' }}
          onClick={closeForm}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in"
            style={{ 
              background: 'var(--surface)', 
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'min(90vh, 700px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>
                  {mode.type === 'create' ? 'Registrar Nuevo Usuario' : 'Editar Perfil de Usuario'}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  {mode.type === 'create' ? 'Completa los datos para el nuevo miembro del padrón.' : 'Actualiza la información del usuario seleccionado.'}
                </p>
              </div>
              <button 
                onClick={closeForm}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent"
                style={{ color: 'var(--text-3)' }}
              >
                <Trash2 size={18} className="rotate-45" /> {/* Usando trash rotado como X provisional si no hay X icon */}
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Identificador / Registro */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="identificador" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>Registro (R.U. / C.I.)</label>
                  <input
                    id="identificador" type="text" value={form.identificador} required disabled={mode.type === 'edit'}
                    onChange={(e) => setForm({ ...form, identificador: e.target.value })}
                    placeholder="Ej: 21900123"
                    className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
                    style={{ ...inputBase, background: mode.type === 'edit' ? 'var(--surface-2)' : 'var(--surface)', opacity: mode.type === 'edit' ? 0.7 : 1 } as React.CSSProperties}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>Correo Institucional</label>
                  <input
                    id="email" type="email" value={form.email} required
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@uagrm.edu.bo"
                    className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
                    style={inputBase}
                  />
                </div>
              </div>

              {/* Nombre Completo */}
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>Nombre Completo</label>
                <input
                  id="name" type="text" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Juan Perez Garcia"
                  className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
                  style={inputBase}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Carrera */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="career" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>Carrera / Facultad</label>
                  <select id="career" className="rounded-xl px-4 py-3 text-sm cursor-pointer transition-all" style={inputBase} value={form.career} onChange={(e) => setForm({ ...form, career: e.target.value as CareerType })}>
                    {CAREERS.map((c) => <option key={c} value={c}>{CAREER_LABELS[c]}</option>)}
                  </select>
                </div>

                {/* Rol */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="role" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>Rol de Acceso</label>
                  <select id="role" className="rounded-xl px-4 py-3 text-sm cursor-pointer transition-all" style={inputBase} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleType })}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-2">
                <label htmlFor="pwd" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
                  {mode.type === 'edit' ? 'Cambiar Contraseña (Opcional)' : 'Contraseña de Acceso'}
                </label>
                <input
                  id="pwd" type="password" value={form.password} required={mode.type === 'create'}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={mode.type === 'edit' ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
                  minLength={6}
                  className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
                  style={inputBase}
                />
              </div>

              {formError && (
                <div className="flex items-start gap-3 rounded-2xl px-4 py-3 text-xs animate-shake" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50/50 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all hover:bg-white active:scale-95"
                style={{ background: 'var(--surface)', color: 'var(--text-2)', borderColor: 'var(--border)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer shadow-lg shadow-indigo-500/25 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--brand)' }}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando…</span>
                  </div>
                ) : (
                  mode.type === 'create' ? 'Crear Usuario' : 'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
