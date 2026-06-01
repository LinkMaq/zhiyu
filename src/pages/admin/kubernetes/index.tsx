import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Network, Puzzle, ToggleLeft, ToggleRight, Layers, AlertCircle, RefreshCw, Edit2, Wrench, Trash2, TerminalSquare, Command, Play, ChevronRight, Server, Minimize2, Square, Circle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatusDot } from '../../../components/ui/StatusDot';
import { Tabs } from '../../../components/ui/Tabs';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { useClusters } from '../../../contexts/ClusterContext';

interface PluginConfig {
  namespace: string;
  releaseName: string;
  installChannel: string;
  valuesProfile: string;
  resourcePolicy: string;
  note: string;
  updatedAt: string;
}

interface PluginItem {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  desc: string;
  config?: PluginConfig;
}

interface PluginConfigDraft {
  namespace: string;
  releaseName: string;
  installChannel: string;
  valuesProfile: string;
  resourcePolicy: string;
  note: string;
}

const DEFAULT_PLUGIN_FORM: PluginConfigDraft = {
  namespace: 'kube-system',
  releaseName: '',
  installChannel: 'stable',
  valuesProfile: 'production',
  resourcePolicy: 'balanced',
  note: '',
};

function createPluginConfig(pluginName: string, overrides: Partial<PluginConfigDraft> = {}): PluginConfig {
  const baseReleaseName = pluginName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const draft = {
    ...DEFAULT_PLUGIN_FORM,
    releaseName: baseReleaseName,
    ...overrides,
  };

  return {
    ...draft,
    updatedAt: overrides.note ? '2026-05-29 10:30' : '2026-05-29 09:00',
  };
}

const PLUGINS: PluginItem[] = [
  {
    id: 'p1',
    name: 'NVIDIA Device Plugin',
    version: 'v0.14.3',
    enabled: true,
    desc: 'GPU 资源调度插件',
    config: createPluginConfig('NVIDIA Device Plugin', {
      namespace: 'gpu-system',
      releaseName: 'nvidia-device-plugin',
      installChannel: 'stable',
      valuesProfile: 'production',
      resourcePolicy: 'performance',
      note: '已开启 MIG 兼容模式与 GPU 健康探针。',
    }),
  },
  {
    id: 'p2',
    name: 'Volcano Scheduler',
    version: 'v1.8.2',
    enabled: true,
    desc: '批量作业调度引擎',
    config: createPluginConfig('Volcano Scheduler', {
      namespace: 'volcano-system',
      releaseName: 'volcano',
      installChannel: 'stable',
      valuesProfile: 'high-density',
      resourcePolicy: 'balanced',
      note: '已启用抢占式队列与 gang scheduling 策略。',
    }),
  },
  {
    id: 'p3',
    name: 'Cert Manager',
    version: 'v1.13.0',
    enabled: true,
    desc: '证书自动管理',
    config: createPluginConfig('Cert Manager', {
      namespace: 'cert-manager',
      releaseName: 'cert-manager',
      installChannel: 'stable',
      valuesProfile: 'production',
      resourcePolicy: 'cost-optimized',
      note: '默认签发链路接入内部 CA 与 ACME 回退。',
    }),
  },
  {
    id: 'p4',
    name: 'Prometheus Stack',
    version: 'v0.68.0',
    enabled: true,
    desc: '监控指标采集',
    config: createPluginConfig('Prometheus Stack', {
      namespace: 'monitoring',
      releaseName: 'prometheus-stack',
      installChannel: 'lts',
      valuesProfile: 'production',
      resourcePolicy: 'performance',
      note: '保留 30 天指标数据，已接入告警路由与远端存储。',
    }),
  },
  { id: 'p5', name: 'Istio Service Mesh', version: 'v1.19.0', enabled: false, desc: '服务网格流量管理' },
  { id: 'p6', name: 'Keda Autoscaler', version: 'v2.12.0', enabled: false, desc: '事件驱动弹性伸缩' },
];

const INSTALL_CHANNEL_OPTIONS = [
  { value: 'stable', label: '稳定通道' },
  { value: 'lts', label: '长期支持' },
  { value: 'canary', label: '灰度通道' },
];

const VALUES_PROFILE_OPTIONS = [
  { value: 'production', label: '生产基线' },
  { value: 'high-density', label: '高密部署' },
  { value: 'observability', label: '可观测增强' },
];

