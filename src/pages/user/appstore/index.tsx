import React, { useState } from 'react';
import { LayoutGrid, Search, Star, Download, ExternalLink, Sparkles, BrainCircuit, Eye, Mic, Code2, FlaskConical, BarChart2, MessageSquare, Key, Play, ThumbsUp, Pin, Filter, Globe, Users, Lock, GitBranch, RefreshCw, Activity } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { mockApps } from '../../../data/mockData';
import type { AppRuntimeLog, AppSpace } from '../../../types';

const CATS = ['全部', '大语言模型', '视觉感知', '语音处理', '代码辅助', '科学计算', '数据分析'];
const INDUSTRIES = ['全行业', '金融', '政务', '国防', '教育', '医疗', '工业'];
const SORT_OPTS = [
  { value: 'stars', label: '热度优先' },
  { value: 'rating', label: '评分优先' },
  { value: 'downloads', label: '下载量' },
  { value: 'newest', label: '最新发布' },
];

const catMap: Record<string, string> = {
  llm: '大语言模型', vision: '视觉感知', audio: '语音处理',
  tool: '代码辅助', multimodal: '视觉感知',
};

const categoryIcon: Record<string, React.ReactElement> = {
  '大语言模型': <BrainCircuit size={18} className="text-primary" />,
  '视觉感知': <Eye size={18} className="text-accent" />,
  '语音处理': <Mic size={18} className="text-secondary" />,
  '代码辅助': <Code2 size={18} className="text-success" />,
  '科学计算': <FlaskConical size={18} className="text-warning" />,
  '数据分析': <BarChart2 size={18} className="text-error" />,
};

const accessIcon: Record<string, React.ReactElement> = {
  public: <Globe size={11} className="text-success" />,
  tenant: <Users size={11} className="text-primary" />,
  team:   <Lock size={11} className="text-text-muted" />,
};

const MOCK_REVIEWS = [
  { user: '赵磊', rating: 5, comment: '效果非常好，接入简单，推理速度快', date: '2025-02-18' },
  { user: '林志远', rating: 4, comment: '整体稳定，偶尔有延迟，建议优化并发', date: '2025-02-10' },
  { user: '吴晓燕', rating: 5, comment: '已集成到生产环境，表现超出预期', date: '2025-01-25' },
];

const VERSION_SNAPSHOTS = [
  {
    version: 'v1.6.0',
    createdAt: '2025-03-18 10:12',
    gitRef: 'main@d1f1c9a',
    buildId: 'pipeline-328',
    status: 'released',
    frozen: false,
    diff: '新增流式响应与模型热切换，优化 11% 首 token 延迟。',
  },
  {
    version: 'v1.5.2',
    createdAt: '2025-03-12 18:40',
    gitRef: 'release@9ab24ce',
    buildId: 'pipeline-319',
    status: 'stable',
    frozen: true,
    diff: '修复 API 权限同步延迟，增加工作空间级分享范围。',
  },
  {
    version: 'v1.5.0',
    createdAt: '2025-03-05 09:06',
    gitRef: 'release@2ff9c11',
    buildId: 'pipeline-307',
    status: 'rollback-ready',
    frozen: false,
    diff: '首个公开版应用空间模板，接入自动构建与在线预览。',
  },
];

const PIPELINE_STAGES = [
  { name: '源码同步', detail: 'Git 仓库自动拉取 main 分支', status: 'success' },
  { name: '镜像构建', detail: 'Build #328 · 4 分 23 秒', status: 'success' },
  { name: '预览环境', detail: 'preview.zhiyun.ai 已可访问', status: 'running' },
  { name: '生产发布', detail: '待审批后重新发布', status: 'queued' },
];

const SHARE_SCOPE_OPTIONS = [
  { value: 'workspace', label: '仅内部工作空间' },
  { value: 'team', label: '特定团队可见' },
  { value: 'tenant', label: '租户共享' },
  { value: 'partner', label: '外部合作方' },
  { value: 'public', label: '公开上架' },
];

const REGION_OPTIONS = [
  { value: '绵阳专区', label: '绵阳专区' },
  { value: '西南节点', label: '西南节点' },
  { value: '跨区共享', label: '跨区共享' },
];

const INDUSTRY_OPTIONS = [
  { value: '全行业', label: '全行业' },
  { value: '金融', label: '金融' },
  { value: '政务', label: '政务' },
  { value: '教育', label: '教育' },
  { value: '医疗', label: '医疗' },
  { value: '工业', label: '工业' },
];

type CloudInstanceStatus = 'deploying' | 'running' | 'stopped' | 'error';

interface CloudAppInstance {
  id: string;
  name: string;
  status: CloudInstanceStatus;
  cluster: string;
  namespace: string;
  replicas: number;
  minReplicas: number;
  maxReplicas: number;
  cpu: string;
  memory: string;
  gpuType: string;
  gpuCount: number;
  ingressEnabled: boolean;
  ingressHost?: string;
  pvcEnabled: boolean;
  pvcSizeGi: number;
  pvcMountPath: string;
  envCount: number;
  createdAt: string;
  updatedAt: string;
}

const CLOUD_PIPELINE = [
  { key: 'template', label: '模板注入', detail: '应用模板与默认运行参数注入', status: 'done' },
  { key: 'build', label: '镜像构建', detail: 'CI 自动构建并推送镜像仓库', status: 'running' },
  { key: 'deploy', label: '实例发布', detail: '部署到目标集群并执行健康检查', status: 'queued' },
  { key: 'ops', label: '运维接管', detail: '接入监控、日志、告警与弹性策略', status: 'queued' },
];

const CLOUD_DEFAULT_INSTANCES: CloudAppInstance[] = [
  {
    id: 'ci001',
    name: 'customer-assistant-prod',
    status: 'running',
    cluster: 'telecom-gpu-prod',
    namespace: 'app-customer',
    replicas: 3,
    minReplicas: 2,
    maxReplicas: 8,
    cpu: '8',
    memory: '32Gi',
    gpuType: 'A100-80G',
    gpuCount: 1,
    ingressEnabled: true,
    ingressHost: 'customer-app.zhiyun.ai',
    pvcEnabled: true,
    pvcSizeGi: 200,
    pvcMountPath: '/data/workspace',
    envCount: 6,
    createdAt: '2025-05-15 09:20',
    updatedAt: '2025-06-01 09:35',
  },
  {
    id: 'ci002',
    name: 'customer-assistant-staging',
    status: 'stopped',
    cluster: 'telecom-dev',
    namespace: 'app-customer-staging',
    replicas: 1,
    minReplicas: 1,
    maxReplicas: 2,
    cpu: '4',
    memory: '16Gi',
    gpuType: 'A10-24G',
    gpuCount: 1,
    ingressEnabled: true,
    ingressHost: 'staging-customer.zhiyun.ai',
    pvcEnabled: true,
    pvcSizeGi: 100,
    pvcMountPath: '/data/workspace',
    envCount: 4,
    createdAt: '2025-05-10 18:04',
    updatedAt: '2025-05-29 14:22',
  },
];

interface AppSpaceForm {
  name: string;
  modelName: string;
  sourceRepo: string;
  gitBranch: string;
  previewUrl: string;
  cluster: string;
  namespace: string;
  cpu: string;
  memory: string;
  gpuType: string;
  gpuCount: string;
  runtimeEnvironment: string;
  capabilities: string;
  description: string;
}

