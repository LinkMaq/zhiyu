import type { DevAssetType, DevInstance, DevInstanceMount } from '../types';
import { mockInstances } from './mockInstances';

const STORAGE_KEY = 'zhiyun:instance-runtime';

function defaultPath(type: DevAssetType, name: string) {
  const normalized = name.toLowerCase().replace(/\s+/g, '-');
  if (type === 'dataset') return `/mnt/datasets/${normalized}`;
  if (type === 'model') return `/mnt/models/${normalized}`;
  if (type === 'environment') return `/opt/envs/${normalized}`;
  return `/opt/toolkits/${normalized}`;
}

function buildMount(type: DevAssetType, name: string, index: number): DevInstanceMount {
  return {
    id: `${type}-${index + 1}-${name}`,
    type,
    name,
    mountPath: defaultPath(type, name),
    accessMode: type === 'dataset' || type === 'model' ? 'ro' : 'rw',
  };
}

function normalizeInstance(instance: DevInstance): DevInstance {
  const mounts = instance.mounts && instance.mounts.length > 0
    ? instance.mounts.map(item => ({ ...item }))
    : [
        ...(instance.mountedDatasets ?? []).map((item, index) => buildMount('dataset', item, index)),
        ...(instance.mountedModels ?? []).map((item, index) => buildMount('model', item, index)),
        ...((instance.mountedEnvironments ?? []).map((item, index) => buildMount('environment', item, index))),
      ];

  return {
    ...instance,
    mounts,
    mountedDatasets: mounts.filter(item => item.type === 'dataset').map(item => item.name),
    mountedModels: mounts.filter(item => item.type === 'model').map(item => item.name),
    mountedEnvironments: mounts.filter(item => item.type === 'environment').map(item => item.name),
  };
}

export function getRuntimeInstances(): DevInstance[] {
  if (typeof window === 'undefined') return mockInstances.map(item => normalizeInstance(item));
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockInstances.map(item => normalizeInstance(item));
    const parsed = JSON.parse(raw) as DevInstance[];
    if (!Array.isArray(parsed) || parsed.length === 0) return mockInstances.map(item => normalizeInstance(item));
    return parsed.map(item => normalizeInstance(item));
  } catch {
    return mockInstances.map(item => normalizeInstance(item));
  }
}

export function saveRuntimeInstances(instances: DevInstance[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
  } catch {
    // ignore storage failures in local mock mode
  }
}

interface CreateInstanceInput {
  name: string;
  image: string;
  gpuType: string;
  gpuCount: number;
  storage: string;
  mounts: DevInstanceMount[];
  creator: string;
  namespace: string;
}

function nextInstanceId(instances: DevInstance[]) {
  const max = instances
    .map(item => Number(item.id.replace(/^ins/, '')))
    .filter(num => Number.isFinite(num))
    .reduce((prev, curr) => Math.max(prev, curr), 0);
  return `ins${String(max + 1).padStart(3, '0')}`;
}

export function appendRuntimeInstance(input: CreateInstanceInput): DevInstance {
  const instances = getRuntimeInstances();
  const now = new Date().toISOString();
  const id = nextInstanceId(instances);

  const gpu = input.gpuType;
  const cpuByGpuCount = Math.max(8, input.gpuCount * 8);
  const memoryByGpuCount = `${Math.max(32, input.gpuCount * 32)}Gi`;
  const mounts = input.mounts.map(item => ({ ...item }));

  const newInstance: DevInstance = {
    id,
    name: input.name,
    image: input.image,
    status: 'starting',
    gpuType: gpu,
    gpuCount: input.gpuCount,
    cpu: cpuByGpuCount,
    memory: memoryByGpuCount,
    storage: `${input.storage}Gi`,
    createdAt: now,
    lastActive: now,
    jupyterUrl: `https://dev.zhiyun.ai/jupyter/${id}`,
    sshPort: 30100 + instances.length,
    mounts,
    mountedDatasets: mounts.filter(item => item.type === 'dataset').map(item => item.name),
    mountedModels: mounts.filter(item => item.type === 'model').map(item => item.name),
    mountedEnvironments: mounts.filter(item => item.type === 'environment').map(item => item.name),
    idleMinutes: 0,
    creator: input.creator,
    namespace: input.namespace,
  };

  const next = [newInstance, ...instances];
  saveRuntimeInstances(next);
  return newInstance;
}
