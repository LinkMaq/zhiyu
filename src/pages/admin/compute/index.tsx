import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Thermometer, Zap, MemoryStick, Server, Tag, AlertTriangle, SplitSquareVertical, Save } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { GaugeChart, ResourceBar } from '../../../components/charts/Charts';
import { StatusDot } from '../../../components/ui/StatusDot';
import { Tabs } from '../../../components/ui/Tabs';
import { Select } from '../../../components/ui/Input';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useClusters } from '../../../contexts/ClusterContext';
import type { GpuSlice } from '../../../types';
import { useToast } from '../../../hooks/useToast';

type SliceMode = 'gb' | 'ratio';

interface SliceConfig {
  mode: SliceMode;
  value: string;
}

interface AcceleratorFamilySeed {
  model: string;
  totalMemory: number;
  acceleratorCount: number;
  usedAccelerators: number;
  nodes: string[];
}

const EXTRA_ACCELERATOR_FAMILIES: Record<string, AcceleratorFamilySeed[]> = {
  cls001: [
    { model: 'NVIDIA H20 96GB', totalMemory: 96, acceleratorCount: 12, usedAccelerators: 5, nodes: ['node-h20-01', 'node-h20-02', 'node-h20-03'] },
    { model: 'NVIDIA H800 80GB', totalMemory: 80, acceleratorCount: 8, usedAccelerators: 3, nodes: ['node-h800-01', 'node-h800-02'] },
    { model: 'Ascend 910B 64GB', totalMemory: 64, acceleratorCount: 16, usedAccelerators: 9, nodes: ['node-npu-01', 'node-npu-02', 'node-npu-03'] },
    { model: 'AMD MI300X 192GB', totalMemory: 192, acceleratorCount: 4, usedAccelerators: 1, nodes: ['node-mi300-01'] },
  ],
  cls002: [
    { model: 'NVIDIA L40S 48GB', totalMemory: 48, acceleratorCount: 6, usedAccelerators: 2, nodes: ['dev-l40s-01', 'dev-l40s-02'] },
    { model: 'Ascend 910A 32GB', totalMemory: 32, acceleratorCount: 8, usedAccelerators: 3, nodes: ['dev-npu-01', 'dev-npu-02'] },
    { model: 'NVIDIA V100 32GB', totalMemory: 32, acceleratorCount: 10, usedAccelerators: 6, nodes: ['dev-v100-01', 'dev-v100-02', 'dev-v100-03'] },
  ],
};

function isHighPerfAccelerator(model: string) {
  const upper = model.toUpperCase();
  return ['A100', 'H100', 'H20', 'H800', 'B200', 'MI300', 'ASCEND', '910', 'NPU'].some(keyword => upper.includes(keyword));
}

function getAcceleratorKind(model: string) {
  const upper = model.toUpperCase();
  return upper.includes('ASCEND') || upper.includes('910') || upper.includes('NPU') ? 'NPU' : 'GPU';
}

function buildSlicePreview(totalMemory: number, mode: SliceMode, rawValue: string) {
  const numeric = Number.parseFloat(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0 || totalMemory <= 0) return [];

  const sliceSize = mode === 'gb'
    ? numeric
    : Number((totalMemory * Math.min(100, numeric) / 100).toFixed(1));

  if (!Number.isFinite(sliceSize) || sliceSize <= 0 || sliceSize > totalMemory) return [];

  const slices: Array<{ id: string; size: number }> = [];
  let remaining = totalMemory;
  let index = 1;

  while (remaining > 0.05) {
    const current = Math.min(sliceSize, Number(remaining.toFixed(1)));
    slices.push({ id: `slice-${index}`, size: Number(current.toFixed(1)) });
    remaining = Number((remaining - current).toFixed(1));
    index += 1;
    if (index > 32) break;
  }

  return slices;
}

