import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Plus, Copy, Eye, EyeOff, Trash2, Activity, Clock, ShieldCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import { useToast } from '../../../hooks/useToast';
import { getRuntimeApiKeys, saveRuntimeApiKeys } from '../../../data/mockApiKeyRuntime';
import type { ApiKey } from '../../../types';

// Mock audit log data
const MOCK_AUDIT = Array.from({ length: 48 }, (_, i) => {
  const statuses = ['success', 'success', 'success', 'error', 'success'] as const;
  const models = ['Qwen2-72B', 'Llama-3-8B', 'DeepSeek-V2', 'ChatGLM3-6B', 'Mistral-7B'];
  const endpoints = ['/v1/chat/completions', '/v1/completions', '/v1/embeddings'];
  const keyNames = ['prod-key', 'dev-key', 'test-key'];
  const ts = new Date(Date.now() - i * 7 * 60 * 1000);
  const st = statuses[i % statuses.length];
  return {
    id: `log-${i}`,
    ts: ts.toISOString(),
    keyName: keyNames[i % keyNames.length],
    keyPrefix: `zy-sk-${(1000 + i).toString(36)}`,
    model: models[i % models.length],
    endpoint: endpoints[i % endpoints.length],
    tokens: Math.floor(Math.random() * 2000 + 100),
    latency: Math.floor(Math.random() * 800 + 80),
    status: st,
    ip: `192.168.${Math.floor(i / 10)}.${(i % 254) + 1}`,
  };
});