const RESOURCE_POLICY_OPTIONS = [
  { value: 'balanced', label: '均衡资源' },
  { value: 'performance', label: '高性能优先' },
  { value: 'cost-optimized', label: '成本优化' },
];

const MOCK_WORKLOADS = [
  { id: 'w1', clusterId: 'cls001', name: 'qwen-7b-infer', podName: 'qwen-7b-infer-7f6dc4b97d-9mk2q', container: 'engine', namespace: 'inference', kind: 'Deployment', replicas: 3, ready: 3, image: 'zhiyun/vllm:0.4.2', cpu: '12c', memory: '48Gi', createdAt: '2025-03-10', status: 'Running' },
  { id: 'w2', clusterId: 'cls001', name: 'llama3-finetune-job', podName: 'llama3-finetune-job-0', container: 'trainer', namespace: 'training', kind: 'Job', replicas: 1, ready: 1, image: 'zhiyun/trainer:1.2.0', cpu: '32c', memory: '128Gi', createdAt: '2025-03-14', status: 'Running' },
  { id: 'w3', clusterId: 'cls001', name: 'dataset-processor', podName: 'dataset-processor-cron-abc12', container: 'processor', namespace: 'pipeline', kind: 'CronJob', replicas: 1, ready: 0, image: 'zhiyun/processor:0.9.1', cpu: '4c', memory: '8Gi', createdAt: '2025-03-01', status: 'Completed' },
  { id: 'w4', clusterId: 'cls002', name: 'embedding-service', podName: 'embedding-service-6d8fc5d7b7-hx4tl', container: 'api', namespace: 'inference', kind: 'Deployment', replicas: 2, ready: 2, image: 'zhiyun/embedding:1.0.3', cpu: '8c', memory: '16Gi', createdAt: '2025-03-12', status: 'Running' },
  { id: 'w5', clusterId: 'cls002', name: 'model-converter', podName: 'model-converter-xz7k9', container: 'converter', namespace: 'tools', kind: 'Job', replicas: 1, ready: 0, image: 'zhiyun/converter:0.5.0', cpu: '16c', memory: '64Gi', createdAt: '2025-03-15', status: 'Failed' },
  { id: 'w6', clusterId: 'cls001', name: 'monitoring-collector', podName: 'monitoring-collector-p2lhm', container: 'node-exporter', namespace: 'monitoring', kind: 'DaemonSet', replicas: 5, ready: 5, image: 'prom/node-exporter:v1.7.0', cpu: '0.5c', memory: '256Mi', createdAt: '2025-02-20', status: 'Running' },
];

const MOCK_EVENTS = [
  { id: 'ev1', time: '2025-03-15 10:03:01', type: 'Normal', reason: 'ScalingReplicaSet', object: 'Deployment/qwen-7b-infer', namespace: 'inference', msg: 'Scaled up replica set qwen-7b-infer-b7d9f from 2 to 3' },
  { id: 'ev2', time: '2025-03-15 10:02:58', type: 'Warning', reason: 'BackOff', object: 'Pod/model-converter-xz7k9', namespace: 'tools', msg: 'Back-off restarting failed container' },
  { id: 'ev3', time: '2025-03-15 09:55:12', type: 'Normal', reason: 'Pulled', object: 'Pod/llama3-finetune-job-0', namespace: 'training', msg: 'Successfully pulled image zhiyun/trainer:1.2.0 in 18.3s' },
  { id: 'ev4', time: '2025-03-15 09:50:00', type: 'Normal', reason: 'NodeReady', object: 'Node/gpu-node-03', namespace: '', msg: 'Node gpu-node-03 status is now: NodeReady' },
  { id: 'ev5', time: '2025-03-15 09:45:30', type: 'Warning', reason: 'FailedScheduling', object: 'Pod/dataset-processor-cron-abc', namespace: 'pipeline', msg: 'Insufficient nvidia.com/gpu on 4 nodes' },
  { id: 'ev6', time: '2025-03-14 18:00:05', type: 'Normal', reason: 'SuccessfulCreate', object: 'Job/llama3-finetune-job', namespace: 'training', msg: 'Created pod: llama3-finetune-job-0' },
  { id: 'ev7', time: '2025-03-14 16:30:00', type: 'Normal', reason: 'QuotaAllocated', object: 'ResourcePool/gpu-pool-a', namespace: 'system', msg: 'GPU quota 32 allocated to tenant 中国电信四川分公司' },
  { id: 'ev8', time: '2025-03-14 14:20:11', type: 'Warning', reason: 'NodeNotReady', object: 'Node/gpu-node-02', namespace: '', msg: 'Node gpu-node-02 status is now: NodeNotReady (maintenance mode)' },
];

