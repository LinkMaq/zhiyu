import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, Download, Star, Cpu, Tag, Cloud, Code2, Zap, TrendingDown, ShieldCheck, KeyRound, Lock, CheckCircle2, RotateCcw, History, SplitSquareVertical } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { getRuntimeModels, saveRuntimeModels } from '../../../data/mockModelRuntime';
import type { ModelVersion } from '../../../types';

export default function ModelDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [models, setModels] = useState(() => getRuntimeModels());
  const [tab, setTab] = useState('overview');
  const [compareBase, setCompareBase] = useState<string>('');
  const [compareTarget, setCompareTarget] = useState<string>('');
  const [quantFormat, setQuantFormat] = useState<'fp16' | 'int8' | 'int4'>('fp16');
  const [securityAlgo, setSecurityAlgo] = useState<'aes' | 'sm4'>('aes');
  const [decryptToken, setDecryptToken] = useState('');
  const [runtimeDecrypting, setRuntimeDecrypting] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [issuedToken, setIssuedToken] = useState('');
  const [rollingBack, setRollingBack] = useState(false);
  const model = useMemo(() => {
    const current = models.find(m => m.id === id);
    return current ?? models[0];
  }, [models, id]);

  const compareBaseVersion = model.versions.find(v => v.version === compareBase);
  const compareTargetVersion = model.versions.find(v => v.version === compareTarget);

  const rollbackVersion = async (targetVersion: ModelVersion) => {
    if (!model) return;
    setRollingBack(true);
    await new Promise(r => setTimeout(r, 700));
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const snapshotVersion = `rollback-${targetVersion.version}-${today.replace(/-/g, '')}`;
    const rollbackSnapshot: ModelVersion = {
      ...targetVersion,
      version: snapshotVersion,
      createdAt: today,
      notes: `从 ${targetVersion.version} 回滚创建，保留原始快照信息`,
    };

    const nextModels = models.map(item => {
      if (item.id !== model.id) return item;
      return {
        ...item,
        updatedAt: today,
        versions: [rollbackSnapshot, ...item.versions],
        precisionMetrics: {
          ...item.precisionMetrics,
          ...(targetVersion.metrics ?? {}),
        },
      };
    });
    setModels(nextModels);
    saveRuntimeModels(nextModels);
    setRollingBack(false);
    toast.success('版本回滚成功', `已基于 ${targetVersion.version} 创建回滚快照 ${snapshotVersion}`);
  };

  const issueAccessToken = async () => {
    await new Promise(r => setTimeout(r, 500));
    const token = `zytok-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString().slice(-4)}`;
    setIssuedToken(token);
    setDecryptToken(token);
    toast.success('授权 Token 已签发', 'Token 有效期 15 分钟，请用于运行态解密加载');
  };

  const runtimeDecryptLoad = async () => {
    if (!decryptToken.trim()) {
      toast.warning('缺少授权 Token', '请先申请或填写授权 Token');
      return;
    }
    setRuntimeDecrypting(true);
    await new Promise(r => setTimeout(r, 900));
    setRuntimeDecrypting(false);
    setRuntimeReady(true);
    toast.success('运行解密完成', '模型已在内存态完成解密映射，明文未落盘');
  };

  const secureDownload = async (version: string) => {
    if (model.encrypted && !decryptToken.trim()) {
      toast.warning('下载受限', '当前模型启用了加密保护，请先提供授权 Token');
      return;
    }
    await new Promise(r => setTimeout(r, 400));
    toast.success('安全下载已启动', `${version} 将以${securityAlgo === 'sm4' ? 'SM4' : 'AES-256'}密文分片传输`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/user/models" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 模型广场
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{model.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-secondary/15 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
          <BrainCircuit size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-text-primary">{model.name}</h1>
            <Badge variant="primary">{model.framework}</Badge>
          </div>
          <p className="text-sm text-text-muted mb-2">{model.description}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
            <span className="flex items-center gap-1"><Cpu size={11} />{model.parameters}</span>
            <span className="flex items-center gap-1"><Download size={11} />{model.downloads} 下载</span>
            <span className="flex items-center gap-1"><Star size={11} />{model.stars} 收藏</span>
            <span className="flex items-center gap-1"><Tag size={11} />{model.license}</span>
            <span className="flex items-center gap-1"><Tag size={11} />{model.creator}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to="/user/training">
            <Button variant="outline" leftIcon={<Code2 size={14} />}>微调模型</Button>
          </Link>
          <Link to="/user/inference">
            <Button leftIcon={<Cloud size={14} />}>部署推理</Button>
          </Link>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'overview', label: '概览' },
          { key: 'versions', label: '版本快照', count: model.versions.length },
          { key: 'security', label: '安全防护', icon: <ShieldCheck size={13} /> },
          { key: 'compare', label: '版本对比' },
          { key: 'quantize', label: '量化配置', icon: <Zap size={13} /> },
          { key: 'example', label: '使用示例' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4">模型详情</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '参数量', value: model.parameters },
                { label: '框架', value: model.framework },
                { label: '参数量级', value: model.parameters },
                { label: '架构', value: model.architecture },
                { label: '访问级别', value: model.accessLevel },
                { label: '许可证', value: model.license },
                { label: '上传者', value: model.creator },
                { label: '更新时间', value: model.updatedAt?.slice(0, 10) },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-text-muted mb-1">{item.label}</p>
                  <p className="text-sm text-text-secondary font-medium">{item.value ?? '—'}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-2">适用任务</p>
              <div className="flex flex-wrap gap-1.5">
                {model.supportedTasks.map(t => (
                  <span key={t} className="px-2 py-1 text-xs bg-white/5 border border-border rounded-lg text-text-muted">{t}</span>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-4">推荐部署配置</h3>
            <div className="space-y-3">
              {[
                { label: '推理框架', value: model.framework },
                { label: '最低显存', value: '40GB' },
                { label: '推荐 GPU', value: 'A100 / H100' },
                { label: '并发请求', value: '32 req/s' },
                { label: '推荐副本数', value: '2' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-text-muted">{s.label}</span>
                  <span className="text-xs font-medium text-text-secondary">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'versions' && (
        <div className="space-y-4">
          {model.versions.map(v => (
            <Card key={v.version}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center mt-0.5">
                    <History size={15} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{v.version}</p>
                    <p className="text-xs text-text-muted mt-0.5">{v.notes}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-2">
                      <span>{v.createdAt?.slice(0, 10) ?? '—'}</span>
                      <span>参数量：{v.parameters}</span>
                      <span>代码提交：{v.commitHash || '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" leftIcon={<Download size={12} />} onClick={() => secureDownload(v.version)}>下载</Button>
                  <Button size="sm" variant="outline" leftIcon={<RotateCcw size={12} />} onClick={() => rollbackVersion(v)} loading={rollingBack}>回滚</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg border border-border p-3 bg-white/5">
                  <p className="text-xs text-text-muted mb-2">训练数据血缘</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(v.lineageDataset ?? [v.trainDataset]).map(item => (
                      <span key={item} className="px-2 py-1 text-xs rounded-md bg-white/5 border border-border text-text-secondary">{item}</span>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">流水线：{v.lineagePipeline ?? '训练流水线'} / 分支：{v.lineageCodeBranch ?? 'main'}</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-white/5">
                  <p className="text-xs text-text-muted mb-2">超参数与性能指标</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(v.hyperparams).slice(0, 6).map(([k, val]) => (
                      <div key={k} className="flex items-center justify-between gap-2 bg-base/60 border border-border/60 rounded px-2 py-1.5">
                        <span className="text-text-muted truncate">{k}</span>
                        <span className="text-text-secondary font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    {Object.entries(v.metrics ?? {}).map(([k, val]) => (
                      <div key={k} className="flex items-center justify-between gap-2 bg-base/60 border border-border/60 rounded px-2 py-1.5">
                        <span className="text-text-muted truncate">{k}</span>
                        <span className="text-text-secondary font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">全链路安全防护</h3>
                <p className="text-xs text-text-muted mt-1">覆盖存储加密、传输加密、运行解密、明文不落盘四个环节。</p>
              </div>
              <Badge variant={model.encrypted ? 'success' : 'warning'}>{model.encrypted ? '已启用加密防护' : '建议启用加密防护'}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: '存储加密', desc: '模型文件以密文形式写入对象存储与缓存层', ok: true },
                { title: '传输加密', desc: 'TLS 1.3 + 密文分片上传下载', ok: true },
                { title: '运行解密', desc: '推理进程启动时在内存态解密映射', ok: runtimeReady },
                { title: '明文不落盘', desc: '解密明文仅存在于受控内存页', ok: runtimeReady },
              ].map(item => (
                <div key={item.title} className="rounded-lg border border-border p-3 bg-white/5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-primary font-medium">{item.title}</p>
                    {item.ok ? <CheckCircle2 size={14} className="text-success" /> : <Lock size={14} className="text-warning" />}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-4">授权 Token 与解密控制</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="加密算法"
                value={securityAlgo}
                onChange={e => setSecurityAlgo(e.target.value as 'aes' | 'sm4')}
                options={[
                  { value: 'aes', label: 'AES-256-GCM' },
                  { value: 'sm4', label: 'SM4-GCM' },
                ]}
              />
              <Input
                label="授权 Token"
                placeholder="输入或申请解密 Token"
                value={decryptToken}
                onChange={e => setDecryptToken(e.target.value)}
              />
            </div>

            {issuedToken && (
              <div className="mt-3 text-xs text-text-muted bg-white/5 border border-border rounded-lg px-3 py-2">
                最新签发 Token：{issuedToken}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" leftIcon={<KeyRound size={14} />} onClick={issueAccessToken}>签发授权 Token</Button>
              <Button leftIcon={<ShieldCheck size={14} />} loading={runtimeDecrypting} onClick={runtimeDecryptLoad}>
                {runtimeDecrypting ? '运行解密中...' : '执行运行态解密加载'}
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-2">运行态解密完成后，模型权重只在受控内存中使用，不会输出明文文件。</p>
          </Card>
        </div>
      )}

      {tab === 'compare' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <SplitSquareVertical size={15} className="text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">版本差异对比</h3>
            </div>
            {model.versions.length >= 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label="基准版本"
                    value={compareBase}
                    onChange={e => setCompareBase(e.target.value)}
                    options={[
                      { value: '', label: '请选择基准版本' },
                      ...model.versions.map(v => ({ value: v.version, label: v.version })),
                    ]}
                  />
                  <Select
                    label="目标版本"
                    value={compareTarget}
                    onChange={e => setCompareTarget(e.target.value)}
                    options={[
                      { value: '', label: '请选择目标版本' },
                      ...model.versions.map(v => ({ value: v.version, label: v.version })),
                    ]}
                  />
                </div>

                {compareBaseVersion && compareTargetVersion ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-medium text-text-muted w-40">字段</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-text-muted">基准 ({compareBaseVersion.version})</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-text-muted">目标 ({compareTargetVersion.version})</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-text-muted">差异</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {[
                          { key: 'parameters', label: '参数量', base: compareBaseVersion.parameters, target: compareTargetVersion.parameters },
                          { key: 'commitHash', label: '代码提交', base: compareBaseVersion.commitHash, target: compareTargetVersion.commitHash },
                          { key: 'trainDataset', label: '训练主数据集', base: compareBaseVersion.trainDataset, target: compareTargetVersion.trainDataset },
                          { key: 'accuracy', label: 'Accuracy', base: compareBaseVersion.metrics?.accuracy ?? compareBaseVersion.accuracy, target: compareTargetVersion.metrics?.accuracy ?? compareTargetVersion.accuracy },
                          { key: 'f1', label: 'F1', base: compareBaseVersion.metrics?.f1 ?? compareBaseVersion.f1, target: compareTargetVersion.metrics?.f1 ?? compareTargetVersion.f1 },
                          { key: 'bleu', label: 'BLEU', base: compareBaseVersion.metrics?.bleu ?? compareBaseVersion.bleu, target: compareTargetVersion.metrics?.bleu ?? compareTargetVersion.bleu },
                          { key: 'loss', label: 'Loss', base: compareBaseVersion.metrics?.loss ?? compareBaseVersion.loss, target: compareTargetVersion.metrics?.loss ?? compareTargetVersion.loss },
                        ].map(row => {
                          const isNumber = typeof row.base === 'number' && typeof row.target === 'number';
                          const diff = isNumber ? Number(row.target) - Number(row.base) : null;
                          return (
                            <tr key={row.key} className="hover:bg-white/2">
                              <td className="py-3 px-3 text-xs text-text-muted">{row.label}</td>
                              <td className="py-3 px-3 text-xs text-center text-text-secondary">{row.base ?? '—'}</td>
                              <td className="py-3 px-3 text-xs text-center text-text-secondary">{row.target ?? '—'}</td>
                              <td className={`py-3 px-3 text-xs text-center ${diff === null ? 'text-text-muted' : diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-text-muted'}`}>
                                {diff === null ? (row.base === row.target ? '无变化' : '有变化') : `${diff > 0 ? '+' : ''}${diff.toFixed(3)}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-6">请选择两个版本进行差异对比</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">该模型只有一个版本，无法进行对比</p>
            )}
          </Card>
        </div>
      )}

      {tab === 'quantize' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { fmt: 'fp16' as const, label: 'FP16 (半精度)', desc: '原始精度，性能最佳', size: '原始大小', reduction: '0%', gpu: '原始需求', color: 'text-primary' },
              { fmt: 'int8' as const, label: 'INT8 (8位量化)', desc: '精度轻微损失，显存减半', size: '~50%', reduction: '-50%', gpu: '约减半', color: 'text-success' },
              { fmt: 'int4' as const, label: 'INT4 (4位量化)', desc: '适合资源受限环境', size: '~25%', reduction: '-75%', gpu: '降低75%', color: 'text-warning' },
            ] as const).map(opt => (
              <div
                key={opt.fmt}
                onClick={() => setQuantFormat(opt.fmt)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${quantFormat === opt.fmt ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${opt.color}`}>{opt.label}</span>
                  {quantFormat === opt.fmt && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">已选</span>}
                </div>
                <p className="text-xs text-text-muted mb-3">{opt.desc}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-text-muted">模型大小</span><span className="text-text-secondary">{opt.size}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">存储节省</span><span className={opt.color}>{opt.reduction}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">GPU 显存</span><span className="text-text-secondary">{opt.gpu}</span></div>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">量化参数配置 — {quantFormat.toUpperCase()}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {quantFormat === 'fp16' && (
                <>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">数据类型</p>
                    <p className="text-text-primary font-medium">torch.float16</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">推理后端</p>
                    <p className="text-text-primary font-medium">vLLM / TensorRT-LLM</p>
                  </div>
                </>
              )}
              {quantFormat === 'int8' && (
                <>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">量化方式</p>
                    <p className="text-text-primary font-medium">LLM.int8() / SmoothQuant</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">校准数据集</p>
                    <p className="text-text-primary font-medium">WikiText-2 (512 样本)</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">激活量化阈值</p>
                    <p className="text-text-primary font-medium">6.0</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">精度损失 (MMLU)</p>
                    <p className="text-warning font-medium">≤ 0.5%</p>
                  </div>
                </>
              )}
              {quantFormat === 'int4' && (
                <>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">量化方式</p>
                    <p className="text-text-primary font-medium">GPTQ / AWQ</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">分组大小</p>
                    <p className="text-text-primary font-medium">128</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">校准样本数</p>
                    <p className="text-text-primary font-medium">128 条</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-muted mb-1">精度损失 (MMLU)</p>
                    <p className="text-error font-medium">≤ 2.0%</p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex gap-3">
              <Button leftIcon={<Zap size={14} />} onClick={() => toast.info('量化任务已提交', `${model.name} 量化任务提交成功`)}>开始量化任务</Button>
              <Button variant="outline" onClick={() => toast.info('打开文档', '量化配置和最佳实践文档已打开')}>查看量化文档</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'example' && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Python SDK 调用示例</h3>
          <pre className="bg-base border border-border rounded-lg p-4 text-xs text-green-400 font-mono overflow-x-auto">
{`from zhiyun import ZhiYunClient

client = ZhiYunClient(api_key="zy-sk-xxxxxxxxxxxx")

response = client.chat.completions.create(
    model="${model.name}",
    messages=[
        {"role": "system", "content": "你是智云AI助手"},
        {"role": "user", "content": "请介绍一下绵阳的科技产业发展"}
    ],
    temperature=0.7,
    max_tokens=2048
)

print(response.choices[0].message.content)`}
          </pre>
        </Card>
      )}
    </div>
  );
}
