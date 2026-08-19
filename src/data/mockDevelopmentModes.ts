export interface WebEditorFile {
  id: string;
  path: string;
  name: string;
  language: 'python' | 'yaml' | 'markdown' | 'json';
  content: string;
  modifiedAt: string;
  changed?: boolean;
}

export interface VSCodeConnectionProfile {
  id: string;
  name: string;
  type: 'Remote SSH' | 'Dev Container' | 'VS Code Tunnel';
  instanceId: string;
  workspace: string;
  branch: string;
  status: 'connected' | 'ready' | 'offline';
  command: string;
  launchUrl: string;
  extensions: string[];
  lastActive: string;
}

export interface RemoteWorkspace {
  id: string;
  name: string;
  repository: string;
  branch: string;
  template: string;
  status: 'running' | 'starting' | 'stopped';
  runtime: string;
  resources: string;
  location: string;
  collaborators: string[];
  lastActive: string;
  instanceId?: string;
}

export interface DevelopmentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  imageLabel: string;
  gpuType: string;
  gpuCount: string;
  storage: string;
  repository: string;
  branch: string;
  startupCommand: string;
  defaultName: string;
  recommendedAssetIds: string[];
  tags: string[];
}

export const mockDevelopmentTemplates: DevelopmentTemplate[] = [
  {
    id: 'tpl-pytorch', name: 'PyTorch CUDA 通用开发', category: '通用训练', description: '面向深度学习训练、调试与 Notebook 实验的通用基线。',
    image: 'pytorch-cuda12', imageLabel: 'PyTorch 2.3 + CUDA 12.1', gpuType: 'A100-80G', gpuCount: '1', storage: '100',
    repository: 'ai-platform/model-lab', branch: 'main', startupCommand: 'jupyter lab --ip=0.0.0.0 --no-browser', defaultName: 'pytorch-experiment', recommendedAssetIds: ['env001', 'tk001'], tags: ['PyTorch', 'CUDA 12.1', 'Jupyter'],
  },
  {
    id: 'tpl-qwen-lora', name: 'Qwen LoRA 微调', category: '大模型训练', description: '内置 Qwen 微调依赖与常用训练工具，适合领域适配和评测。',
    image: 'qwen-finetune', imageLabel: 'Qwen2.5 微调专用环境', gpuType: 'A100-80G', gpuCount: '2', storage: '300',
    repository: 'ai-platform/qwen-domain-finetune', branch: 'main', startupCommand: 'accelerate launch scripts/train_lora.py', defaultName: 'qwen-lora-finetune', recommendedAssetIds: ['m001', 'ds001', 'tk001'], tags: ['Qwen2.5', 'LoRA', 'BF16'],
  },
  {
    id: 'tpl-rag', name: 'RAG 知识库服务', category: '应用开发', description: '用于检索增强、向量索引、服务联调与知识库评估。',
    image: 'rag-service', imageLabel: 'RAG + LangChain 服务环境', gpuType: 'A10-24G', gpuCount: '1', storage: '150',
    repository: 'knowledge/rag-service', branch: 'develop', startupCommand: 'uvicorn app.main:app --host 0.0.0.0 --port 8000', defaultName: 'rag-service-dev', recommendedAssetIds: ['m010', 'ds009', 'tk001'], tags: ['RAG', 'API', 'Vector DB'],
  },
  {
    id: 'tpl-vllm', name: 'vLLM 推理调试', category: '模型服务', description: '用于并发推理、吞吐压测、流式接口与模型服务性能调优。',
    image: 'vllm-inference', imageLabel: 'vLLM 推理环境', gpuType: 'H100-80G', gpuCount: '2', storage: '200',
    repository: 'platform/model-serving', branch: 'release/1.4', startupCommand: 'vllm serve /mnt/models/qwen --tensor-parallel-size 2', defaultName: 'vllm-serving-debug', recommendedAssetIds: ['m001', 'env003'], tags: ['vLLM', 'OpenAI API', '压测'],
  },
  {
    id: 'tpl-vision', name: '视觉检测与分割', category: '视觉 AI', description: '基于 YOLOv9 与 CV 工具链，支持数据标注、训练与可视化评估。',
    image: 'cv-yolov9', imageLabel: 'CV/YOLOv9 视觉环境', gpuType: 'A100-80G', gpuCount: '1', storage: '250',
    repository: 'vision/quality-inspection', branch: 'main', startupCommand: 'python scripts/train_detector.py', defaultName: 'vision-inspection-dev', recommendedAssetIds: ['m005', 'ds002', 'tk002'], tags: ['YOLOv9', 'CV', 'Segmentation'],
  },
  {
    id: 'tpl-multimodal', name: '多模态模型实验室', category: '多模态', description: '覆盖图文理解、VLM 微调与跨模态评测的隔离实验环境。',
    image: 'multimodal-lab', imageLabel: 'Transformers 多模态实验环境', gpuType: 'H100-80G', gpuCount: '4', storage: '500',
    repository: 'vision/multimodal-quality', branch: 'experiment/vlm-eval', startupCommand: 'python scripts/run_multimodal_eval.py', defaultName: 'multimodal-lab', recommendedAssetIds: ['m001', 'm005', 'ds002', 'tk001'], tags: ['VLM', 'Transformers', '多卡'],
  },
  {
    id: 'tpl-tensorflow', name: 'TensorFlow 工业建模', category: '通用训练', description: '面向结构化数据、时序预测与 TensorFlow 模型调试。',
    image: 'tensorflow-2.16', imageLabel: 'TensorFlow 2.16 + CUDA 12.1', gpuType: 'A10-24G', gpuCount: '1', storage: '120',
    repository: 'industry/forecasting-model', branch: 'main', startupCommand: 'python -m trainer.run', defaultName: 'tensorflow-model-dev', recommendedAssetIds: ['env002', 'tk001'], tags: ['TensorFlow', 'Keras', '时序预测'],
  },
  {
    id: 'tpl-data-science', name: '数据科学 Notebook', category: '数据分析', description: '轻量数据处理、可视化与特征工程，适合快速探索。',
    image: 'python-jupyter', imageLabel: 'Python 3.11 + JupyterLab', gpuType: 'CPU-Only', gpuCount: '0', storage: '80',
    repository: 'data/analysis-sandbox', branch: 'main', startupCommand: 'jupyter lab --ip=0.0.0.0 --no-browser', defaultName: 'data-science-notebook', recommendedAssetIds: ['ds001'], tags: ['Python', 'Jupyter', 'Pandas'],
  },
  {
    id: 'tpl-ray', name: 'Ray 分布式实验', category: '分布式计算', description: '用于并行训练、强化学习与任务编排的 Ray 开发集群入口。',
    image: 'ray-distributed', imageLabel: 'Ray + PyTorch 分布式环境', gpuType: 'A100-80G', gpuCount: '4', storage: '300',
    repository: 'research/ray-training-lab', branch: 'main', startupCommand: 'ray start --head && python jobs/launch.py', defaultName: 'ray-distributed-lab', recommendedAssetIds: ['env001', 'tk001'], tags: ['Ray', 'Distributed', 'RL'],
  },
  {
    id: 'tpl-mlops', name: 'MLOps 流水线调试', category: '工程效能', description: '用于训练流水线、模型注册、部署脚本和 CI/CD 配置联调。',
    image: 'mlops-toolchain', imageLabel: 'MLOps + Kubectl 工具环境', gpuType: 'CPU-Only', gpuCount: '0', storage: '100',
    repository: 'platform/mlops-pipelines', branch: 'develop', startupCommand: 'make dev-pipeline', defaultName: 'mlops-pipeline-dev', recommendedAssetIds: ['tk001'], tags: ['MLOps', 'CI/CD', 'Kubernetes'],
  },
  {
    id: 'tpl-web-fullstack', name: '全栈 AI 应用开发', category: '应用开发', description: '包含 Node.js、Python API 与 Web 编辑器工具链，适合 AI 应用联调。',
    image: 'web-ai-fullstack', imageLabel: 'Node.js + Python AI 应用环境', gpuType: 'T4-16G', gpuCount: '1', storage: '120',
    repository: 'apps/ai-assistant-web', branch: 'feature/copilot-ui', startupCommand: 'pnpm dev', defaultName: 'ai-app-fullstack-dev', recommendedAssetIds: ['m010', 'tk001'], tags: ['Node.js', 'FastAPI', 'Web IDE'],
  },
  {
    id: 'tpl-nlp-pretrain', name: 'NLP 继续预训练', category: '大模型训练', description: '面向行业语料的继续预训练、断点恢复与分布式训练任务。',
    image: 'nlp-pretrain', imageLabel: 'Megatron + DeepSpeed 训练环境', gpuType: 'H100-80G', gpuCount: '8', storage: '800',
    repository: 'research/nlp-continuous-pretrain', branch: 'main', startupCommand: 'deepspeed scripts/pretrain.py --deepspeed configs/zero3.json', defaultName: 'nlp-pretrain-run', recommendedAssetIds: ['ds001', 'm001', 'tk001'], tags: ['DeepSpeed', 'Megatron', '多机多卡'],
  },
  {
    id: 'tpl-audio', name: '语音识别与合成', category: '语音 AI', description: '支持 ASR、TTS、音频特征处理和领域语音模型评测。',
    image: 'audio-speech-lab', imageLabel: 'SpeechBrain + PyTorch 音频环境', gpuType: 'A10-24G', gpuCount: '1', storage: '180',
    repository: 'speech/domain-asr', branch: 'main', startupCommand: 'python scripts/train_asr.py', defaultName: 'speech-ai-lab', recommendedAssetIds: ['env001', 'tk001'], tags: ['ASR', 'TTS', 'Speech'],
  },
  {
    id: 'tpl-timeseries', name: '时序预测与异常检测', category: '数据智能', description: '用于工业时序建模、告警分析、特征工程和批量评测。',
    image: 'timeseries-lab', imageLabel: 'Python 时序建模环境', gpuType: 'CPU-Only', gpuCount: '0', storage: '120',
    repository: 'industry/timeseries-anomaly', branch: 'develop', startupCommand: 'python pipelines/train_forecast.py', defaultName: 'timeseries-anomaly-dev', recommendedAssetIds: ['ds001', 'env002'], tags: ['Time Series', 'Anomaly', 'Forecasting'],
  },
  {
    id: 'tpl-digital-twin', name: '数字孪生仿真', category: '仿真计算', description: '面向场景建模、强化学习和 GPU 加速仿真的工程开发环境。',
    image: 'digital-twin-sim', imageLabel: 'Isaac Sim + Python 仿真环境', gpuType: 'A100-80G', gpuCount: '2', storage: '400',
    repository: 'simulation/digital-twin', branch: 'main', startupCommand: 'python scripts/run_simulation.py', defaultName: 'digital-twin-sim', recommendedAssetIds: ['env001', 'tk002'], tags: ['Simulation', 'RL', 'Digital Twin'],
  },
  {
    id: 'tpl-security', name: '安全代码审查', category: '工程效能', description: '用于依赖分析、静态扫描、接口测试和修复验证的受控工作区。',
    image: 'secure-dev', imageLabel: 'Secure Dev + SAST 工具环境', gpuType: 'CPU-Only', gpuCount: '0', storage: '100',
    repository: 'platform/secure-service-review', branch: 'main', startupCommand: 'pnpm lint && pnpm test', defaultName: 'secure-code-review', recommendedAssetIds: ['tk001'], tags: ['SAST', 'Dependency', 'Testing'],
  },
];