const WORKLOAD_STATUS_COLOR: Record<string, string> = {
  Running: 'success', Completed: 'secondary', Failed: 'error', Pending: 'warning',
};

const MAIN_TABS = [
  { key: 'clusters', label: '集群总览', icon: <Network size={14} /> },
  { key: 'workloads', label: '工作负载', icon: <Layers size={14} /> },
  { key: 'plugins', label: '插件管理', icon: <Puzzle size={14} /> },
  { key: 'events', label: '集群事件', icon: <AlertCircle size={14} /> },
];

type ConsoleMode = 'kubectl' | 'webshell';
type WorkloadItem = typeof MOCK_WORKLOADS[number];

const KUBECTL_PRESETS = [
  'kubectl get pod -n {namespace} {pod}',
  'kubectl describe pod -n {namespace} {pod}',
  'kubectl logs -n {namespace} {pod} -c {container} --tail=50',
  'kubectl exec -it -n {namespace} {pod} -c {container} -- /bin/bash',
];

function formatKubectlPreset(template: string, workload: WorkloadItem) {
  return template
    .replaceAll('{namespace}', workload.namespace)
    .replaceAll('{pod}', workload.podName)
    .replaceAll('{container}', workload.container);
}

function buildKubectlResult(command: string, workload: WorkloadItem, clusterName: string) {
  if (command.includes('describe pod')) {
    return [
      `Name:           ${workload.podName}`,
      `Namespace:      ${workload.namespace}`,
      `Node:           ${clusterName === 'telecom-gpu-prod' ? 'node-gpu-01/10.100.2.1' : 'dev-gpu-01/10.200.2.1'}`,
      `Container:      ${workload.container}`,
      `Image:          ${workload.image}`,
      `Status:         ${workload.status}`,
      `QoS Class:      Burstable`,
      `Events:         Pulled image successfully, readiness probe passed`,
    ];
  }

  if (command.includes('logs')) {
    return [
      `[2026-05-29 10:02:15] INFO starting container ${workload.container}`,
      `[2026-05-29 10:02:19] INFO model artifact mounted successfully`,
      `[2026-05-29 10:02:31] INFO health probe ready`,
      `[2026-05-29 10:03:02] INFO request throughput stable`,
    ];
  }

  if (command.includes('exec')) {
    return [
      `Defaulted container \"${workload.container}\" out of 1`,
      `Connected to ${workload.podName}. Use Web Shell for interactive session.`,
    ];
  }

  return [
    `NAME                              READY   STATUS      RESTARTS   AGE`,
    `${workload.podName}   1/1     ${workload.status}   0          2d`,
  ];
}

function buildShellResult(command: string, workload: WorkloadItem) {
  const trimmed = command.trim();

  if (trimmed === 'pwd') return ['/workspace'];
  if (trimmed === 'ls' || trimmed === 'ls -la') return ['checkpoints/', 'configs/', 'logs/', 'models/', 'start.sh'];
  if (trimmed === 'whoami') return ['root'];
  if (trimmed.startsWith('cat /etc/os-release')) return ['NAME="Ubuntu"', 'VERSION="22.04.4 LTS (Jammy Jellyfish)"'];
  if (trimmed.startsWith('env')) return [`POD_NAME=${workload.podName}`, `NAMESPACE=${workload.namespace}`, `CONTAINER_NAME=${workload.container}`];
  if (trimmed.startsWith('nvidia-smi')) {
    return workload.image.includes('prom/')
      ? ['NVIDIA-SMI not available in this container']
      : ['GPU 0  NVIDIA A100 80GB  42C   18142MiB / 81920MiB', 'GPU 1  NVIDIA A100 80GB  40C   16420MiB / 81920MiB'];
  }

  return [`bash: ${trimmed}: command completed successfully`];
}

