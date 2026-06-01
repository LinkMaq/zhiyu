import { useState } from 'react';
import { Boxes, Edit2, Settings2, BarChart2, Users, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { K8sCluster, ResourcePool, ComputeSpecType, ComputeSpec, TenantSpecLimit } from '../../../types';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Tabs } from '../../../components/ui/Tabs';
import { ResourceBar } from '../../../components/charts/Charts';
import { useToast } from '../../../hooks/useToast';
import { mockResourcePools, mockComputeSpecs, mockTenantSpecLimits } from '../../../data/mockData';
import { useClusters } from '../../../contexts/ClusterContext';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Select } from '../../../components/ui/Input';

const SCHEDULING_ALGOS = [
  { key: 'binpack', label: 'Binpack', desc: '优先填满单节点，减少碎片' },
  { key: 'spread', label: 'Spread', desc: '分散调度，提高高可用性' },
  { key: 'drf', label: 'DRF', desc: '主导资源公平调度，多租户均衡' },
  { key: 'priority', label: 'Priority', desc: '按任务优先级抢占式调度' },
];

const ALG_COLORS: Record<string, any> = { binpack: 'primary', spread: 'accent', drf: 'success', priority: 'warning', random: 'ghost' };

const DRF_WEIGHTS = [
  { tenant: '中国移动云能力中心', gpuWeight: 40, cpuWeight: 35, memWeight: 30 },
  { tenant: '中国电信天翼云', gpuWeight: 30, cpuWeight: 30, memWeight: 35 },
  { tenant: '中国联通沃云', gpuWeight: 20, cpuWeight: 25, memWeight: 25 },
  { tenant: '国防科技大学', gpuWeight: 10, cpuWeight: 10, memWeight: 10 },
];

type PoolHostMap = Record<string, string[]>;

interface CreatePoolForm {
  name: string;
  type: 'shared' | 'dedicated';
  namespace: string;
  hosts: string[];
}

interface SpecForm {
  id?: string;
  name: string;
  type: ComputeSpecType;
  cpu: string;
  memoryGiB: string;
  gpuModel: string;
  gpuCount: string;
  vgpuSliceGb: string;
  description: string;
}

interface TenantLimitForm {
  id?: string;
  tenant: string;
  specId: string;
  maxCount: string;
}

interface PriorityClass {
  id: string;
  name: string;
  priority: number;
  preemptible: boolean;
  desc: string;
}

interface PriorityClassForm {
  id?: string;
  name: string;
  priority: string;
  preemptible: 'true' | 'false';
  desc: string;
}

const COMPUTE_SPEC_TYPES: { value: ComputeSpecType; label: string }[] = [
  { value: 'general', label: '通用算力' },
  { value: 'gpu', label: 'GPU 算力' },
  { value: 'vgpu', label: 'vGPU 算力' },
];

const GPU_MODEL_OPTIONS = [
  { value: '', label: '请选择 GPU 型号' },
  { value: 'NVIDIA A100 80GB', label: 'NVIDIA A100 80GB' },
  { value: 'NVIDIA H100 80GB', label: 'NVIDIA H100 80GB' },
  { value: 'NVIDIA H20 96GB', label: 'NVIDIA H20 96GB' },
  { value: 'NVIDIA V100 32GB', label: 'NVIDIA V100 32GB' },
  { value: 'NVIDIA RTX 4090 24GB', label: 'NVIDIA RTX 4090 24GB' },
  { value: 'Huawei Ascend 910B', label: 'Huawei Ascend 910B' },
  { value: 'Cambricon MLU370-X8', label: 'Cambricon MLU370-X8' },
  { value: 'Biren BR104', label: 'Biren BR104' },
];

const INITIAL_PRIORITY_CLASSES: PriorityClass[] = [
  { id: 'priority-critical', name: 'critical', priority: 1000, preemptible: false, desc: '关键业务，不可抢占' },
  { id: 'priority-high', name: 'high', priority: 500, preemptible: false, desc: '高优先级任务' },
  { id: 'priority-normal', name: 'normal', priority: 100, preemptible: true, desc: '普通任务，可被抢占' },
  { id: 'priority-low', name: 'low', priority: 10, preemptible: true, desc: '低优先级批量任务' },
];

const INITIAL_SPEC_FORM: SpecForm = {
  name: '',
  type: 'general',
  cpu: '8',
  memoryGiB: '32',
  gpuModel: '',
  gpuCount: '1',
  vgpuSliceGb: '10',
  description: '',
};

const INITIAL_TENANT_LIMIT_FORM: TenantLimitForm = {
  tenant: DRF_WEIGHTS[0]?.tenant ?? '',
  specId: mockComputeSpecs[0]?.id ?? '',
  maxCount: '10',
};

