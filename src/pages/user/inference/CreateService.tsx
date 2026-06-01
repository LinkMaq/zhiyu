import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cloud } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { appendRuntimeInferenceService } from '../../../data/mockInferenceRuntime';
import type { InferenceService } from '../../../types';

const INSTANCE_TYPE_CONFIG: Record<string, { gpuType: string; gpuCount: number; cpu: number; memory: string }> = {
  'gpu.a100.2x': { gpuType: 'NVIDIA A100 80GB', gpuCount: 2, cpu: 16, memory: '64Gi' },
  'gpu.a100.4x': { gpuType: 'NVIDIA A100 80GB', gpuCount: 4, cpu: 32, memory: '128Gi' },
  'gpu.h100.2x': { gpuType: 'NVIDIA H100 80GB', gpuCount: 2, cpu: 24, memory: '96Gi' },
  'gpu.a10.1x': { gpuType: 'NVIDIA A10 24GB', gpuCount: 1, cpu: 8, memory: '32Gi' },
};

const FRAMEWORK_MAP: Record<string, string> = {
  vllm: 'vLLM',
  sglang: 'SGLang',
  triton: 'Triton',
  tgi: 'TGI',
};

export default function CreateService() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', model: '', framework: 'vllm', instanceType: 'gpu.a100.2x',
    replicas: '2', pdEnabled: false, maxTokens: '4096', concurrency: '32',
    deployMode: 'standard' as 'standard' | 'pd',
    autoScaling: false, scaleMetric: 'concurrency' as 'concurrency' | 'qps', scaleThreshold: '60',
    minReplicas: '1', maxReplicas: '8',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.model.trim()) {
      toast.warning('请完善必填信息', '服务名称和推理模型不能为空');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const spec = INSTANCE_TYPE_CONFIG[form.instanceType] ?? INSTANCE_TYPE_CONFIG['gpu.a100.2x'];
    const now = new Date().toISOString();
    const service: InferenceService = {
      id: `inf-${Date.now()}`,
      name: form.name.trim(),
      model: form.model,
      modelVersion: 'v1.0.0',
      status: 'deploying',
      framework: FRAMEWORK_MAP[form.framework] ?? 'vLLM',
      gpuType: spec.gpuType,
      gpuCount: spec.gpuCount,
      replicas: Number(form.replicas) || 1,
      minReplicas: form.autoScaling ? Number(form.minReplicas) || 1 : Number(form.replicas) || 1,
      maxReplicas: form.autoScaling ? Number(form.maxReplicas) || Number(form.replicas) || 1 : Number(form.replicas) || 1,
      cpu: spec.cpu,
      memory: spec.memory,
      qps: 0,
      avgLatency: 0,
      p99Latency: 0,
      availability: 0,
      createdAt: now,
      creator: '张远航',
      endpoint: `https://api.zhiyun.ai/v1/infer/${form.name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
      namespace: 'user-workspace',
      autoScaling: form.autoScaling,
      scaleMetric: form.scaleMetric === 'qps' ? 'qps' : 'latency',
      scaleThreshold: Number(form.scaleThreshold) || 60,
      deployMode: 'model',
      pdSeparation: form.deployMode === 'pd',
      prefillReplicas: form.deployMode === 'pd' ? 1 : undefined,
      decodeReplicas: form.deployMode === 'pd' ? Math.max(1, (Number(form.replicas) || 1) - 1) : undefined,
      batchSize: Math.max(1, Math.round((Number(form.concurrency) || 1) / 2)),
    };
    appendRuntimeInferenceService(service);

    setLoading(false);
    toast.success('推理服务部署请求已提交，预计 2-3 分钟完成部署');
    navigate('/user/inference');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/inference" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 推理服务
        </Link>
        <span>/</span>
        <span className="text-text-secondary">部署新服务</span>
      </div>
      <PageHeader title="部署推理服务" subtitle="将模型部署为在线 API 服务" icon={<Cloud size={20} />} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">基本配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="服务名称 *" placeholder="如：qwen72b-prod-svc" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Select label="推理模型 *" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} options={[
              { value: '', label: '请选择模型' },
              { value: 'Qwen2.5-72B-Instruct-ZY', label: 'Qwen2.5-72B-Instruct-ZY' },
              { value: 'InternVL2-26B-ZY-Vision', label: 'InternVL2-26B-ZY-Vision' },
              { value: 'DeepSeek-R1-ZY-8B', label: 'DeepSeek-R1-ZY-8B' },
              { value: 'Bert-Finance-NER-ZY', label: 'Bert-Finance-NER-ZY' },
              { value: 'Whisper-Large-Sichuan', label: 'Whisper-Large-Sichuan' },
            ]} />
            <Select label="推理框架" value={form.framework} onChange={e => setForm(f => ({ ...f, framework: e.target.value }))} options={[
              { value: 'vllm', label: 'vLLM（推荐，LLM 最优）' },
              { value: 'sglang', label: 'SGLang（多模态推荐）' },
              { value: 'triton', label: 'NVIDIA Triton（通用）' },
              { value: 'tgi', label: 'TGI（兼容 HuggingFace）' },
            ]} />
            <Select label="实例规格" value={form.instanceType} onChange={e => setForm(f => ({ ...f, instanceType: e.target.value }))} options={[
              { value: 'gpu.a100.2x', label: 'A100 80G × 2（推荐）' },
              { value: 'gpu.a100.4x', label: 'A100 80G × 4（大模型）' },
              { value: 'gpu.h100.2x', label: 'H100 80G × 2（最高性能）' },
              { value: 'gpu.a10.1x', label: 'A10 24G × 1（小模型）' },
            ]} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">部署模式</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { key: 'standard', label: '标准模式', desc: '统一副本处理所有请求，简单易用', badge: '推荐' },
              { key: 'pd', label: 'PD 分离模式', desc: 'Prefill 与 Decode 阶段独立扩缩容，高并发吞吐最优', badge: '高级' },
            ].map(mode => (
              <button key={mode.key} type="button"
                onClick={() => setForm(f => ({ ...f, deployMode: mode.key as 'standard' | 'pd', pdEnabled: mode.key === 'pd' }))}
                className={`text-left p-4 rounded-xl border transition-colors ${form.deployMode === mode.key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30 bg-white/[0.02]'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-text-primary">{mode.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${mode.key === 'standard' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>{mode.badge}</span>
                </div>
                <p className="text-xs text-text-muted">{mode.desc}</p>
              </button>
            ))}
          </div>
          {form.deployMode === 'pd' && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <Input label="Prefill 副本数" type="number" value="2" onChange={() => {}} placeholder="2" />
              <Input label="Decode 副本数" type="number" value="4" onChange={() => {}} placeholder="4" />
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">扩缩容配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="副本数量" value={form.replicas} onChange={e => setForm(f => ({ ...f, replicas: e.target.value }))} options={[
              { value: '1', label: '1 副本（单点）' },
              { value: '2', label: '2 副本（高可用）' },
              { value: '3', label: '3 副本' },
              { value: '4', label: '4 副本' },
            ]} />
            <Input label="最大并发数" value={form.concurrency} onChange={e => setForm(f => ({ ...f, concurrency: e.target.value }))} />
            <Input label="最大输出 Token" value={form.maxTokens} onChange={e => setForm(f => ({ ...f, maxTokens: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">自动弹性扩缩（HPA）</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, autoScaling: !f.autoScaling }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.autoScaling ? 'bg-primary' : 'bg-white/15'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${form.autoScaling ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <p className="text-xs text-text-muted">根据负载指标自动增减副本</p>
            </div>
          </div>
          {form.autoScaling && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="扩缩容指标" value={form.scaleMetric} onChange={e => setForm(f => ({ ...f, scaleMetric: e.target.value as 'concurrency' | 'qps' }))} options={[
                { value: 'concurrency', label: '目标并发数（Concurrency）' },
                { value: 'qps', label: 'QPS 阈值（每秒请求数）' },
              ]} />
              <Input label={form.scaleMetric === 'concurrency' ? '目标并发数' : 'QPS 阈值'} type="number"
                value={form.scaleThreshold} onChange={e => setForm(f => ({ ...f, scaleThreshold: e.target.value }))} />
              <Input label="最小副本数" type="number" value={form.minReplicas} onChange={e => setForm(f => ({ ...f, minReplicas: e.target.value }))} />
              <Input label="最大副本数" type="number" value={form.maxReplicas} onChange={e => setForm(f => ({ ...f, maxReplicas: e.target.value }))} />
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading} leftIcon={<Cloud size={14} />}>部署服务</Button>
          <Link to="/user/inference"><Button variant="outline">取消</Button></Link>
        </div>
      </form>
    </div>
  );
}
