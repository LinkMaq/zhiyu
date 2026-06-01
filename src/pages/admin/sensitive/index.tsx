import { useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, Upload, Plus, Trash2, FileSearch, ShieldCheck, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Input, Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';

type StrategyMode = 'block' | 'delegate' | 'replace';
type CategoryKey = 'all' | `domain:${string}` | `channel:${string}:${string}`;

interface CategoryNode {
  domain: string;
  total: number;
  channels: Array<{ name: string; count: number }>;
}

interface SensitiveWordItem {
  id: string;
  content: string;
  domain: string;
  channel: string;
}

const API_ENDPOINTS = [
  { value: '/v1/chat/completions', label: '/v1/chat/completions' },
  { value: '/v1/embeddings', label: '/v1/embeddings' },
  { value: '/v1/rerank', label: '/v1/rerank' },
];

function buildMockSensitiveWords(total: number): SensitiveWordItem[] {
  const seed: Array<Omit<SensitiveWordItem, 'id'>> = [
    { domain: '涉密', channel: '文本', content: '绝密文件' },
    { domain: '涉密', channel: '文本', content: '内部通报' },
    { domain: '涉密', channel: '图像', content: '军事基地坐标' },
    { domain: '诈骗', channel: '对话', content: '银行卡验证码' },
    { domain: '诈骗', channel: '文本', content: '冒充客服退款' },
    { domain: '违禁', channel: '文本', content: '枪支配件交易' },
    { domain: '违禁', channel: '检索', content: '危险化学品配方' },
    { domain: '涉黄', channel: '对话', content: '成人视频资源' },
    { domain: '暴恐', channel: '文本', content: '爆炸物制造' },
    { domain: '仇恨', channel: '对话', content: '群体歧视言论' },
    { domain: '政治', channel: '文本', content: '煽动颠覆国家政权' },
    { domain: '引流', channel: '摘要', content: '境外赌博平台跳转' },
    { domain: '攻击', channel: '语音', content: '人身威胁恐吓' },
    { domain: '暴力', channel: '图像', content: '血腥暴力内容' },
    { domain: '未成年人', channel: '对话', content: '未成年不当内容' },
  ];
  const domainTerms: Record<string, string[]> = {
    政治: ['颠覆国家政权', '分裂国家言论', '政治谣言扩散', '非法集会组织', '煽动对抗政府'],
    涉密: ['军工项目代号', '涉密人员名单', '战略部署图', '内部保密协议', '未公开会议纪要'],
    暴恐: ['爆炸物制作', '极端组织宣言', '恐袭目标踩点', '暴恐训练营', '袭击行动预案'],
    诈骗: ['冒充公检法', '刷单返利骗局', '贷款解冻骗局', '虚假中奖通知', '钓鱼链接收款'],
    涉黄: ['色情直播链接', '成人视频下载', '裸聊诱导付费', '未成年人不当色情', '低俗擦边内容'],
    违禁: ['枪支弹药交易', '管制刀具买卖', '毒品交易暗语', '危险化学品交易', '假证件制作'],
    仇恨: ['地域歧视辱骂', '民族仇恨煽动', '性别仇恨表达', '宗教歧视言论', '群体侮辱攻击'],
    暴力: ['血腥砍杀描述', '虐待动物教程', '校园霸凌威胁', '家暴威胁恐吓', '肢体伤害细节'],
    引流: ['私彩平台引流', '灰产社群拉新', '违规APP跳转', '色情站外导流', '诈骗社群邀约'],
    攻击: ['人肉搜索信息', '网络攻击脚本', '撞库爆破教程', '勒索威胁文本', '恶意木马投递'],
    未成年人: ['诱导未成年转账', '未成年私密图传播', '未成年线下见面诱导', '未成年不良游戏交易', '未成年暴力挑战'],
  };
  const channels = ['文本', '语音', '图像', '对话', '检索', '摘要'];
  const qualifiers = ['教程', '资源', '渠道', '联系方式', '推广文案', '操作步骤', '绕过审核', '内部群', '打包下载', '实战案例'];

  const generated: Array<Omit<SensitiveWordItem, 'id'>> = [];
  const domains = Object.keys(domainTerms);
  for (let i = 0; generated.length < total; i++) {
    const domain = domains[i % domains.length];
    const channel = channels[(i * 3 + 1) % channels.length];
    const term = domainTerms[domain][(i * 5 + 2) % domainTerms[domain].length];
    const qualifier = qualifiers[(i * 7 + 3) % qualifiers.length];
    generated.push({ domain, channel, content: `${term}${qualifier}` });

    if (generated.length < total) {
      const altQualifier = qualifiers[(i * 11 + 4) % qualifiers.length];
      generated.push({ domain, channel, content: `${term}${altQualifier}` });
    }
  }

  const uniq = new Map<string, Omit<SensitiveWordItem, 'id'>>();
  [...seed, ...generated].forEach(item => {
    const key = `${item.domain}|${item.channel}|${item.content}`;
    if (!uniq.has(key)) uniq.set(key, item);
  });

  return Array.from(uniq.values()).map((item, idx) => ({
    ...item,
    id: `sw-${String(idx + 1).padStart(4, '0')}`,
  }));
}

const INITIAL_MOCK_WORDS = buildMockSensitiveWords(360);

export default function SensitiveWordsManagement() {
  const [tab, setTab] = useState('words');
  const [words, setWords] = useState<SensitiveWordItem[]>(INITIAL_MOCK_WORDS);
  const [newWord, setNewWord] = useState('');
  const [uploadText, setUploadText] = useState('');

  const [apiPath, setApiPath] = useState('/v1/chat/completions');
  const [requestPayload, setRequestPayload] = useState('请帮我生成一个测试回复，包含政治敏感词A与正常描述。');
  const [hitWords, setHitWords] = useState<SensitiveWordItem[]>([]);
  const [checkedAt, setCheckedAt] = useState('');

  const [showMatchedWords, setShowMatchedWords] = useState(true);
  const [strategyMode, setStrategyMode] = useState<StrategyMode>('block');
  const [delegateService, setDelegateService] = useState('内容安全平台-A');
  const [delegateWebhook, setDelegateWebhook] = useState('https://security.example.com/moderation');
  const [replaceToken, setReplaceToken] = useState('[已替换]');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const wordsCount = words.length;
  const sortedWords = useMemo(() => [...words].sort((a, b) => a.content.localeCompare(b.content, 'zh-CN')), [words]);
  const categories = useMemo<CategoryNode[]>(() => {
    const domainMap = new Map<string, Map<string, number>>();

    sortedWords.forEach(word => {
      const { domain, channel } = word;
      const channelMap = domainMap.get(domain) ?? new Map<string, number>();
      channelMap.set(channel, (channelMap.get(channel) ?? 0) + 1);
      domainMap.set(domain, channelMap);
    });

    return Array.from(domainMap.entries())
      .map(([domain, channelMap]) => {
        const channels = Array.from(channelMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        return {
          domain,
          channels,
          total: channels.reduce((sum, item) => sum + item.count, 0),
        };
      })
      .sort((a, b) => a.domain.localeCompare(b.domain, 'zh-CN'));
  }, [sortedWords]);

  const filteredWords = useMemo(() => {
    if (selectedCategory === 'all') return sortedWords;

    if (selectedCategory.startsWith('domain:')) {
      const domain = selectedCategory.replace('domain:', '');
      return sortedWords.filter(word => word.domain === domain);
    }

    const [, domain, channel] = selectedCategory.split(':');
    return sortedWords.filter(word => word.domain === domain && word.channel === channel);
  }, [selectedCategory, sortedWords]);

  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return '全部词条';
    if (selectedCategory.startsWith('domain:')) {
      return selectedCategory.replace('domain:', '');
    }
    const [, domain, channel] = selectedCategory.split(':');
    return `${domain} / ${channel}`;
  }, [selectedCategory]);

  const toggleDomainExpand = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const addWord = () => {
    const value = newWord.trim();
    if (!value) return;
    if (words.some(item => item.content === value)) {
      toast.warning('重复词条', `敏感词 "${value}" 已存在`);
      return;
    }
    setWords(prev => [...prev, { id: `custom-${Date.now()}`, content: value, domain: '未分类', channel: '文本' }]);
    setNewWord('');
    toast.success('添加成功', `已添加敏感词：${value}`);
  };

  const removeWord = (word: SensitiveWordItem) => {
    setWords(prev => prev.filter(item => item.id !== word.id));
    toast.info('已删除词条', word.content);
  };

  const uploadWords = () => {
    const parsed = uploadText
      .split(/\n|,|，|;|；/)
      .map(item => item.trim())
      .filter(Boolean);

    if (parsed.length === 0) {
      toast.warning('上传内容为空', '请粘贴敏感词后再上传');
      return;
    }

    const exists = new Set(words.map(item => item.content));
    const toAdd = parsed
      .filter(content => !exists.has(content))
      .map((content, idx) => ({
        id: `upload-${Date.now()}-${idx}`,
        content,
        domain: '未分类',
        channel: '文本',
      }));
    const added = toAdd.length;
    setWords(prev => [...prev, ...toAdd]);
    setUploadText('');
    toast.success('上传完成', `新增 ${added} 个词条，词库总数 ${words.length + added}`);
  };

  const uploadFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      const parsed = content
        .split(/\n|,|，|;|；/)
        .map(item => item.trim())
        .filter(Boolean);
      const exists = new Set(words.map(item => item.content));
      const toAdd = parsed
        .filter(content => !exists.has(content))
        .map((content, idx) => ({
          id: `file-${Date.now()}-${idx}`,
          content,
          domain: '未分类',
          channel: '文本',
        }));
      const added = toAdd.length;
      setWords(prev => [...prev, ...toAdd]);
      toast.success('文件上传完成', `${file.name} 已导入，新增 ${added} 个词条`);
    };
    reader.readAsText(file, 'utf-8');
  };

  const checkHit = () => {
    const payload = requestPayload.toLowerCase();
    const hits = words.filter(word => payload.includes(word.content.toLowerCase()));
    setHitWords(hits);
    setCheckedAt(new Date().toLocaleString('zh-CN'));

    if (hits.length > 0) {
      toast.error('检测命中', `命中 ${hits.length} 个敏感词`);
      return;
    }
    toast.success('检测通过', '未命中敏感词');
  };

  const saveStrategy = () => {
    const action = strategyMode === 'block'
      ? '阻断请求'
      : strategyMode === 'delegate'
        ? '委托第三方服务'
        : `替换敏感词(${replaceToken || '***'})`;
    toast.success(
      '策略已保存',
      `命中处理：${action}${showMatchedWords ? '，返回命中词' : '，不返回命中词'}`,
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="敏感词管理" subtitle="管理、上传敏感词，检查API请求命中并配置命中策略" icon={<ShieldAlert size={20} />} />

      <Tabs
        tabs={[
          { key: 'words', label: '词库管理/上传', icon: <Upload size={14} />, count: wordsCount },
          { key: 'check', label: 'API命中检查', icon: <FileSearch size={14} /> },
          { key: 'strategy', label: '命中策略', icon: <ShieldCheck size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'words' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-text-primary">当前词库</p>
              <Badge variant="secondary">{sortedWords.length} 词条</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-3">
              <div className="border border-border rounded-lg p-2 max-h-[520px] overflow-y-auto">
                <button
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs transition-colors ${selectedCategory === 'all' ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-white/5'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <span className="flex items-center gap-1.5"><Folder size={12} />全部词库</span>
                  <span>{sortedWords.length}</span>
                </button>

                <div className="mt-1 space-y-1">
                  {categories.map(category => {
                    const isExpanded = expandedDomains[category.domain] ?? false;
                    const isDomainSelected = selectedCategory === `domain:${category.domain}`;

                    return (
                      <div key={category.domain}>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1 rounded text-text-muted hover:bg-white/5"
                            onClick={() => toggleDomainExpand(category.domain)}
                            title={isExpanded ? '收起分类' : '展开分类'}
                          >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                          <button
                            className={`flex-1 text-left px-2 py-1.5 rounded flex items-center justify-between text-xs transition-colors ${isDomainSelected ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-white/5'}`}
                            onClick={() => setSelectedCategory(`domain:${category.domain}`)}
                          >
                            <span className="flex items-center gap-1.5">{isExpanded ? <FolderOpen size={12} /> : <Folder size={12} />}{category.domain}</span>
                            <span>{category.total}</span>
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1 border-l border-border/60 pl-2">
                            {category.channels.map(channel => {
                              const key = `channel:${category.domain}:${channel.name}` as CategoryKey;
                              const active = selectedCategory === key;
                              return (
                                <button
                                  key={channel.name}
                                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-text-muted hover:bg-white/5 hover:text-text-secondary'}`}
                                  onClick={() => setSelectedCategory(key)}
                                >
                                  <span>{channel.name}</span>
                                  <span>{channel.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border border-border rounded-lg p-2 max-h-[520px] overflow-y-auto">
                <div className="px-2 pb-2 mb-2 border-b border-border/60 text-xs text-text-muted">
                  当前目录：<span className="text-text-secondary">{selectedCategoryLabel}</span> · {filteredWords.length} 条
                </div>
                <div className="space-y-2 pr-1">
                  {filteredWords.map(word => (
                    <div key={word.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                      <span className="text-sm text-text-primary truncate">{word.content}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="ghost">{word.domain}</Badge>
                        <Badge variant="secondary">{word.channel}</Badge>
                      <button
                        onClick={() => removeWord(word)}
                        className="p-1.5 rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-1">
            <p className="text-sm font-semibold text-text-primary mb-3">词库维护</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="新增词条"
                  placeholder="输入敏感词后点击添加"
                  value={newWord}
                  onChange={e => setNewWord(e.target.value)}
                />
              </div>
              <Button size="sm" leftIcon={<Plus size={12} />} onClick={addWord}>添加</Button>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-text-primary mb-2">上传敏感词</p>
              <p className="text-xs text-text-muted mb-2">支持按换行、逗号、分号分隔词条</p>
              <textarea
                value={uploadText}
                onChange={e => setUploadText(e.target.value)}
                placeholder="例如：\n违规词1\n违规词2,违规词3"
                className="w-full min-h-[120px] bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60"
              />
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={uploadWords}>批量上传</Button>
                <label className="inline-flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    className="hidden"
                    onChange={e => uploadFile(e.target.files?.[0])}
                  />
                  <span className="px-3 py-1.5 border border-border rounded-lg hover:border-primary/40 transition-colors">上传文件</span>
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'check' && (
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Select
              label="API 接口"
              value={apiPath}
              onChange={e => setApiPath(e.target.value)}
              options={API_ENDPOINTS}
            />
            <div className="flex items-end">
              <Button leftIcon={<FileSearch size={13} />} onClick={checkHit}>检查是否命中</Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">请求内容 / Payload</p>
            <textarea
              value={requestPayload}
              onChange={e => setRequestPayload(e.target.value)}
              className="w-full min-h-[140px] bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60"
              placeholder="粘贴请求内容进行敏感词检查"
            />
          </div>

          <div className="mt-4">
            {hitWords.length > 0 ? (
              <div className="rounded-xl border border-error bg-error/10 p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2 text-error">
                  <AlertTriangle size={16} />
                  <p className="font-semibold">检测到敏感词命中，建议立即阻断请求</p>
                </div>
                <p className="text-xs text-text-secondary mb-2">接口：{apiPath} · 检测时间：{checkedAt || '刚刚'}</p>
                <div className="flex flex-wrap gap-2">
                  {hitWords.map(word => (
                    <Badge key={word.id} variant="error">{word.content}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-success/40 bg-success/10 p-4">
                <p className="text-sm font-medium text-success">未命中敏感词</p>
                <p className="text-xs text-text-muted mt-1">最近检测时间：{checkedAt || '尚未检测'}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'strategy' && (
        <Card>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-text-primary">命中策略配置</p>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={showMatchedWords}
                onChange={e => setShowMatchedWords(e.target.checked)}
                className="accent-primary"
              />
              命中后提供敏感词清单（返回命中词）
            </label>

            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-sm font-medium text-text-primary">处理动作</p>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="radio"
                  name="hit-strategy"
                  checked={strategyMode === 'block'}
                  onChange={() => setStrategyMode('block')}
                  className="accent-primary"
                />
                阻断请求
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="radio"
                  name="hit-strategy"
                  checked={strategyMode === 'delegate'}
                  onChange={() => setStrategyMode('delegate')}
                  className="accent-primary"
                />
                委托第三方服务处理
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="radio"
                  name="hit-strategy"
                  checked={strategyMode === 'replace'}
                  onChange={() => setStrategyMode('replace')}
                  className="accent-primary"
                />
                替换敏感词
              </label>
            </div>

            {strategyMode === 'delegate' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Input
                  label="第三方服务名称"
                  value={delegateService}
                  onChange={e => setDelegateService(e.target.value)}
                />
                <Input
                  label="回调地址 / Webhook"
                  value={delegateWebhook}
                  onChange={e => setDelegateWebhook(e.target.value)}
                />
              </div>
            )}

            {strategyMode === 'replace' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Input
                  label="替换文本"
                  value={replaceToken}
                  onChange={e => setReplaceToken(e.target.value)}
                  placeholder="例如：[已替换] 或 ***"
                />
                <div className="rounded-lg border border-border px-3 py-2 bg-base/70">
                  <p className="text-xs text-text-muted mb-1">替换预览</p>
                  <p className="text-sm text-text-secondary">原文：这是一个敏感词内容</p>
                  <p className="text-sm text-primary mt-1">结果：这是一个{replaceToken || '***'}内容</p>
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-end">
              <Button onClick={saveStrategy}>保存策略</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