const INITIAL_PRIORITY_FORM: PriorityClassForm = {
  name: '',
  priority: '100',
  preemptible: 'true',
  desc: '',
};

const INITIAL_CREATE_FORM: CreatePoolForm = {
  name: '',
  type: 'shared',
  namespace: '',
  hosts: [],
};

function parseNodeCpu(cpu: string) {
  return Number.parseInt(cpu.replace(/[^\d]/g, ''), 10) || 0;
}

function parseNodeMemory(memory: string) {
  return Number.parseInt(memory.replace(/[^\d]/g, ''), 10) || 0;
}

function toNamespace(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function buildInitialPoolHosts(pools: ResourcePool[], clusters: K8sCluster[]): PoolHostMap {
  const clusterNodes = new Map(clusters.map(cluster => [cluster.id, cluster.nodes]));
  const occupiedByCluster = new Map<string, Set<string>>();
  const result: PoolHostMap = {};

  pools.forEach(pool => {
    const nodes = clusterNodes.get(pool.clusterId) ?? [];
    const occupied = occupiedByCluster.get(pool.clusterId) ?? new Set<string>();
    occupiedByCluster.set(pool.clusterId, occupied);

    const preferred = nodes.find(node => node.gpuType === pool.gpuType && !occupied.has(node.name));
    const fallback = nodes.find(node => !occupied.has(node.name));
    const selectedHost = preferred?.name ?? fallback?.name;

    result[pool.id] = selectedHost ? [selectedHost] : [];
    if (selectedHost) occupied.add(selectedHost);
  });

  return result;
}

export default function ResourceManagement() {
  const { clusters, selectedCluster, selectedClusterId, setSelectedClusterId } = useClusters();
  const [pools, setPools] = useState(mockResourcePools);
  const [poolHosts, setPoolHosts] = useState<PoolHostMap>(() => buildInitialPoolHosts(mockResourcePools, clusters));
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePoolForm>(INITIAL_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [editPool, setEditPool] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('pools');
  const [specs, setSpecs] = useState<ComputeSpec[]>(() => mockComputeSpecs.map(spec => ({ ...spec })));
  const [tenantLimits, setTenantLimits] = useState<TenantSpecLimit[]>(() => mockTenantSpecLimits.map(limit => ({ ...limit })));
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [specForm, setSpecForm] = useState<SpecForm>(INITIAL_SPEC_FORM);
  const [savingSpec, setSavingSpec] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [tenantLimitForm, setTenantLimitForm] = useState<TenantLimitForm>(INITIAL_TENANT_LIMIT_FORM);
  const [savingTenantLimit, setSavingTenantLimit] = useState(false);
  const [priorityClasses, setPriorityClasses] = useState<PriorityClass[]>(INITIAL_PRIORITY_CLASSES);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [priorityForm, setPriorityForm] = useState<PriorityClassForm>(INITIAL_PRIORITY_FORM);
  const [savingPriority, setSavingPriority] = useState(false);
  const [pendingDeletePriority, setPendingDeletePriority] = useState<PriorityClass | null>(null);
  const { toast } = useToast();

  const filteredPools = selectedCluster
    ? pools.filter(pool => pool.clusterId === selectedCluster.id)
    : pools;

  const hostOwnerMap = new Map<string, string>();
  pools.forEach(pool => {
    const hosts = poolHosts[pool.id] ?? [];
    hosts.forEach(host => {
      hostOwnerMap.set(`${pool.clusterId}:${host}`, pool.name);
    });
  });

  const selectedClusterNodes = selectedCluster?.nodes ?? [];
  const tenantOptions = DRF_WEIGHTS.map(weight => ({ value: weight.tenant, label: weight.tenant }));
  const specOptions = specs.map(spec => ({ value: spec.id, label: `${spec.name} (${spec.type.toUpperCase()})` }));

  const getSpecById = (specId: string) => specs.find(spec => spec.id === specId);
  const sortedPriorityClasses = [...priorityClasses].sort((a, b) => b.priority - a.priority);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('更新成功', `资源池 ${editPool.name} 配置已更新`);
    setEditPool(null);
  };

  const chartData = filteredPools.map(p => ({
    name: p.name.length > 8 ? p.name.slice(0, 8) + '…' : p.name,
    GPU已用: p.gpuUsed, GPU空闲: p.gpuTotal - p.gpuUsed,
    CPU已用: p.cpuUsed, CPU空闲: p.cpuTotal - p.cpuUsed,
  }));

  const resetCreateForm = () => {
    setCreateForm(INITIAL_CREATE_FORM);
  };

  const openCreateModal = () => {
    if (!selectedCluster) {
      toast.warning('请先选择集群', '资源池必须基于当前集群创建');
      return;
    }
    setCreateOpen(true);
    resetCreateForm();
  };

  const toggleHost = (hostName: string, disabled: boolean) => {
    if (disabled) return;
    setCreateForm(prev => {
      const nextHosts = prev.hosts.includes(hostName)
        ? prev.hosts.filter(host => host !== hostName)
        : [...prev.hosts, hostName];
      return { ...prev, hosts: nextHosts };
    });
  };

  const createPool = async () => {
    if (!selectedCluster) {
      toast.error('创建失败', '未选择集群');
      return;
    }
    const name = createForm.name.trim();
    if (!name) {
      toast.warning('缺少资源池名称', '请输入资源池名称后再创建');
      return;
    }
    if (createForm.hosts.length === 0) {
      toast.warning('请选择主机', '资源池至少需要选择一台主机');
      return;
    }

    const conflictHost = createForm.hosts.find(host => hostOwnerMap.has(`${selectedCluster.id}:${host}`));
    if (conflictHost) {
      toast.error('主机冲突', `${conflictHost} 已加入其他资源池，不能重复分配`);
      return;
    }

    const hostMap = new Map(selectedCluster.nodes.map(node => [node.name, node]));
    const selectedNodes = createForm.hosts.map(host => hostMap.get(host)).filter(Boolean);

    const cpuTotal = selectedNodes.reduce((sum, node) => sum + parseNodeCpu(node!.cpu), 0);
    const memoryTotal = selectedNodes.reduce((sum, node) => sum + parseNodeMemory(node!.memory), 0);
    const gpuTotal = selectedNodes.reduce((sum, node) => sum + (node!.gpuCount ?? 0), 0);
    const gpuTypes = Array.from(new Set(selectedNodes.map(node => node!.gpuType).filter(Boolean))) as string[];
    const namespace = createForm.namespace.trim() || toNamespace(name) || `pool-${Date.now()}`;

    setCreating(true);
    await new Promise(r => setTimeout(r, 500));

    const newPool: ResourcePool = {
      id: `rp${Date.now().toString().slice(-6)}`,
      name,
      type: createForm.type,
      cluster: selectedCluster.name,
      clusterId: selectedCluster.id,
      namespace,
      gpuType: gpuTypes.length === 0 ? 'CPU Only' : gpuTypes.length === 1 ? gpuTypes[0] : 'Mixed GPU',
      gpuTotal,
      gpuUsed: 0,
      cpuTotal,
      cpuUsed: 0,
      memoryTotal: `${memoryTotal}Gi`,
      memoryUsed: '0Gi',
      tenants: [],
      scheduleAlgos: ['spread'],
      status: 'active',
      createdAt: new Date().toISOString(),
      utilization: 0,
      queuedJobs: 0,
    };

    setPools(prev => [newPool, ...prev]);
    setPoolHosts(prev => ({ ...prev, [newPool.id]: [...createForm.hosts] }));
    setCreating(false);
    setCreateOpen(false);
    resetCreateForm();
    toast.success('资源池创建成功', `${newPool.name} 已创建并绑定 ${newPool.cluster} 集群主机`);
  };

  const openCreateSpecModal = () => {
    setSpecForm(INITIAL_SPEC_FORM);
    setSpecModalOpen(true);
  };

  const openEditSpecModal = (spec: ComputeSpec) => {
    setSpecForm({
      id: spec.id,
      name: spec.name,
      type: spec.type,
      cpu: String(spec.cpu),
      memoryGiB: String(spec.memoryGiB),
      gpuModel: spec.gpuModel ?? '',
      gpuCount: String(spec.gpuCount ?? 1),
      vgpuSliceGb: String(spec.vgpuSliceGb ?? 10),
      description: spec.description,
    });
    setSpecModalOpen(true);
  };

  const saveSpec = async () => {
    const name = specForm.name.trim();
    if (!name) {
      toast.warning('请输入规格名称', '规格名称不能为空');
      return;
    }

    const cpu = Math.max(1, Number(specForm.cpu) || 1);
    const memoryGiB = Math.max(1, Number(specForm.memoryGiB) || 1);
    const gpuRequired = specForm.type === 'gpu' || specForm.type === 'vgpu';
    const gpuModel = gpuRequired ? specForm.gpuModel.trim() : '';

    if (gpuRequired && !gpuModel) {
      toast.warning('请填写 GPU 型号', 'GPU/vGPU 规格必须配置 GPU 型号');
      return;
    }

    const gpuCount = gpuRequired ? Math.max(1, Number(specForm.gpuCount) || 1) : undefined;
    const vgpuSliceGb = specForm.type === 'vgpu' ? Math.max(1, Number(specForm.vgpuSliceGb) || 1) : undefined;

    const payload: ComputeSpec = {
      id: specForm.id ?? `spec-${Date.now()}`,
      name,
      type: specForm.type,
      cpu,
      memoryGiB,
      gpuModel: gpuRequired ? gpuModel : undefined,
      gpuCount,
      vgpuSliceGb,
      description: specForm.description.trim() || '自定义规格',
      status: 'active',
    };

    setSavingSpec(true);
    await new Promise(resolve => setTimeout(resolve, 450));

    if (specForm.id) {
      setSpecs(prev => prev.map(spec => (spec.id === specForm.id ? { ...spec, ...payload } : spec)));
      toast.success('规格已更新', `${payload.name} 已完成配置更新`);
    } else {
      setSpecs(prev => [payload, ...prev]);
      toast.success('规格已创建', `${payload.name} 已加入算力规格池`);
    }

    setSavingSpec(false);
    setSpecModalOpen(false);
    setSpecForm(INITIAL_SPEC_FORM);
  };

  const toggleSpecStatus = (specId: string) => {
    setSpecs(prev => prev.map(spec => {
      if (spec.id !== specId) return spec;
      return { ...spec, status: spec.status === 'active' ? 'disabled' : 'active' };
    }));
  };

  const openTenantLimitModal = () => {
    setTenantLimitForm({
      ...INITIAL_TENANT_LIMIT_FORM,
      specId: specs[0]?.id ?? '',
      tenant: DRF_WEIGHTS[0]?.tenant ?? '',
    });
    setLimitModalOpen(true);
  };

  const saveTenantLimit = async () => {
    if (!tenantLimitForm.tenant || !tenantLimitForm.specId) {
      toast.warning('信息不完整', '请选择租户和规格后再保存');
      return;
    }

    const maxCount = Math.max(0, Number(tenantLimitForm.maxCount) || 0);
    const existed = tenantLimits.find(limit => limit.tenant === tenantLimitForm.tenant && limit.specId === tenantLimitForm.specId);

    setSavingTenantLimit(true);
    await new Promise(resolve => setTimeout(resolve, 350));

    if (existed) {
      setTenantLimits(prev => prev.map(limit => (
        limit.id === existed.id ? { ...limit, maxCount } : limit
      )));
      toast.success('上限已更新', `${tenantLimitForm.tenant} 的规格上限已调整`);
    } else {
      setTenantLimits(prev => [
        {
          id: `limit-${Date.now()}`,
          tenant: tenantLimitForm.tenant,
          specId: tenantLimitForm.specId,
          maxCount,
          usedCount: 0,
        },
        ...prev,
      ]);
      toast.success('上限已新增', `${tenantLimitForm.tenant} 已新增规格数量上限`);
    }

    setSavingTenantLimit(false);
    setLimitModalOpen(false);
  };

  const openCreatePriorityModal = () => {
    setPriorityForm(INITIAL_PRIORITY_FORM);
    setPriorityModalOpen(true);
  };

  const openEditPriorityModal = (priorityClass: PriorityClass) => {
    setPriorityForm({
      id: priorityClass.id,
      name: priorityClass.name,
      priority: String(priorityClass.priority),
      preemptible: priorityClass.preemptible ? 'true' : 'false',
      desc: priorityClass.desc,
    });
    setPriorityModalOpen(true);
  };

  const savePriorityClass = async () => {
    const name = priorityForm.name.trim();
    const priority = Math.max(0, Number(priorityForm.priority) || 0);
    const desc = priorityForm.desc.trim();

    if (!name) {
      toast.warning('请输入优先级类名称', '名称不能为空');
      return;
    }

    const existed = priorityClasses.find(item => item.name.toLowerCase() === name.toLowerCase() && item.id !== priorityForm.id);
    if (existed) {
      toast.warning('名称已存在', '请使用不同的优先级类名称');
      return;
    }

    setSavingPriority(true);
    await new Promise(resolve => setTimeout(resolve, 350));

    const payload: PriorityClass = {
      id: priorityForm.id ?? `priority-${Date.now()}`,
      name,
      priority,
      preemptible: priorityForm.preemptible === 'true',
      desc: desc || '自定义优先级类',
    };

    if (priorityForm.id) {
      setPriorityClasses(prev => prev.map(item => (item.id === priorityForm.id ? payload : item)));
      toast.success('优先级类已更新', `${payload.name} 配置已更新`);
    } else {
      setPriorityClasses(prev => [...prev, payload]);
      toast.success('优先级类已创建', `${payload.name} 已加入优先级类列表`);
    }

    setSavingPriority(false);
    setPriorityModalOpen(false);
    setPriorityForm(INITIAL_PRIORITY_FORM);
  };

  const deletePriorityClass = async () => {
    if (!pendingDeletePriority) return;

    const target = pendingDeletePriority;
    await new Promise(resolve => setTimeout(resolve, 250));
    setPriorityClasses(prev => prev.filter(item => item.id !== target.id));
    setPendingDeletePriority(null);
    toast.success('优先级类已删除', `${target.name} 已从优先级类列表移除`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="资源池管理" subtitle="GPU 资源池分配、调度策略与优先级类管理" icon={<Boxes size={20} />} />

      <div className="max-w-sm">
        <Select
          label="当前集群"
          value={selectedClusterId}
          onChange={e => setSelectedClusterId(e.target.value)}
          options={clusters.map(cluster => ({ value: cluster.id, label: `${cluster.name} (${cluster.region})` }))}
        />
      </div>

      <Tabs
        tabs={[
          { key: 'pools', label: '资源池', icon: <BarChart2 size={14} /> },
          { key: 'specs', label: '规格管理', icon: <Settings2 size={14} /> },
          { key: 'scheduling', label: '调度策略', icon: <Settings2 size={14} /> },
          { key: 'drf', label: 'DRF 权重', icon: <Users size={14} /> },
          { key: 'priority', label: '优先级类', icon: <Boxes size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'specs' && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">算力规格管理</p>
                <p className="text-xs text-text-muted mt-1">支持定义通用算力、GPU、vGPU 规格，并对不同租户设置规格数量上限，实现精细化资源管控。</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                <Badge variant="primary">通用算力</Badge>
                <Badge variant="accent">GPU</Badge>
                <Badge variant="success">vGPU</Badge>
              </div>
            </div>
          </Card>

          <Card noPadding>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-text-primary">规格清单</h3>
              <Button size="sm" leftIcon={<Plus size={12} />} onClick={openCreateSpecModal}>新增规格</Button>
            </div>
            <div className="divide-y divide-border/40">
              {specs.map(spec => (
                <div key={spec.id} className="px-5 py-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary">{spec.name}</p>
                      <Badge variant={spec.type === 'general' ? 'secondary' : spec.type === 'gpu' ? 'accent' : 'success'}>
                        {spec.type === 'general' ? '通用算力' : spec.type === 'gpu' ? 'GPU' : 'vGPU'}
                      </Badge>
                      <Badge variant={spec.status === 'active' ? 'success' : 'ghost'}>{spec.status === 'active' ? '启用中' : '已停用'}</Badge>
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-3 flex-wrap">
                      <span>CPU {spec.cpu} 核</span>
                      <span>内存 {spec.memoryGiB} GiB</span>
                      {spec.gpuModel && <span>GPU {spec.gpuModel}</span>}
                      {spec.gpuCount && <span>数量 x{spec.gpuCount}</span>}
                      {spec.vgpuSliceGb && <span>切片 {spec.vgpuSliceGb} GiB</span>}
                    </div>
                    <p className="text-xs text-text-muted">{spec.description}</p>
                  </div>
                  <div className="flex items-center gap-2 self-end xl:self-center">
                    <Button size="sm" variant="ghost" onClick={() => openEditSpecModal(spec)}>编辑规格</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        toggleSpecStatus(spec.id);
                        const nextStatus = spec.status === 'active' ? '停用' : '启用';
                        toast.success('规格状态更新', `${spec.name} 已${nextStatus}`);
                      }}
                    >
                      {spec.status === 'active' ? '停用' : '启用'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card noPadding>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-text-primary">租户规格数量上限</h3>
              <Button size="sm" variant="outline" leftIcon={<Plus size={12} />} onClick={openTenantLimitModal}>设置租户上限</Button>
            </div>
            <div className="overflow-x-auto px-5 py-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    {['租户', '规格', '规格类型', '已用数量', '上限数量', '使用率'].map(head => (
                      <th key={head} className="text-left pb-3 pr-4 font-medium whitespace-nowrap">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  {tenantLimits.map(limit => {
                    const spec = getSpecById(limit.specId);
                    const ratio = limit.maxCount > 0 ? Math.min(100, Math.round((limit.usedCount / limit.maxCount) * 100)) : 0;
                    return (
                      <tr key={limit.id} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2 pr-4 text-text-primary font-medium">{limit.tenant}</td>
                        <td className="py-2 pr-4">{spec?.name ?? '未知规格'}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={spec?.type === 'gpu' ? 'accent' : spec?.type === 'vgpu' ? 'success' : 'secondary'}>
                            {spec?.type === 'gpu' ? 'GPU' : spec?.type === 'vgpu' ? 'vGPU' : '通用算力'}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">{limit.usedCount}</td>
                        <td className="py-2 pr-4">{limit.maxCount}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${ratio >= 85 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${ratio}%` }} />
                            </div>
                            <span>{ratio}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'pools' && (
        <>
          <div className="flex justify-end">
            <Button size="sm" leftIcon={<Plus size={12} />} onClick={openCreateModal}>
              创建资源池
            </Button>
          </div>
          {filteredPools.length === 0 && (
            <Card>
              <EmptyState title="当前集群暂无资源池" description="请先在该集群下创建资源池或切换其他集群查看。" />
            </Card>
          )}
          {filteredPools.length > 0 && (
            <>
              <Card noPadding>
                <div className="px-5 py-4 border-b border-border">
                  <span className="text-sm font-semibold text-text-primary">资源利用率概览</span>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="GPU已用" stackId="gpu" fill="#3B82F6" radius={[0,0,0,0]} />
                      <Bar dataKey="GPU空闲" stackId="gpu" fill="#1E2D47" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPools.map(pool => (
                  <Card key={pool.id} glow={pool.utilization > 80}>
                {(() => {
                  const hosts = poolHosts[pool.id] ?? [];
                  return (
                    <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-text-primary">{pool.name}</h3>
                      {pool.scheduleAlgos.slice(0, 2).map((a: string) => (
                        <Badge key={a} variant={ALG_COLORS[a] ?? 'ghost'}>{a.toUpperCase()}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-text-muted">{pool.tenants.length} 个租户 · 优先级调度</p>
                  </div>
                  <Button size="sm" variant="ghost" leftIcon={<Edit2 size={12} />} onClick={() => setEditPool({ ...pool, maxGpu: pool.gpuTotal.toString(), selectedAlgos: [...pool.scheduleAlgos] })}>
                    编辑
                  </Button>
                </div>
                <div className="space-y-2">
                  <ResourceBar label="GPU 利用率" used={pool.gpuUsed} total={pool.gpuTotal} unit=" 卡" />
                  <ResourceBar label="CPU 利用率" used={pool.cpuUsed} total={pool.cpuTotal} unit=" 核" />
                  <ResourceBar label="内存利用率" used={parseFloat(pool.memoryUsed)} total={parseFloat(pool.memoryTotal)} unit="GB" />
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-text-muted">
                  <span>总 GPU: <span className="text-text-secondary">{pool.gpuTotal} 卡</span></span>
                  <span>利用率: <span className={pool.utilization > 80 ? 'text-warning' : 'text-success'}>{pool.utilization}%</span></span>
                </div>
                <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted space-y-1">
                  <p>绑定主机: <span className="text-text-secondary">{hosts.length} 台</span></p>
                  <p className="text-text-secondary break-all">{hosts.length ? hosts.join('、') : '暂无绑定主机'}</p>
                </div>
                    </>
                  );
                })()}
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'scheduling' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCHEDULING_ALGOS.map(alg => (
              <Card key={alg.key} className="hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Settings2 size={15} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">{alg.label}</span>
                        <Badge variant={ALG_COLORS[alg.key] ?? 'ghost'}>{alg.key}</Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{alg.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={alg.key === 'binpack' || alg.key === 'priority'} className="sr-only peer" />
                    <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                {alg.key === 'drf' && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-text-muted mb-1.5">DRF 主导资源维度</p>
                    <div className="flex gap-2">
                      {['GPU', 'CPU', 'Memory'].map(r => (
                        <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="drf-resource" defaultChecked={r === 'GPU'} className="accent-primary" />
                          <span className="text-xs text-text-secondary">{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => toast.success('策略已保存', '调度策略配置已更新生效')}>保存调度配置</Button>
          </div>
        </div>
      )}

      {tab === 'drf' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">DRF 租户权重配置</h3>
            <Button size="sm" variant="outline" leftIcon={<Plus size={12} />} onClick={() => toast.info('功能提示', '租户权重配置面板已打开，可调整各项权重分配')}>添加租户权重</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-border">
                  {['租户名称', 'GPU 权重', 'CPU 权重', '内存权重', '操作'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {DRF_WEIGHTS.map((w, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 pr-4 font-medium text-text-primary">{w.tenant}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${w.gpuWeight}%` }} />
                        </div>
                        <span>{w.gpuWeight}%</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${w.cpuWeight}%` }} />
                        </div>
                        <span>{w.cpuWeight}%</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: `${w.memWeight}%` }} />
                        </div>
                        <span>{w.memWeight}%</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <button className="text-primary hover:text-primary/80 transition-colors mr-2">编辑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'priority' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">优先级类管理</h3>
              <Button size="sm" variant="outline" leftIcon={<Plus size={12} />} onClick={openCreatePriorityModal}>新建优先级类</Button>
            </div>
            {sortedPriorityClasses.length === 0 ? (
              <EmptyState title="暂无优先级类" description="请先新增优先级类，再用于任务调度控制。" />
            ) : (
              <div className="space-y-2">
                {sortedPriorityClasses.map(pc => (
                  <div key={pc.id} className="flex items-center gap-4 bg-base rounded-xl border border-border px-4 py-3 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
                        {pc.priority}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-text-primary">{pc.name}</span>
                          <Badge variant={pc.preemptible ? 'warning' : 'ghost'}>{pc.preemptible ? '可抢占' : '不可抢占'}</Badge>
                        </div>
                        <p className="text-xs text-text-muted">{pc.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-colors"
                        onClick={() => openEditPriorityModal(pc)}
                        aria-label={`编辑 ${pc.name}`}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                        onClick={() => setPendingDeletePriority(pc)}
                        aria-label={`删除 ${pc.name}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal open={!!editPool} onClose={() => setEditPool(null)} title="编辑资源池" width="md">
        {editPool && (
          <div className="space-y-4">
            <Input label="资源池名称" value={editPool.name} onChange={e => setEditPool({ ...editPool, name: e.target.value })} />
            <Input label="GPU 总量 (卡)" type="number" value={editPool.maxGpu} onChange={e => setEditPool({ ...editPool, maxGpu: e.target.value })} />
            <div>
              <p className="text-xs text-text-muted mb-2">调度算法（多选）</p>
              <div className="flex flex-wrap gap-2">
                {SCHEDULING_ALGOS.map(alg => {
                  const active = editPool.selectedAlgos?.includes(alg.key);
                  return (
                    <button key={alg.key}
                      onClick={() => {
                        const algos = active
                          ? editPool.selectedAlgos.filter((a: string) => a !== alg.key)
                          : [...(editPool.selectedAlgos ?? []), alg.key];
                        setEditPool({ ...editPool, selectedAlgos: algos });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-border text-text-muted hover:bg-white/10'}`}
                    >
                      {alg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditPool(null)}>取消</Button>
              <Button loading={saving} onClick={save}>保存更改</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="创建资源池" width="md">
        <div className="space-y-4">
          <Input
            label="资源池名称"
            value={createForm.name}
            onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例如：训练共享池"
          />
          <Select
            label="资源池类型"
            value={createForm.type}
            onChange={e => setCreateForm(prev => ({ ...prev, type: e.target.value as 'shared' | 'dedicated' }))}
            options={[
              { value: 'shared', label: '共享池 (shared)' },
              { value: 'dedicated', label: '专属池 (dedicated)' },
            ]}
          />
          <Input
            label="命名空间（可选）"
            value={createForm.namespace}
            onChange={e => setCreateForm(prev => ({ ...prev, namespace: e.target.value }))}
            placeholder="留空将按名称自动生成"
          />

          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">选择主机（仅当前集群）</p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedClusterNodes.map(node => {
                const ownerPool = selectedCluster ? hostOwnerMap.get(`${selectedCluster.id}:${node.name}`) : undefined;
                const disabled = Boolean(ownerPool);
                const checked = createForm.hosts.includes(node.name);

                return (
                  <label key={node.name} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${disabled ? 'border-border/40 opacity-50 cursor-not-allowed' : 'border-border hover:border-primary/40 cursor-pointer'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleHost(node.name, disabled)}
                        className="accent-primary"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-text-primary truncate">{node.name}</p>
                        <p className="text-[11px] text-text-muted">{node.role} · {node.cpu} · {node.memory} {node.gpuType ? `· ${node.gpuType} x${node.gpuCount ?? 0}` : ''}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-text-muted text-right">{ownerPool ? `已在 ${ownerPool}` : '可分配'}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-text-muted mt-2">规则：主机必须来自当前集群，且已加入其他资源池的主机不可重复加入。</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button loading={creating} onClick={createPool}>创建</Button>
          </div>
        </div>
      </Modal>

      <Modal open={specModalOpen} onClose={() => setSpecModalOpen(false)} title={specForm.id ? '编辑算力规格' : '新增算力规格'} width="md">
        <div className="space-y-4">
          <Input
            label="规格名称"
            value={specForm.name}
            onChange={e => setSpecForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例如 A100-80G x1"
          />
          <Select
            label="规格类型"
            value={specForm.type}
            onChange={e => setSpecForm(prev => ({ ...prev, type: e.target.value as ComputeSpecType }))}
            options={COMPUTE_SPEC_TYPES}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="CPU (核)"
              type="number"
              min={1}
              value={specForm.cpu}
              onChange={e => setSpecForm(prev => ({ ...prev, cpu: e.target.value }))}
            />
            <Input
              label="内存 (GiB)"
              type="number"
              min={1}
              value={specForm.memoryGiB}
              onChange={e => setSpecForm(prev => ({ ...prev, memoryGiB: e.target.value }))}
            />
          </div>

          {(specForm.type === 'gpu' || specForm.type === 'vgpu') && (
            <>
              <Select
                label="GPU 型号"
                value={specForm.gpuModel}
                onChange={e => setSpecForm(prev => ({ ...prev, gpuModel: e.target.value }))}
                options={GPU_MODEL_OPTIONS}
              />
              <Input
                label="GPU 数量"
                type="number"
                min={1}
                value={specForm.gpuCount}
                onChange={e => setSpecForm(prev => ({ ...prev, gpuCount: e.target.value }))}
              />
            </>
          )}

          {specForm.type === 'vgpu' && (
            <Input
              label="vGPU 切片大小 (GiB)"
              type="number"
              min={1}
              value={specForm.vgpuSliceGb}
              onChange={e => setSpecForm(prev => ({ ...prev, vgpuSliceGb: e.target.value }))}
            />
          )}

          <Input
            label="规格说明"
            value={specForm.description}
            onChange={e => setSpecForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="描述该规格的适用业务场景"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSpecModalOpen(false)}>取消</Button>
            <Button loading={savingSpec} onClick={saveSpec}>保存规格</Button>
          </div>
        </div>
      </Modal>

      <Modal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} title="设置租户规格上限" width="md">
        <div className="space-y-4">
          <Select
            label="租户"
            value={tenantLimitForm.tenant}
            onChange={e => setTenantLimitForm(prev => ({ ...prev, tenant: e.target.value }))}
            options={tenantOptions}
          />
          <Select
            label="算力规格"
            value={tenantLimitForm.specId}
            onChange={e => setTenantLimitForm(prev => ({ ...prev, specId: e.target.value }))}
            options={specOptions}
          />
          <Input
            label="数量上限"
            type="number"
            min={0}
            value={tenantLimitForm.maxCount}
            onChange={e => setTenantLimitForm(prev => ({ ...prev, maxCount: e.target.value }))}
          />
          <p className="text-xs text-text-muted">同租户同规格重复设置时会覆盖原上限值，用于按业务阶段动态调控配额。</p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setLimitModalOpen(false)}>取消</Button>
            <Button loading={savingTenantLimit} onClick={saveTenantLimit}>保存上限</Button>
          </div>
        </div>
      </Modal>

      <Modal open={priorityModalOpen} onClose={() => setPriorityModalOpen(false)} title={priorityForm.id ? '编辑优先级类' : '新建优先级类'} width="md">
        <div className="space-y-4">
          <Input
            label="优先级类名称"
            value={priorityForm.name}
            onChange={e => setPriorityForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例如：critical"
          />
          <Input
            label="优先级数值"
            type="number"
            min={0}
            value={priorityForm.priority}
            onChange={e => setPriorityForm(prev => ({ ...prev, priority: e.target.value }))}
          />
          <Select
            label="抢占策略"
            value={priorityForm.preemptible}
            onChange={e => setPriorityForm(prev => ({ ...prev, preemptible: e.target.value as 'true' | 'false' }))}
            options={[
              { value: 'false', label: '不可抢占' },
              { value: 'true', label: '可抢占' },
            ]}
          />
          <Input
            label="说明"
            value={priorityForm.desc}
            onChange={e => setPriorityForm(prev => ({ ...prev, desc: e.target.value }))}
            placeholder="描述该优先级类适用场景"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPriorityModalOpen(false)}>取消</Button>
            <Button loading={savingPriority} onClick={savePriorityClass}>保存</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!pendingDeletePriority}
        onClose={() => setPendingDeletePriority(null)}
        title="删除优先级类"
        width="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            确认删除优先级类“{pendingDeletePriority?.name}”吗？删除后将不再参与调度策略匹配。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingDeletePriority(null)}>取消</Button>
            <Button variant="danger" onClick={deletePriorityClass}>确认删除</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
