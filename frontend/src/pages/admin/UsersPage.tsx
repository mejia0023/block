import { useEffect, useState } from 'react';
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

const ROLE_BADGE: Partial<Record<RoleType, string>> = {
  ADMIN:         'bg-amber-100 text-amber-800',
  ADMINISTRADOR: 'bg-amber-100 text-amber-800',
  DOCENTE:       'bg-blue-100 text-blue-800',
  ESTUDIANTE:    'bg-green-50 text-green-800',
  VOTANTE:       'bg-green-50 text-green-800',
  AUDITOR:       'bg-indigo-100 text-indigo-800',
};

const EMPTY_FORM = { ru: '', name: '', email: '', password: '', career: 'SISTEMAS' as CareerType, role: 'VOTANTE' as RoleType };
type FormMode = { type: 'create' } | { type: 'edit'; user: User };

const inputCls = 'px-2.5 py-2 border border-slate-200 rounded-lg text-[13px]';

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

  if (loading) return <p className="p-6">Cargando…</p>;
  if (error) return <p className="text-red-500 text-xs p-6">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
        <button className="bg-indigo-500 text-white border-none px-4 py-2 rounded-md cursor-pointer text-[13px] font-semibold" onClick={openCreate}>
          + Nuevo usuario
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-lg text-[13px]"
          placeholder="Buscar por R.U., nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-2.5 py-2 border border-slate-200 rounded-lg text-[13px] bg-white"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as RoleType | '')}
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr>
              {['R.U.', 'Nombre', 'Email', 'Carrera', 'Rol', 'Votó', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="bg-slate-50 text-left px-3.5 py-2.5 text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-400 p-6">Sin resultados</td></tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className={!user.isEnabled ? 'opacity-50' : ''}>
                <td className="px-3.5 py-2.5 text-[13px] border-b border-slate-100"><code>{user.ru}</code></td>
                <td className="px-3.5 py-2.5 text-[13px] border-b border-slate-100">{user.name}</td>
                <td className="px-3.5 py-2.5 text-[13px] border-b border-slate-100">{user.email}</td>
                <td className="px-3.5 py-2.5 text-[13px] border-b border-slate-100">{CAREER_LABELS[user.career]}</td>
                <td className="px-3.5 py-2.5 border-b border-slate-100">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-[13px] border-b border-slate-100">{user.hasVoted ? '✓' : '—'}</td>
                <td className="px-3.5 py-2.5 border-b border-slate-100">
                  <button
                    onClick={() => handleToggle(user)}
                    className={`border-none rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${user.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {user.isEnabled ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-3.5 py-2.5 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <button className="bg-slate-200 text-slate-800 border-none px-2.5 py-0.5 rounded-md cursor-pointer text-xs" onClick={() => openEdit(user)}>Editar</button>
                    <button className="bg-red-500 text-white border-none px-2.5 py-0.5 rounded-md cursor-pointer text-xs" onClick={() => handleDelete(user)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeForm}>
          <div className="bg-white rounded-xl px-8 py-7 w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-3">{mode.type === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-3">
              <label className="flex flex-col gap-1 text-[13px] font-medium">
                R.U.
                <input className={`${inputCls} ${mode.type === 'edit' ? 'bg-slate-50 text-slate-400' : ''}`} value={form.ru} onChange={(e) => setForm({ ...form, ru: e.target.value })} required disabled={mode.type === 'edit'} />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium">
                Nombre completo
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium">
                Email
                <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium">
                {mode.type === 'edit' ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña'}
                <input className={inputCls} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={mode.type === 'create'} minLength={6} />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium">
                Carrera
                <select className={inputCls} value={form.career} onChange={(e) => setForm({ ...form, career: e.target.value as CareerType })}>
                  {CAREERS.map((c) => <option key={c} value={c}>{CAREER_LABELS[c]}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium">
                Rol
                <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleType })}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </label>

              {formError && <p className="text-red-500 text-xs">{formError}</p>}

              <div className="flex justify-end gap-2.5 mt-1">
                <button type="button" className="bg-slate-200 text-slate-800 border-none px-3.5 py-1.5 rounded-md cursor-pointer text-xs" onClick={closeForm}>Cancelar</button>
                <button type="submit" disabled={saving} className="bg-indigo-500 text-white border-none px-4 py-2 rounded-md cursor-pointer text-[13px] font-semibold disabled:opacity-60">
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
