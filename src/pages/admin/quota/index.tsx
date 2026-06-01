import { useState } from 'react';
import { PieChart, Edit2, Users, CheckCircle, XCircle, Clock, TrendingUp, Building2, LayoutGrid, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react';
import type { ComputeSpecType } from '../../../types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Tabs } from '../../../components/ui/Tabs';
import { ResourceBar } from '../../../components/charts/Charts';
import { useToast } from '../../../hooks/useToast';
import { mockComputeSpecs } from '../../../data/mockData';

const TENANTS = [
  { id: 't1', name: '中国电信四川分公司', gpuUsed: 48, gpuTotal: 96, cpuUsed: 240, cpuTotal: 384, memUsed: 960, memTotal: 1536, storageUsed: 28, storageTotal: 60 },
  { id: 't2', name: '中国移动四川公司', gpuUsed: 20, gpuTotal: 48, cpuUsed: 128, cpuTotal: 192, memUsed: 480, memTotal: 768, storageUsed: 12, storageTotal: 30 },
  { id: 't3', name: '中国联通西南区域', gpuUsed: 32, gpuTotal: 64, cpuUsed: 176, cpuTotal: 256, memUsed: 600, memTotal: 1024, storageUsed: 18, storageTotal: 40 },
  { id: 't4', name: '成都市大数据集团', gpuUsed: 8, gpuTotal: 24, cpuUsed: 48, cpuTotal: 96, memUsed: 192, memTotal: 384, storageUsed: 5, storageTotal: 15 },
  { id: 't5', name: '四川广电网络传媒', gpuUsed: 6, gpuTotal: 16, cpuUsed: 40, cpuTotal: 64, memUsed: 128, memTotal: 256, storageUsed: 4, storageTotal: 10 },
];

const INIT_REQUESTS = [
  { id: 'req001', tenant: '中国电信四川分公司', applicant: '张远航', resource: 'GPU', currentQuota: 96, requestedQuota: 128, reason: '年底大模型训练项目扩容需求', status: 'pending' as const, submittedAt: '2025-03-10 14:30' },
  { id: 'req002', tenant: '中国移动四川公司', applicant: '李思远', resource: 'CPU', currentQuota: 192, requestedQuota: 384, reason: '数据处理流水线 CPU 不足，影响正常业务', status: 'pending' as const, submittedAt: '2025-03-11 09:15' },
  { id: 'req003', tenant: '成都市大数据集团', applicant: '王明轩', resource: 'GPU', currentQuota: 24, requestedQuota: 48, reason: '视觉模型推理服务上线，需增加 GPU 卡数', status: 'approved' as const, submittedAt: '2025-03-08 16:00', reviewedAt: '2025-03-09 10:00', reviewer: '管理员' },
  { id: 'req004', tenant: '四川广电网络传媒', applicant: '陈晓磊', resource: '存储', currentQuota: 10, requestedQuota: 30, reason: '视频内容数据集存储空间不足', status: 'rejected' as const, submittedAt: '2025-03-07 11:00', reviewedAt: '2025-03-07 17:30', reviewer: '管理员', rejectReason: '当前存储资源紧张，建议3个月后重新申请' },
  { id: 'req005', tenant: '中国联通西南区域', applicant: '刘嘉豪', resource: '内存', currentQuota: 1024, requestedQuota: 2048, reason: '分布式训练任务内存溢出', status: 'pending' as const, submittedAt: '2025-03-12 08:45' },
];

const WORKSPACE_QUOTAS = [
  {
    tenantId: 't1', tenant: '中国电信四川分公司', selfManage: true,
    workspaces: [
      { id: 'ws1', name: '生产工作空间', gpuAlloc: 32, gpuUsed: 28, cpuAlloc: 128, cpuUsed: 96, memAlloc: 512, memUsed: 320, storageAlloc: 20, storageUsed: 15 },
      { id: 'ws2', name: '测试工作空间', gpuAlloc: 16, gpuUsed: 12, cpuAlloc: 64, cpuUsed: 40, memAlloc: 256, memUsed: 180, storageAlloc: 8, storageUsed: 5 },
    ]
  },
  {
    tenantId: 't2', tenant: '中国移动四川公司', selfManage: false,
    workspaces: [
      { id: 'ws3', name: 'AI开发工作空间', gpuAlloc: 12, gpuUsed: 10, cpuAlloc: 80, cpuUsed: 60, memAlloc: 320, memUsed: 220, storageAlloc: 10, storageUsed: 7 },
      { id: 'ws4', name: '运营工作空间', gpuAlloc: 8, gpuUsed: 5, cpuAlloc: 48, cpuUsed: 30, memAlloc: 160, memUsed: 80, storageAlloc: 5, storageUsed: 3 },
    ]
  },
  {
    tenantId: 't3', tenant: '中国联通西南区域', selfManage: true,
    workspaces: [
      { id: 'ws5', name: '大模型训练工作空间', gpuAlloc: 24, gpuUsed: 20, cpuAlloc: 96, cpuUsed: 70, memAlloc: 384, memUsed: 260, storageAlloc: 12, storageUsed: 8 },
      { id: 'ws6', name: '推理服务工作空间', gpuAlloc: 8, gpuUsed: 6, cpuAlloc: 32, cpuUsed: 22, memAlloc: 128, memUsed: 90, storageAlloc: 4, storageUsed: 2 },
    ]
  },
  {
    tenantId: 't4', tenant: '成都市大数据集团', selfManage: false,
    workspaces: [
      { id: 'ws7', name: '大数据分析工作空间', gpuAlloc: 8, gpuUsed: 6, cpuAlloc: 40, cpuUsed: 28, memAlloc: 160, memUsed: 120, storageAlloc: 5, storageUsed: 3 },
    ]
  },
  {
    tenantId: 't5', tenant: '四川广电网络传媒', selfManage: false,
    workspaces: [
      { id: 'ws8', name: '媒体AI工作空间', gpuAlloc: 6, gpuUsed: 4, cpuAlloc: 32, cpuUsed: 20, memAlloc: 128, memUsed: 70, storageAlloc: 4, storageUsed: 2 },
    ]
  },
];

const STATUS_CONFIG = {
  pending:  { label: '待审批', variant: 'warning' as const, icon: <Clock size={12} /> },
  approved: { label: '已通过', variant: 'success' as const, icon: <CheckCircle size={12} /> },
  rejected: { label: '已拒绝', variant: 'error' as const, icon: <XCircle size={12} /> },
};

interface TenantSpecQuotaLimit {
  id: string;
  tenantId: string;
  tenant: string;
  specId: string;
  maxCount: number;
  usedCount: number;
  updatedAt: string;
  updatedBy: string;
}

interface SpecLimitForm {
  id?: string;
  tenantId: string;
  specId: string;
  maxCount: string;
}

const TENANT_SPEC_BASELINE: Record<string, { general: number; gpu: number; vgpu: number }> = {
  t1: { general: 220, gpu: 52, vgpu: 90 },
  t2: { general: 150, gpu: 30, vgpu: 60 },
  t3: { general: 180, gpu: 38, vgpu: 72 },
  t4: { general: 80, gpu: 12, vgpu: 28 },
  t5: { general: 64, gpu: 10, vgpu: 20 },
};

const SPEC_TYPE_OPTIONS: { value: 'all' | ComputeSpecType; label: string }[] = [
  { value: 'all', label: '全部规格类型' },
  { value: 'general', label: '通用算力' },
  { value: 'gpu', label: 'GPU 算力' },
  { value: 'vgpu', label: 'vGPU 算力' },
];

const DEFAULT_SPEC_LIMIT_FORM: SpecLimitForm = {
  tenantId: TENANTS[0]?.id ?? '',
  specId: mockComputeSpecs[0]?.id ?? '',
  maxCount: '10',
};

function buildInitialTenantSpecLimits(): TenantSpecQuotaLimit[] {
  return TENANTS.flatMap((tenant, tenantIndex) => {
    const base = TENANT_SPEC_BASELINE[tenant.id] ?? { general: 60, gpu: 8, vgpu: 16 };

    return mockComputeSpecs.map((spec, specIndex) => {
      const pool = spec.type === 'general' ? base.general : spec.type === 'gpu' ? base.gpu : base.vgpu;
      const sizeFactor = spec.type === 'general'
        ? Math.max(0.35, 12 / spec.cpu)
        : spec.type === 'gpu'
          ? Math.max(0.3, 1 / Math.max(1, spec.gpuCount ?? 1)) * (spec.gpuModel?.includes('H100') ? 0.72 : 1)
          : Math.max(0.35, 20 / Math.max(1, spec.vgpuSliceGb ?? 20));
      const maxCount = Math.max(2, Math.round(pool * sizeFactor));
      const usageRatio = Math.min(0.92, 0.34 + ((tenantIndex + specIndex) % 5) * 0.12);
      const usedCount = Math.min(maxCount, Math.max(0, Math.round(maxCount * usageRatio)));

      return {
        id: `spec-limit-${tenant.id}-${spec.id}`,
        tenantId: tenant.id,
        tenant: tenant.name,
        specId: spec.id,
        maxCount,
        usedCount,
        updatedAt: `2026-05-${String(12 + ((tenantIndex + specIndex) % 16)).padStart(2, '0')} ${(9 + ((tenantIndex + specIndex) % 9)).toString().padStart(2, '0')}:30`,
        updatedBy: '配额管理员',
      };
    });
  });
}

export default function QuotaManagement() {
  const [tenants, setTenants] = useState(TENANTS);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('overview');
  const [requests, setRequests] = useState(INIT_REQUESTS);
  const [reviewReq, setReviewReq] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [workspaceData, setWorkspaceData] = useState(WORKSPACE_QUOTAS);
  const [selectedTenant, setSelectedTenant] = useState('t1');
  const [editWs, setEditWs] = useState<any>(null);
  const [savingWs, setSavingWs] = useState(false);
  const [tenantSpecLimits, setTenantSpecLimits] = useState<TenantSpecQuotaLimit[]>(() => buildInitialTenantSpecLimits());
  const [selectedSpecTenant, setSelectedSpecTenant] = useState(TENANTS[0]?.id ?? '');
  const [specTypeFilter, setSpecTypeFilter] = useState<'all' | ComputeSpecType>('all');
  const [specLimitModalOpen, setSpecLimitModalOpen] = useState(false);
  const [specLimitForm, setSpecLimitForm] = useState<SpecLimitForm>(DEFAULT_SPEC_LIMIT_FORM);
  const [savingSpecLimit, setSavingSpecLimit] = useState(false);
  const { toast } = useToast();

  const totalGpu = TENANTS.reduce((s, t) => s + t.gpuTotal, 0);
  const usedGpu  = TENANTS.reduce((s, t) => s + t.gpuUsed, 0);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setTenants(prev => prev.map(t => t.id === editTenant.id ? { ...t, gpuTotal: Number(editTenant.gpuTotal), cpuTotal: Number(editTenant.cpuTotal), memTotal: Number(editTenant.memTotal), storageTotal: Number(editTenant.storageTotal) } : t));
    setSaving(false);
    toast.success('配额更新', `${editTenant.name} 配额已更新`);
    setEditTenant(null);
  };

  const approve = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' as const, reviewedAt: new Date().toLocaleString('zh-CN'), reviewer: '管理员', rejectReason: undefined } : r) as typeof prev);
    toast.success('已批准', '配额申请已批准，租户配额即将生效');
    setReviewReq(null);
  };
  const reject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const, reviewedAt: new Date().toLocaleString('zh-CN'), reviewer: '管理员', rejectReason } : r) as typeof prev);
    toast.warning('已拒绝', '配额申请已拒绝并通知申请人');
    setReviewReq(null);
    setRejectReason('');
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const toggleSelfManage = (tenantId: string) => {
    setWorkspaceData(prev => prev.map(t => t.tenantId === tenantId ? { ...t, selfManage: !t.selfManage } : t));
    const t = workspaceData.find(t => t.tenantId === tenantId);
    const next = t ? !t.selfManage : false;
    toast.success(next ? '已开启自主分配' : '已禁用自主分配', `${t?.tenant} 工作空间配额自主分配`);
  };

  const saveWs = async () => {
    if (!editWs) return;
    setSavingWs(true);
    await new Promise(r => setTimeout(r, 600));
    setWorkspaceData(prev => prev.map(td =>
      td.tenantId === editWs.tenantId
        ? { ...td, workspaces: td.workspaces.map(w => w.id === editWs.id
            ? { ...w, gpuAlloc: Number(editWs.gpuAlloc), cpuAlloc: Number(editWs.cpuAlloc), memAlloc: Number(editWs.memAlloc), storageAlloc: Number(editWs.storageAlloc) }
            : w) }
        : td
    ));
    setSavingWs(false);
    toast.success('工作空间配额已更新', `${editWs.name}`);
    setEditWs(null);
  };

  const specMap = new Map(mockComputeSpecs.map(spec => [spec.id, spec]));

  const specUsageRows = tenantSpecLimits
    .filter(limit => limit.tenantId === selectedSpecTenant)
    .filter(limit => {
      if (specTypeFilter === 'all') return true;
      return specMap.get(limit.specId)?.type === specTypeFilter;
    })
    .sort((a, b) => {
      const aSpec = specMap.get(a.specId)?.name ?? '';
      const bSpec = specMap.get(b.specId)?.name ?? '';
      return aSpec.localeCompare(bSpec, 'zh-Hans-CN');
    });

  const specSummaryRows = tenantSpecLimits.filter(limit => limit.tenantId === selectedSpecTenant);
  const totalSpecUsed = specSummaryRows.reduce((sum, item) => sum + item.usedCount, 0);
  const totalSpecMax = specSummaryRows.reduce((sum, item) => sum + item.maxCount, 0);
  const specAvgUsage = totalSpecMax > 0 ? Math.round((totalSpecUsed / totalSpecMax) * 100) : 0;
  const specRiskCount = specSummaryRows.filter(item => item.maxCount > 0 && Math.round((item.usedCount / item.maxCount) * 100) >= 85).length;

  const openCreateSpecLimit = () => {
    setSpecLimitForm({
      ...DEFAULT_SPEC_LIMIT_FORM,
      tenantId: selectedSpecTenant || TENANTS[0]?.id || '',
      specId: mockComputeSpecs[0]?.id ?? '',
      maxCount: '10',
    });
    setSpecLimitModalOpen(true);
  };

  const openEditSpecLimit = (limit: TenantSpecQuotaLimit) => {
    setSpecLimitForm({
      id: limit.id,
      tenantId: limit.tenantId,
      specId: limit.specId,
      maxCount: String(limit.maxCount),
    });
    setSpecLimitModalOpen(true);
  };

  const saveSpecLimit = async () => {
    const tenant = tenants.find(item => item.id === specLimitForm.tenantId);
    const spec = specMap.get(specLimitForm.specId);
    if (!tenant || !spec) {
      toast.warning('信息不完整', '请先选择租户与算力规格');
      return;
    }

    const maxCount = Math.max(0, Number(specLimitForm.maxCount) || 0);
    const current = tenantSpecLimits.find(limit => limit.id === specLimitForm.id);
    const usedCount = current?.usedCount ?? Math.min(maxCount, Math.round(maxCount * (0.3 + ((tenantSpecLimits.length + maxCount) % 4) * 0.12)));

    if (maxCount < usedCount) {
      toast.warning('上限设置过低', `上限不能低于当前已用数量 ${usedCount}`);
      return;
    }

    const duplicated = tenantSpecLimits.find(limit => (
      limit.tenantId === specLimitForm.tenantId
      && limit.specId === specLimitForm.specId
      && limit.id !== specLimitForm.id
    ));

    if (duplicated) {
      toast.warning('已存在规格上限', `${tenant.name} 已配置该规格上限，请直接编辑`);
      return;
    }

    const payload = {
      id: specLimitForm.id ?? `spec-limit-${tenant.id}-${spec.id}-${Date.now()}`,
      tenantId: tenant.id,
      tenant: tenant.name,
      specId: spec.id,
      maxCount,
      usedCount,
      updatedAt: new Date().toLocaleString('zh-CN'),
      updatedBy: '配额管理员',
    };

    setSavingSpecLimit(true);
    await new Promise(r => setTimeout(r, 380));

    if (specLimitForm.id) {
      setTenantSpecLimits(prev => prev.map(limit => (limit.id === specLimitForm.id ? payload : limit)));
      toast.success('规格上限已更新', `${tenant.name} / ${spec.name} 上限已生效`);
    } else {
      setTenantSpecLimits(prev => [payload, ...prev]);
      toast.success('规格上限已新增', `${tenant.name} 已完成 ${spec.name} 上限设置`);
    }

    setSavingSpecLimit(false);
    setSpecLimitModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="资源配额管理" subtitle="租户资源配额分配、用量可视化与申请审批工作流" icon={<PieChart size={20} />} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'GPU 配额使用率', value: `${Math.round(usedGpu / totalGpu * 100)}%`, sub: `${usedGpu} / ${totalGpu} 卡`, color: 'text-primary' },
          { label: '租户数量', value: TENANTS.length, sub: '已分配配额', color: 'text-accent' },
          { label: '待审批申请', value: pendingCount, sub: '需要处理', color: pendingCount > 0 ? 'text-warning' : 'text-success' },
          { label: '本月审批通过', value: requests.filter(r => r.status === 'approved').length, sub: '配额申请', color: 'text-success' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { key: 'overview', label: '配额总览', icon: <TrendingUp size={14} /> },
          { key: 'spec-limits', label: '规格上限', icon: <Users size={14} /> },
          { key: 'workspace', label: '工作空间配额', icon: <LayoutGrid size={14} /> },
          { key: 'requests', label: `审批工作流${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: <Clock size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {tenants.map(t => (
            <Card key={t.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Users size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">GPU 利用率 {Math.round(t.gpuUsed / t.gpuTotal * 100)}%</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" leftIcon={<Edit2 size={12} />}
                  onClick={() => setEditTenant({ ...t, gpuTotal: t.gpuTotal.toString(), cpuTotal: t.cpuTotal.toString(), memTotal: t.memTotal.toString(), storageTotal: t.storageTotal.toString() })}>
                  编辑
                </Button>
              </div>
              <div className="space-y-2.5">
                <ResourceBar label="GPU" used={t.gpuUsed} total={t.gpuTotal} unit=" 卡" />
                <ResourceBar label="CPU" used={t.cpuUsed} total={t.cpuTotal} unit=" 核" />
                <ResourceBar label="内存" used={t.memUsed} total={t.memTotal} unit="GB" />
                <ResourceBar label="存储" used={t.storageUsed} total={t.storageTotal} unit="TB" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'spec-limits' && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-text-primary">租户规格数量上限</p>
                <p className="text-xs text-text-muted mt-1">按租户与算力规格设置实例数量上限，规格数据来源于规格管理，支持差异化资源管控。</p>
              </div>
              <Button size="sm" leftIcon={<Edit2 size={12} />} onClick={openCreateSpecLimit}>新增规格上限</Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '已配置规格项', value: specSummaryRows.length, sub: '当前租户', color: 'text-primary' },
              { label: '总已用数量', value: totalSpecUsed, sub: `上限合计 ${totalSpecMax}`, color: 'text-accent' },
              { label: '平均使用率', value: `${specAvgUsage}%`, sub: '规格池平均', color: specAvgUsage >= 85 ? 'text-warning' : 'text-success' },
              { label: '预警规格数', value: specRiskCount, sub: '使用率 >= 85%', color: specRiskCount > 0 ? 'text-warning' : 'text-success' },
            ].map(item => (
              <Card key={item.label} className="p-4">
                <p className="text-xs text-text-muted mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{item.sub}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="租户"
                value={selectedSpecTenant}
                onChange={e => setSelectedSpecTenant(e.target.value)}
                options={tenants.map(tenant => ({ value: tenant.id, label: tenant.name }))}
              />
              <Select
                label="规格类型"
                value={specTypeFilter}
                onChange={e => setSpecTypeFilter(e.target.value as 'all' | ComputeSpecType)}
                options={SPEC_TYPE_OPTIONS}
              />
              <div className="flex items-end">
                <Button variant="outline" onClick={openCreateSpecLimit} className="w-full">新增规格上限</Button>
              </div>
            </div>
          </Card>

          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['规格名称', '规格类型', '资源描述', '已用 / 上限', '使用率', '最近更新', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specUsageRows.map(limit => {
                    const spec = specMap.get(limit.specId);
                    if (!spec) return null;

                    const ratio = limit.maxCount > 0 ? Math.min(100, Math.round((limit.usedCount / limit.maxCount) * 100)) : 0;
                    const typeLabel = spec.type === 'general' ? '通用算力' : spec.type === 'gpu' ? 'GPU' : 'vGPU';
                    const typeVariant = spec.type === 'general' ? 'secondary' : spec.type === 'gpu' ? 'accent' : 'success';
                    const usageVariant = ratio >= 90 ? 'error' : ratio >= 80 ? 'warning' : 'success';

                    return (
                      <tr key={limit.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-text-primary">{spec.name}</div>
                          <div className="text-xs text-text-muted mt-0.5">{spec.description}</div>
                        </td>
                        <td className="px-4 py-3"><Badge variant={typeVariant}>{typeLabel}</Badge></td>
                        <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                          CPU {spec.cpu} 核 / 内存 {spec.memoryGiB} GiB
                          {spec.gpuModel ? ` / ${spec.gpuModel}` : ''}
                          {spec.gpuCount ? ` x${spec.gpuCount}` : ''}
                          {spec.vgpuSliceGb ? ` / 切片 ${spec.vgpuSliceGb}GiB` : ''}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{limit.usedCount} / {limit.maxCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${ratio >= 90 ? 'bg-error' : ratio >= 80 ? 'bg-warning' : 'bg-primary'}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <Badge variant={usageVariant}>{ratio}%</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{limit.updatedAt}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost" leftIcon={<Edit2 size={12} />} onClick={() => openEditSpecLimit(limit)}>
                            编辑
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {specUsageRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                        当前筛选条件下暂无规格上限配置。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Workspace quota tab (需求79/80) */}
      {tab === 'workspace' && (
        <div className="space-y-4">
          {/* Platform → Tenant → Workspace breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="px-2 py-1 bg-primary/10 border border-primary/20 rounded text-primary">平台总量</span>
            <ChevronRight size={12} />
            <span className="px-2 py-1 bg-accent/10 border border-accent/20 rounded text-accent">租户配额</span>
            <ChevronRight size={12} />
            <span className="px-2 py-1 bg-success/10 border border-success/20 rounded text-success">工作空间配额</span>
            <span className="ml-2 text-text-muted">三层配额管理体系</span>
          </div>

          {/* Tenant selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">选择租户：</span>
            <div className="flex flex-wrap gap-2">
              {workspaceData.map(td => (
                <button key={td.tenantId} onClick={() => setSelectedTenant(td.tenantId)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedTenant === td.tenantId ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-text-muted hover:text-text-primary'}`}>
                  {td.tenant}
                </button>
              ))}
            </div>
          </div>

          {workspaceData.filter(td => td.tenantId === selectedTenant).map(td => (
            <div key={td.tenantId} className="space-y-4">
              {/* Self-manage toggle */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={15} className="text-accent" />
                      <span className="text-sm font-semibold text-text-primary">{td.tenant}</span>
                    </div>
                    <p className="text-xs text-text-muted">授权租户管理员自主分配工作空间级配额（开启后，该租户管理员可在其总配额内自行分配子工作空间）</p>
                  </div>
                  <button onClick={() => toggleSelfManage(td.tenantId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors shrink-0 ml-4 ${td.selfManage ? 'border-success/40 text-success bg-success/10' : 'border-border text-text-muted'}`}>
                    {td.selfManage ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    <span className="text-xs">{td.selfManage ? '自主分配已启用' : '启用自主分配'}</span>
                  </button>
                </div>
              </Card>

              {/* Workspace quota table */}
              <Card noPadding>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {['工作空间', 'GPU (已用/分配)', 'CPU (已用/分配)', '内存 (GB)', '存储 (TB)', '操作'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {td.workspaces.map(ws => (
                        <tr key={ws.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-success/15 flex items-center justify-center">
                                <LayoutGrid size={11} className="text-success" />
                              </div>
                              <span className="text-sm text-text-primary font-medium">{ws.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-text-secondary">{ws.gpuUsed} / {ws.gpuAlloc} 卡</div>
                            <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ws.gpuUsed / ws.gpuAlloc * 100)}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-text-secondary">{ws.cpuUsed} / {ws.cpuAlloc} 核</div>
                            <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, ws.cpuUsed / ws.cpuAlloc * 100)}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-text-secondary">{ws.memUsed} / {ws.memAlloc}</td>
                          <td className="px-4 py-3 text-xs text-text-secondary">{ws.storageUsed} / {ws.storageAlloc}</td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="ghost" leftIcon={<Edit2 size={12} />}
                              onClick={() => setEditWs({ ...ws, tenantId: td.tenantId, gpuAlloc: ws.gpuAlloc.toString(), cpuAlloc: ws.cpuAlloc.toString(), memAlloc: ws.memAlloc.toString(), storageAlloc: ws.storageAlloc.toString() })}>
                              分配
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['申请单号', '租户', '申请人', '资源类型', '现有配额 → 申请配额', '申请原因', '状态', '提交时间', '操作'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const sc = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-text-muted">{r.id}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{r.tenant}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{r.applicant}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{r.resource}</Badge></td>
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                        <span className="text-text-muted">{r.currentQuota}</span>
                        <span className="mx-1 text-text-muted">→</span>
                        <span className="text-success font-medium">{r.requestedQuota}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                      <td className="px-4 py-3">
                        <Badge variant={sc.variant}><span className="flex items-center gap-1">{sc.icon}{sc.label}</span></Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{r.submittedAt}</td>
                      <td className="px-4 py-3">
                        {r.status === 'pending' ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-success hover:bg-success/10"
                              leftIcon={<CheckCircle size={12} />} onClick={() => approve(r.id)}>批准</Button>
                            <Button size="sm" variant="ghost" className="text-error hover:bg-error/10"
                              leftIcon={<XCircle size={12} />} onClick={() => { setReviewReq(r); }}>拒绝</Button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">{r.reviewedAt}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={specLimitModalOpen} onClose={() => setSpecLimitModalOpen(false)} title={specLimitForm.id ? '编辑规格数量上限' : '新增规格数量上限'} width="md">
        <div className="space-y-4">
          <Select
            label="租户"
            value={specLimitForm.tenantId}
            onChange={e => setSpecLimitForm(prev => ({ ...prev, tenantId: e.target.value }))}
            options={tenants.map(tenant => ({ value: tenant.id, label: tenant.name }))}
          />
          <Select
            label="算力规格"
            value={specLimitForm.specId}
            onChange={e => setSpecLimitForm(prev => ({ ...prev, specId: e.target.value }))}
            options={mockComputeSpecs.map(spec => ({
              value: spec.id,
              label: `${spec.name} (${spec.type === 'general' ? '通用算力' : spec.type === 'gpu' ? 'GPU' : 'vGPU'})`,
            }))}
          />
          <Input
            label="数量上限"
            type="number"
            min={0}
            value={specLimitForm.maxCount}
            onChange={e => setSpecLimitForm(prev => ({ ...prev, maxCount: e.target.value }))}
          />
          {specLimitForm.id && (
            <p className="text-xs text-text-muted">保存后将立即应用新的规格上限策略，不影响当前正在运行的实例。</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSpecLimitModalOpen(false)}>取消</Button>
            <Button loading={savingSpecLimit} onClick={saveSpecLimit}>保存上限</Button>
          </div>
        </div>
      </Modal>

      {/* Edit quota modal */}
      <Modal open={!!editTenant} onClose={() => setEditTenant(null)} title={`编辑配额 - ${editTenant?.name}`} width="md">
        {editTenant && (
          <div className="space-y-4">
            <Input label="GPU 配额 (卡)" type="number" value={editTenant.gpuTotal} onChange={e => setEditTenant({ ...editTenant, gpuTotal: e.target.value })} />
            <Input label="CPU 配额 (核)" type="number" value={editTenant.cpuTotal} onChange={e => setEditTenant({ ...editTenant, cpuTotal: e.target.value })} />
            <Input label="内存配额 (GB)" type="number" value={editTenant.memTotal} onChange={e => setEditTenant({ ...editTenant, memTotal: e.target.value })} />
            <Input label="存储配额 (TB)" type="number" value={editTenant.storageTotal} onChange={e => setEditTenant({ ...editTenant, storageTotal: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditTenant(null)}>取消</Button>
              <Button loading={saving} onClick={save}>保存配额</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal open={!!reviewReq} onClose={() => setReviewReq(null)} title="拒绝原因" width="sm">
        {reviewReq && (
          <div className="space-y-4">
            <div className="text-sm text-text-secondary">申请单 <span className="font-mono text-text-primary">{reviewReq.id}</span> — {reviewReq.resource} {reviewReq.currentQuota} → {reviewReq.requestedQuota}</div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">拒绝原因 *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} required
                placeholder="请填写拒绝原因，将通知给申请人…"
                className="w-full px-3 py-2 text-sm bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setReviewReq(null)}>取消</Button>
              <Button className="bg-error/80 hover:bg-error" leftIcon={<XCircle size={14} />} onClick={() => reject(reviewReq.id)} disabled={!rejectReason.trim()}>确认拒绝</Button>
            </div>
          </div>
        )}
      </Modal>
      {/* Workspace quota edit modal */}
      <Modal open={!!editWs} onClose={() => setEditWs(null)} title={`分配工作空间配额 - ${editWs?.name}`} width="md">
        {editWs && (
          <div className="space-y-4">
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs text-text-muted">
              配额分配上限受租户总配额限制。超出租户总配额的输入将被拒绝。
            </div>
            <Input label="GPU 配额 (卡)" type="number" min={editWs.gpuUsed} value={editWs.gpuAlloc} onChange={e => setEditWs({ ...editWs, gpuAlloc: e.target.value })} />
            <Input label="CPU 配额 (核)" type="number" min={editWs.cpuUsed} value={editWs.cpuAlloc} onChange={e => setEditWs({ ...editWs, cpuAlloc: e.target.value })} />
            <Input label="内存配额 (GB)" type="number" min={editWs.memUsed} value={editWs.memAlloc} onChange={e => setEditWs({ ...editWs, memAlloc: e.target.value })} />
            <Input label="存储配额 (TB)" type="number" min={editWs.storageUsed} value={editWs.storageAlloc} onChange={e => setEditWs({ ...editWs, storageAlloc: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditWs(null)}>取消</Button>
              <Button loading={savingWs} onClick={saveWs}>保存配额</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
