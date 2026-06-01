import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  ChevronRight,
  Clock,
  Copy,
  Database,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatusDot } from '../../../components/ui/StatusDot';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { mockPreheatTasks } from '../../../data/mockTraining';
import { getRuntimeTrainingJobs, saveRuntimeTrainingJobs } from '../../../data/mockTrainingRuntime';
import type { DataPreheatTask, TrainingJob, TrainingStatus } from '../../../types';

const statusMeta: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'ghost' | 'secondary' }> = {
  running: { label: '训练中', variant: 'success' },
  completed: { label: '已完成', variant: 'ghost' },
  failed: { label: '失败', variant: 'error' },
  queued: { label: '排队中', variant: 'secondary' },
  stopped: { label: '已停止', variant: 'ghost' },
};

const preheatStatusMeta: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'ghost' | 'secondary' }> = {
  queued: { label: '排队中', variant: 'secondary' },
  warming: { label: '预热中', variant: 'warning' },
  ready: { label: '已就绪', variant: 'success' },
  failed: { label: '失败', variant: 'error' },
  expired: { label: '已过期', variant: 'ghost' },
};

const TYPE_TABS = [
  { key: 'all', label: '全部任务' },
  { key: 'quick', label: '快速微调' },
  { key: 'expert', label: '专家微调' },
  { key: 'pretrain', label: '预训练' },
  { key: 'lora', label: 'LoRA / QLoRA' },
];

type TuningMode = 'quick' | 'expert' | 'pretrain';

const PROFILE_CARDS: Array<{
  key: TuningMode;
  title: string;
  description: string;
  eta: string;
  resource: string;
  badge: string;
  variant: 'primary' | 'warning' | 'accent';
}> = [
  {
    key: 'quick',
    title: '快速微调',
    description: '面向业务验证与快速迭代，优先使用 LoRA / QLoRA 与默认模板。',
    eta: '30-90 分钟',
    resource: '1-2 张 GPU',
    badge: '推荐日常迭代',
    variant: 'primary',
  },
  {
    key: 'expert',
    title: '专家微调',
    description: '支持更细粒度的超参、抢占策略和多阶段评估，适合关键业务模型。',
    eta: '2-12 小时',
    resource: '4-8 张 GPU',
    badge: '支持抢占窗口',
    variant: 'warning',
  },
  {
    key: 'pretrain',
    title: '预训练',
    description: '适合长周期增量训练与大规模语料持续学习，支持长期资源锁定。',
    eta: '1-3 天',
    resource: '8+ 张 GPU',
    badge: '长期作业',
    variant: 'accent',
  },
];

function isQuickJob(job: TrainingJob) {
  return ['fine-tune-fast', 'lora', 'qlora'].includes(job.type);
}

function isExpertJob(job: TrainingJob) {
  return ['fine-tune-expert', 'full'].includes(job.type);
}

function matchesTypeTab(job: TrainingJob, tab: string) {
  if (tab === 'all') return true;
  if (tab === 'quick') return isQuickJob(job);
  if (tab === 'expert') return isExpertJob(job);
  if (tab === 'lora') return ['lora', 'qlora'].includes(job.type);
  return job.type === tab;
}

function priorityMeta(priority: number) {
  if (priority >= 3) return { label: '紧急', badge: 'error' as const };
  if (priority === 2) return { label: '高', badge: 'warning' as const };
  if (priority <= 0) return { label: '低', badge: 'ghost' as const };
  return { label: '中', badge: 'primary' as const };
}