function buildSkuCode(model: string, acceleratorKind: string, sliceSize: number, mode: SliceMode) {
  const normalized = model
    .replace(/NVIDIA|ASCEND|AMD/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  return `${acceleratorKind.toLowerCase()}.${normalized}.${mode === 'gb' ? `${Math.round(sliceSize)}g` : `${Math.round(sliceSize * 10)}m`}`;
}

function getSkuScene(model: string, sliceSize: number) {
  const upper = model.toUpperCase();
  if (upper.includes('H100') || upper.includes('H800') || upper.includes('H20')) {
    return sliceSize >= 40 ? '大模型训练 / 推理' : '高性能推理';
  }
  if (upper.includes('A100') || upper.includes('MI300')) {
    return sliceSize >= 32 ? '分布式训练' : '共享训练';
  }
  if (upper.includes('ASCEND') || upper.includes('910')) {
    return sliceSize >= 16 ? '昇腾训练任务' : 'NPU 推理任务';
  }
  return sliceSize >= 24 ? '模型微调' : '轻量推理';
}

function getSkuBilling(sliceSize: number) {
  return sliceSize >= 40 ? '按小时计费' : sliceSize >= 20 ? '按分钟计费' : '按秒计费';
}

export default function ComputeManagement() {
  const navigate = useNavigate();
  const { clusters, selectedCluster, selectedClusterId, setSelectedClusterId } = useClusters();
  const [activeTab, setActiveTab] = useState('gpu');
  const [sliceConfigs, setSliceConfigs] = useState<Record<string, SliceConfig>>({});
  const { toast } = useToast();

  const clusterNodes = selectedCluster?.nodes.map((node, index) => {
    const memoryNum = Number.parseInt(node.memory, 10) || 256;
    const cpuNum = Number.parseInt(node.cpu, 10) || 32;

    return {
      id: `${selectedCluster?.id ?? 'cluster'}-${node.name}-${index}`,
      name: node.name,
      ip: node.ip,
      status: node.status === 'ready' ? 'Ready' : 'NotReady',
      role: node.role === 'gpu-worker' ? 'GPU Worker' : node.role === 'master' ? 'Master' : 'CPU Worker',
      gpuModel: node.gpuType ?? '—',
      gpuCount: node.gpuCount ?? 0,
      gpuUsed: node.status === 'ready' ? Math.max(0, Math.floor((node.gpuCount ?? 0) * (0.45 + (index % 4) * 0.12))) : 0,
      cpu: cpuNum,
      cpuUsed: node.status === 'ready' ? Math.round(cpuNum * (0.4 + (index % 3) * 0.15)) : 0,
      memory: memoryNum,
      memoryUsed: node.status === 'ready' ? Math.round(memoryNum * (0.35 + (index % 3) * 0.14)) : 0,
      labels: [
        node.role === 'gpu-worker' ? 'role=gpu-worker' : node.role === 'master' ? 'role=master' : 'role=worker',
        `cluster=${selectedCluster?.name ?? 'default'}`,
      ],
      taints: node.status === 'ready' ? [] : ['node.kubernetes.io/not-ready:NoExecute'],
      maintenance: node.status !== 'ready',
    };
  }) ?? [];

  const clusterGpuDevices = clusterNodes
    .filter(node => node.gpuCount > 0)
    .map((node, index) => {
      const totalMemory = Number.parseInt(node.gpuModel.match(/(\d+)GB/i)?.[1] ?? '48', 10);
      const utilization = node.gpuCount > 0 ? Math.min(98, 48 + node.gpuUsed * 8 + (index % 3) * 5) : 0;
      const usedMemory = Math.round(totalMemory * (utilization / 100));
      const slices: GpuSlice[] = node.gpuCount >= 8
        ? [
            { id: `${node.id}-s1`, size: `${Math.floor(totalMemory / 2)}GB`, assigned: true, tenant: '中国电信AI研究院' },
            { id: `${node.id}-s2`, size: `${Math.ceil(totalMemory / 2)}GB`, assigned: utilization > 70, tenant: utilization > 70 ? '内部模型服务' : undefined },
          ]
        : [{ id: `${node.id}-s1`, size: `${totalMemory}GB`, assigned: utilization > 35, tenant: utilization > 35 ? '共享推理池' : undefined }];

      return {
        id: `gpu-${node.id}`,
        node: node.name,
        model: node.gpuModel,
        gpuCount: node.gpuCount,
        totalMemory: `${totalMemory} GB`,
        usedMemory: `${usedMemory} GB`,
        utilization,
        temperature: 55 + Math.round(utilization / 4),
        power: `${180 + utilization * 3}W`,
        slices,
        status: (node.status !== 'Ready' ? 'error' : utilization > 88 ? 'warning' : 'normal') as 'normal' | 'warning' | 'error',
      };
    });

  const sliceCapableFamilies = useMemo(() => Object.values(
    [...clusterGpuDevices
      .filter(device => isHighPerfAccelerator(device.model))
      .map(device => ({
        model: device.model,
        totalMemory: Number.parseFloat(device.totalMemory),
        acceleratorCount: device.gpuCount ?? 0,
        usedAccelerators: Math.max(0, Math.round((device.gpuCount ?? 0) * (device.utilization / 100))),
        nodes: [device.node],
      })), ...(EXTRA_ACCELERATOR_FAMILIES[selectedClusterId] ?? [])]
      .reduce<Record<string, {
        id: string;
        model: string;
        acceleratorKind: string;
        totalMemory: number;
        acceleratorCount: number;
        usedAccelerators: number;
        nodes: string[];
      }>>((acc, familySeed) => {
        const key = familySeed.model;
        if (!acc[key]) {
          acc[key] = {
            id: `${selectedClusterId}-${key.replace(/\s+/g, '-').toLowerCase()}`,
            model: familySeed.model,
            acceleratorKind: getAcceleratorKind(familySeed.model),
            totalMemory: familySeed.totalMemory,
            acceleratorCount: 0,
            usedAccelerators: 0,
            nodes: [],
          };
        }

        acc[key].acceleratorCount += familySeed.acceleratorCount;
        acc[key].usedAccelerators += familySeed.usedAccelerators;
        acc[key].nodes.push(...familySeed.nodes);
        return acc;
      }, {})
  ).map(family => {
      const config = sliceConfigs[family.id] ?? { mode: 'gb', value: String(Math.max(10, Math.floor(family.totalMemory / 4))) };
      const preview = buildSlicePreview(family.totalMemory, config.mode, config.value);
      const skuList = preview.map((slice, index) => ({
        id: `${family.id}-sku-${index + 1}`,
        code: buildSkuCode(family.model, family.acceleratorKind, slice.size, config.mode),
        name: `${family.model} ${slice.size}GB 切分型`,
        sliceSize: slice.size,
        inventory: family.acceleratorCount,
        ratio: Number(((slice.size / family.totalMemory) * 100).toFixed(0)),
        scene: getSkuScene(family.model, slice.size),
        billing: getSkuBilling(slice.size),
        status: family.acceleratorCount - family.usedAccelerators > 0 ? '在售' : '售罄',
      }));

      return {
        ...family,
        nodes: Array.from(new Set(family.nodes)),
        sliceConfig: config,
        preview,
        skuList,
      };
    }), [clusterGpuDevices, selectedClusterId, sliceConfigs]);

  const updateSliceConfig = (familyId: string, patch: Partial<SliceConfig>) => {
    setSliceConfigs(prev => ({
      ...prev,
      [familyId]: {
        mode: prev[familyId]?.mode ?? 'gb',
        value: prev[familyId]?.value ?? '10',
        ...patch,
      },
    }));
  };

  const saveSlicePlan = (familyId: string, model: string, skuCount: number) => {
    toast.success('切分方案已保存', `${model} 已生成 ${skuCount} 个可分发资源 SKU`);
    setSliceConfigs(prev => ({ ...prev }));
    void familyId;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="GPU 算力管理" subtitle="集群 GPU 设备状态与资源使用情况" icon={<Cpu size={20} />} />

      {!clusters.length && (
        <Card>
          <EmptyState
            icon={<Server size={28} />}
            title="暂无可用集群"
            description="请先在集群管理页面创建 Kubernetes 集群，再进入 GPU 算力管理。"
            action={<Button onClick={() => navigate('/admin/kubernetes')}>前往创建集群</Button>}
          />
        </Card>
      )}

      {!!clusters.length && (
        <div className="max-w-sm">
          <Select
            label="当前集群"
            value={selectedClusterId}
            onChange={e => setSelectedClusterId(e.target.value)}
            options={clusters.map(cluster => ({
              value: cluster.id,
              label: `${cluster.name} (${cluster.region})`,
            }))}
          />
        </div>
      )}

      <Tabs
        tabs={[
          { key: 'gpu', label: 'GPU 设备', icon: <Cpu size={14} /> },
          { key: 'nodes', label: '节点管理', icon: <Server size={14} /> },
          { key: 'partition', label: '显存切分', icon: <SplitSquareVertical size={14} /> },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {!!clusters.length && activeTab === 'gpu' && (
        <div className="space-y-5">
          {clusterGpuDevices.length === 0 && (
            <Card>
              <EmptyState
                icon={<Cpu size={28} />}
                title="当前集群暂无 GPU 节点"
                description="请先为该集群添加 GPU Worker 节点，再进行 GPU 资源管理。"
              />
            </Card>
          )}
          {clusterGpuDevices.map(device => (
          <Card key={device.id} glow={device.utilization > 80}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={device.status === 'normal' ? 'running' : device.status === 'warning' ? 'warning' : 'error'} />
                  <h3 className="text-base font-bold text-text-primary">{device.model}</h3>
                  <Badge variant={device.status === 'normal' ? 'success' : device.status === 'warning' ? 'warning' : 'error'}>{device.status}</Badge>
                  {device.slices.length > 0 && <Badge variant="secondary">GPU 切片: {device.slices.length}</Badge>}
                </div>
                <p className="text-xs text-text-muted">节点: {device.node}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                <span className="flex items-center gap-1.5"><Thermometer size={12} className="text-warning" />{device.temperature}°C</span>
                <span className="flex items-center gap-1.5"><Zap size={12} className="text-accent" />{device.power}</span>
                <span className="flex items-center gap-1.5"><MemoryStick size={12} className="text-secondary" />{device.usedMemory} / {device.totalMemory}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col items-center">
                <p className="text-xs text-text-muted mb-2">GPU 利用率</p>
                <GaugeChart value={device.utilization} max={100} label={`${device.utilization}%`} color={device.utilization > 80 ? '#EF4444' : '#3B82F6'} size={120} />
              </div>
              <div className="flex flex-col gap-3 justify-center">
                <ResourceBar label="显存使用" used={parseFloat(device.usedMemory)} total={parseFloat(device.totalMemory)} unit="GB" />
                <ResourceBar label="GPU 利用率" used={device.utilization} total={100} unit="%" />
              </div>
              {device.slices.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-2">GPU 切片分配</p>
                  <div className="space-y-1">
                    {device.slices.map((slice: GpuSlice) => (
                      <div key={slice.id} className="flex items-center justify-between bg-base rounded-lg px-3 py-2 text-xs">
                        <span className="text-text-secondary">{slice.size}</span>
                        <div className="flex items-center gap-2">
                          <StatusDot status={slice.assigned ? 'running' : 'idle'} />
                          <span className={slice.assigned ? 'text-success' : 'text-text-muted'}>
                            {slice.assigned ? (slice.tenant ?? '已分配') : '空闲'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      )}

      {!!clusters.length && activeTab === 'nodes' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-muted font-medium">节点名称</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">IP 地址</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">角色</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">GPU</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">CPU / 内存</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">标签 / Taint</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">维护</th>
                </tr>
              </thead>
              <tbody>
                {clusterNodes.map(node => (
                  <tr key={node.id} className={`border-b border-border/50 hover:bg-elevated/40 transition-colors ${node.maintenance ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <StatusDot status={node.status === 'Ready' ? 'running' : 'error'} />
                        <span className="font-mono text-text-primary">{node.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-muted font-mono">{node.ip}</td>
                    <td className="py-3 px-4">
                      <Badge variant={node.status === 'Ready' ? 'success' : 'error'}>{node.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{node.role}</td>
                    <td className="py-3 px-4">
                      {node.gpuCount > 0 ? (
                        <div>
                          <div className="text-text-primary text-xs">{node.gpuModel}</div>
                          <div className="text-text-muted text-xs">{node.gpuUsed}/{node.gpuCount} 卡已用</div>
                        </div>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1 min-w-[140px]">
                        <ResourceBar label="CPU" used={node.cpuUsed} total={node.cpu} unit=" 核" />
                        <ResourceBar label="内存" used={node.memoryUsed} total={node.memory} unit="GB" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {node.labels.map(l => (
                          <span key={l} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Tag size={10} />{l}
                          </span>
                        ))}
                        {node.taints.map(t => (
                          <span key={t} className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                            <AlertTriangle size={10} />{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={node.maintenance ? 'warning' : 'secondary'}>{node.maintenance ? '维护中' : '正常'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!!clusters.length && activeTab === 'partition' && (
        <div className="space-y-5">
          {sliceCapableFamilies.length === 0 && (
            <Card>
              <EmptyState
                icon={<SplitSquareVertical size={28} />}
                title="当前集群暂无可切分的高性能 GPU/NPU"
                description="仅对高性能 GPU/NPU 开放显存切分能力，例如 A100、H100、Ascend 910 等。请切换集群或新增高性能加速节点。"
              />
            </Card>
          )}

          {sliceCapableFamilies.map(family => (
            <Card key={`${family.id}-partition`}>
              <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-text-primary">{family.model}</h3>
                    <Badge variant="secondary">{family.acceleratorKind}</Badge>
                    <Badge variant="ghost">{family.acceleratorCount} 卡</Badge>
                  </div>
                  <p className="text-xs text-text-muted">按显卡型号统一切分，不依赖具体节点。切分后以云资源 SKU 规格进行统一编排与分发。</p>
                </div>
                <div className="text-xs text-text-muted flex items-center gap-4">
                  <span>单卡显存 {family.totalMemory} GB</span>
                  <span>部署节点 {family.nodes.length} 台</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-2">切分方式</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateSliceConfig(family.id, { mode: 'gb' })}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${family.sliceConfig.mode === 'gb' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}
                      >
                        固定大小 (GB)
                      </button>
                      <button
                        onClick={() => updateSliceConfig(family.id, { mode: 'ratio' })}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${family.sliceConfig.mode === 'ratio' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}
                      >
                        显存比例 (%)
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-text-muted mb-2">
                      {family.sliceConfig.mode === 'gb' ? '每个 SKU 的显存大小' : '每个 SKU 占单卡总显存比例'}
                    </p>
                    <input
                      type="number"
                      min="1"
                      max={family.sliceConfig.mode === 'gb' ? family.totalMemory.toString() : '100'}
                      value={family.sliceConfig.value}
                      onChange={e => updateSliceConfig(family.id, { value: e.target.value })}
                      className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60"
                    />
                    <p className="text-[11px] text-text-muted mt-1">
                      {family.sliceConfig.mode === 'gb'
                        ? `例如 ${Math.max(10, Math.floor(family.totalMemory / 4))}GB，可生成多个统一资源规格`
                        : '例如输入 25，表示每片占总显存 25%'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3 bg-base/60">
                    <p className="text-xs font-medium text-text-muted mb-2">方案摘要</p>
                    <div className="space-y-1 text-xs text-text-secondary">
                      <p>加速器类型：{family.acceleratorKind}</p>
                      <p>切分维度：显卡型号</p>
                      <p>切分模式：{family.sliceConfig.mode === 'gb' ? '固定大小' : '总显存比例'}</p>
                      <p>预计 SKU 数：{family.skuList.length || 0}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3 bg-base/60">
                    <p className="text-xs font-medium text-text-muted mb-2">型号资源池</p>
                    <div className="space-y-1 text-xs text-text-secondary">
                      <p>卡型总量：{family.acceleratorCount} 卡</p>
                      <p>已调度：{family.usedAccelerators} 卡</p>
                      <p>空闲库存：{Math.max(0, family.acceleratorCount - family.usedAccelerators)} 卡</p>
                      <p className="truncate">节点分布：{family.nodes.join('、')}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      leftIcon={<Save size={12} />}
                      onClick={() => saveSlicePlan(family.id, family.model, family.skuList.length)}
                      disabled={family.preview.length === 0}
                    >
                      保存切分方案
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-text-muted">资源 SKU 预览</p>
                    <Badge variant="secondary">{family.skuList.length} 个规格</Badge>
                  </div>
                  {family.preview.length === 0 ? (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-4 text-sm text-warning">
                      当前输入无法生成有效切片，请检查大小或比例是否超过总显存。
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border bg-base/50">
                      <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.9fr_1fr_0.9fr_0.8fr] gap-3 px-4 py-3 text-[11px] text-text-muted uppercase tracking-[0.08em] border-b border-border/60">
                        <span>SKU规格</span>
                        <span>资源类型</span>
                        <span>单份显存</span>
                        <span>切分比例</span>
                        <span>适用场景</span>
                        <span>计费方式</span>
                        <span>状态</span>
                      </div>
                      <div className="divide-y divide-border/50">
                        {family.skuList.map(sku => (
                          <div key={sku.id} className="grid grid-cols-[1.4fr_1fr_0.8fr_0.9fr_1fr_0.9fr_0.8fr] gap-3 px-4 py-3 items-center text-sm hover:bg-white/[0.02] transition-colors">
                            <div>
                              <p className="font-semibold text-text-primary">{sku.code}</p>
                              <p className="text-xs text-text-muted mt-1">{sku.name}</p>
                            </div>
                            <div>
                              <p className="text-text-primary">{family.acceleratorKind} Slice SKU</p>
                              <p className="text-xs text-text-muted mt-1">库存 {sku.inventory} 份</p>
                            </div>
                            <span className="text-text-secondary">{sku.sliceSize} GB</span>
                            <span className="text-text-secondary">{sku.ratio}%</span>
                            <span className="text-text-secondary">{sku.scene}</span>
                            <span className="text-text-secondary">{sku.billing}</span>
                            <Badge variant={sku.status === '在售' ? 'success' : 'warning'}>{sku.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
