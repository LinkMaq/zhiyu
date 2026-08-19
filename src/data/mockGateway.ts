export type GatewayProviderStatus = 'healthy' | 'degraded' | 'offline';
export type GatewayBalanceStrategy = 'weighted' | 'round-robin' | 'least-latency';

export interface GatewayProvider {
  id: string;
  name: string;
  vendor: string;
  baseUrl: string;
  protocol: string;
  apiKeyHint: string;
  status: GatewayProviderStatus;
  enabled: boolean;
  region: string;
  models: string[];
  latencyMs: number;
  successRate: number;
  qps: number;
  lastCheckedAt: string;
}

export interface GatewayRoute {
  id: string;
  name: string;
  model: string;
  providerId: string;
  priority: number;
  weight: number;
  maxQps: number;
  concurrency: number;
  fallbackRouteId?: string;
  enabled: boolean;
}

export interface GatewayIsolationPolicy {
  id: string;
  name: string;
  scope: 'tenant' | 'namespace' | 'api-key';
  target: string;
  namespace: string;
  keyPrefix: string;
  allowedModels: string[];
  qps: number;
  concurrency: number;
  enabled: boolean;
}

export interface GatewayScalingPolicy {
  id: string;
  name: string;
  target: string;
  currentReplicas: number;
  minReplicas: number;
  maxReplicas: number;
  metric: 'qps' | 'cpu' | 'latency';
  threshold: number;
  cooldownSeconds: number;
  enabled: boolean;
}

export interface GatewayFailoverEvent {
  id: string;
  time: string;
  routeName: string;
  source: string;
  target: string;
  reason: string;
  result: 'success' | 'watching';
}

export interface GatewayGovernanceConfig {
  signatureVerification: boolean;
  requestValidation: boolean;
  auditLog: boolean;
  semanticCache: boolean;
  retryCount: number;
  timeoutSeconds: number;
  breakerFailureRate: number;
  breakerWindowSeconds: number;
}

export type GatewayBillingMetric = 'tokens' | 'calls' | 'gpu-hours' | 'resource-hours';

export interface GatewayUsageRecord {
  id: string;
  date: string;
  tenant: string;
  namespace: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  gpuHours: number;
  gpuSpec?: string;
  resourceHours: number;
  resourceSpec: string;
}

export interface GatewayPricingRule {
  id: string;
  name: string;
  metric: GatewayBillingMetric | 'input-tokens' | 'output-tokens';
  scope: string;
  unitPrice: number;
  unit: string;
  enabled: boolean;
}

export const mockGatewayProviders: GatewayProvider[] = [
  {
    id: 'gw-provider-01',
    name: '百炼生产通道',
    vendor: '阿里云 DashScope',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    protocol: 'OpenAI Compatible',
    apiKeyHint: 'sk-••••6Tj3',
    status: 'healthy',
    enabled: true,
    region: '华北',
    models: ['qwen-max', 'qwen-plus', 'qwen-vl-max'],
    latencyMs: 428,
    successRate: 99.98,
    qps: 86,
    lastCheckedAt: '刚刚',
  },
  {
    id: 'gw-provider-02',
    name: 'DeepSeek 主通道',
    vendor: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    protocol: 'OpenAI Compatible',
    apiKeyHint: 'sk-••••9Qa8',
    status: 'healthy',
    enabled: true,
    region: '华东',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    latencyMs: 512,
    successRate: 99.92,
    qps: 62,
    lastCheckedAt: '1 分钟前',
  },
  {
    id: 'gw-provider-03',
    name: 'OpenAI 备援通道',
    vendor: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    protocol: 'OpenAI Compatible',
    apiKeyHint: 'sk-••••4Lm1',
    status: 'degraded',
    enabled: true,
    region: '新加坡',
    models: ['gpt-4.1', 'gpt-4.1-mini', 'text-embedding-3-large'],
    latencyMs: 980,
    successRate: 98.71,
    qps: 19,
    lastCheckedAt: '2 分钟前',
  },
  {
    id: 'gw-provider-04',
    name: '智云本地推理集群',
    vendor: '智云 Inference',
    baseUrl: 'https://inference.zhiyun.ai/v1',
    protocol: 'OpenAI Compatible',
    apiKeyHint: 'mTLS 双向认证',
    status: 'healthy',
    enabled: true,
    region: '绵阳数据中心',
    models: ['Qwen2.5-72B-Instruct-ZY', 'bge-m3-zhiyun'],
    latencyMs: 236,
    successRate: 99.99,
    qps: 118,
    lastCheckedAt: '刚刚',
  },
];

