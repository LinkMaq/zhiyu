import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { appendRuntimeBatchJob } from '../../../data/mockInferenceRuntime';

export default function CreateBatch() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [jobName, setJobName] = useState('');
  const [form, setForm] = useState({
    name: '',
    model: 'Qwen2.5-72B-Instruct-ZY',
    dataset: '',
    concurrency: '16',
    gpuCount: '2',
    outputPath: '/outputs/',
    schedule: '立即执行',
    outputFormat: 'jsonl',
    callback: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await new Promise(r => setTimeout(r, 1000));

    const now = new Date().toISOString();
    appendRuntimeBatchJob({
      id: `bj-${Date.now()}`,
      name: form.name.trim(),
      model: form.model,
      dataset: form.dataset.trim(),
      totalItems: 10000,
      doneItems: 0,
      status: form.schedule === '立即执行' ? 'running' : 'queued',
      gpuType: 'A100 80GB',
      gpuCount: Number(form.gpuCount) || 1,
      concurrency: Number(form.concurrency) || 1,
      createdAt: now,
      creator: '张远航',
      outputPath: form.outputPath,
      schedule: form.schedule,
      outputFormat: form.outputFormat,
      callback: form.callback.trim() || undefined,
    });

    setCreating(false);
    setJobName(form.name);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">批量任务已提交</h2>
      <p className="text-text-muted text-sm">任务 <span className="text-text-secondary font-medium">{jobName}</span> 已进入调度队列，支持离峰时段自动触发执行</p>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/user/inference/batch')}>
          返回批量推理
        </Button>
        <Button onClick={() => { setSubmitted(false); setForm({ name: '', model: 'Qwen2.5-72B-Instruct-ZY', dataset: '', concurrency: '16', gpuCount: '2', outputPath: '/outputs/', schedule: '立即执行', outputFormat: 'jsonl', callback: '' }); }}>
          再创建一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/inference/batch" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 批量推理
        </Link>
        <span>/</span>
        <span className="text-text-secondary">新建批量推理任务</span>
      </div>
      <PageHeader
        title="新建离线批量推理任务"
        subtitle="高效处理大规模数据集，支持定时执行与结果回调"
        icon={<FileText size={20} />}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">任务配置</h3>
          <div className="space-y-4">
            <Input
              label="任务名称 *"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="为此批量任务命名"
              required
            />
            <Select
              label="选择模型"
              value={form.model}
              onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
              options={[
                { value: 'Qwen2.5-72B-Instruct-ZY', label: 'Qwen2.5-72B-Instruct-ZY' },
                { value: 'Qwen2.5-32B-Instruct-ZY', label: 'Qwen2.5-32B-Instruct-ZY' },
                { value: 'ERNIE-3.0-Contract-ZY', label: 'ERNIE-3.0-Contract-ZY' },
                { value: 'ViT-B16-NetEquip-Defect', label: 'ViT-B16-NetEquip-Defect' },
              ]}
            />
            <Input
              label="输入数据集 *"
              value={form.dataset}
              onChange={e => setForm(p => ({ ...p, dataset: e.target.value }))}
              placeholder="数据集名称或路径"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="并发请求数"
                type="number"
                min="1"
                value={form.concurrency}
                onChange={e => setForm(p => ({ ...p, concurrency: e.target.value }))}
              />
              <Select
                label="GPU 数量"
                value={form.gpuCount}
                onChange={e => setForm(p => ({ ...p, gpuCount: e.target.value }))}
                options={[
                  { value: '1', label: '1 卡' },
                  { value: '2', label: '2 卡' },
                  { value: '4', label: '4 卡' },
                  { value: '8', label: '8 卡' },
                ]}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">调度与输出</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="执行计划"
                value={form.schedule}
                onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))}
                options={[
                  { value: '立即执行', label: '立即执行' },
                  { value: '每天 01:00', label: '每天 01:00' },
                  { value: '峰谷窗口自动调度', label: '峰谷窗口自动调度' },
                ]}
              />
              <Select
                label="输出格式"
                value={form.outputFormat}
                onChange={e => setForm(p => ({ ...p, outputFormat: e.target.value }))}
                options={[
                  { value: 'jsonl', label: 'JSONL' },
                  { value: 'json', label: 'JSON' },
                  { value: 'parquet', label: 'Parquet' },
                ]}
              />
            </div>
            <Input
              label="输出路径"
              value={form.outputPath}
              onChange={e => setForm(p => ({ ...p, outputPath: e.target.value }))}
              placeholder="/outputs/task-name/"
            />
            <Input
              label="结果回调地址（可选）"
              value={form.callback}
              onChange={e => setForm(p => ({ ...p, callback: e.target.value }))}
              placeholder="https://notify.zhiyun.ai/hooks/batch"
            />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={creating}>{creating ? '提交中...' : '提交任务'}</Button>
          <Link to="/user/inference/batch">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
