import type { Model, ModelAccessLevel, ModelCategory, ModelFramework, ModelVersion } from '../types';
import { mockModels } from './mockModels';

const STORAGE_KEY = 'zhiyun:model-runtime';

function cloneModels(models: Model[]) {
  return models.map(model => ({
    ...model,
    tags: [...model.tags],
    labels: [...model.labels],
    hardwareDep: [...model.hardwareDep],
    supportedTasks: [...model.supportedTasks],
    versions: model.versions.map(version => ({
      ...version,
      hyperparams: { ...version.hyperparams },
      lineageDataset: version.lineageDataset ? [...version.lineageDataset] : [version.trainDataset],
      lineageCodeBranch: version.lineageCodeBranch ?? 'main',
      lineagePipeline: version.lineagePipeline ?? '训练流水线',
      metrics: version.metrics
        ? { ...version.metrics }
        : {
            accuracy: version.accuracy,
            f1: version.f1,
            bleu: version.bleu,
            loss: version.loss,
          },
    })),
    taxonomy: model.taxonomy ?? {
      businessDomain: '通用',
      priority: model.featured ? '高' : '中',
      region: '全国',
      subTags: model.labels.length > 0 ? [...model.labels] : ['标准'],
    },
    industry: model.industry ?? '通用行业',
    precisionMetrics: model.precisionMetrics ?? {
      accuracy: model.versions[0]?.accuracy,
      f1: model.versions[0]?.f1,
      bleu: model.versions[0]?.bleu,
      loss: model.versions[0]?.loss,
      latencyMs: 120,
      throughputQps: 18,
    },
    shareRules: model.shareRules ? [...model.shareRules] : [],
  }));
}

export function getRuntimeModels(): Model[] {
  if (typeof window === 'undefined') return cloneModels(mockModels);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneModels(mockModels);
    const parsed = JSON.parse(raw) as Model[];
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneModels(mockModels);
    return parsed;
  } catch {
    return cloneModels(mockModels);
  }
}

export function saveRuntimeModels(models: Model[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch {
    // ignore storage failure in mock mode
  }
}

interface ImportedModelInput {
  name: string;
  description: string;
  source: string;
  category: ModelCategory;
  framework: ModelFramework;
  accessLevel: ModelAccessLevel;
  encrypted: boolean;
  creator: string;
  organization: string;
  extension: string;
  sizeBytes: number;
  fileDigest: string;
  encryptionAlgorithm: 'aes' | 'sm4';
}

function formatBytes(bytes: number) {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`;
  if (bytes >= kb) return `${(bytes / kb).toFixed(2)} KB`;
  return `${bytes} B`;
}

function nextModelId(models: Model[]) {
  const max = models
    .map(model => Number(model.id.replace(/^m/, '')))
    .filter(num => Number.isFinite(num))
    .reduce((prev, curr) => Math.max(prev, curr), 0);
  return `m${String(max + 1).padStart(3, '0')}`;
}

export function appendImportedModel(input: ImportedModelInput): Model {
  const models = getRuntimeModels();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const initialVersion: ModelVersion = {
    version: 'v1.0.0',
    createdAt: today,
    parameters: '待解析',
    accuracy: 0,
    loss: 0,
    commitHash: input.fileDigest.slice(0, 8),
    trainDataset: '未绑定',
    hyperparams: {
      importSource: input.source,
      fileExt: input.extension,
      fileSize: formatBytes(input.sizeBytes),
      encryption: input.encryptionAlgorithm === 'sm4' ? 'SM4-GCM' : 'AES-256-GCM',
    },
    hardware: '待评估',
    trainingTime: '未训练',
    notes: `模型通过本地文件导入，摘要 ${input.fileDigest}`,
    lineageDataset: ['导入文件样本集'],
    lineageCodeBranch: 'import',
    lineagePipeline: '本地导入流水线',
    metrics: {
      accuracy: 0,
      loss: 0,
      latencyMs: 0,
      throughputQps: 0,
    },
  };

  const newModel: Model = {
    id: nextModelId(models),
    name: input.name,
    description: input.description || '本地上传导入模型',
    category: input.category,
    framework: input.framework,
    status: 'available',
    accessLevel: input.accessLevel,
    parameters: '待解析',
    architecture: '待识别',
    license: '企业内部',
    tags: ['本地导入', input.extension.toUpperCase()],
    labels: [input.encrypted ? '加密保护' : '标准保护'],
    creator: input.creator,
    organization: input.organization,
    source: `本地文件上传(${input.source})`,
    createdAt: today,
    updatedAt: today,
    downloads: 0,
    stars: 0,
    rating: 5,
    reviews: 0,
    hardwareDep: ['待评估'],
    supportedTasks: ['待配置'],
    versions: [initialVersion],
    featured: false,
    encrypted: input.encrypted,
    exportable: true,
    industry: '通用行业',
    taxonomy: {
      businessDomain: '通用',
      priority: '中',
      region: '全国',
      subTags: ['本地导入'],
    },
    precisionMetrics: {
      accuracy: 0,
      loss: 0,
      latencyMs: 0,
      throughputQps: 0,
    },
    shareRules: [],
  };

  const next = [newModel, ...models];
  saveRuntimeModels(next);
  return newModel;
}