export const mockGatewayRoutes: GatewayRoute[] = [
  { id: 'gw-route-01', name: 'qwen-max-主路由', model: 'qwen-max', providerId: 'gw-provider-01', priority: 1, weight: 70, maxQps: 220, concurrency: 80, fallbackRouteId: 'gw-route-02', enabled: true },
  { id: 'gw-route-02', name: 'qwen-max-备援', model: 'qwen-max', providerId: 'gw-provider-03', priority: 2, weight: 30, maxQps: 80, concurrency: 30, enabled: true },
  { id: 'gw-route-03', name: 'DeepSeek 对话', model: 'deepseek-chat', providerId: 'gw-provider-02', priority: 1, weight: 100, maxQps: 180, concurrency: 60, enabled: true },
  { id: 'gw-route-04', name: '本地旗舰模型', model: 'Qwen2.5-72B-Instruct-ZY', providerId: 'gw-provider-04', priority: 1, weight: 100, maxQps: 300, concurrency: 100, enabled: true },
  { id: 'gw-route-05', name: 'Embedding 备援', model: 'text-embedding-3-large', providerId: 'gw-provider-03', priority: 1, weight: 100, maxQps: 120, concurrency: 50, enabled: true },
];

export const mockGatewayIsolationPolicies: GatewayIsolationPolicy[] = [
  {
    id: 'gw-isolation-01',
    name: '政务租户独享通道',
    scope: 'tenant',
    target: '绵阳政务云',
    namespace: 'tenant-government',
    keyPrefix: 'gov_',
    allowedModels: ['Qwen2.5-72B-Instruct-ZY', 'qwen-max'],
    qps: 80,
    concurrency: 30,
    enabled: true,
  },
  {
    id: 'gw-isolation-02',
    name: '研发沙箱限额',
    scope: 'namespace',
    target: 'ai-research',
    namespace: 'research-sandbox',
    keyPrefix: 'dev_',
    allowedModels: ['deepseek-chat', 'qwen-plus'],
    qps: 30,
    concurrency: 10,
    enabled: true,
  },
  {
    id: 'gw-isolation-03',
    name: '合作伙伴 API 隔离',
    scope: 'api-key',
    target: '合作伙伴集成',
    namespace: 'partner-edge',
    keyPrefix: 'partner_',
    allowedModels: ['qwen-max', 'text-embedding-3-large'],
    qps: 20,
    concurrency: 8,
    enabled: false,
  },
];

export const mockGatewayScalingPolicies: GatewayScalingPolicy[] = [
  { id: 'gw-scaling-01', name: '生产网关代理', target: 'gateway-proxy-prod', currentReplicas: 4, minReplicas: 3, maxReplicas: 12, metric: 'qps', threshold: 160, cooldownSeconds: 90, enabled: true },
  { id: 'gw-scaling-02', name: '向量检索网关', target: 'gateway-embedding-prod', currentReplicas: 2, minReplicas: 2, maxReplicas: 6, metric: 'latency', threshold: 450, cooldownSeconds: 120, enabled: true },
];

export const mockGatewayFailoverEvents: GatewayFailoverEvent[] = [
  { id: 'gw-failover-01', time: '今天 10:24:18', routeName: 'qwen-max-主路由', source: '百炼生产通道', target: 'OpenAI 备援通道', reason: '上游 5xx 连续 3 次，熔断窗口已触发', result: 'success' },
  { id: 'gw-failover-02', time: '今天 08:42:03', routeName: 'Embedding 备援', source: 'OpenAI 备援通道', target: '本地缓存响应', reason: 'P99 延迟超过 1.5s，进入观察窗口', result: 'watching' },
  { id: 'gw-failover-03', time: '昨天 22:13:49', routeName: 'DeepSeek 对话', source: 'DeepSeek 主通道', target: 'DeepSeek 主通道', reason: '健康检查恢复，自动结束半开状态', result: 'success' },
];

export const mockGatewayTraffic = [
  { time: '09:00', qps: 126, errorRate: 0.18 },
  { time: '09:30', qps: 168, errorRate: 0.21 },
  { time: '10:00', qps: 207, errorRate: 0.42 },
  { time: '10:30', qps: 248, errorRate: 0.31 },
  { time: '11:00', qps: 219, errorRate: 0.16 },
  { time: '11:30', qps: 285, errorRate: 0.27 },
  { time: '12:00', qps: 247, errorRate: 0.19 },
];

export const mockGatewayGovernance: GatewayGovernanceConfig = {
  signatureVerification: true,
  requestValidation: true,
  auditLog: true,
  semanticCache: false,
  retryCount: 2,
  timeoutSeconds: 45,
  breakerFailureRate: 15,
  breakerWindowSeconds: 60,
};

