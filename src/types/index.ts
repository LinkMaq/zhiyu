// ============ Auth Types ============
export type UserRole = 'user' | 'admin' | 'tenant_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  organization: string;
  createdAt: string;
  quota?: UserQuota;
}

export interface UserQuota {
  gpu: number;
  cpu: number;
  memory: number;
  storage: number;
  gpuUsed: number;
  cpuUsed: number;
  memoryUsed: number;
  storageUsed: number;
}

// ============ Dataset Types ============
export type DatasetStatus = 'active' | 'archived' | 'frozen';
export type DatasetCategory = 'nlp' | 'cv' | 'multimodal' | 'tabular' | 'audio' | 'video';
export type DatasetTask = 'classification' | 'detection' | 'generation' | 'segmentation' | 'translation' | 'qa' | 'ner';
export type DatasetAccessLevel = 'private' | 'team' | 'public';

export interface DatasetVersion {
  version: string;
  createdAt: string;
  size: string;
  records: number;
  changes: string;
  frozen: boolean;
  createdBy: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: DatasetCategory;
  task: DatasetTask[];
  status: DatasetStatus;
  accessLevel: DatasetAccessLevel;
  size: string;
  records: number;
  format: string;
  language: string;
  source: string;
  license: string;
  tags: string[];
  labels: string[];
  creator: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
  downloads: number;
  stars: number;
  rating: number;
  reviews: number;
  versions: DatasetVersion[];
  processingMethod: string;
  annotationScheme: string;
  collectionMethod: string;
  encryptionEnabled: boolean;
  watermarkEnabled: boolean;
}

// ============ Model Types ============
export type ModelStatus = 'available' | 'training' | 'deploying' | 'deprecated';
export type ModelCategory = 'nlp' | 'cv' | 'multimodal' | 'audio' | 'tabular' | 'recommendation';
export type ModelFramework = 'PyTorch' | 'TensorFlow' | 'PaddlePaddle' | 'MindSpore' | 'JAX' | 'ONNX';
export type ModelAccessLevel = 'private' | 'team' | 'tenant' | 'public';

export interface ModelTaxonomy {
  businessDomain: string;
  priority: string;
  region: string;
  subTags?: string[];
}

export interface ModelMetricSet {
  accuracy?: number;
  f1?: number;
  bleu?: number;
  loss?: number;
  latencyMs?: number;
  throughputQps?: number;
  [key: string]: string | number | undefined;
}

