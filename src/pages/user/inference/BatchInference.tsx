import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  FileText,
  List,
  Plus,
  Trash2,
  XCircle,
  Zap,
  Play,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../hooks/useToast';
import { getRuntimeBatchJobs, saveRuntimeBatchJobs } from '../../../data/mockInferenceRuntime';

type BatchStatus = 'running' | 'completed' | 'failed' | 'queued';

interface BatchJob {
  id: string;
  name: string;
  model: string;
  dataset: string;
  totalItems: number;
  doneItems: number;
  status: BatchStatus;
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

const statusMeta: Record<BatchStatus, { label: string; variant: 'primary' | 'success' | 'error' | 'warning'; icon: ReactElement }> = {
  running: { label: '运行中', variant: 'primary', icon: <Zap size={12} className="text-primary" /> },
  completed: { label: '已完成', variant: 'success', icon: <CheckCircle2 size={12} className="text-success" /> },
  failed: { label: '失败', variant: 'error', icon: <XCircle size={12} className="text-error" /> },
  queued: { label: '排队中', variant: 'warning', icon: <Clock size={12} className="text-warning" /> },
};

function initialLogs(job: BatchJob) {
  return [
    `${new Date(job.createdAt).toLocaleString('zh-CN')} [INFO] 任务创建成功: ${job.name}`,
    `${new Date(job.createdAt).toLocaleString('zh-CN')} [INFO] 绑定模型: ${job.model}`,
    `${new Date(job.createdAt).toLocaleString('zh-CN')} [INFO] 绑定数据集: ${job.dataset}`,
    `${new Date(job.createdAt).toLocaleString('zh-CN')} [INFO] 调度策略: ${job.schedule}`,
    `${new Date(job.createdAt).toLocaleString('zh-CN')} [INFO] 输出目录: ${job.outputPath}`,
  ];
}

export default function BatchInferencePage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<BatchJob[]>(() => getRuntimeBatchJobs());
  const [logJobId, setLogJobId] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<Record<string, string[]>>(() => (
    Object.fromEntries(getRuntimeBatchJobs().map(job => [job.id, initialLogs(job)]))
  ));

  const runningCount = useMemo(() => jobs.filter(item => item.status === 'running').length, [jobs]);
  const queuedCount = useMemo(() => jobs.filter(item => item.status === 'queued').length, [jobs]);
  const throughput = useMemo(() => jobs.reduce((sum, item) => sum + item.doneItems, 0), [jobs]);

