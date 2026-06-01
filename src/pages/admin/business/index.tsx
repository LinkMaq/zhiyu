import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, XCircle, Eye, Building2, UserPlus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { mockModels } from '../../../data/mockModels';

const PENDING_EXTRA = [
  { id: 'pm1', name: 'Llama3-8B-Telecom-SFT', version: 'v1.0.0', owner: '张正达', framework: 'PyTorch', size: '16GB', submittedAt: '2025-01-10T09:30:00Z', status: 'pending' as const, category: '大语言模型', desc: '基于 Llama3-8B 在电信运营商客服场景上微调的 SFT 模型' },
  { id: 'pm2', name: 'ViT-B16-NetEquip-Defect', version: 'v2.1.0', owner: '李建工', framework: 'PyTorch', size: '4GB', submittedAt: '2025-01-11T14:15:00Z', status: 'pending' as const, category: '视觉感知', desc: '电信网络设备外观缺陷检测视觉 Transformer 模型' },
  { id: 'pm3', name: 'ERNIE-3.0-Contract-ZY', version: 'v1.2.0', owner: '王静芳', framework: 'PaddlePaddle', size: '12GB', submittedAt: '2025-01-12T10:00:00Z', status: 'pending' as const, category: '大语言模型', desc: '基于 ERNIE 3.0 的运营商合同文件理解模型' },
  { id: 'pm4', name: 'BGE-Large-Telecom-Embed', version: 'v1.0.0', owner: '陈志远', framework: 'PyTorch', size: '1.3GB', submittedAt: '2025-01-14T08:45:00Z', status: 'pending' as const, category: '向量表示', desc: '电信运营商业务文档向量表示模型，支持语义检索与知识库建设' },
];

interface Tenant {
  id: string; name: string; shortName: string; contactName: string; contactEmail: string;
  userCount: number; gpuQuota: number; status: 'active' | 'disabled'; createdAt: string; industry: string;
}

const INIT_TENANTS: Tenant[] = [
  { id: 't1', name: '中国电信AI研究院', shortName: 'CTAI', contactName: '赵磊', contactEmail: 'zhaolei@ctai.com.cn', userCount: 12, gpuQuota: 128, status: 'active', createdAt: '2024-09-01', industry: '电信运营' },
  { id: 't2', name: '中国移动数字创新中心', shortName: 'CMDI', contactName: '钱进', contactEmail: 'qianjin@cmdi.com.cn', userCount: 9, gpuQuota: 96, status: 'active', createdAt: '2024-09-15', industry: '电信运营' },
  { id: 't3', name: '中国联通西南研发中心', shortName: 'CURC', contactName: '孙丽', contactEmail: 'sunli@curc.com.cn', userCount: 7, gpuQuota: 64, status: 'active', createdAt: '2024-10-10', industry: '电信运营' },
  { id: 't4', name: '成都市大数据集团', shortName: 'CDBD', contactName: '李明', contactEmail: 'liming@cdbd.gov.cn', userCount: 5, gpuQuota: 48, status: 'active', createdAt: '2024-11-01', industry: '政务数据' },
  { id: 't5', name: '四川天府云计算', shortName: 'TFYJ', contactName: '王华', contactEmail: 'wanghua@tfcloud.cn', userCount: 6, gpuQuota: 32, status: 'disabled', createdAt: '2024-11-20', industry: '云计算服务' },
];

const MAIN_TABS = [
  { key: 'tenants', label: '租户管理', icon: <Building2 size={14} /> },
  { key: 'approval', label: '模型审批', icon: <CheckCircle2 size={14} /> },
];
const APPROVAL_TABS = [{ key: 'pending', label: '待审批' }, { key: 'published', label: '已发布' }];

