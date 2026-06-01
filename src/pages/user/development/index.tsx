import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal, Plus, Play, Square, Trash2, ExternalLink,
  Clock, Code2, Copy, AlertTriangle, Database, BrainCircuit,
  Cpu, HardDrive, Wifi
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatusDot } from '../../../components/ui/StatusDot';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../hooks/useToast';
import { getRuntimeInstances, saveRuntimeInstances } from '../../../data/mockInstanceRuntime';
import type { DevInstance } from '../../../types';

const statusLabel: Record<string, string> = {
  running: '运行中', stopped: '已停止', starting: '启动中',
  stopping: '停止中', idle: '空闲告警', error: '异常',
};

const IDLE_WARN_MINUTES = 60; // 1 hour

export default function DevelopmentPage() {
  const { toast } = useToast();
  const [instances, setInstances] = useState<DevInstance[]>(() => getRuntimeInstances());
  const [copiedSsh, setCopiedSsh] = useState<string | null>(null);
  const [sshPanelId, setSshPanelId] = useState<string | null>(null);

  useEffect(() => {
    saveRuntimeInstances(instances);
  }, [instances]);

  const handleAction = (id: string, action: 'start' | 'stop' | 'delete') => {
    if (action === 'delete') {
      setInstances(prev => prev.filter(i => i.id !== id));
      toast.success('实例已删除');
    } else {
      const status = action === 'start' ? 'running' : 'stopped';
      setInstances(prev => prev.map(i => i.id === id ? { ...i, status, idleMinutes: 0 } : i));
      toast.success(action === 'start' ? '实例已启动' : '实例已停止');
    }
  };

  const handleCopySsh = (inst: DevInstance) => {
    const cmd = `ssh root@gateway.zhiyun.ai -p ${inst.sshPort}`;
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedSsh(inst.id);
    toast.success('SSH 命令已复制到剪贴板');
    setTimeout(() => setCopiedSsh(null), 2000);
  };

  const handleVSCode = (inst: DevInstance) => {
    toast.success(`正在启动 VS Code 远程连接到 ${inst.name}...`);
  };

  const runningCount = instances.filter(i => i.status === 'running' || i.status === 'idle').length;
  const idleWarnings = instances.filter(i => i.status === 'idle' && (i.idleMinutes ?? 0) >= IDLE_WARN_MINUTES).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="开发实例"
        subtitle={`${runningCount} 个实例运行中${idleWarnings > 0 ? `，${idleWarnings} 个空闲告警` : ''}`}
        icon={<Terminal size={20} />}
        actions={<Link to="/user/development/create"><Button leftIcon={<Plus size={14} />}>新建实例</Button></Link>}
      />

      {/* Idle warning banner */}
      {idleWarnings > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <span className="text-sm text-warning">
            {idleWarnings} 个实例空闲超过 {IDLE_WARN_MINUTES} 分钟，将自动停止以释放资源。
          </span>
          <Button size="sm" variant="outline" className="ml-auto border-warning/40 text-warning hover:bg-warning/10"
            onClick={() => instances.filter(i => i.status === 'idle').forEach(i => handleAction(i.id, 'stop'))}>
            一键停止空闲实例
          </Button>
        </div>
      )}

      {instances.length === 0 ? (
        <EmptyState icon={<Terminal size={32} />} title="暂无开发实例" description="创建一个 JupyterLab 实例开始算法开发"
          action={<Link to="/user/development/create"><Button leftIcon={<Plus size={14} />}>新建实例</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {instances.map(inst => {
            const isIdle = inst.status === 'idle';
            const idleMins = inst.idleMinutes ?? 0;
            const idleWarning = isIdle && idleMins >= IDLE_WARN_MINUTES;
            return (
              <Card key={inst.id} glow={inst.status === 'running'} className={idleWarning ? 'border-warning/30' : ''}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Terminal size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusDot status={inst.status} />
                        <h3 className="text-sm font-semibold text-text-primary">{inst.name}</h3>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{inst.image} · {inst.creator}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {idleWarning && (
                      <span className="flex items-center gap-0.5 text-[10px] text-warning border border-warning/30 bg-warning/10 rounded px-1.5 py-0.5">
                        <AlertTriangle size={9} /> 空闲 {idleMins >= 60 ? `${Math.floor(idleMins / 60)}h${idleMins % 60}m` : `${idleMins}m`}
                      </span>
                    )}
                    <Badge variant={inst.status === 'running' ? 'success' : isIdle ? 'warning' : inst.status === 'error' ? 'error' : 'ghost'}>
                      {statusLabel[inst.status] ?? inst.status}
                    </Badge>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-base rounded-lg p-2 text-center">
                    <p className="text-[10px] text-text-muted mb-0.5 flex items-center justify-center gap-0.5"><Cpu size={9} />GPU</p>
                    <p className="text-[11px] font-semibold text-text-primary">{inst.gpuType.split('-')[0]}</p>
                    <p className="text-[10px] text-primary">×{inst.gpuCount}</p>
                  </div>
                  <div className="bg-base rounded-lg p-2 text-center">
                    <p className="text-[10px] text-text-muted mb-0.5">CPU</p>
                    <p className="text-[11px] font-semibold text-text-primary">{inst.cpu}核</p>
                    <p className="text-[10px] text-accent">{inst.memory}</p>
                  </div>
                  <div className="bg-base rounded-lg p-2 text-center">
                    <p className="text-[10px] text-text-muted mb-0.5 flex items-center justify-center gap-0.5"><HardDrive size={9} />存储</p>
                    <p className="text-[11px] font-semibold text-text-primary">{inst.storage}</p>
                    <p className="text-[10px] text-text-muted">SSD</p>
                  </div>
                  <div className="bg-base rounded-lg p-2 text-center">
                    <p className="text-[10px] text-text-muted mb-0.5">挂载</p>
                    <p className="text-[11px] font-semibold text-text-primary">{(inst.mounts?.length ?? 0) || ((inst.mountedDatasets?.length ?? 0) + (inst.mountedModels?.length ?? 0) + (inst.mountedEnvironments?.length ?? 0))}</p>
                    <p className="text-[10px] text-text-muted">资源</p>
                  </div>
                </div>

                {/* Mount info */}
                {((inst.mounts?.length ?? 0) > 0 || (inst.mountedDatasets?.length ?? 0) > 0 || (inst.mountedModels?.length ?? 0) > 0 || (inst.mountedEnvironments?.length ?? 0) > 0) && (
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {((inst.mounts && inst.mounts.length > 0
                      ? inst.mounts.filter(item => item.type === 'dataset').map(item => item.name)
                      : inst.mountedDatasets
                    )?.slice(0, 2) ?? []).map(ds => (
                      <span key={ds} className="flex items-center gap-0.5 text-[10px] bg-accent/10 border border-accent/20 text-accent rounded px-1.5 py-0.5">
                        <Database size={9} />{ds}
                      </span>
                    ))}
                    {((inst.mounts && inst.mounts.length > 0
                      ? inst.mounts.filter(item => item.type === 'model').map(item => item.name)
                      : inst.mountedModels
                    )?.slice(0, 2) ?? []).map(m => (
                      <span key={m} className="flex items-center gap-0.5 text-[10px] bg-secondary/10 border border-secondary/20 text-secondary rounded px-1.5 py-0.5">
                        <BrainCircuit size={9} />{m}
                      </span>
                    ))}
                    {(inst.mounts && inst.mounts.length > 0
                      ? inst.mounts.filter(item => item.type === 'environment').map(item => item.name)
                      : inst.mountedEnvironments
                    )?.slice(0, 2).map(env => (
                      <span key={env} className="flex items-center gap-0.5 text-[10px] bg-primary/10 border border-primary/20 text-primary rounded px-1.5 py-0.5">
                        <Code2 size={9} />{env}
                      </span>
                    ))}
                  </div>
                )}

                {/* SSH panel */}
                {sshPanelId === inst.id && (
                  <div className="mb-3 p-2.5 bg-base rounded-lg border border-border font-mono text-xs text-text-muted flex items-center justify-between gap-2">
                    <span className="truncate">ssh root@gateway.zhiyun.ai -p {inst.sshPort}</span>
                    <button onClick={() => handleCopySsh(inst)} className="shrink-0 text-primary hover:text-primary/80 transition-colors">
                      {copiedSsh === inst.id ? '✓ 已复制' : <Copy size={12} />}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock size={11} />{new Date(inst.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {(inst.status === 'running' || inst.status === 'idle') && (
                      <>
                        <a href={inst.jupyterUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" leftIcon={<ExternalLink size={11} />}>JupyterLab</Button>
                        </a>
                        <Button size="sm" variant="outline" leftIcon={<Code2 size={11} />} onClick={() => handleVSCode(inst)}>VS Code</Button>
                        <Button size="sm" variant="ghost" leftIcon={<Wifi size={11} />}
                          onClick={() => setSshPanelId(id => id === inst.id ? null : inst.id)}>SSH</Button>
                      </>
                    )}
                    {inst.status === 'stopped' && (
                      <Button size="sm" variant="ghost" leftIcon={<Play size={12} />} onClick={() => handleAction(inst.id, 'start')}>启动</Button>
                    )}
                    {(inst.status === 'running' || inst.status === 'idle') && (
                      <Button size="sm" variant="ghost" leftIcon={<Square size={12} />} onClick={() => handleAction(inst.id, 'stop')}>停止</Button>
                    )}
                    <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} onClick={() => handleAction(inst.id, 'delete')} className="text-error hover:text-error/80">删除</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
