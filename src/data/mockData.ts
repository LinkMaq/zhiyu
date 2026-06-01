import type { ContainerImage, K8sCluster, ResourcePool, GpuDevice, StorageVolume, Alert, AuditLog, ApiKey, AppSpace, OnlineFileSystem, ComputeSpec, TenantSpecLimit } from '../types';

// ============ Container Images ============
export const mockImages: ContainerImage[] = [
  {
    id: 'img001', name: 'zhiyun/pytorch', tag: '2.3-cuda12.1-cudnn9', fullName: 'zhiyun/pytorch:2.3-cuda12.1-cudnn9',
    arch: 'amd64', os: 'Ubuntu 22.04', aiFrameworks: ['PyTorch 2.3', 'CUDA 12.1', 'cuDNN 9', 'Transformers 4.42', 'vLLM 0.4'],
    size: '18.4 GB', pullCount: 12840, createdAt: '2025-01-15', creator: '平台管理员', description: '主力训练镜像，集成主流LLM训练工具链',
    status: 'active', isPublic: true, layers: 24, digest: 'sha256:a3f1c2d9e8b7',
  },
  {
    id: 'img002', name: 'zhiyun/pytorch', tag: '2.2-cuda12.0-ultralytics', fullName: 'zhiyun/pytorch:2.2-cuda12.0-ultralytics',
    arch: 'amd64', os: 'Ubuntu 20.04', aiFrameworks: ['PyTorch 2.2', 'CUDA 12.0', 'Ultralytics 8.1', 'OpenCV 4.9'],
    size: '12.1 GB', pullCount: 5320, createdAt: '2024-11-20', creator: '平台管理员', description: 'CV/目标检测专用镜像',
    status: 'active', isPublic: true, layers: 18, digest: 'sha256:b4e2f8c1a0d6',
  },
  {
    id: 'img003', name: 'zhiyun/pytorch', tag: '2.2-cuda12.0-audio', fullName: 'zhiyun/pytorch:2.2-cuda12.0-audio',
    arch: 'amd64', os: 'Ubuntu 20.04', aiFrameworks: ['PyTorch 2.2', 'CUDA 12.0', 'torchaudio 2.2', 'faster-whisper 1.0'],
    size: '9.8 GB', pullCount: 1820, createdAt: '2024-12-05', creator: '平台管理员', description: '语音处理专用镜像',
    status: 'active', isPublic: true, layers: 16, digest: 'sha256:c5a3g9d2b1e7',
  },
  {
    id: 'img004', name: 'zhiyun/python', tag: '3.11-nlp-toolkit', fullName: 'zhiyun/python:3.11-nlp-toolkit',
    arch: 'multi', os: 'Debian 12', aiFrameworks: ['Python 3.11', 'Transformers 4.40', 'spaCy 3.7', 'NLTK 3.8'],
    size: '4.2 GB', pullCount: 3640, createdAt: '2024-10-18', creator: '平台管理员', description: 'NLP开发通用镜像，CPU可用',
    status: 'active', isPublic: true, layers: 12, digest: 'sha256:d6b4h0e3c2f8',
  },
  {
    id: 'img005', name: 'zhiyun/pytorch', tag: '2.3-cuda12.1-transformers4.40', fullName: 'zhiyun/pytorch:2.3-cuda12.1-transformers4.40',
    arch: 'amd64', os: 'Ubuntu 22.04', aiFrameworks: ['PyTorch 2.3', 'CUDA 12.1', 'Transformers 4.40', 'DeepSpeed 0.14'],
    size: '15.6 GB', pullCount: 8120, createdAt: '2025-02-01', creator: '平台管理员', description: '多模态大模型开发镜像，集成DeepSpeed分布式训练',
    status: 'active', isPublic: true, layers: 22, digest: 'sha256:e7c5i1f4d3g9',
  },
  {
    id: 'img006', name: 'user/custom-research', tag: 'latest', fullName: 'user/custom-research:latest',
    arch: 'amd64', os: 'Ubuntu 22.04', aiFrameworks: ['PyTorch 2.3', 'LightGBM 4.3', 'Scikit-learn 1.4'],
    size: '6.3 GB', pullCount: 42, createdAt: '2025-02-12', creator: '张远航', description: '自定义研究镜像',
    status: 'active', isPublic: false, layers: 8, digest: 'sha256:f8d6j2g5e4h0',
  },
];

