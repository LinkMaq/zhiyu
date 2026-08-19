import type { AppSpace } from '../types';

export const APP_INDUSTRIES = [
  '全行业',
  '金融与商业',
  '政务与公共服务',
  '工业与能源',
  '医疗与生命科学',
  '教育与科研',
] as const;

export type AppIndustry = (typeof APP_INDUSTRIES)[number];

const INDUSTRY_GROUP_MAP: Record<string, AppIndustry> = {
  '金融与商业': '金融与商业', 金融: '金融与商业', 金融科技: '金融与商业', 保险: '金融与商业', 电商: '金融与商业', 零售电商: '金融与商业', 法律: '金融与商业', 软件: '金融与商业', 通信: '金融与商业', 物流供应链: '金融与商业',
  '政务与公共服务': '政务与公共服务', 政务: '政务与公共服务', 国防: '政务与公共服务', 交通: '政务与公共服务', 城规: '政务与公共服务', 文旅广电: '政务与公共服务', 广电: '政务与公共服务', 文化: '政务与公共服务',
  '工业与能源': '工业与能源', 工业: '工业与能源', 能源: '工业与能源', 农业: '工业与能源',
  '医疗与生命科学': '医疗与生命科学', 医疗: '医疗与生命科学',
  '教育与科研': '教育与科研', 教育: '教育与科研', 科研: '教育与科研',
  全行业: '全行业',
};

export function resolveAppIndustry(industry?: string[]): AppIndustry {
  return INDUSTRY_GROUP_MAP[industry?.[0] ?? '全行业'] ?? '全行业';
}

export function appMatchesIndustry(industry: string[] | undefined, target: AppIndustry) {
  return industry?.some(item => resolveAppIndustry([item]) === target) ?? false;
}

export function getAppIndustryGroups(apps: AppSpace[]) {
  return APP_INDUSTRIES.slice(1).map(name => ({
    name,
    count: apps.filter(app => appMatchesIndustry(app.industry, name)).length,
  }));
}

export interface ApplicationTemplateConfig {
  category: AppSpace['category'];
  industry: AppIndustry;
  modelName: string;
  sourceRepo: string;
  gitBranch: string;
  cluster: string;
  cpu: string;
  memory: string;
  gpuType: string;
  gpuCount: string;
  runtimeEnvironment: string;
  capabilities: string;
  description: string;
}

export interface ApplicationTemplate extends ApplicationTemplateConfig {
  id: string;
  name: string;
  status: 'enabled' | 'disabled';
  source: 'platform' | 'user';
  updatedAt: string;
}

export const mockApplicationTemplates: ApplicationTemplate[] = [
  { id: 'app-tpl-01', name: '企业知识问答', industry: '全行业', category: 'llm', description: '带检索增强、权限隔离和在线预览的知识库问答应用。', modelName: 'Qwen2.5-14B-Instruct-ZY', sourceRepo: 'templates/enterprise-rag', gitBranch: 'main', cluster: 'telecom-gpu-prod', cpu: '8', memory: '32Gi', gpuType: 'A100-80G', gpuCount: '1', runtimeEnvironment: 'production', capabilities: '知识检索、权限隔离、在线预览', status: 'enabled', source: 'platform', updatedAt: '2026-08-12' },
  { id: 'app-tpl-02', name: '政务热线助手', industry: '政务与公共服务', category: 'llm', description: '用于热线摘要、工单分类、派单建议和政策知识检索。', modelName: 'Qwen2.5-32B-Gov-ZY', sourceRepo: 'templates/gov-hotline', gitBranch: 'main', cluster: 'telecom-gpu-prod', cpu: '12', memory: '48Gi', gpuType: 'A100-80G', gpuCount: '1', runtimeEnvironment: 'production', capabilities: '工单分类、诉求摘要、政策检索', status: 'enabled', source: 'platform', updatedAt: '2026-08-10' },
  { id: 'app-tpl-03', name: '工业视觉质检', industry: '工业与能源', category: 'vision', description: '标准化产线缺陷检测、批量复检与质检报告应用基线。', modelName: 'YOLOv10-Industrial-ZY', sourceRepo: 'templates/industrial-vision', gitBranch: 'main', cluster: 'telecom-gpu-prod', cpu: '8', memory: '32Gi', gpuType: 'A10-24G', gpuCount: '1', runtimeEnvironment: 'production', capabilities: '缺陷识别、批量复检、报告导出', status: 'enabled', source: 'platform', updatedAt: '2026-08-08' },
  { id: 'app-tpl-04', name: '医疗文档辅助', industry: '医疗与生命科学', category: 'multimodal', description: '支持医疗文档解析、病历摘要和受控知识问答的应用模板。', modelName: 'InternVL2-Medical-ZY', sourceRepo: 'templates/medical-docs', gitBranch: 'main', cluster: 'telecom-gpu-prod', cpu: '16', memory: '64Gi', gpuType: 'H100-80G', gpuCount: '1', runtimeEnvironment: 'staging', capabilities: '文档解析、病历摘要、脱敏审查', status: 'enabled', source: 'platform', updatedAt: '2026-08-06' },
  { id: 'app-tpl-05', name: '金融材料抽取', industry: '金融与商业', category: 'multimodal', description: '面向金融报告、票据和合同的结构化抽取与字段复核。', modelName: 'Bert-Finance-NER-ZY', sourceRepo: 'templates/finance-extract', gitBranch: 'release/1.0', cluster: 'telecom-dev', cpu: '8', memory: '32Gi', gpuType: 'A10-24G', gpuCount: '1', runtimeEnvironment: 'staging', capabilities: '字段抽取、实体识别、批量导出', status: 'enabled', source: 'platform', updatedAt: '2026-08-05' },
  { id: 'app-tpl-06', name: '能源预测运维', industry: '工业与能源', category: 'workflow', description: '包含时序预警、任务编排和故障处置闭环的运维应用模板。', modelName: 'TS-Transformer-Energy-ZY', sourceRepo: 'templates/energy-ops', gitBranch: 'main', cluster: 'telecom-dev', cpu: '8', memory: '32Gi', gpuType: 'CPU-Only', gpuCount: '0', runtimeEnvironment: 'production', capabilities: '时序预警、根因分析、工单编排', status: 'enabled', source: 'platform', updatedAt: '2026-08-02' },
];

export function getTemplateConfig(template: ApplicationTemplate): ApplicationTemplateConfig {
  return {
    category: template.category,
    industry: template.industry,
    modelName: template.modelName,
    sourceRepo: template.sourceRepo,
    gitBranch: template.gitBranch,
    cluster: template.cluster,
    cpu: template.cpu,
    memory: template.memory,
    gpuType: template.gpuType,
    gpuCount: template.gpuCount,
    runtimeEnvironment: template.runtimeEnvironment,
    capabilities: template.capabilities,
    description: template.description,
  };
}