export default function BusinessManagement() {
  const [mainTab, setMainTab] = useState('tenants');
  const [approvalTab, setApprovalTab] = useState('pending');
  const [tenants, setTenants] = useState<Tenant[]>(INIT_TENANTS);
  const [pending, setPending] = useState(PENDING_EXTRA);
  const [viewModel, setViewModel] = useState<any>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({ name: '', shortName: '', contactName: '', contactEmail: '', industry: '电信运营', gpuQuota: '64' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const approve = (id: string, name: string) => {
    setPending(prev => prev.filter(p => p.id !== id));
    toast.success('审批通过', `模型 ${name} 已通过审批并发布`);
  };
  const reject = (id: string, name: string) => {
    setPending(prev => prev.filter(p => p.id !== id));
    toast.error('审批拒绝', `模型 ${name} 已被拒绝`);
  };

  const openEditTenant = (t: Tenant) => {
    setEditTenant(t);
    setTenantForm({ name: t.name, shortName: t.shortName, contactName: t.contactName, contactEmail: t.contactEmail, industry: t.industry, gpuQuota: String(t.gpuQuota) });
  };

  const handleTenantSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (editTenant) {
      setTenants(prev => prev.map(t => t.id === editTenant.id ? { ...t, ...tenantForm, gpuQuota: Number(tenantForm.gpuQuota) } : t));
      toast.success('租户更新', `${tenantForm.name} 信息已保存`);
      setEditTenant(null);
    }
    setSaving(false);
  };

  const toggleTenant = (t: Tenant) => {
    setTenants(prev => prev.map(x => x.id === t.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x));
    toast.success('状态变更', `${t.name} 已${t.status === 'active' ? '禁用' : '启用'}`);
  };

  const published = mockModels.filter(m => m.status === 'available');
  const active = tenants.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="业务管理" subtitle="租户管理与模型审批" icon={<Briefcase size={20} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '注册租户', value: tenants.length, color: 'text-primary' },
          { label: '活跃租户', value: active, color: 'text-success' },
          { label: '待审批模型', value: pending.length, color: 'text-warning' },
          { label: '已发布模型', value: published.length, color: 'text-accent' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Tabs tabs={MAIN_TABS} active={mainTab} onChange={setMainTab} />

      {mainTab === 'tenants' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-text-primary">租户列表</p>
            <Link to="/admin/business/create-tenant"><Button leftIcon={<UserPlus size={14} />}>注册租户</Button></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['租户名称', '行业', '联系人', 'GPU配额', '用户数', '状态', '注册时间', '操作'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">{t.shortName.slice(0, 2)}</div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{t.name}</p>
                          <p className="text-xs text-text-muted">{t.shortName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-text-secondary">{t.industry}</td>
                    <td className="py-3 px-3">
                      <p className="text-xs text-text-secondary">{t.contactName}</p>
                      <p className="text-xs text-text-muted">{t.contactEmail}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-text-secondary">{t.gpuQuota} 卡</td>
                    <td className="py-3 px-3 text-xs text-text-secondary">{t.userCount} 人</td>
                    <td className="py-3 px-3">
                      <Badge variant={t.status === 'active' ? 'success' : 'error'}>{t.status === 'active' ? '活跃' : '禁用'}</Badge>
                    </td>
                    <td className="py-3 px-3 text-xs text-text-muted whitespace-nowrap">{t.createdAt}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" leftIcon={<Edit2 size={11} />} onClick={() => openEditTenant(t)}>编辑</Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleTenant(t)}
                          leftIcon={t.status === 'active' ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
                          className={t.status === 'active' ? 'text-warning' : 'text-success'}>
                          {t.status === 'active' ? '禁用' : '启用'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {mainTab === 'approval' && (
        <Card noPadding>
          <div className="px-5 py-4 border-b border-border">
            <Tabs tabs={APPROVAL_TABS} active={approvalTab} onChange={setApprovalTab} />
          </div>

          {approvalTab === 'pending' && (
            <div className="divide-y divide-border/50">
              {pending.length === 0 && (
                <div className="py-12 text-center text-sm text-text-muted">暂无待审批模型</div>
              )}
              {pending.map(m => (
                <div key={m.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{m.name}</span>
                      <Badge variant="secondary">{m.version}</Badge>
                      <Badge variant="primary">{m.category}</Badge>
                    </div>
                    <p className="text-xs text-text-muted">{m.desc}</p>
                    <p className="text-xs text-text-muted mt-0.5">提交人: {m.owner} · 框架: {m.framework} · 大小: {m.size}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="ghost" leftIcon={<Eye size={12} />} onClick={() => setViewModel(m)}>详情</Button>
                    <Button size="sm" variant="secondary" leftIcon={<CheckCircle2 size={12} />} onClick={() => approve(m.id, m.name)}>通过</Button>
                    <Button size="sm" variant="danger" leftIcon={<XCircle size={12} />} onClick={() => reject(m.id, m.name)}>拒绝</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approvalTab === 'published' && (
            <div className="divide-y divide-border/50">
              {published.map(m => (
                <div key={m.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{m.name}</span>
                      <Badge variant="ghost">{m.framework}</Badge>
                    </div>
                    <p className="text-xs text-text-muted">{m.category} · {m.parameters} · {m.license}</p>
                  </div>
                  <Badge variant="success">已发布</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Model detail modal */}
      <Modal open={!!viewModel} onClose={() => setViewModel(null)} title="模型详情" width="md">
        {viewModel && (
          <div className="space-y-3">
            {[
              { label: '模型名称', value: viewModel.name },
              { label: '版本', value: viewModel.version },
              { label: '类别', value: viewModel.category },
              { label: '框架', value: viewModel.framework },
              { label: '模型大小', value: viewModel.size },
              { label: '提交人', value: viewModel.owner },
              { label: '提交时间', value: new Date(viewModel.submittedAt).toLocaleString('zh-CN') },
              { label: '模型描述', value: viewModel.desc },
            ].map(r => (
              <div key={r.label} className="flex gap-3">
                <span className="text-xs text-text-muted w-20 shrink-0">{r.label}</span>
                <span className="text-xs text-text-secondary">{r.value}</span>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setViewModel(null)}>关闭</Button>
              <Button variant="secondary" leftIcon={<CheckCircle2 size={14} />} onClick={() => { approve(viewModel.id, viewModel.name); setViewModel(null); }}>通过审批</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Tenant modal */}
      <Modal open={!!editTenant} onClose={() => setEditTenant(null)}
        title={editTenant ? `编辑租户 — ${editTenant.name}` : ''} width="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="租户全称 *" value={tenantForm.name} onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })} placeholder="例：中国电信AI研究院" />
            <Input label="简称 *" value={tenantForm.shortName} onChange={e => setTenantForm({ ...tenantForm, shortName: e.target.value })} placeholder="例：CTAI" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="联系人" value={tenantForm.contactName} onChange={e => setTenantForm({ ...tenantForm, contactName: e.target.value })} placeholder="联系人姓名" />
            <Input label="联系邮箱" value={tenantForm.contactEmail} onChange={e => setTenantForm({ ...tenantForm, contactEmail: e.target.value })} placeholder="contact@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="行业" value={tenantForm.industry} onChange={e => setTenantForm({ ...tenantForm, industry: e.target.value })}
              options={['电信运营', '政务数据', '云计算服务', '金融科技', '工业互联网'].map(v => ({ value: v, label: v }))} />
            <Input label="GPU 配额 (卡)" type="number" value={tenantForm.gpuQuota} onChange={e => setTenantForm({ ...tenantForm, gpuQuota: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditTenant(null)}>取消</Button>
            <Button loading={saving} onClick={handleTenantSave} disabled={!tenantForm.name || !tenantForm.shortName}>保存修改</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