// ============ K8s Clusters ============
export const mockClusters: K8sCluster[] = [
  {
    id: 'cls001', name: 'telecom-gpu-prod', region: '四川·成都数据中心', status: 'healthy', version: '1.29.2',
    nodes: [
      { name: 'node-master-01', status: 'ready', role: 'master', cpu: '64C', memory: '256Gi', ip: '10.100.1.1', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-102', kubeletVersion: '1.29.2', pods: 12 },
      { name: 'node-master-02', status: 'ready', role: 'master', cpu: '64C', memory: '256Gi', ip: '10.100.1.2', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-102', kubeletVersion: '1.29.2', pods: 11 },
      { name: 'node-gpu-01', status: 'ready', role: 'gpu-worker', cpu: '128C', memory: '512Gi', gpuType: 'NVIDIA A100 80GB', gpuCount: 8, ip: '10.100.2.1', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-102', kubeletVersion: '1.29.2', pods: 24 },
      { name: 'node-gpu-02', status: 'ready', role: 'gpu-worker', cpu: '128C', memory: '512Gi', gpuType: 'NVIDIA A100 80GB', gpuCount: 8, ip: '10.100.2.2', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-102', kubeletVersion: '1.29.2', pods: 22 },
      { name: 'node-gpu-03', status: 'ready', role: 'gpu-worker', cpu: '128C', memory: '512Gi', gpuType: 'NVIDIA A100 80GB', gpuCount: 8, ip: '10.100.2.3', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-102', kubeletVersion: '1.29.2', pods: 20 },
      { name: 'node-gpu-04', status: 'ready', role: 'gpu-worker', cpu: '128C', memory: '512Gi', gpuType: 'NVIDIA H100 80GB', gpuCount: 8, ip: '10.100.2.4', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-104', kubeletVersion: '1.29.2', pods: 18 },
      { name: 'node-cpu-01', status: 'ready', role: 'worker', cpu: '64C', memory: '256Gi', ip: '10.100.3.1', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-102', kubeletVersion: '1.29.2', pods: 45 },
    ],
    pods: 152, services: 64, pvs: 120, namespaces: 12,
    cpuTotal: '576C', cpuUsed: '380C', memoryTotal: '2304Gi', memoryUsed: '1680Gi',
    gpuTotal: 40, gpuUsed: 31, createdAt: '2024-03-15', lastSync: new Date().toISOString(),
    plugins: [
      { name: 'nvidia-gpu-operator', version: '24.3.0', status: 'installed', description: 'NVIDIA GPU管理插件', official: true },
      { name: 'ceph-csi', version: '3.10.0', status: 'installed', description: 'Ceph存储驱动', official: true },
      { name: 'calico', version: '3.27.2', status: 'installed', description: '网络插件', official: true },
      { name: 'volcano', version: '1.9.0', status: 'installed', description: 'AI任务调度器', official: false },
      { name: 'prometheus-stack', version: '58.2.1', status: 'installed', description: '监控栈', official: true },
    ],
  },
  {
    id: 'cls002', name: 'telecom-dev', region: '重庆·联合研发中心', status: 'warning', version: '1.28.5',
    nodes: [
      { name: 'dev-master-01', status: 'ready', role: 'master', cpu: '32C', memory: '128Gi', ip: '10.200.1.1', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-100', kubeletVersion: '1.28.5', pods: 8 },
      { name: 'dev-gpu-01', status: 'ready', role: 'gpu-worker', cpu: '64C', memory: '256Gi', gpuType: 'NVIDIA A10', gpuCount: 4, ip: '10.200.2.1', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-100', kubeletVersion: '1.28.5', pods: 16 },
      { name: 'dev-gpu-02', status: 'notready', role: 'gpu-worker', cpu: '64C', memory: '256Gi', gpuType: 'NVIDIA A10', gpuCount: 4, ip: '10.200.2.2', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-100', kubeletVersion: '1.28.5', pods: 0 },
    ],
    pods: 24, services: 18, pvs: 30, namespaces: 5,
    cpuTotal: '160C', cpuUsed: '80C', memoryTotal: '640Gi', memoryUsed: '320Gi',
    gpuTotal: 8, gpuUsed: 4, createdAt: '2024-07-20', lastSync: new Date().toISOString(),
    plugins: [
      { name: 'nvidia-gpu-operator', version: '23.9.0', status: 'installed', description: 'NVIDIA GPU管理插件', official: true },
      { name: 'local-path-provisioner', version: '0.0.27', status: 'installed', description: '本地存储', official: false },
    ],
  },
];

// ============ Resource Pools ============
export const mockComputeSpecs: ComputeSpec[] = [
  {
    id: 'spec-general-c4m16',
    name: 'C4M16-通用',
    type: 'general',
    cpu: 4,
    memoryGiB: 16,
    status: 'active',
    description: '轻量开发与在线调试任务',
  },
  {
    id: 'spec-general-c8m32',
    name: 'C8M32-通用',
    type: 'general',
    cpu: 8,
    memoryGiB: 32,
    status: 'active',
    description: '通用训练与数据预处理任务',
  },
  {
    id: 'spec-general-c16m64',
    name: 'C16M64-通用',
    type: 'general',
    cpu: 16,
    memoryGiB: 64,
    status: 'active',
    description: '高并发数据处理与多任务混部',
  },
  {
    id: 'spec-gpu-a10x1',
    name: 'A10-24G x1',
    type: 'gpu',
    cpu: 12,
    memoryGiB: 48,
    gpuModel: 'NVIDIA A10 24GB',
    gpuCount: 1,
    status: 'active',
    description: '中等规模微调与推理任务',
  },
  {
    id: 'spec-gpu-a100x1',
    name: 'A100-80G x1',
    type: 'gpu',
    cpu: 16,
    memoryGiB: 96,
    gpuModel: 'NVIDIA A100 80GB',
    gpuCount: 1,
    status: 'active',
    description: '大模型推理服务标准规格',
  },
  {
    id: 'spec-gpu-h100x1',
    name: 'H100-80G x1',
    type: 'gpu',
    cpu: 24,
    memoryGiB: 128,
    gpuModel: 'NVIDIA H100 80GB',
    gpuCount: 1,
    status: 'active',
    description: '高性能训练与低时延推理场景',
  },
  {
    id: 'spec-vgpu-a100-10g',
    name: 'A100-vGPU-10G',
    type: 'vgpu',
    cpu: 4,
    memoryGiB: 24,
    gpuModel: 'NVIDIA A100 80GB',
    gpuCount: 1,
    vgpuSliceGb: 10,
    status: 'active',
    description: '低成本 vGPU 切片共享规格',
  },
  {
    id: 'spec-vgpu-a100-20g',
    name: 'A100-vGPU-20G',
    type: 'vgpu',
    cpu: 8,
    memoryGiB: 48,
    gpuModel: 'NVIDIA A100 80GB',
    gpuCount: 1,
    vgpuSliceGb: 20,
    status: 'active',
    description: 'vGPU 多租户切片规格',
  },
  {
    id: 'spec-vgpu-h100-20g',
    name: 'H100-vGPU-20G',
    type: 'vgpu',
    cpu: 8,
    memoryGiB: 48,
    gpuModel: 'NVIDIA H100 80GB',
    gpuCount: 1,
    vgpuSliceGb: 20,
    status: 'active',
    description: '高性能 vGPU 切片规格',
  },
];

export const mockTenantSpecLimits: TenantSpecLimit[] = [
  { id: 'limit-1', tenant: '中国移动云能力中心', specId: 'spec-general-c8m32', maxCount: 180, usedCount: 122, updatedAt: '2026-05-08 10:20', updatedBy: '平台管理员' },
  { id: 'limit-2', tenant: '中国移动云能力中心', specId: 'spec-gpu-a100x1', maxCount: 28, usedCount: 19, updatedAt: '2026-05-08 10:20', updatedBy: '平台管理员' },
  { id: 'limit-3', tenant: '中国移动云能力中心', specId: 'spec-vgpu-a100-20g', maxCount: 60, usedCount: 35, updatedAt: '2026-05-08 10:20', updatedBy: '平台管理员' },
  { id: 'limit-4', tenant: '中国电信天翼云', specId: 'spec-general-c16m64', maxCount: 140, usedCount: 98, updatedAt: '2026-05-07 09:35', updatedBy: '平台管理员' },
  { id: 'limit-5', tenant: '中国电信天翼云', specId: 'spec-gpu-h100x1', maxCount: 22, usedCount: 14, updatedAt: '2026-05-07 09:35', updatedBy: '平台管理员' },
  { id: 'limit-6', tenant: '中国电信天翼云', specId: 'spec-vgpu-h100-20g', maxCount: 42, usedCount: 21, updatedAt: '2026-05-07 09:35', updatedBy: '平台管理员' },
  { id: 'limit-7', tenant: '中国联通沃云', specId: 'spec-general-c4m16', maxCount: 260, usedCount: 143, updatedAt: '2026-05-06 16:10', updatedBy: '平台管理员' },
  { id: 'limit-8', tenant: '中国联通沃云', specId: 'spec-gpu-a10x1', maxCount: 36, usedCount: 18, updatedAt: '2026-05-06 16:10', updatedBy: '平台管理员' },
  { id: 'limit-9', tenant: '中国联通沃云', specId: 'spec-vgpu-a100-10g', maxCount: 80, usedCount: 44, updatedAt: '2026-05-06 16:10', updatedBy: '平台管理员' },
  { id: 'limit-10', tenant: '国防科技大学', specId: 'spec-general-c8m32', maxCount: 100, usedCount: 61, updatedAt: '2026-05-05 13:42', updatedBy: '平台管理员' },
  { id: 'limit-11', tenant: '国防科技大学', specId: 'spec-gpu-a100x1', maxCount: 16, usedCount: 9, updatedAt: '2026-05-05 13:42', updatedBy: '平台管理员' },
  { id: 'limit-12', tenant: '国防科技大学', specId: 'spec-vgpu-a100-20g', maxCount: 36, usedCount: 20, updatedAt: '2026-05-05 13:42', updatedBy: '平台管理员' },
];

export const mockResourcePools: ResourcePool[] = [
  {
    id: 'rp001', name: '科研共享池', type: 'shared', cluster: 'telecom-gpu-prod', clusterId: 'cls001', namespace: 'shared-pool',
    gpuType: 'NVIDIA A100 80GB', gpuTotal: 24, gpuUsed: 18,
    cpuTotal: 384, cpuUsed: 280, memoryTotal: '1536Gi', memoryUsed: '1100Gi',
    tenants: ['中国电信AI研究院', '中国移动数字创新中心', '中国联通智能研究院'],
    scheduleAlgos: ['drf', 'priority'], status: 'active', createdAt: '2024-04-01', utilization: 75, queuedJobs: 3,
  },
  {
    id: 'rp002', name: 'H100专属池', type: 'dedicated', cluster: 'telecom-gpu-prod', clusterId: 'cls001', namespace: 'h100-dedicated',
    gpuType: 'NVIDIA H100 80GB', gpuTotal: 8, gpuUsed: 7,
    cpuTotal: 128, cpuUsed: 112, memoryTotal: '512Gi', memoryUsed: '450Gi',
    tenants: ['中国电信AI研究院'],
    scheduleAlgos: ['binpack'], status: 'active', createdAt: '2025-01-01', utilization: 87.5, queuedJobs: 1,
  },
  {
    id: 'rp003', name: '推理服务池', type: 'dedicated', cluster: 'telecom-gpu-prod', clusterId: 'cls001', namespace: 'inference-pool',
    gpuType: 'NVIDIA A100 80GB', gpuTotal: 8, gpuUsed: 6,
    cpuTotal: 128, cpuUsed: 80, memoryTotal: '512Gi', memoryUsed: '320Gi',
    tenants: ['中国电信AI研究院'],
    scheduleAlgos: ['spread'], status: 'active', createdAt: '2024-06-01', utilization: 75, queuedJobs: 0,
  },
  {
    id: 'rp004', name: '开发弹性池', type: 'shared', cluster: 'telecom-dev', clusterId: 'cls002', namespace: 'dev-pool',
    gpuType: 'NVIDIA A10', gpuTotal: 4, gpuUsed: 2,
    cpuTotal: 64, cpuUsed: 24, memoryTotal: '256Gi', memoryUsed: '96Gi',
    tenants: ['中国电信AI研究院', '内部测试'],
    scheduleAlgos: ['spread', 'drf'], status: 'active', createdAt: '2024-08-01', utilization: 50, queuedJobs: 0,
  },
];

// ============ GPU Devices ============
export const mockGpuDevices: GpuDevice[] = [
  {
    id: 'gpu001', node: 'node-gpu-01', model: 'NVIDIA A100 80GB',
    totalMemory: '80 GB', usedMemory: '62 GB', utilization: 94, temperature: 72, power: '380W',
    status: 'normal',
    slices: [
      { id: 'gpu001-0', size: '10GB', assigned: true, tenant: '中国电信AI研究院', namespace: 'algo-team' },
      { id: 'gpu001-1', size: '10GB', assigned: true, tenant: '中国电信AI研究院', namespace: 'cv-lab' },
      { id: 'gpu001-2', size: '20GB', assigned: true, tenant: '中国移动数字创新中心', namespace: 'multimodal-lab' },
      { id: 'gpu001-3', size: '40GB', assigned: false },
    ],
  },
  {
    id: 'gpu002', node: 'node-gpu-01', model: 'NVIDIA A100 80GB',
    totalMemory: '80 GB', usedMemory: '80 GB', utilization: 100, temperature: 81, power: '400W',
    status: 'warning',
    slices: [
      { id: 'gpu002-0', size: '80GB', assigned: true, tenant: '中国电信AI研究院', namespace: 'algo-team' },
    ],
  },
  {
    id: 'gpu003', node: 'node-gpu-04', model: 'NVIDIA H100 80GB',
    totalMemory: '80 GB', usedMemory: '56 GB', utilization: 88, temperature: 68, power: '650W',
    status: 'normal',
    slices: [
      { id: 'gpu003-0', size: '80GB', assigned: true, tenant: '中国电信AI研究院', namespace: 'inference-team' },
    ],
  },
];

// ============ Storage Volumes ============
const seedStorageVolumes: StorageVolume[] = [
  { id: 'pv001', clusterId: 'cls001', name: 'dataset-storage-01', type: 'ceph', capacity: '900 GiB', used: '760 GiB', status: 'bound', accessMode: 'ReadWriteMany', createdAt: '2024-04-01', namespace: 'shared-pool', mountedBy: ['algo-team', 'cv-lab', 'multimodal-lab'], storageClass: 'ceph-fs', expansion: { phase: 'completed', progress: 100, targetCapacityGiB: 900, startedAt: '2025-05-12T10:00:00.000Z', finishedAt: '2025-05-12T10:08:00.000Z', summary: '最近一次在线扩容已完成，业务无感知' } },
  { id: 'pv002', clusterId: 'cls001', name: 'model-registry-vol', type: 'ceph', capacity: '800 GiB', used: '620 GiB', status: 'bound', accessMode: 'ReadWriteMany', createdAt: '2024-04-01', namespace: 'model-store', mountedBy: ['inference-pool'], storageClass: 'ceph-fs', expansion: { phase: 'idle', progress: 0, summary: '建议在 80% 使用率前发起在线扩容' } },
  { id: 'pv003', clusterId: 'cls001', name: 'training-workspace-01', type: 'nfs', capacity: '700 GiB', used: '430 GiB', status: 'bound', accessMode: 'ReadWriteMany', createdAt: '2024-06-15', namespace: 'algo-team', mountedBy: ['ins001'], storageClass: 'nfs-client' },
  { id: 'pv004', clusterId: 'cls002', name: 'logs-persistent', type: 'local', capacity: '500 GiB', used: '230 GiB', status: 'bound', accessMode: 'ReadWriteOnce', createdAt: '2024-04-01', namespace: 'monitoring', mountedBy: ['prometheus'], storageClass: 'local-path', expansion: { phase: 'rollback', progress: 100, targetCapacityGiB: 900, startedAt: '2025-05-22T08:10:00.000Z', finishedAt: '2025-05-22T08:19:00.000Z', summary: '节点盘校验失败，已回滚到原容量', rollbackReason: '底层节点磁盘剩余空间不足' } },
  { id: 'pv005', clusterId: 'cls002', name: 'backup-archive-s3', type: 's3', capacity: '960 GiB', used: '410 GiB', status: 'available', accessMode: 'ReadWriteMany', createdAt: '2024-08-01', namespace: 'backup', mountedBy: [], storageClass: 's3-compatible' },
];

function buildMockStorageVolumes(total: number): StorageVolume[] {
  const clusterIds = ['cls001', 'cls002'];
  const namespaces = ['shared-pool', 'model-store', 'algo-team', 'cv-lab', 'inference-pool', 'monitoring', 'backup', 'default'];
  const types: Array<{ type: StorageVolume['type']; storageClass: string }> = [
    { type: 'ceph', storageClass: 'ceph-fs' },
    { type: 'nfs', storageClass: 'nfs-client' },
    { type: 'local', storageClass: 'local-path' },
    { type: 's3', storageClass: 's3-compatible' },
    { type: 'nas', storageClass: 'nas-csi' },
  ];
  const modes: StorageVolume['accessMode'][] = ['ReadWriteMany', 'ReadWriteOnce', 'ReadOnlyMany'];

  const volumes: StorageVolume[] = [];
  for (let i = 0; i < total; i++) {
    const t = types[i % types.length];
    const capBase = 120 + (i % 14) * 55;
    const usedRatio = 0.25 + (i % 6) * 0.1;
    const usedBase = capBase * Math.min(0.9, usedRatio);
    const status: StorageVolume['status'] = i % 11 === 0 ? 'available' : i % 37 === 0 ? 'failed' : i % 19 === 0 ? 'released' : 'bound';

    volumes.push({
      id: `pv${String(i + 6).padStart(3, '0')}`,
      clusterId: clusterIds[i % clusterIds.length],
      name: `${t.type}-volume-${String(i + 1).padStart(3, '0')}`,
      type: t.type,
      capacity: `${Math.min(capBase, 980)} GiB`,
      used: `${Math.round(Math.min(usedBase, 920))} GiB`,
      status,
      accessMode: modes[(i * 3 + 1) % modes.length],
      createdAt: new Date(Date.now() - (i * 9 + 12) * 3600000).toISOString(),
      namespace: namespaces[(i * 7 + 2) % namespaces.length],
      mountedBy: status === 'bound' ? [`workload-${(i % 24) + 1}`] : [],
      storageClass: t.storageClass,
    });
  }

  return volumes;
}

export const mockStorageVolumes: StorageVolume[] = [...seedStorageVolumes, ...buildMockStorageVolumes(120 - seedStorageVolumes.length)];

export const mockOnlineFileSystems: OnlineFileSystem[] = [
  {
    id: 'fs001',
    clusterId: 'cls001',
    name: 'cephfs-training-share',
    protocol: 'CephFS',
    mountTargets: 18,
    usedGB: 4600,
    capacityGB: 8192,
    throughputMBps: 6200,
    status: 'online',
    seamless: true,
    createdAt: '2025-01-18',
    namespace: 'train-ns',
    expansion: { phase: 'completed', progress: 100, targetCapacityGiB: 8192, startedAt: '2025-05-16T09:20:00.000Z', finishedAt: '2025-05-16T09:32:00.000Z', summary: '最近一次在线扩容已完成，客户端会话未中断' },
  },
  {
    id: 'fs002',
    clusterId: 'cls001',
    name: 'lustre-hpc-workspace',
    protocol: 'Lustre',
    mountTargets: 9,
    usedGB: 12100,
    capacityGB: 20480,
    throughputMBps: 12800,
    status: 'online',
    seamless: true,
    createdAt: '2025-02-07',
    namespace: 'hpc-ns',
    expansion: { phase: 'idle', progress: 0, summary: '当前容量稳定，可按业务峰值在线扩容' },
  },
  {
    id: 'fs003',
    clusterId: 'cls002',
    name: 'nfs-dev-shared',
    protocol: 'NFS',
    mountTargets: 14,
    usedGB: 980,
    capacityGB: 2048,
    throughputMBps: 1800,
    status: 'warning',
    seamless: true,
    createdAt: '2025-03-03',
    namespace: 'dev-ns',
    expansion: { phase: 'rollback', progress: 100, targetCapacityGiB: 4096, startedAt: '2025-05-18T14:00:00.000Z', finishedAt: '2025-05-18T14:11:00.000Z', summary: '扩容校验失败，已自动回滚至原容量', rollbackReason: '后端配额保护触发' },
  },
  {
    id: 'fs004',
    clusterId: 'cls002',
    name: 'cephfs-online-infer',
    protocol: 'CephFS',
    mountTargets: 6,
    usedGB: 1680,
    capacityGB: 3072,
    throughputMBps: 3200,
    status: 'online',
    seamless: true,
    createdAt: '2025-03-21',
    namespace: 'infer-ns',
    expansion: { phase: 'idle', progress: 0, summary: '支持热扩容与在线元数据刷新' },
  },
];

// ============ Alerts ============
export const mockAlerts: Alert[] = [
  { id: 'al001', clusterId: 'cls001', level: 'critical', title: 'GPU内存超限', message: 'node-gpu-01 上的 GPU-002 显存使用率达到100%，可能导致OOM', source: 'prometheus', metric: 'nvidia_gpu_memory_used_bytes', threshold: '80GB', currentValue: '80GB', status: 'firing', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'al002', clusterId: 'cls001', level: 'warning', title: 'GPU温度过高', message: 'node-gpu-01 上的 GPU-002 温度达到 81°C，超过警告阈值 75°C', source: 'prometheus', metric: 'nvidia_gpu_temperature_gpu', threshold: '75°C', currentValue: '81°C', status: 'firing', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'al003', clusterId: 'cls002', level: 'warning', title: '节点NotReady', message: 'dev-gpu-02 节点变为NotReady状态，可能存在网络或硬件故障', source: 'k8s', metric: 'kube_node_status_condition', threshold: 'Ready=true', currentValue: 'NotReady', status: 'firing', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'al004', clusterId: 'cls001', level: 'info', title: '训练任务完成', message: 'YOLOv9-Sat-v1.2 训练任务已成功完成，最终mAP@0.5=87.6%', source: 'training-system', metric: 'job.status', threshold: '', currentValue: 'completed', status: 'resolved', createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 23 * 3600000).toISOString() },
  { id: 'al005', clusterId: 'cls002', level: 'critical', title: '推理服务延迟飙升', message: 'qwen72b-prod-svc P99延迟超过5000ms，当前值8420ms', source: 'prometheus', metric: 'inference_request_duration_p99', threshold: '5000ms', currentValue: '8420ms', status: 'resolved', createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 2.5 * 3600000).toISOString() },
];

// ============ Audit Logs ============
const seedAuditLogs: AuditLog[] = [
  { id: 'log0001', user: '张远航', action: '创建推理服务', resource: 'qwen72b-prod-svc', resourceType: 'InferenceService', ip: '10.50.1.45', result: 'success', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), details: '创建推理服务，选择vLLM框架，启用PD分离，初始副本数3' },
  { id: 'log0002', user: '李思远', action: '启动训练任务', resource: 'YOLOv9-Sat-v1.2', resourceType: 'TrainingJob', ip: '10.50.1.62', result: 'success', timestamp: new Date(Date.now() - 4 * 24 * 3600000).toISOString(), details: '提交训练任务，优先级3，使用A100 x2，数据集SatelliteImage-Seg-2024 v1.3' },
  { id: 'log0003', user: 'admin@zhiyun.ai', action: '删除推理服务', resource: 'old-bert-service', resourceType: 'InferenceService', ip: '10.50.0.1', result: 'success', timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), details: '删除已停止的推理服务' },
  { id: 'log0004', user: '赵天成', action: '创建模型版本', resource: 'deepseek-r1-8b-weights.tar', resourceType: 'Model', ip: '10.50.1.88', result: 'success', timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString(), details: '上传模型权重文件，大小16.2GB，SHA256校验通过' },
  { id: 'log0005', user: 'wangxm@zhiyun.ai', action: '删除数据集', resource: 'ChineseMedical-QA-v2', resourceType: 'Dataset', ip: '10.50.1.33', result: 'failure', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), details: '尝试删除数据集失败：数据集已启用水印保护，需管理员审批' },
  { id: 'log0006', user: '陈昊宇', action: '修改配额策略', resource: 'algo-team', resourceType: 'Namespace', ip: '10.50.1.74', result: 'success', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), details: '申请GPU配额扩容，从16扩至32，审批通过' },
  { id: 'log0007', user: 'admin@zhiyun.ai', action: '启动弹性扩缩容', resource: 'qwen72b-prod-svc', resourceType: 'InferenceService', ip: '10.50.0.1', result: 'success', timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), details: '手动扩容推理服务副本数从2扩至3，触发原因：QPS超过弹性扩容阈值' },
  { id: 'log0008', user: '刘梦琪', action: '创建模型发布', resource: 'InternVL2-26B-ZY-Vision', resourceType: 'Model', ip: '10.50.1.91', result: 'success', timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), details: '发布模型到租户级别，启用访问控制' },
];

const auditUsers = [
  '张远航',
  '李思远',
  '赵天成',
  '陈昊宇',
  '刘梦琪',
  '王晓敏',
  '孙悦',
  '周航',
  'admin@zhiyun.ai',
  'ops@zhiyun.ai',
  'wangxm@zhiyun.ai',
  'sec_audit@zhiyun.ai',
];

const auditActionProfiles = [
  {
    action: '创建',
    resourceType: 'InferenceService',
    resources: ['qwen72b-prod-svc', 'deepseek-r1-online', 'internvl2-vision-svc', 'fin-ner-api-v3'],
    details: ['创建推理服务并绑定公网网关', '创建服务并启用自动扩缩容策略', '创建服务并开启灰度发布'],
    successRate: 93,
  },
  {
    action: '删除',
    resourceType: 'Dataset',
    resources: ['ChineseMedical-QA-v2', 'TelecomAlarm-Logs-v5', 'satellite-label-v3', 'finance-ner-train-v2'],
    details: ['删除数据集并清理对象存储索引', '删除旧版本数据集并保留元信息', '删除数据集及关联缓存副本'],
    successRate: 86,
  },
  {
    action: '修改',
    resourceType: 'Namespace',
    resources: ['algo-team', 'cv-lab', 'multimodal-lab', 'inference-team'],
    details: ['修改配额策略，提升GPU上限', '修改命名空间网络策略白名单', '修改资源限制并更新审批单'],
    successRate: 91,
  },
  {
    action: '登录',
    resourceType: 'AuthSession',
    resources: ['console-web', 'console-api', 'sso-gateway'],
    details: ['控制台登录成功，MFA校验通过', '通过SSO网关登录并签发访问令牌', '登录控制台并建立审计会话'],
    successRate: 96,
  },
  {
    action: '登出',
    resourceType: 'AuthSession',
    resources: ['console-web', 'console-api', 'sso-gateway'],
    details: ['主动登出并回收会话令牌', '会话超时自动登出', '手动退出并清理浏览器会话'],
    successRate: 99,
  },
  {
    action: '启动',
    resourceType: 'TrainingJob',
    resources: ['YOLOv9-Sat-v1.2', 'Qwen2.5-72B-SFT', 'InternVL2-DocQA-FT', 'Bert-Finance-NER-v4'],
    details: ['启动训练任务，分配A100 x4', '启动任务并挂载增量数据集', '启动训练并写入作业审计追踪ID'],
    successRate: 90,
  },
  {
    action: '停止',
    resourceType: 'InferenceService',
    resources: ['qwen72b-prod-svc', 'internvl2-vision-svc', 'asr-sichuan-online', 'ner-finance-api'],
    details: ['停止服务并保留最近一个稳定副本', '停止服务并下线流量入口', '停止服务并执行资源回收'],
    successRate: 88,
  },
];

function buildMockAuditLogs(total: number): AuditLog[] {
  const logs: AuditLog[] = [];
  const now = Date.now();

  for (let i = 0; i < total; i++) {
    const profile = auditActionProfiles[i % auditActionProfiles.length];
    const user = auditUsers[(i * 7 + 3) % auditUsers.length];
    const resource = profile.resources[(i * 5 + 1) % profile.resources.length];
    const detail = profile.details[(i * 3 + 2) % profile.details.length];
    const minuteOffset = i * 23 + (i % 6) * 11;
    const ts = new Date(now - minuteOffset * 60000);
    const ip = `10.${50 + (i % 4)}.${(i * 9) % 255}.${((i * 17) % 253) + 1}`;
    const result = ((i * 17 + 11) % 100) < profile.successRate ? 'success' : 'failure';
    const finalDetail = result === 'success'
      ? detail
      : `${detail}失败：权限不足或资源状态不满足执行条件`;

    logs.push({
      id: `log${(i + 9).toString().padStart(4, '0')}`,
      user,
      action: `${profile.action}${profile.resourceType === 'AuthSession' ? '控制台会话' : profile.resourceType === 'TrainingJob' ? '训练任务' : profile.resourceType === 'Namespace' ? '资源配置' : profile.resourceType === 'Dataset' ? '数据集' : '服务'}`,
      resource,
      resourceType: profile.resourceType,
      ip,
      result,
      timestamp: ts.toISOString(),
      details: finalDetail,
    });
  }

  return logs;
}

export const mockAuditLogs: AuditLog[] = [...seedAuditLogs, ...buildMockAuditLogs(1200 - seedAuditLogs.length)].sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
);

// ============ API Keys ============
export const mockApiKeys: ApiKey[] = [
  { id: 'ak001', name: '生产环境-QA服务', key: 'zy-sk-a1b2c3d4e5f6g7h8...', prefix: 'zy-sk-a1b2', model: 'Qwen2.5-72B-Instruct-ZY', status: 'active', createdAt: '2025-01-10', expiresAt: '2025-12-31', lastUsed: new Date(Date.now() - 5 * 60000).toISOString(), totalCalls: 284520, callLimit: 1000000, concurrencyLimit: 50, creator: '张远航' },
  { id: 'ak002', name: '测试环境-开发调试', key: 'zy-sk-x9y8z7w6v5u4...', prefix: 'zy-sk-x9y8', model: 'Qwen2.5-72B-Instruct-ZY', status: 'active', createdAt: '2025-02-01', lastUsed: new Date(Date.now() - 2 * 3600000).toISOString(), totalCalls: 5840, callLimit: 10000, concurrencyLimit: 5, creator: '张远航' },
  { id: 'ak003', name: '视觉服务-企业API', key: 'zy-sk-m3n4o5p6q7r8...', prefix: 'zy-sk-m3n4', model: 'InternVL2-26B-ZY-Vision', status: 'active', createdAt: '2025-01-25', lastUsed: new Date(Date.now() - 30 * 60000).toISOString(), totalCalls: 12380, callLimit: 50000, concurrencyLimit: 10, creator: '张远航' },
  { id: 'ak004', name: '旧版API（已停用）', key: 'zy-sk-d1e2f3g4h5i6...', prefix: 'zy-sk-d1e2', model: 'Bert-Finance-NER-ZY', status: 'disabled', createdAt: '2024-11-01', expiresAt: '2025-01-01', totalCalls: 89320, creator: '张远航' },
];

// ============ App Store ============
export const mockApps: AppSpace[] = [
  { id: 'app001', name: '智能客服对话系统', description: '基于Qwen2.5-72B的智能客服系统，支持多轮对话、知识库检索、情感分析，已接入300+企业场景。', category: 'llm', status: 'running', featured: true, pinned: false, stars: 4830, downloads: 12450, rating: 4.8, reviews: 328, creator: '张远航', organization: '中国电信AI研究院', modelName: 'Qwen2.5-72B-Instruct-ZY', tags: ['客服', 'RAG', '多轮对话'], demoUrl: 'https://demo.zhiyun.ai/customer-service', sourceRepo: 'internal/customer-service', gitRepoUrl: 'git@code.zhiyun.ai:ai/customer-service.git', gitBranch: 'main', gitCommit: 'd1f1c9a', buildStatus: 'success', buildProgress: 100, previewUrl: 'https://preview.zhiyun.ai/customer-service', runtimeCluster: 'telecom-gpu-prod', runtimeNamespace: 'app-customer', runtimeFlavor: 'A100-80G ×1 / 8C32G', runtimeEnvironment: 'production', capabilities: ['客服问答', '知识库检索', '多轮会话', '敏感词过滤', '工单建议'], runtimeLogs: [
    { time: '09:42:10', level: 'success', message: '上线发布完成，服务版本 v1.6.0 已就绪' },
    { time: '09:41:22', level: 'info', message: '健康检查通过，P95 延迟 382ms' },
    { time: '09:39:51', level: 'info', message: 'Git main@d1f1c9a 拉取完成，开始镜像构建' },
  ], healthScore: 96, lastDeployedAt: '2026-06-01 09:42', coverImage: '', createdAt: '2025-01-12', updatedAt: '2025-06-01 09:42', hasDemoTrial: true, industry: ['金融', '电商', '政务'], accessLevel: 'public', subscribeCount: 892 },
  { id: 'app002', name: '卫星图像分析平台', description: '集成YOLOv9遥感模型的图像分析平台，支持地物分类、变化检测、目标识别，提供可视化标注工具。', category: 'vision', status: 'running', featured: true, pinned: false, stars: 2140, downloads: 6820, rating: 4.6, reviews: 184, creator: '李思远', organization: '中国电信AI研究院', modelName: 'YOLOv9-Satellite-Seg', tags: ['遥感', '目标检测', '可视化'], demoUrl: 'https://demo.zhiyun.ai/satellite', sourceRepo: 'internal/satellite-analysis', gitRepoUrl: 'git@code.zhiyun.ai:ai/satellite-analysis.git', gitBranch: 'release/2026q2', gitCommit: '9ab24ce', buildStatus: 'success', buildProgress: 100, previewUrl: 'https://preview.zhiyun.ai/satellite', runtimeCluster: 'telecom-gpu-prod', runtimeNamespace: 'app-satellite', runtimeFlavor: 'A100-80G ×1 / 16C64G', runtimeEnvironment: 'production', capabilities: ['遥感识别', '变化检测', '标注辅助', '批量导出'], runtimeLogs: [
    { time: '08:16:03', level: 'success', message: '在线预览已刷新，新的镜像版本已生效' },
    { time: '08:14:44', level: 'info', message: '多模态推理网关完成灰度切流' },
    { time: '08:12:30', level: 'info', message: 'CI 构建完成，镜像已推送至仓库' },
  ], healthScore: 92, lastDeployedAt: '2026-05-31 08:16', coverImage: '', createdAt: '2025-01-20', updatedAt: '2026-05-31 08:16', hasDemoTrial: true, industry: ['国防', '农业', '城规'], accessLevel: 'tenant', subscribeCount: 312 },
  { id: 'app003', name: '金融文档智能抽取', description: '基于BERT-Finance-NER的金融文档信息抽取工具，支持年报、招股书、公告的结构化信息提取。', category: 'tool', status: 'stopped', featured: false, pinned: true, stars: 890, downloads: 3210, rating: 4.5, reviews: 76, creator: '陈昊宇', organization: '中国电信AI研究院', modelName: 'Bert-Finance-NER-ZY', tags: ['金融', 'NER', '信息抽取'], demoUrl: undefined, sourceRepo: 'internal/finance-extractor', gitRepoUrl: 'git@code.zhiyun.ai:ai/finance-extractor.git', gitBranch: 'main', gitCommit: '2ff9c11', buildStatus: 'success', buildProgress: 100, previewUrl: 'https://preview.zhiyun.ai/finance-extractor', runtimeCluster: 'telecom-gpu-prod', runtimeNamespace: 'app-finance', runtimeFlavor: 'CPU 8C32G', runtimeEnvironment: 'staging', capabilities: ['票据抽取', '实体识别', '字段校验', '批量导出'], runtimeLogs: [
    { time: '17:55:09', level: 'warning', message: '当前实例处于停止状态，预览入口暂不可用' },
    { time: '17:54:02', level: 'info', message: '最近一次发布完成，版本 v1.5.0 已冻结' },
    { time: '17:52:44', level: 'info', message: 'Git main@2ff9c11 同步成功，等待人工发布' },
  ], healthScore: 84, lastDeployedAt: '2026-05-29 17:54', coverImage: '', createdAt: '2024-11-25', updatedAt: '2026-05-29 17:55', hasDemoTrial: false, industry: ['金融'], accessLevel: 'team', subscribeCount: 156 },
  { id: 'app004', name: '多模态文档理解助手', description: '基于InternVL2的文档理解工具，支持PDF、图片、表格的智能解析与问答，可处理混合排版复杂文档。', category: 'multimodal', status: 'running', featured: true, pinned: false, stars: 3620, downloads: 8940, rating: 4.7, reviews: 247, creator: '刘梦琪', organization: '中国移动数字创新中心', modelName: 'InternVL2-26B-ZY-Vision', tags: ['文档理解', 'VLM', 'PDF解析'], demoUrl: 'https://demo.zhiyun.ai/doc-qa', sourceRepo: 'ifly/doc-assistant', gitRepoUrl: 'git@code.zhiyun.ai:ai/doc-assistant.git', gitBranch: 'main', gitCommit: '8b3aa2f', buildStatus: 'building', buildProgress: 78, previewUrl: 'https://preview.zhiyun.ai/doc-qa', runtimeCluster: 'telecom-gpu-prod', runtimeNamespace: 'app-doc-qa', runtimeFlavor: 'H100-80G ×1 / 24C128G', runtimeEnvironment: 'production', capabilities: ['文档问答', '版面理解', '表格抽取', '知识追踪'], runtimeLogs: [
    { time: '11:08:11', level: 'info', message: '构建任务正在执行，预计 6 分钟完成' },
    { time: '11:07:02', level: 'info', message: '镜像基线已拉取，开始安装依赖' },
    { time: '11:05:18', level: 'info', message: 'Git main@8b3aa2f 同步成功，准备自动构建' },
  ], healthScore: 88, lastDeployedAt: '2026-06-01 10:44', coverImage: '', createdAt: '2025-02-05', updatedAt: '2026-06-01 11:08', hasDemoTrial: true, industry: ['政务', '法律', '教育'], accessLevel: 'public', subscribeCount: 1240 },
  { id: 'app005', name: '方言语音转写工具', description: '四川方言语音识别工具，支持实时转写、文件批量处理，提供标准普通话对照输出。', category: 'audio', status: 'error', featured: false, pinned: false, stars: 620, downloads: 1830, rating: 4.3, reviews: 45, creator: '孙悦', organization: '中国联通智能研究院', modelName: 'Whisper-Large-Sichuan', tags: ['语音', '方言', '转写'], demoUrl: undefined, sourceRepo: 'bjail/dialect-asr', gitRepoUrl: 'git@code.zhiyun.ai:ai/dialect-asr.git', gitBranch: 'main', gitCommit: 'c5a3g9d', buildStatus: 'failed', buildProgress: 42, previewUrl: 'https://preview.zhiyun.ai/dialect-asr', runtimeCluster: 'telecom-dev', runtimeNamespace: 'app-asr', runtimeFlavor: 'A10-24G ×1 / 8C16G', runtimeEnvironment: 'staging', capabilities: ['实时转写', '离线转写', '批处理', '对照输出'], runtimeLogs: [
    { time: '15:21:46', level: 'error', message: '镜像构建失败：依赖拉取超时' },
    { time: '15:20:38', level: 'warning', message: '重试第 2 次，重新下载模型权重' },
    { time: '15:18:14', level: 'info', message: 'Git main@c5a3g9d 同步完成，进入构建阶段' },
  ], healthScore: 58, lastDeployedAt: '2026-05-28 15:21', coverImage: '', createdAt: '2024-12-10', updatedAt: '2026-05-28 15:21', hasDemoTrial: false, industry: ['广电', '文化'], accessLevel: 'team', subscribeCount: 98 },
  { id: 'app006', name: '代码智能审查助手', description: '集成大模型的代码质量审查工具，支持多语言代码安全扫描、规范检查、重构建议，可对接CI/CD流程。', category: 'tool', status: 'running', featured: false, pinned: true, stars: 1820, downloads: 5620, rating: 4.5, reviews: 128, creator: '王晓敏', organization: '中国电信AI研究院', modelName: 'Qwen2.5-72B-Instruct-ZY', tags: ['代码', '安全', 'DevOps'], demoUrl: 'https://demo.zhiyun.ai/code-review', sourceRepo: 'internal/code-review', gitRepoUrl: 'git@code.zhiyun.ai:ai/code-review.git', gitBranch: 'release/1.4', gitCommit: 'e7c5i1f', buildStatus: 'success', buildProgress: 100, previewUrl: 'https://preview.zhiyun.ai/code-review', runtimeCluster: 'telecom-gpu-prod', runtimeNamespace: 'app-code-review', runtimeFlavor: 'A100-80G ×1 / 12C48G', runtimeEnvironment: 'production', capabilities: ['代码扫描', '重构建议', '安全检查', 'CI 集成'], runtimeLogs: [
    { time: '13:12:02', level: 'success', message: '在线发布成功，正在接收新的审查请求' },
    { time: '13:10:44', level: 'info', message: '健康检查完成，探针全部通过' },
    { time: '13:09:31', level: 'info', message: 'Git release/1.4 同步成功，开始部署' },
  ], healthScore: 95, lastDeployedAt: '2026-05-30 13:12', coverImage: '', createdAt: '2025-01-08', updatedAt: '2026-05-30 13:12', hasDemoTrial: true, industry: ['软件', '金融科技'], accessLevel: 'public', subscribeCount: 684 },
  { id: 'app007', name: '企业知识库问答空间', description: '面向企业知识资产的模型应用空间，支持 Git 驱动的知识包更新、在线预览与灰度发布。', category: 'llm', status: 'deploying', featured: true, pinned: false, stars: 1510, downloads: 2680, rating: 4.4, reviews: 92, creator: '赵天成', organization: '中国联通智能研究院', modelName: 'Qwen2.5-14B-Instruct-ZY', tags: ['知识库', 'RAG', '灰度发布'], demoUrl: 'https://demo.zhiyun.ai/knowledge-space', sourceRepo: 'internal/knowledge-space', gitRepoUrl: 'git@code.zhiyun.ai:ai/knowledge-space.git', gitBranch: 'main', gitCommit: 'a1b2c3d', buildStatus: 'building', buildProgress: 66, previewUrl: 'https://preview.zhiyun.ai/knowledge-space', runtimeCluster: 'telecom-gpu-prod', runtimeNamespace: 'app-knowledge', runtimeFlavor: 'A100-80G ×1 / 8C32G', runtimeEnvironment: 'production', capabilities: ['知识检索', '权限隔离', '在线预览', '版本回滚'], runtimeLogs: [
    { time: '16:02:18', level: 'info', message: '灰度发布中，当前流量 30% 已切换到新版本' },
    { time: '16:01:06', level: 'info', message: '构建完成，正在执行部署编排' },
    { time: '15:58:49', level: 'info', message: 'Git main@a1b2c3d 同步成功，等待镜像发布' },
  ], healthScore: 89, lastDeployedAt: '2026-05-31 16:02', coverImage: '', createdAt: '2026-05-18', updatedAt: '2026-06-01 16:02', hasDemoTrial: true, industry: ['政务', '教育', '能源'], accessLevel: 'tenant', subscribeCount: 206 },
];

// ============ Monitoring Metrics (time series) ============
function genTimeSeries(hours: number, baseVal: number, variance: number, trend = 0) {
  const points = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    const hh = t.getHours().toString().padStart(2, '0');
    const mm = t.getMinutes().toString().padStart(2, '0');
    points.push({
      time: `${hh}:${mm}`,
      value: Math.max(0, Math.min(100, Math.round(baseVal + trend * (hours - i) + (Math.random() - 0.5) * variance))),
    });
  }
  return points;
}

