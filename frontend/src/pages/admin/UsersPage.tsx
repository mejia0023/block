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

const EMPTY_FORM = { ru: '', name: '', email: '', password: '', career: 'SISTEMAS' as CareerType, role: 'VOTANTE' as RoleType };
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
    setForm({ ru: user.ru, name: user.name, email: user.email, password: '', career: user.career, role: user.role });
    setFormError(''); setMode({ type: 'edit', user });
  }
  function closeForm() { setMode(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError(''); setSaving(true);
    try {
      if (mode?.type === 'create') {
        await api.post('/users', form);
      } else if (mode?.type === 'edit') {
        const payload: Partial<typeof form> = { ...form };
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
    const matchSearch = !q || u.ru.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
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
            placeholder="Buscar por R.U., nombre o email…"
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
                {['R.U.', 'Nombre', 'Email', 'Carrera', 'Rol', 'Votó', 'Estado', 'Acciones'].map((h) => (
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
                        {user.ru}
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
          className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
          style={{ background: 'rgba(0,0,0,.5)' }}
          onClick={closeForm}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-7 animate-scale-in"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-6" style={{ color: 'var(--text-1)' }}>
              {mode.type === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {[
                { id: 'ru',    label: 'R.U.',          type: 'text',     value: form.ru,    disabled: mode.type === 'edit', required: true,                   onChange: (v: string) => setForm({ ...form, ru: v }) },
                { id: 'name',  label: 'Nombre completo', type: 'text',   value: form.name,  disabled: false,               required: true,                   onChange: (v: string) => setForm({ ...form, name: v }) },
                { id: 'email', label: 'Email',          type: 'email',   value: form.email, disabled: false,               required: true,                   onChange: (v: string) => setForm({ ...form, email: v }) },
                { id: 'pwd',   label: mode.type === 'edit' ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña', type: 'password', value: form.password, disabled: false, required: mode.type === 'create', onChange: (v: string) => setForm({ ...form, password: v }) },
              ].map(({ id, label, type, value, disabled, required, onChange }) => (
                <div key={id} className="flex flex-col gap-1.5">
                  <label htmlFor={id} className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{label}</label>
                  <input
                    id={id} type={type} value={value} required={required} disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm"
                    style={{ ...inputBase, background: disabled ? 'var(--surface-2)' : 'var(--surface)', opacity: disabled ? 0.6 : 1, minLength: type === 'password' ? 6 : undefined } as React.CSSProperties}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="career" className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Carrera</label>
                  <select id="career" className="rounded-lg px-3.5 py-2.5 text-sm cursor-pointer" style={inputBase} value={form.career} onChange={(e) => setForm({ ...form, career: e.target.value as CareerType })}>
                    {CAREERS.map((c) => <option key={c} value={c}>{CAREER_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="role" className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Rol</label>
                  <select id="role" className="rounded-lg px-3.5 py-2.5 text-sm cursor-pointer" style={inputBase} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleType })}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                  <AlertCircle size={13} className="shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border transition-colors"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-2)', borderColor: 'var(--border)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--brand)' }}
                >
                  {saving ? 'Guardando…' : mode.type === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