export const mockGatewayUsageRecords: GatewayUsageRecord[] = [
  {
    id: 'gw-usage-01', date: '2026-08-19', tenant: '绵阳政务云', namespace: 'tenant-government',
    model: 'qwen-max', provider: '百炼生产通道', inputTokens: 25_800_000, outputTokens: 4_200_000,
    calls: 3_360, gpuHours: 0, resourceHours: 310, resourceSpec: 'gateway-proxy: 4C8G',
  },
  {
    id: 'gw-usage-02', date: '2026-08-19', tenant: 'AI 研发中心', namespace: 'research-sandbox',
    model: 'deepseek-chat', provider: 'DeepSeek 主通道', inputTokens: 19_300_000, outputTokens: 3_500_000,
    calls: 5_120, gpuHours: 0, resourceHours: 190, resourceSpec: 'gateway-proxy: 4C8G',
  },
  {
    id: 'gw-usage-03', date: '2026-08-18', tenant: '智能制造事业部', namespace: 'manufacturing-ai',
    model: 'Qwen2.5-72B-Instruct-ZY', provider: '智云本地推理集群', inputTokens: 11_600_000, outputTokens: 2_450_000,
    calls: 1_760, gpuHours: 86.5, gpuSpec: 'NVIDIA A100 80GB', resourceHours: 160, resourceSpec: 'inference: 8C32G+GPU',
  },
  {
    id: 'gw-usage-04', date: '2026-08-18', tenant: '合作伙伴集成', namespace: 'partner-edge',
    model: 'text-embedding-3-large', provider: 'OpenAI 备援通道', inputTokens: 54_200_000, outputTokens: 0,
    calls: 48_600, gpuHours: 0, resourceHours: 70, resourceSpec: 'gateway-proxy: 2C4G',
  },
  {
    id: 'gw-usage-05', date: '2026-08-17', tenant: '绵阳政务云', namespace: 'tenant-government',
    model: 'Qwen2.5-72B-Instruct-ZY', provider: '智云本地推理集群', inputTokens: 8_900_000, outputTokens: 1_920_000,
    calls: 1_240, gpuHours: 54, gpuSpec: 'NVIDIA A100 80GB', resourceHours: 120, resourceSpec: 'inference: 8C32G+GPU',
  },
  {
    id: 'gw-usage-06', date: '2026-08-16', tenant: 'AI 研发中心', namespace: 'research-sandbox',
    model: 'qwen-plus', provider: '百炼生产通道', inputTokens: 14_600_000, outputTokens: 2_680_000,
    calls: 2_900, gpuHours: 0, resourceHours: 110, resourceSpec: 'gateway-proxy: 4C8G',
  },
];

export const mockGatewayPricingRules: GatewayPricingRule[] = [
  { id: 'gw-price-01', name: 'qwen-max 输入 Token', metric: 'input-tokens', scope: 'qwen-max', unitPrice: 2.4, unit: '元 / 百万 Token', enabled: true },
  { id: 'gw-price-02', name: 'qwen-max 输出 Token', metric: 'output-tokens', scope: 'qwen-max', unitPrice: 9.6, unit: '元 / 百万 Token', enabled: true },
  { id: 'gw-price-03', name: '默认输入 Token', metric: 'input-tokens', scope: '平台默认', unitPrice: 1.8, unit: '元 / 百万 Token', enabled: true },
  { id: 'gw-price-04', name: '默认输出 Token', metric: 'output-tokens', scope: '平台默认', unitPrice: 7.2, unit: '元 / 百万 Token', enabled: true },
  { id: 'gw-price-05', name: '网关调用服务费', metric: 'calls', scope: '平台默认', unitPrice: 0.0015, unit: '元 / 次', enabled: true },
  { id: 'gw-price-06', name: 'A100 80GB 卡时', metric: 'gpu-hours', scope: 'NVIDIA A100 80GB', unitPrice: 15.8, unit: '元 / 卡时', enabled: true },
  { id: 'gw-price-07', name: '网关代理规格', metric: 'resource-hours', scope: 'gateway-proxy: 4C8G', unitPrice: 0.3, unit: '元 / 规格时', enabled: true },
  { id: 'gw-price-08', name: '推理实例规格', metric: 'resource-hours', scope: 'inference: 8C32G+GPU', unitPrice: 1.3, unit: '元 / 规格时', enabled: true },
  { id: 'gw-price-09', name: '默认资源规格', metric: 'resource-hours', scope: '平台默认', unitPrice: 0.2, unit: '元 / 规格时', enabled: true },
];
