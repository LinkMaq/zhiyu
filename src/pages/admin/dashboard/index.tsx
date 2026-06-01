import { LayoutDashboard, Server, Cpu, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MetricCard } from '../../../components/charts/MetricCard';
import { StatusDot } from '../../../components/ui/StatusDot';
import { mockClusters, mockAlerts, mockMetrics } from '../../../data/mockData';

export default function AdminDashboard() {
  const totalNodes = mockClusters.reduce((a, c) => a + c.nodes.length, 0);
  const totalGpus = mockClusters.reduce((a, c) => a + c.gpuTotal, 0);
  const usedGpus = mockClusters.reduce((a, c) => a + c.gpuUsed, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="平台概览" subtitle="智云智算平台运行状态总览" icon={<LayoutDashboard size={20} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="GPU 利用率" value={Math.round(usedGpus / Math.max(totalGpus, 1) * 100)} unit="%" icon={<Cpu size={18} />} color="primary" trend={4.2} trendLabel="较昨日" />
        <MetricCard title="在线节点" value={`${totalNodes - 1}/${totalNodes}`} icon={<Server size={18} />} color="success" subtitle="1 节点维护中" />
        <MetricCard title="GPU 总量" value={`${usedGpus}/${totalGpus}`} unit=" 卡" icon={<Cpu size={18} />} color="secondary" subtitle="已用/总计" />
        <MetricCard title="告警数量" value={mockAlerts.filter(a => a.status === 'firing').length} icon={<AlertTriangle size={18} />} color="warning" subtitle="待处理告警" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card noPadding className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-border">
            <span className="text-sm font-semibold text-text-primary">GPU 利用率 (24h)</span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockMetrics.gpuUtilization} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="gpuFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#gpuFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card noPadding>
          <div className="px-5 py-4 border-b border-border">
            <span className="text-sm font-semibold text-text-primary">近期告警</span>
          </div>
          <div className="divide-y divide-border/50">
            {mockAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="px-4 py-3 flex items-start gap-2">
                <AlertTriangle size={13} className={alert.level === 'critical' ? 'text-error mt-0.5' : alert.level === 'warning' ? 'text-warning mt-0.5' : 'text-primary mt-0.5'} />
                <div className="min-w-0">
                  <p className="text-xs text-text-primary truncate">{alert.title}</p>
                  <p className="text-xs text-text-muted">{alert.source}</p>
                </div>
                <Badge variant={alert.level === 'critical' ? 'error' : alert.level === 'warning' ? 'warning' : 'primary'} className="shrink-0 text-xs">{alert.level}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockClusters.map(cluster => (
          <Card key={cluster.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StatusDot status={cluster.status} />
                <span className="text-sm font-semibold text-text-primary">{cluster.name}</span>
              </div>
              <Badge variant={cluster.status === 'healthy' ? 'success' : 'warning'}>{cluster.version}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: '节点', value: cluster.nodes.length },
                { label: 'GPU (用/总)', value: `${cluster.gpuUsed}/${cluster.gpuTotal}` },
                { label: 'Running Pods', value: cluster.pods },
              ].map(s => (
                <div key={s.label} className="bg-base rounded-lg p-2">
                  <p className="text-xs text-text-muted mb-0.5">{s.label}</p>
                  <p className="text-sm font-bold text-text-primary">{s.value}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