function genClusterSeries(hours: number, base: number, amplitude: number, trend = 0, phase = 0) {
  const points = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    const hh = t.getHours().toString().padStart(2, '0');
    const mm = t.getMinutes().toString().padStart(2, '0');
    const step = hours - i;
    const wave = Math.sin(step * 0.55 + phase) * amplitude;
    const value = Math.max(0, Math.min(100, Math.round(base + wave + trend * step)));
    points.push({ time: `${hh}:${mm}`, value });
  }
  return points;
}

function genSawClusterSeries(hours: number, base: number, swing: number, trend = 0, stepSize = 6) {
  const points = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    const hh = t.getHours().toString().padStart(2, '0');
    const mm = t.getMinutes().toString().padStart(2, '0');
    const step = hours - i;
    const saw = ((step % stepSize) / stepSize) * swing;
    const value = Math.max(0, Math.min(100, Math.round(base + saw + trend * step)));
    points.push({ time: `${hh}:${mm}`, value });
  }
  return points;
}

export const mockMetrics = {
  gpuUtilization: genTimeSeries(24, 75, 20, 0.3),
  cpuUtilization: genTimeSeries(24, 55, 25, 0.1),
  memoryUtilization: genTimeSeries(24, 68, 10, 0.05),
  networkThroughput: genTimeSeries(24, 42, 30, 0),
  qps: genTimeSeries(24, 180, 80, 2),
  latencyP50: genTimeSeries(24, 290, 60, 0),
  latencyP99: genTimeSeries(24, 820, 200, 0),
};

