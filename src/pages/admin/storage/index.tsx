import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, Database, Cloud, Plus, Trash2, Lock, Unlock, Expand, FolderOpen, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ResourceBar } from '../../../components/charts/Charts';
import { Tabs } from '../../../components/ui/Tabs';
import { Modal } from '../../../components/ui/Modal';
import { mockOnlineFileSystems, mockStorageVolumes } from '../../../data/mockData';
import { useToast } from '../../../hooks/useToast';
import { Select } from '../../../components/ui/Input';
import { useClusters } from '../../../contexts/ClusterContext';
import type { OnlineFileSystem, StorageExpansionPhase, StorageExpansionTask, StorageVolume } from '../../../types';

const statusVariant: Record<string, 'success' | 'primary' | 'ghost' | 'error'> = {
  bound: 'success', available: 'primary', released: 'ghost', failed: 'error',
};

const expansionPhaseLabel: Record<StorageExpansionPhase, string> = {
  idle: '待扩容',
  queued: '准备中',
  expanding: '块设备扩展',
  'resizing-fs': '文件系统刷新',
  completed: '已完成',
  rollback: '已回滚',
};

const expansionPhaseVariant: Record<StorageExpansionPhase, 'success' | 'primary' | 'ghost' | 'error'> = {
  idle: 'ghost',
  queued: 'primary',
  expanding: 'primary',
  'resizing-fs': 'primary',
  completed: 'success',
  rollback: 'error',
};

function parseTiB(val: string): number {
  const num = parseFloat(val);
  if (/GiB|GB|Gi/i.test(val)) return num / 1024;
  return num;
}

function parseGiB(val: string): number {
  const num = parseFloat(val);
  if (/TiB|TB|Ti/i.test(val)) return num * 1024;
  return num;
}

interface Bucket {
  id: string;
  clusterId: string;
  name: string;
  region: string;
  accessPolicy: 'private' | 'public-read' | 'public-read-write';
  objects: number;
  usedGB: number;
  capacityGB: number;
  versioning: boolean;
  createdAt: string;
  namespace: string;
}

interface ExpandTarget {
  type: 'pv' | 'fs';
  id: string;
  name: string;
  currentGiB: number;
  backend: string;
}

const INIT_BUCKETS: Bucket[] = [
  { id: 'b1', clusterId: 'cls001', name: 'zhiyun-datasets', region: '华西-成都', accessPolicy: 'private', objects: 12480, usedGB: 1024, capacityGB: 5120, versioning: true, createdAt: '2025-01-10', namespace: 'default' },
  { id: 'b2', clusterId: 'cls001', name: 'zhiyun-models', region: '华西-成都', accessPolicy: 'private', objects: 356, usedGB: 3072, capacityGB: 10240, versioning: true, createdAt: '2025-01-10', namespace: 'default' },
  { id: 'b3', clusterId: 'cls002', name: 'training-checkpoints', region: '华西-成都', accessPolicy: 'private', objects: 8900, usedGB: 2048, capacityGB: 8192, versioning: false, createdAt: '2025-02-05', namespace: 'train-ns' },
  { id: 'b4', clusterId: 'cls002', name: 'inference-cache', region: '华西-成都', accessPolicy: 'private', objects: 1200, usedGB: 512, capacityGB: 2048, versioning: false, createdAt: '2025-03-01', namespace: 'infer-ns' },
  { id: 'b5', clusterId: 'cls001', name: 'public-assets', region: '华西-成都', accessPolicy: 'public-read', objects: 890, usedGB: 80, capacityGB: 256, versioning: false, createdAt: '2025-03-15', namespace: 'default' },
];

const policyLabel: Record<string, string> = {
  'private': '私有',
  'public-read': '公开读',
  'public-read-write': '公开读写',
};
const policyVariant: Record<string, 'success' | 'warning' | 'error'> = {
  'private': 'success', 'public-read': 'warning', 'public-read-write': 'error',
};

