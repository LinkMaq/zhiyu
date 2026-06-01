import { useState } from 'react';
import { Shield, ToggleLeft, ToggleRight, CheckSquare, Square, Lock, Users } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { useToast } from '../../../hooks/useToast';
import { mockUsers } from '../../../data/mockUsers';

type UserEntry = typeof mockUsers[0] & { active: boolean };

const MAIN_TABS = [
  { key: 'users', label: '用户权限', icon: <Users size={14} /> },
  { key: 'matrix', label: '权限矩阵', icon: <Lock size={14} /> },
];

interface Permission { id: string; label: string; admin: boolean; user: boolean }
interface PermGroup { group: string; perms: Permission[] }

const PERM_GROUPS: PermGroup[] = [
  {
    group: '数据集管理',
    perms: [
      { id: 'ds.view', label: '查看数据集', admin: true, user: true },
      { id: 'ds.upload', label: '上传数据集', admin: true, user: true },
      { id: 'ds.delete', label: '删除数据集', admin: true, user: false },
      { id: 'ds.share', label: '共享数据集', admin: true, user: false },
      { id: 'ds.encrypt', label: '加密配置', admin: true, user: false },
    ]
  },
  {
    group: '模型管理',
    perms: [
      { id: 'mdl.view', label: '查看模型', admin: true, user: true },
      { id: 'mdl.download', label: '下载模型', admin: true, user: true },
      { id: 'mdl.upload', label: '上传模型', admin: true, user: true },
      { id: 'mdl.publish', label: '发布模型', admin: true, user: false },
      { id: 'mdl.delete', label: '删除模型', admin: true, user: false },
    ]
  },
  {
    group: '训练任务',
    perms: [
      { id: 'trn.create', label: '创建训练任务', admin: true, user: true },
      { id: 'trn.view', label: '查看训练任务', admin: true, user: true },
      { id: 'trn.stop', label: '停止训练任务', admin: true, user: true },
      { id: 'trn.delete', label: '删除训练任务', admin: true, user: false },
      { id: 'trn.manage_all', label: '管理他人任务', admin: true, user: false },
    ]
  },
  {
    group: '推理服务',
    perms: [
      { id: 'inf.create', label: '创建推理服务', admin: true, user: true },
      { id: 'inf.view', label: '查看推理服务', admin: true, user: true },
      { id: 'inf.scale', label: '调整扩缩容', admin: true, user: false },
      { id: 'inf.delete', label: '删除推理服务', admin: true, user: false },
    ]
  },
  {
    group: '开发实例',
    perms: [
      { id: 'dev.create', label: '创建开发实例', admin: true, user: true },
      { id: 'dev.view', label: '查看开发实例', admin: true, user: true },
      { id: 'dev.delete', label: '删除开发实例', admin: true, user: true },
      { id: 'dev.manage_all', label: '管理他人实例', admin: true, user: false },
    ]
  },
  {
    group: '系统管理',
    perms: [
      { id: 'sys.users', label: '用户管理', admin: true, user: false },
      { id: 'sys.quota', label: '配额管理', admin: true, user: false },
      { id: 'sys.ops', label: '操作日志', admin: true, user: false },
      { id: 'sys.images', label: '镜像管理', admin: true, user: false },
      { id: 'sys.monitor', label: '集群监控', admin: true, user: false },
      { id: 'sys.k8s', label: 'K8s 管理', admin: true, user: false },
    ]
  },
];

export default function Permissions() {
  const [mainTab, setMainTab] = useState('users');
  const [users, setUsers] = useState<UserEntry[]>(mockUsers.map(u => ({ ...u, active: true })));
  const [permGroups, setPermGroups] = useState(PERM_GROUPS);
  const { toast } = useToast();

  const setRole = (id: string, role: 'user' | 'admin') => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    toast.success('角色更新', '用户角色已成功更新');
  };

  const toggleActive = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = { ...u, active: !u.active };
      toast.info('状态更新', `用户 ${next.name} 已${next.active ? '启用' : '禁用'}`);
      return next;
    }));
  };

  const togglePerm = (groupIdx: number, permIdx: number, role: 'admin' | 'user') => {
    setPermGroups(prev => prev.map((g, gi) => gi !== groupIdx ? g : {
      ...g, perms: g.perms.map((p, pi) => pi !== permIdx ? p : { ...p, [role]: !p[role] })
    }));
    toast.success('权限更新', '权限矩阵已保存');
  };

  const CheckCell = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${checked ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}>
      {checked ? <CheckSquare size={16} /> : <Square size={16} />}
    </button>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="用户权限管理" subtitle="平台用户角色与访问权限管理" icon={<Shield size={20} />} />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总用户数', value: users.length, color: 'text-primary' },
          { label: '管理员', value: users.filter(u => u.role === 'admin').length, color: 'text-warning' },
          { label: '普通用户', value: users.filter(u => u.role === 'user').length, color: 'text-success' },
          { label: '已禁用', value: users.filter(u => !u.active).length, color: 'text-error' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Tabs tabs={MAIN_TABS} active={mainTab} onChange={setMainTab} />

      {mainTab === 'users' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['用户', '邮箱', '部门/机构', '角色', '状态', '注册时间', '操作'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${u.role === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                          {u.name[0]}
                        </div>
                        <span className="text-sm text-text-primary font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{u.department} / {u.organization}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={e => setRole(u.id, e.target.value as 'user' | 'admin')}
                        className="bg-surface border border-border rounded-md px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-primary"
                      >
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.active ? 'success' : 'ghost'}>{u.active ? '正常' : '已禁用'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(u.id)}
                        leftIcon={u.active ? <ToggleRight size={14} className="text-success" /> : <ToggleLeft size={14} className="text-text-muted" />}
                      >
                        {u.active ? '禁用' : '启用'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {mainTab === 'matrix' && (
        <Card>
          <p className="text-xs text-text-muted mb-4">点击复选框可切换角色权限。管理员权限不可关闭。</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted w-48">权限项</th>
                  <th className="py-2 px-6 text-center text-xs font-medium text-warning">管理员</th>
                  <th className="py-2 px-6 text-center text-xs font-medium text-primary">普通用户</th>
                </tr>
              </thead>
              <tbody>
                {permGroups.map((g, gi) => (
                  <>
                    <tr key={`grp-${gi}`} className="bg-white/2">
                      <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-text-secondary">{g.group}</td>
                    </tr>
                    {g.perms.map((p, pi) => (
                      <tr key={p.id} className="border-b border-border/30 hover:bg-white/2">
                        <td className="px-3 py-2 text-xs text-text-secondary pl-6">{p.label}</td>
                        <td className="px-6 py-2 text-center">
                          <div className="flex justify-center">
                            <CheckCell checked={p.admin} onClick={() => {}} />
                          </div>
                        </td>
                        <td className="px-6 py-2 text-center">
                          <div className="flex justify-center">
                            <CheckCell checked={p.user} onClick={() => togglePerm(gi, pi, 'user')} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => toast.success('权限保存', '权限矩阵配置已生效')}>保存配置</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