const mockMetricsByCluster = {
  cls001: {
    // 主生产集群：高负载、平滑起伏、整体缓慢上行
    gpuUtilization: genClusterSeries(24, 80, 10, 0.22, 0.2),
    cpuUtilization: genClusterSeries(24, 63, 11, 0.16, 0.5),
    memoryUtilization: genClusterSeries(24, 74, 6, 0.1, 0.3),
    networkThroughput: genClusterSeries(24, 52, 8, 0.07, 0.9),
    qps: genClusterSeries(24, 78, 12, 0.28, 0.4),
    latencyP50: genClusterSeries(24, 42, 7, -0.04, 0.1),
    latencyP99: genClusterSeries(24, 61, 10, -0.03, 0.5),
  },
  cls002: {
    // 开发/弹性集群：负载较低、锯齿波动、突发抖动更明显
    gpuUtilization: genSawClusterSeries(24, 28, 24, 0.03, 5),
    cpuUtilization: genSawClusterSeries(24, 32, 22, 0.04, 4),
    memoryUtilization: genSawClusterSeries(24, 44, 14, 0.03, 6),
    networkThroughput: genSawClusterSeries(24, 24, 28, 0.02, 3),
    qps: genSawClusterSeries(24, 26, 30, 0.05, 4),
    latencyP50: genSawClusterSeries(24, 58, 16, 0.03, 5),
    latencyP99: genSawClusterSeries(24, 78, 18, 0.04, 5),
  },
} as const;

export function getMockMetricsByCluster(clusterId: string) {
  return mockMetricsByCluster[clusterId as keyof typeof mockMetricsByCluster] ?? mockMetrics;
}
