import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Zap, BarChart2, FileText, Settings, Download, Cpu, Database, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { StatusDot } from '../../../components/ui/StatusDot';
import { useToast } from '../../../hooks/useToast';
import { mockTrainingJobs } from '../../../data/mockTraining';

const EPOCH_METRICS = [
  { epoch: 1, trainLoss: 1.843, valLoss: 1.921, accuracy: 0.623, f1: 0.591, bleu: 0.142, gpuUtil: 87 },
  { epoch: 2, trainLoss: 1.124, valLoss: 1.198, accuracy: 0.748, f1: 0.731, bleu: 0.218, gpuUtil: 92 },
  { epoch: 3, trainLoss: 0.871, valLoss: 0.953, accuracy: 0.802, f1: 0.789, bleu: 0.274, gpuUtil: 94 },
];

const CHECKPOINTS = [
  { name: 'checkpoint-epoch1', epoch: 1, step: 333, loss: 1.843, size: '13.2 GB', savedAt: '2025-06-10 14:55:12' },
  { name: 'checkpoint-epoch2', epoch: 2, step: 666, loss: 1.124, size: '13.2 GB', savedAt: '2025-06-10 16:18:44' },
  { name: 'checkpoint-best',   epoch: 3, step: 999, loss: 0.871, size: '13.2 GB', savedAt: '2025-06-10 17:42:06' },
];

const statusMeta: Record<string, { label: string; variant: any }> = {
  running:   { label: '训练中', variant: 'success' },
  completed: { label: '已完成', variant: 'ghost' },
  failed:    { label: '失败', variant: 'error' },
  queued:    { label: '排队中', variant: 'secondary' },
};

const LOGS = [
  '[2025-06-10 14:22:01] INFO  - 初始化训练环境',
  '[2025-06-10 14:22:03] INFO  - 加载模型权重: Qwen2.5-72B-Instruct-ZY',
  '[2025-06-10 14:22:15] INFO  - 数据集加载完成，共 48,521 条训练样本',
  '[2025-06-10 14:22:16] INFO  - 开始第 1 轮训练 (epoch 1/3)',
  '[2025-06-10 14:25:42] INFO  - Step 100/1000  loss=1.8432  lr=1.96e-5',
  '[2025-06-10 14:29:08] INFO  - Step 200/1000  loss=1.5217  lr=1.90e-5',
  '[2025-06-10 14:32:33] INFO  - Step 300/1000  loss=1.3891  lr=1.83e-5',
  '[2025-06-10 14:36:01] INFO  - Step 400/1000  loss=1.2044  lr=1.76e-5',
  '[2025-06-10 14:39:28] INFO  - Step 500/1000  loss=1.1238  lr=1.69e-5',
  '[2025-06-10 14:42:55] INFO  - Step 600/1000  loss=1.0541  lr=1.61e-5',
  '[2025-06-10 14:46:22] INFO  - Step 700/1000  loss=0.9872  lr=1.53e-5',
  '[2025-06-10 14:49:49] WARN  - GPU 显存使用率 91%，接近上限',
  '[2025-06-10 14:53:16] INFO  - Step 800/1000  loss=0.9213  lr=1.44e-5',
  '[2025-06-10 14:56:43] INFO  - Step 900/1000  loss=0.8714  lr=1.36e-5',
  '[2025-06-10 15:00:10] INFO  - 第 1 轮训练完成，保存 checkpoint',
];

const STREAM_LOGS = [
  '[2025-06-10 15:03:37] INFO  - Step 940/1000  loss=0.8632  lr=1.29e-5',
  '[2025-06-10 15:05:22] INFO  - 梯度裁剪激活，max_norm=1.0',
  '[2025-06-10 15:07:04] INFO  - Step 960/1000  loss=0.8381  lr=1.22e-5',
  '[2025-06-10 15:10:31] WARN  - GPU 显存峰值 45.2 GB / 80 GB，已启动碎片回收',
  '[2025-06-10 15:13:58] INFO  - Step 980/1000  loss=0.8221  lr=1.14e-5',
  '[2025-06-10 15:17:25] INFO  - Step 1000/1000  loss=0.8102  lr=1.08e-5',
  '[2025-06-10 15:20:52] INFO  - 第 2 轮训练开始 (epoch 2/3)，LR warmup 完成',
  '[2025-06-10 15:24:19] INFO  - Step 1050/1000  loss=0.7891  lr=1.00e-5',
  '[2025-06-10 15:27:46] INFO  - 保存中间 checkpoint: checkpoint-step1050',
  '[2025-06-10 15:31:13] INFO  - Step 1100/1000  loss=0.7654  lr=9.5e-6',
  '[2025-06-10 15:34:40] INFO  - 验证集评估中... 准确率=82.1%  F1=0.808',
  '[2025-06-10 15:38:07] INFO  - Step 1150/1000  loss=0.7412  lr=9.0e-6',
  '[2025-06-10 15:41:34] INFO  - 第 3 轮训练开始 (epoch 3/3)',
  '[2025-06-10 15:45:01] INFO  - Step 1200/1000  loss=0.7211  lr=8.5e-6',
  '[2025-06-10 15:48:28] INFO  - 验证集评估完成  accuracy=83.5%  F1=0.821',
  '[2025-06-10 15:51:55] INFO  - 最终 checkpoint 已保存至 /ckpts/checkpoint-final/',
  '[2025-06-10 15:55:22] INFO  - ✓ 训练完成  总步数 1200  最优 Loss 0.7981',
];

