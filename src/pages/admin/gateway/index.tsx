import { useMemo, useState } from 'react';
import {
  Activity, ArrowRightLeft, BadgeCheck, Boxes, Calculator, CheckCircle2,
  CircleOff, CloudCog, DatabaseZap, Gauge, Globe2, Link2,
  Network, Plus, RefreshCw, Route, Scale, ShieldCheck, ShieldEllipsis,
  SlidersHorizontal, TestTube2, TimerReset, Zap,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { MetricCard } from '../../../components/charts/MetricCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input, Select } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Tabs } from '../../../components/ui/Tabs';
import { useToast } from '../../../hooks/useToast';
import {
  mockGatewayFailoverEvents,
  mockGatewayGovernance,
  mockGatewayIsolationPolicies,
  mockGatewayProviders,
  mockGatewayRoutes,
  mockGatewayScalingPolicies,
  mockGatewayTraffic,
  mockGatewayUsageRecords,
  mockGatewayPricingRules,
  type GatewayBalanceStrategy,
  type GatewayBillingMetric,
  type GatewayFailoverEvent,
  type GatewayGovernanceConfig,
  type GatewayIsolationPolicy,
  type GatewayProvider,
  type GatewayRoute,
  type GatewayScalingPolicy,
  type GatewayPricingRule,
  type GatewayUsageRecord,
} from '../../../data/mockGateway';

type TabKey = 'providers' | 'routes' | 'governance' | 'resilience' | 'billing' | 'pricing';

interface ProviderForm {
  name: string;
  vendor: string;
  baseUrl: string;
  protocol: string;
  apiKey: string;
  region: string;
  models: string;
}

interface RouteForm {
  name: string;
  model: string;
  providerId: string;
  priority: string;
  weight: string;
  maxQps: string;
  concurrency: string;
  fallbackRouteId: string;
}

interface IsolationForm {
  name: string;
  scope: GatewayIsolationPolicy['scope'];
  target: string;
  namespace: string;
  keyPrefix: string;
  allowedModels: string;
  qps: string;
  concurrency: string;
}

const INITIAL_PROVIDER_FORM: ProviderForm = {
  name: '', vendor: '自定义 OpenAI 兼容服务', baseUrl: '', protocol: 'OpenAI Compatible', apiKey: '', region: '绵阳数据中心', models: '',
};

const INITIAL_ROUTE_FORM: RouteForm = {
  name: '', model: '', providerId: 'gw-provider-01', priority: '1', weight: '100', maxQps: '100', concurrency: '30', fallbackRouteId: '',
};

const INITIAL_ISOLATION_FORM: IsolationForm = {
  name: '', scope: 'tenant', target: '', namespace: '', keyPrefix: '', allowedModels: '', qps: '30', concurrency: '10',
};

const balanceOptions: { value: GatewayBalanceStrategy; label: string; description: string }[] = [
  { value: 'weighted', label: '按权重', description: '同优先级目标按设置比例分流，适合灰度与成本优化。' },
  { value: 'round-robin', label: '轮询', description: '在健康目标间均匀轮询，适合性能相近的多通道。' },
  { value: 'least-latency', label: '最低延迟', description: '优先选择最近延迟最低的健康目标。' },
];

const providerStatusMeta = {
  healthy: { label: '健康', variant: 'success' as const },
  degraded: { label: '降级', variant: 'warning' as const },
  offline: { label: '离线', variant: 'error' as const },
};

const billingDimensionMeta: Record<GatewayBillingMetric, { label: string; unit: string; description: string }> = {
  tokens: { label: 'Token 用量', unit: 'Token', description: '输入与输出 Token 分开按模型价格核算。' },
  calls: { label: '调用次数', unit: '次', description: '按请求次数核算网关服务费。' },
  'gpu-hours': { label: '算力时长', unit: '卡时', description: '按 GPU 型号与实际卡时核算。' },
  'resource-hours': { label: '资源规格', unit: '规格时', description: '按网关或推理实例规格的占用时长核算。' },
};

function toInteger(value: string, fallback: number, min = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(min, parsed) : fallback;
}

function formatMoney(amount: number) {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMeter(value: number) {
  return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)}M` : value.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
}

function getUnitPrice(rules: GatewayPricingRule[], metric: GatewayPricingRule['metric'], scope: string) {
  return rules.find(rule => rule.enabled && rule.metric === metric && rule.scope === scope)?.unitPrice
    ?? rules.find(rule => rule.enabled && rule.metric === metric && rule.scope === '平台默认')?.unitPrice
    ?? 0;
}

function calculateUsageCost(record: GatewayUsageRecord, rules: GatewayPricingRule[]) {
  const tokenCost = (record.inputTokens / 1_000_000) * getUnitPrice(rules, 'input-tokens', record.model)
    + (record.outputTokens / 1_000_000) * getUnitPrice(rules, 'output-tokens', record.model);
  const callCost = record.calls * getUnitPrice(rules, 'calls', '平台默认');
  const computeCost = record.gpuHours * getUnitPrice(rules, 'gpu-hours', record.gpuSpec ?? '平台默认');
  const resourceCost = record.resourceHours * getUnitPrice(rules, 'resource-hours', record.resourceSpec);
  return { tokenCost, callCost, computeCost, resourceCost, total: tokenCost + callCost + computeCost + resourceCost };
}

function Toggle({ checked, onChange, label, detail }: { checked: boolean; onChange: () => void; label: string; detail?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className="flex w-full items-start gap-3 rounded-xl border border-border bg-base p-3 text-left hover:border-primary/30 transition-colors"
    >
      <span className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-primary justify-end' : 'bg-border justify-start'}`}>
        <span className="h-4 w-4 rounded-full bg-white shadow" />
      </span>
      <span>
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        {detail && <span className="mt-0.5 block text-xs leading-5 text-text-muted">{detail}</span>}
      </span>
    </button>
  );
}

