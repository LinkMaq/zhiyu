import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Blocks, BrainCircuit, ChevronRight, Clock, Cloud,
  Copy, Cpu, Database, ExternalLink, FileCode2, FolderGit2, GitBranch,
  MonitorCog, PanelRight, Play, Plus, Save, ServerCog,
  Square, SquareTerminal, Terminal, Trash2, Wifi,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input, Select } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { StatusDot } from '../../../components/ui/StatusDot';
import { Tabs } from '../../../components/ui/Tabs';
import { useToast } from '../../../hooks/useToast';
import { getRuntimeInstances, saveRuntimeInstances } from '../../../data/mockInstanceRuntime';
import {
  mockRemoteWorkspaces,
  mockTerminalWelcome,
  mockVSCodeConnections,
  mockWebEditorFiles,
  type RemoteWorkspace,
  type VSCodeConnectionProfile,
  type WebEditorFile,
} from '../../../data/mockDevelopmentModes';
import type { DevInstance } from '../../../types';

type DevelopmentTab = 'instances' | 'editor' | 'vscode' | 'webssh' | 'remote';
type TerminalLine = { type: 'system' | 'command' | 'output'; text: string };

const statusLabel: Record<string, string> = {
  running: '运行中', stopped: '已停止', starting: '启动中', stopping: '停止中', idle: '空闲告警', error: '异常',
};

const workspaceStatus = {
  running: { label: '运行中', variant: 'success' as const },
  starting: { label: '正在启动', variant: 'primary' as const },
  stopped: { label: '已停止', variant: 'ghost' as const },
};

const IDLE_WARN_MINUTES = 60;

function terminalReply(command: string, instance?: DevInstance) {
  const normalized = command.trim().toLowerCase();
  if (normalized === 'help') return '可用模拟命令：pwd、ls、git status、python --version、nvidia-smi、whoami、clear';
  if (normalized === 'pwd') return '/workspace/customer-service';
  if (normalized === 'ls' || normalized === 'ls -la') return 'README.md  configs/  data/  notebooks/  outputs/  scripts/  src/  .devcontainer/';
  if (normalized === 'git status') return 'On branch feature/lora-eval\nChanges not staged for commit:\n  modified: src/train.py\n  modified: configs/finetune.yaml';
  if (normalized === 'python --version') return 'Python 3.11.9';
  if (normalized === 'nvidia-smi') return `NVIDIA-SMI 550.54.15 · CUDA Version: 12.4\nGPU 0: ${instance?.gpuType ?? 'NVIDIA A100 80GB'} · ${instance?.gpuCount ?? 1} device(s) allocated`;
  if (normalized === 'whoami') return 'zhiyun-dev';
  return `WebSSH mock: command “${command.trim()}” was accepted but is not executed against a real environment.`;
}

function fileIcon(file: WebEditorFile) {
  const color = file.language === 'python' ? 'text-yellow-300' : file.language === 'yaml' ? 'text-rose-300' : file.language === 'json' ? 'text-amber-300' : 'text-accent';
  return <FileCode2 size={13} className={color} />;
}

