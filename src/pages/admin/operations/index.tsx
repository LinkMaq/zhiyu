import { useState } from 'react';
import { ClipboardList, Search, CheckCircle2, XCircle, Download, AlertTriangle, Activity } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Input';
import { Pagination } from '../../../components/ui/Pagination';
import { useToast } from '../../../hooks/useToast';
import { mockAuditLogs } from '../../../data/mockData';

const PAGE_SIZE = 10;
const resultVariant: Record<string, 'success' | 'error'> = { success: 'success', failure: 'error' };
const ACTION_TYPES = ['全部操作', '创建', '删除', '修改', '登录', '登出', '启动', '停止'];

export default function Operations() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('全部操作');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = mockAuditLogs.filter(l => {
    const matchSearch = l.user.includes(search) || l.action.includes(search) || l.resource.includes(search);
    const matchAction = actionFilter === '全部操作' || l.action.includes(actionFilter);
    const matchResult = !resultFilter || l.result === resultFilter;
    return matchSearch && matchAction && matchResult;
  });
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const successCount = mockAuditLogs.filter(l => l.result === 'success').length;
  const failCount = mockAuditLogs.filter(l => l.result !== 'success').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="操作审计" subtitle="用户操作日志与行为审计记录" icon={<ClipboardList size={20} />} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总操作数', value: mockAuditLogs.length, icon: <Activity size={16} />, color: 'text-primary bg-primary/10' },
          { label: '成功操作', value: successCount, icon: <CheckCircle2 size={16} />, color: 'text-success bg-success/10' },
          { label: '失败操作', value: failCount, icon: <XCircle size={16} />, color: 'text-error bg-error/10' },
          { label: '异常警告', value: Math.floor(failCount * 0.4), icon: <AlertTriangle size={16} />, color: 'text-warning bg-warning/10' },
        ].map(s => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted mb-1">{s.label}</p>
                <p className="text-xl font-bold text-text-primary">{s.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索用户、操作或资源…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
        </div>
        <Select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          options={ACTION_TYPES.map(a => ({ value: a, label: a }))} className="w-36" />
        <Select value={resultFilter} onChange={e => { setResultFilter(e.target.value); setPage(1); }}
          options={[{ value: '', label: '全部结果' }, { value: 'success', label: '成功' }, { value: 'failure', label: '失败' }]} className="w-28" />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-text-muted">共 {filtered.length} 条</span>
          <Button size="sm" variant="ghost" leftIcon={<Download size={13} />} onClick={() => toast.success('导出成功', `已导出 ${filtered.length} 条操作日志 (CSV 格式)`)}>导出日志</Button>
        </div>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['操作用户', '操作类型', '资源对象', 'IP 地址', '结果', '操作时间'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(log => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                        {log.user[0]}
                      </div>
                      <span className="text-sm text-text-secondary">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-text-muted font-mono">{log.resource}</td>
                  <td className="px-4 py-3 text-xs text-text-muted font-mono">{log.ip}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {log.result === 'success' ? <CheckCircle2 size={12} className="text-success" /> : <XCircle size={12} className="text-error" />}
                      <Badge variant={resultVariant[log.result] ?? 'ghost'}>{log.result === 'success' ? '成功' : '失败'}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
