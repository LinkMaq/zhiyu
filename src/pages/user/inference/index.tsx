import { useMemo, useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  CheckCircle2,
  Clock,
  Cloud,
  Cpu,
  FileText,
  GitBranch,
  Layers,
  Loader2,
  Package,
  Play,
  Plus,
  Settings,
  Square,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatusDot } from '../../../components/ui/StatusDot';
import { Tabs } from '../../../components/ui/Tabs';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import {
  getRuntimeBatchJobs,
  getRuntimeInferenceServices,
  saveRuntimeBatchJobs,
  saveRuntimeInferenceServices,
} from '../../../data/mockInferenceRuntime';
import type { InferenceService } from '../../../types';

const statusMeta: Record<string, { label: string; variant: 'success' | 'ghost' | 'secondary' | 'error' }> = {
  running:  { label: '运行中',   variant: 'success' },
  stopped:  { label: '已停止',   variant: 'ghost' },
  deploying: { label: '部署中',  variant: 'secondary' },
  error:    { label: '异常',     variant: 'error' },
  stopping: { label: '停止中',   variant: 'warning' as never },
  scaling:  { label: '扩缩容中', variant: 'warning' as never },
};

type ElasticStrategy = 'qps' | 'latency' | 'gpu' | 'schedule';

interface ElasticPolicy {
  strategy: ElasticStrategy;
  minReplicas: string;
  maxReplicas: string;
  targetQps: string;
  targetLatency: string;
  targetGpu: string;
  scheduleWindow: string;
  cooldown: string;
  burstReplicas: string;
}

interface ServicePerfSnapshot {
  callFrequencyPerSecond: number;
  failureRate: number;
  e2eLatency: number;
  rpm: number;
  tpm: number;
  ttft: number;
  tpot: number;
}

interface ServicePerfTrendPoint {
  label: string;
  callFrequencyPerSecond: number;
  rpm: number;
  tpm: number;
  failureRate: number;
  e2eLatency: number;
  ttft: number;
  tpot: number;
}

interface BatchJob {
  id: string;
  name: string;
  model: string;
  dataset: string;
  totalItems: number;
  doneItems: number;
  status: 'running' | 'completed' | 'failed' | 'queued';
  gpuType: string;
  gpuCount: number;
  concurrency: number;
  createdAt: string;
  finishedAt?: string;
  creator: string;
  outputPath: string;
  schedule: string;
  outputFormat: string;
  callback?: string;
}

const batchStatusMeta: Record<BatchJob['status'], { icon: ReactElement; variant: 'primary' | 'success' | 'error' | 'warning'; label: string }> = {
  running: { icon: <Zap size={12} className="text-primary" />, variant: 'primary', label: '运行中' },
  completed: { icon: <CheckCircle2 size={12} className="text-success" />, variant: 'success', label: '已完成' },
  failed: { icon: <XCircle size={12} className="text-error" />, variant: 'error', label: '失败' },
  queued: { icon: <Clock size={12} className="text-warning" />, variant: 'warning', label: '排队中' },
};

function createDefaultPolicy(service: InferenceService): ElasticPolicy {
  return {
    strategy: service.scaleMetric === 'gpu' ? 'gpu' : service.scaleMetric === 'latency' ? 'latency' : 'qps',
    minReplicas: String(service.minReplicas),
    maxReplicas: String(service.maxReplicas),
    targetQps: String(service.scaleMetric === 'qps' ? service.scaleThreshold : Math.max(100, service.qps)),
    targetLatency: String(service.scaleMetric === 'latency' ? service.scaleThreshold : Math.max(120, service.avgLatency)),
    targetGpu: String(service.scaleMetric === 'gpu' ? service.scaleThreshold : 75),
    scheduleWindow: '09:00-21:00',
    cooldown: '5',
    burstReplicas: String(Math.max(1, service.maxReplicas - service.minReplicas)),
  };
}

function getServiceSeed(service: InferenceService): number {
  return service.id.split('').reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
}

