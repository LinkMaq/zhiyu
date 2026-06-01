import React, { useEffect, useState, useMemo } from 'react';
import {
  Database, Search, Filter, Upload, Download,
  Calendar, Globe, Lock, Layers, BarChart2,
  ArrowUpDown, Tag, Trash2, Archive, CheckSquare,
  Square, ChevronDown, Clock, Eye, GitBranch, ShieldCheck
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import { getRuntimeDatasets, saveRuntimeDatasets } from '../../../data/mockDatasetsRuntime';
import type { Dataset, DatasetTask, DatasetAccessLevel } from '../../../types';
import { Link } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';

const taskBadge: Record<string, React.ReactNode> = {
  'text-generation': <Badge variant="primary">文本生成</Badge>,
  'image-segmentation': <Badge variant="secondary">图像分割</Badge>,
  'ner': <Badge variant="accent">命名实体</Badge>,
  'instruction-tuning': <Badge variant="primary">指令微调</Badge>,
  'code-review': <Badge variant="success">代码审查</Badge>,
  'speech-recognition': <Badge variant="warning">语音识别</Badge>,
  'retrieval': <Badge variant="accent">向量检索</Badge>,
  'anomaly-detection': <Badge variant="error">异常检测</Badge>,
};

type SortKey = 'updatedAt' | 'createdAt' | 'category' | 'creator' | 'usageFrequency' | 'records' | 'name';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'updatedAt', label: '更新时间（新到旧）' },
  { key: 'createdAt', label: '创建时间（新到旧）' },
  { key: 'category', label: '类别（A-Z）' },
  { key: 'creator', label: '创建者（A-Z）' },
  { key: 'usageFrequency', label: '使用频率（高到低）' },
  { key: 'records', label: '数据量' },
  { key: 'name', label: '名称 A-Z' },
];

const TASK_FILTERS = ['全部任务', '文本生成', '命名实体', '指令微调', '图像分割', '语音识别', '向量检索', '异常检测'];
const TASK_MAP: Record<string, string> = {
  '文本生成': 'text-generation', '命名实体': 'ner', '指令微调': 'instruction-tuning',
  '图像分割': 'image-segmentation', '语音识别': 'speech-recognition',
  '向量检索': 'retrieval', '异常检测': 'anomaly-detection',
};

function buildWeeklyUsageTrend(dataset: Dataset) {
  const seed = dataset.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = Math.max(6, Math.round(dataset.downloads / 120));
  return Array.from({ length: 7 }, (_, index) => {
    const drift = Math.round((dataset.records % 100000) / 25000) - 2;
    const wave = Math.round(Math.sin((seed + index) * 0.8) * 3);
    const noise = ((seed + index * 7) % 4) - 1;
    return Math.max(1, base + drift + wave + noise);
  });
}