export default function TrainingPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<TrainingJob[]>(() => getRuntimeTrainingJobs());
  const [mainTab, setMainTab] = useState<'training' | 'preheat'>('training');
  const [preheatTasks, setPreheatTasks] = useState<DataPreheatTask[]>(mockPreheatTasks);
  const [page, setPage] = useState(1);
  const [typeTab, setTypeTab] = useState('all');
  const navigate = useNavigate();
  const [preheatForm, setPreheatForm] = useState({
    modelName: 'Qwen2.5-72B-Instruct-ZY',
    datasetName: 'ChineseMedical-QA-v2 v2.1',
    targetNodePool: 'a100-prod-pool',
    cacheQuotaGiB: '512',
    nvmePath: '/local_nvme/cache/qwen72b-medqa',
  });

  const filtered = useMemo(() => jobs.filter(job => matchesTypeTab(job, typeTab)), [jobs, typeTab]);

  const pagedJobs = useMemo(
    () => filtered.slice((page - 1) * 10, page * 10),
    [filtered, page],
  );

  const quickJobs = useMemo(() => jobs.filter(isQuickJob).length, [jobs]);
  const expertJobs = useMemo(() => jobs.filter(isExpertJob).length, [jobs]);
  const preemptibleQueued = useMemo(
    () => jobs.filter(job => job.status === 'queued' && job.priority >= 2).length,
    [jobs],
  );
  const totalRunningGpu = useMemo(
    () => jobs.filter(job => job.status === 'running').reduce((sum, job) => sum + job.gpuCount, 0),
    [jobs],
  );

  const queueLanes = useMemo(
    () => [
      {
        key: 'urgent',
        label: '紧急通道',
        color: 'bg-error',
        count: jobs.filter(job => job.priority >= 3).length,
        note: '可触发算力抢占',
      },
      {
        key: 'priority',
        label: '高优队列',
        color: 'bg-warning',
        count: jobs.filter(job => job.priority === 2).length,
        note: '优先调度至空闲高配卡',
      },
      {
        key: 'normal',
        label: '常规队列',
        color: 'bg-primary',
        count: jobs.filter(job => job.priority <= 1).length,
        note: '按 Binpack / DRF 混合排队',
      },
    ],
    [jobs],
  );

  const preheatReadyCount = useMemo(
    () => preheatTasks.filter(item => item.status === 'ready').length,
    [preheatTasks],
  );

  const preheatWarmingCount = useMemo(
    () => preheatTasks.filter(item => item.status === 'warming').length,
    [preheatTasks],
  );

  const avgHitRate = useMemo(() => {
    const valid = preheatTasks.filter(item => typeof item.hitRate === 'number') as Array<DataPreheatTask & { hitRate: number }>;
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((sum, item) => sum + item.hitRate, 0) / valid.length);
  }, [preheatTasks]);

  const handleDelete = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
    toast.success('任务已删除');
  };

  const handleClone = (job: TrainingJob) => {
    const clone: TrainingJob = {
      ...job,
      id: `tj${Date.now()}`,
      name: `${job.name}-副本`,
      status: 'queued',
      progress: 0,
      currentEpoch: 0,
      createdAt: new Date().toISOString(),
      metrics: [],
    };
    setJobs(prev => [clone, ...prev]);
    toast.success(`已克隆任务: ${clone.name}`);
  };

  const handlePublish = (job: TrainingJob) => {
    toast.success(`已将 ${job.name} 发布到模型仓库`);
  };

  const handleCreatePreheat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preheatForm.modelName.trim() || !preheatForm.datasetName.trim()) {
      toast.warning('模型和数据集不能为空', '请指定需要预加载的模型与数据集');
      return;
    }
    if (!preheatForm.nvmePath.trim()) {
      toast.warning('请填写 NVMe 缓存路径', '例如 /local_nvme/cache/qwen72b-medqa');
      return;
    }
    const quota = Number(preheatForm.cacheQuotaGiB);
    if (!Number.isFinite(quota) || quota <= 0) {
      toast.warning('缓存配额无效', '请填写大于 0 的 NVMe 缓存配额（GiB）');
      return;
    }

    const next: DataPreheatTask = {
      id: `ph${Date.now()}`,
      modelName: preheatForm.modelName.trim(),
      datasetName: preheatForm.datasetName.trim(),
      targetNodePool: preheatForm.targetNodePool.trim(),
      nvmePath: preheatForm.nvmePath.trim(),
      cacheQuotaGiB: quota,
      status: 'queued',
      progress: 0,
      estimatedReadyMinutes: 18,
      createdAt: new Date().toISOString(),
      createdBy: '张远航',
    };
    setPreheatTasks(prev => [next, ...prev]);
    toast.success('数据预热任务已创建', '将模型与数据集预加载到计算节点本地 NVMe 缓存');
  };

  const handleAdvancePreheat = (id: string) => {
    setPreheatTasks(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (item.status === 'queued') {
        return { ...item, status: 'warming', progress: 35, estimatedReadyMinutes: 12 };
      }
      if (item.status === 'warming') {
        return {
          ...item,
          status: 'ready',
          progress: 100,
          estimatedReadyMinutes: 0,
          expiresAt: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
          hitRate: Math.max(78, item.hitRate ?? 82),
        };
      }
      return item;
    }));
  };

  const handleDeletePreheat = (id: string) => {
    setPreheatTasks(prev => prev.filter(item => item.id !== id));
    toast.success('已移除预热任务');
  };

  useEffect(() => {
    saveRuntimeTrainingJobs(jobs);
  }, [jobs]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="训练任务"
        subtitle="模型微调、预训练与调度加速管理"
        icon={<Zap size={20} />}
        actions={<Link to="/user/training/create"><Button leftIcon={<Plus size={14} />}>提交任务</Button></Link>}
      />

      <Tabs
        tabs={[
          { key: 'training', label: '训练任务', count: jobs.length },
          { key: 'preheat', label: '数据预热', count: preheatTasks.length },
        ]}
        active={mainTab}
        onChange={value => setMainTab(value as 'training' | 'preheat')}
      />

      {mainTab === 'training' ? (
        <>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '快速微调任务', value: quickJobs, note: '模板化 SFT / LoRA', icon: <Sparkles size={16} className="text-primary" />, color: 'text-primary' },
          { label: '专家微调任务', value: expertJobs, note: '支持抢占与高级评估', icon: <ShieldCheck size={16} className="text-warning" />, color: 'text-warning' },
          { label: '运行中 GPU', value: totalRunningGpu, note: '已分配训练卡数', icon: <Zap size={16} className="text-success" />, color: 'text-success' },
          { label: '待抢占任务', value: preemptibleQueued, note: '紧急任务可插队', icon: <Clock size={16} className="text-accent" />, color: 'text-accent' },
        ].map((item, index) => (
          <Card key={item.label} className={`card-hover hover-lift animate-slide-up stagger-${index}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-text-muted mb-1">{item.label}</p>
                <p className={`text-2xl font-bold animate-number-pop ${item.color}`}>{item.value}</p>
                <p className="text-xs text-text-muted mt-1">{item.note}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-base border border-border flex items-center justify-center">{item.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 card-hover animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-text-primary">微调模式模板</p>
              <p className="text-xs text-text-muted mt-1">从快速微调、专家微调与预训练模板中预置任务参数，直接发起训练。</p>
            </div>
            <Badge variant="primary">支持模板 + 抢占 + NVMe 预热</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PROFILE_CARDS.map((profile, index) => (
              <button
                key={profile.key}
                type="button"
                onClick={() => navigate('/user/training/create?mode=' + profile.key)}
                className={`text-left rounded-xl border border-border bg-base p-4 card-hover hover-lift animate-scale-in stagger-${index + 1}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={profile.variant}>{profile.badge}</Badge>
                  <span className="text-[11px] text-text-muted">{profile.eta}</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{profile.title}</p>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">{profile.description}</p>
                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-text-secondary flex items-center justify-between">
                  <span>资源建议</span>
                  <span>{profile.resource}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="card-hover animate-slide-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <Database size={15} className="text-accent" />
            <span className="text-sm font-semibold text-text-primary">调度与预热看板</span>
          </div>
          <div className="space-y-4">
            {queueLanes.map((lane, index) => (
              <div key={lane.key} className={`animate-slide-right stagger-${index}`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-secondary">{lane.label}</span>
                  <span className="text-text-muted">{lane.count} 个任务</span>
                </div>
                <div className="h-2 rounded-full bg-base overflow-hidden">
                  <div
                    className={`h-full ${lane.color} progress-bar-fill rounded-full`}
                    style={{ width: `${Math.max(12, Math.min(100, lane.count * 18))}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1.5">{lane.note}</p>
              </div>
            ))}
            <div className="rounded-xl border border-success/20 bg-success/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">NVMe 预热覆盖建议</span>
                <Badge variant="success">建议开启</Badge>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">大模型权重与热点数据分片可预加载到本地 NVMe，预计冷启动加载时间下降 40%-65%。</p>
            </div>
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">紧急抢占窗口</span>
                <span className="text-xs text-warning text-glow-primary">22:00 - 06:00</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">高优任务可在夜间窗口回收低优先级训练卡，确保生产热修任务快速落地。</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs
        tabs={TYPE_TABS.map(tabItem => ({
          key: tabItem.key,
          label: tabItem.label,
          count: jobs.filter(job => matchesTypeTab(job, tabItem.key)).length,
        }))}
        active={typeTab}
        onChange={value => {
          setTypeTab(value);
          setPage(1);
        }}
      />

      <div className="flex items-center gap-4 text-sm flex-wrap">
        {[
          { label: '训练中', count: filtered.filter(job => job.status === 'running').length, status: 'running' },
          { label: '排队中', count: filtered.filter(job => job.status === 'queued').length, status: 'queued' },
          { label: '已完成', count: filtered.filter(job => job.status === 'completed').length, status: 'completed' },
          { label: '失败', count: filtered.filter(job => job.status === 'failed').length, status: 'failed' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <StatusDot status={item.status as TrainingStatus} />
            <span className="text-text-muted">{item.label}</span>
            <span className="font-semibold text-text-secondary">{item.count}</span>
          </div>
        ))}
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['任务名称', '模式 / 类型', '基础模型', '数据集', '状态', '进度 / 指标', '资源', '优先级', '提交时间', '操作'].map(header => (
                  <th key={header} className="px-3 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedJobs.map((job, index) => {
                const meta = statusMeta[job.status] ?? { label: job.status, variant: 'ghost' as const };
                const priority = priorityMeta(job.priority);
                const lastMetric = job.metrics.slice(-1)[0];
                return (
                  <tr key={`${job.id}-${index}`} className={`border-b border-border/50 hover:bg-white/2 transition-colors animate-slide-up stagger-${index % 6}`}>
                    <td className="px-3 py-3">
                      <Link to={`/user/training/${job.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <StatusDot status={job.status} />
                        <span className="text-sm text-text-primary font-medium">{job.name}</span>
                        <ChevronRight size={12} className="text-text-muted" />
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={isExpertJob(job) ? 'warning' : job.type === 'pretrain' ? 'accent' : 'primary'}>
                          {isExpertJob(job) ? '专家' : job.type === 'pretrain' ? '预训练' : '快速'}
                        </Badge>
                        <span className="text-xs bg-white/5 border border-border rounded px-1.5 py-0.5 text-text-muted capitalize">{job.type}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-text-muted max-w-28 truncate">{job.baseModel}</td>
                    <td className="px-3 py-3 text-xs text-text-muted max-w-24 truncate">{job.dataset}</td>
                    <td className="px-3 py-3"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                    <td className="px-3 py-3">
                      {(job.status === 'running' || job.status === 'completed') ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-[width] duration-700 ${
                                  job.status === 'running'
                                    ? 'bg-gradient-to-r from-primary to-accent progress-bar-fill animate-running-bar'
                                    : 'bg-primary progress-bar-fill'
                                }`}
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-muted">{job.progress}%</span>
                          </div>
                          {lastMetric && (
                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted flex-wrap">
                              <BarChart2 size={9} />
                              <span>loss:{lastMetric.loss.toFixed(3)}</span>
                              {lastMetric.accuracy !== undefined && <span>acc:{lastMetric.accuracy.toFixed(1)}%</span>}
                              <span>gpu:{lastMetric.gpuUtilization}%</span>
                            </div>
                          )}
                        </div>
                      ) : <span className="text-xs text-text-muted">等待资源分配</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{job.gpuType} ×{job.gpuCount}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={priority.badge}>{priority.label}</Badge>
                        {job.priority >= 3 && <span className="text-[10px] text-error">可抢占</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" leftIcon={<Copy size={11} />} onClick={() => handleClone(job)} title="克隆任务" />
                        {job.status === 'completed' && (
                          <Button size="sm" variant="ghost" leftIcon={<Share2 size={11} />} onClick={() => handlePublish(job)} title="发布到模型仓库" />
                        )}
                        <Button size="sm" variant="ghost" leftIcon={<Trash2 size={11} />} onClick={() => handleDelete(job.id)} className="text-error/70 hover:text-error" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={page} total={filtered.length} onChange={setPage} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[
              { label: '预热任务总数', value: preheatTasks.length, note: '模型+数据集联合预加载' },
              { label: '预热中', value: preheatWarmingCount, note: '正在写入节点本地 NVMe' },
              { label: '已就绪', value: preheatReadyCount, note: '训练可直接命中缓存' },
              { label: '平均缓存命中率', value: `${avgHitRate}%`, note: '热启动读取速度提升明显' },
            ].map(item => (
              <Card key={item.label}>
                <p className="text-xs text-text-muted mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="text-xs text-text-muted mt-1">{item.note}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-1">
              <p className="text-sm font-semibold text-text-primary mb-4">创建数据预热任务</p>
              <form className="space-y-3" onSubmit={handleCreatePreheat}>
                <Input
                  label="预加载模型"
                  value={preheatForm.modelName}
                  onChange={e => setPreheatForm(prev => ({ ...prev, modelName: e.target.value }))}
                  placeholder="例如 Qwen2.5-72B-Instruct-ZY"
                />
                <Input
                  label="预加载数据集"
                  value={preheatForm.datasetName}
                  onChange={e => setPreheatForm(prev => ({ ...prev, datasetName: e.target.value }))}
                  placeholder="例如 ChineseMedical-QA-v2 v2.1"
                />
                <Select
                  label="目标计算节点池"
                  value={preheatForm.targetNodePool}
                  onChange={e => setPreheatForm(prev => ({ ...prev, targetNodePool: e.target.value }))}
                  options={[
                    { value: 'a100-prod-pool', label: 'A100 生产训练池' },
                    { value: 'h100-vision-pool', label: 'H100 多模态训练池' },
                    { value: 'a10-rag-pool', label: 'A10 业务训练池' },
                  ]}
                />
                <Input
                  label="NVMe 缓存配额 (GiB)"
                  type="number"
                  min={50}
                  value={preheatForm.cacheQuotaGiB}
                  onChange={e => setPreheatForm(prev => ({ ...prev, cacheQuotaGiB: e.target.value }))}
                />
                <Input
                  label="NVMe 缓存路径"
                  value={preheatForm.nvmePath}
                  onChange={e => setPreheatForm(prev => ({ ...prev, nvmePath: e.target.value }))}
                  placeholder="例如 /local_nvme/cache/qwen72b-medqa"
                />
                <Button type="submit" className="w-full">创建预热任务</Button>
              </form>
              <div className="mt-3 text-xs text-text-muted bg-white/5 border border-border rounded-lg px-3 py-2 leading-relaxed">
                功能说明：系统将指定模型权重与数据集分片预加载至计算节点本地 NVMe 缓存，训练任务启动时优先从本地缓存读取，显著减少加载时间。
              </div>
            </Card>

            <Card noPadding className="xl:col-span-2 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {['模型', '数据集', '节点池', 'NVMe 路径', '缓存配额', '状态', '进度', '预计就绪', '命中率', '操作'].map(header => (
                        <th key={header} className="px-3 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preheatTasks.map(task => {
                      const meta = preheatStatusMeta[task.status] ?? { label: task.status, variant: 'ghost' as const };
                      return (
                        <tr key={task.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                          <td className="px-3 py-3 text-xs text-text-secondary whitespace-nowrap">{task.modelName}</td>
                          <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{task.datasetName}</td>
                          <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{task.targetNodePool}</td>
                          <td className="px-3 py-3 text-xs text-text-muted max-w-40 truncate">{task.nvmePath}</td>
                          <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{task.cacheQuotaGiB} GiB</td>
                          <td className="px-3 py-3"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                          <td className="px-3 py-3 min-w-36">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${task.progress}%` }} />
                              </div>
                              <span className="text-xs text-text-muted">{task.progress}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{task.estimatedReadyMinutes <= 0 ? '已就绪' : `${task.estimatedReadyMinutes} 分钟`}</td>
                          <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{task.hitRate !== undefined ? `${task.hitRate}%` : '—'}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {(task.status === 'queued' || task.status === 'warming') && (
                                <Button size="sm" variant="ghost" onClick={() => handleAdvancePreheat(task.id)}>
                                  推进
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" leftIcon={<Trash2 size={11} />} className="text-error/80 hover:text-error" onClick={() => handleDeletePreheat(task.id)} />
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
        </>
      )}
    </div>
  );
}
