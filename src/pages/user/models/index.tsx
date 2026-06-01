import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BrainCircuit, Search, Filter, Download, Star, Upload,
  Cpu, Tag, Trash2, CheckSquare, Square, ChevronDown,
  Lock, Globe, ShieldCheck, GitBranch, Flame, BookOpen,
  Users, Building2, MessageSquare, TrendingUp, Pin, Award, ArrowUpRight, CalendarClock, Share2
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { getRuntimeModels, saveRuntimeModels } from '../../../data/mockModelRuntime';
import type { Model } from '../../../types';
import { useToast } from '../../../hooks/useToast';

const frameworkColor: Record<string, 'primary' | 'secondary' | 'success' | 'accent'> = {
  PyTorch: 'primary', TensorFlow: 'success', PaddlePaddle: 'secondary', ONNX: 'accent',
};

const CATEGORIES = ['全部', 'NLP', '计算机视觉', '多模态', '语音', '图表/表格'];
const CAT_MAP: Record<string, string> = {
  'NLP': 'nlp', '计算机视觉': 'cv', '多模态': 'multimodal', '语音': 'audio', '图表/表格': 'tabular',
};

const FRAMEWORKS = ['全部框架', 'PyTorch', 'TensorFlow', 'PaddlePaddle', 'ONNX'];
const INDUSTRIES = ['全部行业', '通用行业', '政务', '金融', '通信', '工业', '医疗'];
const PRIORITIES = ['全部优先级', '高', '中', '低'];
const REGIONS = ['全部区域', '全国', '华北', '华东', '华南', '西南', '西北'];
const ACCURACY_LEVELS = [
  { value: 'all', label: '全部精度' },
  { value: 'high', label: 'Accuracy >= 90%' },
  { value: 'mid', label: 'Accuracy 80% - 90%' },
  { value: 'base', label: 'Accuracy < 80%' },
];
const CREATED_RANGES = [
  { value: 'all', label: '全部时间' },
  { value: '30d', label: '最近30天' },
  { value: '90d', label: '最近90天' },
  { value: '180d', label: '最近180天' },
  { value: '365d', label: '最近一年' },
];