export default function DatasetsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTask, setSelectedTask] = useState('全部任务');
  const [selectedAccess, setSelectedAccess] = useState('全部');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [datasets, setDatasets] = useState<Dataset[]>(() => getRuntimeDatasets());
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [batchAccessTarget, setBatchAccessTarget] = useState<DatasetAccessLevel>('team');

  const currentUser = '张远航';

  const filtered = useMemo(() => {
    let list = datasets.filter(d => {
      if (tab === 'mine' && d.creator !== currentUser) return false;
      if (tab === 'public' && d.accessLevel !== 'public') return false;
      if (tab === 'encrypted' && !d.encryptionEnabled) return false;
      if (selectedTask !== '全部任务') {
        if (!d.task.includes((TASK_MAP[selectedTask] ?? selectedTask) as DatasetTask)) return false;
      }
      if (selectedAccess === '公开' && d.accessLevel !== 'public') return false;
      if (selectedAccess === '私有' && d.accessLevel !== 'private') return false;
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.description.includes(q) || d.tags.some(t => t.includes(q));
    });
    list = [...list].sort((a, b) => {
      if (sortKey === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
      if (sortKey === 'createdAt') return b.createdAt.localeCompare(a.createdAt);
      if (sortKey === 'category') return a.category.localeCompare(b.category);
      if (sortKey === 'creator') return a.creator.localeCompare(b.creator);
      if (sortKey === 'usageFrequency') return b.downloads - a.downloads;
      if (sortKey === 'records') return b.records - a.records;
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
    return list;
  }, [datasets, tab, search, sortKey, selectedTask, selectedAccess]);

  const pageData = filtered.slice((page - 1) * 9, page * 9);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === pageData.length && pageData.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageData.map(d => d.id)));
    }
  };

  const handleBatchDelete = () => {
    setDatasets(prev => prev.filter(d => !selected.has(d.id)));
    toast.success(`已删除 ${selected.size} 个数据集`);
    setSelected(new Set());
  };

  const handleBatchAuthorize = () => {
    const targetLabel = batchAccessTarget === 'public' ? '公开' : batchAccessTarget === 'private' ? '私有' : '团队';
    setDatasets(prev => prev.map(d => (selected.has(d.id) ? { ...d, accessLevel: batchAccessTarget } : d)));
    toast.success(`已将 ${selected.size} 个数据集授权级别调整为${targetLabel}`);
    setSelected(new Set());
  };

  useEffect(() => {
    saveRuntimeDatasets(datasets);
  }, [datasets]);

  const sortLabel = SORT_OPTIONS.find(s => s.key === sortKey)?.label ?? '排序';

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="数据集管理"
        subtitle={`共 ${datasets.length} 个数据集`}
        icon={<Database size={20} />}
        actions={
          <Link to="/user/datasets/upload">
            <Button leftIcon={<Upload size={14} />}>上传数据集</Button>
          </Link>
        }
      />

      <Tabs
        tabs={[
          { key: 'all', label: '全部', count: datasets.length },
          { key: 'mine', label: '我的', count: datasets.filter(d => d.creator === currentUser).length },
          { key: 'public', label: '公开', count: datasets.filter(d => d.accessLevel === 'public').length },
          { key: 'encrypted', label: '加密保护', count: datasets.filter(d => d.encryptionEnabled).length },
        ]}
        active={tab}
        onChange={v => { setTab(v); setPage(1); setSelected(new Set()); }}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索名称、描述、标签..."
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        <div className="relative">
          <Button variant="outline" leftIcon={<ArrowUpDown size={14} />} rightIcon={<ChevronDown size={12} />}
            onClick={() => setShowSortMenu(s => !s)}>
            {sortLabel}
          </Button>
          {showSortMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-elevated border border-border rounded-lg shadow-xl z-20 py-1">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.key}
                  onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${sortKey === opt.key ? 'text-primary' : 'text-text-primary'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" leftIcon={<Filter size={14} />}
          onClick={() => setShowFilter(s => !s)}
          className={showFilter ? 'border-primary/50 text-primary' : ''}>
          高级筛选{(selectedTask !== '全部任务' || selectedAccess !== '全部') ? ' ●' : ''}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium">任务类型</p>
              <div className="flex flex-wrap gap-1.5">
                {TASK_FILTERS.map(t => (
                  <button key={t} onClick={() => setSelectedTask(t)}
                    className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                      selectedTask === t ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-border text-text-muted hover:text-text-primary'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium">访问权限</p>
              <div className="flex gap-1.5">
                {['全部', '公开', '私有'].map(a => (
                  <button key={a} onClick={() => setSelectedAccess(a)}
                    className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                      selectedAccess === a ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-border text-text-muted hover:text-text-primary'
                    }`}>{a}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm text-primary font-medium">已选 {selected.size} 项</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" leftIcon={<Download size={13} />}
              onClick={() => { toast.success(`开始批量下载 ${selected.size} 个数据集`); setSelected(new Set()); }}>批量下载</Button>
            <div className="flex items-center gap-2">
              <select
                value={batchAccessTarget}
                onChange={e => setBatchAccessTarget(e.target.value as DatasetAccessLevel)}
                className="bg-base border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary/60"
              >
                <option value="private">私有</option>
                <option value="team">团队</option>
                <option value="public">公开</option>
              </select>
              <Button size="sm" variant="outline" onClick={handleBatchAuthorize}>批量授权</Button>
            </div>
            <Button size="sm" variant="outline" leftIcon={<Archive size={13} />}
              onClick={() => {
                setDatasets(prev => prev.map(d => (selected.has(d.id) ? { ...d, status: 'archived' } : d)));
                toast.success(`已归档 ${selected.size} 个数据集`);
                setSelected(new Set());
              }}>批量归档</Button>
            <Button size="sm" variant="outline" leftIcon={<Trash2 size={13} />}
              onClick={handleBatchDelete}
              className="text-error border-error/30 hover:bg-error/10">批量删除</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={selectAll} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
          {selected.size === pageData.length && pageData.length > 0
            ? <CheckSquare size={13} className="text-primary" />
            : <Square size={13} />}
          全选当前页
        </button>
        <span className="text-xs text-text-muted ml-2">共 {filtered.length} 条结果</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pageData.map(ds => (
          <div key={ds.id} className="relative group">
            <button onClick={e => { e.preventDefault(); toggleSelect(ds.id); }}
              className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              {selected.has(ds.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-text-muted" />}
            </button>
            {selected.has(ds.id) && (
              <div className="absolute inset-0 rounded-xl border-2 border-primary/40 pointer-events-none z-10" />
            )}
            <Link to={`/user/datasets/${ds.id}`}>
              {(() => {
                const trend = buildWeeklyUsageTrend(ds);
                const min = Math.min(...trend);
                const max = Math.max(...trend);
                const first = trend[0] || 1;
                const last = trend[trend.length - 1] || 1;
                const delta = Math.round(((last - first) / first) * 100);
                return (
              <Card className="hover:border-primary/30 hover:bg-elevated transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                    <Database size={18} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {ds.encryptionEnabled && (
                      <span title="AES/SM4 加密保护" className="flex items-center gap-0.5 text-[10px] text-warning border border-warning/30 bg-warning/10 rounded px-1.5 py-0.5">
                        <ShieldCheck size={10} /> 加密
                      </span>
                    )}
                    {ds.accessLevel === 'public' ? <Globe size={12} className="text-text-muted" /> : <Lock size={12} className="text-text-muted" />}
                    {taskBadge[ds.task[0]] ?? <Badge>{ds.task[0]}</Badge>}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1 truncate">{ds.name}</h3>
                <p className="text-xs text-text-muted mb-3 line-clamp-2">{ds.description}</p>
                <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                  <span className="flex items-center gap-1"><Layers size={11} />{ds.size}</span>
                  <span className="flex items-center gap-1"><BarChart2 size={11} />{ds.records.toLocaleString()} 条</span>
                  <span className="flex items-center gap-1"><Download size={11} />{ds.downloads}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} />{ds.updatedAt.slice(0, 10)}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ds.tags.slice(0, 3).map(t => (
                      <span key={t} className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white/5 border border-border rounded text-text-muted">
                        <Tag size={9} />{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted shrink-0 ml-2">
                    {ds.versions.length > 1 && (
                      <span className="flex items-center gap-0.5"><GitBranch size={10} />{ds.versions.length} 版本</span>
                    )}
                    <span className="flex items-center gap-0.5"><Eye size={10} />{Math.floor(ds.downloads * 3.2)}</span>
                    <span className="flex items-center gap-0.5"><Clock size={10} />{Math.floor(ds.downloads / 10 + 5)}次操作</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-text-muted">近 7 天使用热度</span>
                    <span className={`text-[11px] ${delta >= 0 ? 'text-success' : 'text-warning'}`}>
                      {delta >= 0 ? '+' : ''}{delta}%
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 h-8 items-end">
                    {trend.map((value, idx) => {
                      const height = max === min ? 60 : Math.max(20, Math.round(((value - min) / (max - min)) * 100));
                      return (
                        <div key={`${ds.id}-trend-${idx}`} className="bg-primary/20 rounded-sm overflow-hidden">
                          <div className="bg-primary/70 rounded-sm" style={{ height: `${height}%` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
                );
              })()}
            </Link>
          </div>
        ))}
      </div>

      <Pagination page={page} total={filtered.length} pageSize={9} onChange={setPage} />
    </div>
  );
}
