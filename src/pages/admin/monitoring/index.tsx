import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BellRing, AlertTriangle, CheckCircle2, Info, RefreshCw, Activity, Cpu, FileText, Search, Zap, Clock, TrendingUp, BarChart2, Play, Pause, CalendarDays, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { useToast } from '../../../hooks/useToast';
import { Select } from '../../../components/ui/Input';
import { mockAlerts, getMockMetricsByCluster } from '../../../data/mockData';
import { useClusters } from '../../../contexts/ClusterContext';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'critical', label: '严重' },
  { key: 'warning', label: '警告' },
  { key: 'resolved', label: '已处理' },
];

const MAIN_TABS = [
  { key: 'metrics', label: '监控指标', icon: <Activity size={14} /> },
  { key: 'inference', label: '推理性能', icon: <Zap size={14} /> },
  { key: 'alerts', label: '告警列表', icon: <BellRing size={14} /> },
  { key: 'logs', label: '服务日志', icon: <FileText size={14} /> },
  { key: 'fullchain', label: '全链路追踪', icon: <Cpu size={14} /> },
];

const levelIcon: Record<string, React.ReactElement> = {
  critical: <AlertTriangle size={13} className="text-error" />,
  warning: <AlertTriangle size={13} className="text-warning" />,
  info: <Info size={13} className="text-primary" />,
};

type MonitoringLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface MonitoringLogLine {
  id: number;
  time: string;
  level: MonitoringLogLevel;
  instance: string;
  msg: string;
}

interface InferencePoint {
  time: string;
  QPS: number;
  RPM: number;
  TPM: number;
  latency_p50: number;
  latency_p99: number;
  TTFT: number;
  TPOT: number;
  failRate: number;
  vram: number;
  gpu: number;
}

interface TrainingPoint {
  step: number;
  loss: number;
  eval_loss: number;
  acc: number;
  gpu_util: number;
  vram_gb: number;
  throughput: number;
}

