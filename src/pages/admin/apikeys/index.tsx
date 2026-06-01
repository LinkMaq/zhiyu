import { useState } from 'react';
import { KeyRound, Plus, Ban, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { mockApiKeys } from '../../../data/mockData';
import type { ApiKey } from '../../../types';

type DeliveryChannel = 'console' | 'email' | 'webhook';
type DistributionScope = 'internal' | 'partner' | 'public';
type AuditLevel = 'basic' | 'detailed' | 'full';

interface ApiKeyPolicy {
  distribution: {
    scope: DistributionScope;
    receiver: string;
    delivery: DeliveryChannel;
  };
  rateLimit: {
    qps: number;
    rpm: number;
    tpm: number;
    burst: number;
    ipWhitelist: string;
  };
  disablePolicy: {
    suspendOnAbuse: boolean;
    abuseThreshold: number;
    expiresAt?: string;
  };
  audit: {
    enabled: boolean;
    level: AuditLevel;
    retainDays: number;
    webhook: string;
  };
}

interface ApiKeyRow extends ApiKey {
  policy?: ApiKeyPolicy;
}

interface CreateKeyForm {
  name: string;
  model: string;
  callLimit: string;
  concurrencyLimit: string;
  scope: DistributionScope;
  receiver: string;
  delivery: DeliveryChannel;
  qps: string;
  rpm: string;
  tpm: string;
  burst: string;
  ipWhitelist: string;
  expiresAt: string;
  suspendOnAbuse: boolean;
  abuseThreshold: string;
  auditEnabled: boolean;
  auditLevel: AuditLevel;
  retainDays: string;
  auditWebhook: string;
}

const INITIAL_FORM: CreateKeyForm = {
  name: '',
  model: 'Qwen2.5-72B-Instruct-ZY',
  callLimit: '1000000',
  concurrencyLimit: '20',
  scope: 'internal',
  receiver: '平台研发组',
  delivery: 'console',
  qps: '150',
  rpm: '6000',
  tpm: '400000',
  burst: '300',
  ipWhitelist: '',
  expiresAt: '',
  suspendOnAbuse: true,
  abuseThreshold: '5',
  auditEnabled: true,
  auditLevel: 'detailed',
  retainDays: '180',
  auditWebhook: '',
};

function toInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export default function AdminApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>(mockApiKeys as ApiKeyRow[]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [form, setForm] = useState<CreateKeyForm>(INITIAL_FORM);
  const { toast } = useToast();

  const resetForm = () => setForm(INITIAL_FORM);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="API 密钥管理" subtitle="管理平台所有 API 密钥的生命周期：创建、分发、限流、禁用、审计" icon={<KeyRound size={20} />} />

      <div className="flex items-center justify-end">
        <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setShowCreateKey(true)}>创建密钥</Button>
      </div>

      <Card noPadding>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted border-b border-border">
              {['密钥名称', '前缀', '关联模型', '状态', '调用量', '并发限额', '创建时间', '过期时间', '操作'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-text-secondary divide-y divide-border/30">
            {apiKeys.map(k => (
              <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{k.name}</p>
                  {k.policy && (
                    <p className="text-[11px] text-text-muted mt-1">
                      {k.policy.distribution.scope} · {k.policy.distribution.delivery} · 审计{ k.policy.audit.enabled ? '开启' : '关闭' }
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono">{k.prefix}…</td>
                <td className="px-4 py-3 max-w-[140px] truncate">{k.model}</td>
                <td className="px-4 py-3">
                  <Badge variant={k.status === 'active' ? 'success' : k.status === 'disabled' ? 'error' : 'warning'}>
                    {k.status === 'active' ? '启用' : k.status === 'disabled' ? '禁用' : '已过期'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span>{k.totalCalls.toLocaleString()}</span>
                    {k.callLimit && <span className="text-text-muted">/ {k.callLimit.toLocaleString()}</span>}
                  </div>
                  {k.callLimit && (
                    <div className="w-20 h-1 bg-border rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (k.totalCalls / k.callLimit) * 100)}%` }} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">{k.concurrencyLimit ?? '—'}</td>
                <td className="px-4 py-3 text-text-muted">{k.createdAt}</td>
                <td className="px-4 py-3 text-text-muted">{k.expiresAt ?? '永久'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {k.status === 'active' ? (
                      <button
                        className="p-1.5 rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                        title="禁用"
                        onClick={() => {
                          setApiKeys(prev => prev.map(x => x.id === k.id ? { ...x, status: 'disabled' as const } : x));
                          toast.warning('已禁用', `${k.name} 已被禁用`);
                        }}
                      >
                        <Ban size={12} />
                      </button>
                    ) : (
                      <button
                        className="p-1.5 rounded hover:bg-success/10 text-text-muted hover:text-success transition-colors"
                        title="启用"
                        onClick={() => {
                          setApiKeys(prev => prev.map(x => x.id === k.id ? { ...x, status: 'active' as const } : x));
                          toast.success('已启用', `${k.name} 已重新启用`);
                        }}
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={showCreateKey} onClose={() => { setShowCreateKey(false); resetForm(); }} title="创建 API 密钥" width="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="密钥名称" placeholder="如：生产环境-推理服务" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
            <Input label="关联模型" placeholder="如：Qwen2.5-72B-Instruct-ZY" value={form.model} onChange={e => setForm(prev => ({ ...prev, model: e.target.value }))} />
            <Input label="调用总量上限" type="number" value={form.callLimit} onChange={e => setForm(prev => ({ ...prev, callLimit: e.target.value }))} />
            <Input label="并发上限" type="number" value={form.concurrencyLimit} onChange={e => setForm(prev => ({ ...prev, concurrencyLimit: e.target.value }))} />
          </div>

          <div className="rounded-xl border border-border p-3 space-y-3">
            <p className="text-sm font-medium text-text-primary">分发策略</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="分发范围"
                value={form.scope}
                onChange={e => setForm(prev => ({ ...prev, scope: e.target.value as DistributionScope }))}
                options={[
                  { value: 'internal', label: '内部使用' },
                  { value: 'partner', label: '合作伙伴' },
                  { value: 'public', label: '公开调用' },
                ]}
              />
              <Select
                label="分发渠道"
                value={form.delivery}
                onChange={e => setForm(prev => ({ ...prev, delivery: e.target.value as DeliveryChannel }))}
                options={[
                  { value: 'console', label: '控制台下发' },
                  { value: 'email', label: '邮件分发' },
                  { value: 'webhook', label: 'Webhook 下发' },
                ]}
              />
              <Input label="接收方" placeholder="团队/邮箱/系统名" value={form.receiver} onChange={e => setForm(prev => ({ ...prev, receiver: e.target.value }))} />
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 space-y-3">
            <p className="text-sm font-medium text-text-primary">限流策略</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input label="QPS" type="number" value={form.qps} onChange={e => setForm(prev => ({ ...prev, qps: e.target.value }))} />
              <Input label="RPM" type="number" value={form.rpm} onChange={e => setForm(prev => ({ ...prev, rpm: e.target.value }))} />
              <Input label="TPM" type="number" value={form.tpm} onChange={e => setForm(prev => ({ ...prev, tpm: e.target.value }))} />
              <Input label="突发阈值" type="number" value={form.burst} onChange={e => setForm(prev => ({ ...prev, burst: e.target.value }))} />
            </div>
            <Input label="IP 白名单（可选）" placeholder="多个IP用逗号分隔" value={form.ipWhitelist} onChange={e => setForm(prev => ({ ...prev, ipWhitelist: e.target.value }))} />
          </div>

          <div className="rounded-xl border border-border p-3 space-y-3">
            <p className="text-sm font-medium text-text-primary">禁用策略</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="到期时间（可选）" type="date" value={form.expiresAt} onChange={e => setForm(prev => ({ ...prev, expiresAt: e.target.value }))} />
              <Input label="滥用阈值（触发次数）" type="number" value={form.abuseThreshold} onChange={e => setForm(prev => ({ ...prev, abuseThreshold: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={form.suspendOnAbuse}
                onChange={e => setForm(prev => ({ ...prev, suspendOnAbuse: e.target.checked }))}
                className="accent-primary"
              />
              超过滥用阈值自动禁用密钥
            </label>
          </div>

          <div className="rounded-xl border border-border p-3 space-y-3">
            <p className="text-sm font-medium text-text-primary">审计策略</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="审计级别"
                value={form.auditLevel}
                onChange={e => setForm(prev => ({ ...prev, auditLevel: e.target.value as AuditLevel }))}
                options={[
                  { value: 'basic', label: '基础审计' },
                  { value: 'detailed', label: '详细审计' },
                  { value: 'full', label: '全量审计' },
                ]}
              />
              <Input label="保留天数" type="number" value={form.retainDays} onChange={e => setForm(prev => ({ ...prev, retainDays: e.target.value }))} />
              <Input label="审计Webhook（可选）" placeholder="https://..." value={form.auditWebhook} onChange={e => setForm(prev => ({ ...prev, auditWebhook: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={form.auditEnabled}
                onChange={e => setForm(prev => ({ ...prev, auditEnabled: e.target.checked }))}
                className="accent-primary"
              />
              启用审计日志采集与告警回溯
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowCreateKey(false); resetForm(); }}>取消</Button>
            <Button onClick={() => {
              if (!form.name.trim()) {
                toast.warning('缺少密钥名称', '请输入密钥名称');
                return;
              }
              if (!form.model.trim()) {
                toast.warning('缺少关联模型', '请输入或选择关联模型');
                return;
              }

              const policy: ApiKeyPolicy = {
                distribution: {
                  scope: form.scope,
                  receiver: form.receiver.trim() || '未指定接收方',
                  delivery: form.delivery,
                },
                rateLimit: {
                  qps: toInt(form.qps, 100),
                  rpm: toInt(form.rpm, 3000),
                  tpm: toInt(form.tpm, 200000),
                  burst: toInt(form.burst, 200),
                  ipWhitelist: form.ipWhitelist.trim(),
                },
                disablePolicy: {
                  suspendOnAbuse: form.suspendOnAbuse,
                  abuseThreshold: toInt(form.abuseThreshold, 5),
                  expiresAt: form.expiresAt || undefined,
                },
                audit: {
                  enabled: form.auditEnabled,
                  level: form.auditLevel,
                  retainDays: toInt(form.retainDays, 180),
                  webhook: form.auditWebhook.trim(),
                },
              };

              const newKey = {
                id: `ak${Date.now()}`,
                name: form.name,
                key: 'zy-sk-new...',
                prefix: 'zy-sk-new',
                model: form.model,
                status: 'active' as const,
                createdAt: new Date().toISOString().slice(0, 10),
                totalCalls: 0,
                callLimit: toInt(form.callLimit, 1000000),
                concurrencyLimit: toInt(form.concurrencyLimit, 20),
                expiresAt: form.expiresAt || undefined,
                creator: '管理员',
                policy,
              };
              setApiKeys(prev => [newKey, ...prev]);
              toast.success('创建成功', `已创建并下发策略：分发(${policy.distribution.scope}) / 限流(${policy.rateLimit.qps}QPS) / 审计(${policy.audit.level})`);
              resetForm();
              setShowCreateKey(false);
            }}>创建</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
