import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Database, ArrowLeft, Download, Layers, Calendar,
  BarChart2, Lock, FileText, GitBranch, Eye, ShieldCheck, Share2, Star, MessageSquare, Building2, Network
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { MarketplaceReviewsPanel } from '../../../components/marketplace/MarketplaceReviewsPanel';
import { useToast } from '../../../hooks/useToast';
import { getRuntimeDatasets, saveRuntimeDatasets } from '../../../data/mockDatasetsRuntime';
import { applyMarketplaceReview, type MarketplaceReview } from '../../../data/mockMarketplaceOperations';
import {
  getDatasetRuntimeState,
  updateDatasetRuntimeState,
} from '../../../data/mockDatasetRuntime';
import type {
  DatasetMetaSnapshot,
  HierarchicalTagMap,
  OperationRecord,
  OperationType,
} from '../../../data/mockDatasetRuntime';
import type {
  Dataset,
  DatasetPublicationPolicy,
  DatasetPublishScope,
  DatasetSharePermission,
  DatasetVersion,
  DatasetTask,
} from '../../../types';

const OP_TYPE_LABEL: Record<OperationType, string> = {
  view: '查看',
  download: '下载',
  modify: '修改',
  share: '共享',
};

const TASK_LABEL_MAP: Record<DatasetTask, string> = {
  classification: '分类',
  detection: '检测',
  generation: '生成',
  segmentation: '分割',
  translation: '翻译',
  qa: '问答',
  ner: '实体识别',
};

function parseSizeToMb(size: string) {
  const match = size.trim().match(/([\d.]+)\s*(KB|MB|GB|TB)/i);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'KB') return value / 1024;
  if (unit === 'MB') return value;
  if (unit === 'GB') return value * 1024;
  if (unit === 'TB') return value * 1024 * 1024;
  return 0;
}

