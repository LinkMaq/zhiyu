import { mockInferenceServices } from './mockInference';
import type { InferenceService } from '../types';

export type RuntimeBatchStatus = 'running' | 'completed' | 'failed' | 'queued';

export interface RuntimeBatchJob {
  id: string;
  name: string;
  model: string;
  dataset: string;
  totalItems: number;
  doneItems: number;
  status: RuntimeBatchStatus;
  gpuType: string;
  gpuCount: number;
  concurrency: number;
  createdAt: string;
  finishedAt?: string;
  creator: string;
  outputPath: string;
  schedule: string;
  outputFormat: string;
  callback?: string;
}

const DEFAULT_BATCH_JOBS: RuntimeBatchJob[] = [
  {
    id: 'bj1',
    name: '金融报告批量摘要提取',
    model: 'Qwen2.5-72B-Instruct-ZY',
    dataset: 'FinanceReport-NER',
    totalItems: 12500,
    doneItems: 12500,
    status: 'completed',
    gpuType: 'A100 80GB',
    gpuCount: 4,
    concurrency: 32,
    createdAt: '2025-01-08T09:00:00Z',
    finishedAt: '2025-01-08T14:22:00Z',
    creator: '张远航',
    outputPath: '/outputs/finance-summary-20250108/',
    schedule: '立即执行',
    outputFormat: 'jsonl',
  },
  {
    id: 'bj2',
    name: '客服对话意图分类批处理',
    model: 'ERNIE-3.0-Contract-ZY',
    dataset: 'ChineseMedical-QA-v2',
    totalItems: 38000,
    doneItems: 21000,
    status: 'running',
    gpuType: 'A100 80GB',
    gpuCount: 2,
    concurrency: 16,
    createdAt: '2025-01-15T10:30:00Z',
    creator: '李建文',
    outputPath: '/outputs/intent-cls-20250115/',
    schedule: '每天 01:00',
    outputFormat: 'parquet',
    callback: 'https://notify.zhiyun.ai/hooks/batch-ops',
  },
  {
    id: 'bj3',
    name: '网络设备图像批量检测',
    model: 'ViT-B16-NetEquip-Defect',
    dataset: 'TelecomEquip-Images',
    totalItems: 5000,
    doneItems: 0,
    status: 'queued',
    gpuType: 'A100 80GB',
    gpuCount: 2,
    concurrency: 8,
    createdAt: '2025-01-16T08:00:00Z',
    creator: '陈志远',
    outputPath: '/outputs/defect-detect-20250116/',
    schedule: '峰谷窗口自动调度',
    outputFormat: 'json',
  },
  {
    id: 'bj4',
    name: '合同条款风险识别批处理',
    model: 'ERNIE-3.0-Contract-ZY',
    dataset: 'LegalContract-ZY',
    totalItems: 3200,
    doneItems: 800,
    status: 'failed',
    gpuType: 'A100 80GB',
    gpuCount: 1,
    concurrency: 4,
    createdAt: '2025-01-14T15:00:00Z',
    creator: '王静芳',
    outputPath: '/outputs/contract-risk-20250114/',
    schedule: '立即执行',
    outputFormat: 'jsonl',
  },
];

let inferenceServicesRuntime: InferenceService[] | null = null;
let batchJobsRuntime: RuntimeBatchJob[] | null = null;

function cloneInferenceServices(services: InferenceService[]): InferenceService[] {
  return services.map(service => ({ ...service }));
}

function cloneBatchJobs(jobs: RuntimeBatchJob[]): RuntimeBatchJob[] {
  return jobs.map(job => ({ ...job }));
}

export function getRuntimeInferenceServices(): InferenceService[] {
  if (!inferenceServicesRuntime) {
    inferenceServicesRuntime = cloneInferenceServices(mockInferenceServices);
  }
  return cloneInferenceServices(inferenceServicesRuntime);
}

export function saveRuntimeInferenceServices(services: InferenceService[]) {
  inferenceServicesRuntime = cloneInferenceServices(services);
}

export function appendRuntimeInferenceService(service: InferenceService): InferenceService {
  const list = getRuntimeInferenceServices();
  const next = [service, ...list];
  saveRuntimeInferenceServices(next);
  return service;
}

export function getRuntimeBatchJobs(): RuntimeBatchJob[] {
  if (!batchJobsRuntime) {
    batchJobsRuntime = cloneBatchJobs(DEFAULT_BATCH_JOBS);
  }
  return cloneBatchJobs(batchJobsRuntime);
}

export function saveRuntimeBatchJobs(jobs: RuntimeBatchJob[]) {
  batchJobsRuntime = cloneBatchJobs(jobs);
}

export function appendRuntimeBatchJob(job: RuntimeBatchJob): RuntimeBatchJob {
  const list = getRuntimeBatchJobs();
  const next = [job, ...list];
  saveRuntimeBatchJobs(next);
  return job;
}
