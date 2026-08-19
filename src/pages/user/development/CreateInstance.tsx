import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, CheckCircle2, Database, BrainCircuit, Wrench, Boxes, ChevronDown, CopyPlus, Layers3, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../hooks/useToast';
import { appendRuntimeInstance } from '../../../data/mockInstanceRuntime';
import { mockDevelopmentTemplates, type DevelopmentTemplate } from '../../../data/mockDevelopmentModes';
import type { DevAssetType, DevInstanceMount } from '../../../types';

interface AssetOption {
  id: string;
  type: DevAssetType;
  name: string;
}

const ASSET_OPTIONS: AssetOption[] = [
  { id: 'ds001', type: 'dataset', name: 'Telecom-SFT-Corpus-v3' },
  { id: 'ds002', type: 'dataset', name: 'Satellite-Seg-Dataset-v2' },
  { id: 'ds009', type: 'dataset', name: 'Contract-Understanding-CN' },
  { id: 'm001', type: 'model', name: 'Qwen2.5-72B-Instruct-ZY' },
  { id: 'm005', type: 'model', name: 'YOLOv9-Satellite-Seg' },
  { id: 'm010', type: 'model', name: 'CodeQwen1.5-7B-ZY-Dev' },
  { id: 'env001', type: 'environment', name: 'PyTorch-CUDA12 基础环境' },
  { id: 'env002', type: 'environment', name: 'TensorFlow-2.16 开发环境' },
  { id: 'env003', type: 'environment', name: 'vLLM 推理调试环境' },
  { id: 'tk001', type: 'toolkit', name: 'LLM 训练工具包' },
  { id: 'tk002', type: 'toolkit', name: '可视化标注工具包' },
];

const TYPE_LABEL: Record<DevAssetType, string> = {
  dataset: '数据集',
  model: '模型',
  environment: '开发环境',
  toolkit: '工具包',
};

const INITIAL_FORM = {
  name: '',
  image: 'pytorch-cuda12',
  gpuType: 'A100-80G',
  gpuCount: '1',
  storage: '100',
  repository: '',
  branch: 'main',
  startupCommand: '',
};

type TemplateCloneDraft = typeof INITIAL_FORM & {
  sourceTemplateId: string;
  templateName: string;
};

const IMAGE_OPTIONS = Array.from(
  new Map(mockDevelopmentTemplates.map(template => [template.image, { value: template.image, label: template.imageLabel }])).values(),
);

const GPU_OPTIONS = [
  { value: 'CPU-Only', label: 'CPU 通用规格（不分配 GPU）' },
  { value: 'T4-16G', label: 'NVIDIA T4 16GB（低优先队列）' },
  { value: 'A10-24G', label: 'NVIDIA A10 24GB' },
  { value: 'V100-32G', label: 'NVIDIA V100 32GB' },
  { value: 'A100-80G', label: 'NVIDIA A100 80GB' },
  { value: 'H100-80G', label: 'NVIDIA H100 80GB（高优先队列）' },
];

function defaultMountPath(type: DevAssetType, name: string) {
  const normalized = name.toLowerCase().replace(/\s+/g, '-');
  if (type === 'dataset') return `/mnt/datasets/${normalized}`;
  if (type === 'model') return `/mnt/models/${normalized}`;
  if (type === 'environment') return `/opt/envs/${normalized}`;
  return `/opt/toolkits/${normalized}`;
}