export default function K8sManagement() {
  const { clusters, toggleClusterMaintenance, deleteCluster } = useClusters();
  const [plugins, setPlugins] = useState(PLUGINS);
  const [mainTab, setMainTab] = useState('clusters');
  const [pluginConfigOpen, setPluginConfigOpen] = useState(false);
  const [pluginTarget, setPluginTarget] = useState<PluginItem | null>(null);
  const [pluginConfigDraft, setPluginConfigDraft] = useState<PluginConfigDraft>(DEFAULT_PLUGIN_FORM);
  const [consoleMode, setConsoleMode] = useState<ConsoleMode>('kubectl');
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [selectedWorkload, setSelectedWorkload] = useState<WorkloadItem | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const { toast } = useToast();

  const clusterNameMap = useMemo(() => Object.fromEntries(clusters.map(cluster => [cluster.id, cluster.name])), [clusters]);

  const openConsole = (workload: WorkloadItem, mode: ConsoleMode) => {
    const clusterName = clusterNameMap[workload.clusterId] ?? 'unknown-cluster';
    setSelectedWorkload(workload);
    setConsoleMode(mode);
    setCommandInput(mode === 'kubectl'
      ? `kubectl exec -it -n ${workload.namespace} ${workload.podName} -c ${workload.container} -- /bin/bash`
      : 'ls -la');
    setTerminalLines([
      `Connected target: ${clusterName}/${workload.namespace}/${workload.podName}`,
      mode === 'kubectl'
        ? 'kubectl 通道已建立，可执行 get/describe/logs/exec 等命令。'
        : `Web Shell attached: root@${workload.podName}:/workspace#`,
    ]);
    setConsoleOpen(true);
  };

  const runCommand = () => {
    if (!selectedWorkload || !commandInput.trim()) return;
    const clusterName = clusterNameMap[selectedWorkload.clusterId] ?? 'unknown-cluster';
    const nextLines = consoleMode === 'kubectl'
      ? buildKubectlResult(commandInput, selectedWorkload, clusterName)
      : buildShellResult(commandInput, selectedWorkload);

    setTerminalLines(prev => [
      ...prev,
      consoleMode === 'kubectl' ? `$ ${commandInput}` : `root@${selectedWorkload.podName}:/workspace# ${commandInput}`,
      ...nextLines,
    ]);

    toast.success(consoleMode === 'kubectl' ? 'kubectl 已执行' : 'Web Shell 已执行', `${selectedWorkload.podName} 返回了最新结果`);
  };

  const buildPluginDraft = (plugin: PluginItem): PluginConfigDraft => ({
    namespace: plugin.config?.namespace ?? (plugin.name.includes('Istio') ? 'istio-system' : plugin.name.includes('Keda') ? 'keda' : DEFAULT_PLUGIN_FORM.namespace),
    releaseName: plugin.config?.releaseName ?? plugin.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    installChannel: plugin.config?.installChannel ?? 'stable',
    valuesProfile: plugin.config?.valuesProfile ?? (plugin.name.includes('Istio') ? 'observability' : 'production'),
    resourcePolicy: plugin.config?.resourcePolicy ?? (plugin.name.includes('Istio') ? 'performance' : 'balanced'),
    note: plugin.config?.note ?? '',
  });

  const openPluginConfig = (plugin: PluginItem) => {
    setPluginTarget(plugin);
    setPluginConfigDraft(buildPluginDraft(plugin));
    setPluginConfigOpen(true);
  };

  const closePluginConfig = () => {
    setPluginConfigOpen(false);
    setPluginTarget(null);
    setPluginConfigDraft(DEFAULT_PLUGIN_FORM);
  };

  const toggle = (id: string) => {
    const plugin = plugins.find(item => item.id === id);
    if (!plugin) return;

    if (!plugin.enabled) {
      openPluginConfig(plugin);
      return;
    }

    setPlugins(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, enabled: false };
    }));
    toast.success('插件更新', `${plugin.name} 已禁用`);
  };

  const handlePluginConfigSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!pluginTarget) return;

    const nextConfig: PluginConfig = {
      ...pluginConfigDraft,
      releaseName: pluginConfigDraft.releaseName.trim() || pluginTarget.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      namespace: pluginConfigDraft.namespace.trim() || 'kube-system',
      updatedAt: '2026-05-29 11:20',
    };

    setPlugins(prev => prev.map(plugin => {
      if (plugin.id !== pluginTarget.id) return plugin;
      return {
        ...plugin,
        enabled: true,
        config: nextConfig,
      };
    }));

    toast.success('插件已启用', `${pluginTarget.name} 配置已下发到 ${nextConfig.namespace}`);
    closePluginConfig();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Kubernetes 集群管理" subtitle="集群节点、工作负载、插件与事件管理" icon={<Network size={20} />} />

      <Tabs tabs={MAIN_TABS} active={mainTab} onChange={setMainTab} />

      {mainTab === 'clusters' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link to="/admin/kubernetes/create">
              <Button>创建集群</Button>
            </Link>
          </div>
          {clusters.map(cluster => (
            <Card key={cluster.id} noPadding>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={cluster.status} />
                  <span className="text-sm font-bold text-text-primary">{cluster.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Edit2 size={12} />}
                    onClick={() => toast.info('编辑集群', `已打开 ${cluster.name} 的配置编辑`)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Wrench size={12} />}
                    onClick={() => {
                      const updated = toggleClusterMaintenance(cluster.id);
                      if (!updated) return;
                      toast.info('维护状态更新', `${cluster.name} 已${updated.status === 'warning' ? '进入维护态' : '退出维护态'}`);
                    }}
                  >
                    维护
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-error hover:text-error"
                    leftIcon={<Trash2 size={12} />}
                    onClick={() => {
                      deleteCluster(cluster.id);
                      toast.success('集群已删除', `${cluster.name} 已从列表移除`);
                    }}
                  >
                    删除
                  </Button>
                  <Badge variant="secondary">{cluster.version}</Badge>
                  <Badge variant={cluster.status === 'healthy' ? 'success' : 'warning'}>{cluster.status}</Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-text-muted">集群配置摘要</p>
                  <p className="text-xs text-text-muted">创建时间 {new Date(cluster.createdAt).toLocaleDateString('zh-CN')}</p>
                </div>
                <div className="space-y-3 text-xs text-text-secondary">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-3 border-b border-border/40">
                    <p>区域: <span className="text-text-primary">{cluster.region}</span></p>
                    <p>K8s: <span className="text-text-primary">{cluster.version}</span></p>
                    <p>命名空间: <span className="text-text-primary">{cluster.namespaces}</span></p>
                    <p>服务数: <span className="text-text-primary">{cluster.services}</span></p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-3 border-b border-border/40">
                    <p>总节点: <span className="text-text-primary">{cluster.nodes.length} 台</span></p>
                    <p>控制面: <span className="text-text-primary">{cluster.nodes.filter(n => n.role === 'master').length} 台</span></p>
                    <p>GPU节点: <span className="text-text-primary">{cluster.nodes.filter(n => n.role === 'gpu-worker').length} 台</span></p>
                    <p>CPU节点: <span className="text-text-primary">{cluster.nodes.filter(n => n.role === 'worker').length} 台</span></p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-3 border-b border-border/40">
                    <p>CPU: <span className="text-text-primary">{cluster.cpuUsed} / {cluster.cpuTotal}</span></p>
                    <p>内存: <span className="text-text-primary">{cluster.memoryUsed} / {cluster.memoryTotal}</span></p>
                    <p>GPU: <span className="text-text-primary">{cluster.gpuUsed} / {cluster.gpuTotal}</span></p>
                    <p>PV: <span className="text-text-primary">{cluster.pvs}</span></p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-text-muted">网络插件: <span className="text-text-secondary">{cluster.plugins[0]?.description ?? '未配置网络插件信息'}</span></p>
                    <p className="text-text-muted">存储插件: <span className="text-text-secondary">{cluster.plugins[1]?.description ?? '未配置存储插件信息'}</span></p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {mainTab === 'workloads' && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">容器命令执行</p>
                <p className="text-xs text-text-muted mt-1">支持在工作负载列表中直接发起 kubectl 命令，或附着 Web Shell 进入容器内部执行排障命令。</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                <Badge variant="primary">kubectl exec / logs / describe</Badge>
                <Badge variant="success">Web Shell 进入容器</Badge>
              </div>
            </div>
          </Card>

          <Card noPadding>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">工作负载列表</span>
              <span className="text-xs text-text-muted">共 {MOCK_WORKLOADS.length} 个</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    {['名称', '命名空间', 'Pod / 容器', '类型', '镜像', '副本', 'CPU', '内存', '创建时间', '状态', '进入容器'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-text-secondary divide-y divide-border/30">
                  {MOCK_WORKLOADS.map(w => (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{w.name}</td>
                      <td className="px-4 py-3 text-accent">{w.namespace}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-mono text-text-primary">{w.podName}</p>
                          <p className="text-text-muted">container: {w.container}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="secondary">{w.kind}</Badge></td>
                      <td className="px-4 py-3 font-mono max-w-[180px] truncate">{w.image}</td>
                      <td className="px-4 py-3">
                        <span className={w.ready === w.replicas ? 'text-success' : 'text-warning'}>
                          {w.ready}/{w.replicas}
                        </span>
                      </td>
                      <td className="px-4 py-3">{w.cpu}</td>
                      <td className="px-4 py-3">{w.memory}</td>
                      <td className="px-4 py-3 text-text-muted">{w.createdAt}</td>
                      <td className="px-4 py-3">
                        <Badge variant={WORKLOAD_STATUS_COLOR[w.status] as any}>{w.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" leftIcon={<Command size={13} />} onClick={() => openConsole(w, 'kubectl')}>
                            kubectl
                          </Button>
                          <Button size="sm" variant="outline" leftIcon={<TerminalSquare size={13} />} onClick={() => openConsole(w, 'webshell')}>
                            Web Shell
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {mainTab === 'plugins' && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">插件启用配置</p>
                <p className="text-xs text-text-muted mt-1">在启用插件前补充命名空间、发布名称、安装通道和值配置策略，避免启用后再补录基础参数。</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                <Badge variant="primary">命名空间与发布名</Badge>
                <Badge variant="success">通道与资源策略</Badge>
                <Badge variant="secondary">配置备注留痕</Badge>
              </div>
            </div>
          </Card>

          <Card noPadding>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Puzzle size={16} className="text-accent" />
                <span className="text-sm font-semibold text-text-primary">插件管理</span>
              </div>
              <span className="text-xs text-text-muted">已启用 {plugins.filter(plugin => plugin.enabled).length} / {plugins.length}</span>
            </div>
            <div className="divide-y divide-border/50">
              {plugins.map(p => (
                <div key={p.id} className="px-5 py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.enabled ? 'bg-success/15' : 'bg-surface'}`}>
                      <Puzzle size={16} className={p.enabled ? 'text-success' : 'text-text-muted'} />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-text-primary font-medium">{p.name}</p>
                          <Badge variant={p.enabled ? 'success' : 'ghost'}>{p.enabled ? '运行中' : '未启用'}</Badge>
                          <Badge variant="secondary">{p.version}</Badge>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{p.desc}</p>
                      </div>

                      {p.config ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 text-xs">
                          <div className="rounded-lg border border-border/60 bg-base/60 px-3 py-2">
                            <p className="text-text-muted">命名空间</p>
                            <p className="text-text-primary mt-1">{p.config.namespace}</p>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-base/60 px-3 py-2">
                            <p className="text-text-muted">发布名称</p>
                            <p className="text-text-primary mt-1 font-mono">{p.config.releaseName}</p>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-base/60 px-3 py-2">
                            <p className="text-text-muted">安装策略</p>
                            <p className="text-text-primary mt-1">{p.config.installChannel} / {p.config.valuesProfile}</p>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-base/60 px-3 py-2">
                            <p className="text-text-muted">资源策略</p>
                            <p className="text-text-primary mt-1">{p.config.resourcePolicy}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted">启用前需补充部署命名空间、安装通道和值配置策略。</p>
                      )}

                      {p.config?.note && <p className="text-xs text-text-muted">配置说明：{p.config.note}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end xl:self-center">
                    <Button size="sm" variant="ghost" onClick={() => openPluginConfig(p)}>
                      {p.enabled ? '编辑配置' : '配置并启用'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(p.id)} leftIcon={p.enabled ? <ToggleRight size={15} className="text-success" /> : <ToggleLeft size={15} className="text-text-muted" />}>
                      {p.enabled ? '已启用' : '已禁用'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {mainTab === 'events' && (
        <Card noPadding>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-warning" />
              <span className="text-sm font-semibold text-text-primary">集群事件</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
              <RefreshCw size={12} />刷新
            </button>
          </div>
          <div className="divide-y divide-border/50">
            {MOCK_EVENTS.map(ev => (
              <div key={ev.id} className="px-5 py-3 flex items-start gap-3">
                <span className={`mt-0.5 text-xs font-semibold shrink-0 ${ev.type === 'Warning' ? 'text-warning' : 'text-success'}`}>
                  {ev.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-text-primary">{ev.reason}</span>
                    <span className="text-xs text-accent">{ev.object}</span>
                    {ev.namespace && <Badge variant="ghost">{ev.namespace}</Badge>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{ev.msg}</p>
                </div>
                <span className="text-xs text-text-muted shrink-0 whitespace-nowrap">{ev.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={pluginConfigOpen && !!pluginTarget}
        onClose={closePluginConfig}
        title={pluginTarget ? `${pluginTarget.enabled ? '编辑' : '启用'}插件配置` : '插件配置'}
        width="lg"
      >
        {pluginTarget && (
          <form className="space-y-5" onSubmit={handlePluginConfigSubmit}>
            <div className="rounded-xl border border-border/70 bg-base/40 px-4 py-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{pluginTarget.name}</p>
                  <p className="text-xs text-text-muted mt-1">{pluginTarget.desc} · 当前版本 {pluginTarget.version}</p>
                </div>
                <Badge variant={pluginTarget.enabled ? 'success' : 'secondary'}>{pluginTarget.enabled ? '配置调整' : '待启用'}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="部署命名空间"
                value={pluginConfigDraft.namespace}
                onChange={event => setPluginConfigDraft(prev => ({ ...prev, namespace: event.target.value }))}
                placeholder="例如 istio-system"
              />
              <Input
                label="发布名称"
                value={pluginConfigDraft.releaseName}
                onChange={event => setPluginConfigDraft(prev => ({ ...prev, releaseName: event.target.value }))}
                placeholder="例如 istio-service-mesh"
              />
              <Select
                label="安装通道"
                value={pluginConfigDraft.installChannel}
                onChange={event => setPluginConfigDraft(prev => ({ ...prev, installChannel: event.target.value }))}
                options={INSTALL_CHANNEL_OPTIONS}
              />
              <Select
                label="值配置模板"
                value={pluginConfigDraft.valuesProfile}
                onChange={event => setPluginConfigDraft(prev => ({ ...prev, valuesProfile: event.target.value }))}
                options={VALUES_PROFILE_OPTIONS}
              />
              <Select
                label="资源策略"
                value={pluginConfigDraft.resourcePolicy}
                onChange={event => setPluginConfigDraft(prev => ({ ...prev, resourcePolicy: event.target.value }))}
                options={RESOURCE_POLICY_OPTIONS}
              />
              <div className="rounded-lg border border-border bg-base px-3 py-2.5">
                <p className="text-sm font-medium text-text-secondary">配置生效范围</p>
                <p className="text-xs text-text-muted mt-2">保存后将写入插件启动参数，并在插件列表保留当前部署配置快照。</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">配置备注</label>
              <textarea
                className="w-full min-h-[104px] bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                value={pluginConfigDraft.note}
                onChange={event => setPluginConfigDraft(prev => ({ ...prev, note: event.target.value }))}
                placeholder="填写启动参数说明、依赖服务、兼容策略等信息"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closePluginConfig}>取消</Button>
              <Button type="submit">{pluginTarget.enabled ? '保存配置' : '保存并启用'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={consoleOpen && !!selectedWorkload}
        onClose={() => setConsoleOpen(false)}
        title={consoleMode === 'kubectl' ? 'kubectl 命令控制台' : 'Web Shell 容器终端'}
        width="2xl"
      >
        {selectedWorkload && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">
              <div className="space-y-4">
                <Card>
                  <div className="space-y-2 text-sm">
                    <p className="text-text-primary font-semibold flex items-center gap-2"><Server size={15} /> 连接目标</p>
                    <p className="text-text-secondary">集群: <span className="text-text-primary">{clusterNameMap[selectedWorkload.clusterId] ?? selectedWorkload.clusterId}</span></p>
                    <p className="text-text-secondary">命名空间: <span className="text-text-primary">{selectedWorkload.namespace}</span></p>
                    <p className="text-text-secondary">Pod: <span className="text-text-primary font-mono break-all">{selectedWorkload.podName}</span></p>
                    <p className="text-text-secondary">容器: <span className="text-text-primary">{selectedWorkload.container}</span></p>
                    <p className="text-text-secondary">镜像: <span className="text-text-primary font-mono break-all">{selectedWorkload.image}</span></p>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-text-primary">接入方式</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant={consoleMode === 'kubectl' ? 'primary' : 'ghost'} leftIcon={<Command size={13} />} onClick={() => setConsoleMode('kubectl')}>kubectl</Button>
                      <Button size="sm" variant={consoleMode === 'webshell' ? 'primary' : 'ghost'} leftIcon={<TerminalSquare size={13} />} onClick={() => setConsoleMode('webshell')}>Web Shell</Button>
                    </div>
                    <p className="text-xs text-text-muted">kubectl 适合执行 describe/logs/exec 等管理命令，Web Shell 适合进入容器内部排障。</p>
                  </div>
                </Card>

                {consoleMode === 'kubectl' && (
                  <Card>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text-primary">常用命令</p>
                      <div className="space-y-2">
                        {KUBECTL_PRESETS.map(preset => {
                          const value = formatKubectlPreset(preset, selectedWorkload);
                          return (
                            <button
                              key={preset}
                              type="button"
                              className="w-full text-left rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:border-primary/40 hover:text-text-primary transition-colors"
                              onClick={() => setCommandInput(value)}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Card className="border-border/70 bg-[#0d1117] overflow-hidden">
                  <div className="border-b border-white/10 px-4 py-3 bg-[#111827]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/60">
                        <Minimize2 size={12} />
                        <Square size={11} />
                        <Circle size={11} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{consoleMode === 'kubectl' ? 'Cluster Operator Terminal' : 'Interactive Container Shell'}</p>
                        <p className="text-xs text-white/50 mt-1">{clusterNameMap[selectedWorkload.clusterId] ?? selectedWorkload.clusterId} / {selectedWorkload.namespace} / {selectedWorkload.podName}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="ghost">{consoleMode === 'kubectl' ? 'kubectl session' : 'shell attached'}</Badge>
                        <Badge variant="ghost">container {selectedWorkload.container}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-0 min-h-[620px]">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0b1220]">
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                          {consoleMode === 'kubectl' ? <Command size={14} /> : <TerminalSquare size={14} />} 执行输出
                        </p>
                        <Badge variant="ghost">实时会话</Badge>
                      </div>
                      <div className="flex-1 rounded-none border-0 bg-[#05070d] px-5 py-4 font-mono text-[13px] text-green-300 space-y-2 overflow-auto min-h-[500px]">
                        {terminalLines.map((line, index) => (
                          <p key={`${line}-${index}`} className="break-all leading-6 tracking-[0.01em]">{line}</p>
                        ))}
                        {consoleMode === 'webshell' && (
                          <p className="text-sky-300 flex items-center gap-1"><ChevronRight size={12} /> 会话已附着到容器内部，可继续执行 Shell 指令</p>
                        )}
                      </div>
                      <div className="border-t border-white/10 bg-[#0b1220] px-4 py-4">
                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
                          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-3">
                            <Input
                              label={consoleMode === 'kubectl' ? '执行 kubectl 命令' : '执行容器内部命令'}
                              value={commandInput}
                              onChange={e => setCommandInput(e.target.value)}
                              hint={consoleMode === 'kubectl' ? '示例：kubectl logs / describe / exec' : '示例：ls -la、pwd、env、nvidia-smi'}
                              className="bg-transparent border-white/10 text-green-300 placeholder:text-white/25 font-mono"
                            />
                          </div>
                          <Button leftIcon={<Play size={13} />} onClick={runCommand} className="h-[42px]">执行命令</Button>
                        </div>
                      </div>
                    </div>
                    <div className="border-t 2xl:border-t-0 2xl:border-l border-white/10 bg-[#0a0f1c] p-4 space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-white">会话信息</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-white/45">模式</p>
                            <p className="text-white mt-1">{consoleMode === 'kubectl' ? 'kubectl 管理通道' : '容器交互 Shell'}</p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-white/45">工作目录</p>
                            <p className="text-white mt-1">/workspace</p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 col-span-2">
                            <p className="text-white/45">最近目标</p>
                            <p className="text-white mt-1 break-all">{selectedWorkload.podName} / {selectedWorkload.container}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-white">快捷命令</p>
                        <div className="space-y-2">
                          {(consoleMode === 'kubectl'
                            ? KUBECTL_PRESETS.map(preset => formatKubectlPreset(preset, selectedWorkload))
                            : ['pwd', 'ls -la', 'env', 'cat /etc/os-release', 'nvidia-smi']
                          ).map(item => (
                            <button
                              key={item}
                              type="button"
                              className="w-full text-left rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/75 hover:text-white hover:border-primary/40 transition-colors font-mono"
                              onClick={() => setCommandInput(item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60 leading-5">
                        当前终端提供完整会话视图，支持更大输出区、命令输入区和会话上下文侧栏，便于处理容器进入与命令执行任务。
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