function ProgressBar({ value, color = 'bg-primary' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function ModelGateway() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('providers');
  const [providers, setProviders] = useState<GatewayProvider[]>(mockGatewayProviders);
  const [routes, setRoutes] = useState<GatewayRoute[]>(mockGatewayRoutes);
  const [isolationPolicies, setIsolationPolicies] = useState<GatewayIsolationPolicy[]>(mockGatewayIsolationPolicies);
  const [scalingPolicies, setScalingPolicies] = useState<GatewayScalingPolicy[]>(mockGatewayScalingPolicies);
  const [failoverEvents, setFailoverEvents] = useState<GatewayFailoverEvent[]>(mockGatewayFailoverEvents);
  const [governance, setGovernance] = useState<GatewayGovernanceConfig>(mockGatewayGovernance);
  const [pricingRules, setPricingRules] = useState<GatewayPricingRule[]>(mockGatewayPricingRules);
  const [billingDimension, setBillingDimension] = useState<GatewayBillingMetric>('tokens');
  const [billingTenant, setBillingTenant] = useState('all');
  const [billingPeriod, setBillingPeriod] = useState('cycle');
  const [balanceStrategy, setBalanceStrategy] = useState<GatewayBalanceStrategy>('weighted');
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [isolationModalOpen, setIsolationModalOpen] = useState(false);
  const [providerForm, setProviderForm] = useState<ProviderForm>(INITIAL_PROVIDER_FORM);
  const [routeForm, setRouteForm] = useState<RouteForm>(INITIAL_ROUTE_FORM);
  const [isolationForm, setIsolationForm] = useState<IsolationForm>(INITIAL_ISOLATION_FORM);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);

  const providerById = useMemo(() => new Map(providers.map(provider => [provider.id, provider])), [providers]);
  const routeById = useMemo(() => new Map(routes.map(route => [route.id, route])), [routes]);
  const routeGroups = useMemo(() => {
    const groups = new Map<string, GatewayRoute[]>();
    routes.forEach(route => groups.set(route.model, [...(groups.get(route.model) ?? []), route]));
    return [...groups.entries()].map(([model, entries]) => ({ model, entries: entries.sort((a, b) => a.priority - b.priority) }));
  }, [routes]);
  const healthyProviders = providers.filter(provider => provider.enabled && provider.status === 'healthy');
  const currentQps = providers.filter(provider => provider.enabled).reduce((sum, provider) => sum + provider.qps, 0);
  const weightedSuccessRate = providers.reduce((sum, provider) => sum + provider.successRate * Math.max(1, provider.qps), 0)
    / Math.max(1, providers.reduce((sum, provider) => sum + Math.max(1, provider.qps), 0));
  const selectedStrategy = balanceOptions.find(option => option.value === balanceStrategy) ?? balanceOptions[0];
  const usageTenants = useMemo(() => [...new Set(mockGatewayUsageRecords.map(record => record.tenant))], []);
  const billingRows = useMemo(() => mockGatewayUsageRecords
    .filter(record => billingTenant === 'all' || record.tenant === billingTenant)
    .filter(record => billingPeriod !== 'today' || record.date === '2026-08-19')
    .map(record => ({ record, cost: calculateUsageCost(record, pricingRules) })), [billingPeriod, billingTenant, pricingRules]);
  const billingTotal = billingRows.reduce((sum, row) => sum + row.cost.total, 0);
  const billingTokenTotal = billingRows.reduce((sum, row) => sum + row.record.inputTokens + row.record.outputTokens, 0);
  const billingCallTotal = billingRows.reduce((sum, row) => sum + row.record.calls, 0);
  const billingGpuHours = billingRows.reduce((sum, row) => sum + row.record.gpuHours, 0);
  const billingResourceHours = billingRows.reduce((sum, row) => sum + row.record.resourceHours, 0);
  const billingCosts = {
    tokens: billingRows.reduce((sum, row) => sum + row.cost.tokenCost, 0),
    calls: billingRows.reduce((sum, row) => sum + row.cost.callCost, 0),
    'gpu-hours': billingRows.reduce((sum, row) => sum + row.cost.computeCost, 0),
    'resource-hours': billingRows.reduce((sum, row) => sum + row.cost.resourceCost, 0),
  };
  const selectedMeterTotal = billingDimension === 'tokens' ? billingTokenTotal
    : billingDimension === 'calls' ? billingCallTotal
      : billingDimension === 'gpu-hours' ? billingGpuHours : billingResourceHours;

  const updateRoute = (routeId: string, update: Partial<GatewayRoute>) => {
    setRoutes(previous => previous.map(route => route.id === routeId ? { ...route, ...update } : route));
  };

  const saveRoutePolicy = (model: string) => {
    const groupedRoutes = routes.filter(route => route.model === model && route.enabled);
    const totalWeight = groupedRoutes.reduce((sum, route) => sum + route.weight, 0);
    if (balanceStrategy === 'weighted' && totalWeight !== 100) {
      toast.warning('权重未归一', `${model} 的启用路由权重合计为 ${totalWeight}，建议调整为 100。`);
      return;
    }
    toast.success('路由策略已保存', `${model} 将按“${selectedStrategy.label}”策略调度。`);
  };

  const testProvider = (providerId: string) => {
    setTestingProviderId(providerId);
    window.setTimeout(() => {
      setProviders(previous => previous.map(provider => provider.id === providerId
        ? { ...provider, status: 'healthy', latencyMs: Math.max(160, provider.latencyMs - 22), successRate: Math.max(provider.successRate, 99.9), lastCheckedAt: '刚刚' }
        : provider));
      setTestingProviderId(null);
      toast.success('连通性检查通过', '已完成鉴权、模型列表和健康端点探测。');
    }, 700);
  };

  const createProvider = () => {
    if (!providerForm.name.trim() || !providerForm.baseUrl.trim() || !providerForm.models.trim()) {
      toast.warning('请补全注册信息', '供应商名称、Base URL 和可用模型为必填项。');
      return;
    }
    const keySuffix = providerForm.apiKey.trim() ? providerForm.apiKey.trim().slice(-4) : 'mTLS';
    const provider: GatewayProvider = {
      id: `gw-provider-${Date.now()}`,
      name: providerForm.name.trim(),
      vendor: providerForm.vendor.trim(),
      baseUrl: providerForm.baseUrl.trim(),
      protocol: providerForm.protocol,
      apiKeyHint: providerForm.apiKey.trim() ? `已托管 ••••${keySuffix}` : 'mTLS / 工作负载身份',
      status: 'healthy',
      enabled: true,
      region: providerForm.region.trim() || '未指定',
      models: providerForm.models.split(',').map(model => model.trim()).filter(Boolean),
      latencyMs: 360,
      successRate: 100,
      qps: 0,
      lastCheckedAt: '已注册，待首次探测',
    };
    setProviders(previous => [provider, ...previous]);
    setProviderModalOpen(false);
    setProviderForm(INITIAL_PROVIDER_FORM);
    toast.success('第三方模型 API 已注册', '密钥仅用于本次表单配置，列表中已脱敏。');
  };

  const createRoute = () => {
    if (!routeForm.name.trim() || !routeForm.model.trim() || !routeForm.providerId) {
      toast.warning('请补全路由信息', '路由名称、模型别名和目标供应商为必填项。');
      return;
    }
    const route: GatewayRoute = {
      id: `gw-route-${Date.now()}`,
      name: routeForm.name.trim(),
      model: routeForm.model.trim(),
      providerId: routeForm.providerId,
      priority: toInteger(routeForm.priority, 1, 1),
      weight: toInteger(routeForm.weight, 100),
      maxQps: toInteger(routeForm.maxQps, 100, 1),
      concurrency: toInteger(routeForm.concurrency, 30, 1),
      fallbackRouteId: routeForm.fallbackRouteId || undefined,
      enabled: true,
    };
    setRoutes(previous => [...previous, route]);
    setRouteModalOpen(false);
    setRouteForm(INITIAL_ROUTE_FORM);
    toast.success('模型路由已创建', '请确认同一模型的启用路由权重合计为 100。');
  };

  const createIsolationPolicy = () => {
    if (!isolationForm.name.trim() || !isolationForm.target.trim() || !isolationForm.namespace.trim()) {
      toast.warning('请补全隔离策略', '策略名称、隔离对象和命名空间为必填项。');
      return;
    }
    setIsolationPolicies(previous => [{
      id: `gw-isolation-${Date.now()}`,
      name: isolationForm.name.trim(),
      scope: isolationForm.scope,
      target: isolationForm.target.trim(),
      namespace: isolationForm.namespace.trim(),
      keyPrefix: isolationForm.keyPrefix.trim() || 'isolated_',
      allowedModels: isolationForm.allowedModels.split(',').map(model => model.trim()).filter(Boolean),
      qps: toInteger(isolationForm.qps, 30, 1),
      concurrency: toInteger(isolationForm.concurrency, 10, 1),
      enabled: true,
    }, ...previous]);
    setIsolationModalOpen(false);
    setIsolationForm(INITIAL_ISOLATION_FORM);
    toast.success('隔离策略已创建', '新策略将在下一次网关配置同步时生效。');
  };

  const simulateFailover = (route: GatewayRoute) => {
    const source = providerById.get(route.providerId)?.name ?? '未知上游';
    const fallback = route.fallbackRouteId ? routeById.get(route.fallbackRouteId) : undefined;
    const target = fallback ? providerById.get(fallback.providerId)?.name ?? fallback.name : '本地降级响应';
    setFailoverEvents(previous => [{
      id: `gw-failover-${Date.now()}`,
      time: '刚刚',
      routeName: route.name,
      source,
      target,
      reason: fallback ? '管理员发起演练，验证备用路由切换链路' : '管理员发起演练，验证默认降级响应',
      result: 'success',
    }, ...previous]);
    toast.success('故障切换演练完成', `${source} 已按策略切换至 ${target}。`);
  };

  const runScaling = (policyId: string) => {
    let action = '扩容';
    setScalingPolicies(previous => previous.map(policy => {
      if (policy.id !== policyId) return policy;
      const shouldScaleOut = policy.currentReplicas < policy.maxReplicas;
      action = shouldScaleOut ? '扩容' : '缩容回最小副本';
      return { ...policy, currentReplicas: shouldScaleOut ? policy.currentReplicas + 1 : policy.minReplicas };
    }));
    toast.success(`弹性${action}已执行`, '这是模拟演练；真实环境应由 HPA/KEDA 接收指标后执行。');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="模型网关"
        subtitle="统一接入第三方模型 API，并提供流量调度、隔离治理、故障切换与弹性控制"
        icon={<Network size={20} />}
        actions={<Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setProviderModalOpen(true)}>注册模型 API</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="已注册供应商" value={providers.length} icon={<Globe2 size={18} />} color="primary" subtitle={`${healthyProviders.length} 个健康可用`} />
        <MetricCard title="网关实时流量" value={currentQps} unit="QPS" icon={<Activity size={18} />} color="accent" subtitle="近 1 分钟聚合" />
        <MetricCard title="调用成功率" value={`${weightedSuccessRate.toFixed(2)}%`} icon={<BadgeCheck size={18} />} color="success" subtitle="按实时流量加权" />
        <MetricCard title="熔断观察" value={providers.filter(provider => provider.status === 'degraded').length} icon={<TimerReset size={18} />} color="warning" subtitle="通道处于降级观察" />
        <MetricCard title="弹性副本" value={scalingPolicies.reduce((sum, policy) => sum + policy.currentReplicas, 0)} icon={<Scale size={18} />} color="secondary" subtitle="生产网关工作负载" />
      </div>

      <Card className="border-primary/25 bg-primary/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-primary/20 bg-primary/15 p-2 text-primary"><ArrowRightLeft size={18} /></div>
            <div>
              <p className="text-sm font-semibold text-text-primary">全局负载均衡策略：{selectedStrategy.label}</p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-text-muted">{selectedStrategy.description} 仅会在健康、已启用且通过隔离策略校验的目标之间调度。</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={balanceStrategy} onChange={event => setBalanceStrategy(event.target.value as GatewayBalanceStrategy)} options={balanceOptions.map(option => ({ value: option.value, label: option.label }))} className="min-w-28" />
            <Button size="sm" variant="outline" leftIcon={<RefreshCw size={13} />} onClick={() => toast.success('网关配置已下发', '路由、治理与弹性策略已同步至模拟控制面。')}>下发配置</Button>
          </div>
        </div>
      </Card>

      <Tabs
        active={activeTab}
        onChange={key => setActiveTab(key as TabKey)}
        tabs={[
          { key: 'providers', label: '供应商与 API', icon: <Link2 size={15} />, count: providers.length },
          { key: 'routes', label: '模型路由与负载', icon: <Route size={15} />, count: routes.length },
          { key: 'governance', label: '隔离与服务治理', icon: <ShieldCheck size={15} />, count: isolationPolicies.length },
          { key: 'resilience', label: '故障切换与弹性', icon: <CloudCog size={15} />, count: scalingPolicies.length },
          { key: 'billing', label: '计量与成本', icon: <Calculator size={15} />, count: mockGatewayUsageRecords.length },
          { key: 'pricing', label: '价格规则', icon: <SlidersHorizontal size={15} />, count: pricingRules.length },
        ]}
      />

      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">第三方模型 API</p>
              <p className="mt-1 text-xs text-text-muted">支持 OpenAI Compatible、供应商原生 API 或基于 mTLS 的内网服务接入。</p>
            </div>
            <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setProviderModalOpen(true)}>注册供应商</Button>
          </div>
          <Card noPadding className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-xs">
              <thead><tr className="border-b border-border text-left text-text-muted">
                {['供应商通道', 'Base URL / 鉴权', '可用模型', '健康状态', '实时观测', '操作'].map(header => <th key={header} className="px-4 py-3 font-medium">{header}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border/40 text-text-secondary">
                {providers.map(provider => {
                  const status = providerStatusMeta[provider.status];
                  return (
                    <tr key={provider.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">{provider.name}</p>
                        <p className="mt-1 text-[11px] text-text-muted">{provider.vendor} · {provider.region}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-56 truncate font-mono text-[11px]" title={provider.baseUrl}>{provider.baseUrl}</p>
                        <p className="mt-1 text-[11px] text-text-muted">{provider.protocol} · {provider.apiKeyHint}</p>
                      </td>
                      <td className="px-4 py-3"><div className="flex max-w-56 flex-wrap gap-1">{provider.models.slice(0, 3).map(model => <Badge key={model} variant="ghost">{model}</Badge>)}{provider.models.length > 3 && <Badge variant="ghost">+{provider.models.length - 3}</Badge>}</div></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Badge variant={status.variant}>{status.label}</Badge><span className={provider.enabled ? 'text-success' : 'text-text-muted'}>{provider.enabled ? '已启用' : '已停用'}</span></div></td>
                      <td className="px-4 py-3"><p>{provider.latencyMs} ms · {provider.successRate.toFixed(2)}%</p><p className="mt-1 text-[11px] text-text-muted">{provider.qps} QPS · {provider.lastCheckedAt}</p></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Button size="sm" variant="ghost" loading={testingProviderId === provider.id} leftIcon={<TestTube2 size={12} />} onClick={() => testProvider(provider.id)}>探测</Button><Button size="sm" variant="ghost" leftIcon={provider.enabled ? <CircleOff size={12} /> : <CheckCircle2 size={12} />} onClick={() => { setProviders(previous => previous.map(item => item.id === provider.id ? { ...item, enabled: !item.enabled } : item)); toast.info(provider.enabled ? '通道已停用' : '通道已启用', provider.name); }}>{provider.enabled ? '停用' : '启用'}</Button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-semibold text-text-primary">模型别名路由</p><p className="mt-1 text-xs text-text-muted">优先级越小越优先；相同优先级下按全局负载均衡策略选择目标。</p></div>
            <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setRouteModalOpen(true)}>新增模型路由</Button>
          </div>
          {routeGroups.map(group => {
            const totalWeight = group.entries.filter(route => route.enabled).reduce((sum, route) => sum + route.weight, 0);
            return (
              <Card key={group.model} noPadding>
                <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div><p className="font-mono text-sm font-semibold text-text-primary">{group.model}</p><p className="mt-1 text-xs text-text-muted">启用路由权重：<span className={balanceStrategy === 'weighted' && totalWeight !== 100 ? 'text-warning' : 'text-success'}>{totalWeight}%</span></p></div>
                  <Button size="sm" variant="outline" leftIcon={<SlidersHorizontal size={12} />} onClick={() => saveRoutePolicy(group.model)}>保存本模型策略</Button>
                </div>
                <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-xs"><thead><tr className="border-b border-border/60 text-left text-text-muted">{['路由目标', '优先级', '权重', '流量上限', '并发上限', '失败切换', '状态', '操作'].map(header => <th key={header} className="px-4 py-2.5 font-medium">{header}</th>)}</tr></thead><tbody className="divide-y divide-border/30">
                  {group.entries.map(route => {
                    const provider = providerById.get(route.providerId);
                    const fallback = route.fallbackRouteId ? routeById.get(route.fallbackRouteId) : undefined;
                    return <tr key={route.id} className="hover:bg-white/[0.02]"><td className="px-4 py-3"><p className="font-medium text-text-primary">{route.name}</p><p className="mt-1 text-text-muted">{provider?.name ?? '已移除的供应商'}</p></td><td className="px-4 py-3"><select aria-label={`${route.name}优先级`} value={route.priority} onChange={event => updateRoute(route.id, { priority: toInteger(event.target.value, route.priority, 1) })} className="rounded-md border border-border bg-base px-2 py-1.5 text-text-primary focus:border-primary/60 focus:outline-none">{[1, 2, 3, 4, 5].map(priority => <option key={priority} value={priority}>P{priority}</option>)}</select></td><td className="px-4 py-3"><input aria-label={`${route.name}权重`} type="number" min="0" max="100" value={route.weight} onChange={event => updateRoute(route.id, { weight: toInteger(event.target.value, route.weight) })} className="w-16 rounded-md border border-border bg-base px-2 py-1.5 text-text-primary focus:border-primary/60 focus:outline-none" /><span className="ml-1 text-text-muted">%</span></td><td className="px-4 py-3"><input aria-label={`${route.name}QPS上限`} type="number" min="1" value={route.maxQps} onChange={event => updateRoute(route.id, { maxQps: toInteger(event.target.value, route.maxQps, 1) })} className="w-20 rounded-md border border-border bg-base px-2 py-1.5 text-text-primary focus:border-primary/60 focus:outline-none" /><span className="ml-1 text-text-muted">QPS</span></td><td className="px-4 py-3"><input aria-label={`${route.name}并发上限`} type="number" min="1" value={route.concurrency} onChange={event => updateRoute(route.id, { concurrency: toInteger(event.target.value, route.concurrency, 1) })} className="w-16 rounded-md border border-border bg-base px-2 py-1.5 text-text-primary focus:border-primary/60 focus:outline-none" /></td><td className="px-4 py-3 text-text-muted">{fallback ? <span className="inline-flex items-center gap-1"><ArrowRightLeft size={12} className="text-primary" />{fallback.name}</span> : '默认降级响应'}</td><td className="px-4 py-3"><button type="button" onClick={() => updateRoute(route.id, { enabled: !route.enabled })}><Badge variant={route.enabled ? 'success' : 'ghost'}>{route.enabled ? '启用' : '停用'}</Badge></button></td><td className="px-4 py-3"><Button size="sm" variant="ghost" leftIcon={<Zap size={12} />} onClick={() => simulateFailover(route)}>演练切换</Button></td></tr>;
                  })}
                </tbody></table></div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'governance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card><div className="mb-4 flex items-center gap-2"><ShieldEllipsis size={17} className="text-primary" /><div><p className="text-sm font-semibold text-text-primary">入口防护与可观测性</p><p className="mt-1 text-xs text-text-muted">所有策略在供应商调用前生效，并写入治理审计记录。</p></div></div><div className="grid grid-cols-1 gap-2"><Toggle checked={governance.signatureVerification} onChange={() => setGovernance(previous => ({ ...previous, signatureVerification: !previous.signatureVerification }))} label="签名与身份校验" detail="验证 API Key、请求签名和调用方归属。" /><Toggle checked={governance.requestValidation} onChange={() => setGovernance(previous => ({ ...previous, requestValidation: !previous.requestValidation }))} label="请求契约校验" detail="在转发前校验模型、参数上限和内容类型。" /><Toggle checked={governance.auditLog} onChange={() => setGovernance(previous => ({ ...previous, auditLog: !previous.auditLog }))} label="调用审计" detail="记录路由选择、供应商响应和治理决策。" /><Toggle checked={governance.semanticCache} onChange={() => setGovernance(previous => ({ ...previous, semanticCache: !previous.semanticCache }))} label="语义缓存" detail="仅缓存允许缓存的请求，命中后不再向上游转发。" /></div></Card>
            <Card><div className="mb-4 flex items-center gap-2"><Gauge size={17} className="text-accent" /><div><p className="text-sm font-semibold text-text-primary">服务治理阈值</p><p className="mt-1 text-xs text-text-muted">重试、超时与熔断共同保护网关及其上游依赖。</p></div></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="失败重试次数" type="number" min="0" value={governance.retryCount} onChange={event => setGovernance(previous => ({ ...previous, retryCount: toInteger(event.target.value, previous.retryCount) }))} hint="仅幂等或允许重试的请求" /><Input label="上游超时（秒）" type="number" min="1" value={governance.timeoutSeconds} onChange={event => setGovernance(previous => ({ ...previous, timeoutSeconds: toInteger(event.target.value, previous.timeoutSeconds, 1) }))} /><Input label="熔断失败率（%）" type="number" min="1" max="100" value={governance.breakerFailureRate} onChange={event => setGovernance(previous => ({ ...previous, breakerFailureRate: toInteger(event.target.value, previous.breakerFailureRate, 1) }))} /><Input label="统计窗口（秒）" type="number" min="10" value={governance.breakerWindowSeconds} onChange={event => setGovernance(previous => ({ ...previous, breakerWindowSeconds: toInteger(event.target.value, previous.breakerWindowSeconds, 10) }))} /></div><div className="mt-4 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs leading-5 text-text-muted"><span className="font-medium text-warning">熔断策略：</span>在 {governance.breakerWindowSeconds} 秒窗口内失败率超过 {governance.breakerFailureRate}% 时，路由进入半开观察并优先使用备用目标。</div><div className="mt-4 flex justify-end"><Button size="sm" variant="outline" onClick={() => toast.success('服务治理策略已保存', '新的阈值将在下一次配置下发后生效。')}>保存治理策略</Button></div></Card>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-text-primary">网关隔离策略</p><p className="mt-1 text-xs text-text-muted">按租户、命名空间或 API Key 前缀控制可用模型、QPS 和并发。</p></div><Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setIsolationModalOpen(true)}>新增隔离策略</Button></div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{isolationPolicies.map(policy => <Card key={policy.id} className={!policy.enabled ? 'opacity-70' : ''}><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-text-primary">{policy.name}</p><p className="mt-1 font-mono text-xs text-text-muted">{policy.namespace}</p></div><button type="button" onClick={() => setIsolationPolicies(previous => previous.map(item => item.id === policy.id ? { ...item, enabled: !item.enabled } : item))}><Badge variant={policy.enabled ? 'success' : 'ghost'}>{policy.enabled ? '生效中' : '已停用'}</Badge></button></div><div className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><span className="text-text-muted">隔离范围</span><span>{policy.scope} · {policy.target}</span></div><div className="flex justify-between"><span className="text-text-muted">调用额度</span><span>{policy.qps} QPS / {policy.concurrency} 并发</span></div><div><p className="text-text-muted">允许模型</p><div className="mt-1.5 flex flex-wrap gap-1">{policy.allowedModels.map(model => <Badge key={model} variant="ghost">{model}</Badge>)}</div></div></div></Card>)}</div>
        </div>
      )}

      {activeTab === 'resilience' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <Card className="xl:col-span-3"><div className="mb-4 flex items-center gap-2"><TimerReset size={17} className="text-warning" /><div><p className="text-sm font-semibold text-text-primary">失败切换与熔断记录</p><p className="mt-1 text-xs text-text-muted">切换仅发生在健康检查失败、熔断触发或延迟保护条件满足后。</p></div></div><div className="space-y-3">{failoverEvents.slice(0, 5).map(event => <div key={event.id} className="rounded-xl border border-border bg-base p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge variant={event.result === 'success' ? 'success' : 'warning'}>{event.result === 'success' ? '已切换' : '观察中'}</Badge><span className="text-xs font-medium text-text-primary">{event.routeName}</span></div><span className="text-xs text-text-muted">{event.time}</span></div><div className="mt-2 flex items-center gap-2 text-xs"><span>{event.source}</span><ArrowRightLeft size={12} className="text-primary" /><span className="font-medium text-text-primary">{event.target}</span></div><p className="mt-2 text-xs text-text-muted">{event.reason}</p></div>)}</div></Card>
            <Card className="xl:col-span-2"><div className="mb-4 flex items-center gap-2"><Activity size={17} className="text-accent" /><div><p className="text-sm font-semibold text-text-primary">近 3 小时网关流量</p><p className="mt-1 text-xs text-text-muted">峰值 {Math.max(...mockGatewayTraffic.map(item => item.qps))} QPS · 错误率受熔断保护</p></div></div><div className="flex h-40 items-end gap-2">{mockGatewayTraffic.map(item => <div key={item.time} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-text-muted">{item.qps}</span><div className="w-full rounded-t bg-gradient-to-t from-primary/60 to-accent" style={{ height: `${(item.qps / 300) * 100}%` }} title={`${item.time}: ${item.qps} QPS`} /><span className="text-[10px] text-text-muted">{item.time.slice(0, 2)}时</span></div>)}</div></Card>
          </div>
          <div><p className="text-sm font-semibold text-text-primary">弹性扩缩容策略</p><p className="mt-1 text-xs text-text-muted">网关数据面建议接入 HPA/KEDA，由 QPS、CPU 或 P99 延迟驱动副本调整。</p></div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{scalingPolicies.map(policy => { const usage = (policy.currentReplicas / policy.maxReplicas) * 100; return <Card key={policy.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Boxes size={16} className="text-secondary" /><p className="text-sm font-semibold text-text-primary">{policy.name}</p></div><p className="mt-1 font-mono text-xs text-text-muted">{policy.target}</p></div><button type="button" onClick={() => setScalingPolicies(previous => previous.map(item => item.id === policy.id ? { ...item, enabled: !item.enabled } : item))}><Badge variant={policy.enabled ? 'success' : 'ghost'}>{policy.enabled ? '自动扩缩容' : '已暂停'}</Badge></button></div><div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-lg bg-base p-2"><p className="text-xs text-text-muted">当前副本</p><p className="mt-1 text-lg font-bold text-text-primary">{policy.currentReplicas}</p></div><div className="rounded-lg bg-base p-2"><p className="text-xs text-text-muted">副本范围</p><p className="mt-1 text-lg font-bold text-text-primary">{policy.minReplicas}–{policy.maxReplicas}</p></div><div className="rounded-lg bg-base p-2"><p className="text-xs text-text-muted">目标阈值</p><p className="mt-1 text-lg font-bold text-text-primary">{policy.threshold}{policy.metric === 'qps' ? ' QPS' : policy.metric === 'cpu' ? '%' : ' ms'}</p></div></div><div className="mt-4"><div className="mb-1.5 flex justify-between text-xs"><span className="text-text-muted">副本容量</span><span className="text-text-secondary">{policy.currentReplicas} / {policy.maxReplicas}</span></div><ProgressBar value={usage} color={usage >= 85 ? 'bg-warning' : 'bg-secondary'} /></div><div className="mt-4 flex items-center justify-between"><span className="text-xs text-text-muted">冷却时间 {policy.cooldownSeconds}s · {policy.metric === 'qps' ? 'QPS' : policy.metric === 'cpu' ? 'CPU 使用率' : 'P99 延迟'} 指标</span><Button size="sm" variant="outline" disabled={!policy.enabled} leftIcon={<Scale size={12} />} onClick={() => runScaling(policy.id)}>演练扩缩容</Button></div></Card>; })}</div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-5">
          <Card className="border-primary/25 bg-primary/[0.04]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-primary/20 bg-primary/15 p-2 text-primary"><Calculator size={18} /></div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">网关统一计量与成本核算</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-text-muted">每一笔用量同时保留 Token、调用次数、GPU 卡时和资源规格时。成本由当前启用的价格规则计算，适用于租户对账、成本归集与资源优化分析。</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Select value={billingPeriod} onChange={event => setBillingPeriod(event.target.value)} options={[{ value: 'cycle', label: '当前计费周期（8月）' }, { value: 'today', label: '今日' }, { value: 'seven-days', label: '近 7 天' }]} />
                <Select value={billingTenant} onChange={event => setBillingTenant(event.target.value)} options={[{ value: 'all', label: '全部租户' }, ...usageTenants.map(tenant => ({ value: tenant, label: tenant }))]} />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="核算成本" value={formatMoney(billingTotal)} icon={<Calculator size={18} />} color="primary" subtitle={`${billingRows.length} 条用量明细`} />
            <MetricCard title="Token 总量" value={formatMeter(billingTokenTotal)} icon={<DatabaseZap size={18} />} color="accent" subtitle="输入与输出合计" />
            <MetricCard title="调用次数" value={formatMeter(billingCallTotal)} icon={<Activity size={18} />} color="success" subtitle="网关已计费请求" />
            <MetricCard title="GPU 算力时长" value={billingGpuHours.toFixed(1)} unit="卡时" icon={<Boxes size={18} />} color="secondary" subtitle="按 GPU 型号计价" />
            <MetricCard title="资源规格时长" value={billingResourceHours.toFixed(1)} unit="规格时" icon={<Gauge size={18} />} color="warning" subtitle="代理与推理实例" />
          </div>

          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">计量维度视图</p>
                <p className="mt-1 text-xs text-text-muted">{billingDimensionMeta[billingDimension].description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(billingDimensionMeta) as GatewayBillingMetric[]).map(metric => (
                  <button
                    type="button"
                    key={metric}
                    onClick={() => setBillingDimension(metric)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${billingDimension === metric ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-text-muted hover:border-primary/30 hover:text-text-secondary'}`}
                  >
                    {billingDimensionMeta[metric].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="rounded-xl border border-border bg-base p-4 lg:col-span-2">
                <p className="text-xs text-text-muted">本周期 {billingDimensionMeta[billingDimension].label}</p>
                <p className="mt-2 text-3xl font-bold text-text-primary">{formatMeter(selectedMeterTotal)} <span className="text-sm font-medium text-text-muted">{billingDimensionMeta[billingDimension].unit}</span></p>
                <p className="mt-2 text-xs text-text-muted">对应核算金额 <span className="font-medium text-primary">{formatMoney(billingCosts[billingDimension])}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:col-span-3 sm:grid-cols-4">
                {(Object.keys(billingCosts) as GatewayBillingMetric[]).map(metric => {
                  const cost = billingCosts[metric];
                  const share = billingTotal > 0 ? (cost / billingTotal) * 100 : 0;
                  return <div key={metric} className={`rounded-xl border p-3 ${metric === billingDimension ? 'border-primary/30 bg-primary/5' : 'border-border bg-base'}`}>
                    <p className="text-xs text-text-muted">{billingDimensionMeta[metric].label.replace('用量', '').replace('次数', '')}</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{formatMoney(cost)}</p>
                    <div className="mt-2"><ProgressBar value={share} color={metric === billingDimension ? 'bg-primary' : 'bg-accent'} /></div>
                    <p className="mt-1 text-[11px] text-text-muted">{share.toFixed(1)}%</p>
                  </div>;
                })}
              </div>
            </div>
          </Card>

          <Card noPadding className="overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div><p className="text-sm font-semibold text-text-primary">计量账单明细</p><p className="mt-1 text-xs text-text-muted">以模型、租户和实际资源用量为成本归集维度。</p></div>
                <Badge variant="primary">{billingRows.length} 条</Badge>
              </div>
              <table className="w-full min-w-[1060px] text-xs">
                <thead><tr className="border-b border-border/60 text-left text-text-muted">{['日期 / 租户', '模型 / 上游', 'Token', '调用', '算力时长', '资源规格', '成本核算'].map(header => <th key={header} className="px-4 py-2.5 font-medium">{header}</th>)}</tr></thead>
                <tbody className="divide-y divide-border/30 text-text-secondary">
                  {billingRows.map(({ record, cost }) => (
                    <tr key={record.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3"><p className="font-medium text-text-primary">{record.tenant}</p><p className="mt-1 text-text-muted">{record.date} · {record.namespace}</p></td>
                      <td className="px-4 py-3"><p className="font-mono text-text-primary">{record.model}</p><p className="mt-1 text-text-muted">{record.provider}</p></td>
                      <td className="px-4 py-3"><p>{formatMeter(record.inputTokens + record.outputTokens)}</p><p className="mt-1 text-text-muted">入 {formatMeter(record.inputTokens)} / 出 {formatMeter(record.outputTokens)}</p></td>
                      <td className="px-4 py-3">{record.calls.toLocaleString()}</td>
                      <td className="px-4 py-3"><p>{record.gpuHours.toFixed(1)} 卡时</p><p className="mt-1 text-text-muted">{record.gpuSpec ?? '—'}</p></td>
                      <td className="px-4 py-3"><p>{record.resourceSpec}</p><p className="mt-1 text-text-muted">{record.resourceHours.toFixed(1)} 规格时</p></td>
                      <td className="px-4 py-3"><p className="font-semibold text-text-primary">{formatMoney(cost.total)}</p><p className="mt-1 text-text-muted">Token {formatMoney(cost.tokenCost)} · 调用 {formatMoney(cost.callCost)}</p><p className="mt-1 text-text-muted">算力 {formatMoney(cost.computeCost)} · 资源 {formatMoney(cost.resourceCost)}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </Card>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-5">
          <Card className="border-secondary/25 bg-secondary/[0.04]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-secondary/20 bg-secondary/15 p-2 text-secondary"><SlidersHorizontal size={18} /></div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">价格规则管理</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-text-muted">定义各模型的输入/输出 Token 单价、网关调用服务费、GPU 卡时和资源规格时价格。规则变更会即时作用于“计量与成本”的模拟核算。</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.success('计费规则已保存', '新价格已用于当前账单模拟核算。')}>保存规则</Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(['input-tokens', 'calls', 'gpu-hours', 'resource-hours'] as GatewayPricingRule['metric'][]).map(metric => {
              const ruleCount = pricingRules.filter(rule => rule.metric === metric && rule.enabled).length;
              const label = metric === 'input-tokens' ? 'Token 单价规则' : metric === 'calls' ? '调用计费规则' : metric === 'gpu-hours' ? '算力卡时规则' : '资源规格规则';
              return <div key={metric} className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-text-muted">{label}</p><p className="mt-2 text-2xl font-bold text-text-primary">{ruleCount}</p><p className="mt-1 text-xs text-text-muted">条启用规则</p></div>;
            })}
          </div>

          <Card noPadding className="overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div><p className="text-sm font-semibold text-text-primary">计费单价表</p><p className="mt-1 text-xs text-text-muted">优先匹配模型或规格专属规则，未匹配时使用“平台默认”规则。</p></div>
              <Badge variant="secondary">{pricingRules.filter(rule => rule.enabled).length} 条生效</Badge>
            </div>
            <table className="w-full min-w-[760px] text-xs">
              <thead><tr className="border-b border-border/60 text-left text-text-muted">{['计费项', '计量维度', '适用范围', '单价', '状态'].map(header => <th key={header} className="px-4 py-2.5 font-medium">{header}</th>)}</tr></thead>
              <tbody className="divide-y divide-border/30 text-text-secondary">
                {pricingRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3"><p className="font-medium text-text-primary">{rule.name}</p><p className="mt-1 text-text-muted">{rule.unit}</p></td>
                    <td className="px-4 py-3"><Badge variant="ghost">{rule.metric === 'input-tokens' ? '输入 Token' : rule.metric === 'output-tokens' ? '输出 Token' : billingDimensionMeta[rule.metric].label}</Badge></td>
                    <td className="px-4 py-3">{rule.scope}</td>
                    <td className="px-4 py-3"><input aria-label={`${rule.name}单价`} type="number" min="0" step="0.0001" value={rule.unitPrice} onChange={event => setPricingRules(previous => previous.map(item => item.id === rule.id ? { ...item, unitPrice: Math.max(0, Number(event.target.value) || 0) } : item))} className="w-28 rounded-md border border-border bg-base px-2 py-1.5 text-text-primary focus:border-primary/60 focus:outline-none" /></td>
                    <td className="px-4 py-3"><button type="button" onClick={() => setPricingRules(previous => previous.map(item => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}><Badge variant={rule.enabled ? 'success' : 'ghost'}>{rule.enabled ? '启用' : '停用'}</Badge></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <Modal open={providerModalOpen} onClose={() => { setProviderModalOpen(false); setProviderForm(INITIAL_PROVIDER_FORM); }} title="注册第三方模型 API" width="lg"><div className="space-y-4"><div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-text-muted"><span className="font-medium text-primary">安全说明：</span>真实 API Key 只应通过后端密钥托管服务保存；本静态演示仅生成脱敏标识，不会在供应商列表回显原始密钥。</div><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Input label="供应商通道名称 *" placeholder="例如：Azure OpenAI-生产" value={providerForm.name} onChange={event => setProviderForm(previous => ({ ...previous, name: event.target.value }))} /><Input label="供应商名称" value={providerForm.vendor} onChange={event => setProviderForm(previous => ({ ...previous, vendor: event.target.value }))} /><Input label="Base URL *" placeholder="https://api.example.com/v1" value={providerForm.baseUrl} onChange={event => setProviderForm(previous => ({ ...previous, baseUrl: event.target.value }))} /><Select label="协议" value={providerForm.protocol} onChange={event => setProviderForm(previous => ({ ...previous, protocol: event.target.value }))} options={[{ value: 'OpenAI Compatible', label: 'OpenAI Compatible' }, { value: '供应商原生 API', label: '供应商原生 API' }, { value: 'Azure OpenAI', label: 'Azure OpenAI' }]} /><Input label="API Key / Token" type="password" placeholder="仅本次表单输入，不回显" value={providerForm.apiKey} onChange={event => setProviderForm(previous => ({ ...previous, apiKey: event.target.value }))} /><Input label="部署区域" value={providerForm.region} onChange={event => setProviderForm(previous => ({ ...previous, region: event.target.value }))} /><Input className="md:col-span-2" label="可用模型 *" placeholder="多个模型以逗号分隔，例如 qwen-max,qwen-plus" value={providerForm.models} onChange={event => setProviderForm(previous => ({ ...previous, models: event.target.value }))} /></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setProviderModalOpen(false)}>取消</Button><Button leftIcon={<Link2 size={13} />} onClick={createProvider}>注册并纳管</Button></div></div></Modal>

      <Modal open={routeModalOpen} onClose={() => { setRouteModalOpen(false); setRouteForm(INITIAL_ROUTE_FORM); }} title="新增模型路由" width="lg"><div className="space-y-4"><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Input label="路由名称 *" placeholder="例如：gpt-4o 主通道" value={routeForm.name} onChange={event => setRouteForm(previous => ({ ...previous, name: event.target.value }))} /><Input label="对外模型别名 *" placeholder="例如：gpt-4o" value={routeForm.model} onChange={event => setRouteForm(previous => ({ ...previous, model: event.target.value }))} /><Select label="目标供应商 *" value={routeForm.providerId} onChange={event => setRouteForm(previous => ({ ...previous, providerId: event.target.value }))} options={providers.filter(provider => provider.enabled).map(provider => ({ value: provider.id, label: `${provider.name} · ${provider.vendor}` }))} /><Select label="失败切换目标" value={routeForm.fallbackRouteId} onChange={event => setRouteForm(previous => ({ ...previous, fallbackRouteId: event.target.value }))} options={[{ value: '', label: '使用默认降级响应' }, ...routes.map(route => ({ value: route.id, label: `${route.model} · ${route.name}` }))]} /><Input label="优先级（数值越小越优先）" type="number" min="1" value={routeForm.priority} onChange={event => setRouteForm(previous => ({ ...previous, priority: event.target.value }))} /><Input label="流量权重（%）" type="number" min="0" max="100" value={routeForm.weight} onChange={event => setRouteForm(previous => ({ ...previous, weight: event.target.value }))} /><Input label="QPS 上限" type="number" min="1" value={routeForm.maxQps} onChange={event => setRouteForm(previous => ({ ...previous, maxQps: event.target.value }))} /><Input label="并发上限" type="number" min="1" value={routeForm.concurrency} onChange={event => setRouteForm(previous => ({ ...previous, concurrency: event.target.value }))} /></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setRouteModalOpen(false)}>取消</Button><Button leftIcon={<Route size={13} />} onClick={createRoute}>创建路由</Button></div></div></Modal>

      <Modal open={isolationModalOpen} onClose={() => { setIsolationModalOpen(false); setIsolationForm(INITIAL_ISOLATION_FORM); }} title="新增网关隔离策略" width="lg"><div className="space-y-4"><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Input label="策略名称 *" placeholder="例如：金融租户独享通道" value={isolationForm.name} onChange={event => setIsolationForm(previous => ({ ...previous, name: event.target.value }))} /><Select label="隔离维度" value={isolationForm.scope} onChange={event => setIsolationForm(previous => ({ ...previous, scope: event.target.value as GatewayIsolationPolicy['scope'] }))} options={[{ value: 'tenant', label: '租户' }, { value: 'namespace', label: '命名空间' }, { value: 'api-key', label: 'API Key 前缀' }]} /><Input label="隔离对象 *" placeholder="租户、命名空间或合作方名称" value={isolationForm.target} onChange={event => setIsolationForm(previous => ({ ...previous, target: event.target.value }))} /><Input label="运行命名空间 *" placeholder="例如 tenant-finance" value={isolationForm.namespace} onChange={event => setIsolationForm(previous => ({ ...previous, namespace: event.target.value }))} /><Input label="API Key 前缀" placeholder="例如 finance_" value={isolationForm.keyPrefix} onChange={event => setIsolationForm(previous => ({ ...previous, keyPrefix: event.target.value }))} /><Input label="允许模型（逗号分隔）" placeholder="qwen-max,deepseek-chat" value={isolationForm.allowedModels} onChange={event => setIsolationForm(previous => ({ ...previous, allowedModels: event.target.value }))} /><Input label="QPS 上限" type="number" min="1" value={isolationForm.qps} onChange={event => setIsolationForm(previous => ({ ...previous, qps: event.target.value }))} /><Input label="并发上限" type="number" min="1" value={isolationForm.concurrency} onChange={event => setIsolationForm(previous => ({ ...previous, concurrency: event.target.value }))} /></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setIsolationModalOpen(false)}>取消</Button><Button leftIcon={<ShieldCheck size={13} />} onClick={createIsolationPolicy}>创建策略</Button></div></div></Modal>
    </div>
  );
}
