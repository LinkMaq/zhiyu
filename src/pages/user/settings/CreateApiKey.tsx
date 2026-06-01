import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, CheckCircle2, Copy } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { appendRuntimeApiKey } from '../../../data/mockApiKeyRuntime';

export default function CreateApiKey() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    scope: 'all',
    rateLimit: '1000',
    expiresAt: '',
    callLimit: '',
    concurrencyLimit: '10',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('请填写密钥名称');
      return;
    }
    setCreating(true);
    await new Promise(r => setTimeout(r, 800));
    const generatedKey = `zy-sk-${Math.random().toString(36).slice(2, 10)}${'x'.repeat(32)}`;
    const now = new Date().toISOString();
    appendRuntimeApiKey({
      id: `ak-${Date.now()}`,
      name: form.name.trim(),
      key: generatedKey,
      prefix: generatedKey.slice(0, 10),
      model: form.scope === 'all' ? '全部模型' : form.scope,
      status: 'active',
      createdAt: now,
      expiresAt: form.expiresAt || undefined,
      totalCalls: 0,
      callLimit: form.callLimit ? Number(form.callLimit) : undefined,
      concurrencyLimit: form.concurrencyLimit ? Number(form.concurrencyLimit) : undefined,
      creator: '张远航',
    });
    setCreating(false);
    setNewKey(generatedKey);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    toast.success('API Key 已复制到剪贴板');
  };

  if (newKey) return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-in max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">密钥创建成功</h2>
      <p className="text-text-muted text-sm text-center">请立即复制并妥善保存此密钥。出于安全考虑，密钥只会显示一次，关闭后将无法再次查看完整内容。</p>
      <div className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-text-primary font-mono break-all">{newKey}</code>
          <button
            onClick={() => handleCopy(newKey)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
            title="复制密钥"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/user/settings')}>
          返回密钥管理
        </Button>
        <Button leftIcon={<Copy size={14} />} onClick={() => handleCopy(newKey)}>
          复制密钥
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/settings" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> API 密钥
        </Link>
        <span>/</span>
        <span className="text-text-secondary">创建密钥</span>
      </div>
      <PageHeader
        title="创建 API 密钥"
        subtitle="生成用于调用平台推理服务的访问密钥"
        icon={<KeyRound size={20} />}
      />

      <form onSubmit={handleCreate} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">密钥配置</h3>
          <div className="space-y-4">
            <Input
              label="密钥名称 *"
              placeholder="如：prod-inference-key"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Select
              label="模型权限范围"
              value={form.scope}
              onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              options={[
                { value: 'all', label: '全部模型' },
                { value: 'llm', label: '仅大语言模型' },
                { value: 'vision', label: '仅视觉模型' },
                { value: 'speech', label: '仅语音模型' },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="速率限制 (RPM)"
                value={form.rateLimit}
                onChange={e => setForm(f => ({ ...f, rateLimit: e.target.value }))}
                hint="每分钟最大请求数"
                type="number"
                min="1"
              />
              <Input
                label="并发上限"
                value={form.concurrencyLimit}
                onChange={e => setForm(f => ({ ...f, concurrencyLimit: e.target.value }))}
                hint="最大并发连接数"
                type="number"
                min="1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="总调用上限"
                value={form.callLimit}
                onChange={e => setForm(f => ({ ...f, callLimit: e.target.value }))}
                hint="留空为不限制"
                type="number"
                min="1"
                placeholder="不限制"
              />
              <Input
                label="过期时间"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                hint="留空为永久有效"
                type="date"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={creating}>创建密钥</Button>
          <Link to="/user/settings">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
