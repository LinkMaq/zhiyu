import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { appendRuntimeTrainingJob } from '../../../data/mockTrainingRuntime';
import type { TrainingJob } from '../../../types';

type TuningMode = 'quick' | 'expert' | 'pretrain';

const MODE_META: Record<TuningMode, { label: string; gpuCount: string; gpuType: string; epochs: string; lr: string; batchSize: string }> = {
  quick:   { label: '快速微调',  gpuCount: '1',  gpuType: 'A10-24G',  epochs: '3',  lr: '2e-4',  batchSize: '16' },
  expert:  { label: '专家微调',  gpuCount: '4',  gpuType: 'A100-80G', epochs: '5',  lr: '1e-5',  batchSize: '8'  },
  pretrain:{ label: '预训练',    gpuCount: '8',  gpuType: 'H100-80G', epochs: '1',  lr: '3e-5',  batchSize: '4'  },
};

export default function SubmitTraining() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const rawMode = searchParams.get('mode') as TuningMode | null;
  const initialMode: TuningMode = rawMode && rawMode in MODE_META ? rawMode : 'quick';
  const defaultMeta = MODE_META[initialMode];

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [jobName, setJobName] = useState('');
  const [form, setForm] = useState({
    name: '',
    mode: initialMode,
    baseModel: 'Qwen2.5-7B',
    dataset: 'ds001',
    gpuType: defaultMeta.gpuType,
    gpuCount: defaultMeta.gpuCount,
    epochs: defaultMeta.epochs,
    lr: defaultMeta.lr,
    batchSize: defaultMeta.batchSize,
    priority: '1',
  });

  const handleModeChange = (mode: TuningMode) => {
    const meta = MODE_META[mode];
    setForm(f => ({ ...f, mode, gpuType: meta.gpuType, gpuCount: meta.gpuCount, epochs: meta.epochs, lr: meta.lr, batchSize: meta.batchSize }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('任务名称不能为空');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const typeMap = {
      quick: 'fine-tune-fast',
      expert: 'fine-tune-expert',
      pretrain: 'pretrain',
    } as const;

    const now = new Date().toISOString();
    const job: TrainingJob = {
      id: `tj-${Date.now()}`,
      name: form.name.trim(),
      type: typeMap[form.mode],
      status: 'queued',
      model: form.baseModel,
      baseModel: form.baseModel,
      dataset: form.dataset,
      priority: Number(form.priority) || 1,
      gpuType: form.gpuType,
      gpuCount: Number(form.gpuCount) || 1,
      createdAt: now,
      creator: '张远航',
      namespace: 'algo-team',
      progress: 0,
      currentEpoch: 0,
      totalEpochs: Number(form.epochs) || 1,
      metrics: [],
      hyperparams: {
        lr: form.lr,
        batchSize: Number(form.batchSize) || form.batchSize,
        epochs: Number(form.epochs) || form.epochs,
      },
      versions: [],
    };
    appendRuntimeTrainingJob(job);

    setLoading(false);
    setJobName(form.name);
    setSubmitted(true);
    toast.success('训练任务已提交', `${form.name} 已进入调度队列`);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">训练任务已提交</h2>
      <p className="text-text-muted text-sm">任务 <span className="text-text-secondary font-medium">{jobName}</span> 已进入调度队列，请在任务列表中查看进度。</p>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/user/training')}>
          返回任务列表
        </Button>
        <Button onClick={() => {
          const meta = MODE_META[form.mode];
          setForm(f => ({ ...f, name: '', gpuType: meta.gpuType, gpuCount: meta.gpuCount }));
          setSubmitted(false);
        }}>
          再提交一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/training" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 训练任务
        </Link>
        <span>/</span>
        <span className="text-text-secondary">提交训练任务</span>
      </div>
      <PageHeader
        title="提交训练任务"
        subtitle="配置微调或预训练参数，提交至 GPU 调度队列"
        icon={<Zap size={20} />}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 训练模式 */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">训练模式</h3>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(MODE_META) as [TuningMode, typeof MODE_META[TuningMode]][]).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleModeChange(key)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  form.mode === key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-base hover:border-primary/50 text-text-secondary'
                }`}
              >
                <p className="text-sm font-semibold mb-1">{meta.label}</p>
                <p className="text-xs text-text-muted">{meta.gpuCount} 张 · {meta.gpuType}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* 基本配置 */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">基本配置</h3>
          <div className="space-y-4">
            <Input
              label="任务名称 *"
              placeholder="如：qwen-sft-v1"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="基础模型 *"
                value={form.baseModel}
                onChange={e => setForm(f => ({ ...f, baseModel: e.target.value }))}
                options={[
                  { value: 'Qwen2.5-7B',  label: 'Qwen2.5-7B' },
                  { value: 'Qwen2.5-14B', label: 'Qwen2.5-14B' },
                  { value: 'Qwen2.5-72B', label: 'Qwen2.5-72B（需 8 卡）' },
                  { value: 'Llama-3-8B',  label: 'Llama 3 8B' },
                  { value: 'Llama-3-70B', label: 'Llama 3 70B（需 8 卡）' },
                  { value: 'ChatGLM4-9B', label: 'ChatGLM4-9B' },
                ]}
              />
              <Select
                label="训练数据集 *"
                value={form.dataset}
                onChange={e => setForm(f => ({ ...f, dataset: e.target.value }))}
                options={[
                  { value: 'ds001', label: 'Telecom-SFT-Corpus-v3' },
                  { value: 'ds002', label: 'Satellite-Seg-Dataset-v2' },
                  { value: 'ds009', label: 'Contract-Understanding-CN' },
                  { value: 'ds012', label: 'Medical-QA-CN-v1' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* 资源配置 */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">资源配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="GPU 类型"
              value={form.gpuType}
              onChange={e => setForm(f => ({ ...f, gpuType: e.target.value }))}
              options={[
                { value: 'T4-16G',   label: 'NVIDIA T4 16GB' },
                { value: 'A10-24G',  label: 'NVIDIA A10 24GB' },
                { value: 'A100-80G', label: 'NVIDIA A100 80GB' },
                { value: 'H100-80G', label: 'NVIDIA H100 80GB（高优先）' },
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
            <Select
              label="调度优先级"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              options={[
                { value: '0', label: '低' },
                { value: '1', label: '中（默认）' },
                { value: '2', label: '高' },
                { value: '3', label: '紧急（可触发抢占）' },
              ]}
            />
          </div>
        </Card>

        {/* 训练超参 */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">训练超参</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="训练轮数 (Epochs)"
              value={form.epochs}
              onChange={e => setForm(f => ({ ...f, epochs: e.target.value }))}
              placeholder="3"
            />
            <Input
              label="学习率 (LR)"
              value={form.lr}
              onChange={e => setForm(f => ({ ...f, lr: e.target.value }))}
              placeholder="2e-4"
            />
            <Input
              label="批大小 (Batch Size)"
              value={form.batchSize}
              onChange={e => setForm(f => ({ ...f, batchSize: e.target.value }))}
              placeholder="16"
            />
          </div>
          <p className="text-xs text-text-muted mt-3">已根据所选模式预填推荐超参，可按需调整。</p>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading} leftIcon={<Zap size={14} />}>提交训练任务</Button>
          <Link to="/user/training">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