function createPerfSnapshot(service: InferenceService, tick: number): ServicePerfSnapshot {
  const seed = getServiceSeed(service) + tick * 7;
  const qpsJitter = (Math.sin(seed / 3) + Math.cos(seed / 5)) * 0.5;
  const callFrequencyPerSecond = Math.max(0.1, Number((service.qps + qpsJitter * 6).toFixed(1)));
  const rpm = Math.max(1, Math.round(callFrequencyPerSecond * 60));
  const tokenPerRequest = Math.max(24, Math.round((service.batchSize ?? 1) * 32 + (service.model.length % 30)));
  const tpm = rpm * tokenPerRequest;
  const ttft = Math.max(
    80,
    Math.round((service.pdSeparation ? service.avgLatency * 0.52 : service.avgLatency * 0.76) + Math.sin(seed / 4) * 12),
  );
  const tpot = Math.max(
    6,
    Math.round((service.pdSeparation ? service.avgLatency / 20 : service.avgLatency / 15) + Math.cos(seed / 6) * 2),
  );
  const e2eLatency = Math.max(
    ttft + tpot * 2,
    Math.round(service.avgLatency + ttft * 0.3 + Math.max(10, service.p99Latency - service.avgLatency) * 0.2),
  );
  const baseFailure = Math.max(0.05, Number((100 - service.availability).toFixed(2)));
  const failureRate = Math.min(
    20,
    Math.max(
      0.03,
      Number(
        (
          baseFailure
          + (service.status === 'running' ? 0.08 : 1.2)
          + (Math.sin(seed / 7) + 1) * 0.05
        ).toFixed(2),
      ),
    ),
  );

  return {
    callFrequencyPerSecond,
    failureRate,
    e2eLatency,
    rpm,
    tpm,
    ttft,
    tpot,
  };
}

function createPerfTrend(
  service: InferenceService,
  snapshot: ServicePerfSnapshot,
  tick: number,
): ServicePerfTrendPoint[] {
  const seed = getServiceSeed(service);
  const labels = ['-55m', '-50m', '-45m', '-40m', '-35m', '-30m', '-25m', '-20m', '-15m', '-10m', '-5m', '当前'];

  return labels.map((label, index) => {
    const phase = tick + index + seed / 10;
    const callFrequencyPerSecond = Math.max(0.1, Number((snapshot.callFrequencyPerSecond + Math.sin(phase * 0.7) * 1.6).toFixed(1)));
    const rpm = Math.max(1, Math.round(snapshot.rpm + Math.sin(phase) * 40 + (index - 2) * 8));
    const tpm = Math.max(200, Math.round(snapshot.tpm + Math.cos(phase * 0.8) * 2000 + (index - 2) * 350));
    const failureRate = Math.max(0.02, Number((snapshot.failureRate + Math.sin(phase * 0.65) * 0.08).toFixed(2)));
    const e2eLatency = Math.max(50, Math.round(snapshot.e2eLatency + Math.cos(phase * 0.9) * 18 + (index - 2) * 2));
    const ttft = Math.max(70, Math.round(snapshot.ttft + Math.sin(phase * 0.75) * 10 + (index - 2) * 1.5));
    const tpot = Math.max(5, Number((snapshot.tpot + Math.cos(phase * 0.55) * 0.8).toFixed(1)));
    return { label, callFrequencyPerSecond, rpm, tpm, failureRate, e2eLatency, ttft, tpot };
  });
}