const DEFAULT_APP_SPACE_FORM: AppSpaceForm = {
  name: '',
  modelName: '',
  sourceRepo: '',
  gitBranch: 'main',
  previewUrl: '',
  cluster: 'telecom-gpu-prod',
  namespace: '',
  cpu: '8',
  memory: '32Gi',
  gpuType: 'A100-80G',
  gpuCount: '1',
  runtimeEnvironment: 'production',
  capabilities: '',
  description: '',
};

function buildRuntimeLogs(app: AppSpace): AppRuntimeLog[] {
  if (app.runtimeLogs?.length) return app.runtimeLogs;
  const statusText = app.status === 'running' ? '运行中' : app.status === 'deploying' ? '部署中' : app.status === 'stopped' ? '已停止' : '异常';
  return [
    { time: '09:40:18', level: 'info', message: `${app.name} 当前状态：${statusText}` },
    { time: '09:39:12', level: 'info', message: 'Git 同步完成，正在等待运行时调度' },
    { time: '09:38:05', level: 'success', message: '健康检查通过，服务探针正常' },
  ];
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? 'text-warning fill-warning' : 'text-border'} />
      ))}
    </span>
  );
}

function AppDetailModal({ app, onClose, onUpdateApp }: { app: AppSpace; onClose: () => void; onUpdateApp: (updater: (current: AppSpace) => AppSpace) => void }) {
  const { toast } = useToast();
  const [demoInput, setDemoInput] = useState('');
  const [demoResult, setDemoResult] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'api' | 'reviews' | 'governance' | 'cloudnative'>('overview');
  const [subscribed, setSubscribed] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(VERSION_SNAPSHOTS[0].version);
  const [shareScope, setShareScope] = useState(app.accessLevel === 'public' ? 'public' : app.accessLevel === 'tenant' ? 'tenant' : 'workspace');
  const [industryScope, setIndustryScope] = useState(app.industry?.[0] ?? '全行业');
  const [regionScope, setRegionScope] = useState('绵阳专区');
  const [callLimit, setCallLimit] = useState('10000');
  const [concurrencyLimit, setConcurrencyLimit] = useState('20');
  const [expiresAt, setExpiresAt] = useState('2025-12-31');
  const [instances, setInstances] = useState<CloudAppInstance[]>(CLOUD_DEFAULT_INSTANCES);
  const [deploying, setDeploying] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [cloudForm, setCloudForm] = useState({
    instanceName: `${app.id}-instance`,
    cluster: 'telecom-gpu-prod',
    namespace: `app-${app.id}`,
    cpu: '8',
    memory: '32Gi',
    gpuType: 'A100-80G',
    gpuCount: '1',
    replicas: '2',
    minReplicas: '2',
    maxReplicas: '6',
    ingressEnabled: true,
    ingressHost: `${app.id}.zhiyun.ai`,
    ingressPath: '/',
    pvcEnabled: true,
    pvcSizeGi: '200',
    pvcMountPath: '/data/workspace',
    envText: 'APP_ENV=production\nMODEL_NAME=qwen2.5\nLOG_LEVEL=info',
  });
  const runtimeLogs = buildRuntimeLogs(app);
  const capabilityItems = app.capabilities?.length ? app.capabilities : app.tags;

  const runDemo = async () => {
    if (!demoInput.trim()) return;
    setDemoLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setDemoResult(`【模型回复】根据您的输入"${demoInput.slice(0, 20)}..."，智算平台AI分析如下：\n\n✅ 实体识别完成，共检测到 12 个关键信息节点\n📊 情感倾向：正向（置信度 92.4%）\n🔗 关联推理链路：3 跳知识图谱路径\n\n详细结果已保存至工作空间 /outputs/inference_result_${Date.now()}.json`);
    setDemoLoading(false);
  };

  const apiKey = `sk-zhiyun-${Math.random().toString(36).slice(2, 14)}`;
  const snapshotDetail = VERSION_SNAPSHOTS.find(item => item.version === selectedSnapshot) ?? VERSION_SNAPSHOTS[0];

  const handleRollback = () => {
    toast.success('已发起版本回滚', `正在回滚到 ${snapshotDetail.version}`);
  };

  const handleAppLifecycle = async (action: 'publish' | 'stop' | 'republish') => {
    setLifecycleBusy(true);
    onUpdateApp(current => ({
      ...current,
      status: action === 'stop' ? 'stopped' : 'deploying',
      buildStatus: action === 'stop' ? 'success' : 'building',
      buildProgress: action === 'stop' ? 100 : 78,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      lastDeployedAt: action === 'stop' ? current.lastDeployedAt : new Date().toLocaleString('zh-CN', { hour12: false }),
      runtimeLogs: [
        { time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), level: action === 'stop' ? 'warning' : 'info', message: action === 'stop' ? '应用空间已停止，在线预览入口已关闭' : 'Git 仓库同步完成，正在触发自动构建与在线部署' },
        { time: '09:38:05', level: 'info', message: '运行时环境已重新拉起，准备发布' },
        { time: '09:37:12', level: 'success', message: '健康检查通过，构建链路正常' },
      ],
    }));
    await new Promise(resolve => setTimeout(resolve, 900));
    if (action !== 'stop') {
      onUpdateApp(current => ({
        ...current,
        status: 'running',
        buildStatus: 'success',
        buildProgress: 100,
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        lastDeployedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        runtimeLogs: [
          { time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), level: 'success', message: action === 'republish' ? '重新发布完成，应用空间已切换到最新版本' : '应用空间发布完成，服务已恢复运行' },
          { time: '09:38:05', level: 'info', message: '健康检查通过，运行态保持稳定' },
          { time: '09:37:12', level: 'info', message: '在线预览已同步最新版本' },
        ],
      }));
    }
    setLifecycleBusy(false);
    toast.success(action === 'stop' ? '应用空间已停止' : action === 'publish' ? '已发布应用空间' : '已重新发布应用空间', action === 'stop' ? '运行实例已释放，预览地址暂停访问' : '自动构建、部署和预览已完成');
  };

  const handlePermissionSave = () => {
    toast.success('权限策略已更新', '共享范围、额度与有效期已实时生效');
  };

  const createCloudInstance = async () => {
    if (!cloudForm.instanceName.trim()) {
      toast.warning('缺少实例名称', '请填写应用实例名称');
      return;
    }
    if (cloudForm.ingressEnabled && !cloudForm.ingressHost.trim()) {
      toast.warning('缺少 Ingress 域名', '请填写应用公开访问域名');
      return;
    }
    if (cloudForm.pvcEnabled && (!cloudForm.pvcMountPath.trim() || Number(cloudForm.pvcSizeGi) <= 0)) {
      toast.warning('持久化存储配置不完整', '请检查 PVC 容量与挂载路径');
      return;
    }

    setDeploying(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const envCount = cloudForm.envText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.includes('='))
      .length;
    const now = new Date();
    const nowText = now.toLocaleString('zh-CN', { hour12: false });

    const instance: CloudAppInstance = {
      id: `ci-${Date.now()}`,
      name: cloudForm.instanceName.trim(),
      status: 'deploying',
      cluster: cloudForm.cluster,
      namespace: cloudForm.namespace,
      replicas: Number(cloudForm.replicas),
      minReplicas: Number(cloudForm.minReplicas),
      maxReplicas: Number(cloudForm.maxReplicas),
      cpu: cloudForm.cpu,
      memory: cloudForm.memory,
      gpuType: cloudForm.gpuType,
      gpuCount: Number(cloudForm.gpuCount),
      ingressEnabled: cloudForm.ingressEnabled,
      ingressHost: cloudForm.ingressEnabled ? cloudForm.ingressHost : undefined,
      pvcEnabled: cloudForm.pvcEnabled,
      pvcSizeGi: cloudForm.pvcEnabled ? Number(cloudForm.pvcSizeGi) : 0,
      pvcMountPath: cloudForm.pvcEnabled ? cloudForm.pvcMountPath : '-',
      envCount,
      createdAt: nowText,
      updatedAt: nowText,
    };

    setInstances(prev => [instance, ...prev]);
    setDeploying(false);
    toast.success('已触发快捷部署', '应用实例已进入自动化交付流程（构建、发布、健康检查）');

    setTimeout(() => {
      setInstances(prev => prev.map(item => item.id === instance.id ? { ...item, status: 'running', updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : item));
      toast.success('实例部署完成', `${instance.name} 已进入运行态`);
    }, 1800);
  };

  const updateInstance = (id: string, updater: (instance: CloudAppInstance) => CloudAppInstance) => {
    setInstances(prev => prev.map(item => (item.id === id ? updater(item) : item)));
  };

  const handleScale = (id: string, delta: number) => {
    updateInstance(id, instance => {
      const next = Math.max(instance.minReplicas, Math.min(instance.maxReplicas, instance.replicas + delta));
      return {
        ...instance,
        replicas: next,
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      };
    });
    toast.success('弹性伸缩已提交', delta > 0 ? '正在扩容应用实例' : '正在缩容应用实例');
  };

  const handleLifecycle = (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    if (action === 'delete') {
      setInstances(prev => prev.filter(item => item.id !== id));
      toast.success('实例已删除', '应用实例资源已回收');
      return;
    }

    if (action === 'restart') {
      updateInstance(id, instance => ({ ...instance, status: 'deploying', updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) }));
      toast.info('实例重启中', '正在执行滚动重启');
      setTimeout(() => {
        updateInstance(id, instance => ({ ...instance, status: 'running', updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) }));
        toast.success('实例重启完成', '应用实例已恢复服务');
      }, 1200);
      return;
    }

    updateInstance(id, instance => ({
      ...instance,
      status: action === 'start' ? 'running' : 'stopped',
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    }));
    toast.success(action === 'start' ? '实例已启动' : '实例已停止');
  };

  return (
    <Modal open onClose={onClose} title={app.name} width="lg">
      <div className="space-y-4">
        {/* Header info */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/15 flex items-center justify-center shrink-0">
            {categoryIcon[catMap[app.category] ?? app.category] ?? <Sparkles size={20} className="text-text-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {app.featured && <Badge variant="primary"><Sparkles size={9} className="inline mr-0.5" />精选</Badge>}
              {app.pinned && <Badge variant="warning"><Pin size={9} className="inline mr-0.5" />置顶</Badge>}
              <Badge variant="ghost">{catMap[app.category] ?? app.category}</Badge>
                <Badge variant={app.status === 'running' ? 'success' : app.status === 'deploying' ? 'primary' : app.status === 'stopped' ? 'ghost' : 'error'}>
                  {app.status === 'running' ? '运行中' : app.status === 'deploying' ? '部署中' : app.status === 'stopped' ? '已停止' : '异常'}
                </Badge>
              <span className="flex items-center gap-1 text-xs text-text-muted">{accessIcon[app.accessLevel]}<span className="ml-0.5">{app.accessLevel === 'public' ? '公开' : app.accessLevel === 'tenant' ? '租户可见' : '团队私有'}</span></span>
            </div>
            <p className="text-xs text-text-muted">{app.organization} · {app.creator} · <GitBranch size={10} className="inline" /> {app.sourceRepo}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end mb-1">
              <StarRow rating={app.rating} />
              <span className="text-xs text-text-secondary font-semibold ml-1">{app.rating}</span>
            </div>
            <p className="text-xs text-text-muted">{app.reviews} 条评价 · {app.subscribeCount} 订阅</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['overview', 'api', 'reviews', 'governance', 'cloudnative'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
              {t === 'overview' ? '概览与体验' : t === 'api' ? 'API调用' : t === 'reviews' ? '评价 & 评论' : t === 'governance' ? '版本治理' : '云原生部署'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">{app.description}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-surface rounded-lg p-3 border border-border">
                <p className="text-lg font-bold text-text-primary">{app.stars.toLocaleString()}</p>
                <p className="text-xs text-text-muted">收藏量</p>
              </div>
              <div className="bg-surface rounded-lg p-3 border border-border">
                <p className="text-lg font-bold text-text-primary">{app.downloads.toLocaleString()}</p>
                <p className="text-xs text-text-muted">调用次数</p>
              </div>
              <div className="bg-surface rounded-lg p-3 border border-border">
                <p className="text-lg font-bold text-text-primary">{app.subscribeCount}</p>
                <p className="text-xs text-text-muted">订阅用户</p>
              </div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={13} className="text-accent" />
                  <span className="text-sm font-semibold text-text-primary">模型能力概览</span>
                </div>
                <Badge variant={app.healthScore && app.healthScore >= 90 ? 'success' : app.healthScore && app.healthScore >= 75 ? 'primary' : 'warning'}>
                  健康分 {app.healthScore ?? 88}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {capabilityItems.map(item => <Badge key={item} variant="secondary">{item}</Badge>)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-text-muted">
                <div className="bg-base rounded-lg border border-border p-3"><p>模型</p><p className="text-text-primary font-semibold mt-1 truncate">{app.modelName}</p></div>
                <div className="bg-base rounded-lg border border-border p-3"><p>运行环境</p><p className="text-text-primary font-semibold mt-1">{app.runtimeEnvironment ?? 'production'}</p></div>
                <div className="bg-base rounded-lg border border-border p-3"><p>运行集群</p><p className="text-text-primary font-semibold mt-1">{app.runtimeCluster ?? 'telecom-gpu-prod'}</p></div>
                <div className="bg-base rounded-lg border border-border p-3"><p>预览地址</p><p className="text-text-primary font-semibold mt-1 truncate">{app.previewUrl ?? app.demoUrl ?? '在线预览可用'}</p></div>
              </div>
            </div>
            {app.hasDemoTrial && (
              <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Play size={13} className="text-success" />
                  <span className="text-sm font-semibold text-text-primary">在线交互入口</span>
                  <Badge variant="success">即时响应</Badge>
                </div>
                <textarea
                  value={demoInput}
                  onChange={e => setDemoInput(e.target.value)}
                  placeholder="输入文本或问题，点击运行查看模型响应..."
                  rows={3}
                  className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" leftIcon={<Play size={12} />} loading={demoLoading} onClick={runDemo}>运行推理</Button>
                  {demoResult && <Button size="sm" variant="ghost" leftIcon={<RefreshCw size={12} />} onClick={() => setDemoResult('')}>清空</Button>}
                </div>
                {demoResult && (
                  <div className="bg-base rounded-lg border border-success/20 p-3 text-xs text-text-secondary whitespace-pre-line font-mono">
                    {demoResult}
                  </div>
                )}
              </div>
            )}
            {!app.hasDemoTrial && (
              <div className="bg-surface/50 rounded-xl border border-border p-4 text-center text-xs text-text-muted">
                此应用暂不开放在线交互入口，请订阅后通过 API 调用
              </div>
            )}

            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <GitBranch size={13} className="text-primary" />
                  <span className="text-sm font-semibold text-text-primary">应用空间流水线</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary">Git 自动构建</Badge>
                  <Badge variant="success">在线预览</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {PIPELINE_STAGES.map((stage, index) => (
                  <div key={stage.name} className={`rounded-xl border border-border bg-base p-3 animate-slide-up stagger-${index}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs text-text-secondary">{stage.name}</p>
                      <Badge variant={stage.status === 'success' ? 'success' : stage.status === 'running' ? 'primary' : 'warning'}>
                        {stage.status === 'success' ? '完成' : stage.status === 'running' ? '运行中' : '待发布'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">{stage.detail}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" leftIcon={<Play size={12} />} onClick={() => toast.info('已打开在线预览', '访问地址已加载')}>在线预览</Button>
                <Button size="sm" variant="outline" leftIcon={<RefreshCw size={12} />} onClick={() => toast.success('已触发重新发布', '构建流水线已重新开始')}>重新发布</Button>
                <Button size="sm" variant="ghost" leftIcon={<GitBranch size={12} />} onClick={() => toast.info('源码仓库', app.sourceRepo)}>查看源码</Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'api' && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Key size={13} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">API 调用认证</span>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">您的 API Key（Bearer Token 认证）</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-base rounded border border-border px-3 py-2 text-xs text-success font-mono truncate">{apiKey}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(apiKey); toast.success('已复制', 'API Key 已复制到剪贴板'); }}>复制</Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">调用示例（Python）</p>
                <pre className="bg-base rounded border border-border p-3 text-xs text-text-secondary overflow-x-auto">{`import requests

resp = requests.post(
    "https://api.zhiyun.ai/v1/${app.id}/chat",
    headers={"Authorization": "Bearer ${apiKey}"},
    json={"messages": [{"role": "user", "content": "你好"}], "max_tokens": 512}
)
print(resp.json()["choices"][0]["message"]["content"])`}</pre>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-base rounded p-2 border border-border">
                  <p className="text-text-muted">调用上限</p>
                  <p className="text-text-primary font-semibold">10,000 次/天</p>
                </div>
                <div className="bg-base rounded p-2 border border-border">
                  <p className="text-text-muted">并发数</p>
                  <p className="text-text-primary font-semibold">20 并发</p>
                </div>
                <div className="bg-base rounded p-2 border border-border">
                  <p className="text-text-muted">有效期</p>
                  <p className="text-text-primary font-semibold">2025-12-31</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Lock size={13} className="text-warning" />
                  <span className="text-sm font-semibold text-text-primary">应用共享与权限</span>
                </div>
                <Badge variant={shareScope === 'public' ? 'success' : shareScope === 'tenant' ? 'primary' : shareScope === 'partner' ? 'warning' : 'secondary'}>
                  {shareScope === 'public' ? '公开上架' : shareScope === 'tenant' ? '租户共享' : shareScope === 'partner' ? '外部合作' : '内部共享'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {SHARE_SCOPE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setShareScope(option.value)}
                    className={`rounded-lg border px-3 py-2 text-xs transition-all ${shareScope === option.value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-base text-text-muted hover:border-primary/20 hover:text-text-secondary'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select label="行业场景" value={industryScope} onChange={event => setIndustryScope(event.target.value)} options={INDUSTRY_OPTIONS} />
                <Select label="地域范围" value={regionScope} onChange={event => setRegionScope(event.target.value)} options={REGION_OPTIONS} />
                <Input label="调用次数上限" value={callLimit} onChange={event => setCallLimit(event.target.value)} />
                <Input label="并发数上限" value={concurrencyLimit} onChange={event => setConcurrencyLimit(event.target.value)} />
                <Input label="有效期至" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-base rounded-lg border border-border p-3">
                  <p className="text-text-muted">共享范围</p>
                  <p className="text-text-primary font-semibold mt-1">{SHARE_SCOPE_OPTIONS.find(option => option.value === shareScope)?.label ?? shareScope}</p>
                </div>
                <div className="bg-base rounded-lg border border-border p-3">
                  <p className="text-text-muted">额度策略</p>
                  <p className="text-text-primary font-semibold mt-1">{callLimit} 次 / {concurrencyLimit} 并发</p>
                </div>
                <div className="bg-base rounded-lg border border-border p-3">
                  <p className="text-text-muted">生效状态</p>
                  <p className="text-success font-semibold mt-1">实时生效</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={handlePermissionSave}>保存并实时生效</Button>
                <Button size="sm" variant="outline" onClick={() => toast.warning('已撤销外部授权', '合作方调用令牌将在 60 秒内失效')}>撤销外部授权</Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            <div className="flex items-center gap-6 bg-surface rounded-xl border border-border p-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-text-primary">{app.rating}</p>
                <StarRow rating={app.rating} size={14} />
                <p className="text-xs text-text-muted mt-1">{app.reviews} 条评价</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="text-text-muted w-2">{s}</span>
                    <Star size={9} className="text-warning" />
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-warning rounded-full" style={{ width: `${s === 5 ? 65 : s === 4 ? 22 : s === 3 ? 8 : s === 2 ? 3 : 2}%` }} />
                    </div>
                    <span className="text-text-muted w-6 text-right">{s === 5 ? 65 : s === 4 ? 22 : s === 3 ? 8 : s === 2 ? 3 : 2}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {MOCK_REVIEWS.map((r, i) => (
                <div key={i} className="bg-surface rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">{r.user[0]}</div>
                      <span className="text-xs font-medium text-text-secondary">{r.user}</span>
                      <StarRow rating={r.rating} size={10} />
                    </div>
                    <span className="text-xs text-text-muted">{r.date}</span>
                  </div>
                  <p className="text-xs text-text-muted ml-8">{r.comment}</p>
                  <div className="flex items-center gap-1 mt-1.5 ml-8">
                    <button className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"><ThumbsUp size={10} /> 有用</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'governance' && (
          <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-4">
            <div className="space-y-2">
              {VERSION_SNAPSHOTS.map((snapshot, index) => (
                <button
                  key={snapshot.version}
                  type="button"
                  onClick={() => setSelectedSnapshot(snapshot.version)}
                  className={`w-full text-left rounded-xl border p-3 transition-all animate-slide-up stagger-${index} ${selectedSnapshot === snapshot.version ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface hover:border-primary/20'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">{snapshot.version}</span>
                    <Badge variant={snapshot.status === 'released' ? 'success' : snapshot.status === 'stable' ? 'primary' : 'warning'}>
                      {snapshot.status === 'released' ? '已发布' : snapshot.status === 'stable' ? '稳定版' : '可回滚'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-muted">{snapshot.createdAt}</p>
                  {snapshot.frozen && <p className="text-[11px] text-warning mt-1">已冻结，不允许覆盖</p>}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-text-primary">{snapshotDetail.version}</span>
                      <Badge variant={snapshotDetail.status === 'released' ? 'success' : snapshotDetail.status === 'stable' ? 'primary' : 'warning'}>
                        {snapshotDetail.status === 'released' ? '线上版本' : snapshotDetail.status === 'stable' ? '冻结基线' : '回滚候选'}
                      </Badge>
                      {snapshotDetail.frozen && <Badge variant="warning">已冻结</Badge>}
                    </div>
                    <p className="text-xs text-text-muted mt-1">构建时间 {snapshotDetail.createdAt} · Git {snapshotDetail.gitRef}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" leftIcon={<RefreshCw size={12} />} onClick={handleRollback}>回滚到此版本</Button>
                    <Button size="sm" variant="outline" onClick={() => toast.success('版本已冻结', `${snapshotDetail.version} 将作为基线版本保留`)}>冻结版本</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-base rounded-lg border border-border p-3">
                    <p className="text-text-muted">构建流水线</p>
                    <p className="text-text-primary font-semibold mt-1">{snapshotDetail.buildId}</p>
                  </div>
                  <div className="bg-base rounded-lg border border-border p-3">
                    <p className="text-text-muted">源码引用</p>
                    <p className="text-text-primary font-semibold mt-1">{snapshotDetail.gitRef}</p>
                  </div>
                  <div className="bg-base rounded-lg border border-border p-3">
                    <p className="text-text-muted">预览环境</p>
                    <p className="text-success font-semibold mt-1">preview.zhiyun.ai</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-base p-4">
                  <p className="text-xs text-text-muted mb-2">版本差异摘要</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{snapshotDetail.diff}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <Badge variant="ghost">Git 差异可追溯</Badge>
                    <Badge variant="primary">支持快照对比</Badge>
                    <Badge variant="success">支持版本回滚</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-accent" />
                    <span className="text-sm font-semibold text-text-primary">空间运行态概览</span>
                  </div>
                  <Badge variant="success">在线预览可用</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {PIPELINE_STAGES.map((stage, index) => (
                    <div key={stage.name} className={`rounded-xl border border-border bg-base p-3 animate-scale-in stagger-${index}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-text-secondary">{stage.name}</span>
                        <Badge variant={stage.status === 'success' ? 'success' : stage.status === 'running' ? 'primary' : 'warning'}>
                          {stage.status === 'success' ? '完成' : stage.status === 'running' ? '运行中' : '待执行'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">{stage.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'cloudnative' && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-text-primary">云原生应用快捷部署</p>
                  <p className="text-xs text-text-muted mt-1">支持 Git 源码管理、自动构建、在线部署、在线预览和应用空间生命周期管理。</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" leftIcon={<Play size={12} />} loading={deploying} onClick={createCloudInstance}>
                    {deploying ? '部署中...' : '创建运行实例'}
                  </Button>
                  <Button size="sm" variant="outline" leftIcon={<RefreshCw size={12} />} onClick={() => handleAppLifecycle('republish')} loading={lifecycleBusy}>重新发布</Button>
                  {app.status === 'running' ? (
                    <Button size="sm" variant="ghost" onClick={() => handleAppLifecycle('stop')} loading={lifecycleBusy}>停止空间</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleAppLifecycle('publish')} loading={lifecycleBusy}>发布空间</Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {CLOUD_PIPELINE.map(stage => (
                  <div key={stage.key} className="rounded-lg border border-border bg-base p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-text-secondary">{stage.label}</span>
                      <Badge variant={stage.status === 'done' ? 'success' : stage.status === 'running' ? 'primary' : 'warning'}>
                        {stage.status === 'done' ? '完成' : stage.status === 'running' ? '执行中' : '待执行'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-muted">{stage.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { label: '运行状态', value: app.status === 'running' ? '运行中' : app.status === 'deploying' ? '部署中' : app.status === 'stopped' ? '已停止' : '异常', sub: app.updatedAt },
                { label: '构建状态', value: app.buildStatus === 'success' ? '构建成功' : app.buildStatus === 'building' ? '构建中' : app.buildStatus === 'failed' ? '构建失败' : '待构建', sub: `${app.buildProgress ?? 0}%` },
                { label: '健康评分', value: `${app.healthScore ?? 88}`, sub: '实时采样' },
                { label: '最近发布', value: app.lastDeployedAt ?? app.updatedAt, sub: app.previewUrl ?? app.demoUrl ?? '预览地址可用' },
              ].map(item => (
                <Card key={item.label} className="p-4">
                  <p className="text-xs text-text-muted">{item.label}</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{item.value}</p>
                  <p className="text-xs text-text-muted mt-1 truncate">{item.sub}</p>
                </Card>
              ))}
            </div>

            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">云原生运行时配置</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="实例名称" value={cloudForm.instanceName} onChange={event => setCloudForm(prev => ({ ...prev, instanceName: event.target.value }))} />
                <Select
                  label="目标集群"
                  value={cloudForm.cluster}
                  onChange={event => setCloudForm(prev => ({ ...prev, cluster: event.target.value }))}
                  options={[
                    { value: 'telecom-gpu-prod', label: 'telecom-gpu-prod' },
                    { value: 'telecom-dev', label: 'telecom-dev' },
                  ]}
                />
                <Input label="命名空间" value={cloudForm.namespace} onChange={event => setCloudForm(prev => ({ ...prev, namespace: event.target.value }))} />
                <Input label="CPU 核数" value={cloudForm.cpu} onChange={event => setCloudForm(prev => ({ ...prev, cpu: event.target.value }))} />
                <Input label="内存" value={cloudForm.memory} onChange={event => setCloudForm(prev => ({ ...prev, memory: event.target.value }))} />
                <Select
                  label="GPU 型号"
                  value={cloudForm.gpuType}
                  onChange={event => setCloudForm(prev => ({ ...prev, gpuType: event.target.value }))}
                  options={[
                    { value: 'A100-80G', label: 'A100-80G' },
                    { value: 'H100-80G', label: 'H100-80G' },
                    { value: 'A10-24G', label: 'A10-24G' },
                  ]}
                />
                <Input label="GPU 数量" value={cloudForm.gpuCount} onChange={event => setCloudForm(prev => ({ ...prev, gpuCount: event.target.value }))} />
                <Input label="副本数" value={cloudForm.replicas} onChange={event => setCloudForm(prev => ({ ...prev, replicas: event.target.value }))} />
                <Input label="最小副本" value={cloudForm.minReplicas} onChange={event => setCloudForm(prev => ({ ...prev, minReplicas: event.target.value }))} />
                <Input label="最大副本" value={cloudForm.maxReplicas} onChange={event => setCloudForm(prev => ({ ...prev, maxReplicas: event.target.value }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-base p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Ingress 暴露</span>
                    <Button
                      size="sm"
                      variant={cloudForm.ingressEnabled ? 'primary' : 'outline'}
                      onClick={() => setCloudForm(prev => ({ ...prev, ingressEnabled: !prev.ingressEnabled }))}
                    >
                      {cloudForm.ingressEnabled ? '已启用' : '未启用'}
                    </Button>
                  </div>
                  {cloudForm.ingressEnabled && (
                    <>
                      <Input label="域名" value={cloudForm.ingressHost} onChange={event => setCloudForm(prev => ({ ...prev, ingressHost: event.target.value }))} />
                      <Input label="路径" value={cloudForm.ingressPath} onChange={event => setCloudForm(prev => ({ ...prev, ingressPath: event.target.value }))} />
                    </>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-base p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">持久化存储挂载</span>
                    <Button
                      size="sm"
                      variant={cloudForm.pvcEnabled ? 'primary' : 'outline'}
                      onClick={() => setCloudForm(prev => ({ ...prev, pvcEnabled: !prev.pvcEnabled }))}
                    >
                      {cloudForm.pvcEnabled ? '已启用' : '未启用'}
                    </Button>
                  </div>
                  {cloudForm.pvcEnabled && (
                    <>
                      <Input label="PVC 容量(Gi)" value={cloudForm.pvcSizeGi} onChange={event => setCloudForm(prev => ({ ...prev, pvcSizeGi: event.target.value }))} />
                      <Input label="挂载路径" value={cloudForm.pvcMountPath} onChange={event => setCloudForm(prev => ({ ...prev, pvcMountPath: event.target.value }))} />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">环境变量注入</label>
                <textarea
                  rows={4}
                  value={cloudForm.envText}
                  onChange={event => setCloudForm(prev => ({ ...prev, envText: event.target.value }))}
                  placeholder={'KEY=value'}
                  className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 resize-none"
                />
                <p className="text-xs text-text-muted mt-1">每行一个环境变量，格式为 KEY=value。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={13} className="text-success" />
                    <span className="text-sm font-semibold text-text-primary">实时运行日志</span>
                  </div>
                  <Badge variant={app.status === 'running' ? 'success' : app.status === 'deploying' ? 'primary' : 'warning'}>{app.status === 'running' ? '在线' : app.status === 'deploying' ? '发布中' : '待恢复'}</Badge>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {runtimeLogs.map((log, index) => (
                    <div key={`${log.time}-${index}`} className="flex items-start gap-3 rounded-lg border border-border bg-base px-3 py-2">
                      <span className={`mt-0.5 text-[11px] font-mono ${log.level === 'error' ? 'text-error' : log.level === 'warning' ? 'text-warning' : log.level === 'success' ? 'text-success' : 'text-text-muted'}`}>{log.time}</span>
                      <span className={`text-xs leading-relaxed ${log.level === 'error' ? 'text-error' : log.level === 'warning' ? 'text-warning' : log.level === 'success' ? 'text-success' : 'text-text-secondary'}`}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch size={13} className="text-primary" />
                    <span className="text-sm font-semibold text-text-primary">源码与部署概览</span>
                  </div>
                  <Badge variant={app.buildStatus === 'success' ? 'success' : app.buildStatus === 'building' ? 'primary' : app.buildStatus === 'failed' ? 'error' : 'ghost'}>
                    {app.buildStatus === 'success' ? '构建成功' : app.buildStatus === 'building' ? '构建中' : app.buildStatus === 'failed' ? '构建失败' : '待构建'}
                  </Badge>
                </div>
                <div className="space-y-2 text-xs text-text-muted">
                  <div className="bg-base rounded-lg border border-border p-3">
                    <p>Git 仓库</p>
                    <p className="text-text-primary font-semibold mt-1 break-all">{app.gitRepoUrl ?? app.sourceRepo}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-base rounded-lg border border-border p-3"><p>分支</p><p className="text-text-primary font-semibold mt-1">{app.gitBranch ?? 'main'}</p></div>
                    <div className="bg-base rounded-lg border border-border p-3"><p>提交</p><p className="text-text-primary font-semibold mt-1">{app.gitCommit ?? 'latest'}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-base rounded-lg border border-border p-3"><p>运行集群</p><p className="text-text-primary font-semibold mt-1">{app.runtimeCluster ?? 'telecom-gpu-prod'}</p></div>
                    <div className="bg-base rounded-lg border border-border p-3"><p>运行命名空间</p><p className="text-text-primary font-semibold mt-1">{app.runtimeNamespace ?? 'app-space'}</p></div>
                  </div>
                  <div className="bg-base rounded-lg border border-border p-3">
                    <p>在线预览</p>
                    <p className="text-text-primary font-semibold mt-1 break-all">{app.previewUrl ?? app.demoUrl ?? '预览地址待生成'}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold text-text-primary">应用实例管理</p>
                <Badge variant="primary">实例数 {instances.length}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {['实例', '状态', '资源规格', 'Ingress', '存储挂载', '弹性配置', '生命周期', '更新时间'].map(header => (
                        <th key={header} className="px-3 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {instances.map(instance => (
                      <tr key={instance.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                        <td className="px-3 py-3">
                          <p className="text-sm text-text-primary font-medium">{instance.name}</p>
                          <p className="text-xs text-text-muted">{instance.cluster}/{instance.namespace}</p>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={instance.status === 'running' ? 'success' : instance.status === 'deploying' ? 'primary' : instance.status === 'stopped' ? 'ghost' : 'error'}>
                            {instance.status === 'running' ? '运行中' : instance.status === 'deploying' ? '部署中' : instance.status === 'stopped' ? '已停止' : '异常'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">
                          {instance.cpu}C / {instance.memory} / {instance.gpuType} ×{instance.gpuCount}
                        </td>
                        <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">
                          {instance.ingressEnabled ? instance.ingressHost : '未暴露'}
                        </td>
                        <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">
                          {instance.pvcEnabled ? `${instance.pvcSizeGi}Gi @ ${instance.pvcMountPath}` : '无'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">{instance.replicas}</span>
                            <Button size="sm" variant="outline" onClick={() => handleScale(instance.id, -1)}>-</Button>
                            <Button size="sm" variant="outline" onClick={() => handleScale(instance.id, 1)}>+</Button>
                            <span className="text-xs text-text-muted">[{instance.minReplicas}-{instance.maxReplicas}]</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {instance.status !== 'running' && <Button size="sm" variant="outline" onClick={() => handleLifecycle(instance.id, 'start')}>启动</Button>}
                            {instance.status === 'running' && <Button size="sm" variant="outline" onClick={() => handleLifecycle(instance.id, 'stop')}>停止</Button>}
                            <Button size="sm" variant="outline" onClick={() => handleLifecycle(instance.id, 'restart')}>重启</Button>
                            <Button size="sm" variant="ghost" className="text-error hover:text-error/80" onClick={() => handleLifecycle(instance.id, 'delete')}>删除</Button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">{instance.updatedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          {subscribed ? (
            <Button variant="outline" onClick={() => setSubscribed(false)} className="flex-1">取消订阅</Button>
          ) : (
            <Button onClick={() => { setSubscribed(true); toast.success('订阅成功', `已订阅 ${app.name}`); }} className="flex-1">
              订阅应用
            </Button>
          )}
          {app.demoUrl && (
            <Button variant="outline" leftIcon={<ExternalLink size={13} />} onClick={() => toast.info('跳转外部访问地址', '外部页面已打开')}>
              外部访问
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function AppStorePage() {
  const { toast } = useToast();
  const [cat, setCat] = useState('全部');
  const [industry, setIndustry] = useState('全行业');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('stars');
  const [apps, setApps] = useState<AppSpace[]>(() => mockApps.map(app => ({
    ...app,
    capabilities: app.capabilities ?? app.tags,
    runtimeLogs: app.runtimeLogs ?? [],
  })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<AppSpaceForm>(DEFAULT_APP_SPACE_FORM);

  const selected = selectedId ? apps.find(app => app.id === selectedId) ?? null : null;

  const updateApp = (id: string, updater: (current: AppSpace) => AppSpace) => {
    setApps(prev => prev.map(app => (app.id === id ? updater(app) : app)));
  };

  const openCreateAppSpace = () => {
    setCreateForm(DEFAULT_APP_SPACE_FORM);
    setCreateOpen(true);
  };

  const createAppSpace = async () => {
    if (!createForm.name.trim()) {
      toast.warning('缺少空间名称', '请填写应用空间名称');
      return;
    }
    if (!createForm.modelName.trim()) {
      toast.warning('缺少模型名称', '请填写要构建的模型名称');
      return;
    }
    if (!createForm.sourceRepo.trim()) {
      toast.warning('缺少 Git 源码', '请填写代码仓库地址');
      return;
    }

    setCreating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const createdAt = new Date().toLocaleString('zh-CN', { hour12: false });
    const capabilityItems = createForm.capabilities
      .split(/[，,\n]/)
      .map(item => item.trim())
      .filter(Boolean);

    const nextApp: AppSpace = {
      id: `app${Date.now()}`,
      name: createForm.name.trim(),
      description: createForm.description.trim() || '模型类应用空间，支持自动构建、在线部署与预览。',
      category: 'llm',
      status: 'deploying',
      featured: true,
      pinned: false,
      stars: 0,
      downloads: 0,
      rating: 0,
      reviews: 0,
      creator: '当前用户',
      organization: '智算开发平台',
      modelName: createForm.modelName.trim(),
      tags: capabilityItems.length ? capabilityItems : ['模型空间', '自动构建', '在线部署'],
      sourceRepo: createForm.sourceRepo.trim(),
      gitRepoUrl: createForm.sourceRepo.trim(),
      gitBranch: createForm.gitBranch.trim() || 'main',
      gitCommit: 'pending',
      buildStatus: 'building',
      buildProgress: 42,
      previewUrl: createForm.previewUrl.trim() || undefined,
      runtimeCluster: createForm.cluster,
      runtimeNamespace: createForm.namespace.trim() || `space-${Date.now().toString().slice(-6)}`,
      runtimeFlavor: `${createForm.gpuType} ×${Number(createForm.gpuCount) || 1} / ${createForm.cpu}C / ${createForm.memory}`,
      runtimeEnvironment: createForm.runtimeEnvironment,
      capabilities: capabilityItems.length ? capabilityItems : ['模型推理', 'Git 同步', '在线预览'],
      runtimeLogs: [
        { time: createdAt, level: 'info', message: '应用空间创建成功，正在触发自动构建' },
        { time: createdAt, level: 'info', message: `Git 仓库 ${createForm.sourceRepo.trim()} 已接入` },
        { time: createdAt, level: 'success', message: '运行环境已分配，等待预览和发布' },
      ],
      healthScore: 0,
      lastDeployedAt: createdAt,
      coverImage: '',
      createdAt,
      updatedAt: createdAt,
      hasDemoTrial: true,
      industry: industry === '全行业' ? ['全行业'] : [industry],
      accessLevel: 'tenant',
      subscribeCount: 0,
      demoUrl: createForm.previewUrl.trim() || undefined,
    };

    setApps(prev => [nextApp, ...prev]);
    setSelectedId(nextApp.id);
    setCreating(false);
    setCreateOpen(false);
    toast.success('应用空间已创建', '自动构建和在线部署已开始执行');

    setTimeout(() => {
      updateApp(nextApp.id, current => ({
        ...current,
        status: 'running',
        buildStatus: 'success',
        buildProgress: 100,
        healthScore: 93,
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        lastDeployedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        runtimeLogs: [
          { time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), level: 'success', message: '自动构建完成，应用空间已发布' },
          { time: '09:58:12', level: 'info', message: '在线预览地址已生成并完成健康检查' },
          { time: '09:57:43', level: 'info', message: '镜像已推送，发布任务进入运行态' },
        ],
      }));
    }, 1800);
  };

  const filtered = apps
    .filter(a => {
      const appCat = catMap[a.category] ?? a.category;
      if (cat !== '全部' && appCat !== cat) return false;
      if (industry !== '全行业' && !a.industry?.includes(industry)) return false;
      if (search && !a.name.includes(search) && !a.description.includes(search)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'stars') return b.stars - a.stars;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'downloads') return b.downloads - a.downloads;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const pinned = filtered.filter(a => a.pinned || a.featured);
  const hotRank = [...filtered]
    .sort((a, b) => (b.downloads + b.stars * 5 + b.rating * 100) - (a.downloads + a.stars * 5 + a.rating * 100))
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="应用管理"
        subtitle="应用空间构建与运维 · 支持 Git 管理、自动构建、在线部署、预览与生命周期管理"
        icon={<LayoutGrid size={20} />}
      />

      <Card className="border-primary/20 bg-primary/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">应用空间管理</p>
            <p className="text-xs text-text-muted mt-1">支持通过 Git 构建、在线部署、运行预览和生命周期管理，形成可独立运行的应用空间。</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" leftIcon={<LayoutGrid size={12} />} onClick={openCreateAppSpace}>构建应用空间</Button>
            <Button size="sm" variant="outline" leftIcon={<RefreshCw size={12} />} onClick={() => toast.success('运行态已刷新', '应用空间、日志与能力概览已更新')}>刷新状态</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
          {[
            { label: '运行中空间', value: apps.filter(app => app.status === 'running').length, color: 'text-success' },
            { label: '部署中空间', value: apps.filter(app => app.status === 'deploying').length, color: 'text-primary' },
            { label: '已停止空间', value: apps.filter(app => app.status === 'stopped').length, color: 'text-text-secondary' },
            { label: '平均健康分', value: `${Math.round(apps.reduce((sum, app) => sum + (app.healthScore ?? 0), 0) / Math.max(1, apps.filter(app => app.healthScore !== undefined).length || apps.length))}`, color: 'text-accent' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-border bg-base p-3">
              <p className="text-text-muted">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Featured / Pinned banner */}
      {pinned.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pinned.slice(0, 2).map(app => (
            <Card key={app.id} glow className="relative overflow-hidden cursor-pointer hover:border-primary/40 transition-all card-hover hover-lift animate-slide-up" onClick={() => setSelectedId(app.id)}>
              <div className="absolute top-3 right-3 flex gap-1">
                {app.featured && <Badge variant="primary"><Sparkles size={9} className="inline mr-0.5" />精选</Badge>}
                {app.pinned && <Badge variant="warning"><Pin size={9} className="inline mr-0.5" />置顶</Badge>}
                <Badge variant={app.status === 'running' ? 'success' : app.status === 'deploying' ? 'primary' : app.status === 'stopped' ? 'ghost' : 'error'}>
                  {app.status === 'running' ? '运行中' : app.status === 'deploying' ? '部署中' : app.status === 'stopped' ? '已停止' : '异常'}
                </Badge>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center shrink-0">
                  {categoryIcon[catMap[app.category] ?? app.category] ?? <Sparkles size={22} className="text-text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-text-primary mb-1 pr-16">{app.name}</h3>
                  <p className="text-xs text-text-muted mb-2 line-clamp-2">{app.description}</p>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><StarRow rating={app.rating} size={10} /><span className="ml-1 font-semibold text-text-secondary">{app.rating}</span></span>
                    <span className="flex items-center gap-1"><MessageSquare size={10} />{app.reviews}</span>
                    <span className="flex items-center gap-1"><Download size={10} />{app.downloads.toLocaleString()}</span>
                    {app.hasDemoTrial && <Badge variant="success"><Play size={8} className="inline mr-0.5" />在线交互</Badge>}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="构建应用空间" width="lg">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="空间名称" value={createForm.name} onChange={event => setCreateForm(prev => ({ ...prev, name: event.target.value }))} placeholder="例如：金融知识库空间" />
                <Input label="模型名称" value={createForm.modelName} onChange={event => setCreateForm(prev => ({ ...prev, modelName: event.target.value }))} placeholder="例如：Qwen2.5-72B-Instruct-ZY" />
                <Input label="Git 仓库" value={createForm.sourceRepo} onChange={event => setCreateForm(prev => ({ ...prev, sourceRepo: event.target.value }))} placeholder="git@code.zhiyun.ai:ai/space.git" />
                <Input label="Git 分支" value={createForm.gitBranch} onChange={event => setCreateForm(prev => ({ ...prev, gitBranch: event.target.value }))} />
                <Input label="预览地址（可选）" value={createForm.previewUrl} onChange={event => setCreateForm(prev => ({ ...prev, previewUrl: event.target.value }))} placeholder="https://preview.zhiyun.ai/space" />
                <Select
                  label="运行环境"
                  value={createForm.runtimeEnvironment}
                  onChange={event => setCreateForm(prev => ({ ...prev, runtimeEnvironment: event.target.value }))}
                  options={[
                    { value: 'production', label: 'production' },
                    { value: 'staging', label: 'staging' },
                    { value: 'testing', label: 'testing' },
                  ]}
                />
                <Select
                  label="目标集群"
                  value={createForm.cluster}
                  onChange={event => setCreateForm(prev => ({ ...prev, cluster: event.target.value }))}
                  options={[
                    { value: 'telecom-gpu-prod', label: 'telecom-gpu-prod' },
                    { value: 'telecom-dev', label: 'telecom-dev' },
                  ]}
                />
                <Input label="命名空间" value={createForm.namespace} onChange={event => setCreateForm(prev => ({ ...prev, namespace: event.target.value }))} placeholder="留空将自动生成" />
                <Input label="CPU 核数" value={createForm.cpu} onChange={event => setCreateForm(prev => ({ ...prev, cpu: event.target.value }))} />
                <Input label="内存" value={createForm.memory} onChange={event => setCreateForm(prev => ({ ...prev, memory: event.target.value }))} />
                <Select
                  label="GPU 型号"
                  value={createForm.gpuType}
                  onChange={event => setCreateForm(prev => ({ ...prev, gpuType: event.target.value }))}
                  options={[
                    { value: 'A100-80G', label: 'A100-80G' },
                    { value: 'H100-80G', label: 'H100-80G' },
                    { value: 'A10-24G', label: 'A10-24G' },
                  ]}
                />
                <Input label="GPU 数量" value={createForm.gpuCount} onChange={event => setCreateForm(prev => ({ ...prev, gpuCount: event.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">能力概览</label>
                <textarea
                  rows={3}
                  value={createForm.capabilities}
                  onChange={event => setCreateForm(prev => ({ ...prev, capabilities: event.target.value }))}
                  placeholder="例如：知识检索、在线预览、版本回滚"
                  className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 resize-none"
                />
                <p className="text-xs text-text-muted mt-1">支持用中文逗号或换行分隔多个能力标签。</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">空间说明</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={event => setCreateForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="描述该模型空间的业务定位、目标用户和部署策略"
                  className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button>
                <Button loading={creating} onClick={createAppSpace}>创建并自动构建</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {hotRank.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {hotRank.map((app, index) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelectedId(app.id)}
              className={`text-left rounded-xl border border-border bg-surface p-4 card-hover hover-lift animate-slide-up stagger-${index}`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">热榜 TOP {index + 1}</Badge>
                  <span className="text-sm font-semibold text-text-primary truncate">{app.name}</span>
                </div>
                <span className="text-xs text-text-muted">{app.downloads.toLocaleString()} 次</span>
              </div>
              <p className="text-xs text-text-muted line-clamp-2">{app.description}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-3">
                <span className="flex items-center gap-1"><StarRow rating={app.rating} size={9} /><span className="ml-1">{app.rating}</span></span>
                <span className="flex items-center gap-1"><MessageSquare size={10} />{app.reviews}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索应用..."
            className="bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors w-44" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${cat === c ? 'bg-primary text-white' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Filter size={13} className="text-text-muted" />
          <select value={industry} onChange={e => setIndustry(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary/60">
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary/60">
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* App grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(app => (
          <Card key={app.id} className="hover:border-primary/30 hover:bg-elevated transition-all cursor-pointer group card-hover hover-lift animate-slide-up" onClick={() => setSelectedId(app.id)}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/15 flex items-center justify-center shrink-0">
                {categoryIcon[catMap[app.category] ?? app.category] ?? <Sparkles size={16} className="text-text-muted" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">{app.name}</h3>
                  <span className="shrink-0">{accessIcon[app.accessLevel]}</span>
                </div>
                <p className="text-xs text-text-muted truncate">{app.creator}</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-3 line-clamp-2">{app.description}</p>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {app.featured && <Badge variant="primary" className="text-[10px]"><Sparkles size={8} className="inline mr-0.5" />精选</Badge>}
              {app.hasDemoTrial && <Badge variant="success" className="text-[10px]"><Play size={8} className="inline mr-0.5" />在线交互</Badge>}
              <Badge variant="ghost" className="text-[10px]">{catMap[app.category] ?? app.category}</Badge>
              <Badge variant={app.status === 'running' ? 'success' : app.status === 'deploying' ? 'primary' : app.status === 'stopped' ? 'ghost' : 'error'} className="text-[10px]">
                {app.status === 'running' ? '运行中' : app.status === 'deploying' ? '部署中' : app.status === 'stopped' ? '已停止' : '异常'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted border-t border-border/50 pt-2">
              <span className="flex items-center gap-1"><StarRow rating={app.rating} size={9} /><span className="font-semibold text-text-secondary ml-0.5">{app.rating}</span></span>
              <span className="flex items-center gap-1"><MessageSquare size={9} />{app.reviews}</span>
              <span className="flex items-center gap-1"><Download size={9} />{app.downloads.toLocaleString()}</span>
            </div>
          </Card>
        ))}
      </div>

      {selected && <AppDetailModal app={selected} onClose={() => setSelectedId(null)} onUpdateApp={updater => updateApp(selected.id, updater)} />}
    </div>
  );
}