export default function DevelopmentPage() {
  const { toast } = useToast();
  const [instances, setInstances] = useState<DevInstance[]>(() => getRuntimeInstances());
  const [activeTab, setActiveTab] = useState<DevelopmentTab>('instances');
  const [copiedSsh, setCopiedSsh] = useState<string | null>(null);
  const [editorFiles, setEditorFiles] = useState<WebEditorFile[]>(mockWebEditorFiles);
  const [activeFileId, setActiveFileId] = useState(mockWebEditorFiles[0].id);
  const [editorOutput, setEditorOutput] = useState('就绪：已挂载 customer-service-llm 工作区，等待运行任务。');
  const [editorRunning, setEditorRunning] = useState(false);
  const [vscodeProfiles, setVscodeProfiles] = useState<VSCodeConnectionProfile[]>(mockVSCodeConnections);
  const [selectedVSCodeId, setSelectedVSCodeId] = useState(mockVSCodeConnections[0].id);
  const [connectingProfileId, setConnectingProfileId] = useState<string | null>(null);
  const [terminalInstanceId, setTerminalInstanceId] = useState('ins007');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() => mockTerminalWelcome.map(text => ({ type: 'system', text })));
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const [workspaces, setWorkspaces] = useState<RemoteWorkspace[]>(mockRemoteWorkspaces);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', repository: '', branch: 'main', template: 'PyTorch + CUDA 12.1', resources: 'A100 80GB × 1 · 8C · 32Gi' });

  useEffect(() => { saveRuntimeInstances(instances); }, [instances]);

  const runningInstances = useMemo(() => instances.filter(instance => instance.status === 'running' || instance.status === 'idle'), [instances]);
  const activeFile = editorFiles.find(file => file.id === activeFileId) ?? editorFiles[0];
  const selectedVSCode = vscodeProfiles.find(profile => profile.id === selectedVSCodeId) ?? vscodeProfiles[0];
  const terminalInstance = instances.find(instance => instance.id === terminalInstanceId) ?? runningInstances[0];
  const idleWarnings = instances.filter(instance => instance.status === 'idle' && instance.idleMinutes >= IDLE_WARN_MINUTES).length;

  const copyText = (value: string, message: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    toast.success(message);
  };

  const copySsh = (instance: DevInstance) => {
    copyText(`ssh root@gateway.zhiyun.ai -p ${instance.sshPort}`, 'SSH 命令已复制到剪贴板');
    setCopiedSsh(instance.id);
    window.setTimeout(() => setCopiedSsh(null), 2000);
  };

  const changeInstance = (id: string, action: 'start' | 'stop' | 'delete') => {
    if (action === 'delete') {
      setInstances(previous => previous.filter(instance => instance.id !== id));
      toast.success('实例已删除');
      return;
    }
    setInstances(previous => previous.map(instance => instance.id === id ? { ...instance, status: action === 'start' ? 'running' : 'stopped', idleMinutes: 0 } : instance));
    toast.success(action === 'start' ? '实例已启动' : '实例已停止');
  };

  const updateFile = (content: string) => {
    setEditorFiles(previous => previous.map(file => file.id === activeFile.id ? { ...file, content, changed: true, modifiedAt: '未保存' } : file));
  };

  const saveFile = () => {
    setEditorFiles(previous => previous.map(file => file.id === activeFile.id ? { ...file, changed: false, modifiedAt: '刚刚' } : file));
    toast.success('已保存到远程工作区', `${activeFile.path} 已同步至开发环境。`);
  };

  const runFile = () => {
    setEditorRunning(true);
    setEditorOutput('正在准备隔离运行环境、同步依赖并提交执行任务…');
    window.setTimeout(() => {
      setEditorRunning(false);
      setEditorOutput(activeFile.language === 'python'
        ? '✓ 运行完成\nLoading Qwen2.5-7B-CS-ZY…\nTraining config: { learning_rate: 2e-5, num_train_epochs: 3 }\nExit code: 0'
        : `✓ 已校验 ${activeFile.name}，格式与工作区配置一致。`);
    }, 750);
  };

  const connectVSCode = (profile: VSCodeConnectionProfile) => {
    if (profile.status === 'offline') {
      toast.warning('连接暂不可用', `${profile.name} 当前处于离线状态。`);
      return;
    }
    setConnectingProfileId(profile.id);
    setVscodeProfiles(previous => previous.map(item => item.id === profile.id ? { ...item, status: 'connected', lastActive: '刚刚' } : item));
    toast.success('正在连接 VS Code', `${profile.name} 已提交连接请求。`);
    window.location.assign(profile.launchUrl);
    window.setTimeout(() => setConnectingProfileId(null), 700);
  };

  const executeTerminalCommand = (rawCommand: string) => {
    const command = rawCommand.trim();
    if (!command) return;
    if (command.toLowerCase() === 'clear') {
      setTerminalLines([]);
      setTerminalInput('');
      window.setTimeout(() => terminalInputRef.current?.focus(), 0);
      return;
    }
    setTerminalLines(previous => [...previous,
      { type: 'command', text: `zhiyun-dev@${terminalInstance?.name ?? 'workspace'}:~/workspace$ ${command}` },
      { type: 'output', text: terminalReply(command, terminalInstance) },
    ]);
    setTerminalInput('');
    window.setTimeout(() => terminalInputRef.current?.focus(), 0);
  };

  const runTerminalCommand = (event: React.FormEvent) => {
    event.preventDefault();
    executeTerminalCommand(terminalInput);
  };

  const toggleWorkspace = (workspace: RemoteWorkspace) => {
    const status = workspace.status === 'running' ? 'stopped' : 'running';
    setWorkspaces(previous => previous.map(item => item.id === workspace.id ? { ...item, status, lastActive: status === 'running' ? '刚刚' : item.lastActive } : item));
    toast.success(status === 'running' ? '远程开发环境已启动' : '远程开发环境已停止', workspace.name);
  };

  const openWorkspace = (workspace: RemoteWorkspace) => {
    if (workspace.status !== 'running') {
      toast.warning('环境尚未运行', '请先启动远程开发环境后再进入。');
      return;
    }
    setActiveTab(workspace.runtime === 'Browser IDE' ? 'editor' : 'vscode');
    toast.info('已切换研发方式', workspace.runtime === 'Browser IDE' ? '已进入 Web 编辑器模拟视图。' : '已进入 VS Code 远程连接模拟视图。');
  };

  const createWorkspace = () => {
    if (!workspaceForm.name.trim() || !workspaceForm.repository.trim()) {
      toast.warning('请补全远程环境信息', '环境名称和 Git 仓库为必填项。');
      return;
    }
    setWorkspaces(previous => [{
      id: `workspace-${Date.now()}`, name: workspaceForm.name.trim(), repository: workspaceForm.repository.trim(), branch: workspaceForm.branch.trim() || 'main',
      template: workspaceForm.template, status: 'starting', runtime: 'Cloud Workstation', resources: workspaceForm.resources,
      location: '绵阳 GPU 集群', collaborators: ['张远航'], lastActive: '刚刚',
    }, ...previous]);
    setWorkspaceModalOpen(false);
    setWorkspaceForm({ name: '', repository: '', branch: 'main', template: 'PyTorch + CUDA 12.1', resources: 'A100 80GB × 1 · 8C · 32Gi' });
    toast.success('远程开发环境已创建', '正在拉取代码、初始化镜像并分配资源。');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="开发环境"
        subtitle={`${runningInstances.length} 个运行环境可用 · 覆盖轻量改码、桌面 IDE、终端排障与云端协作研发`}
        icon={<Terminal size={20} />}
        actions={<Link to="/user/development/create"><Button leftIcon={<Plus size={14} />}>新建实例</Button></Link>}
      />

      <Card noPadding className="overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
          {[
            { key: 'instances' as const, label: '研发实例', desc: 'GPU、镜像与挂载资源管理', icon: <Cpu size={17} />, count: `${instances.length} 个` },
            { key: 'editor' as const, label: 'Web 编辑器', desc: '浏览器内轻量改码与运行', icon: <FileCode2 size={17} />, count: '浏览器内' },
            { key: 'vscode' as const, label: 'VS Code 远程', desc: '桌面 IDE、调试器与扩展生态', icon: <MonitorCog size={17} />, count: `${vscodeProfiles.length} 条` },
            { key: 'webssh' as const, label: 'WebSSH', desc: '经堡垒机进入隔离终端', icon: <SquareTerminal size={17} />, count: `${runningInstances.length} 在线` },
            { key: 'remote' as const, label: '远程开发环境', desc: '团队工作区与云端工作站', icon: <Cloud size={17} />, count: `${workspaces.length} 个` },
          ].map(mode => (
            <button key={mode.key} type="button" onClick={() => setActiveTab(mode.key)} className={`flex gap-3 p-4 text-left transition-colors ${activeTab === mode.key ? 'bg-primary/[0.08]' : 'hover:bg-white/[0.025]'}`}>
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${activeTab === mode.key ? 'border-primary/30 bg-primary/15 text-primary' : 'border-border bg-base text-text-muted'}`}>{mode.icon}</span>
              <span className="min-w-0"><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-text-primary">{mode.label}</span><span className="text-[10px] text-text-muted">{mode.count}</span></span><span className="mt-1 block text-xs leading-5 text-text-muted">{mode.desc}</span></span>
            </button>
          ))}
        </div>
      </Card>

      <Tabs
        active={activeTab}
        onChange={key => setActiveTab(key as DevelopmentTab)}
        tabs={[
          { key: 'instances', label: '研发实例', icon: <Cpu size={15} />, count: instances.length },
          { key: 'editor', label: 'Web 编辑器', icon: <FileCode2 size={15} /> },
          { key: 'vscode', label: 'VS Code 远程', icon: <MonitorCog size={15} />, count: vscodeProfiles.length },
          { key: 'webssh', label: 'WebSSH', icon: <SquareTerminal size={15} /> },
          { key: 'remote', label: '远程开发环境', icon: <Cloud size={15} />, count: workspaces.length },
        ]}
      />

      {activeTab === 'instances' && (
        <div className="space-y-4">
          {idleWarnings > 0 && <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3"><AlertTriangle size={16} className="shrink-0 text-warning" /><span className="text-sm text-warning">{idleWarnings} 个实例空闲超过 {IDLE_WARN_MINUTES} 分钟，将自动停止以释放资源。</span><Button size="sm" variant="outline" className="ml-auto border-warning/40 text-warning hover:bg-warning/10" onClick={() => instances.filter(instance => instance.status === 'idle').forEach(instance => changeInstance(instance.id, 'stop'))}>一键停止空闲实例</Button></div>}
          {instances.length === 0 ? <EmptyState icon={<Terminal size={32} />} title="暂无开发实例" description="创建一个实例后，即可使用 Web 编辑器、VS Code 或 WebSSH。" action={<Link to="/user/development/create"><Button leftIcon={<Plus size={14} />}>新建实例</Button></Link>} /> : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {instances.map(instance => {
              const idleWarning = instance.status === 'idle' && instance.idleMinutes >= IDLE_WARN_MINUTES;
              return <Card key={instance.id} glow={instance.status === 'running'} className={idleWarning ? 'border-warning/30' : ''}>
                <div className="mb-3 flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><Terminal size={18} className="text-primary" /></div><div><div className="flex items-center gap-2"><StatusDot status={instance.status} /><h3 className="text-sm font-semibold text-text-primary">{instance.name}</h3></div><p className="mt-0.5 text-xs text-text-muted">{instance.image} · {instance.creator}</p></div></div><Badge variant={instance.status === 'running' ? 'success' : instance.status === 'idle' ? 'warning' : instance.status === 'error' ? 'error' : 'ghost'}>{statusLabel[instance.status] ?? instance.status}</Badge></div>
                <div className="mb-3 grid grid-cols-4 gap-2"><div className="rounded-lg bg-base p-2 text-center"><p className="text-[10px] text-text-muted">GPU</p><p className="text-[11px] font-semibold text-text-primary">{instance.gpuType.split('-')[0]}</p><p className="text-[10px] text-primary">×{instance.gpuCount}</p></div><div className="rounded-lg bg-base p-2 text-center"><p className="text-[10px] text-text-muted">CPU / 内存</p><p className="text-[11px] font-semibold text-text-primary">{instance.cpu}核</p><p className="text-[10px] text-accent">{instance.memory}</p></div><div className="rounded-lg bg-base p-2 text-center"><p className="text-[10px] text-text-muted">存储</p><p className="text-[11px] font-semibold text-text-primary">{instance.storage}</p><p className="text-[10px] text-text-muted">SSD</p></div><div className="rounded-lg bg-base p-2 text-center"><p className="text-[10px] text-text-muted">挂载</p><p className="text-[11px] font-semibold text-text-primary">{(instance.mounts?.length ?? 0) || (instance.mountedDatasets.length + instance.mountedModels.length)}</p><p className="text-[10px] text-text-muted">资源</p></div></div>
                <div className="mb-3 flex flex-wrap gap-1">{instance.mountedDatasets.slice(0, 1).map(item => <Badge key={item} variant="accent"><Database size={10} className="mr-1" />{item}</Badge>)}{instance.mountedModels.slice(0, 1).map(item => <Badge key={item} variant="secondary"><BrainCircuit size={10} className="mr-1" />{item}</Badge>)}<Badge variant="ghost">{instance.namespace}</Badge></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1 text-xs text-text-muted"><Clock size={11} />{new Date(instance.createdAt).toLocaleDateString('zh-CN')}</span><div className="flex flex-wrap justify-end gap-1.5">{(instance.status === 'running' || instance.status === 'idle') && <><a href={instance.jupyterUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" leftIcon={<ExternalLink size={11} />}>Jupyter</Button></a><Button size="sm" variant="outline" leftIcon={<MonitorCog size={11} />} onClick={() => { setActiveTab('vscode'); toast.info('已打开 VS Code 远程连接视图', instance.name); }}>VS Code</Button><Button size="sm" variant="ghost" leftIcon={<SquareTerminal size={11} />} onClick={() => { setTerminalInstanceId(instance.id); setActiveTab('webssh'); }}>WebSSH</Button></>}{instance.status === 'stopped' && <Button size="sm" variant="ghost" leftIcon={<Play size={12} />} onClick={() => changeInstance(instance.id, 'start')}>启动</Button>}{(instance.status === 'running' || instance.status === 'idle') && <Button size="sm" variant="ghost" leftIcon={<Square size={12} />} onClick={() => changeInstance(instance.id, 'stop')}>停止</Button>}<Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} onClick={() => changeInstance(instance.id, 'delete')} className="text-error hover:text-error/80">删除</Button></div></div>
              </Card>;
            })}
          </div>}
        </div>
      )}

      {activeTab === 'editor' && activeFile && (
        <div className="space-y-4">
          <Card className="border-primary/25 bg-primary/[0.04]"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl border border-primary/20 bg-primary/15 p-2 text-primary"><FileCode2 size={18} /></div><div><p className="text-sm font-semibold text-text-primary">Web 编辑器 · customer-service-llm</p><p className="mt-1 text-xs text-text-muted">浏览器内完成代码浏览、编辑、保存与隔离运行，适合轻量修复、评审和临时调试。</p></div></div><div className="flex items-center gap-2"><Badge variant="success"><GitBranch size={11} className="mr-1" />feature/lora-eval</Badge><Badge variant="ghost">已挂载 ins007</Badge></div></div></Card>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[230px_minmax(0,1fr)_260px]">
            <Card noPadding className="overflow-hidden"><div className="border-b border-border px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><FolderGit2 size={15} className="text-primary" />EXPLORER</div><p className="mt-1 text-xs text-text-muted">customer-service-llm</p></div><div className="p-2"><p className="px-2 py-1 text-[11px] font-medium text-text-muted">⌄ workspace</p>{editorFiles.map(file => <button key={file.id} type="button" onClick={() => setActiveFileId(file.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors ${activeFileId === file.id ? 'bg-primary/15 text-text-primary' : 'text-text-muted hover:bg-white/5 hover:text-text-secondary'}`}><span className="ml-2">{fileIcon(file)}</span><span className="truncate">{file.path}</span>{file.changed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-warning" />}</button>)}</div></Card>
            <Card noPadding className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-elevated px-4 py-3"><div className="flex items-center gap-2"><span>{fileIcon(activeFile)}</span><span className="font-mono text-xs text-text-primary">{activeFile.path}</span>{activeFile.changed && <span className="text-[10px] text-warning">● 未保存</span>}</div><div className="flex items-center gap-1"><Button size="sm" variant="ghost" leftIcon={<Save size={12} />} onClick={saveFile}>保存</Button><Button size="sm" loading={editorRunning} leftIcon={<Play size={12} />} onClick={runFile}>运行</Button></div></div><textarea aria-label="Web 编辑器代码内容" value={activeFile.content} onChange={event => updateFile(event.target.value)} spellCheck={false} className="min-h-[460px] w-full resize-y bg-[#0a1020] px-5 py-4 font-mono text-[13px] leading-6 text-slate-200 outline-none" /></Card>
            <div className="space-y-4"><Card><div className="flex items-center gap-2"><GitBranch size={15} className="text-secondary" /><p className="text-sm font-semibold text-text-primary">Git 变更</p></div><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-text-secondary">src/train.py</span><Badge variant="warning">M</Badge></div><div className="flex justify-between"><span className="text-text-secondary">configs/finetune.yaml</span><Badge variant="warning">M</Badge></div><div className="flex justify-between"><span className="text-text-secondary">scripts/evaluate.py</span><Badge variant="success">A</Badge></div></div><Button size="sm" variant="outline" className="mt-4 w-full" leftIcon={<GitBranch size={12} />} onClick={() => toast.info('模拟 Git 操作', '变更已暂存，等待提交说明。')}>暂存全部变更</Button></Card><Card noPadding className="overflow-hidden"><div className="border-b border-border px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><PanelRight size={15} className="text-accent" />运行输出</div></div><pre className="min-h-40 whitespace-pre-wrap bg-[#080d18] p-4 font-mono text-[11px] leading-5 text-emerald-300">{editorOutput}</pre></Card></div>
          </div>
        </div>
      )}

      {activeTab === 'vscode' && selectedVSCode && (
        <div className="space-y-4">
          <Card className="border-accent/25 bg-accent/[0.04]"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl border border-accent/20 bg-accent/15 p-2 text-accent"><MonitorCog size={18} /></div><div><p className="text-sm font-semibold text-text-primary">VS Code 远程开发</p><p className="mt-1 text-xs text-text-muted">兼容 Remote SSH、Dev Container 与 VS Code Tunnel；代码在云端运行，编辑器、断点和扩展保持熟悉的桌面体验。</p></div></div><Button size="sm" variant="outline" leftIcon={<Copy size={12} />} onClick={() => copyText(selectedVSCode.command, 'VS Code 连接命令已复制')}>复制当前连接命令</Button></div></Card>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]"><div className="space-y-3">{vscodeProfiles.map(profile => <Card key={profile.id} className={`cursor-pointer transition-colors ${selectedVSCodeId === profile.id ? 'border-primary/40 bg-primary/[0.04]' : 'hover:border-primary/25'}`} onClick={() => setSelectedVSCodeId(profile.id)}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg border border-border bg-base p-2 text-primary"><MonitorCog size={16} /></div><div><div className="flex items-center gap-2"><p className="text-sm font-semibold text-text-primary">{profile.name}</p><Badge variant={profile.status === 'connected' ? 'success' : profile.status === 'ready' ? 'primary' : 'ghost'}>{profile.status === 'connected' ? '已连接' : profile.status === 'ready' ? '可连接' : '离线'}</Badge></div><p className="mt-1 text-xs text-text-muted">{profile.type} · {profile.workspace}</p><div className="mt-2 flex flex-wrap gap-1">{profile.extensions.map(extension => <Badge key={extension} variant="ghost">{extension}</Badge>)}</div></div></div><div className="flex gap-1"><Button size="sm" variant="ghost" leftIcon={<Copy size={11} />} onClick={event => { event.stopPropagation(); copyText(profile.command, '连接命令已复制'); }}>复制</Button><Button size="sm" loading={connectingProfileId === profile.id} onClick={event => { event.stopPropagation(); connectVSCode(profile); }}>{profile.status === 'connected' ? '重新连接' : '连接'}</Button></div></div></Card>)}</div>
            <Card><div className="flex items-center gap-2"><ServerCog size={16} className="text-secondary" /><p className="text-sm font-semibold text-text-primary">当前连接配置</p></div><div className="mt-4 space-y-3 text-xs"><div className="flex justify-between"><span className="text-text-muted">连接方式</span><span>{selectedVSCode.type}</span></div><div className="flex justify-between"><span className="text-text-muted">目标工作区</span><span className="font-mono text-text-secondary">{selectedVSCode.workspace}</span></div><div className="flex justify-between"><span className="text-text-muted">Git 分支</span><span className="font-mono text-text-secondary">{selectedVSCode.branch}</span></div><div className="flex justify-between"><span className="text-text-muted">最后活动</span><span>{selectedVSCode.lastActive}</span></div></div><div className="mt-5 rounded-xl border border-border bg-base p-3"><p className="mb-2 text-xs text-text-muted">连接命令</p><pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-accent">{selectedVSCode.command}</pre></div><div className="mt-4 rounded-xl border border-success/20 bg-success/5 p-3 text-xs leading-5 text-text-muted"><span className="font-medium text-success">团队建议：</span>使用 Dev Container 固化依赖，Remote SSH 用于在线排障，Tunnel 适合无 VPN 的受控连接。</div></Card></div>
        </div>
      )}

      {activeTab === 'webssh' && (
        <div className="space-y-4">
          <Card className="border-warning/25 bg-warning/[0.04]"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl border border-warning/20 bg-warning/15 p-2 text-warning"><SquareTerminal size={18} /></div><div><p className="text-sm font-semibold text-text-primary">WebSSH 隔离终端</p><p className="mt-1 text-xs text-text-muted">通过平台代理与审计会话进入研发实例，适合运维排障、环境检查和短命令操作。</p></div></div><div className="flex items-center gap-2"><Select value={terminalInstance?.id ?? ''} onChange={event => setTerminalInstanceId(event.target.value)} options={runningInstances.map(instance => ({ value: instance.id, label: `${instance.name} · ${instance.gpuType}` }))} className="min-w-60" />{terminalInstance && <Button size="sm" variant="outline" leftIcon={<Copy size={12} />} onClick={() => copySsh(terminalInstance)}>{copiedSsh === terminalInstance.id ? '已复制' : '复制 SSH'}</Button>}</div></div></Card>
          {runningInstances.length === 0 ? (
            <EmptyState
              icon={<SquareTerminal size={32} />}
              title="没有可连接的运行实例"
              description="请先启动一个研发实例，再建立 WebSSH 会话。"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <Card noPadding className="overflow-hidden border-slate-700 bg-[#080d18]">
                <div className="flex items-center justify-between border-b border-slate-700 bg-[#11192a] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-error" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    <span className="ml-2 font-mono text-xs text-slate-300">WebSSH · {terminalInstance?.name}</span>
                  </div>
                  <button type="button" onClick={() => setTerminalLines([])} className="text-xs text-slate-400 hover:text-white">清屏</button>
                </div>

                <div
                  className="min-h-[520px] cursor-text overflow-y-auto bg-[#080d18] p-5 font-mono text-[13px] leading-7 text-slate-300"
                  onClick={() => terminalInputRef.current?.focus()}
                >
                  <div aria-live="polite">
                    {terminalLines.map((line, index) => (
                      <p
                        key={`${line.text}-${index}`}
                        className={line.type === 'command' ? 'text-primary' : line.type === 'system' ? 'text-slate-500' : 'whitespace-pre-wrap text-slate-200'}
                      >
                        {line.text}
                      </p>
                    ))}
                  </div>

                  <form onSubmit={runTerminalCommand} className="mt-1 flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-success">zhiyun-dev@{terminalInstance?.name ?? 'workspace'}:~/workspace$</span>
                    <input
                      ref={terminalInputRef}
                      aria-label="WebSSH 命令"
                      autoFocus
                      value={terminalInput}
                      onChange={event => setTerminalInput(event.target.value)}
                      placeholder="输入 help 查看可用模拟命令"
                      spellCheck={false}
                      className="min-w-0 flex-1 appearance-none border-0 !bg-transparent p-0 font-mono text-[13px] text-white caret-emerald-300 shadow-none outline-none ring-0 placeholder:text-slate-600 focus:border-0 focus:outline-none focus:ring-0"
                      style={{ background: 'transparent', border: 'none', boxShadow: 'none', outline: 'none' }}
                    />
                  </form>
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <div className="flex items-center gap-2"><Wifi size={15} className="text-success" /><p className="text-sm font-semibold text-text-primary">会话安全</p></div>
                  <div className="mt-4 space-y-2 text-xs text-text-muted"><p>✓ 通过堡垒机跳转</p><p>✓ 命令与会话已审计</p><p>✓ 仅挂载授权目录</p><p>✓ 空闲 30 分钟自动断开</p></div>
                </Card>
                <Card>
                  <div className="flex items-center gap-2"><Blocks size={15} className="text-primary" /><p className="text-sm font-semibold text-text-primary">已挂载资源</p></div>
                  <div className="mt-3 flex flex-wrap gap-1">{terminalInstance?.mountedDatasets.slice(0, 2).map(item => <Badge key={item} variant="accent">{item}</Badge>)}{terminalInstance?.mountedModels.slice(0, 2).map(item => <Badge key={item} variant="secondary">{item}</Badge>)}</div>
                </Card>
                <Card>
                  <p className="text-sm font-semibold text-text-primary">常用命令</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {['pwd', 'ls', 'git status', 'nvidia-smi'].map(command => (
                      <button
                        type="button"
                        key={command}
                        onClick={() => executeTerminalCommand(command)}
                        className="rounded-md border border-border px-2 py-1 text-[11px] text-text-muted hover:border-primary/40 hover:text-primary"
                      >
                        {command}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'remote' && (
        <div className="space-y-4">
          <Card className="border-secondary/25 bg-secondary/[0.04]"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl border border-secondary/20 bg-secondary/15 p-2 text-secondary"><Cloud size={18} /></div><div><p className="text-sm font-semibold text-text-primary">远程开发环境</p><p className="mt-1 text-xs text-text-muted">将代码、运行时、依赖、算力与协作成员固化为可复用的云端工作区，适合跨设备和多人并行研发。</p></div></div><Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setWorkspaceModalOpen(true)}>创建远程环境</Button></div></Card>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">{workspaces.map(workspace => { const meta = workspaceStatus[workspace.status]; return <Card key={workspace.id} glow={workspace.status === 'running'} className={workspace.status === 'stopped' ? 'opacity-80' : ''}><div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-2"><Cloud size={16} className="text-secondary" /><p className="text-sm font-semibold text-text-primary">{workspace.name}</p></div><p className="mt-2 font-mono text-xs text-text-muted">{workspace.repository}</p></div><Badge variant={meta.variant}>{meta.label}</Badge></div><div className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-3"><span className="text-text-muted">运行时</span><span>{workspace.runtime}</span></div><div className="flex justify-between gap-3"><span className="text-text-muted">资源规格</span><span className="text-right">{workspace.resources}</span></div><div className="flex justify-between gap-3"><span className="text-text-muted">区域</span><span>{workspace.location}</span></div><div className="flex justify-between gap-3"><span className="text-text-muted">分支</span><span className="font-mono">{workspace.branch}</span></div></div><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><div className="flex -space-x-2">{workspace.collaborators.slice(0, 3).map(name => <span key={name} title={name} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-primary/20 text-[9px] font-semibold text-primary">{name.slice(0, 1)}</span>)}</div><span className="text-[11px] text-text-muted">{workspace.lastActive}</span></div><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" className="flex-1" leftIcon={workspace.status === 'running' ? <Square size={11} /> : <Play size={11} />} onClick={() => toggleWorkspace(workspace)}>{workspace.status === 'running' ? '停止' : '启动'}</Button><Button size="sm" className="flex-1" disabled={workspace.status !== 'running'} rightIcon={<ChevronRight size={12} />} onClick={() => openWorkspace(workspace)}>进入环境</Button></div></Card>; })}</div>
        </div>
      )}

      <Modal open={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} title="创建远程开发环境" width="lg"><div className="space-y-4"><div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-xs leading-5 text-text-muted"><span className="font-medium text-secondary">环境声明：</span>此处创建的是高保真 Mock 工作区，会模拟代码拉取、镜像初始化与资源分配过程，不会创建真实云资源。</div><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Input label="环境名称 *" placeholder="例如：知识库服务联调" value={workspaceForm.name} onChange={event => setWorkspaceForm(previous => ({ ...previous, name: event.target.value }))} /><Input label="Git 仓库 *" placeholder="group/project" value={workspaceForm.repository} onChange={event => setWorkspaceForm(previous => ({ ...previous, repository: event.target.value }))} /><Input label="分支" value={workspaceForm.branch} onChange={event => setWorkspaceForm(previous => ({ ...previous, branch: event.target.value }))} /><Select label="环境模板" value={workspaceForm.template} onChange={event => setWorkspaceForm(previous => ({ ...previous, template: event.target.value }))} options={[{ value: 'PyTorch + CUDA 12.1', label: 'PyTorch + CUDA 12.1' }, { value: 'Transformers + vLLM', label: 'Transformers + vLLM' }, { value: 'Python 3.11 + Jupyter', label: 'Python 3.11 + Jupyter' }, { value: 'Node.js + Web IDE', label: 'Node.js + Web IDE' }]} /><Select label="资源规格" value={workspaceForm.resources} onChange={event => setWorkspaceForm(previous => ({ ...previous, resources: event.target.value }))} options={[{ value: 'A100 80GB × 1 · 8C · 32Gi', label: 'A100 80GB × 1 · 8C · 32Gi' }, { value: 'A100 80GB × 2 · 16C · 64Gi', label: 'A100 80GB × 2 · 16C · 64Gi' }, { value: 'CPU · 8C · 32Gi', label: 'CPU · 8C · 32Gi' }]} /></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setWorkspaceModalOpen(false)}>取消</Button><Button leftIcon={<Cloud size={13} />} onClick={createWorkspace}>创建环境</Button></div></div></Modal>
    </div>
  );
}
