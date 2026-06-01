import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, CheckCircle2, Database, BrainCircuit, Wrench, Boxes } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { appendRuntimeInstance } from '../../../data/mockInstanceRuntime';
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
  const [form, setForm] = useState({
    name: '',
    image: 'pytorch-cuda12',
    gpuType: 'A100-80G',
    gpuCount: '1',
    storage: '100',
  });
  const [mounts, setMounts] = useState<DevInstanceMount[]>([]);

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
          setMounts([]);
          setMountedCount(0);
          setForm({
            name: '',
            image: 'pytorch-cuda12',
            gpuType: 'A100-80G',
            gpuCount: '1',
            storage: '100',
          });
        }}>
          再创建一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/development" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 开发实例
        </Link>
        <span>/</span>
        <span className="text-text-secondary">新建实例</span>
      </div>
      <PageHeader
        title="新建开发实例"
        subtitle="基于 GPU 算力创建 JupyterLab 开发环境"
        icon={<Terminal size={20} />}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">基本配置</h3>
          <div className="space-y-4">
            <Input
              label="实例名称 *"
              placeholder="如：my-training-env"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Select
              label="基础镜像 *"
              value={form.image}
              onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
              options={[
                { value: 'pytorch-cuda12', label: 'PyTorch 2.3 + CUDA 12.1' },
                { value: 'tensorflow-2.16', label: 'TensorFlow 2.16 + CUDA 12.1' },
                { value: 'qwen-finetune', label: 'Qwen2.5 微调专用环境' },
                { value: 'vllm-inference', label: 'vLLM 推理环境' },
                { value: 'cv-yolov9', label: 'CV/YOLOv9 视觉环境' },
              ]}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="GPU 类型"
                value={form.gpuType}
                onChange={e => setForm(f => ({ ...f, gpuType: e.target.value }))}
                options={[
                  { value: 'A100-80G', label: 'NVIDIA A100 80GB' },
                  { value: 'A10-24G', label: 'NVIDIA A10 24GB' },
                  { value: 'H100-80G', label: 'NVIDIA H100 80GB（高优先队列）' },
                  { value: 'V100-32G', label: 'NVIDIA V100 32GB' },
                  { value: 'T4-16G', label: 'NVIDIA T4 16GB（低优先级）' },
                ]}
              />
              <Select
                label="GPU 数量"
                value={form.gpuCount}
                onChange={e => setForm(f => ({ ...f, gpuCount: e.target.value }))}
                options={[
                  { value: '1', label: '1 卡' },
                  { value: '2', label: '2 卡' },
                  { value: '4', label: '4 卡（需审批）' },
                  { value: '8', label: '8 卡（需审批）' },
                ]}
              />
            </div>
            <Input
              label="系统盘容量（GiB）"
              type="number"
              min={50}
              max={2000}
              value={form.storage}
              onChange={e => setForm(f => ({ ...f, storage: e.target.value }))}
            />
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
    </div>
  );
}
