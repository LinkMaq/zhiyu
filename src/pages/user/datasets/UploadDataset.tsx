import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, CloudUpload, FileText, X, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { appendRuntimeDataset } from '../../../data/mockDatasetsRuntime';
import type { Dataset, DatasetAccessLevel, DatasetCategory, DatasetTask } from '../../../types';

export default function UploadDataset() {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', task: '', format: '', language: '', license: '', access: 'private' });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const names = Array.from(e.dataTransfer.files).map(f => f.name);
    setFiles(prev => [...new Set([...prev, ...names])]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const now = new Date();
    const dateText = now.toISOString().slice(0, 10);
    const taskMap: Record<string, DatasetTask> = {
      'text-generation': 'generation',
      'instruction-tuning': 'generation',
      ner: 'ner',
      'image-segmentation': 'segmentation',
      'speech-recognition': 'classification',
      'code-review': 'classification',
    };

    const accessLevel = (form.access === 'public' ? 'public' : form.access === 'team' ? 'team' : 'private') as DatasetAccessLevel;
    const dataset: Dataset = {
      id: `ds-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim() || '用户上传数据集',
      category: 'nlp' as DatasetCategory,
      task: [taskMap[form.task] ?? 'classification'],
      status: 'active',
      accessLevel,
      size: files.length > 0 ? `${files.length} 个文件` : '待统计',
      records: 0,
      format: form.format || '未指定',
      language: form.language || '未指定',
      source: '用户上传',
      license: form.license || '内部使用',
      tags: ['用户上传'],
      labels: [],
      creator: '张远航',
      organization: '中国电信AI研究院',
      createdAt: dateText,
      updatedAt: dateText,
      downloads: 0,
      stars: 0,
      rating: 5,
      reviews: 0,
      versions: [
        {
          version: 'v1.0',
          createdAt: dateText,
          size: files.length > 0 ? `${files.length} 个文件` : '待统计',
          records: 0,
          changes: '初始上传版本',
          frozen: false,
          createdBy: '张远航',
        },
      ],
      processingMethod: '上传后处理',
      annotationScheme: '待配置',
      collectionMethod: '手动上传',
      encryptionEnabled: false,
      watermarkEnabled: false,
    };
    appendRuntimeDataset(dataset);

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">数据集上传成功</h2>
      <p className="text-text-muted text-sm">数据集 <span className="text-text-secondary font-medium">{form.name || '未命名'}</span> 已提交，后台正在处理中</p>
      <Link to="/user/datasets"><Button variant="outline" leftIcon={<ArrowLeft size={14} />}>返回数据集列表</Button></Link>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/datasets" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 数据集
        </Link>
        <span>/</span>
        <span className="text-text-secondary">上传数据集</span>
      </div>
      <PageHeader title="上传数据集" subtitle="支持 CSV、JSON、JSONL、Parquet 等格式" icon={<Upload size={20} />} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drop zone */}
        <Card>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-white/2'}`}
          >
            <CloudUpload size={36} className={dragOver ? 'text-primary' : 'text-text-muted'} />
            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary">拖拽文件至此处，或点击选择文件</p>
              <p className="text-xs text-text-muted mt-1">支持 .csv / .json / .jsonl / .parquet / .zip · 最大 100GB</p>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(f => (
                <div key={f} className="flex items-center gap-3 bg-base border border-border rounded-lg px-3 py-2">
                  <FileText size={14} className="text-primary" />
                  <span className="flex-1 text-sm text-text-secondary">{f}</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter(x => x !== f))} className="text-text-muted hover:text-error transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Metadata */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">数据集信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="数据集名称 *" placeholder="如：MyDataset-v1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Select label="任务类型 *" value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} options={[
              { value: '', label: '请选择任务类型' },
              { value: 'text-generation', label: '文本生成' },
              { value: 'instruction-tuning', label: '指令微调' },
              { value: 'ner', label: '命名实体识别' },
              { value: 'image-segmentation', label: '图像分割' },
              { value: 'speech-recognition', label: '语音识别' },
              { value: 'code-review', label: '代码审查' },
            ]} />
            <Select label="数据格式" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} options={[
              { value: '', label: '请选择格式' },
              { value: 'jsonl', label: 'JSONL' },
              { value: 'json', label: 'JSON' },
              { value: 'csv', label: 'CSV' },
              { value: 'parquet', label: 'Parquet' },
            ]} />
            <Select label="访问权限" value={form.access} onChange={e => setForm(f => ({ ...f, access: e.target.value }))} options={[
              { value: 'private', label: '私有（仅自己可见）' },
              { value: 'team', label: '团队（工作区内可见）' },
              { value: 'public', label: '公开（所有用户可见）' },
            ]} />
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-text-secondary block mb-1.5">数据集描述</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="描述数据集的来源、用途、特点等..."
                className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading} leftIcon={<Upload size={14} />}>提交上传</Button>
          <Link to="/user/datasets"><Button variant="outline">取消</Button></Link>
        </div>
      </form>
    </div>
  );
}