export interface ModelShareRule {
  id: string;
  targetType: 'space' | 'team';
  targetName: string;
  accessLevel: 'read' | 'invoke' | 'manage';
  callLimitQps: number;
  dailyQuota: number;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface ModelVersion {
  version: string;
  createdAt: string;
  parameters: string;
  accuracy: number;
  f1?: number;
  bleu?: number;
  loss: number;
  commitHash: string;
  trainDataset: string;
  hyperparams: Record<string, string | number>;
  hardware: string;
  trainingTime: string;
  notes: string;
  lineageDataset?: string[];
  lineageCodeBranch?: string;
  lineagePipeline?: string;
  metrics?: ModelMetricSet;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  category: ModelCategory;
  framework: ModelFramework;
  status: ModelStatus;
  accessLevel: ModelAccessLevel;
  parameters: string;
  architecture: string;
  license: string;
  tags: string[];
  labels: string[];
  creator: string;
  organization: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  downloads: number;
  stars: number;
  rating: number;
  reviews: number;
  hardwareDep: string[];
  supportedTasks: string[];
  versions: ModelVersion[];
  featured: boolean;
  encrypted: boolean;
  exportable: boolean;
  industry?: string;
  taxonomy?: ModelTaxonomy;
  precisionMetrics?: ModelMetricSet;
  shareRules?: ModelShareRule[];
}

// ============ Development Instance Types ============
export type InstanceStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'idle';

export type DevAssetType = 'dataset' | 'model' | 'environment' | 'toolkit';
export type DevAssetAccessMode = 'ro' | 'rw';

export interface DevInstanceMount {
  id: string;
  type: DevAssetType;
  name: string;
  mountPath: string;
  accessMode: DevAssetAccessMode;
}

export interface DevInstance {
  id: string;
  name: string;
  image: string;
  status: InstanceStatus;
  gpuType: string;
  gpuCount: number;
  cpu: number;
  memory: string;
  storage: string;
  createdAt: string;
  lastActive: string;
  jupyterUrl: string;
  sshPort: number;
  mounts?: DevInstanceMount[];
  mountedDatasets: string[];
  mountedModels: string[];
  mountedEnvironments?: string[];
  idleMinutes: number;
  creator: string;
  namespace: string;
}

// ============ Training Types ============
export type TrainingStatus = 'running' | 'completed' | 'failed' | 'pending' | 'stopped' | 'queued';
export type TrainingType = 'full' | 'fine-tune-fast' | 'fine-tune-expert' | 'lora' | 'qlora' | 'pretrain';
export type DataPreheatStatus = 'queued' | 'warming' | 'ready' | 'failed' | 'expired';

export interface TrainingMetric {
  epoch: number;
  step: number;
  loss: number;
  valLoss?: number;
  accuracy?: number;
  f1?: number;
  bleu?: number;
  learningRate: number;
  gpuUtilization: number;
  timestamp: string;
}

export interface TrainingJob {
  id: string;
  name: string;
  type: TrainingType;
  status: TrainingStatus;
  model: string;
  baseModel: string;
  dataset: string;
  priority: number;
  gpuType: string;
  gpuCount: number;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  creator: string;
  namespace: string;
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  estimatedTime?: string;
  errorMessage?: string;
  metrics: TrainingMetric[];
  hyperparams: Record<string, string | number>;
  versions: string[];
}

export interface DataPreheatTask {
  id: string;
  modelName: string;
  datasetName: string;
  targetNodePool: string;
  nvmePath: string;
  cacheQuotaGiB: number;
  status: DataPreheatStatus;
  progress: number;
  estimatedReadyMinutes: number;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
  hitRate?: number;
}

// ============ Inference Types ============
export type InferenceStatus = 'running' | 'stopped' | 'deploying' | 'stopping' | 'error' | 'scaling';

export interface InferenceService {
  id: string;
  name: string;
  model: string;
  modelVersion: string;
  status: InferenceStatus;
  framework: string;
  gpuType: string;
  gpuCount: number;
  replicas: number;
  minReplicas: number;
  maxReplicas: number;
  cpu: number;
  memory: string;
  qps: number;
  avgLatency: number;
  p99Latency: number;
  availability: number;
  createdAt: string;
  creator: string;
  endpoint: string;
  namespace: string;
  autoScaling: boolean;
  scaleMetric: 'qps' | 'latency' | 'gpu';
  scaleThreshold: number;
  deployMode: 'model' | 'image';
  pdSeparation: boolean;
  prefillReplicas?: number;
  decodeReplicas?: number;
  batchSize?: number;
}

// ============ Image Registry Types ============
export type ImageArch = 'amd64' | 'arm64' | 'multi';

export interface ContainerImage {
  id: string;
  name: string;
  tag: string;
  fullName: string;
  arch: ImageArch;
  os: string;
  aiFrameworks: string[];
  size: string;
  pullCount: number;
  createdAt: string;
  creator: string;
  description: string;
  status: 'active' | 'building' | 'deprecated';
  isPublic: boolean;
  layers: number;
  digest: string;
}

// ============ K8s Cluster Types ============
export type ClusterStatus = 'healthy' | 'warning' | 'error' | 'offline';

export interface K8sNode {
  name: string;
  status: 'ready' | 'notready';
  role: 'master' | 'worker' | 'gpu-worker';
  cpu: string;
  memory: string;
  gpuType?: string;
  gpuCount?: number;
  ip: string;
  os: string;
  kernelVersion: string;
  kubeletVersion: string;
  pods: number;
}

export interface K8sCluster {
  id: string;
  name: string;
  region: string;
  status: ClusterStatus;
  version: string;
  nodes: K8sNode[];
  pods: number;
  services: number;
  pvs: number;
  namespaces: number;
  cpuTotal: string;
  cpuUsed: string;
  memoryTotal: string;
  memoryUsed: string;
  gpuTotal: number;
  gpuUsed: number;
  createdAt: string;
  lastSync: string;
  plugins: K8sPlugin[];
}

export interface K8sPlugin {
  name: string;
  version: string;
  status: 'installed' | 'installing' | 'error';
  description: string;
  official: boolean;
}

// ============ Resource Pool Types ============
export type ResourcePoolType = 'shared' | 'dedicated';
export type ScheduleAlgo = 'binpack' | 'spread' | 'drf' | 'priority';

export interface ResourcePool {
  id: string;
  name: string;
  type: ResourcePoolType;
  cluster: string;
  clusterId: string;
  namespace: string;
  gpuType: string;
  gpuTotal: number;
  gpuUsed: number;
  cpuTotal: number;
  cpuUsed: number;
  memoryTotal: string;
  memoryUsed: string;
  tenants: string[];
  scheduleAlgos: ScheduleAlgo[];
  status: 'active' | 'maintenance';
  createdAt: string;
  utilization: number;
  queuedJobs: number;
}

export type ComputeSpecType = 'general' | 'gpu' | 'vgpu';

export interface ComputeSpec {
  id: string;
  name: string;
  type: ComputeSpecType;
  cpu: number;
  memoryGiB: number;
  gpuModel?: string;
  gpuCount?: number;
  vgpuSliceGb?: number;
  status: 'active' | 'disabled';
  description: string;
}

export interface TenantSpecLimit {
  id: string;
  tenant: string;
  specId: string;
  maxCount: number;
  usedCount: number;
  tenantId?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// ============ App Types ============
export type AppCategory = 'llm' | 'vision' | 'audio' | 'multimodal' | 'tool' | 'workflow';
export type AppStatus = 'running' | 'stopped' | 'deploying' | 'error';

export type AppRuntimeLogLevel = 'info' | 'success' | 'warning' | 'error';

export interface AppRuntimeLog {
  time: string;
  level: AppRuntimeLogLevel;
  message: string;
}

export interface AppSpace {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  status: AppStatus;
  featured: boolean;
  pinned: boolean;
  stars: number;
  downloads: number;
  rating: number;
  reviews: number;
  creator: string;
  organization: string;
  modelName: string;
  tags: string[];
  demoUrl?: string;
  sourceRepo: string;
  gitRepoUrl?: string;
  gitBranch?: string;
  gitCommit?: string;
  buildStatus?: 'idle' | 'building' | 'success' | 'failed';
  buildProgress?: number;
  previewUrl?: string;
  runtimeCluster?: string;
  runtimeNamespace?: string;
  runtimeFlavor?: string;
  runtimeEnvironment?: string;
  capabilities?: string[];
  runtimeLogs?: AppRuntimeLog[];
  healthScore?: number;
  lastDeployedAt?: string;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
  hasDemoTrial: boolean;
  industry: string[];
  accessLevel: ModelAccessLevel;
  subscribeCount: number;
}

// ============ Monitoring Types ============
export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface ResourceMetrics {
  gpuUtilization: TimeSeriesPoint[];
  cpuUtilization: TimeSeriesPoint[];
  memoryUtilization: TimeSeriesPoint[];
  networkThroughput: TimeSeriesPoint[];
  qps: TimeSeriesPoint[];
  latencyP50: TimeSeriesPoint[];
  latencyP99: TimeSeriesPoint[];
}

export interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  clusterId: string;
  title: string;
  message: string;
  source: string;
  metric: string;
  threshold: string;
  currentValue: string;
  status: 'firing' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  resourceType: string;
  ip: string;
  result: 'success' | 'failure';
  timestamp: string;
  details: string;
}

// ============ API Key Types ============
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  model: string;
  status: 'active' | 'disabled' | 'expired';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  totalCalls: number;
  callLimit?: number;
  concurrencyLimit?: number;
  creator: string;
}

