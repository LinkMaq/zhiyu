import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, UserPlus, Edit2, Trash2, ShieldCheck, ShieldOff, Cpu, HardDrive, ChevronDown } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Tabs } from '../../../components/ui/Tabs';
import { ResourceBar } from '../../../components/charts/Charts';
import { useToast } from '../../../hooks/useToast';
import { mockUsers } from '../../../data/mockUsers';
import type { User, UserRole } from '../../../types';

const ORGS = ['全部', '中国电信AI研究院', '中国移动数字创新中心', '中国联通西南研发中心', '成都市大数据集团'];
const ROLES: { value: UserRole | ''; label: string }[] = [
  { value: '', label: '全部角色' },
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' },
];

const EMPTY_FORM = { name: '', email: '', role: 'user' as UserRole, department: '', organization: '中国电信AI研究院', gpu: '8', cpu: '32', memory: '128', storage: '1024' };

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('全部');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = users.filter(u => {
    const matchSearch = u.name.includes(search) || u.email.includes(search) || u.department.includes(search);
    const matchOrg = orgFilter === '全部' || u.organization === orgFilter;
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchOrg && matchRole;
  });

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, department: u.department, organization: u.organization,
      gpu: String(u.quota?.gpu ?? 8), cpu: String(u.quota?.cpu ?? 32), memory: String(u.quota?.memory ?? 128), storage: String(u.quota?.storage ?? 1024) });
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? {
        ...u, name: form.name, email: form.email, role: form.role, department: form.department, organization: form.organization,
        quota: { ...(u.quota ?? {}), gpu: Number(form.gpu), cpu: Number(form.cpu), memory: Number(form.memory), storage: Number(form.storage) } as User['quota']
      } : u));
      toast.success('用户更新', `${form.name} 信息已保存`);
      setEditUser(null);
    }
    setSaving(false);
  };

  const confirmDelete = () => {
    if (!deleteUser) return;
    setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
    toast.warning('用户删除', `${deleteUser.name} 已被删除`);
    setDeleteUser(null);
  };

  const toggleStatus = (u: User) => {
    toast.success('状态变更', `${u.name} 账号已${(u as any).disabled ? '启用' : '禁用'}`);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, disabled: !(x as any).disabled } : x));
  };

  // Stats
  const total = users.length;
  const admins = users.filter(u => u.role === 'admin').length;
  const totalGpuUsed = users.reduce((s, u) => s + (u.quota?.gpuUsed ?? 0), 0);
  const totalGpu = users.reduce((s, u) => s + (u.role === 'admin' ? 0 : (u.quota?.gpu ?? 0)), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="用户管理" subtitle="平台用户账号与资源配额管理" icon={<Users size={20} />} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总用户数', value: total, icon: <Users size={16} />, color: 'text-primary bg-primary/10' },
          { label: '管理员', value: admins, icon: <ShieldCheck size={16} />, color: 'text-accent bg-accent/10' },
          { label: 'GPU 已分配', value: `${totalGpuUsed} / ${totalGpu} 卡`, icon: <Cpu size={16} />, color: 'text-success bg-success/10' },
          { label: '活跃租户', value: ORGS.length - 1, icon: <HardDrive size={16} />, color: 'text-warning bg-warning/10' },
        ].map(s => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted mb-1">{s.label}</p>
                <p className="text-xl font-bold text-text-primary">{s.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { key: 'users', label: '用户列表', count: total },
          { key: 'quota', label: '配额详情' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'users' && (
        <Card>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="搜索用户姓名、邮箱、部门…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
            </div>
            <Select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
              options={ORGS.map(o => ({ value: o, label: o }))} className="sm:w-52" />
            <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | '')}
              options={ROLES.map(r => ({ value: r.value, label: r.label }))} className="sm:w-36" />
            <Link to="/admin/users/create"><Button leftIcon={<UserPlus size={14} />}>创建用户</Button></Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['用户', '组织 / 部门', '角色', 'GPU配额', '加入时间', '操作'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(u => (
                  <>
                    <tr key={u.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{u.name}</p>
                            <p className="text-xs text-text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-text-secondary">{u.organization}</p>
                        <p className="text-xs text-text-muted">{u.department}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={u.role === 'admin' ? 'accent' : 'default'}>
                          {u.role === 'admin' ? '管理员' : '普通用户'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-text-secondary">{u.quota?.gpuUsed ?? 0}/{u.quota?.gpu ?? 0} 卡</span>
                        <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${(u.quota?.gpuUsed ?? 0) / (u.quota?.gpu ?? 1) > 0.8 ? 'bg-error' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, ((u.quota?.gpuUsed ?? 0) / (u.quota?.gpu ?? 1)) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">{u.createdAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" leftIcon={<Edit2 size={12} />} onClick={() => openEdit(u)}>编辑</Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleStatus(u)}
                            leftIcon={(u as any).disabled ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                            className={(u as any).disabled ? 'text-success' : 'text-warning'}>
                            {(u as any).disabled ? '启用' : '禁用'}
                          </Button>
                          <Button size="sm" variant="ghost" leftIcon={<ChevronDown size={12} />}
                            onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>详情</Button>
                          {u.role !== 'admin' && (
                            <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} className="text-error hover:bg-error/10" onClick={() => setDeleteUser(u)}>删除</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === u.id && (
                      <tr key={`${u.id}-expand`}>
                        <td colSpan={6} className="bg-bg-elevated/50 px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div><span className="text-text-muted">CPU</span><ResourceBar label="" used={u.quota?.cpuUsed ?? 0} total={u.quota?.cpu ?? 1} unit="核" /></div>
                            <div><span className="text-text-muted">内存</span><ResourceBar label="" used={u.quota?.memoryUsed ?? 0} total={u.quota?.memory ?? 1} unit="GB" /></div>
                            <div><span className="text-text-muted">存储</span><ResourceBar label="" used={u.quota?.storageUsed ?? 0} total={u.quota?.storage ?? 1} unit="GB" /></div>
                            <div><span className="text-text-muted">GPU</span><ResourceBar label="" used={u.quota?.gpuUsed ?? 0} total={u.quota?.gpu ?? 1} unit="卡" /></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">未找到匹配用户</div>
          )}
        </Card>
      )}

      {tab === 'quota' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {users.filter(u => u.role !== 'admin').map(u => (
            <Card key={u.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">{u.name.slice(0, 1)}</div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{u.name}</p>
                    <p className="text-xs text-text-muted">{u.department}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" leftIcon={<Edit2 size={12} />} onClick={() => openEdit(u)}>编辑配额</Button>
              </div>
              <div className="space-y-2.5">
                <ResourceBar label="GPU" used={u.quota?.gpuUsed ?? 0} total={u.quota?.gpu ?? 1} unit="卡" />
                <ResourceBar label="CPU" used={u.quota?.cpuUsed ?? 0} total={u.quota?.cpu ?? 1} unit="核" />
                <ResourceBar label="内存" used={u.quota?.memoryUsed ?? 0} total={u.quota?.memory ?? 1} unit="GB" />
                <ResourceBar label="存储" used={u.quota?.storageUsed ?? 0} total={u.quota?.storage ?? 1} unit="GB" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)}
        title={editUser ? `编辑用户 — ${editUser.name}` : ''} width="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="姓名 *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="请输入姓名" />
            <Input label="邮箱 *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="部门" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="所属部门" />
            <Select label="组织" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })}
              options={ORGS.filter(o => o !== '全部').map(o => ({ value: o, label: o }))} />
          </div>
          <Select label="角色" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
            options={[{ value: 'user', label: '普通用户' }, { value: 'admin', label: '管理员' }]} />
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-text-muted mb-3">资源配额</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="GPU 配额 (卡)" type="number" value={form.gpu} onChange={e => setForm({ ...form, gpu: e.target.value })} />
              <Input label="CPU 配额 (核)" type="number" value={form.cpu} onChange={e => setForm({ ...form, cpu: e.target.value })} />
              <Input label="内存配额 (GB)" type="number" value={form.memory} onChange={e => setForm({ ...form, memory: e.target.value })} />
              <Input label="存储配额 (GB)" type="number" value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditUser(null)}>取消</Button>
            <Button loading={saving} onClick={handleSave} disabled={!form.name || !form.email}>保存修改</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="确认删除用户" width="sm">
        {deleteUser && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">确定要删除用户 <span className="text-error font-semibold">{deleteUser.name}</span> ({deleteUser.email}) 吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteUser(null)}>取消</Button>
              <Button className="bg-error/80 hover:bg-error" leftIcon={<Trash2 size={14} />} onClick={confirmDelete}>确认删除</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
