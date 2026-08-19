import type { AppSpace } from '../types';

type MarketplaceAppSeed = Pick<
  AppSpace,
  'id' | 'name' | 'description' | 'category' | 'modelName' | 'tags' | 'creator' | 'organization' | 'industry' | 'accessLevel'
>;

const MARKETPLACE_APP_SEEDS: MarketplaceAppSeed[] = [
  { id: 'app008', name: '医疗导诊与病历摘要', description: '面向门诊导诊、病历摘要和随访记录生成的医疗智能助手。', category: 'llm', modelName: 'Qwen2.5-14B-Medical-ZY', tags: ['医疗', '导诊', '病历摘要'], creator: '周瑾', organization: '绵阳智慧医疗中心', industry: ['医疗'], accessLevel: 'tenant' },
  { id: 'app009', name: '工业缺陷视觉质检', description: '基于视觉检测模型识别产线缺陷，支持批量复检和质检报告导出。', category: 'vision', modelName: 'YOLOv10-Industrial-ZY', tags: ['工业', '质检', '缺陷检测'], creator: '何立', organization: '西南工业智能实验室', industry: ['工业'], accessLevel: 'tenant' },
  { id: 'app010', name: '政务热线工单助手', description: '面向 12345 热线的诉求分类、工单摘要、派单建议与知识检索。', category: 'llm', modelName: 'Qwen2.5-32B-Gov-ZY', tags: ['政务', '热线', '工单'], creator: '宋嘉', organization: '绵阳政务服务中心', industry: ['政务'], accessLevel: 'public' },
  { id: 'app011', name: '高校教学备课助手', description: '支持教案生成、题目设计、作业批改建议和课程知识库问答。', category: 'llm', modelName: 'Qwen2.5-14B-Edu-ZY', tags: ['教育', '教案', '课程助手'], creator: '黄晓彤', organization: '西南科技大学', industry: ['教育'], accessLevel: 'public' },
  { id: 'app012', name: '能源设备预测运维', description: '聚合设备时序数据，提供故障预警、根因分析和维修策略建议。', category: 'workflow', modelName: 'TS-Transformer-Energy-ZY', tags: ['能源', '预测运维', '时序'], creator: '蒋宇', organization: '川西能源数智中心', industry: ['能源', '工业'], accessLevel: 'team' },
  { id: 'app013', name: '智慧交通事件检测', description: '融合路侧视频和文本告警，实现拥堵识别、事故检测和调度辅助。', category: 'vision', modelName: 'InternVL-Transport-ZY', tags: ['交通', '视频分析', '事件检测'], creator: '许晨', organization: '绵阳交通大脑', industry: ['交通'], accessLevel: 'tenant' },
  { id: 'app014', name: '零售导购与选品助手', description: '以商品知识、用户画像和库存状态驱动导购问答与选品建议。', category: 'llm', modelName: 'Qwen2.5-7B-Retail-ZY', tags: ['零售电商', '导购', '推荐'], creator: '高颖', organization: '西南零售创新中心', industry: ['零售电商'], accessLevel: 'public' },
  { id: 'app015', name: '法律合同风险审阅', description: '识别合同条款风险、提取关键义务并输出可追溯的修订建议。', category: 'multimodal', modelName: 'InternVL2-Legal-ZY', tags: ['法律', '合同', '风险审阅'], creator: '林哲', organization: '天府法务科技中心', industry: ['法律', '金融'], accessLevel: 'team' },
  { id: 'app016', name: '农业病虫害识别', description: '识别作物叶片病害与虫害，提供田间处置建议和巡检任务闭环。', category: 'vision', modelName: 'AgriVision-Plant-ZY', tags: ['农业', '病虫害', '巡检'], creator: '冯乐', organization: '四川农业数智平台', industry: ['农业'], accessLevel: 'tenant' },
  { id: 'app017', name: '文旅智能讲解员', description: '针对景区、博物馆和城市导览提供多语种问答与语音讲解服务。', category: 'multimodal', modelName: 'Qwen2.5-VL-Culture-ZY', tags: ['文旅广电', '讲解', '多语种'], creator: '吴凡', organization: '绵阳文旅集团', industry: ['文旅广电'], accessLevel: 'public' },
  { id: 'app018', name: '保险理赔材料审核', description: '自动审核理赔材料完整性，标记高风险字段并辅助案件分流。', category: 'multimodal', modelName: 'Insurance-DocVLM-ZY', tags: ['保险', '理赔', '材料审核'], creator: '梁珊', organization: '西南保险科技中心', industry: ['保险', '金融'], accessLevel: 'tenant' },
  { id: 'app019', name: '供应链风险雷达', description: '汇总订单、物流和舆情信号，提前发现供应链中断与履约风险。', category: 'workflow', modelName: 'SupplyChain-Risk-ZY', tags: ['物流供应链', '风险预警', '分析'], creator: '杜翔', organization: '川渝供应链协同中心', industry: ['物流供应链'], accessLevel: 'team' },
  { id: 'app020', name: '科研文献洞察助手', description: '支持科研文献检索、实验方法对比、证据链归纳与研究路线梳理。', category: 'llm', modelName: 'Qwen2.5-Research-ZY', tags: ['科研', '文献', '知识检索'], creator: '沈怡', organization: '绵阳科技城创新中心', industry: ['科研', '医疗'], accessLevel: 'public' },
];

