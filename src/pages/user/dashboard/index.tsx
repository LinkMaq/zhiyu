import React from 'react';
import {
  Cpu, HardDrive, Zap, Activity, ArrowRight, Plus,
  TrendingUp, Database, BrainCircuit,
  Cloud, Terminal, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { StatusDot } from '../../../components/ui/StatusDot';
import { MetricCard } from '../../../components/charts/MetricCard';
import { mockTrainingJobs } from '../../../data/mockTraining';
import { mockInstances } from '../../../data/mockInstances';
import { mockInferenceServices } from '../../../data/mockInference';
import { mockMetrics } from '../../../data/mockData';
import { useAuth } from '../../../contexts/AuthContext';

const statusBadge: Record<string, React.ReactNode> = {
  running:   <Badge variant="success">运行中</Badge>,
  completed: <Badge variant="ghost">已完成</Badge>,
  failed:    <Badge variant="error">失败</Badge>,
  queued:    <Badge variant="secondary">排队中</Badge>,
  stopped:   <Badge variant="ghost">已停止</Badge>,
};

export default function UserDashboard() {
  const { user } = useAuth();

  const runningJobs = mockTrainingJobs.filter(j => j.status === 'running').length;
  const runningInfer = mockInferenceServices.filter(i => i.status === 'running').length;
  const gpuData = mockMetrics.gpuUtilization.slice(-24);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`欢迎回来，${user?.name ?? '用户'}`}
        subtitle="智云智算平台 · 科研算力中心"
        icon={<Activity size={20} />}
        actions={
          <Link to="/user/training" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary/30 rounded-lg text-primary text-sm hover:bg-primary/25 transition-colors">
            <Plus size={14} /> 新建训练任务
          </Link>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="GPU 利用率" value="86.4" unit="%" icon={<Cpu size={18} />} trend={3.2} color="primary" trendLabel="较昨日" />
        <MetricCard title="运行中任务" value={runningJobs} icon={<Zap size={18} />} color="success" subtitle={`共 ${mockTrainingJobs.length} 个任务`} />
        <MetricCard title="推理服务" value={runningInfer} icon={<Cloud size={18} />} color="accent" subtitle={`共 ${mockInferenceServices.length} 个服务`} />
        <MetricCard title="存储使用" value="12.4" unit="TB" icon={<HardDrive size={18} />} color="secondary" trendLabel="总配额 20 TB" />
      </div>

      {/* GPU utilization chart + quick status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" noPadding>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-sm font-semibold text-text-primary">GPU 利用率（近 24h）</span>
            </div>
            <span className="text-xs text-text-muted flex items-center gap-1"><RefreshCw size={11} /> 实时</span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={gpuData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D47" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7E9F' }} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid #1E2D47', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#gpuGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick stats */}
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Terminal size={15} className="text-accent" />
              <span className="text-sm font-semibold text-text-primary">开发实例</span>
            </div>
            <div className="space-y-2">
              {mockInstances.slice(0, 3).map(inst => (
                <div key={inst.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <StatusDot status={inst.status} />
                    <span className="text-xs text-text-secondary truncate max-w-28">{inst.name}</span>
                  </div>
                  <span className="text-xs text-text-muted">{inst.gpuType}×{inst.gpuCount}</span>
                </div>
              ))}
            </div>
            <Link to="/user/development" className="flex items-center gap-1 text-xs text-primary mt-3 hover:text-blue-300 transition-colors">
              查看全部 <ArrowRight size={11} />
            </Link>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cloud size={15} className="text-success" />
                <span className="text-sm font-semibold text-text-primary">推理服务</span>
              </div>
            </div>
            {mockInferenceServices.filter(s => s.status === 'running').slice(0, 2).map(svc => (
              <div key={svc.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <StatusDot status={svc.status} />
                  <span className="text-xs text-text-secondary truncate max-w-28">{svc.name}</span>
                </div>
                <span className="text-xs text-text-muted">{svc.qps} QPS</span>
              </div>
            ))}
            <Link to="/user/inference" className="flex items-center gap-1 text-xs text-primary mt-3 hover:text-blue-300 transition-colors">
              查看全部 <ArrowRight size={11} />
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent training jobs */}
      <Card noPadding>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-warning" />
            <span className="text-sm font-semibold text-text-primary">最近训练任务</span>
          </div>
          <Link to="/user/training" className="text-xs text-primary hover:text-blue-300 transition-colors flex items-center gap-1">
            全部任务 <ArrowRight size={11} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['任务名称', '模型', '状态', '进度', '资源', '提交时间'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTrainingJobs.slice(0, 5).map(job => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={job.status} />
                      <span className="text-sm text-text-primary font-medium">{job.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{job.baseModel}</td>
                  <td className="px-4 py-3">{statusBadge[job.status] ?? <Badge>{job.status}</Badge>}</td>
                  <td className="px-4 py-3">
                    {job.status === 'running' || job.status === 'completed' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${job.progress}%` }} />
                        </div>
                        <span className="text-xs text-text-muted">{job.progress}%</span>
                      </div>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{job.gpuType}×{job.gpuCount}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{new Date(job.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/user/datasets', icon: <Database size={20} />, label: '上传数据集', color: 'text-accent' },
          { to: '/user/models', icon: <BrainCircuit size={20} />, label: '模型广场', color: 'text-secondary' },
          { to: '/user/development', icon: <Terminal size={20} />, label: '新建实例', color: 'text-primary' },
          { to: '/user/inference', icon: <Cloud size={20} />, label: '部署推理', color: 'text-success' },
        ].map(a => (
          <Link key={a.to} to={a.to} className="bg-surface border border-border hover:border-white/20 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:bg-white/3">
            <span className={a.color}>{a.icon}</span>
            <span className="text-xs font-medium text-text-secondary">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