export default function InferencePage() {
  const { toast } = useToast();
  const [services, setServices] = useState<InferenceService[]>(() => getRuntimeInferenceServices());
  const [modeTab, setModeTab] = useState('online');
  const [scaleServiceId, setScaleServiceId] = useState<string | null>(null);
  const [elasticPolicies, setElasticPolicies] = useState<Record<string, ElasticPolicy>>(() => (
    Object.fromEntries(getRuntimeInferenceServices().map(service => [service.id, createDefaultPolicy(service)]))
  ));
  const [scaleForm, setScaleForm] = useState<ElasticPolicy>(() => createDefaultPolicy(getRuntimeInferenceServices()[0] ?? {
    id: 'default', name: 'default', model: '', modelVersion: '', status: 'running', framework: 'vLLM', gpuType: 'NVIDIA A100 80GB', gpuCount: 1,
    replicas: 1, minReplicas: 1, maxReplicas: 2, cpu: 8, memory: '16Gi', qps: 100, avgLatency: 120, p99Latency: 240, availability: 99.9,
    createdAt: new Date().toISOString(), creator: '系统', endpoint: '-', namespace: 'default', autoScaling: true, scaleMetric: 'qps',
    scaleThreshold: 80, deployMode: 'model', pdSeparation: false,
  }));
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>(() => getRuntimeBatchJobs());
  const [metricsServiceId, setMetricsServiceId] = useState<string | null>(null);
  const [metricsTick, setMetricsTick] = useState(0);


  const onlineServices = useMemo(() => services.filter(service => service.framework !== 'batch'), [services]);
  const runningServices = useMemo(() => services.filter(service => service.status === 'running'), [services]);
  const pdServices = useMemo(() => onlineServices.filter(service => service.pdSeparation), [onlineServices]);
  const scheduledPolicies = useMemo(
    () => onlineServices.filter(service => elasticPolicies[service.id]?.strategy === 'schedule').length,
    [elasticPolicies, onlineServices],
  );

  const totalQps = runningServices.reduce((accumulator, service) => accumulator + service.qps, 0);
  const avgLatency = runningServices.length > 0
    ? Math.round(runningServices.reduce((accumulator, service) => accumulator + service.avgLatency, 0) / runningServices.length)
    : 0;
  const totalPrefillReplicas = pdServices.reduce((accumulator, service) => accumulator + (service.prefillReplicas ?? 1), 0);
  const totalDecodeReplicas = pdServices.reduce((accumulator, service) => accumulator + (service.decodeReplicas ?? Math.max(1, service.replicas - 1)), 0);
  const metricsService = useMemo(
    () => services.find(service => service.id === metricsServiceId) ?? null,
    [metricsServiceId, services],
  );
  const perfSnapshot = useMemo(
    () => (metricsService ? createPerfSnapshot(metricsService, metricsTick) : null),
    [metricsService, metricsTick],
  );
  const perfTrend = useMemo(
    () => (metricsService && perfSnapshot ? createPerfTrend(metricsService, perfSnapshot, metricsTick) : []),
    [metricsService, perfSnapshot, metricsTick],
  );

  const openScaleModal = (service: InferenceService) => {
    setScaleServiceId(service.id);
    setScaleForm(elasticPolicies[service.id] ?? createDefaultPolicy(service));
  };

  const handleToggle = (id: string, current: string) => {
    if (current === 'running' || current === 'scaling') {
      setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'stopping' } : s));
      setTimeout(() => {
        setServices(prev => prev.map(s => s.id === id && s.status === 'stopping' ? { ...s, status: 'stopped' } : s));
        toast.success('服务已停止', '实例已缩容至 0，不再计费');
      }, 1400);
    } else {
      setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'deploying' } : s));
      setTimeout(() => {
        setServices(prev => prev.map(s => s.id === id && s.status === 'deploying' ? { ...s, status: 'running' } : s));
        toast.success('服务已启动', '健康检查通过，开始接受请求');
      }, 2200);
    }
  };

  const handleDelete = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
    setMetricsServiceId(prev => (prev === id ? null : prev));
    toast.success('推理服务已删除');
  };

  const handleScale = (event: React.FormEvent) => {
    event.preventDefault();
    if (!scaleServiceId) return;

    setElasticPolicies(prev => ({
      ...prev,
      [scaleServiceId]: scaleForm,
    }));

    setServices(prev => prev.map(service => {
      if (service.id !== scaleServiceId) return service;
      return {
        ...service,
        minReplicas: Number(scaleForm.minReplicas),
        maxReplicas: Number(scaleForm.maxReplicas),
        autoScaling: true,
        scaleMetric: scaleForm.strategy === 'schedule' ? service.scaleMetric : scaleForm.strategy,
        scaleThreshold: Number(
          scaleForm.strategy === 'gpu'
            ? scaleForm.targetGpu
            : scaleForm.strategy === 'latency'
              ? scaleForm.targetLatency
              : scaleForm.targetQps,
        ),
      };
    }));

    // Animate scaling state
    const scalingId = scaleServiceId;
    setServices(prev => prev.map(s => s.id === scalingId && s.status === 'running' ? { ...s, status: 'scaling' } : s));
    setTimeout(() => {
      setServices(prev => prev.map(s => s.id === scalingId && s.status === 'scaling' ? { ...s, status: 'running' } : s));
    }, 2000);

    setScaleServiceId(null);
    toast.success('弹性扩缩容策略已更新', scaleForm.strategy === 'schedule' ? '已启用定时扩缩容窗口' : '已启用实时指标触发');
  };

  const handleDeleteBatch = (id: string) => {
    setBatchJobs(prev => prev.filter(job => job.id !== id));
    toast.success('批量任务已删除');
  };

  useEffect(() => {
    saveRuntimeInferenceServices(services);
  }, [services]);

  useEffect(() => {
    saveRuntimeBatchJobs(batchJobs);
  }, [batchJobs]);

  // Live QPS jitter for running services
  useEffect(() => {
    const timer = setInterval(() => {
      setServices(prev => prev.map(s => {
        if (s.status !== 'running') return s;
        const delta = Math.floor((Math.random() - 0.45) * 8);
        return { ...s, qps: Math.max(0, s.qps + delta) };
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Batch job progress ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setBatchJobs(prev => prev.map(job => {
        if (job.status !== 'running') return job;
        const done = Math.min(job.totalItems, job.doneItems + Math.floor(Math.random() * 220 + 80));
        if (done >= job.totalItems) {
          return { ...job, doneItems: job.totalItems, status: 'completed', finishedAt: new Date().toISOString() };
        }
        return { ...job, doneItems: done };
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!metricsServiceId) return;
    const timer = setInterval(() => {
      setMetricsTick(prev => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [metricsServiceId]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="推理服务"
        subtitle={`${runningServices.length} 个服务运行中 · 总 QPS ${totalQps}`}
        icon={<Cloud size={20} />}
        actions={
          <Link to="/user/inference/create">
            <Button leftIcon={<Plus size={14} />}>部署新服务</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '运行中', value: runningServices.length, color: 'text-success', icon: <Cloud size={16} /> },
          { label: '总 QPS', value: totalQps.toFixed(1), color: 'text-primary', icon: <Zap size={16} /> },
          { label: '平均延迟', value: `${avgLatency}ms`, color: 'text-warning', icon: <Activity size={16} /> },
          { label: '总副本数', value: runningServices.reduce((sum, service) => sum + service.replicas, 0), color: 'text-accent', icon: <Layers size={16} /> },
        ].map((metric, index) => (
          <Card key={metric.label} className={`card-hover hover-lift animate-slide-up stagger-${index}`}>
            <div className="flex items-center gap-3">
              <span className={metric.color}>{metric.icon}</span>
              <div>
                <p className="text-xs text-text-muted">{metric.label}</p>
                <p className={`text-xl font-bold animate-number-pop ${metric.color}`}>{metric.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {[
          { title: '实时指标触发', value: onlineServices.filter(service => elasticPolicies[service.id]?.strategy !== 'schedule').length, note: 'QPS / 延迟 / GPU 利用率', badge: '指标驱动', variant: 'primary' as const },
          { title: '定时扩缩容窗口', value: scheduledPolicies, note: '业务高峰前预扩容', badge: '定时策略', variant: 'accent' as const },
          { title: 'PD 分离服务', value: pdServices.length, note: `Prefill ${totalPrefillReplicas} / Decode ${totalDecodeReplicas}`, badge: '架构分离', variant: 'warning' as const },
          { title: '离线批量任务', value: batchJobs.filter(job => job.status === 'running' || job.status === 'queued').length, note: '支持输出回调与离峰执行', badge: '批处理', variant: 'success' as const },
        ].map((item, index) => (
          <Card key={item.title} className={`card-hover animate-slide-up stagger-${index + 1}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-text-muted">{item.title}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{item.value}</p>
                <p className="text-xs text-text-muted mt-1">{item.note}</p>
              </div>
              <Badge variant={item.variant}>{item.badge}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { key: 'online', label: '在线推理', count: onlineServices.length },
          { key: 'pd', label: 'PD 分离', count: pdServices.length },
          { key: 'batch', label: '离线批量推理', count: batchJobs.length },
        ]}
        active={modeTab}
        onChange={setModeTab}
      />

      {modeTab === 'batch' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: '运行中任务', value: batchJobs.filter(job => job.status === 'running').length, note: '离线长任务持续处理中' },
              { label: '等待队列', value: batchJobs.filter(job => job.status === 'queued').length, note: '支持离峰自动调度' },
              { label: '总吞吐', value: `${batchJobs.reduce((sum, job) => sum + job.doneItems, 0).toLocaleString()} 条`, note: '累计已完成处理量' },
            ].map((item, index) => (
              <Card key={item.label} className={`card-hover animate-slide-up stagger-${index}`}>
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="text-xl font-bold text-text-primary mt-1">{item.value}</p>
                <p className="text-xs text-text-muted mt-1">{item.note}</p>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-text-muted">共 {batchJobs.length} 个批量推理任务，适用于非实时响应场景，支持定时执行与结果回调。</p>
            <Link to="/user/inference/batch/create"><Button leftIcon={<Plus size={14} />}>新建批量任务</Button></Link>
          </div>

          {batchJobs.length === 0 ? (
            <EmptyState
              icon={<FileText size={32} />}
              title="暂无批量推理任务"
              description="创建离线批量推理任务，高效处理大规模数据集"
              action={<Link to="/user/inference/batch/create"><Button leftIcon={<Plus size={14} />}>新建批量任务</Button></Link>}
            />
          ) : (
            <div className="space-y-3">
              {batchJobs.map((job, index) => {
                const meta = batchStatusMeta[job.status];
                const progress = job.totalItems > 0 ? Math.round((job.doneItems / job.totalItems) * 100) : 0;
                return (
                  <Card key={job.id} className={`card-hover hover-lift animate-slide-up stagger-${index % 6}`}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-accent" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            {meta.icon}
                            <h3 className="text-sm font-semibold text-text-primary">{job.name}</h3>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                            <Badge variant="ghost">{job.outputFormat.toUpperCase()}</Badge>
                          </div>
                          <p className="text-xs text-text-muted">{job.model} · 数据集: {job.dataset} · {job.creator}</p>
                          <p className="text-xs text-text-muted mt-0.5">GPU: {job.gpuType} ×{job.gpuCount} · 并发: {job.concurrency} · 输出: {job.outputPath}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="accent">{job.schedule}</Badge>
                        {job.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Play size={12} />}
                            onClick={() => {
                              setBatchJobs(prev => prev.map(current => current.id === job.id ? { ...current, status: 'queued', doneItems: 0 } : current));
                              toast.success('批量任务已重新提交');
                            }}
                          >
                            重试
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} className="text-error/70 hover:text-error" onClick={() => handleDeleteBatch(job.id)}>删除</Button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                        <span>处理进度</span>
                        <span>{job.doneItems.toLocaleString()} / {job.totalItems.toLocaleString()} 条 ({progress}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-base overflow-hidden">
                        <div className={`h-full rounded-full progress-bar-fill ${job.status === 'failed' ? 'bg-error' : job.status === 'completed' ? 'bg-success' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-text-muted flex-wrap">
                        <span>创建: {new Date(job.createdAt).toLocaleString('zh-CN')}</span>
                        {job.finishedAt && <span>完成: {new Date(job.finishedAt).toLocaleString('zh-CN')}</span>}
                        {job.callback && <span>回调: {job.callback}</span>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {modeTab === 'pd' && (pdServices.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={32} />}
          title="暂无 PD 分离服务"
          description="将大模型服务拆分为 Router、Prefill、Decode 角色后，可分别扩缩容以优化 TTFT 与吞吐。"
          action={<Link to="/user/inference/create"><Button leftIcon={<Plus size={14} />}>创建 PD 服务</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Prefill 副本', value: totalPrefillReplicas, note: '负责上下文预填充与首 token 计算' },
              { label: 'Decode 副本', value: totalDecodeReplicas, note: '负责持续 token 解码输出' },
              { label: 'Router 实例', value: pdServices.length, note: '负责流量路由与角色协同' },
            ].map((item, index) => (
              <Card key={item.label} className={`card-hover animate-slide-up stagger-${index}`}>
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="text-xl font-bold text-text-primary mt-1">{item.value}</p>
                <p className="text-xs text-text-muted mt-1">{item.note}</p>
              </Card>
            ))}
          </div>

          {pdServices.map((service, index) => {
            const policy = elasticPolicies[service.id] ?? createDefaultPolicy(service);
            const routerReplicas = Math.max(1, Math.ceil(service.replicas / 3));
            const prefillReplicas = service.prefillReplicas ?? 1;
            const decodeReplicas = service.decodeReplicas ?? Math.max(1, service.replicas - 1);
            return (
              <Card key={service.id} className={`card-hover hover-lift animate-slide-up stagger-${index % 5}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusDot status={service.status} />
                      <h3 className="text-sm font-semibold text-text-primary">{service.name}</h3>
                      <Badge variant="accent"><GitBranch size={10} className="mr-1" />PD 分离</Badge>
                      <Badge variant="ghost">{service.framework}</Badge>
                      <Badge variant={policy.strategy === 'schedule' ? 'warning' : 'success'}>{policy.strategy === 'schedule' ? '定时扩缩容' : '指标扩缩容'}</Badge>
                    </div>
                    <p className="text-xs text-text-muted">{service.model} · {service.gpuType} ×{service.gpuCount} · Endpoint: {service.endpoint}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" leftIcon={<TrendingUp size={12} />} onClick={() => openScaleModal(service)}>弹性配置</Button>
                    <Button size="sm" variant="ghost" leftIcon={<Settings size={12} />}>角色配置</Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { role: 'Router', replicas: routerReplicas, note: '入口路由、会话分发、回源控制', color: 'text-primary' },
                    { role: 'Prefill', replicas: prefillReplicas, note: `TTFT 优化主力，目标 < ${Math.max(120, Math.round(service.avgLatency * 0.6))}ms`, color: 'text-accent' },
                    { role: 'Decode', replicas: decodeReplicas, note: `TPOT 稳态输出，当前约 ${Math.max(8, Math.round(service.avgLatency / 18))}ms/tok`, color: 'text-success' },
                  ].map(role => (
                    <div key={role.role} className="rounded-xl border border-border bg-base p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-text-muted">{role.role}</span>
                        <span className={`text-sm font-semibold ${role.color}`}>{role.replicas} 副本</span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div className={`h-full progress-bar-fill ${role.role === 'Router' ? 'bg-primary' : role.role === 'Prefill' ? 'bg-accent' : 'bg-success'}`} style={{ width: `${Math.min(100, role.replicas * 18)}%` }} />
                      </div>
                      <p className="text-[11px] text-text-muted mt-2 leading-relaxed">{role.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: '当前 QPS', value: service.qps, color: 'text-primary' },
                    { label: 'TTFT', value: `${Math.max(110, Math.round(service.avgLatency * 0.55))}ms`, color: 'text-warning' },
                    { label: 'TPOT', value: `${Math.max(8, Math.round(service.avgLatency / 18))}ms/tok`, color: 'text-success' },
                    { label: '扩缩窗口', value: policy.strategy === 'schedule' ? policy.scheduleWindow : `${policy.minReplicas}-${policy.maxReplicas} 副本`, color: 'text-accent' },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg bg-surface p-3">
                      <p className="text-[11px] text-text-muted">{item.label}</p>
                      <p className={`text-sm font-semibold mt-1 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ))}

      {modeTab === 'online' && (onlineServices.length === 0 ? (
        <EmptyState
          icon={<Cloud size={32} />}
          title="暂无推理服务"
          description="部署一个模型推理服务，通过 API 调用"
          action={<Link to="/user/inference/create"><Button leftIcon={<Plus size={14} />}>部署新服务</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {onlineServices.map((service, index) => {
            const meta = statusMeta[service.status] ?? { label: service.status, variant: 'ghost' as const };
            const policy = elasticPolicies[service.id] ?? createDefaultPolicy(service);
            const replicaUtilization = service.maxReplicas > 0 ? Math.round((service.replicas / service.maxReplicas) * 100) : 0;
            return (
              <Card key={service.id} glow={service.status === 'running'} className={`card-hover hover-lift animate-slide-up stagger-${index % 6}`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                      <Cloud size={18} className="text-success" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <StatusDot status={service.status} />
                        <h3 className="text-sm font-semibold text-text-primary">{service.name}</h3>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <Badge variant="ghost">{service.framework}</Badge>
                        {service.pdSeparation && <Badge variant="accent"><GitBranch size={10} className="mr-1" />PD 分离</Badge>}
                        <Badge variant={policy.strategy === 'schedule' ? 'warning' : 'success'}>{policy.strategy === 'schedule' ? '定时扩缩容' : '指标自动扩缩'}</Badge>
                      </div>
                      <p className="text-xs text-text-muted">{service.model} · {service.gpuType} ×{service.gpuCount} · {service.creator}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" leftIcon={<Activity size={12} />} onClick={() => setMetricsServiceId(service.id)}>指标详情</Button>
                    <Button size="sm" variant="outline" leftIcon={<BarChart2 size={12} />} onClick={() => openScaleModal(service)}>弹性配置</Button>
                    <Button size="sm" variant="ghost" leftIcon={<Settings size={12} />}>配置</Button>
                    <Button size="sm" variant="ghost"
                      leftIcon={
                        service.status === 'deploying' || service.status === 'stopping'
                          ? <Loader2 size={12} className="animate-spin" />
                          : service.status === 'running' || service.status === 'scaling'
                            ? <Square size={12} />
                            : <Play size={12} />
                      }
                      disabled={service.status === 'deploying' || service.status === 'stopping'}
                      onClick={() => handleToggle(service.id, service.status)}
                    >
                      {service.status === 'deploying' ? '启动中'
                        : service.status === 'stopping' ? '停止中'
                        : service.status === 'running' || service.status === 'scaling' ? '停止'
                        : '启动'}
                    </Button>
                    <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} className="text-error/70 hover:text-error" onClick={() => handleDelete(service.id)}>删除</Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'QPS', value: `${service.qps}`, icon: <Zap size={11} />, color: 'text-primary' },
                    { label: 'P50 延迟', value: `${service.avgLatency}ms`, icon: <Activity size={11} />, color: 'text-text-primary' },
                    { label: 'P99 延迟', value: `${service.p99Latency}ms`, icon: <Activity size={11} />, color: 'text-warning' },
                    { label: '副本数', value: `${service.replicas}`, icon: <Cpu size={11} />, color: 'text-accent' },
                    { label: '批大小', value: service.batchSize ? `${service.batchSize}` : '1', icon: <Package size={11} />, color: 'text-text-muted' },
                  ].map(item => (
                    <div key={item.label} className="bg-base rounded-lg p-2 text-center">
                      <p className="flex items-center justify-center gap-0.5 text-[10px] text-text-muted mb-0.5">{item.icon}{item.label}</p>
                      <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* State-transition banner */}
                {(service.status === 'deploying' || service.status === 'stopping' || service.status === 'scaling') && (
                  <div className={`mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs border animate-fade-in ${
                    service.status === 'stopping' ? 'bg-warning/8 border-warning/20 text-warning' :
                    service.status === 'scaling'  ? 'bg-accent/8 border-accent/20 text-accent' :
                    'bg-primary/8 border-primary/20 text-primary'
                  }`}>
                    <Loader2 size={11} className="animate-spin shrink-0" />
                    <span>
                      {service.status === 'deploying' ? '正在拉起 Pod，初始化健康检查...' :
                       service.status === 'stopping' ? '正在优雅停止，等待进行中请求完成...' :
                       '副本数调整中，流量将在扩缩完成后自动分发...'}
                    </span>
                    <span className="ml-1 inline-flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-current deploy-dot-1" />
                      <span className="w-1 h-1 rounded-full bg-current deploy-dot-2" />
                      <span className="w-1 h-1 rounded-full bg-current deploy-dot-3" />
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border bg-base p-3">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                      <span>副本利用率</span>
                      <span>{service.replicas} / {service.maxReplicas}</span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-primary progress-bar-fill rounded-full" style={{ width: `${Math.max(8, replicaUtilization)}%` }} />
                    </div>
                    <p className="text-[11px] text-text-muted mt-2">最小副本 {service.minReplicas}，峰值允许扩至 {service.maxReplicas}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-base p-3">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                      <span>扩缩触发器</span>
                      <Badge variant={policy.strategy === 'schedule' ? 'warning' : 'success'}>{policy.strategy === 'schedule' ? '定时' : '实时'}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {policy.strategy === 'schedule'
                        ? policy.scheduleWindow
                        : policy.strategy === 'gpu'
                          ? `${policy.targetGpu}% GPU`
                          : policy.strategy === 'latency'
                            ? `${policy.targetLatency}ms`
                            : `${policy.targetQps} QPS`}
                    </p>
                    <p className="text-[11px] text-text-muted mt-2">冷却期 {policy.cooldown} 分钟，瞬时扩容步长 {policy.burstReplicas} 副本</p>
                  </div>
                  <div className="rounded-xl border border-border bg-base p-3">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                      <span>服务模式</span>
                      <Badge variant="ghost">{service.deployMode === 'model' ? '模型部署' : '镜像部署'}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{service.endpoint}</p>
                    <p className="text-[11px] text-text-muted mt-2">可用性 {service.availability}% · 命名空间 {service.namespace}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ))}

      <Modal title="推理实例性能指标" open={!!metricsServiceId} onClose={() => setMetricsServiceId(null)} width="lg">
        {metricsService && perfSnapshot ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-text-primary">{metricsService.name}</p>
                <p className="text-xs text-text-muted mt-1">{metricsService.model} · {metricsService.gpuType} ×{metricsService.gpuCount} · {metricsService.endpoint}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="success">实时刷新</Badge>
                <Badge variant="ghost">命名空间 {metricsService.namespace}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '模型调用频率', value: `${perfSnapshot.callFrequencyPerSecond.toFixed(1)} 次/秒`, tip: '当前输入请求频次' },
                { label: '调用失败率', value: `${perfSnapshot.failureRate.toFixed(2)}%`, tip: '5 分钟滑动窗口' },
                { label: '端到端延迟', value: `${perfSnapshot.e2eLatency} ms`, tip: '含网关与模型生成链路' },
                { label: 'RPM', value: `${perfSnapshot.rpm.toLocaleString()}`, tip: '每分钟请求数' },
                { label: 'TPM', value: `${perfSnapshot.tpm.toLocaleString()}`, tip: '每分钟输出 Token 数' },
                { label: 'TTFT', value: `${perfSnapshot.ttft} ms`, tip: '首 Token 输出时延' },
                { label: 'TPOT', value: `${perfSnapshot.tpot} ms/token`, tip: '单 Token 生成时延' },
                { label: '可用性', value: `${metricsService.availability.toFixed(2)}%`, tip: '近 24 小时 SLA' },
              ].map(metric => (
                <div key={metric.label} className="rounded-xl border border-border bg-base p-3">
                  <p className="text-[11px] text-text-muted">{metric.label}</p>
                  <p className="text-base font-semibold text-text-primary mt-1">{metric.value}</p>
                  <p className="text-[11px] text-text-muted mt-1">{metric.tip}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-base p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <p className="text-sm font-semibold text-text-primary">最近 1 小时性能走势</p>
                <p className="text-xs text-text-muted">随实例状态自动刷新</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-text-muted mb-2">吞吐指标（调用频率 / RPM / TPM）</p>
                  <div className="h-56 rounded-lg border border-border/60 bg-surface px-2 py-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perfTrend} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} width={42} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip
                          contentStyle={{ background: '#111E33', border: '1px solid #1E2D47', borderRadius: 10, fontSize: 12, color: '#D8E7FB' }}
                          labelStyle={{ color: '#A8BFDE' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="left" type="monotone" dataKey="callFrequencyPerSecond" name="调用频率(次/秒)" stroke="#60A5FA" strokeWidth={2} dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="rpm" name="RPM" stroke="#34D399" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="tpm" name="TPM" stroke="#FBBF24" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-muted mb-2">质量指标（调用失败率 / 端到端延迟）</p>
                  <div className="h-56 rounded-lg border border-border/60 bg-surface px-2 py-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perfTrend} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} width={42} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip
                          contentStyle={{ background: '#111E33', border: '1px solid #1E2D47', borderRadius: 10, fontSize: 12, color: '#D8E7FB' }}
                          labelStyle={{ color: '#A8BFDE' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="left" type="monotone" dataKey="failureRate" name="调用失败率" stroke="#F87171" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="e2eLatency" name="端到端延迟" stroke="#A78BFA" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-muted mb-2">生成指标（TTFT / TPOT）</p>
                  <div className="h-56 rounded-lg border border-border/60 bg-surface px-2 py-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perfTrend} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.16)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} width={42} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#8AA0B8' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip
                          contentStyle={{ background: '#111E33', border: '1px solid #1E2D47', borderRadius: 10, fontSize: 12, color: '#D8E7FB' }}
                          labelStyle={{ color: '#A8BFDE' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="left" type="monotone" dataKey="ttft" name="TTFT" stroke="#F59E0B" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="tpot" name="TPOT" stroke="#22D3EE" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-text-muted">未找到该推理实例，请刷新页面后重试。</div>
        )}
      </Modal>

      <Modal title="弹性扩缩容配置" open={!!scaleServiceId} onClose={() => setScaleServiceId(null)} width="md">
        <form onSubmit={handleScale} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="扩缩策略"
              value={scaleForm.strategy}
              onChange={event => setScaleForm(prev => ({ ...prev, strategy: event.target.value as ElasticStrategy }))}
              options={[
                { value: 'qps', label: '基于 QPS 自动扩缩' },
                { value: 'latency', label: '基于延迟自动扩缩' },
                { value: 'gpu', label: '基于 GPU 利用率扩缩' },
                { value: 'schedule', label: '基于定时窗口预扩容' },
              ]}
            />
            <Input label="冷却时间 (分钟)" type="number" min="1" value={scaleForm.cooldown} onChange={event => setScaleForm(prev => ({ ...prev, cooldown: event.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="最小副本数" type="number" min="1" value={scaleForm.minReplicas} onChange={event => setScaleForm(prev => ({ ...prev, minReplicas: event.target.value }))} />
            <Input label="最大副本数" type="number" min="1" value={scaleForm.maxReplicas} onChange={event => setScaleForm(prev => ({ ...prev, maxReplicas: event.target.value }))} />
          </div>

          {scaleForm.strategy === 'schedule' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              <Input label="预扩容时间窗口" value={scaleForm.scheduleWindow} onChange={event => setScaleForm(prev => ({ ...prev, scheduleWindow: event.target.value }))} placeholder="例如：08:30-11:30" />
              <Input label="单次突发扩容副本" type="number" min="1" value={scaleForm.burstReplicas} onChange={event => setScaleForm(prev => ({ ...prev, burstReplicas: event.target.value }))} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              {scaleForm.strategy === 'gpu' && (
                <Input label="目标 GPU 利用率 (%)" type="number" value={scaleForm.targetGpu} onChange={event => setScaleForm(prev => ({ ...prev, targetGpu: event.target.value }))} />
              )}
              {scaleForm.strategy === 'latency' && (
                <Input label="目标 P50 / P99 延迟 (ms)" type="number" value={scaleForm.targetLatency} onChange={event => setScaleForm(prev => ({ ...prev, targetLatency: event.target.value }))} />
              )}
              {scaleForm.strategy === 'qps' && (
                <Input label="目标 QPS / 副本" type="number" value={scaleForm.targetQps} onChange={event => setScaleForm(prev => ({ ...prev, targetQps: event.target.value }))} />
              )}
              <Input label="单次突发扩容副本" type="number" min="1" value={scaleForm.burstReplicas} onChange={event => setScaleForm(prev => ({ ...prev, burstReplicas: event.target.value }))} />
            </div>
          )}

          <div className="rounded-xl border border-border bg-base p-3">
            <p className="text-xs text-text-muted">策略说明</p>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
              {scaleForm.strategy === 'schedule'
                ? '在既定时间窗口内提前扩容，适合早晚高峰或定时报表生成等已知突发流量。'
                : scaleForm.strategy === 'gpu'
                  ? '根据 GPU 利用率动态拉起或回收副本，适合高吞吐向量检索与实时 embedding 服务。'
                  : scaleForm.strategy === 'latency'
                    ? '根据延迟指标动态补充副本，适合对 RT 敏感的在线业务。'
                    : '根据每副本承载的 QPS 自动扩容，适合流量稳态变化明显的在线推理接口。'}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1">保存配置</Button>
            <Button type="button" variant="outline" onClick={() => setScaleServiceId(null)}>取消</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