const MARKETPLACE_APP_STATUSES: AppSpace['status'][] = [
  'running', 'running', 'deploying', 'running', 'running', 'deploying', 'running',
  'stopped', 'running', 'running', 'deploying', 'running', 'stopped',
];

function buildMarketplaceApp(seed: MarketplaceAppSeed, index: number): AppSpace {
  const slug = seed.id.replace('app', '');
  const status = MARKETPLACE_APP_STATUSES[index];
  const month = String((index % 5) + 1).padStart(2, '0');
  const gitBranch = index % 3 === 0 ? 'release/1.0' : 'main';
  const isCpuWorkflow = seed.category === 'workflow';

  return {
    ...seed,
    status,
    featured: index === 0 || index === 5,
    pinned: index === 4 || index === 10,
    stars: 680 + index * 173,
    downloads: 1580 + index * 634,
    rating: Number((4.2 + (index % 7) * 0.1).toFixed(1)),
    reviews: 48 + index * 19,
    demoUrl: index % 3 === 0 ? `https://demo.zhiyun.ai/${slug}` : undefined,
    sourceRepo: `showcase/${slug}-${seed.category}`,
    gitRepoUrl: `git@code.zhiyun.ai:showcase/${slug}-${seed.category}.git`,
    gitBranch,
    gitCommit: `f${slug}a${index + 3}c`,
    buildStatus: status === 'deploying' ? 'building' : 'success',
    buildProgress: status === 'deploying' ? 64 + (index % 3) * 10 : 100,
    previewUrl: `https://preview.zhiyun.ai/${slug}`,
    runtimeCluster: index % 4 === 0 ? 'telecom-dev' : 'telecom-gpu-prod',
    runtimeNamespace: `app-${slug}`,
    runtimeFlavor: isCpuWorkflow ? 'CPU 8C32G' : index % 4 === 0 ? 'A10-24G ×1 / 8C32G' : 'A100-80G ×1 / 8C32G',
    runtimeEnvironment: index % 4 === 0 ? 'staging' : 'production',
    capabilities: seed.tags,
    runtimeLogs: [
      { time: '10:24:08', level: status === 'deploying' ? 'info' : 'success', message: status === 'deploying' ? '新版本构建中，正在进行运行时依赖校验' : '应用服务健康，最近一次探针检查通过' },
      { time: '10:22:31', level: 'info', message: `Git ${gitBranch} 分支已同步，完成模板参数注入` },
      { time: '10:20:44', level: 'info', message: '行业知识配置已加载，等待新的业务请求' },
    ],
    healthScore: status === 'stopped' ? 82 : 88 + (index % 6),
    lastDeployedAt: `2026-${month}-${String(12 + index).padStart(2, '0')} 10:24`,
    coverImage: '',
    createdAt: `2025-${month}-${String(8 + index).padStart(2, '0')}`,
    updatedAt: `2026-${month}-${String(12 + index).padStart(2, '0')} 10:24`,
    hasDemoTrial: index % 3 === 0,
    subscribeCount: 120 + index * 57,
  };
}

export const mockAppMarketplaceExtensions = MARKETPLACE_APP_SEEDS.map(buildMarketplaceApp);