function formatMbAsSize(mb: number) {
  if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(2)} TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(mb))} MB`;
}

function nextVersionName(versions: DatasetVersion[]) {
  return `v${versions.length + 1}.0`;
}

const SCOPE_META: Record<DatasetPublishScope, { label: string; description: string; target: string; icon: typeof Lock; accessLevel: Dataset['accessLevel'] }> = {
  workspace: {
    label: '工作空间',
    description: '仅指定工作空间成员可检索和访问，默认不向租户或平台目录暴露。',
    target: '智慧医疗研发空间',
    icon: Lock,
    accessLevel: 'private',
  },
  tenant: {
    label: '租户',
    description: '在当前租户内独立发布；其他租户及平台目录均无权访问。',
    target: '中国电信 AI 研究院',
    icon: Building2,
    accessLevel: 'team',
  },
  platform: {
    label: '平台',
    description: '发布到平台资产目录；外部下载与二次使用仍受独立策略控制。',
    target: '智云平台资产目录',
    icon: Network,
    accessLevel: 'public',
  },
};

function defaultPublicationPolicy(dataset: Dataset): DatasetPublicationPolicy {
  const scope: DatasetPublishScope = dataset.accessLevel === 'public' ? 'platform' : dataset.accessLevel === 'team' ? 'tenant' : 'workspace';
  return {
    scope,
    targetName: SCOPE_META[scope].target,
    accessPermission: scope === 'workspace' ? 'manage' : 'download',
    approvalRequired: scope === 'platform',
    externalDownloadAllowed: scope !== 'platform',
    updatedAt: dataset.updatedAt,
    updatedBy: dataset.creator,
  };
}

export default function DatasetDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [tab, setTab] = useState(() => searchParams.get('tab') === 'reviews' ? 'reviews' : 'basic');
  const [datasets, setDatasets] = useState(() => getRuntimeDatasets());
  const ds = useMemo(() => datasets.find(dataset => dataset.id === id) ?? datasets[0], [datasets, id]);
  const runtime = getDatasetRuntimeState(ds);
  const [versions, setVersions] = useState<DatasetVersion[]>(runtime.versions);
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>(runtime.operationRecords);
  const [hierarchicalTags, setHierarchicalTags] = useState<HierarchicalTagMap>(runtime.hierarchicalTags);
  const [datasetTags, setDatasetTags] = useState<string[]>(runtime.currentTags);
  const [metaSnapshots, setMetaSnapshots] = useState<DatasetMetaSnapshot[]>(runtime.metaSnapshots);
  const [tagDimension, setTagDimension] = useState<keyof HierarchicalTagMap>('业务域');
  const [tagInput, setTagInput] = useState('');
  const [compareLeft, setCompareLeft] = useState(ds.versions[0]?.version ?? '');
  const [compareRight, setCompareRight] = useState(ds.versions[1]?.version ?? ds.versions[0]?.version ?? '');
  const [showPublicationModal, setShowPublicationModal] = useState(false);
  const [publicationForm, setPublicationForm] = useState<DatasetPublicationPolicy>(() => defaultPublicationPolicy(ds));

  const currentUser = '张远航';
  const publicationPolicy = ds.publicationPolicy ?? defaultPublicationPolicy(ds);
  const PublicationScopeIcon = SCOPE_META[publicationPolicy.scope].icon;

  const handleReview = (review: Pick<MarketplaceReview, 'rating' | 'comment'>) => {
    const nextDatasets = datasets.map(dataset => dataset.id === ds.id ? applyMarketplaceReview(dataset, review.rating) : dataset);
    setDatasets(nextDatasets);
    saveRuntimeDatasets(nextDatasets);
    addOperation('modify', `发布 ${review.rating} 分评价`);
    toast.success('评论已发布', `已更新「${ds.name}」的评分与热度`);
  };

  const buildMetaSnapshot = (version: string, tags: string[] = datasetTags): DatasetMetaSnapshot => ({
    version,
    description: ds.description,
    tags: [...tags],
    tasks: [...ds.task],
    collectionMethod: ds.collectionMethod,
    processingMethod: ds.processingMethod,
    annotationScheme: ds.annotationScheme,
  });

  const addOperation = (type: OperationType, detail: string) => {
    const now = new Date();
    const at = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setOperationRecords(prev => [{ id: `op-${Date.now()}`, operator: currentUser, type, detail, at }, ...prev]);
  };

  useEffect(() => {
    addOperation('view', '查看数据集详情');
  }, [id]);

  useEffect(() => {
    updateDatasetRuntimeState(ds.id, prev => ({
      ...prev,
      versions,
      operationRecords,
      hierarchicalTags,
      currentTags: datasetTags,
      metaSnapshots,
    }));
  }, [ds.id, versions, operationRecords, hierarchicalTags, datasetTags, metaSnapshots]);

  const compareResult = useMemo(() => {
    const left = versions.find(v => v.version === compareLeft);
    const right = versions.find(v => v.version === compareRight);
    if (!left || !right) return null;
    const recordsDiff = left.records - right.records;
    const sizeDiffMb = parseSizeToMb(left.size) - parseSizeToMb(right.size);
    return {
      left,
      right,
      recordsDiff,
      sizeDiff: formatMbAsSize(Math.abs(sizeDiffMb)),
      sizeTrend: sizeDiffMb === 0 ? '持平' : sizeDiffMb > 0 ? '增加' : '减少',
    };
  }, [versions, compareLeft, compareRight]);

  const compareMetaResult = useMemo(() => {
    const left = metaSnapshots.find(item => item.version === compareLeft);
    const right = metaSnapshots.find(item => item.version === compareRight);
    if (!left || !right) return [];

    const buildRow = (field: string, leftValue: string, rightValue: string) => ({
      field,
      leftValue,
      rightValue,
      changed: leftValue !== rightValue,
    });

    return [
      buildRow('描述', left.description, right.description),
      buildRow('标签', left.tags.join('、') || '-', right.tags.join('、') || '-'),
      buildRow('任务类型', left.tasks.map(task => TASK_LABEL_MAP[task] ?? task).join('、'), right.tasks.map(task => TASK_LABEL_MAP[task] ?? task).join('、')),
      buildRow('采集方式', left.collectionMethod, right.collectionMethod),
      buildRow('处理与清洗策略', left.processingMethod, right.processingMethod),
      buildRow('标注方案', left.annotationScheme, right.annotationScheme),
    ];
  }, [metaSnapshots, compareLeft, compareRight]);

  const handleDownload = () => {
    addOperation('download', '下载数据集');
    toast.info('下载中', `正在下载 ${ds.name}...`);
  };

  const handlePreview = () => {
    addOperation('view', '预览数据样本');
    toast.info('预览数据', `${ds.name} 预览窗口已打开`);
  };

  const openPublicationManager = () => {
    setPublicationForm(ds.publicationPolicy ?? defaultPublicationPolicy(ds));
    setShowPublicationModal(true);
  };

  const selectPublishScope = (scope: DatasetPublishScope) => {
    setPublicationForm(prev => ({
      ...prev,
      scope,
      targetName: SCOPE_META[scope].target,
      accessPermission: scope === 'workspace' ? 'manage' : 'download',
      approvalRequired: scope === 'platform',
      externalDownloadAllowed: scope !== 'platform',
    }));
  };

  const handlePublicationSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!publicationForm.targetName.trim()) {
      toast.warning('缺少发布目标', '请填写工作空间、租户或平台资产目录名称');
      return;
    }
    const policy: DatasetPublicationPolicy = {
      ...publicationForm,
      targetName: publicationForm.targetName.trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
      updatedBy: currentUser,
    };
    const nextDatasets = datasets.map(dataset => dataset.id === ds.id ? {
      ...dataset,
      accessLevel: SCOPE_META[policy.scope].accessLevel,
      publicationPolicy: policy,
    } : dataset);
    setDatasets(nextDatasets);
    saveRuntimeDatasets(nextDatasets);
    addOperation('share', `发布至${SCOPE_META[policy.scope].label}：${policy.targetName}（${policy.accessPermission} 权限）`);
    setShowPublicationModal(false);
    toast.success('发布策略已生效', `「${ds.name}」已发布至${SCOPE_META[policy.scope].label}，层级隔离策略已更新`);
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value) {
      toast.warning('标签不能为空', '请输入标签后再添加');
      return;
    }
    setHierarchicalTags(prev => {
      if (prev[tagDimension].includes(value)) return prev;
      return { ...prev, [tagDimension]: [...prev[tagDimension], value] };
    });
    setDatasetTags(prev => (prev.includes(value) ? prev : [value, ...prev]));
    setTagInput('');
    const newVersion = {
      version: nextVersionName(versions),
      createdAt: new Date().toISOString().slice(0, 10),
      size: versions[0]?.size ?? ds.size,
      records: versions[0]?.records ?? ds.records,
      changes: `标签更新：新增 ${tagDimension}/${value}`,
      frozen: false,
      createdBy: currentUser,
    };
    setVersions(prev => [newVersion, ...prev]);
    setMetaSnapshots(prev => [buildMetaSnapshot(newVersion.version, datasetTags.includes(value) ? datasetTags : [value, ...datasetTags]), ...prev]);
    setCompareLeft(newVersion.version);
    addOperation('modify', `新增层级标签：${tagDimension}/${value}`);
    toast.success('标签已添加', `${tagDimension} 已新增标签 ${value}，并生成版本 ${newVersion.version}`);
  };

  const handleRemoveTag = (dimension: keyof HierarchicalTagMap, tag: string) => {
    setHierarchicalTags(prev => ({ ...prev, [dimension]: prev[dimension].filter(item => item !== tag) }));
    const nextTags = datasetTags.filter(item => item !== tag);
    setDatasetTags(nextTags);
    const newVersion = {
      version: nextVersionName(versions),
      createdAt: new Date().toISOString().slice(0, 10),
      size: versions[0]?.size ?? ds.size,
      records: versions[0]?.records ?? ds.records,
      changes: `标签更新：移除 ${dimension}/${tag}`,
      frozen: false,
      createdBy: currentUser,
    };
    setVersions(prev => [newVersion, ...prev]);
    setMetaSnapshots(prev => [buildMetaSnapshot(newVersion.version, nextTags), ...prev]);
    setCompareLeft(newVersion.version);
    addOperation('modify', `删除层级标签：${dimension}/${tag}`);
    toast.success('标签已移除', `${dimension} 标签 ${tag} 已删除，并生成版本 ${newVersion.version}`);
  };

  const handleCreateVersion = () => {
    const latest = versions[0];
    const nextRecords = (latest?.records ?? ds.records) + 12000;
    const latestSizeMb = parseSizeToMb(latest?.size ?? ds.size);
    const nextSize = formatMbAsSize(latestSizeMb + 320);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newVersion: DatasetVersion = {
      version: nextVersionName(versions),
      createdAt: today,
      size: nextSize,
      records: nextRecords,
      changes: '自动生成版本：新增数据清洗结果与标注修订',
      frozen: false,
      createdBy: currentUser,
    };

    setVersions(prev => [newVersion, ...prev]);
    setMetaSnapshots(prev => [buildMetaSnapshot(newVersion.version), ...prev]);
    setCompareLeft(newVersion.version);
    addOperation('modify', `自动生成版本 ${newVersion.version}`);
    toast.success('新版本已生成', `${newVersion.version} 已创建`);
  };

  const handleToggleFreeze = (version: string) => {
    setVersions(prev => prev.map(v => {
      if (v.version !== version) return v;
      return { ...v, frozen: !v.frozen };
    }));
    const nextFrozen = !(versions.find(v => v.version === version)?.frozen ?? false);
    addOperation('modify', `${nextFrozen ? '冻结' : '解冻'}版本 ${version}`);
    toast.success('版本状态已更新', `${version} 已${nextFrozen ? '冻结' : '解冻'}`);
  };

  const handleRollback = (targetVersion: DatasetVersion) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const rollbackVersion: DatasetVersion = {
      version: nextVersionName(versions),
      createdAt: today,
      size: targetVersion.size,
      records: targetVersion.records,
      changes: `回滚到 ${targetVersion.version} 快照`,
      frozen: false,
      createdBy: currentUser,
    };
    const sourceMeta = metaSnapshots.find(snapshot => snapshot.version === targetVersion.version);
    setVersions(prev => [rollbackVersion, ...prev]);
    setMetaSnapshots(prev => [
      sourceMeta ? { ...sourceMeta, version: rollbackVersion.version } : buildMetaSnapshot(rollbackVersion.version),
      ...prev,
    ]);
    setCompareLeft(rollbackVersion.version);
    setCompareRight(targetVersion.version);
    addOperation('modify', `执行版本回滚：${targetVersion.version} -> ${rollbackVersion.version}`);
    toast.success('回滚成功', `已基于 ${targetVersion.version} 创建回滚版本 ${rollbackVersion.version}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/datasets" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 数据集
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{ds.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
            <Database size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-text-primary">{ds.name}</h1>
              <span className="flex items-center gap-1 rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                <PublicationScopeIcon size={11} /> {SCOPE_META[publicationPolicy.scope].label}发布
              </span>
              {ds.encryptionEnabled && (
                <span className="flex items-center gap-1 text-[11px] text-warning border border-warning/30 bg-warning/10 rounded px-2 py-0.5">
                  <ShieldCheck size={11} /> 加密
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted mb-2">{ds.description}</p>
            <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
              <span className="flex items-center gap-1"><Layers size={11} />{ds.size}</span>
              <span className="flex items-center gap-1"><BarChart2 size={11} />{ds.records.toLocaleString()} 样本</span>
              <span className="flex items-center gap-1"><Download size={11} />{ds.downloads} 下载</span>
              <span className="flex items-center gap-1"><Star size={11} className="text-warning" />{ds.rating.toFixed(1)} 评分</span>
              <span className="flex items-center gap-1"><MessageSquare size={11} />{ds.reviews} 评论</span>
              <span className="flex items-center gap-1"><Calendar size={11} />更新于 {ds.updatedAt.slice(0, 10)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Eye size={14} />} onClick={handlePreview}>预览数据</Button>
          <Button variant="outline" leftIcon={<Share2 size={14} />} onClick={openPublicationManager}>发布与权限</Button>
          <Button leftIcon={<Download size={14} />} onClick={handleDownload}>下载数据集</Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'basic', label: '基础信息', icon: <FileText size={14} /> },
          { key: 'reviews', label: '评价与评论', icon: <MessageSquare size={13} />, count: ds.reviews },
          { key: 'detail', label: '详细信息', icon: <FileText size={14} /> },
          { key: 'tags', label: '标签设置', icon: <FileText size={14} /> },
          { key: 'operations', label: '操作记录', icon: <FileText size={14} />, count: operationRecords.length },
          { key: 'versions', label: '版本管理', icon: <GitBranch size={14} />, count: versions.length },
          { key: 'preview', label: '数据预览', icon: <Eye size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'basic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4">数据集基础信息</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '数据格式', value: ds.format },
                { label: '语言', value: ds.language },
                { label: '类别', value: ds.category },
                { label: '任务类型', value: ds.task.map(task => TASK_LABEL_MAP[task] ?? task).join('、') },
                { label: '创建者', value: ds.creator },
                { label: '组织', value: ds.organization },
                { label: '许可证', value: ds.license },
                { label: '创建时间', value: ds.createdAt.slice(0, 10) },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-text-muted mb-1">{item.label}</p>
                  <p className="text-sm text-text-secondary font-medium">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-2">标签</p>
              <div className="flex flex-wrap gap-1.5">
                {datasetTags.map(t => (
                  <span key={t} className="px-2 py-1 text-xs bg-white/5 border border-border rounded-lg text-text-muted">{t}</span>
                ))}
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-4">数据统计</h3>
              <div className="space-y-3">
                {[
                  { label: '总样本数', value: ds.records.toLocaleString() },
                  { label: '数据大小', value: ds.size },
                  { label: '版本数量', value: versions.length },
                  { label: '下载次数', value: ds.downloads },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs text-text-muted">{s.label}</span>
                    <span className="text-sm font-semibold text-text-primary">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">发布与权限</h3>
                <Badge variant={publicationPolicy.scope === 'platform' ? 'accent' : publicationPolicy.scope === 'tenant' ? 'secondary' : 'ghost'}>
                  {SCOPE_META[publicationPolicy.scope].label}
                </Badge>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-text-muted">发布目标</span>
                  <span className="max-w-[170px] text-right text-text-secondary">{publicationPolicy.targetName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-muted">默认权限</span>
                  <span className="text-text-secondary">{publicationPolicy.accessPermission === 'manage' ? '协同管理' : publicationPolicy.accessPermission === 'download' ? '可下载' : '仅查看'}</span>
                </div>
                <div className="rounded-lg border border-border bg-white/[0.03] p-2.5 text-text-muted leading-5">
                  {SCOPE_META[publicationPolicy.scope].description}
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3 w-full" leftIcon={<ShieldCheck size={12} />} onClick={openPublicationManager}>
                管理发布策略
              </Button>
            </Card>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <MarketplaceReviewsPanel
          key={`dataset-${ds.id}`}
          asset={ds}
          assetType="dataset"
          currentUser={currentUser}
          onSubmit={handleReview}
        />
      )}

      {tab === 'detail' && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">详细信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">采集方式</p>
              <p className="text-sm text-text-secondary">{ds.collectionMethod}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">处理与清洗策略</p>
              <p className="text-sm text-text-secondary">{ds.processingMethod}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">标注方案</p>
              <p className="text-sm text-text-secondary">{ds.annotationScheme}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">适用任务</p>
              <p className="text-sm text-text-secondary">{ds.task.map(task => TASK_LABEL_MAP[task] ?? task).join(' / ')}</p>
            </div>
          </div>
        </Card>
      )}

      {tab === 'tags' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4">层级化标签设置</h3>
            <div className="space-y-4">
              {(Object.keys(hierarchicalTags) as (keyof HierarchicalTagMap)[]).map(dimension => (
                <div key={dimension} className="border border-border rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-2">{dimension}</p>
                  <div className="flex flex-wrap gap-2">
                    {hierarchicalTags[dimension].length === 0 && (
                      <span className="text-xs text-text-muted">暂无标签</span>
                    )}
                    {hierarchicalTags[dimension].map(tag => (
                      <span key={`${dimension}-${tag}`} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white/5 border border-border rounded text-text-secondary">
                        {tag}
                        <button className="text-text-muted hover:text-error" onClick={() => handleRemoveTag(dimension, tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-4">新增标签</h3>
            <div className="space-y-3">
              <Select
                label="维度"
                value={tagDimension}
                onChange={e => setTagDimension(e.target.value as keyof HierarchicalTagMap)}
                options={[
                  { value: '业务域', label: '业务域' },
                  { value: '项目阶段', label: '项目阶段' },
                  { value: '语种', label: '语种' },
                  { value: '文本类型', label: '文本类型' },
                ]}
              />
              <Input
                label="标签值"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="例如：生产验证、少数民族语言"
              />
              <Button onClick={handleAddTag}>添加标签</Button>
              <p className="text-xs text-text-muted">支持按业务域、项目阶段、语种、文本类型等维度归类管理。</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'operations' && (
        <Card noPadding>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">操作记录</h3>
            <span className="text-xs text-text-muted">自动记录查看、下载、修改、共享行为</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-border">
                  <th className="text-left px-5 py-3 font-medium">时间</th>
                  <th className="text-left px-5 py-3 font-medium">操作人</th>
                  <th className="text-left px-5 py-3 font-medium">操作类型</th>
                  <th className="text-left px-5 py-3 font-medium">详情</th>
                </tr>
              </thead>
              <tbody>
                {operationRecords.map(record => (
                  <tr key={record.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-text-secondary">{record.at}</td>
                    <td className="px-5 py-3 text-text-secondary">{record.operator}</td>
                    <td className="px-5 py-3">
                      <Badge variant={record.type === 'modify' ? 'warning' : record.type === 'download' ? 'accent' : record.type === 'share' ? 'success' : 'ghost'}>
                        {OP_TYPE_LABEL[record.type]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{record.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'versions' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3 justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">版本管理</h3>
                <p className="text-xs text-text-muted mt-1">支持自动生成版本、差异对比、回滚与冻结，保证实验可重复性。</p>
              </div>
              <Button size="sm" leftIcon={<GitBranch size={12} />} onClick={handleCreateVersion}>生成新版本</Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">版本差异对比</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="左侧版本"
                value={compareLeft}
                onChange={e => setCompareLeft(e.target.value)}
                options={versions.map(v => ({ value: v.version, label: v.version }))}
              />
              <Select
                label="右侧版本"
                value={compareRight}
                onChange={e => setCompareRight(e.target.value)}
                options={versions.map(v => ({ value: v.version, label: v.version }))}
              />
            </div>
            {compareResult && (
              <div className="mt-4 p-3 border border-border rounded-lg text-xs text-text-secondary space-y-2">
                <p>样本差异：{compareResult.left.version} 相对 {compareResult.right.version} {compareResult.recordsDiff >= 0 ? '增加' : '减少'} {Math.abs(compareResult.recordsDiff).toLocaleString()} 条</p>
                <p>容量差异：{compareResult.left.version} 相对 {compareResult.right.version} {compareResult.sizeTrend} {compareResult.sizeDiff}</p>
                <p>冻结状态：{compareResult.left.version} {compareResult.left.frozen ? '已冻结' : '可编辑'} / {compareResult.right.version} {compareResult.right.frozen ? '已冻结' : '可编辑'}</p>
              </div>
            )}

            {compareMetaResult.length > 0 && (
              <div className="mt-4 border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 text-xs text-text-muted border-b border-border bg-white/[0.02]">字段级差异明细</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text-muted border-b border-border/60">
                      <th className="text-left px-3 py-2 font-medium">字段</th>
                      <th className="text-left px-3 py-2 font-medium">{compareLeft}</th>
                      <th className="text-left px-3 py-2 font-medium">{compareRight}</th>
                      <th className="text-left px-3 py-2 font-medium">变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareMetaResult.map(row => (
                      <tr key={row.field} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 text-text-primary">{row.field}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.leftValue}</td>
                        <td className="px-3 py-2 text-text-secondary">{row.rightValue}</td>
                        <td className="px-3 py-2">
                          <Badge variant={row.changed ? 'warning' : 'ghost'}>{row.changed ? '已变化' : '无变化'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card noPadding>
            <div className="divide-y divide-border">
              {versions.map(v => (
                <div key={v.version} className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-5 py-4 gap-3 hover:bg-white/2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GitBranch size={14} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{v.version}</p>
                        <Badge variant={v.frozen ? 'ghost' : 'success'}>{v.frozen ? '已冻结' : '可编辑'}</Badge>
                      </div>
                      <p className="text-xs text-text-muted">{v.changes}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                    <span>{v.size}</span>
                    <span>{v.records.toLocaleString()} 条</span>
                    <span>{v.createdAt.slice(0, 10)}</span>
                    <Button size="sm" variant="outline" onClick={() => handleRollback(v)}>回滚到此版本</Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleFreeze(v.version)}>{v.frozen ? '解冻' : '冻结'}</Button>
                    <Button size="sm" variant="outline" leftIcon={<Download size={12} />} onClick={handleDownload}>下载</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'preview' && (
        <Card>
          <div className="font-mono text-xs text-text-secondary space-y-2">
            {[
              '{"instruction": "请分析以下医学文本中的症状描述", "input": "患者主诉头痛、发热三天，体温38.5℃...", "output": "症状分析：1. 主要症状：头痛（持续性）..."}',
              '{"instruction": "提取以下文本的关键信息", "input": "2024年绵阳市三台县出现流感样病例...", "output": "关键信息：时间: 2024年, 地点: 绵阳市三台县..."}',
              '{"instruction": "对以下医学问答进行质量评估", "input": "Q: 什么是高血压？ A: 高血压是...", "output": "评分: 4.2/5.0，理由：..."}',
            ].map((line, i) => (
              <div key={i} className="p-3 bg-base rounded-lg border border-border overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">{line}</pre>
              </div>
            ))}
            <p className="text-text-muted text-center pt-2">仅展示前 3 条样本 · 完整数据需下载后查看</p>
          </div>
        </Card>
      )}

      <Modal
        title={`发布与权限管理：${ds.name}`}
        open={showPublicationModal}
        onClose={() => setShowPublicationModal(false)}
        width="xl"
      >
        <form onSubmit={handlePublicationSubmit} className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-xs leading-5 text-text-secondary">
            发布范围遵循由小到大的隔离边界：工作空间 {'->'} 租户 {'->'} 平台。资产不会自动向上级目录同步，必须由拥有者明确选择目标层级并提交策略。
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-text-primary">选择发布层级</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(Object.keys(SCOPE_META) as DatasetPublishScope[]).map(scope => {
                const meta = SCOPE_META[scope];
                const ScopeIcon = meta.icon;
                const isActive = publicationForm.scope === scope;
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => selectPublishScope(scope)}
                    className={`rounded-xl border p-4 text-left transition-colors ${isActive ? 'border-primary/50 bg-primary/10' : 'border-border bg-white/[0.02] hover:border-primary/30'}`}
                  >
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'}`}>
                      <ScopeIcon size={17} />
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{meta.label}</p>
                    <p className="mt-1 text-xs leading-5 text-text-muted">{meta.description}</p>
                    <p className={`mt-3 text-[11px] ${isActive ? 'text-primary' : 'text-text-muted'}`}>{isActive ? '当前发布层级' : '选择此层级'}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="发布目标"
              value={publicationForm.targetName}
              onChange={event => setPublicationForm(prev => ({ ...prev, targetName: event.target.value }))}
              placeholder={SCOPE_META[publicationForm.scope].target}
              required
            />
            <Select
              label="默认访问权限"
              value={publicationForm.accessPermission}
              onChange={event => setPublicationForm(prev => ({ ...prev, accessPermission: event.target.value as DatasetSharePermission }))}
              options={[
                { value: 'read', label: '仅查看元信息' },
                { value: 'download', label: '查看与下载' },
                { value: 'manage', label: '协同管理' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PermissionSwitch
              label="访问申请审批"
              description={publicationForm.scope === 'platform' ? '平台用户在访问前必须经资产管理员审批。' : '工作空间或租户内按既有成员关系进行访问。'}
              checked={publicationForm.approvalRequired}
              onChange={() => setPublicationForm(prev => ({ ...prev, approvalRequired: !prev.approvalRequired }))}
            />
            <PermissionSwitch
              label="允许平台外下载"
              description={publicationForm.scope === 'platform' ? '关闭后仅允许受控任务与在线预览使用数据。' : '非平台发布资产不会向平台外部开放下载。'}
              checked={publicationForm.externalDownloadAllowed}
              disabled={publicationForm.scope !== 'platform'}
              onChange={() => setPublicationForm(prev => ({ ...prev, externalDownloadAllowed: !prev.externalDownloadAllowed }))}
            />
          </div>

          <div className="rounded-xl border border-border bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={15} className="text-success" />
              <p className="text-sm font-semibold text-text-primary">层级隔离检查</p>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
              {(Object.keys(SCOPE_META) as DatasetPublishScope[]).map(scope => {
                const isCurrent = scope === publicationForm.scope;
                return (
                  <div key={scope} className={`rounded-lg border p-3 ${isCurrent ? 'border-success/30 bg-success/10' : 'border-border bg-base/40'}`}>
                    <p className="font-medium text-text-primary">{SCOPE_META[scope].label}</p>
                    <p className={`mt-1 ${isCurrent ? 'text-success' : 'text-text-muted'}`}>
                      {isCurrent ? `已显式发布：${publicationForm.targetName || SCOPE_META[scope].target}` : '未授权访问，保持隔离'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowPublicationModal(false)}>取消</Button>
            <Button type="submit" leftIcon={<Share2 size={14} />}>保存发布策略</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PermissionSwitch({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border border-border p-3 ${disabled ? 'opacity-60' : ''}`}>
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onChange}
        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${checked ? 'bg-primary' : 'bg-white/20'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
