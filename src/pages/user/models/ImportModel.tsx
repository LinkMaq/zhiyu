import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { appendImportedModel } from '../../../data/mockModelRuntime';
import type { ModelAccessLevel, ModelCategory, ModelFramework } from '../../../types';

type ImportStageKey = 'validate' | 'encrypt' | 'upload' | 'register' | 'complete';

interface ImportStage {
  key: ImportStageKey;
  label: string;
  done: boolean;
  running?: boolean;
}

const LOCAL_EXTENSIONS = ['pt', 'gguf', 'safetensors', 'bin', 'onnx', 'zip'];
const MAX_LOCAL_SIZE_BYTES = 10 * 1024 * 1024 * 1024;
const IMPORT_TOTAL_MS = 12000;

function formatBytes(bytes: number) {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`;
  if (bytes >= kb) return `${(bytes / kb).toFixed(2)} KB`;
  return `${bytes} B`;
}

function getExtension(name: string) {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function buildDigest(file: File) {
  const seed = `${file.name}:${file.size}:${file.lastModified}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export default function ImportModel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressRef = useRef(0);
  const [importing, setImporting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modelName, setModelName] = useState('');
  const [importedModelId, setImportedModelId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStages, setImportStages] = useState<ImportStage[]>([]);
  const [progress, setProgress] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [form, setForm] = useState({
    source: 'git',
    url: '',
    name: '',
    category: 'nlp',
    framework: 'PyTorch',
    access: 'private',
    desc: '',
    encryptionAlgo: 'aes',
    sdkEncrypt: true,
    transferEncrypt: true,
    runtimeDecrypt: true,
    tokenProtect: true,
    authToken: '',
  });

  const resetForm = () => {
    setForm({
      source: 'git',
      url: '',
      name: '',
      category: 'nlp',
      framework: 'PyTorch',
      access: 'private',
      desc: '',
      encryptionAlgo: 'aes',
      sdkEncrypt: true,
      transferEncrypt: true,
      runtimeDecrypt: true,
      tokenProtect: true,
      authToken: '',
    });
    setSelectedFile(null);
    setImportStages([]);
    setImportedModelId('');
    setProgress(0);
    progressRef.current = 0;
    setRemainingMs(0);
  };

  const setProgressValue = (value: number) => {
    progressRef.current = value;
    setProgress(value);
  };

  const markStageDone = (key: ImportStageKey, label: string) => {
    setImportStages(prev => {
      const exists = prev.some(item => item.key === key);
      if (exists) return prev.map(item => (item.key === key ? { ...item, done: true, running: false } : item));
      return [...prev, { key, label, done: true, running: false }];
    });
  };

  const markStageRunning = (key: ImportStageKey, label: string) => {
    setImportStages(prev => {
      const withStopped = prev.map(item => ({ ...item, running: false }));
      const exists = withStopped.some(item => item.key === key);
      if (exists) return withStopped.map(item => (item.key === key ? { ...item, running: true } : item));
      return [...withStopped, { key, label, done: false, running: true }];
    });
  };

  const animateProgressTo = async (target: number, durationMs: number) => {
    const start = progressRef.current;
    const diff = Math.max(0, target - start);
    if (diff === 0 || durationMs <= 0) {
      setProgressValue(target);
      setRemainingMs(Math.max(0, Math.round((1 - target / 100) * IMPORT_TOTAL_MS)));
      return;
    }
    const tick = 80;
    const steps = Math.max(1, Math.round(durationMs / tick));
    for (let i = 1; i <= steps; i += 1) {
      await new Promise(resolve => setTimeout(resolve, tick));
      const next = Math.min(target, start + (diff * i) / steps);
      setProgressValue(Math.round(next));
      setRemainingMs(Math.max(0, Math.round((1 - next / 100) * IMPORT_TOTAL_MS)));
    }
  };

  const validateLocalFile = (file: File) => {
    const ext = getExtension(file.name);
    if (!LOCAL_EXTENSIONS.includes(ext)) {
      toast.warning('文件类型不支持', `仅支持 ${LOCAL_EXTENSIONS.map(item => `.${item}`).join(' / ')} 格式`);
      return false;
    }
    if (file.size <= 0) {
      toast.warning('文件为空', '请重新选择有效模型文件');
      return false;
    }
    if (file.size > MAX_LOCAL_SIZE_BYTES) {
      toast.warning('文件过大', `单文件大小不能超过 ${formatBytes(MAX_LOCAL_SIZE_BYTES)}`);
      return false;
    }
    return true;
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateLocalFile(file)) {
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
    if (!form.name.trim()) {
      const pureName = file.name.replace(/\.[^.]+$/, '');
      setForm(prev => ({ ...prev, name: pureName }));
    }
    toast.success('文件选择成功', `${file.name} (${formatBytes(file.size)})`);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.warning('缺少模型名称', '请填写模型名称后再导入');
      return;
    }

    if (form.source === 'local') {
      if (!selectedFile) {
        toast.warning('请先选择本地模型文件', '导入来源为本地文件时必须上传模型文件');
        return;
      }
      if (!validateLocalFile(selectedFile)) return;
    } else if (!form.url.trim()) {
      toast.warning('缺少导入路径', '请填写对应来源路径后再导入');
      return;
    }

    if (form.source === 'local' && !form.sdkEncrypt) {
      toast.warning('请启用 SDK 本地加密', '本地文件导入必须启用本地加密以确保密文上传');
      return;
    }

    if (form.tokenProtect && !form.authToken.trim()) {
      toast.warning('缺少授权 Token', '启用 Token 授权解密时必须填写 Token');
      return;
    }

    setImportStages([]);
    setProgress(0);
    progressRef.current = 0;
    setRemainingMs(IMPORT_TOTAL_MS);
    setImporting(true);

    markStageRunning('validate', '校验导入参数与模型文件');
    await animateProgressTo(12, 1300);
    markStageDone('validate', '校验导入参数与模型文件');

    if (form.source === 'local') {
      const algoLabel = form.encryptionAlgo === 'sm4' ? 'SM4-GCM' : 'AES-256-GCM';
      markStageRunning('encrypt', `通过 SDK 本地加密模型文件（${algoLabel}）`);
      await animateProgressTo(44, 3200);
      markStageDone('encrypt', `通过 SDK 本地加密模型文件（${algoLabel}）`);

      markStageRunning('upload', '密文分片上传（TLS 1.3）');
      await animateProgressTo(72, 2600);
      markStageDone('upload', '密文分片上传（TLS 1.3）');
    } else {
      markStageRunning('upload', '远端模型地址鉴权并拉取');
      await animateProgressTo(72, 2800);
      markStageDone('upload', '远端模型地址鉴权并拉取');
    }

    markStageRunning('register', '模型元数据注册与版本初始化');
    await animateProgressTo(92, 2200);
    markStageDone('register', '模型元数据注册与版本初始化');

    const imported = appendImportedModel({
      name: form.name.trim(),
      description: form.desc.trim() || '本地文件上传导入模型',
      source: form.source,
      category: form.category as ModelCategory,
      framework: form.framework as ModelFramework,
      accessLevel: form.access as ModelAccessLevel,
      encrypted: form.sdkEncrypt,
      creator: '张远航',
      organization: '中国电信AI研究院',
      extension: selectedFile ? getExtension(selectedFile.name) : 'bin',
      sizeBytes: selectedFile?.size ?? 0,
      fileDigest: selectedFile ? buildDigest(selectedFile) : `${Date.now()}`,
      encryptionAlgorithm: form.encryptionAlgo as 'aes' | 'sm4',
    });

    markStageRunning('complete', '导入完成并生成可用模型');
    await animateProgressTo(100, 1200);
    markStageDone('complete', '导入完成并生成可用模型');
    setRemainingMs(0);

    setImporting(false);
    setModelName(imported.name);
    setImportedModelId(imported.id);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">模型导入已提交</h2>
      <p className="text-text-muted text-sm">模型 <span className="text-text-secondary font-medium">{modelName}</span> 正在后台导入，完成后将出现在模型列表</p>
      {importedModelId && (
        <p className="text-xs text-text-muted">模型编号：{importedModelId}</p>
      )}
      {importStages.length > 0 && (
        <div className="w-full max-w-xl bg-white/5 border border-border rounded-lg p-3">
          <p className="text-xs text-text-muted mb-2">导入执行轨迹</p>
          <div className="space-y-1.5">
            {importStages.map(stage => (
              <p key={stage.key} className="text-xs text-text-secondary">{stage.done ? '✓' : stage.running ? '●' : '…'} {stage.label}</p>
            ))}
          </div>
        </div>
      )}
      <div className="text-xs text-text-muted bg-white/5 border border-border rounded-lg px-3 py-2">
        已启用全链路防护：存储加密、传输加密、运行解密、明文不落盘
      </div>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate(`/user/models?tab=mine${importedModelId ? `&model=${importedModelId}` : ''}`)}>
          返回模型仓库
        </Button>
        <Button onClick={() => { setSubmitted(false); resetForm(); }}>
          再导入一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/models" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 模型仓库
        </Link>
        <span>/</span>
        <span className="text-text-secondary">导入模型</span>
      </div>
      <PageHeader
        title="导入模型"
        subtitle="从 Git、对象存储或模型市场导入模型到仓库"
        icon={<Package size={20} />}
      />

      {(importing || progress > 0) && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-text-primary">导入执行中</p>
            <span className="text-xs text-text-muted">{progress}% · 预计剩余 {Math.ceil(remainingMs / 1000)}s</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 animate-pulse" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 space-y-1.5">
            {importStages.map(stage => (
              <p key={stage.key} className={`text-xs ${stage.done ? 'text-success' : stage.running ? 'text-primary animate-pulse' : 'text-text-muted'}`}>
                {stage.done ? '✓' : stage.running ? '●' : '○'} {stage.label}
              </p>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-text-muted">流程时长控制：约 12 秒（小于 30 秒）。</p>
        </Card>
      )}

      <form onSubmit={handleImport} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">来源配置</h3>
          <div className="space-y-4">
            <Select
              label="导入来源"
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              options={[
                { value: 'git', label: 'Git 仓库（GitHub / GitLab / Gitee）' },
                { value: 'local', label: '本地文件上传' },
                { value: 's3', label: '对象存储（S3 / MinIO）' },
                { value: 'market', label: '模型市场（HuggingFace / ModelScope）' },
              ]}
            />
            {form.source === 'local' ? (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">上传模型文件</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pt,.gguf,.safetensors,.bin,.onnx,.zip"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={handlePickFile}
                  className="w-full border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <Plus size={20} className="mx-auto text-text-muted mb-2" />
                  <p className="text-xs text-text-muted">点击选择本地模型文件</p>
                  <p className="text-[10px] text-text-muted mt-1">支持 .pt / .gguf / .safetensors / .bin / .onnx / .zip，单文件最大 10GB</p>
                </button>
                {selectedFile && (
                  <div className="mt-2 text-xs text-text-secondary bg-white/5 border border-border rounded-lg px-3 py-2">
                    已选择：{selectedFile.name}（{formatBytes(selectedFile.size)}）
                  </div>
                )}
              </div>
            ) : (
              <Input
                label={form.source === 's3' ? 'S3 路径（s3://bucket/path）' : form.source === 'market' ? '模型 ID（如 Qwen/Qwen2-7B）' : 'Git 仓库 URL'}
                placeholder={form.source === 's3' ? 's3://my-bucket/models/llama3' : form.source === 'market' ? 'meta-llama/Llama-3-8B' : 'https://github.com/org/model-repo.git'}
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              />
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">模型信息</h3>
          <div className="space-y-4">
            <Input
              label="模型名称 *"
              placeholder="为导入的模型命名"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="类别"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                options={[
                  { value: 'nlp', label: 'NLP' },
                  { value: 'cv', label: '计算机视觉' },
                  { value: 'multimodal', label: '多模态' },
                  { value: 'audio', label: '语音' },
                  { value: 'tabular', label: '图表/表格' },
                ]}
              />
              <Select
                label="框架"
                value={form.framework}
                onChange={e => setForm(f => ({ ...f, framework: e.target.value }))}
                options={[
                  { value: 'PyTorch', label: 'PyTorch' },
                  { value: 'TensorFlow', label: 'TensorFlow' },
                  { value: 'PaddlePaddle', label: 'PaddlePaddle' },
                  { value: 'ONNX', label: 'ONNX' },
                ]}
              />
            </div>
            <Select
              label="访问权限"
              value={form.access}
              onChange={e => setForm(f => ({ ...f, access: e.target.value }))}
              options={[
                { value: 'private', label: '私有（仅自己可见）' },
                { value: 'tenant', label: '租户共享（团队内可见）' },
                { value: 'public', label: '公开（所有用户可见）' },
              ]}
            />
            <Input
              label="描述（可选）"
              placeholder="简要描述模型的用途"
              value={form.desc}
              onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-success" />
            <h3 className="text-sm font-semibold text-text-primary">安全防护配置</h3>
          </div>
          <div className="space-y-4">
            <Select
              label="模型文件加密算法"
              value={form.encryptionAlgo}
              onChange={e => setForm(f => ({ ...f, encryptionAlgo: e.target.value }))}
              options={[
                { value: 'aes', label: 'AES-256-GCM（推荐）' },
                { value: 'sm4', label: 'SM4-GCM（国密）' },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'sdkEncrypt', title: 'SDK 本地加密', desc: '客户端加密后上传，模型文件以密文传输' },
                { key: 'transferEncrypt', title: '传输加密', desc: 'TLS 1.3 传输保护，防止链路窃听' },
                { key: 'runtimeDecrypt', title: '运行解密', desc: '推理运行时内存态解密加载' },
                { key: 'tokenProtect', title: 'Token 授权解密', desc: '通过授权 Token 控制密钥访问' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, [item.key]: !(f as any)[item.key] }))}
                  className={`text-left rounded-lg border px-3 py-2 transition-colors ${(form as any)[item.key] ? 'border-primary/40 bg-primary/10' : 'border-border bg-white/5'}`}
                >
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                </button>
              ))}
            </div>

            {form.tokenProtect && (
              <Input
                label="授权 Token"
                placeholder="输入模型解密授权 Token"
                value={form.authToken}
                onChange={e => setForm(f => ({ ...f, authToken: e.target.value }))}
                required
              />
            )}

            <div className="text-xs text-text-muted bg-white/5 border border-border rounded-lg p-3">
              当前链路：{form.encryptionAlgo === 'sm4' ? 'SM4' : 'AES-256'} 存储加密 / {form.transferEncrypt ? 'TLS 传输加密' : '无传输加密'} / {form.runtimeDecrypt ? '运行态解密' : '静态解密'} / {form.tokenProtect ? 'Token 鉴权' : '无鉴权'}
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={importing}>{importing ? '导入中...' : '开始导入'}</Button>
          <Link to="/user/models">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