interface MonitoringProfile {
  id: string;
  baseQps: number;
  qpsAmplitude: number;
  latencyP50Base: number;
  latencyP99Base: number;
  ttftBase: number;
  tpotBase: number;
  failRateBase: number;
  vramBase: number;
  gpuBase: number;
  trainLossStart: number;
  trainDecay: number;
  trainThroughputBase: number;
  logInstances: string[];
  baseLogs: Omit<MonitoringLogLine, 'id'>[];
  streamLogs: Omit<MonitoringLogLine, 'id'>[];
  extraAlerts: Array<{
    id: string;
    clusterId: string;
    level: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    source: string;
    metric: string;
    threshold: string;
    currentValue: string;
    status: 'firing' | 'resolved';
    createdAt: string;
    resolvedAt?: string;
  }>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatLogTime(baseHour: number, totalSeconds: number) {
  const hh = String(baseHour + Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `2025-03-15 ${hh}:${mm}:${ss}`;
}

function buildDenseLogs(
  seed: Omit<MonitoringLogLine, 'id'>[],
  total: number,
  profile: 'prod' | 'dev',
  cadenceSeconds: number,
): Omit<MonitoringLogLine, 'id'>[] {
  return Array.from({ length: total }, (_, i) => {
    const base = seed[i % seed.length];
    const traceTag = profile === 'prod'
      ? `trace=prod-${(1200 + i).toString(16)}`
      : `trace=dev-${(800 + i).toString(16)}`;
    const extraTag = profile === 'prod'
      ? `shard=${i % 4}`
      : `retry=${i % 3}`;

    return {
      ...base,
      time: formatLogTime(10, 63 + i * cadenceSeconds + (profile === 'dev' ? 11 : 0)),
      msg: `${base.msg} | ${traceTag} | ${extraTag}`,
    };
  });
}

function makeBaseLogs(profile: 'prod' | 'dev'): Omit<MonitoringLogLine, 'id'>[] {
  if (profile === 'prod') {
    return [
      { time: '2025-03-15 10:01:03', level: 'INFO', instance: 'qwen72b-prod-0', msg: 'Production model loaded, tensor parallel=4, warmup started' },
      { time: '2025-03-15 10:01:15', level: 'INFO', instance: 'qwen72b-prod-1', msg: 'Registered to ingress gateway, health check passed' },
      { time: '2025-03-15 10:02:05', level: 'WARN', instance: 'qwen72b-prod-0', msg: 'Prompt cache miss ratio reached 38%, latency may increase' },
      { time: '2025-03-15 10:02:33', level: 'INFO', instance: 'qwen72b-prod-2', msg: 'Batch decode finished: 64 requests, avg token/s=1572' },
      { time: '2025-03-15 10:03:11', level: 'ERROR', instance: 'qwen72b-prod-1', msg: 'Downstream embedding timeout, fallback route activated' },
      { time: '2025-03-15 10:03:29', level: 'INFO', instance: 'qwen72b-prod-1', msg: 'Retry succeeded, request pipeline recovered' },
      { time: '2025-03-15 10:04:10', level: 'WARN', instance: 'qwen72b-prod-3', msg: 'GPU hotspot detected (87°C), fan profile escalated' },
      { time: '2025-03-15 10:04:46', level: 'INFO', instance: 'qwen72b-prod-0', msg: 'SLA window P99 stable at 320ms for last 5 minutes' },
    ];
  }

  return [
    { time: '2025-03-15 10:01:08', level: 'INFO', instance: 'qwen7b-dev-0', msg: 'Dev model started with debug flag, tracing enabled' },
    { time: '2025-03-15 10:01:31', level: 'DEBUG', instance: 'qwen7b-dev-0', msg: 'Tokenizer cache initialized (cold start)' },
    { time: '2025-03-15 10:02:14', level: 'WARN', instance: 'qwen7b-dev-1', msg: 'Node heartbeat delayed by 2.4s, possible network jitter' },
    { time: '2025-03-15 10:02:47', level: 'ERROR', instance: 'qwen7b-dev-1', msg: 'Pod evicted: memory pressure on dev-gpu-02' },
    { time: '2025-03-15 10:03:05', level: 'INFO', instance: 'qwen7b-dev-2', msg: 'Fallback replica started on dev-gpu-01' },
    { time: '2025-03-15 10:04:19', level: 'WARN', instance: 'qwen7b-dev-2', msg: 'Request queue depth reached 42, autoscale cooldown active' },
    { time: '2025-03-15 10:04:54', level: 'DEBUG', instance: 'qwen7b-dev-0', msg: 'Trace sampled request id=dev-77fe32, decode pipeline=slow path' },
    { time: '2025-03-15 10:05:22', level: 'INFO', instance: 'qwen7b-dev-0', msg: 'Latency baseline restored after pod rebalance' },
  ];
}

const MONITORING_PROFILES: Record<string, MonitoringProfile> = {
  cls001: {
    id: 'cls001',
    baseQps: 168,
    qpsAmplitude: 42,
    latencyP50Base: 84,
    latencyP99Base: 318,
    ttftBase: 146,
    tpotBase: 17.2,
    failRateBase: 0.62,
    vramBase: 74,
    gpuBase: 81,
    trainLossStart: 2.7,
    trainDecay: 0.14,
    trainThroughputBase: 1440,
    logInstances: ['qwen72b-prod-0', 'qwen72b-prod-1', 'qwen72b-prod-2', 'qwen72b-prod-3'],
    baseLogs: buildDenseLogs(makeBaseLogs('prod'), 42, 'prod', 21),
    streamLogs: buildDenseLogs([
      { time: '2025-03-15 10:06:03', level: 'INFO', instance: 'qwen72b-prod-2', msg: 'Auto-batching window tuned to 18ms for throughput boost' },
      { time: '2025-03-15 10:06:34', level: 'WARN', instance: 'qwen72b-prod-1', msg: 'VRAM fragmentation increased, triggering compaction' },
      { time: '2025-03-15 10:07:11', level: 'INFO', instance: 'qwen72b-prod-0', msg: 'Compaction done, available VRAM +9GB' },
      { time: '2025-03-15 10:07:45', level: 'ERROR', instance: 'qwen72b-prod-3', msg: 'External reranker timeout > 2s, degraded mode on' },
    ], 24, 'prod', 18),
    extraAlerts: [
      { id: 'al-prod-001', clusterId: 'cls001', level: 'warning', title: '高峰流量触发扩容', message: 'QPS 超过 190，推理服务进入弹性扩容窗口', source: 'autoscaler', metric: 'qps', threshold: '190', currentValue: '206', status: 'firing', createdAt: new Date(Date.now() - 26 * 60000).toISOString() },
      { id: 'al-prod-002', clusterId: 'cls001', level: 'info', title: '延迟回落至SLA范围', message: 'P99 从 420ms 回落到 318ms，SLA 恢复正常', source: 'prometheus', metric: 'latency_p99', threshold: '<350ms', currentValue: '318ms', status: 'resolved', createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 4.5 * 3600000).toISOString() },
    ],
  },
  cls002: {
    id: 'cls002',
    baseQps: 64,
    qpsAmplitude: 26,
    latencyP50Base: 126,
    latencyP99Base: 486,
    ttftBase: 214,
    tpotBase: 26.8,
    failRateBase: 2.2,
    vramBase: 57,
    gpuBase: 66,
    trainLossStart: 3.4,
    trainDecay: 0.095,
    trainThroughputBase: 820,
    logInstances: ['qwen7b-dev-0', 'qwen7b-dev-1', 'qwen7b-dev-2'],
    baseLogs: buildDenseLogs(makeBaseLogs('dev'), 38, 'dev', 23),
    streamLogs: buildDenseLogs([
      { time: '2025-03-15 10:06:12', level: 'WARN', instance: 'qwen7b-dev-1', msg: 'Kubelet restart detected on dev-gpu-02, readiness probing' },
      { time: '2025-03-15 10:06:52', level: 'ERROR', instance: 'qwen7b-dev-1', msg: 'gRPC upstream unavailable, retry budget exhausted' },
      { time: '2025-03-15 10:07:13', level: 'INFO', instance: 'qwen7b-dev-2', msg: 'Failover route switched to dev-gpu-01' },
      { time: '2025-03-15 10:07:49', level: 'DEBUG', instance: 'qwen7b-dev-0', msg: 'debug span persisted, trace_id=dev-a2f51e' },
    ], 22, 'dev', 20),
    extraAlerts: [
      { id: 'al-dev-001', clusterId: 'cls002', level: 'critical', title: '开发集群节点抖动', message: 'dev-gpu-02 在 10 分钟内出现 3 次 NotReady/Ready 抖动', source: 'k8s', metric: 'node_condition', threshold: '0', currentValue: '3', status: 'firing', createdAt: new Date(Date.now() - 42 * 60000).toISOString() },
      { id: 'al-dev-002', clusterId: 'cls002', level: 'warning', title: '推理失败率升高', message: '开发链路失败率达到 3.1%，请检查依赖服务连通性', source: 'apm', metric: 'fail_rate', threshold: '1.5%', currentValue: '3.1%', status: 'firing', createdAt: new Date(Date.now() - 90 * 60000).toISOString() },
    ],
  },
};

function getMonitoringProfile(clusterId: string): MonitoringProfile {
  return MONITORING_PROFILES[clusterId] ?? MONITORING_PROFILES.cls001;
}

function buildInferMetrics(profile: MonitoringProfile): InferencePoint[] {
  return Array.from({ length: 24 }, (_, i) => {
    const phase = profile.id === 'cls001' ? 0.3 : 1.1;
    const wave = Math.sin(i * 0.37 + phase);
    const wave2 = Math.cos(i * 0.21 + phase);
    const trend = profile.id === 'cls001' ? i * 0.45 : -i * 0.12;
    const qps = Math.round(clamp(profile.baseQps + wave * profile.qpsAmplitude + wave2 * 9 + trend, 12, 260));
    const failRate = clamp(profile.failRateBase + (profile.id === 'cls001' ? Math.max(0, wave2) * 0.55 : Math.abs(wave) * 0.95), 0.1, 6);
    const p50 = Math.round(clamp(profile.latencyP50Base + (profile.id === 'cls001' ? wave2 * 10 : Math.abs(wave) * 28), 60, 280));
    const p99 = Math.round(clamp(profile.latencyP99Base + (profile.id === 'cls001' ? Math.abs(wave) * 70 : Math.abs(wave) * 140), 180, 900));
    const ttft = Math.round(clamp(profile.ttftBase + (profile.id === 'cls001' ? wave * 22 : Math.abs(wave2) * 56), 90, 450));
    const tpot = clamp(profile.tpotBase + (profile.id === 'cls001' ? wave2 * 1.4 : Math.abs(wave) * 3.4), 8, 58);
    const gpu = Math.round(clamp(profile.gpuBase + wave * 8 + (profile.id === 'cls002' ? -6 * Math.abs(wave2) : 0), 28, 98));
    const vram = Math.round(clamp(profile.vramBase + wave2 * 6 + (profile.id === 'cls002' ? -5 * Math.abs(wave) : 0), 20, 92));

    return {
      time: `${String(i).padStart(2, '0')}:00`,
      QPS: qps,
      RPM: qps * 60 + (profile.id === 'cls001' ? 380 : 140),
      TPM: qps * (profile.id === 'cls001' ? 2320 : 1480),
      latency_p50: p50,
      latency_p99: p99,
      TTFT: ttft,
      TPOT: Number(tpot.toFixed(1)),
      failRate: Number(failRate.toFixed(2)),
      vram,
      gpu,
    };
  });
}

function buildTrainMetrics(profile: MonitoringProfile): TrainingPoint[] {
  return Array.from({ length: 20 }, (_, i) => {
    const step = (i + 1) * 100;
    const profileWave = profile.id === 'cls001' ? Math.sin(i * 0.3) : Math.sin(i * 0.6);
    const loss = profile.trainLossStart * Math.exp(-i * profile.trainDecay) + (profile.id === 'cls001' ? 0.26 : 0.42) + Math.abs(profileWave) * (profile.id === 'cls001' ? 0.03 : 0.11);
    const evalLoss = loss + (profile.id === 'cls001' ? 0.08 : 0.2);
    const acc = clamp((profile.id === 'cls001' ? 0.52 : 0.34) + i * (profile.id === 'cls001' ? 0.022 : 0.015) - Math.abs(profileWave) * (profile.id === 'cls001' ? 0.004 : 0.013), 0.3, 0.98);
    const gpuUtil = Math.round(clamp((profile.id === 'cls001' ? 86 : 71) + profileWave * (profile.id === 'cls001' ? 6 : 14), 48, 98));
    const throughput = Math.round(clamp(profile.trainThroughputBase + i * (profile.id === 'cls001' ? 32 : 16) + profileWave * (profile.id === 'cls001' ? 80 : 120), 480, 2100));

    return {
      step,
      loss: Number(loss.toFixed(3)),
      eval_loss: Number(evalLoss.toFixed(3)),
      acc: Number(acc.toFixed(3)),
      gpu_util: gpuUtil,
      vram_gb: Math.round(clamp((profile.id === 'cls001' ? 66 : 43) + profileWave * (profile.id === 'cls001' ? 3 : 7), 24, 80)),
      throughput,
    };
  });
}

function toNumberedLogs(lines: Omit<MonitoringLogLine, 'id'>[], idOffset = 0): MonitoringLogLine[] {
  return lines.map((line, idx) => ({ ...line, id: idOffset + idx + 1 }));
}

const LOG_LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-primary', WARN: 'text-warning', ERROR: 'text-error', DEBUG: 'text-text-muted',
};