export default function TrainingDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [tab, setTab] = useState('metrics');
  const job = mockTrainingJobs.find(j => j.id === id) ?? mockTrainingJobs[0];
  const meta = statusMeta[job.status] ?? { label: job.status, variant: 'ghost' };

  // === Live simulation state (active only when job.status === 'running') ===
  const [liveProgress, setLiveProgress] = useState(job.progress ?? 0);
  const [liveStatus, setLiveStatus]     = useState(job.status);
  const [liveLogs, setLiveLogs]         = useState<string[]>(LOGS);
  const [liveMetrics, setLiveMetrics]   = useState(job.metrics);
  const [newLogKey, setNewLogKey]       = useState(0);
  const logRef       = useRef<HTMLDivElement>(null);
  const streamIdxRef = useRef(0);

  useEffect(() => {
    if (job.status !== 'running') return;
    const timer = setInterval(() => {
      setLiveProgress(prev => {
        const next = parseFloat(Math.min(100, prev + 0.6).toFixed(1));
        if (next >= 100) {
          setLiveStatus('completed');
          clearInterval(timer);
          toast.success('训练完成', `${job.name} 训练结束，最优 Loss 0.7981`);
        }
        return next;
      });
      const line = STREAM_LOGS[streamIdxRef.current % STREAM_LOGS.length];
      streamIdxRef.current++;
      setLiveLogs(prev => [...prev.slice(-44), line]);
      setNewLogKey(k => k + 1);
      setLiveMetrics(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        return [...prev, {
          ...last,
          step:         last.step + 100,
          loss:         parseFloat(Math.max(0.50, last.loss      - (Math.random() * 0.035 + 0.008)).toFixed(4)),
          valLoss:      last.valLoss  !== undefined ? parseFloat(Math.max(0.55, last.valLoss  - (Math.random() * 0.030 + 0.006)).toFixed(4)) : undefined,
          accuracy:     last.accuracy !== undefined ? parseFloat(Math.min(0.99, last.accuracy + (Math.random() * 0.004 + 0.001)).toFixed(4)) : undefined,
          learningRate: parseFloat(((last.learningRate ?? 1e-5) * 0.995).toFixed(8)),
          timestamp:    new Date().toISOString(),
        }];
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll logs when new entries arrive
  useEffect(() => {
    if (tab === 'logs' && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [newLogKey, tab]);

  const liveMeta = statusMeta[liveStatus] ?? meta;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/training" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 训练任务
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{job.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
            <Zap size={20} className="text-warning" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusDot status={liveStatus} />
              <h1 className="text-lg font-bold text-text-primary">{job.name}</h1>
              <Badge variant={liveMeta.variant}>{liveMeta.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
              <span>基础模型: {job.baseModel}</span>
              <span>数据集: {job.dataset}</span>
              <span>资源: {job.gpuType}×{job.gpuCount}</span>
              <span>Epoch: {job.currentEpoch}/{job.totalEpochs}</span>
            </div>
          </div>
        </div>
        {liveStatus === 'running' && (
          <div className="flex items-center gap-2">
            <div className="w-28 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-[width] duration-700 animate-running-bar"
                style={{ width: `${liveProgress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-primary animate-tick" key={Math.floor(liveProgress)}>{liveProgress.toFixed(1)}%</span>
          </div>
        )}
        {liveStatus === 'completed' && (
          <div className="flex items-center gap-1.5 text-success animate-scale-in">
            <CheckCircle size={16} />
            <span className="text-sm font-semibold">已完成</span>
          </div>
        )}
      </div>

      <Tabs
        tabs={[
          { key: 'metrics', label: '训练曲线', icon: <BarChart2 size={14} /> },
          { key: 'epoch', label: '逐 Epoch 指标', icon: <Cpu size={14} /> },
          { key: 'checkpoints', label: '检查点', icon: <Database size={14} /> },
          { key: 'logs', label: '训练日志', icon: <FileText size={14} /> },
          { key: 'config', label: '任务配置', icon: <Settings size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card noPadding>
            <div className="px-5 py-4 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">Loss 曲线</span>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={liveMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                  <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="loss" stroke="#3B82F6" strokeWidth={2} dot={false} name="训练 Loss" isAnimationActive={false} />
                  <Line type="monotone" dataKey="valLoss" stroke="#8B5CF6" strokeWidth={2} dot={false} name="验证 Loss" strokeDasharray="4 2" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card noPadding>
            <div className="px-5 py-4 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">学习率 & 准确率</span>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={liveMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                  <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} dot={false} name="准确率" isAnimationActive={false} />
                  <Line type="monotone" dataKey="learningRate" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="学习率" strokeDasharray="4 2" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-3">当前指标快照</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {liveMetrics.length > 0 && [
                { label: '当前 Loss', value: liveMetrics.at(-1)!.loss.toFixed(4) },
                { label: '验证 Loss', value: liveMetrics.at(-1)!.valLoss?.toFixed(4) ?? '—' },
                { label: '准确率', value: liveMetrics.at(-1)!.accuracy ? `${(liveMetrics.at(-1)!.accuracy! * 100).toFixed(2)}%` : '—' },
                { label: '当前学习率', value: liveMetrics.at(-1)!.learningRate?.toExponential(2) ?? '—' },
              ].map(s => (
                <div key={s.label} className="bg-base rounded-xl p-4 text-center">
                  <p className="text-xs text-text-muted mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-text-primary animate-tick" key={`${s.label}-${liveMetrics.length}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'epoch' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">逐 Epoch 评估指标</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    {['Epoch', '训练Loss', '验证Loss', '准确率', 'F1 Score', 'BLEU', 'GPU利用率'].map(h => (
                      <th key={h} className="text-left pb-2 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  {EPOCH_METRICS.map(m => (
                    <tr key={m.epoch} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pr-4 font-bold text-text-primary">Epoch {m.epoch}</td>
                      <td className="py-2 pr-4">{m.trainLoss.toFixed(3)}</td>
                      <td className="py-2 pr-4">{m.valLoss.toFixed(3)}</td>
                      <td className="py-2 pr-4"><span className="text-success font-medium">{(m.accuracy * 100).toFixed(1)}%</span></td>
                      <td className="py-2 pr-4"><span className="text-primary font-medium">{m.f1.toFixed(3)}</span></td>
                      <td className="py-2 pr-4"><span className="text-accent font-medium">{m.bleu.toFixed(3)}</span></td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-warning rounded-full" style={{ width: `${m.gpuUtil}%` }} />
                          </div>
                          <span>{m.gpuUtil}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '最优 F1', value: `${Math.max(...EPOCH_METRICS.map(m => m.f1)).toFixed(3)}`, color: 'text-primary' },
              { label: '最优 BLEU', value: `${Math.max(...EPOCH_METRICS.map(m => m.bleu)).toFixed(3)}`, color: 'text-accent' },
              { label: '最高准确率', value: `${(Math.max(...EPOCH_METRICS.map(m => m.accuracy)) * 100).toFixed(1)}%`, color: 'text-success' },
              { label: '最低验证Loss', value: `${Math.min(...EPOCH_METRICS.map(m => m.valLoss)).toFixed(3)}`, color: 'text-warning' },
            ].map(s => (
              <div key={s.label} className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-xs text-text-muted mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'checkpoints' && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">模型检查点</h3>
          <div className="space-y-2">
            {CHECKPOINTS.map((ck, i) => (
              <div key={ck.name} className="flex items-center gap-4 bg-base rounded-xl border border-border px-4 py-3 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Database size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-text-primary">{ck.name}</span>
                    {i === CHECKPOINTS.length - 1 && <Badge variant="success">最优</Badge>}
                  </div>
                  <p className="text-xs text-text-muted">Epoch {ck.epoch} · Step {ck.step} · Loss {ck.loss} · {ck.size} · {ck.savedAt}</p>
                </div>
                <button
                  onClick={() => toast.success('开始下载', `${ck.name} 正在准备下载链接...`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Download size={11} /> 下载
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'logs' && (
        <Card noPadding>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">训练日志</span>
              {liveStatus === 'running' && (
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping inline-flex" />
                  实时流式
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted">共 {liveLogs.length} 条</span>
          </div>
          <div ref={logRef} className="p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-1">
            {liveLogs.map((line, i) => (
              <div
                key={`${i === liveLogs.length - 1 ? `last-${newLogKey}` : i}`}
                className={`leading-5 ${
                  i === liveLogs.length - 1 && liveStatus === 'running' ? 'animate-log-line' : ''
                } ${line.includes('WARN') ? 'text-warning' : line.includes('ERROR') ? 'text-error' : 'text-text-secondary'}`}
              >
                {line}
                {i === liveLogs.length - 1 && liveStatus === 'running' && (
                  <span className="animate-typing-cursor ml-0.5 text-primary/70">█</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'config' && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">训练配置</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: '基础模型', value: job.baseModel },
              { label: '训练数据集', value: job.dataset },
              { label: 'GPU 配置', value: `${job.gpuType} × ${job.gpuCount}` },
              { label: '训练轮数', value: `${job.totalEpochs} epochs` },
              { label: '批次大小', value: job.hyperparams?.batchSize ?? '—' },
              { label: '学习率', value: job.hyperparams?.learningRate ?? '—' },
              { label: '优先级', value: job.priority },
              { label: '创建时间', value: new Date(job.createdAt).toLocaleString('zh-CN') },
            ].map(c => (
              <div key={c.label}>
                <p className="text-xs text-text-muted mb-1">{c.label}</p>
                <p className="text-sm text-text-secondary font-medium">{String(c.value)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