export const mockWebEditorFiles: WebEditorFile[] = [
  {
    id: 'file-train', path: 'src/train.py', name: 'train.py', language: 'python', modifiedAt: '刚刚', changed: true,
    content: `from datasets import load_dataset\nfrom transformers import AutoModelForCausalLM, AutoTokenizer\n\nMODEL_NAME = "Qwen2.5-7B-CS-ZY"\nDATASET_PATH = "/mnt/datasets/customer-service-sft"\n\ndef build_trainer_config():\n    return {\n        "learning_rate": 2e-5,\n        "num_train_epochs": 3,\n        "per_device_train_batch_size": 2,\n        "gradient_accumulation_steps": 8,\n    }\n\nif __name__ == "__main__":\n    print(f"Loading {MODEL_NAME}...")\n    print("Training config:", build_trainer_config())\n`,
  },
  {
    id: 'file-config', path: 'configs/finetune.yaml', name: 'finetune.yaml', language: 'yaml', modifiedAt: '8 分钟前',
    content: `model:\n  base: Qwen2.5-7B-CS-ZY\n  precision: bf16\n\ndata:\n  train: /mnt/datasets/customer-service-sft/train.jsonl\n  eval: /mnt/datasets/customer-service-sft/eval.jsonl\n\ntrainer:\n  strategy: lora\n  lora_rank: 32\n  save_steps: 200\n  logging_steps: 10\n`,
  },
  {
    id: 'file-readme', path: 'README.md', name: 'README.md', language: 'markdown', modifiedAt: '昨天',
    content: `# 客服领域模型微调\n\n本项目用于电信客服场景的 SFT / LoRA 微调。\n\n## 本地开发\n\n1. 在 Web 编辑器中修改配置\n2. 使用 VS Code Remote 调试\n3. 在远程环境提交训练任务\n`,
  },
  {
    id: 'file-launch', path: '.devcontainer/devcontainer.json', name: 'devcontainer.json', language: 'json', modifiedAt: '昨天',
    content: `{\n  "name": "zhiyun-qwen-finetune",\n  "image": "zhiyun/pytorch:2.3-cuda12.1-cudnn9",\n  "workspaceFolder": "/workspace/customer-service",\n  "customizations": {\n    "vscode": {\n      "extensions": ["ms-python.python", "ms-toolsai.jupyter"]\n    }\n  }\n}\n`,
  },
  {
    id: 'file-metrics', path: 'scripts/evaluate.py', name: 'evaluate.py', language: 'python', modifiedAt: '2026-08-18',
    content: `def report_metrics(result):\n    print(f"Accuracy: {result['accuracy']:.3f}")\n    print(f"F1: {result['f1']:.3f}")\n\nif __name__ == "__main__":\n    report_metrics({"accuracy": 0.928, "f1": 0.914})\n`,
  },
];