const LOG_LEVELS = ['全部级别', 'INFO', 'WARN', 'ERROR', 'DEBUG'];
const TIME_RANGES = [
  { label: '最近 15 分钟', value: '15m' },
  { label: '最近 1 小时', value: '1h' },
  { label: '最近 6 小时', value: '6h' },
  { label: '今天', value: 'today' },
  { label: '自定义', value: 'custom' },
];
export default function Monitoring() {
  const { clusters, selectedCluster, selectedClusterId, setSelectedClusterId } = useClusters();
  const monitoringProfile = useMemo(() => getMonitoringProfile(selectedClusterId), [selectedClusterId]);
  const inferMetrics = useMemo(() => buildInferMetrics(monitoringProfile), [monitoringProfile]);
  const trainMetrics = useMemo(() => buildTrainMetrics(monitoringProfile), [monitoringProfile]);
  const streamLines = useMemo(() => toNumberedLogs(monitoringProfile.streamLogs, 900), [monitoringProfile]);
  const logInstances = useMemo(() => ['全部实例', ...monitoringProfile.logInstances], [monitoringProfile]);
  const mergedAlerts = useMemo(() => [...mockAlerts, ...monitoringProfile.extraAlerts], [monitoringProfile]);

  const clusterMetrics = getMockMetricsByCluster(selectedClusterId);
  const chartData = clusterMetrics.gpuUtilization.map((pt, i) => ({
    time: pt.time,
    GPU: pt.value,
    CPU: clusterMetrics.cpuUtilization[i]?.value ?? 0,
  }));
  const latestInferPoint = inferMetrics[inferMetrics.length - 1];
  const peakQps = Math.max(...inferMetrics.map(point => point.QPS));
  const avgFailRate = inferMetrics.reduce((sum, point) => sum + point.failRate, 0) / inferMetrics.length;
  const avgTpm = Math.round(inferMetrics.reduce((sum, point) => sum + point.TPM, 0) / inferMetrics.length);

  const [tab, setTab] = useState('all');
  const [mainTab, setMainTab] = useState('metrics');
  const [alerts, setAlerts] = useState(mergedAlerts);
  const [logSearch, setLogSearch] = useState('');
  const [logInstance, setLogInstance] = useState('全部实例');
  const [logLevel, setLogLevel] = useState('全部级别');
  const [timeRange, setTimeRange] = useState('1h');
  const [customFrom, setCustomFrom] = useState('2025-03-15T10:00');
  const [customTo, setCustomTo] = useState('2025-03-15T10:10');
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval] = useState(5);
  const [refreshCountdown, setRefreshCountdown] = useState(5);
  const [logLines, setLogLines] = useState<MonitoringLogLine[]>(() => toNumberedLogs(monitoringProfile.baseLogs));
  const [, setStreamIdx] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setAlerts(mergedAlerts);
    setLogLines(toNumberedLogs(monitoringProfile.baseLogs));
    setStreamIdx(0);
    setLogInstance('全部实例');
    setLogLevel('全部级别');
    setAutoRefresh(false);
    setRefreshCountdown(refreshInterval);
  }, [mergedAlerts, monitoringProfile, refreshInterval]);

  // Real-time refresh: append a new streaming line each interval
  const doRefresh = useCallback(() => {
    setStreamIdx(prev => {
      const idx = prev % streamLines.length;
      const newLine = { ...streamLines[idx], id: Date.now() };
      setLogLines(ls => [...ls, newLine]);
      return prev + 1;
    });
    setRefreshCountdown(refreshInterval);
  }, [refreshInterval, streamLines]);

  useEffect(() => {
    if (!autoRefresh) return;
    const tick = setInterval(() => {
      setRefreshCountdown(c => {
        if (c <= 1) { doRefresh(); return refreshInterval; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [autoRefresh, refreshInterval, doRefresh]);

  useEffect(() => {
    if (autoScroll && mainTab === 'logs') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mainTab, autoScroll, logLines]);

  const filteredLogs = logLines.filter(l => {
    const matchInst = logInstance === '全部实例' || l.instance === logInstance;
    const matchLevel = logLevel === '全部级别' || l.level === logLevel;
    const matchSearch = !logSearch || l.msg.toLowerCase().includes(logSearch.toLowerCase()) || l.instance.includes(logSearch);
    return matchInst && matchLevel && matchSearch;
  });

  const filtered = alerts.filter(a => {
    const matchCluster = selectedCluster ? a.clusterId === selectedCluster.id : true;
    if (tab === 'all') return true;
    if (tab === 'resolved') return a.status === 'resolved';
    return a.level === tab && a.status === 'firing' && matchCluster;
  }).filter(a => (selectedCluster ? a.clusterId === selectedCluster.id : true));

  const resolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));
    toast.success('告警已处理', '告警状态已更新为已处理');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="监控告警" subtitle="集群实时监控、告警管理与服务日志分析" icon={<BellRing size={20} />} />

      <div className="max-w-sm">
        <Select
          label="当前集群"
          value={selectedClusterId}
          onChange={e => setSelectedClusterId(e.target.value)}
          options={clusters.map(cluster => ({ value: cluster.id, label: `${cluster.name} (${cluster.region})` }))}
        />
      </div>

      <Tabs tabs={MAIN_TABS} active={mainTab} onChange={setMainTab} />

      {(mainTab === 'metrics') && (<>
      <Card noPadding>
        <div className="px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold text-text-primary">资源利用率趋势 (24h)</span>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="mGpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
              <Area type="monotone" dataKey="GPU" stroke="#3B82F6" strokeWidth={2} fill="url(#mGpu)" />
              <Area type="monotone" dataKey="CPU" stroke="#06B6D4" strokeWidth={2} fill="url(#mCpu)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card noPadding>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">告警列表</span>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="divide-y divide-border/50">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">暂无{tab !== 'all' ? `${tab}类型的` : ''}告警</div>
          )}
          {filtered.map(alert => (
            <div key={alert.id} className="px-5 py-3 flex items-center gap-3">
              {levelIcon[alert.level] ?? <Info size={13} className="text-primary" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{alert.title}</p>
                <p className="text-xs text-text-muted">{alert.source} · {clusters.find(c => c.id === alert.clusterId)?.name ?? '未知集群'} · {new Date(alert.createdAt).toLocaleString('zh-CN')}</p>
              </div>
              <Badge variant={alert.status === 'resolved' ? 'success' : alert.level === 'critical' ? 'error' : 'warning'}>
                {alert.status === 'resolved' ? '已处理' : alert.level}
              </Badge>
              {alert.status === 'firing' && (
                <Button size="sm" variant="ghost" leftIcon={<CheckCircle2 size={12} />} onClick={() => resolve(alert.id)}>
                  处理
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
      </>)}

      {mainTab === 'inference' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'QPS (当前)', value: String(latestInferPoint.QPS), unit: ' req/s', icon: <Zap size={16} className="text-primary" />, sub: `峰值 ${peakQps} req/s` },
              { label: 'P99 延迟', value: String(latestInferPoint.latency_p99), unit: ' ms', icon: <Clock size={16} className="text-warning" />, sub: `P50: ${latestInferPoint.latency_p50}ms` },
              { label: 'TTFT', value: String(latestInferPoint.TTFT), unit: ' ms', icon: <TrendingUp size={16} className="text-success" />, sub: '首 token 延迟' },
              { label: 'TPOT', value: String(latestInferPoint.TPOT), unit: ' ms/tok', icon: <BarChart2 size={16} className="text-accent" />, sub: '逐 token 延迟' },
            ].map(m => (
              <Card key={m.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">{m.label}</span>
                  {m.icon}
                </div>
                <p className="text-2xl font-bold text-text-primary">{m.value}<span className="text-sm font-normal text-text-muted">{m.unit}</span></p>
                <p className="text-xs text-text-muted mt-1">{m.sub}</p>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'RPM', value: latestInferPoint.RPM.toLocaleString(), sub: '每分钟请求数' },
              { label: 'TPM', value: `${Math.round(avgTpm / 1000)}K`, sub: '每分钟 Token 数' },
              { label: '失败率', value: `${avgFailRate.toFixed(2)}%`, sub: '近 24h 平均' },
              { label: 'VRAM 使用', value: `${latestInferPoint.vram} %`, sub: `GPU 利用率 ${latestInferPoint.gpu}%` },
            ].map(m => (
              <Card key={m.label}>
                <p className="text-xs text-text-muted mb-1">{m.label}</p>
                <p className="text-xl font-bold text-text-primary">{m.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{m.sub}</p>
              </Card>
            ))}
          </div>

          {/* QPS & RPM trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">服务请求量趋势 (24h)</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={inferMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <defs>
                      <linearGradient id="qpsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
                    <Area type="monotone" dataKey="QPS" stroke="#3B82F6" strokeWidth={2} fill="url(#qpsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">端到端延迟分布 P50/P99 (24h)</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={inferMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} unit="ms" />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
                    <Line type="monotone" dataKey="latency_p50" name="P50" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="latency_p99" name="P99" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* TTFT / TPOT & VRAM/GPU */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">首 Token 延迟 (TTFT) 趋势</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={inferMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <defs>
                      <linearGradient id="ttftGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} unit="ms" />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="TTFT" stroke="#10B981" strokeWidth={2} fill="url(#ttftGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">GPU 利用率 & VRAM 占用</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={inferMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
                    <Line type="monotone" dataKey="gpu" name="GPU利用率" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vram" name="VRAM占用%" stroke="#A855F7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {mainTab === 'fullchain' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-primary/8 border border-primary/20 rounded-xl">
            <Cpu size={16} className="text-primary shrink-0" />
            <p className="text-xs text-text-secondary">全链路追踪覆盖 <span className="text-primary font-semibold">训练阶段</span>（数据加载→前向传播→梯度更新→检查点保存）与 <span className="text-primary font-semibold">推理阶段</span>（请求接入→Prefill→Decode→输出回传）的端到端资源与性能可观测性</p>
          </div>

          {/* Training stage */}
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">▸ 训练阶段</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">训练 Loss 曲线</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trainMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
                    <Line type="monotone" dataKey="loss" name="train loss" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="eval_loss" name="eval loss" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">训练 GPU 利用率 & 吞吐</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trainMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} unit="%" domain={[60, 100]} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
                    <Line yAxisId="left" type="monotone" dataKey="gpu_util" name="GPU%" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="throughput" name="样本/s" stroke="#A855F7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Inference stage */}
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 mt-2">▸ 推理阶段</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">请求 QPS & 失败率</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={inferMetrics} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} interval={3} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
                    <Line yAxisId="left" type="monotone" dataKey="QPS" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="failRate" name="失败率%" stroke="#EF4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card noPadding>
              <div className="px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">Prefill (TTFT) vs Decode (TPOT) 分布</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={inferMetrics.filter((_, i) => i % 3 === 0)} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} unit="ms" />
                    <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A8BFDE' }} />
                    <Bar dataKey="TTFT" name="TTFT(ms)" fill="#10B981" opacity={0.85} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="TPOT" name="TPOT(ms)" fill="#A855F7" opacity={0.85} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {mainTab === 'alerts' && (
      <Card noPadding>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">告警列表</span>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="divide-y divide-border/50">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">暂无告警</div>
          )}
          {filtered.map(alert => (
            <div key={alert.id} className="px-5 py-3 flex items-center gap-3">
              {levelIcon[alert.level] ?? <Info size={13} className="text-primary" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{alert.title}</p>
                <p className="text-xs text-text-muted">{alert.source} · {new Date(alert.createdAt).toLocaleString('zh-CN')}</p>
              </div>
              <Badge variant={alert.status === 'resolved' ? 'success' : alert.level === 'critical' ? 'error' : 'warning'}>
                {alert.status === 'resolved' ? '已处理' : alert.level}
              </Badge>
              {alert.status === 'firing' && (
                <Button size="sm" variant="ghost" leftIcon={<CheckCircle2 size={12} />} onClick={() => resolve(alert.id)}>处理</Button>
              )}
            </div>
          ))}
        </div>
      </Card>
      )}

      {mainTab === 'logs' && (
        <Card>
          {/* Toolbar row 1: time range */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <CalendarDays size={13} className="text-text-muted shrink-0" />
            <span className="text-xs text-text-muted shrink-0">时间范围：</span>
            <div className="flex items-center gap-1 flex-wrap">
              {TIME_RANGES.map(r => (
                <button key={r.value} onClick={() => setTimeRange(r.value)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    timeRange === r.value ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-text-muted hover:text-text-primary'
                  }`}>{r.label}</button>
              ))}
            </div>
            {timeRange === 'custom' && (
              <div className="flex items-center gap-2 ml-1">
                <input type="datetime-local" value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="bg-base border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary/60" />
                <span className="text-xs text-text-muted">至</span>
                <input type="datetime-local" value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="bg-base border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary/60" />
              </div>
            )}
            {/* Real-time refresh */}
            <div className="ml-auto flex items-center gap-2">
              {autoRefresh && (
                <span className="text-xs text-text-muted">{refreshCountdown}s 后刷新</span>
              )}
              <button onClick={() => { setAutoRefresh(v => !v); setRefreshCountdown(refreshInterval); }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  autoRefresh ? 'border-success/40 text-success bg-success/10' : 'border-border text-text-muted hover:text-text-primary'
                }`}>
                {autoRefresh ? <Pause size={12} /> : <Play size={12} />}
                {autoRefresh ? '停止刷新' : '实时刷新'}
              </button>
              <button onClick={doRefresh}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors">
                <RefreshCw size={12} />手动刷新
              </button>
            </div>
          </div>
          {/* Toolbar row 2: search + instance + level */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={logSearch} onChange={e => setLogSearch(e.target.value)}
                placeholder="关键词检索…"
                className="w-full pl-8 pr-3 py-2 bg-base border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/60"
              />
            </div>
            <select value={logInstance} onChange={e => setLogInstance(e.target.value)}
              className="bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/60">
              {logInstances.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-text-muted" />
              {LOG_LEVELS.map(lv => (
                <button key={lv} onClick={() => setLogLevel(lv)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    logLevel === lv
                      ? lv === 'ERROR' ? 'bg-error/15 border-error/40 text-error'
                        : lv === 'WARN' ? 'bg-warning/15 border-warning/40 text-warning'
                        : lv === 'INFO' ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-white/10 border-border text-text-primary'
                      : 'border-border text-text-muted hover:text-text-primary'
                  }`}>{lv === '全部级别' ? '全部' : lv}</button>
              ))}
            </div>
            <button onClick={() => setAutoScroll(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${autoScroll ? 'border-primary/40 text-primary bg-primary/10' : 'border-border text-text-muted'}`}>
              <RefreshCw size={12} />自动滚动
            </button>
          </div>
          <div className="bg-base rounded-xl border border-border overflow-y-auto max-h-[420px] font-mono text-xs p-4 space-y-1">
            {filteredLogs.length === 0 && (
              <p className="text-text-muted text-center py-8">暂无匹配日志</p>
            )}
            {filteredLogs.map((l, idx) => (
              <div key={`${l.id}-${idx}`} className="flex items-start gap-3 hover:bg-white/[0.02] px-1 py-0.5 rounded">
                <span className="text-text-muted shrink-0">{l.time}</span>
                <span className={`shrink-0 font-bold w-12 ${LOG_LEVEL_COLOR[l.level]}`}>[{l.level}]</span>
                <span className="text-accent shrink-0">{l.instance}</span>
                <span className="text-text-secondary break-all">{l.msg}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-text-muted">共 {filteredLogs.length} 条日志{autoRefresh ? ' · 实时刷新中' : ''}</p>
            {timeRange !== 'custom' && (
              <p className="text-xs text-text-muted">
                {TIME_RANGES.find(r => r.value === timeRange)?.label}
              </p>
            )}
          </div>
        </Card>
      )}

    </div>
  );
}
