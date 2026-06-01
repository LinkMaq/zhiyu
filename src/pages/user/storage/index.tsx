import { useState } from 'react';
import {
  HardDrive, FolderOpen, File, Upload, FolderPlus, Trash2,
  Download, RefreshCw, ChevronRight, ChevronDown, Search
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';

interface FNode { name: string; type: 'folder' | 'file'; size?: string; modified?: string; children?: FNode[] }

const TREE: FNode[] = [
  { name: '数据集', type: 'folder', children: [
    { name: 'ChineseMedical-QA-v2', type: 'folder', children: [
      { name: 'train.jsonl', type: 'file', size: '2.1 GB', modified: '2025-06-08' },
      { name: 'val.jsonl', type: 'file', size: '256 MB', modified: '2025-06-08' },
    ]},
    { name: 'FinanceReport-NER', type: 'folder', children: [
      { name: 'corpus.json', type: 'file', size: '1.8 GB', modified: '2025-05-20' },
    ]},
  ]},
  { name: '模型权重', type: 'folder', children: [
    { name: 'qwen2.5-72b-ft-v1', type: 'folder', children: [
      { name: 'pytorch_model.bin', type: 'file', size: '142 GB', modified: '2025-06-09' },
      { name: 'config.json', type: 'file', size: '4 KB', modified: '2025-06-09' },
      { name: 'tokenizer.json', type: 'file', size: '11 MB', modified: '2025-06-09' },
    ]},
  ]},
  { name: '训练输出', type: 'folder', children: [
    { name: 'checkpoints', type: 'folder', children: [
      { name: 'checkpoint-500', type: 'file', size: '14.2 GB', modified: '2025-06-10' },
      { name: 'checkpoint-1000', type: 'file', size: '14.3 GB', modified: '2025-06-10' },
    ]},
    { name: 'logs', type: 'folder', children: [
      { name: 'train.log', type: 'file', size: '2.3 MB', modified: '2025-06-10' },
      { name: 'events.tfevents', type: 'file', size: '89 MB', modified: '2025-06-10' },
    ]},
  ]},
  { name: '代码', type: 'folder', children: [
    { name: 'train.py', type: 'file', size: '18 KB', modified: '2025-06-07' },
    { name: 'inference.py', type: 'file', size: '12 KB', modified: '2025-06-09' },
    { name: 'requirements.txt', type: 'file', size: '1 KB', modified: '2025-06-01' },
  ]},
];

function TreeNode({ node, depth = 0, onSelect, selected }: { node: FNode; depth?: number; onSelect: (n: FNode) => void; selected: string }) {
  const [open, setOpen] = useState(depth === 0);
  const isSelected = selected === node.name;
  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${isSelected ? 'bg-primary/15 text-primary' : 'hover:bg-white/5 text-text-secondary'}`}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        onClick={() => { onSelect(node); if (node.type === 'folder') setOpen(o => !o); }}
      >
        {node.type === 'folder' ? (
          <>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <FolderOpen size={12} className="text-warning shrink-0" />
          </>
        ) : (
          <>
            <span className="w-3" />
            <File size={12} className="text-text-muted shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === 'folder' && open && node.children?.map(child => (
        <TreeNode key={child.name} node={child} depth={depth + 1} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  );
}

export default function StoragePage() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<FNode>(TREE[0]);
  const [search, setSearch] = useState('');
  const files = (selected.children ?? []).filter(f => f.name.includes(search));

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="对象存储"
        subtitle="管理训练数据与模型文件"
        icon={<HardDrive size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<FolderPlus size={14} />} onClick={() => toast.info('输入目录名称', '请输入要创建的新目录名称')}>新建目录</Button>
            <Button leftIcon={<Upload size={14} />} onClick={() => toast.info('请选择上传文件')}>上传文件</Button>
          </div>
        }
      />

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-96">
        {/* Left tree */}
        <Card className="w-56 shrink-0 overflow-y-auto" noPadding>
          <div className="px-3 py-3 border-b border-border">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">文件树</p>
          </div>
          <div className="py-2">
            {TREE.map(node => (
              <TreeNode key={node.name} node={node} onSelect={setSelected} selected={selected.name} />
            ))}
          </div>
        </Card>

        {/* Right file list */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索文件..."
                className="w-full bg-surface border border-border rounded-lg pl-8 pr-4 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={12} />} onClick={() => { toast.info('文件列表已刷新'); }}>刷新</Button>
          </div>

          <Card noPadding className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-12 px-4 py-3 border-b border-border text-xs font-medium text-text-muted">
              <span className="col-span-5">名称</span>
              <span className="col-span-2">大小</span>
              <span className="col-span-3">修改时间</span>
              <span className="col-span-2">操作</span>
            </div>
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <FolderOpen size={32} className="text-text-muted" />
                <p className="text-sm text-text-muted">此目录为空</p>
              </div>
            ) : files.map(f => (
              <div key={f.name} className="grid grid-cols-12 items-center px-4 py-3 border-b border-border/50 hover:bg-white/2 transition-colors text-sm">
                <div className="col-span-5 flex items-center gap-2">
                  {f.type === 'folder' ? <FolderOpen size={14} className="text-warning" /> : <File size={14} className="text-text-muted" />}
                  <span className="text-text-secondary truncate">{f.name}</span>
                </div>
                <span className="col-span-2 text-xs text-text-muted">{f.size ?? '—'}</span>
                <span className="col-span-3 text-xs text-text-muted">{f.modified ?? '—'}</span>
                <div className="col-span-2 flex items-center gap-1">
                  {f.type === 'file' && (
                    <Button size="sm" variant="ghost" leftIcon={<Download size={11} />} onClick={() => toast.success(`正在下载 ${f.name}`)}>下载</Button>
                  )}
                  <Button size="sm" variant="ghost" leftIcon={<Trash2 size={11} />} className="text-error/70 hover:text-error" onClick={() => toast.error('删除功能当前不可用')}>删除</Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