export default function ModelsPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('public');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedFramework, setSelectedFramework] = useState('全部框架');
  const [selectedIndustry, setSelectedIndustry] = useState('全部行业');
  const [selectedPriority, setSelectedPriority] = useState('全部优先级');
  const [selectedRegion, setSelectedRegion] = useState('全部区域');
  const [selectedAccuracy, setSelectedAccuracy] = useState('all');
  const [createdRange, setCreatedRange] = useState('all');
  const [tagQuery, setTagQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showFrameworkMenu, setShowFrameworkMenu] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [models, setModels] = useState<Model[]>(() => getRuntimeModels());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Model | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportTarget, setExportTarget] = useState<Model | null>(null);
  const [exportForm, setExportForm] = useState({
    format: 'safetensors',
    encryption: 'aes',
    sdkEncrypt: true,
    transferEncrypt: true,
    tokenProtected: true,
    authToken: '',
  });
  const [exporting, setExporting] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [publishTarget, setPublishTarget] = useState<Model | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareTarget, setShareTarget] = useState<Model | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareForm, setShareForm] = useState({
    targetType: 'space',
    targetName: '',
    accessLevel: 'invoke',
    callLimitQps: 30,
    dailyQuota: 20000,
    expiresAt: '',
  });
  const [hotSort, setHotSort] = useState<'downloads' | 'stars' | 'rating'>('downloads');
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Model | null>(null);
  const [reviewForm, setReviewForm] = useState({ score: 5, comment: '' });
  const [highlightId, setHighlightId] = useState('');

  const currentUser = '张远航';

  useEffect(() => {
    saveRuntimeModels(models);
  }, [models]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const modelParam = searchParams.get('model');
    if (tabParam && ['public', 'mine', 'featured', 'hot'].includes(tabParam)) {
      setTab(tabParam);
      setPage(1);
    }
    if (modelParam) {
      setHighlightId(modelParam);
      setSelectedCategory('全部');
      setSelectedFramework('全部框架');
      setShowFilter(false);
      const target = models.find(item => item.id === modelParam);
      if (target) {
        setSearch(target.name);
        toast.success('已定位到新导入模型', `模型「${target.name}」已显示在当前列表`);
      }
    }
  }, [searchParams, models, toast]);

  const hotData = useMemo(() => {
    return [...models].sort((a, b) => b[hotSort] - a[hotSort]).slice(0, 10);
  }, [models, hotSort]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const createdRangeDays: Record<string, number> = {
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365,
    };

    const matchAccuracy = (value: number) => {
      if (selectedAccuracy === 'all') return true;
      if (selectedAccuracy === 'high') return value >= 90;
      if (selectedAccuracy === 'mid') return value >= 80 && value < 90;
      return value < 80;
    };

    if (tab === 'hot') return hotData;
    return models.filter(m => {
      if (tab === 'mine' && m.creator !== currentUser) return false;
      if (tab === 'public' && m.accessLevel !== 'public') return false;
      if (tab === 'featured' && !m.featured) return false;
      if (selectedCategory !== '全部' && m.category !== CAT_MAP[selectedCategory]) return false;
      if (selectedFramework !== '全部框架' && m.framework !== selectedFramework) return false;
      if (selectedIndustry !== '全部行业' && (m.industry ?? '通用行业') !== selectedIndustry) return false;
      if (selectedPriority !== '全部优先级' && (m.taxonomy?.priority ?? '中') !== selectedPriority) return false;
      if (selectedRegion !== '全部区域' && (m.taxonomy?.region ?? '全国') !== selectedRegion) return false;
      if (!matchAccuracy(m.precisionMetrics?.accuracy ?? m.versions[0]?.accuracy ?? 0)) return false;
      if (createdRange !== 'all') {
        const createdAt = new Date(m.createdAt).getTime();
        if (!Number.isFinite(createdAt)) return false;
        const diff = now - createdAt;
        const maxDays = createdRangeDays[createdRange] ?? 3650;
        if (diff > maxDays * 24 * 60 * 60 * 1000) return false;
      }
      if (tagQuery.trim()) {
        const target = tagQuery.trim().toLowerCase();
        const taxonomyTags = m.taxonomy?.subTags ?? [];
        const hasTag = [...m.tags, ...m.labels, ...taxonomyTags].some(t => t.toLowerCase().includes(target));
        if (!hasTag) return false;
      }
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q)
        || m.description.toLowerCase().includes(q)
        || m.tags.some(t => t.toLowerCase().includes(q))
        || m.supportedTasks.some(t => t.toLowerCase().includes(q))
        || m.creator.toLowerCase().includes(q)
        || m.source.toLowerCase().includes(q)
      );
    });
  }, [
    models,
    tab,
    search,
    selectedCategory,
    selectedFramework,
    selectedIndustry,
    selectedPriority,
    selectedRegion,
    selectedAccuracy,
    createdRange,
    tagQuery,
    hotData,
  ]);

  const pageData = filtered.slice((page - 1) * 9, page * 9);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === pageData.length && pageData.length > 0) setSelected(new Set());
    else setSelected(new Set(pageData.map(m => m.id)));
  };

  const handleBatchDelete = () => {
    const selectedModels = models.filter(item => selected.has(item.id));
    const forbidden = selectedModels.filter(item => item.creator !== currentUser);
    if (forbidden.length > 0) {
      toast.warning('仅空间创建者可删除', `以下模型不在您的删除范围：${forbidden.map(item => item.name).slice(0, 3).join('、')}`);
      return;
    }
    setModels(prev => prev.filter(m => !selected.has(m.id)));
    toast.success(`已删除 ${selected.size} 个模型`);
    setSelected(new Set());
    setShowDeleteConfirm(false);
  };

  const handleSingleDelete = (target: Model) => {
    if (target.creator !== currentUser) {
      toast.warning('仅空间创建者可删除', '当前模型不在您的删除范围内');
      return;
    }
    setDeleteTarget(target);
    setShowDeleteConfirm(true);
  };

  const submitShareRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTarget) return;
    if (!shareForm.targetName.trim()) {
      toast.warning('缺少共享目标', '请填写目标空间或团队');
      return;
    }
    setSharing(true);
    await new Promise(r => setTimeout(r, 700));
    const now = new Date().toISOString().slice(0, 10);
    setModels(prev => prev.map(model => {
      if (model.id !== shareTarget.id) return model;
      const newRule = {
        id: `${model.id}-share-${Date.now()}`,
        targetType: shareForm.targetType as 'space' | 'team',
        targetName: shareForm.targetName.trim(),
        accessLevel: shareForm.accessLevel as 'read' | 'invoke' | 'manage',
        callLimitQps: Number(shareForm.callLimitQps),
        dailyQuota: Number(shareForm.dailyQuota),
        expiresAt: shareForm.expiresAt || undefined,
        createdAt: now,
        createdBy: currentUser,
      };
      return {
        ...model,
        shareRules: [newRule, ...(model.shareRules ?? [])],
      };
    }));
    setSharing(false);
    setShowShare(false);
    setShareForm({
      targetType: 'space',
      targetName: '',
      accessLevel: 'invoke',
      callLimitQps: 30,
      dailyQuota: 20000,
      expiresAt: '',
    });
    toast.success('共享策略已生效', '已完成跨空间/跨团队授权并设置调用限制');
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportTarget) return;
    if (exportForm.tokenProtected && !exportForm.authToken.trim()) {
      toast.warning('缺少授权 Token', '请填写授权 Token 后再导出');
      return;
    }
    setExporting(true);
    await new Promise(r => setTimeout(r, 1000));
    setExporting(false);
    setShowExport(false);
    const algoLabel = exportForm.encryption === 'sm4' ? 'SM4' : 'AES-256';
    toast.success(`「${exportTarget.name}」已加入安全导出队列（${exportForm.format.toUpperCase()} · ${algoLabel}）`, '文件将通过 SDK 本地加密后上传，密文传输并以密文落盘');
    setExportForm({
      format: 'safetensors',
      encryption: 'aes',
      sdkEncrypt: true,
      transferEncrypt: true,
      tokenProtected: true,
      authToken: '',
    });
  };

  const handlePublish = async (newLevel: string) => {
    if (!publishTarget) return;
    setPublishing(true);
    await new Promise(r => setTimeout(r, 800));
    setModels(prev => prev.map(m =>
      m.id === publishTarget.id ? { ...m, accessLevel: newLevel as import('../../../types').ModelAccessLevel } : m
    ));
    setPublishing(false);
    setShowPublish(false);
    const levelLabel = newLevel === 'private' ? '个人' : newLevel === 'tenant' ? '租户' : '公开';
    toast.success(`发布成功`, `「${publishTarget.name}」已发布为 [${levelLabel}] 层级`);
  };

  const toggleFeatured = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id !== id) return m;
      const next = !m.featured;
      toast.success(next ? '已标记为精选' : '已取消精选', `「${m.name}」`);
      return { ...m, featured: next };
    }));
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setModels(prev => prev.map(m => {
      if (m.id !== reviewTarget.id) return m;
      const newReviews = m.reviews + 1;
      const newRating = parseFloat(((m.rating * m.reviews + reviewForm.score) / newReviews).toFixed(1));
      return { ...m, reviews: newReviews, rating: newRating };
    }));
    toast.success('评价提交成功', `您对「${reviewTarget.name}」的评分已记录`);
    setShowReview(false);
    setReviewForm({ score: 5, comment: '' });
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={10} className={i < full ? 'text-warning fill-warning' : 'text-text-muted'} />
        ))}
        <span className="ml-0.5 text-[10px] text-text-muted">{rating.toFixed(1)}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="模型广场"
        subtitle="探索、下载、共享和部署 AI 模型"
        icon={<BrainCircuit size={20} />}
        actions={
          <Link to="/user/models/import"><Button leftIcon={<Upload size={14} />}>导入模型</Button></Link>
        }
      />

      <Tabs
        tabs={[
          { key: 'public', label: '公开模型', count: models.filter(m => m.accessLevel === 'public').length },
          { key: 'mine', label: '我的模型', count: models.filter(m => m.creator === currentUser).length },
          { key: 'featured', label: '精选', count: models.filter(m => m.featured).length },
          { key: 'hot', label: '热度榜', icon: <Flame size={13} /> },
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
            placeholder="搜索模型名称、描述、标签..."
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        {/* Framework filter */}
        <div className="relative">
          <Button variant="outline" rightIcon={<ChevronDown size={12} />}
            onClick={() => setShowFrameworkMenu(s => !s)}>
            {selectedFramework}
          </Button>
          {showFrameworkMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-elevated border border-border rounded-lg shadow-xl z-20 py-1">
              {FRAMEWORKS.map(f => (
                <button key={f} onClick={() => { setSelectedFramework(f); setShowFrameworkMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${selectedFramework === f ? 'text-primary' : 'text-text-primary'}`}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" leftIcon={<Filter size={14} />}
          onClick={() => setShowFilter(s => !s)}
          className={showFilter ? 'border-primary/50 text-primary' : ''}>
          更多筛选
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => { setSelectedCategory(c); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedCategory === c ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-border text-text-muted hover:text-text-primary'}`}>
            {c}
          </button>
        ))}
      </div>

      {showFilter && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <Select
              label="行业"
              value={selectedIndustry}
              onChange={e => { setSelectedIndustry(e.target.value); setPage(1); }}
              options={INDUSTRIES.map(item => ({ value: item, label: item }))}
            />
            <Select
              label="优先级"
              value={selectedPriority}
              onChange={e => { setSelectedPriority(e.target.value); setPage(1); }}
              options={PRIORITIES.map(item => ({ value: item, label: item }))}
            />
            <Select
              label="适用区域"
              value={selectedRegion}
              onChange={e => { setSelectedRegion(e.target.value); setPage(1); }}
              options={REGIONS.map(item => ({ value: item, label: item }))}
            />
            <Select
              label="精度指标"
              value={selectedAccuracy}
              onChange={e => { setSelectedAccuracy(e.target.value); setPage(1); }}
              options={ACCURACY_LEVELS}
            />
            <Select
              label="创建时间"
              value={createdRange}
              onChange={e => { setCreatedRange(e.target.value); setPage(1); }}
              options={CREATED_RANGES}
            />
            <Input
              label="标签关键字"
              placeholder="按标签/业务域标签筛选"
              value={tagQuery}
              onChange={e => { setTagQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex justify-end mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedIndustry('全部行业');
                setSelectedPriority('全部优先级');
                setSelectedRegion('全部区域');
                setSelectedAccuracy('all');
                setCreatedRange('all');
                setTagQuery('');
                setPage(1);
              }}
            >
              重置筛选
            </Button>
          </div>
        </Card>
      )}

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm text-primary font-medium">已选 {selected.size} 项</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" leftIcon={<Download size={13} />}
              onClick={() => { toast.success(`开始导出 ${selected.size} 个模型`); setSelected(new Set()); }}>批量导出</Button>
            <Button size="sm" variant="outline" leftIcon={<Trash2 size={13} />}
              onClick={() => { setDeleteTarget(null); setShowDeleteConfirm(true); }}
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
        <span className="text-xs text-text-muted ml-2">共 {filtered.length} 个模型</span>
      </div>

      {/* Hot leaderboard */}
      {tab === 'hot' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-warning" />
              <h3 className="text-sm font-semibold text-text-primary">模型热度榜 TOP 10</h3>
            </div>
            <div className="flex items-center gap-1">
              {([['downloads', '下载量'], ['stars', '收藏数'], ['rating', '综合评分']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setHotSort(k)}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${hotSort === k ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-text-muted hover:text-text-primary'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {hotData.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-white/[0.03] transition-colors">
                <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold shrink-0 ${
                  idx === 0 ? 'bg-warning/20 text-warning' : idx === 1 ? 'bg-gray-400/20 text-gray-400' : idx === 2 ? 'bg-orange-400/20 text-orange-400' : 'bg-white/5 text-text-muted'
                }`}>
                  {idx === 0 ? <Award size={14} /> : idx + 1}
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
                  <BrainCircuit size={14} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/user/models/${m.id}`} className="text-sm font-medium text-text-primary hover:text-primary truncate">{m.name}</Link>
                    {m.featured && <Flame size={11} className="text-warning shrink-0" />}
                  </div>
                  <p className="text-xs text-text-muted truncate">{m.description}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><Download size={11} />{m.downloads.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Star size={11} className="text-warning" />{m.stars}</span>
                  {renderStars(m.rating)}
                  <span className="flex items-center gap-1"><MessageSquare size={11} />{m.reviews}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => { setReviewTarget(m); setShowReview(true); }}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border text-text-muted hover:text-primary hover:border-primary/40 transition-colors">
                    <MessageSquare size={11} />评价
                  </button>
                  <TrendingUp size={12} className="text-success" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Regular model grid */}
      {tab !== 'hot' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageData.map(m => (
              <Card
                key={m.id}
                className={`group/card h-full transition-all duration-200 ${selected.has(m.id) ? 'border-primary/40 ring-1 ring-primary/30 bg-primary/[0.03]' : 'hover:border-primary/30 hover:bg-elevated'} ${highlightId === m.id ? 'border-success/50 ring-1 ring-success/30' : ''} ${m.featured ? 'border-warning/20' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => toggleSelect(m.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${selected.has(m.id) ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-white/5 text-text-muted hover:text-primary hover:border-primary/40'}`}
                    title="选择模型"
                  >
                    {selected.has(m.id) ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} />}
                  </button>
                  <div className="flex items-center gap-1 p-1 rounded-full border border-border/70 bg-white/[0.03] backdrop-blur-sm">
                    {tab === 'mine' && (
                      <>
                        <button
                          onClick={() => { setPublishTarget(m); setShowPublish(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="分级发布"
                        >
                          <ArrowUpRight size={13} />
                        </button>
                        <button
                          onClick={() => { setShareTarget(m); setShowShare(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="跨空间/团队共享"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          onClick={() => toggleFeatured(m.id)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${m.featured ? 'text-warning bg-warning/10' : 'text-text-muted hover:text-warning hover:bg-warning/10'}`}
                          title={m.featured ? '取消精选' : '标为精选'}
                        >
                          <Pin size={13} />
                        </button>
                        <button
                          onClick={() => handleSingleDelete(m)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                          title="删除模型"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setExportTarget(m); setShowExport(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                      title="导出模型"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>

                <Link to={`/user/models/${m.id}`} className="block">
                  <div className="hover:opacity-95 transition-opacity">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
                        <BrainCircuit size={18} />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {m.featured && (
                          <span className="flex items-center gap-0.5 text-[10px] text-warning border border-warning/30 bg-warning/10 rounded px-1.5 py-0.5">
                            <Flame size={10} /> 精选
                          </span>
                        )}
                        {m.encrypted && (
                          <span className="flex items-center gap-0.5 text-[10px] text-success border border-success/30 bg-success/10 rounded px-1.5 py-0.5">
                            <ShieldCheck size={10} /> 加密
                          </span>
                        )}
                        {m.accessLevel === 'public'
                          ? <Globe size={12} className="text-text-muted" />
                          : m.accessLevel === 'tenant'
                          ? <Building2 size={12} className="text-accent" />
                          : m.accessLevel === 'team'
                          ? <Users size={12} className="text-secondary" />
                          : <Lock size={12} className="text-text-muted" />}
                        <Badge variant={frameworkColor[m.framework] ?? 'ghost'}>{m.framework}</Badge>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1 truncate group-hover/card:text-primary transition-colors">{m.name}</h3>
                    <p className="text-xs text-text-muted mb-3 line-clamp-2">{m.description}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><Tag size={11} />类别：{m.category}</span>
                      <span className="flex items-center gap-1"><Tag size={11} />来源：{m.source}</span>
                      <span className="flex items-center gap-1"><Users size={11} />创建者：{m.creator}</span>
                      <span className="flex items-center gap-1"><CalendarClock size={11} />创建时间：{m.createdAt}</span>
                      <span className="flex items-center gap-1"><Cpu size={11} />框架：{m.framework}</span>
                      <span className="flex items-center gap-1"><Cpu size={11} />硬件：{m.hardwareDep[0] ?? '待评估'}</span>
                      <span className="flex items-center gap-1"><Download size={11} />下载：{m.downloads}</span>
                      <span className="flex items-center gap-1"><GitBranch size={11} />版本：{m.versions.length}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-text-muted flex-wrap">
                      <span className="px-1.5 py-0.5 rounded border border-border bg-white/5">行业：{m.industry ?? '通用行业'}</span>
                      <span className="px-1.5 py-0.5 rounded border border-border bg-white/5">业务域：{m.taxonomy?.businessDomain ?? '通用'}</span>
                      <span className="px-1.5 py-0.5 rounded border border-border bg-white/5">优先级：{m.taxonomy?.priority ?? '中'}</span>
                      <span className="px-1.5 py-0.5 rounded border border-border bg-white/5">区域：{m.taxonomy?.region ?? '全国'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.supportedTasks.slice(0, 3).map(t => (
                          <span key={t} className="px-1.5 py-0.5 text-xs bg-white/5 border border-border rounded text-text-muted">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {renderStars(m.rating)}
                        <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                          <BookOpen size={10} />{m.reviews}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
          <Pagination page={page} total={filtered.length} pageSize={9} onChange={setPage} />
        </>
      )}

      <Modal
        title={deleteTarget ? `删除模型：${deleteTarget.name}` : `批量删除模型`}
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        width="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
            {deleteTarget
              ? `确认删除模型「${deleteTarget.name}」？删除后版本快照与共享规则将一并清除，且不可恢复。`
              : `确认删除已选 ${selected.size} 个模型？删除后版本快照与共享规则将一并清除，且不可恢复。`}
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-error/80 hover:bg-error text-white border-none"
              onClick={() => {
                if (deleteTarget) {
                  setModels(prev => prev.filter(item => item.id !== deleteTarget.id));
                  toast.success('模型已删除', `已删除 ${deleteTarget.name}`);
                  setDeleteTarget(null);
                  setShowDeleteConfirm(false);
                  return;
                }
                handleBatchDelete();
              }}
            >
              确认删除
            </Button>
            <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}>取消</Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={`跨空间/跨团队共享：${shareTarget?.name ?? ''}`}
        open={showShare}
        onClose={() => setShowShare(false)}
        width="sm"
      >
        <form onSubmit={submitShareRule} className="space-y-4">
          <Select
            label="共享目标类型"
            value={shareForm.targetType}
            onChange={e => setShareForm(prev => ({ ...prev, targetType: e.target.value }))}
            options={[
              { value: 'space', label: '空间' },
              { value: 'team', label: '团队' },
            ]}
          />
          <Input
            label="目标名称"
            placeholder="请输入空间名或团队名"
            value={shareForm.targetName}
            onChange={e => setShareForm(prev => ({ ...prev, targetName: e.target.value }))}
            required
          />
          <Select
            label="访问级别"
            value={shareForm.accessLevel}
            onChange={e => setShareForm(prev => ({ ...prev, accessLevel: e.target.value }))}
            options={[
              { value: 'read', label: '只读元信息' },
              { value: 'invoke', label: '可调用推理' },
              { value: 'manage', label: '协同管理' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="调用上限 (QPS)"
              type="number"
              min={1}
              value={shareForm.callLimitQps}
              onChange={e => setShareForm(prev => ({ ...prev, callLimitQps: Number(e.target.value) || 1 }))}
            />
            <Input
              label="日调用配额"
              type="number"
              min={100}
              value={shareForm.dailyQuota}
              onChange={e => setShareForm(prev => ({ ...prev, dailyQuota: Number(e.target.value) || 100 }))}
            />
          </div>
          <Input
            label="失效时间（可选）"
            type="date"
            value={shareForm.expiresAt}
            onChange={e => setShareForm(prev => ({ ...prev, expiresAt: e.target.value }))}
          />
          <div className="rounded-lg border border-border bg-white/5 p-3 text-xs text-text-muted">
            共享范围：支持跨空间/跨团队；调用控制：QPS + 日配额双限制，超限自动拒绝。
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" loading={sharing} leftIcon={<Share2 size={14} />}>保存共享策略</Button>
            <Button type="button" variant="outline" onClick={() => setShowShare(false)}>取消</Button>
          </div>
        </form>
      </Modal>

      {/* Export Model Modal */}
      <Modal title={`导出模型：${exportTarget?.name ?? ''}`} open={showExport} onClose={() => setShowExport(false)} width="sm">
        <form onSubmit={handleExport} className="space-y-4">
          <Select
            label="导出格式"
            value={exportForm.format}
            onChange={e => setExportForm(f => ({ ...f, format: e.target.value }))}
            options={[
              { value: 'safetensors', label: 'SafeTensors（推荐）' },
              { value: 'gguf', label: 'GGUF（量化推理）' },
              { value: 'onnx', label: 'ONNX（跨平台部署）' },
              { value: 'torchscript', label: 'TorchScript' },
            ]}
          />
          <Select
            label="模型文件加密算法"
            value={exportForm.encryption}
            onChange={e => setExportForm(f => ({ ...f, encryption: e.target.value }))}
            options={[
              { value: 'aes', label: 'AES-256-GCM（推荐）' },
              { value: 'sm4', label: 'SM4-GCM（国密）' },
            ]}
          />
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-border">
            <div>
              <p className="text-sm text-text-primary font-medium">SDK 本地加密</p>
              <p className="text-xs text-text-muted mt-0.5">客户端通过 SDK 先加密再上传，传输与存储全程密文</p>
            </div>
            <button
              type="button"
              onClick={() => setExportForm(f => ({ ...f, sdkEncrypt: !f.sdkEncrypt }))}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${exportForm.sdkEncrypt ? 'bg-primary' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${exportForm.sdkEncrypt ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-border">
            <div>
              <p className="text-sm text-text-primary font-medium">传输链路加密</p>
              <p className="text-xs text-text-muted mt-0.5">TLS 1.3 通道传输密文模型分片</p>
            </div>
            <button
              type="button"
              onClick={() => setExportForm(f => ({ ...f, transferEncrypt: !f.transferEncrypt }))}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${exportForm.transferEncrypt ? 'bg-primary' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${exportForm.transferEncrypt ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-border">
            <div>
              <p className="text-sm text-text-primary font-medium">授权 Token 解密</p>
              <p className="text-xs text-text-muted mt-0.5">推理运行时按授权 Token 解密加载，明文不落盘</p>
            </div>
            <button
              type="button"
              onClick={() => setExportForm(f => ({ ...f, tokenProtected: !f.tokenProtected, authToken: '' }))}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${exportForm.tokenProtected ? 'bg-primary' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${exportForm.tokenProtected ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {exportForm.tokenProtected && (
            <Input
              label="授权 Token"
              placeholder="输入解密授权 Token"
              value={exportForm.authToken}
              onChange={e => setExportForm(f => ({ ...f, authToken: e.target.value }))}
              required
            />
          )}

          <div className="text-xs text-text-muted bg-white/5 border border-border rounded-lg p-3 space-y-1">
            <p>安全链路：存储加密 {'->'} 传输加密 {'->'} 运行解密 {'->'} 明文不落盘</p>
            <p>当前策略：{exportForm.encryption === 'sm4' ? 'SM4' : 'AES-256'} / SDK 本地加密 {exportForm.sdkEncrypt ? '已启用' : '未启用'} / TLS 传输 {exportForm.transferEncrypt ? '已启用' : '未启用'}</p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={exporting} className="flex-1" leftIcon={<Download size={14} />}>
              {exporting ? '导出中...' : '开始导出'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowExport(false)}>取消</Button>
          </div>
        </form>
      </Modal>

      {/* Tiered Publish Modal (需求67) */}
      <Modal title={`分级发布：${publishTarget?.name ?? ''}`} open={showPublish} onClose={() => setShowPublish(false)} width="sm">
        {publishTarget && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">将模型发布到不同层级，扩大模型可见范围。发布后访问权限立即生效。</p>
            {/* 3-tier flow */}
            <div className="flex items-center justify-between gap-2">
              {([
                { level: 'private', icon: <Lock size={16} />, label: '个人', desc: '仅自己可见', color: 'border-border text-text-muted' },
                { level: 'tenant', icon: <Building2 size={16} />, label: '租户', desc: '组织内可见', color: 'border-accent/40 text-accent' },
                { level: 'public', icon: <Globe size={16} />, label: '公开', desc: '所有用户可见', color: 'border-success/40 text-success' },
              ] as const).map((item) => (
                <button key={item.level} onClick={() => handlePublish(item.level)}
                  disabled={publishing || publishTarget.accessLevel === item.level}
                  className={`flex-1 p-3 rounded-xl border-2 transition-colors text-center ${
                    publishTarget.accessLevel === item.level
                      ? 'bg-primary/10 border-primary/40'
                      : `hover:bg-white/5 ${item.color}`
                  } disabled:opacity-60 disabled:cursor-not-allowed`}>
                  <div className="flex justify-center mb-1">{item.icon}</div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                  {publishTarget.accessLevel === item.level && (
                    <span className="text-[10px] text-primary font-medium mt-1 block">当前状态</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-border">
              <ShieldCheck size={13} className="text-success shrink-0" />
              <p className="text-xs text-text-muted">发布操作不可撤销至更低层级。建议先在租户内验证，再公开发布。</p>
            </div>
            {publishing && <p className="text-xs text-primary text-center">发布中，请稍候…</p>}
          </div>
        )}
      </Modal>

      {/* Review Modal (需求72) */}
      <Modal title={`评价模型：${reviewTarget?.name ?? ''}`} open={showReview} onClose={() => setShowReview(false)} width="sm">
        <form onSubmit={handleReview} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">综合评分</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, score: s }))}>
                  <Star size={24} className={s <= reviewForm.score ? 'text-warning fill-warning' : 'text-border'} />
                </button>
              ))}
              <span className="text-sm text-text-muted ml-1">{reviewForm.score} / 5</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">评价内容（可选）</label>
            <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="分享您的使用体验…"
              rows={3}
              className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-primary/60" />
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" leftIcon={<Star size={14} />}>提交评价</Button>
            <Button type="button" variant="outline" onClick={() => setShowReview(false)}>取消</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