// ============ Quota Types ============
export interface QuotaItem {
  resource: string;
  total: number;
  used: number;
  unit: string;
}

export interface TenantQuota {
  tenantId: string;
  tenantName: string;
  region: string;
  quotas: QuotaItem[];
  workspaces: WorkspaceQuota[];
}

export interface WorkspaceQuota {
  workspaceId: string;
  workspaceName: string;
  quotas: QuotaItem[];
}

// ============ Storage Types ============
export type StorageExpansionPhase = 'idle' | 'queued' | 'expanding' | 'resizing-fs' | 'completed' | 'rollback';

export interface StorageExpansionTask {
  phase: StorageExpansionPhase;
  progress: number;
  targetCapacityGiB?: number;
  startedAt?: string;
  finishedAt?: string;
  summary: string;
  rollbackReason?: string;
}

export interface StorageVolume {
  id: string;
  name: string;
  type: 'nfs' | 'ceph' | 'local' | 's3' | 'nas';
  clusterId: string;
  capacity: string;
  used: string;
  status: 'bound' | 'available' | 'released' | 'failed';
  accessMode: 'ReadWriteOnce' | 'ReadWriteMany' | 'ReadOnlyMany';
  createdAt: string;
  namespace: string;
  mountedBy: string[];
  storageClass: string;
  expansion?: StorageExpansionTask;
}

export interface OnlineFileSystem {
  id: string;
  clusterId: string;
  name: string;
  protocol: 'NFS' | 'Lustre' | 'CephFS';
  mountTargets: number;
  usedGB: number;
  capacityGB: number;
  throughputMBps: number;
  status: 'online' | 'warning';
  seamless: boolean;
  createdAt: string;
  namespace: string;
  expansion?: StorageExpansionTask;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: string;
  modified: string;
  owner: string;
  permission: string;
}

// ============ GPU Types ============
export interface GpuDevice {
  id: string;
  node: string;
  model: string;
  totalMemory: string;
  usedMemory: string;
  utilization: number;
  temperature: number;
  power: string;
  slices: GpuSlice[];
  status: 'normal' | 'warning' | 'error';
}

export interface GpuSlice {
  id: string;
  size: string;
  assigned: boolean;
  tenant?: string;
  namespace?: string;
}

// ============ Notification Types ============
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