  const handleDelete = (id: string) => {
    setJobs(prev => prev.filter(item => item.id !== id));
    setJobLogs(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.success('批量推理任务已删除');
  };

  const handleRetry = (id: string) => {
    setJobs(prev => prev.map(item => (item.id === id ? { ...item, status: 'queued', doneItems: 0 } : item)));
    setJobLogs(prev => ({
      ...prev,
      [id]: [
        ...(prev[id] ?? []),
        `${new Date().toLocaleString('zh-CN')} [WARN] 任务失败后重试，已重置进度并重新排队`,
      ].slice(-100),
    }));
    toast.success('批量推理任务已重新提交');
  };

  const openLogs = (id: string) => {
    setLogJobId(id);
    setJobLogs(prev => {
      if (prev[id]) return prev;
      const job = jobs.find(item => item.id === id);
      if (!job) return prev;
      return { ...prev, [id]: initialLogs(job) };
    });
  };

  useEffect(() => {
    saveRuntimeBatchJobs(jobs);
  }, [jobs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setJobs(prev => prev.map(item => {
        if (item.status !== 'running') return item;
        const doneItems = Math.min(item.totalItems, item.doneItems + Math.floor(Math.random() * 160 + 80));
        if (doneItems >= item.totalItems) {
          return {
            ...item,
            doneItems: item.totalItems,
            status: 'completed',
            finishedAt: new Date().toISOString(),
          };
        }
        return { ...item, doneItems };
      }));

      setJobLogs(prev => {
        const next = { ...prev };
        jobs.forEach(job => {
          if (job.status !== 'running') return;
          const lines = next[job.id] ?? initialLogs(job);
          const pct = job.totalItems > 0 ? Math.round((job.doneItems / job.totalItems) * 100) : 0;
          const line = `${new Date().toLocaleString('zh-CN')} [INFO] 正在处理分片，当前进度 ${pct}% (${job.doneItems}/${job.totalItems})`;
          next[job.id] = [...lines, line].slice(-120);
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [jobs]);

  const activeLogJob = useMemo(
    () => jobs.find(item => item.id === logJobId) ?? null,
    [jobs, logJobId],
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="批量推理"
        subtitle="面向非实时响应业务场景的离线批量推理任务创建与管理"
        icon={<FileText size={20} />}
        actions={<Link to="/user/inference/batch/create"><Button leftIcon={<Plus size={14} />}>新建批量任务</Button></Link>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: '运行中任务', value: runningCount, note: '离线长任务持续处理中' },
          { label: '等待队列', value: queuedCount, note: '支持离峰自动调度' },
          { label: '累计处理量', value: `${throughput.toLocaleString()} 条`, note: '累计已完成推理请求' },
        ].map(item => (
          <Card key={item.label}>
            <p className="text-xs text-text-muted">{item.label}</p>
            <p className="text-xl font-bold text-text-primary mt-1">{item.value}</p>
            <p className="text-xs text-text-muted mt-1">{item.note}</p>
          </Card>
        ))}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="暂无批量推理任务"
          description="创建离线批量推理任务，高效处理大规模数据集"
          action={<Link to="/user/inference/batch/create"><Button leftIcon={<Plus size={14} />}>新建批量任务</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const meta = statusMeta[job.status];
            const progress = job.totalItems > 0 ? Math.round((job.doneItems / job.totalItems) * 100) : 0;
            return (
              <Card key={job.id} className="card-hover hover-lift">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {meta.icon}
                        <h3 className="text-sm font-semibold text-text-primary">{job.name}</h3>
                        <Badge variant={meta.variant} className={job.status === 'running' ? 'animate-pulse' : ''}>{meta.label}</Badge>
                        <Badge variant="ghost">{job.outputFormat.toUpperCase()}</Badge>
                      </div>
                      <p className="text-xs text-text-muted">{job.model} · 数据集: {job.dataset} · {job.creator}</p>
                      <p className="text-xs text-text-muted mt-0.5">GPU: {job.gpuType} ×{job.gpuCount} · 并发: {job.concurrency} · 输出: {job.outputPath}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="accent">{job.schedule}</Badge>
                    <Button size="sm" variant="outline" leftIcon={<List size={12} />} onClick={() => openLogs(job.id)}>
                      运行日志
                    </Button>
                    {job.status === 'failed' && (
                      <Button size="sm" variant="outline" leftIcon={<Play size={12} />} onClick={() => handleRetry(job.id)}>
                        重试
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} className="text-error/70 hover:text-error" onClick={() => handleDelete(job.id)}>
                      删除
                    </Button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                    <span>处理进度</span>
                    <span>{job.doneItems.toLocaleString()} / {job.totalItems.toLocaleString()} 条 ({progress}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-base overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-bar-fill ${job.status === 'failed' ? 'bg-error' : job.status === 'completed' ? 'bg-success' : 'bg-primary'} ${job.status === 'running' ? 'animate-pulse' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
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

      <Modal
        open={Boolean(activeLogJob)}
        onClose={() => setLogJobId(null)}
        title={`运行日志：${activeLogJob?.name ?? ''}`}
        width="lg"
      >
        {activeLogJob && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted flex-wrap gap-2">
              <span>任务状态：{statusMeta[activeLogJob.status].label}</span>
              <span>模型：{activeLogJob.model} · 数据集：{activeLogJob.dataset}</span>
            </div>
            <div className="rounded-lg border border-border bg-base/70 p-3 h-80 overflow-auto font-mono text-[11px] space-y-1.5">
              {(jobLogs[activeLogJob.id] ?? []).map((line, index) => (
                <p key={`${activeLogJob.id}-log-${index}`} className="text-text-secondary leading-relaxed break-words">{line}</p>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">
                {activeLogJob.status === 'running'
                  ? '日志实时更新中，任务执行期间会持续刷新。'
                  : '任务非运行状态，展示最近历史日志。'}
              </p>
              <Button size="sm" variant="outline" onClick={() => setLogJobId(null)}>关闭</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
