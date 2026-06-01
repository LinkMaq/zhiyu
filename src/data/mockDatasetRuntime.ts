import type { Dataset, DatasetTask, DatasetVersion } from '../types';

export type OperationType = 'view' | 'download' | 'modify' | 'share';

export interface OperationRecord {
  id: string;
  operator: string;
  type: OperationType;
  detail: string;
  at: string;
}

export interface HierarchicalTagMap {
  '业务域': string[];
  '项目阶段': string[];
  '语种': string[];
  '文本类型': string[];
}

export interface DatasetMetaSnapshot {
  version: string;
  description: string;
  tags: string[];
  tasks: DatasetTask[];
  collectionMethod: string;
  processingMethod: string;
  annotationScheme: string;
}

export interface DatasetRuntimeState {
  versions: DatasetVersion[];
  operationRecords: OperationRecord[];
  hierarchicalTags: HierarchicalTagMap;
  currentTags: string[];
  metaSnapshots: DatasetMetaSnapshot[];
}

const STORAGE_KEY = 'zhiyun:dataset-runtime-state';

function readStorage(): Record<string, DatasetRuntimeState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DatasetRuntimeState>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeStorage(state: Record<string, DatasetRuntimeState>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore local storage write failures in mock mode
  }
}

const runtimeStore = readStorage();

function buildInitialMetaSnapshot(dataset: Dataset, version: string): DatasetMetaSnapshot {
  return {
    version,
    description: dataset.description,
    tags: [...dataset.tags],
    tasks: [...dataset.task],
    collectionMethod: dataset.collectionMethod,
    processingMethod: dataset.processingMethod,
    annotationScheme: dataset.annotationScheme,
  };
}

function buildInitialRuntime(dataset: Dataset): DatasetRuntimeState {
  const hierarchicalTags: HierarchicalTagMap = {
    '业务域': [dataset.category.toUpperCase(), ...(dataset.tags.includes('电信') ? ['电信'] : [])],
    '项目阶段': dataset.status === 'archived' ? ['归档'] : ['生产'],
    '语种': [dataset.language],
    '文本类型': dataset.format ? [dataset.format] : [],
  };

  return {
    versions: [...dataset.versions],
    operationRecords: [
      { id: `op-${dataset.id}-init-1`, operator: '系统', type: 'view', detail: '数据集详情页初始化展示', at: `${dataset.updatedAt} 09:15:00` },
      { id: `op-${dataset.id}-init-2`, operator: dataset.creator, type: 'modify', detail: `发布版本 ${dataset.versions[0]?.version ?? 'v1.0'}`, at: `${dataset.updatedAt} 09:00:00` },
    ],
    hierarchicalTags,
    currentTags: [...dataset.tags],
    metaSnapshots: dataset.versions.map(version => buildInitialMetaSnapshot(dataset, version.version)),
  };
}

export function getDatasetRuntimeState(dataset: Dataset): DatasetRuntimeState {
  const existing = runtimeStore[dataset.id];
  if (existing) return existing;

  const initial = buildInitialRuntime(dataset);
  runtimeStore[dataset.id] = initial;
  writeStorage(runtimeStore);
  return initial;
}

export function updateDatasetRuntimeState(datasetId: string, updater: (prev: DatasetRuntimeState) => DatasetRuntimeState) {
  const prev = runtimeStore[datasetId];
  if (!prev) return;
  const next = updater(prev);
  runtimeStore[datasetId] = next;
  writeStorage(runtimeStore);
}