export const mockVSCodeConnections: VSCodeConnectionProfile[] = [
  {
    id: 'vscode-01', name: '客服模型 LoRA 调试', type: 'Remote SSH', instanceId: 'ins007', workspace: '/workspace/customer-service', branch: 'feature/lora-eval', status: 'connected',
    command: 'code --folder-uri vscode-remote://ssh-remote+zhiyun-cs-lora/workspace/customer-service',
    launchUrl: 'vscode://vscode-remote/ssh-remote+zhiyun-cs-lora/workspace/customer-service',
    extensions: ['Python', 'Jupyter', 'GitLens', 'YAML'], lastActive: '刚刚',
  },
  {
    id: 'vscode-02', name: '多模态流水线', type: 'Dev Container', instanceId: 'ins003', workspace: '/workspace/multimodal-pipeline', branch: 'main', status: 'ready',
    command: 'code --folder-uri vscode-remote://ssh-remote+zhiyun-multimodal/workspace/multimodal-pipeline',
    launchUrl: 'vscode://vscode-remote/ssh-remote+zhiyun-multimodal/workspace/multimodal-pipeline',
    extensions: ['Python', 'Docker', 'Remote Containers', 'Ruff'], lastActive: '18 分钟前',
  },
  {
    id: 'vscode-03', name: '知识库 RAG 服务', type: 'VS Code Tunnel', instanceId: 'ins006', workspace: '/workspace/rag-service', branch: 'release/1.4', status: 'ready',
    command: 'code tunnel --name zhiyun-rag-06 --accept-server-license-terms',
    launchUrl: 'vscode://vscode-remote/tunnel+zhiyun-rag-06/workspace/rag-service',
    extensions: ['Python', 'REST Client', 'YAML'], lastActive: '2 小时前',
  },
];