export default function SettingsPage() {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState('apikeys');
  const [keys, setKeys] = useState<ApiKey[]>(() => getRuntimeApiKeys());
  const [revealId, setRevealId] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilter, setAuditFilter] = useState('all');

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    toast.success('API Key 已复制到剪贴板');
  };

  const handleRevoke = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'disabled' as const } : k));
    toast.success('API Key 已吊销');
  };

  const mask = (key: string) => `${key.slice(0, 10)}${'•'.repeat(20)}${key.slice(-4)}`;

  const filteredAudit = useMemo(() =>
    auditFilter === 'all' ? MOCK_AUDIT : MOCK_AUDIT.filter(l => l.status === auditFilter),
    [auditFilter]
  );
  const auditPage_data = filteredAudit.slice((auditPage - 1) * 12, auditPage * 12);

  const statusIcon = (s: string) => {
    if (s === 'success') return <CheckCircle size={13} className="text-success" />;
    if (s === 'error') return <XCircle size={13} className="text-error" />;
    return <AlertCircle size={13} className="text-warning" />;
  };

  useEffect(() => {
    saveRuntimeApiKeys(keys);
  }, [keys]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="API 密钥"
        subtitle="管理平台 API 访问密钥与调用审计"
        icon={<KeyRound size={20} />}
        actions={mainTab === 'apikeys' ? <Link to="/user/settings/create-key"><Button leftIcon={<Plus size={14} />}>创建密钥</Button></Link> : undefined}
      />

      <Tabs
        tabs={[
          { key: 'apikeys', label: '密钥管理', icon: <ShieldCheck size={13} />, count: keys.filter(k => k.status === 'active').length },
          { key: 'audit', label: '调用审计', icon: <Activity size={13} /> },
        ]}
        active={mainTab}
        onChange={setMainTab}
      />

      {mainTab === 'apikeys' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: '总密钥数', value: keys.length },
              { label: '活跃密钥', value: keys.filter(k => k.status === 'active').length },
              { label: '已停用 / 过期', value: keys.filter(k => k.status !== 'active').length },
            ].map(m => (
              <Card key={m.label}>
                <p className="text-xs text-text-muted mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-text-primary">{m.value}</p>
              </Card>
            ))}
          </div>

          <Card noPadding>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">密钥列表</span>
            </div>
            <div className="divide-y divide-border/50">
              {keys.map(k => {
                const callPct = k.callLimit && k.totalCalls ? Math.min(100, Math.round(k.totalCalls / k.callLimit * 100)) : null;
                const expired = k.expiresAt && new Date(k.expiresAt) < new Date();
                return (
                  <div key={k.id} className="px-5 py-4 flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-text-primary">{k.name}</span>
                        <Badge variant={expired ? 'ghost' : k.status === 'active' ? 'success' : 'ghost'}>
                          {expired ? '已过期' : k.status === 'active' ? '活跃' : '已停用'}
                        </Badge>
                        <Badge variant="secondary">{k.model}</Badge>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-text-muted mb-1.5">
                        <span>{revealId === k.id ? k.key : mask(k.key)}</span>
                        <button onClick={() => setRevealId(p => p === k.id ? null : k.id)} className="hover:text-text-secondary transition-colors">
                          {revealId === k.id ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => handleCopy(k.key)} className="hover:text-text-secondary transition-colors">
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                        <span>创建 {new Date(k.createdAt).toLocaleDateString('zh-CN')}</span>
                        {k.lastUsed && <span>上次使用 {new Date(k.lastUsed).toLocaleDateString('zh-CN')}</span>}
                        {k.expiresAt && (
                          <span className={`flex items-center gap-0.5 ${expired ? 'text-error' : 'text-text-muted'}`}>
                            <Clock size={10} />
                            {expired ? '已于 ' : '过期 '}{new Date(k.expiresAt).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                        {!k.expiresAt && <span className="text-text-muted">永久有效</span>}
                        {k.concurrencyLimit && <span>并发上限 {k.concurrencyLimit}</span>}
                      </div>
                      {callPct !== null && (
                        <div className="mt-2 max-w-xs">
                          <div className="flex justify-between text-[10px] text-text-muted mb-0.5">
                            <span>调用次数 {k.totalCalls?.toLocaleString()} / {k.callLimit?.toLocaleString()}</span>
                            <span className={callPct >= 90 ? 'text-error' : callPct >= 70 ? 'text-warning' : 'text-success'}>{callPct}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${callPct >= 90 ? 'bg-error' : callPct >= 70 ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${callPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {k.status === 'active' && !expired && (
                      <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} className="text-error/70 hover:text-error" onClick={() => handleRevoke(k.id)}>吊销</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {mainTab === 'audit' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm text-text-muted">筛选状态：</div>
            {(['all', 'success', 'error'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setAuditFilter(s); setAuditPage(1); }}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${auditFilter === s ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-border text-text-muted hover:text-text-primary'}`}
              >
                {s === 'all' ? '全部' : s === 'success' ? '成功' : '失败'}
              </button>
            ))}
            <span className="ml-auto text-xs text-text-muted">共 {filteredAudit.length} 条记录</span>
          </div>
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="px-4 py-3 text-left font-medium">时间</th>
                    <th className="px-4 py-3 text-left font-medium">密钥</th>
                    <th className="px-4 py-3 text-left font-medium">模型</th>
                    <th className="px-4 py-3 text-left font-medium">接口</th>
                    <th className="px-4 py-3 text-right font-medium">Token</th>
                    <th className="px-4 py-3 text-right font-medium">延迟</th>
                    <th className="px-4 py-3 text-left font-medium">IP</th>
                    <th className="px-4 py-3 text-center font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {auditPage_data.map(log => (
                    <tr key={log.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">{new Date(log.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-secondary">{log.keyName}</span>
                        <span className="ml-1 text-text-muted font-mono">{log.keyPrefix}…</span>
                      </td>
                      <td className="px-4 py-3 text-text-primary">{log.model}</td>
                      <td className="px-4 py-3 text-text-muted font-mono">{log.endpoint}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{log.tokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={log.latency > 500 ? 'text-warning' : 'text-text-muted'}>{log.latency}ms</span>
                      </td>
                      <td className="px-4 py-3 text-text-muted font-mono">{log.ip}</td>
                      <td className="px-4 py-3 text-center">{statusIcon(log.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={auditPage} total={filteredAudit.length} pageSize={12} onChange={setAuditPage} />
        </>
      )}


    </div>
  );
}