function getExpansionTask(task?: StorageExpansionTask): StorageExpansionTask {
  return task ?? { phase: 'idle', progress: 0, summary: '支持在线扩容，当前无需执行变更' };
}

function ExpansionStatus({ task }: { task?: StorageExpansionTask }) {
  const effectiveTask = getExpansionTask(task);

  return (
    <div className="min-w-[190px] space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={expansionPhaseVariant[effectiveTask.phase]}>{expansionPhaseLabel[effectiveTask.phase]}</Badge>
        <span className="text-xs text-text-muted">{effectiveTask.progress}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${effectiveTask.phase === 'rollback' ? 'bg-error' : effectiveTask.phase === 'completed' ? 'bg-success' : 'bg-primary'}`}
          style={{ width: `${effectiveTask.progress}%` }}
        />
      </div>
      <p className="text-xs text-text-muted leading-5">{effectiveTask.summary}</p>
      {effectiveTask.rollbackReason && <p className="text-xs text-error">回滚原因：{effectiveTask.rollbackReason}</p>}
    </div>
  );
}

export default function AdminStorage() {
  const { toast } = useToast();
  const { clusters, selectedCluster, selectedClusterId, setSelectedClusterId } = useClusters();
  const [activeTab, setActiveTab] = useState('pv');
  const [pvVolumes, setPvVolumes] = useState<StorageVolume[]>(mockStorageVolumes);
  const [buckets, setBuckets] = useState<Bucket[]>(INIT_BUCKETS);
  const [fileSystems, setFileSystems] = useState<OnlineFileSystem[]>(mockOnlineFileSystems);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createPvOpen, setCreatePvOpen] = useState(false);
  const [expandTarget, setExpandTarget] = useState<ExpandTarget | null>(null);
  const [targetCapacityGiB, setTargetCapacityGiB] = useState('');
  const expansionTimersRef = useRef<number[]>([]);
  const [pvForm, setPvForm] = useState({
    name: '',
    type: 'ceph',
    capacityGiB: '200',
    accessMode: 'ReadWriteMany',
    namespace: 'default',
  });

  useEffect(() => () => {
    expansionTimersRef.current.forEach(timerId => window.clearTimeout(timerId));
  }, []);

  const filteredPvVolumes = selectedCluster ? pvVolumes.filter(v => v.clusterId === selectedCluster.id) : pvVolumes;
  const filteredBuckets = selectedCluster ? buckets.filter(b => b.clusterId === selectedCluster.id) : buckets;
  const filteredFileSystems = selectedCluster ? fileSystems.filter(fs => fs.clusterId === selectedCluster.id) : fileSystems;
  const totalTB = filteredPvVolumes.reduce((a, v) => a + parseTiB(v.capacity), 0);
  const usedTB = filteredPvVolumes.reduce((a, v) => a + parseTiB(v.used), 0);
  const totalFsTB = filteredFileSystems.reduce((a, fs) => a + fs.capacityGB, 0) / 1024;
  const usedFsTB = filteredFileSystems.reduce((a, fs) => a + fs.usedGB, 0) / 1024;
  const totalBucketTB = filteredBuckets.reduce((a, b) => a + b.capacityGB, 0) / 1024;
  const usedBucketTB = filteredBuckets.reduce((a, b) => a + b.usedGB, 0) / 1024;

  function handleDelete(id: string) {
    setBuckets(p => p.filter(b => b.id !== id));
    setDeleteId(null);
  }

  function handleCreatePv(e: React.FormEvent) {
    e.preventDefault();
    const capacityGiB = Math.min(980, Math.max(20, Number(pvForm.capacityGiB) || 200));
    const typeToStorageClass: Record<string, string> = {
      ceph: 'ceph-fs',
      nfs: 'nfs-client',
      local: 'local-path',
      s3: 's3-compatible',
      nas: 'nas-csi',
    };

    const newPv: StorageVolume = {
      id: `pv${Date.now()}`,
      clusterId: selectedClusterId,
      name: pvForm.name || `pv-${Date.now()}`,
      type: pvForm.type as 'nfs' | 'ceph' | 'local' | 's3' | 'nas',
      capacity: `${capacityGiB} GiB`,
      used: '0 GiB',
      status: 'available' as const,
      accessMode: pvForm.accessMode as 'ReadWriteOnce' | 'ReadWriteMany' | 'ReadOnlyMany',
      createdAt: new Date().toISOString(),
      namespace: pvForm.namespace || 'default',
      mountedBy: [],
      storageClass: typeToStorageClass[pvForm.type] ?? 'ceph-fs',
      expansion: { phase: 'idle', progress: 0, summary: '新建卷支持在线扩容' },
    };

    setPvVolumes(prev => [newPv, ...prev]);
    setCreatePvOpen(false);
    setPvForm({ name: '', type: 'ceph', capacityGiB: '200', accessMode: 'ReadWriteMany', namespace: 'default' });
    toast.success('PV 创建成功', `已创建持久卷 ${newPv.name}`);
  }

  function openExpand(target: ExpandTarget) {
    setExpandTarget(target);
    setTargetCapacityGiB(String(Math.max(target.currentGiB + 200, Math.ceil(target.currentGiB * 1.25))));
  }

  function queueExpansionTask(callback: () => void, delay: number) {
    const timerId = window.setTimeout(callback, delay);
    expansionTimersRef.current.push(timerId);
  }

  function updateVolumeExpansion(id: string, updater: (volume: StorageVolume) => StorageVolume) {
    setPvVolumes(prev => prev.map(volume => volume.id === id ? updater(volume) : volume));
  }

  function updateFileSystemExpansion(id: string, updater: (fileSystem: OnlineFileSystem) => OnlineFileSystem) {
    setFileSystems(prev => prev.map(fileSystem => fileSystem.id === id ? updater(fileSystem) : fileSystem));
  }

  function handleExpandSubmit() {
    if (!expandTarget) return;

    const nextCapacity = Math.max(expandTarget.currentGiB + 1, Number(targetCapacityGiB) || expandTarget.currentGiB);
    const startedAt = new Date().toISOString();
    const growthRatio = nextCapacity / expandTarget.currentGiB;
    const rollbackThreshold = expandTarget.backend === 'local-path' ? 1.35 : 1.6;
    const shouldRollback = growthRatio > rollbackThreshold;

    if (expandTarget.type === 'pv') {
      updateVolumeExpansion(expandTarget.id, volume => ({
        ...volume,
        expansion: {
          phase: 'queued',
          progress: 12,
          targetCapacityGiB: nextCapacity,
          startedAt,
          summary: '已接收扩容请求，正在锁定块设备与 CSI 通道',
        },
      }));
    } else {
      updateFileSystemExpansion(expandTarget.id, fileSystem => ({
        ...fileSystem,
        expansion: {
          phase: 'queued',
          progress: 12,
          targetCapacityGiB: nextCapacity,
          startedAt,
          summary: '已接收扩容请求，准备在线扩展后端存储配额',
        },
      }));
    }

    queueExpansionTask(() => {
      if (expandTarget.type === 'pv') {
        updateVolumeExpansion(expandTarget.id, volume => ({
          ...volume,
          expansion: {
            ...getExpansionTask(volume.expansion),
            phase: 'expanding',
            progress: 48,
            targetCapacityGiB: nextCapacity,
            startedAt,
            summary: '块存储容量已扩展，正在保持挂载会话并同步卷元数据',
          },
        }));
      } else {
        updateFileSystemExpansion(expandTarget.id, fileSystem => ({
          ...fileSystem,
          expansion: {
            ...getExpansionTask(fileSystem.expansion),
            phase: 'expanding',
            progress: 44,
            targetCapacityGiB: nextCapacity,
            startedAt,
            summary: '后端容量池已扩展，客户端挂载保持在线',
          },
        }));
      }
    }, 500);

    queueExpansionTask(() => {
      if (expandTarget.type === 'pv') {
        updateVolumeExpansion(expandTarget.id, volume => ({
          ...volume,
          expansion: {
            ...getExpansionTask(volume.expansion),
            phase: 'resizing-fs',
            progress: shouldRollback ? 76 : 82,
            targetCapacityGiB: nextCapacity,
            startedAt,
            summary: shouldRollback ? '容量校验触发保护策略，正在准备自动回滚' : '文件系统在线刷新中，业务 I/O 保持不中断',
          },
        }));
      } else {
        updateFileSystemExpansion(expandTarget.id, fileSystem => ({
          ...fileSystem,
          expansion: {
            ...getExpansionTask(fileSystem.expansion),
            phase: 'resizing-fs',
            progress: shouldRollback ? 72 : 84,
            targetCapacityGiB: nextCapacity,
            startedAt,
            summary: shouldRollback ? '配额保护校验失败，进入自动回滚流程' : '元数据热更新中，客户端无需重新挂载',
          },
        }));
      }
    }, 1100);

    queueExpansionTask(() => {
      const finishedAt = new Date().toISOString();

      if (expandTarget.type === 'pv') {
        updateVolumeExpansion(expandTarget.id, volume => ({
          ...volume,
          capacity: shouldRollback ? volume.capacity : `${nextCapacity} GiB`,
          expansion: shouldRollback ? {
            phase: 'rollback',
            progress: 100,
            targetCapacityGiB: nextCapacity,
            startedAt,
            finishedAt,
            summary: '扩容校验失败，已自动回滚到原容量，业务流量未受影响',
            rollbackReason: expandTarget.backend === 'local-path' ? '底层节点磁盘剩余空间不足' : '单次扩容超过安全阈值',
          } : {
            phase: 'completed',
            progress: 100,
            targetCapacityGiB: nextCapacity,
            startedAt,
            finishedAt,
            summary: '在线扩容完成，CSI 与文件系统容量已同步到业务侧',
          },
        }));
      } else {
        updateFileSystemExpansion(expandTarget.id, fileSystem => ({
          ...fileSystem,
          capacityGB: shouldRollback ? fileSystem.capacityGB : nextCapacity,
          status: shouldRollback ? 'warning' : 'online',
          expansion: shouldRollback ? {
            phase: 'rollback',
            progress: 100,
            targetCapacityGiB: nextCapacity,
            startedAt,
            finishedAt,
            summary: '文件系统扩容已自动回滚，客户端挂载会话保持在线',
            rollbackReason: '单次扩容量超过安全阈值，触发配额保护',
          } : {
            phase: 'completed',
            progress: 100,
            targetCapacityGiB: nextCapacity,
            startedAt,
            finishedAt,
            summary: '在线文件系统扩容完成，挂载业务无感知切换到新容量',
          },
        }));
      }

      if (shouldRollback) {
        toast.error('在线扩容已回滚', `${expandTarget.name} 触发保护策略，已自动回滚且业务无中断`);
      } else {
        toast.success('在线扩容已完成', `${expandTarget.name} 已扩容至 ${nextCapacity} GiB，业务无感知`);
      }
    }, 1800);

    setExpandTarget(null);
    setTargetCapacityGiB('');
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="存储管理" subtitle="持久卷、在线文件系统与对象存储资源管理" icon={<HardDrive size={20} />} />

      <div className="max-w-sm">
        <Select
          label="当前集群"
          value={selectedClusterId}
          onChange={e => setSelectedClusterId(e.target.value)}
          options={clusters.map(cluster => ({ value: cluster.id, label: `${cluster.name} (${cluster.region})` }))}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: '持久卷总量', value: `${totalTB.toFixed(1)} TB` },
          { label: 'PV 使用率', value: `${totalTB > 0 ? Math.round(usedTB / totalTB * 100) : 0}%` },
          { label: '在线文件系统总量', value: `${totalFsTB.toFixed(1)} TB` },
          { label: 'FS 使用率', value: `${totalFsTB > 0 ? Math.round(usedFsTB / totalFsTB * 100) : 0}%` },
          { label: '对象存储总量', value: `${totalBucketTB.toFixed(1)} TB` },
          { label: 'S3 使用率', value: `${totalBucketTB > 0 ? Math.round(usedBucketTB / totalBucketTB * 100) : 0}%` },
        ].map(m => (
          <Card key={m.label}>
            <p className="text-xs text-text-muted mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-text-primary">{m.value}</p>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { key: 'pv', label: '持久卷 (PV)', icon: <Database size={14} /> },
          { key: 'fs', label: '在线文件系统', icon: <FolderOpen size={14} />, count: filteredFileSystems.length },
          { key: 's3', label: '对象存储 (S3)', icon: <Cloud size={14} />, count: buckets.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <Card className="border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">支持在线、无缝扩容</p>
            <p className="text-xs text-text-muted mt-1">存储卷与在线文件系统均支持业务无感知扩容，扩容期间挂载保持在线，不触发业务中断或重启。</p>
          </div>
        </div>
      </Card>

      {activeTab === 'pv' && (
        <>
          <div className="flex justify-end">
            <Button leftIcon={<Plus size={14} />} onClick={() => setCreatePvOpen(true)}>创建 PV</Button>
          </div>
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['卷名称', '存储类型', '容量', '使用率', '访问模式', '状态', '扩容任务', '创建时间', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPvVolumes.map(v => (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Database size={13} className="text-text-muted" />
                          <span className="text-sm text-text-primary font-medium">{v.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{v.storageClass}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{v.capacity}</td>
                      <td className="px-4 py-3">
                        <div className="w-28">
                          <ResourceBar label="" used={parseTiB(v.used)} total={parseTiB(v.capacity)} unit="TiB" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{v.accessMode}</td>
                      <td className="px-4 py-3"><Badge variant={statusVariant[v.status] ?? 'ghost'}>{v.status}</Badge></td>
                      <td className="px-4 py-3"><ExpansionStatus task={v.expansion} /></td>
                      <td className="px-4 py-3 text-xs text-text-muted">{new Date(v.createdAt).toLocaleDateString('zh-CN')}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Expand size={13} />}
                          onClick={() => openExpand({ type: 'pv', id: v.id, name: v.name, currentGiB: parseGiB(v.capacity), backend: v.storageClass })}
                        >
                          在线扩容
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPvVolumes.length === 0 && (
                <div className="text-center text-sm text-text-muted py-10">该集群暂无 PV 资源</div>
              )}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'fs' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['文件系统', '协议', '挂载点', '容量', '使用率', '吞吐', '业务无感', '扩容任务', '创建时间', '操作'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFileSystems.map(fs => (
                  <tr key={fs.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={13} className="text-primary" />
                        <span className="text-sm text-text-primary font-medium">{fs.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{fs.protocol}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{fs.mountTargets} 个</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{(fs.capacityGB / 1024).toFixed(1)} TB</td>
                    <td className="px-4 py-3">
                      <div className="w-32">
                        <ResourceBar label="" used={fs.usedGB} total={fs.capacityGB} unit="GB" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{fs.throughputMBps.toLocaleString()} MB/s</td>
                    <td className="px-4 py-3">
                      <Badge variant={fs.seamless ? 'success' : 'ghost'}>{fs.seamless ? '无感知' : '需维护窗口'}</Badge>
                    </td>
                    <td className="px-4 py-3"><ExpansionStatus task={fs.expansion} /></td>
                    <td className="px-4 py-3 text-xs text-text-muted">{fs.createdAt}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Expand size={13} />}
                        onClick={() => openExpand({ type: 'fs', id: fs.id, name: fs.name, currentGiB: fs.capacityGB, backend: fs.protocol })}
                      >
                        在线扩容
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFileSystems.length === 0 && (
              <div className="text-center text-sm text-text-muted py-10">该集群暂无在线文件系统</div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 's3' && (
        <>
          <div className="flex justify-end">
            <Link to="/admin/storage/create-bucket"><Button leftIcon={<Plus size={14} />}>创建 Bucket</Button></Link>
          </div>
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Bucket 名称', '命名空间', '区域', '访问策略', '对象数量', '用量', '版本控制', '创建日期', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBuckets.map(b => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Cloud size={13} className="text-primary" />
                          <span className="text-sm font-medium text-text-primary font-mono">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{b.namespace}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{b.region}</td>
                      <td className="px-4 py-3">
                        <Badge variant={policyVariant[b.accessPolicy]}>
                          {b.accessPolicy === 'private' ? <Lock size={10} className="inline mr-1" /> : <Unlock size={10} className="inline mr-1" />}
                          {policyLabel[b.accessPolicy]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{b.objects.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <ResourceBar label="" used={b.usedGB} total={b.capacityGB} unit="GB" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={b.versioning ? 'success' : 'ghost'}>{b.versioning ? '已启用' : '未启用'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{b.createdAt}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => setDeleteId(b.id)} className="text-error hover:text-error">删除</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBuckets.length === 0 && (
                <div className="text-center text-sm text-text-muted py-10">该集群暂无对象存储 Bucket</div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="确认删除" width="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">删除 Bucket 将永久删除其中所有对象，此操作不可撤销。请确认。</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>确认删除</Button>
          </div>
        </div>
      </Modal>

      <Modal open={createPvOpen} onClose={() => setCreatePvOpen(false)} title="创建持久卷 (PV)" width="md">
        <form onSubmit={handleCreatePv} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary">PV 名称</label>
              <input
                value={pvForm.name}
                onChange={e => setPvForm(f => ({ ...f, name: e.target.value }))}
                placeholder="如: model-registry-pv"
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary">容量 (GiB)</label>
              <input
                type="number"
                min="20"
                max="980"
                value={pvForm.capacityGiB}
                onChange={e => setPvForm(f => ({ ...f, capacityGiB: e.target.value }))}
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary">存储后端</label>
              <select
                value={pvForm.type}
                onChange={e => setPvForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60"
              >
                <option value="ceph">Ceph</option>
                <option value="nfs">NFS</option>
                <option value="local">Local</option>
                <option value="s3">S3 Compatible</option>
                <option value="nas">NAS</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary">访问模式</label>
              <select
                value={pvForm.accessMode}
                onChange={e => setPvForm(f => ({ ...f, accessMode: e.target.value }))}
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60"
              >
                <option value="ReadWriteMany">ReadWriteMany</option>
                <option value="ReadWriteOnce">ReadWriteOnce</option>
                <option value="ReadOnlyMany">ReadOnlyMany</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm text-text-secondary">命名空间</label>
              <input
                value={pvForm.namespace}
                onChange={e => setPvForm(f => ({ ...f, namespace: e.target.value }))}
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setCreatePvOpen(false)}>取消</Button>
            <Button type="submit">确认创建</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!expandTarget} onClose={() => setExpandTarget(null)} title="在线无缝扩容" width="sm">
        {expandTarget && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
              <p className="text-text-primary font-medium">{expandTarget.name}</p>
              <p className="text-text-muted text-xs mt-1">当前容量 {expandTarget.currentGiB} GiB，扩容过程中业务挂载保持在线，无需停机。</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text-secondary">目标容量 (GiB)</label>
              <input
                type="number"
                min={expandTarget.currentGiB + 1}
                value={targetCapacityGiB}
                onChange={e => setTargetCapacityGiB(e.target.value)}
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60"
              />
            </div>
            <div className="text-xs text-text-muted rounded-lg border border-border px-3 py-3 bg-base/50">
              扩容策略：在线扩容、文件系统元数据热更新、业务 I/O 会话保持不中断。单次扩容量超过安全阈值时，系统将自动回滚。
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setExpandTarget(null)}>取消</Button>
              <Button onClick={handleExpandSubmit}>确认扩容</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