export const mockRemoteWorkspaces: RemoteWorkspace[] = [
  {
    id: 'workspace-01', name: '客服模型联合开发', repository: 'ai-platform/customer-service-llm', branch: 'feature/lora-eval', template: 'PyTorch + CUDA 12.1', status: 'running',
    runtime: 'Dev Container', resources: 'A100 80GB × 2 · 16C · 64Gi', location: '绵阳 GPU 集群', collaborators: ['张远航', '王静雯', '陈昊宇'], lastActive: '刚刚', instanceId: 'ins007',
  },
  {
    id: 'workspace-02', name: '多模态质检实验室', repository: 'vision/multimodal-quality', branch: 'main', template: 'Transformers + vLLM', status: 'running',
    runtime: 'Cloud Workstation', resources: 'H100 80GB × 4 · 32C · 128Gi', location: '绵阳 GPU 集群', collaborators: ['刘梦琪', '孙悦'], lastActive: '12 分钟前', instanceId: 'ins003',
  },
  {
    id: 'workspace-03', name: '网络异常检测 Sandbox', repository: 'ops/network-anomaly', branch: 'experiment/graph-features', template: 'Python 3.11 + Jupyter', status: 'stopped',
    runtime: 'Browser IDE', resources: 'A10 × 2 · 16C · 64Gi', location: '西南边缘节点', collaborators: ['周昌盛'], lastActive: '昨天 18:32', instanceId: 'ins008',
  },
];

export const mockTerminalWelcome = [
  'Welcome to ZhiYun WebSSH · session is isolated and audited',
  'Connected through bastion gateway.zhiyun.ai',
  'Type `help` to view supported mock commands.',
];