export default function CreateInstance() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [mountedCount, setMountedCount] = useState(0);
  const [templatesExpanded, setTemplatesExpanded] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [templateCloneDraft, setTemplateCloneDraft] = useState<TemplateCloneDraft | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [mounts, setMounts] = useState<DevInstanceMount[]>([]);

  const selectedTemplate = mockDevelopmentTemplates.find(template => template.id === selectedTemplateId);
  const templateCloneSource = templateCloneDraft ? mockDevelopmentTemplates.find(template => template.id === templateCloneDraft.sourceTemplateId) : undefined;

  const addAssetMount = (asset: AssetOption) => {
    setMounts(prev => {
      const exists = prev.some(item => item.id === asset.id);
      if (exists) return prev;
      return [
        ...prev,
        {
          id: asset.id,
          type: asset.type,
          name: asset.name,
          mountPath: defaultMountPath(asset.type, asset.name),
          accessMode: asset.type === 'dataset' || asset.type === 'model' ? 'ro' : 'rw',
        },
      ];
    });
  };

  const buildTemplateMounts = (template: DevelopmentTemplate) => template.recommendedAssetIds
      .map(id => ASSET_OPTIONS.find(asset => asset.id === id))
      .filter((asset): asset is AssetOption => Boolean(asset))
      .map(asset => ({
        id: asset.id,
        type: asset.type,
        name: asset.name,
        mountPath: defaultMountPath(asset.type, asset.name),
        accessMode: asset.type === 'dataset' || asset.type === 'model' ? 'ro' as const : 'rw' as const,
      }));

  const openTemplateClone = (template: DevelopmentTemplate) => {
    setTemplateCloneDraft({
      sourceTemplateId: template.id,
      templateName: `${template.name} - 副本`,
      name: template.defaultName,
      image: template.image,
      gpuType: template.gpuType,
      gpuCount: template.gpuCount,
      storage: template.storage,
      repository: template.repository,
      branch: template.branch,
      startupCommand: template.startupCommand,
    });
  };

  const applyTemplateClone = () => {
    if (!templateCloneDraft || !templateCloneSource) return;
    if (!templateCloneDraft.templateName.trim()) {
      toast.warning('缺少模板副本名称', '请为克隆后的模板输入名称。');
      return;
    }
    if (!templateCloneDraft.name.trim() || !templateCloneDraft.repository.trim()) {
      toast.warning('请补全开发配置', '实例名称和 Git 仓库或项目路径为必填项。');
      return;
    }

    setSelectedTemplateId(templateCloneSource.id);
    setSelectedTemplateName(templateCloneDraft.templateName.trim());
    setForm({
      name: templateCloneDraft.name,
      image: templateCloneDraft.image,
      gpuType: templateCloneDraft.gpuType,
      gpuCount: templateCloneDraft.gpuCount,
      storage: templateCloneDraft.storage,
      repository: templateCloneDraft.repository,
      branch: templateCloneDraft.branch,
      startupCommand: templateCloneDraft.startupCommand,
    });
    setMounts(buildTemplateMounts(templateCloneSource));
    setTemplateCloneDraft(null);
    toast.success('模板副本已应用', `「${templateCloneDraft.templateName.trim()}」已带入创建表单，可继续调整挂载与配置。`);
  };

  const resetToCustom = () => {
    setSelectedTemplateId('');
    setSelectedTemplateName('');
    setTemplateCloneDraft(null);
    setForm(INITIAL_FORM);
    setMounts([]);
  };

  const removeMount = (id: string) => {
    setMounts(prev => prev.filter(item => item.id !== id));
  };

  const updateMount = (id: string, patch: Partial<DevInstanceMount>) => {
    setMounts(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('缺少实例名称', '请填写实例名称后再创建');
      return;
    }
    if (!form.repository.trim()) {
      toast.warning('缺少代码源', '请填写 Git 仓库或项目路径后再创建');
      return;
    }
    const invalidPath = mounts.find(item => !item.mountPath.trim());
    if (invalidPath) {
      toast.warning('挂载路径不能为空', `请完善资产「${invalidPath.name}」的挂载路径`);
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    appendRuntimeInstance({
      name: form.name.trim(),
      image: form.image,
      gpuType: form.gpuType,
      gpuCount: Number(form.gpuCount),
      storage: form.storage,
      mounts,
      templateName: selectedTemplateName || selectedTemplate?.name || '自定义开发环境',
      repository: form.repository.trim(),
      branch: form.branch.trim() || 'main',
      startupCommand: form.startupCommand.trim(),
      creator: '张远航',
      namespace: 'algo-team',
    });

    setLoading(false);
    setInstanceName(form.name.trim());
    setMountedCount(mounts.length);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">实例创建成功</h2>
      <p className="text-text-muted text-sm">实例 <span className="text-text-secondary font-medium">{instanceName}</span> 正在启动，请稍候…</p>
      <p className="text-xs text-text-muted">已挂载 {mountedCount} 项 AI 资产</p>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/user/development')}>
          返回实例列表
        </Button>
        <Button onClick={() => {
          setSubmitted(false);
          setMountedCount(0);
          resetToCustom();
        }}>
          再创建一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/development" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 开发环境
        </Link>
        <span>/</span>
        <span className="text-text-secondary">创建开发环境</span>
      </div>
      <PageHeader
        title="创建开发环境"
        subtitle="可从预置模板克隆，再按项目需要自定义镜像、资源、代码源与 AI 资产"
        icon={<Terminal size={20} />}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card noPadding className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border bg-white/[0.02] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><Layers3 size={18} /></span>
              <div>
                <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-text-primary">从开发模板克隆</h3><Badge variant="primary">{mockDevelopmentTemplates.length} 套模板</Badge></div>
                <p className="mt-1 text-xs leading-5 text-text-muted">选择任一模板后，先命名模板副本并调整关键配置；确认后再带入下方创建表单。</p>
              </div>
            </div>
            <div className="flex items-center gap-2"><Button type="button" size="sm" variant="ghost" rightIcon={<ChevronDown size={13} className={templatesExpanded ? '' : '-rotate-90'} />} onClick={() => setTemplatesExpanded(expanded => !expanded)}>{templatesExpanded ? '收起模板' : `展开模板（${mockDevelopmentTemplates.length}）`}</Button><Button type="button" size="sm" variant="outline" leftIcon={<RotateCcw size={12} />} onClick={resetToCustom}>从空白配置开始</Button></div>
          </div>
          {templatesExpanded && <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {mockDevelopmentTemplates.map(template => {
              const selected = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => openTemplateClone(template)}
                  className={`group rounded-xl border p-4 text-left transition-all ${selected ? 'border-primary/60 bg-primary/[0.10] shadow-[0_0_0_1px_rgba(59,130,246,0.18)]' : 'border-border bg-base/40 hover:border-primary/35 hover:bg-primary/[0.035]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{template.name}</p><p className="mt-1 text-xs text-text-muted">{template.category}</p></div>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-white' : 'bg-white/5 text-text-muted group-hover:text-primary'}`}><CopyPlus size={14} /></span>
                  </div>
                  <p className="mt-3 min-h-10 text-xs leading-5 text-text-muted">{template.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">{template.tags.slice(0, 3).map(tag => <Badge key={tag} variant="ghost">{tag}</Badge>)}</div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-[11px] text-text-muted"><span>{template.gpuType === 'CPU-Only' ? 'CPU 环境' : `${template.gpuType} × ${template.gpuCount}`}</span><span className={selected ? 'text-primary' : 'text-text-secondary'}>{selected ? '已克隆，可继续编辑' : '克隆并配置'}</span></div>
                </button>
              );
            })}
          </div>}
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-text-primary">基础与启动配置</h3><p className="mt-1 text-xs text-text-muted">{selectedTemplate ? `已基于「${selectedTemplateName || selectedTemplate.name}」克隆；修改下列字段不会影响原始模板。` : '当前为自定义配置，可手动填写每一项环境参数。'}</p></div>{selectedTemplate && <Badge variant="success">模板副本</Badge>}</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="实例名称 *" placeholder="如：my-training-env" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <Input label="Git 仓库或项目路径 *" placeholder="如：team/project" value={form.repository} onChange={e => setForm(f => ({ ...f, repository: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select label="基础镜像 *" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} options={IMAGE_OPTIONS} />
              <Input label="代码分支" placeholder="main" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="GPU 类型"
                value={form.gpuType}
                onChange={e => setForm(f => ({ ...f, gpuType: e.target.value }))}
                options={GPU_OPTIONS}
              />
              <Select
                label="GPU 数量"
                value={form.gpuCount}
                onChange={e => setForm(f => ({ ...f, gpuCount: e.target.value }))}
                options={[
                  { value: '0', label: '不分配 GPU' },
                  { value: '1', label: '1 卡' },
                  { value: '2', label: '2 卡' },
                  { value: '4', label: '4 卡（需审批）' },
                  { value: '8', label: '8 卡（需审批）' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Input label="系统盘容量（GiB）" type="number" min={50} max={2000} value={form.storage} onChange={e => setForm(f => ({ ...f, storage: e.target.value }))} /><Input label="启动命令（可选）" placeholder="如：python app.py" value={form.startupCommand} onChange={e => setForm(f => ({ ...f, startupCommand: e.target.value }))} /></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">AI 资产灵活挂载</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ASSET_OPTIONS.map(asset => {
                const active = mounts.some(item => item.id === asset.id);
                const icon = asset.type === 'dataset'
                  ? <Database size={12} />
                  : asset.type === 'model'
                  ? <BrainCircuit size={12} />
                  : asset.type === 'environment'
                  ? <Boxes size={12} />
                  : <Wrench size={12} />;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => addAssetMount(asset)}
                    disabled={active}
                    className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                      active
                        ? 'border-primary/40 bg-primary/10 text-primary cursor-not-allowed'
                        : 'border-border bg-white/5 hover:border-primary/30'
                    }`}
                  >
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {icon}
                      {asset.name}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{TYPE_LABEL[asset.type]}</p>
                  </button>
                );
              })}
            </div>

            {mounts.length > 0 ? (
              <div className="space-y-3">
                {mounts.map(item => (
                  <div key={item.id} className="rounded-lg border border-border bg-white/5 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-muted">{TYPE_LABEL[item.type]}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => removeMount(item.id)}>移除</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="挂载路径"
                        value={item.mountPath}
                        onChange={e => updateMount(item.id, { mountPath: e.target.value })}
                        placeholder="例如 /mnt/datasets/xxx"
                      />
                      <Select
                        label="访问模式"
                        value={item.accessMode}
                        onChange={e => updateMount(item.id, { accessMode: e.target.value as 'ro' | 'rw' })}
                        options={[
                          { value: 'ro', label: '只读 (RO)' },
                          { value: 'rw', label: '读写 (RW)' },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">当前未挂载资产，可按需挂载数据集、模型、开发环境与工具包。</p>
            )}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>创建实例</Button>
          <Link to="/user/development">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>

      <Modal open={Boolean(templateCloneDraft)} onClose={() => setTemplateCloneDraft(null)} title="克隆并配置开发模板" width="xl">
        {templateCloneDraft && templateCloneSource && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-4 md:flex-row md:items-center md:justify-between">
              <div><p className="text-sm font-semibold text-text-primary">来源模板：{templateCloneSource.name}</p><p className="mt-1 text-xs leading-5 text-text-muted">此操作不会改动原始模板。确认后将以当前配置创建一个可继续编辑的模板副本。</p></div>
              <div className="flex flex-wrap gap-1">{templateCloneSource.tags.map(tag => <Badge key={tag} variant="ghost">{tag}</Badge>)}</div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="模板副本名称 *" value={templateCloneDraft.templateName} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, templateName: event.target.value } : draft)} placeholder="如：Qwen LoRA 微调 - 客服团队版" required />
              <Input label="开发实例名称 *" value={templateCloneDraft.name} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, name: event.target.value } : draft)} placeholder="如：customer-lora-dev" required />
              <Input label="Git 仓库或项目路径 *" value={templateCloneDraft.repository} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, repository: event.target.value } : draft)} required />
              <Input label="代码分支" value={templateCloneDraft.branch} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, branch: event.target.value } : draft)} placeholder="main" />
              <Select label="基础镜像" value={templateCloneDraft.image} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, image: event.target.value } : draft)} options={IMAGE_OPTIONS} />
              <Select label="GPU 类型" value={templateCloneDraft.gpuType} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, gpuType: event.target.value } : draft)} options={GPU_OPTIONS} />
              <Select label="GPU 数量" value={templateCloneDraft.gpuCount} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, gpuCount: event.target.value } : draft)} options={[{ value: '0', label: '不分配 GPU' }, { value: '1', label: '1 卡' }, { value: '2', label: '2 卡' }, { value: '4', label: '4 卡（需审批）' }, { value: '8', label: '8 卡（需审批）' }]} />
              <Input label="系统盘容量（GiB）" type="number" min={50} max={2000} value={templateCloneDraft.storage} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, storage: event.target.value } : draft)} />
            </div>
            <Input label="启动命令（可选）" value={templateCloneDraft.startupCommand} onChange={event => setTemplateCloneDraft(draft => draft ? { ...draft, startupCommand: event.target.value } : draft)} placeholder="如：python app.py" />
            <p className="text-xs text-text-muted">将自动复制 {templateCloneSource.recommendedAssetIds.length} 项推荐资产；确认后可在主页面调整资产类型、挂载路径和读写权限。</p>
            <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="ghost" onClick={() => setTemplateCloneDraft(null)}>取消</Button><Button type="button" leftIcon={<CopyPlus size={13} />} onClick={applyTemplateClone}>确认克隆并应用</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
