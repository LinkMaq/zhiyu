import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Download, Trash2, Upload, Plus, Search, Cpu, HardDrive, RefreshCw, Tag } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { mockImages } from '../../../data/mockData';

const ARCH_COLORS: Record<string, string> = {
  amd64: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  arm64: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  multi: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
};

const ARCH_MAP: Record<string, string[]> = {
  multi: ['amd64', 'arm64'],
  amd64: ['amd64'],
  arm64: ['arm64'],
};

function ArchBadges({ arch }: { arch: string }) {
  const archs = ARCH_MAP[arch] ?? [arch];
  return (
    <div className="flex gap-1 flex-wrap">
      {archs.map(a => (
        <span key={a} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${ARCH_COLORS[a] ?? 'bg-white/10 text-text-muted'}`}>{a}</span>
      ))}
    </div>
  );
}

export default function ImageRegistry() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterArch, setFilterArch] = useState('all');
  const filtered = mockImages.filter(img =>
    (filterArch === 'all' || img.arch === filterArch || (filterArch === 'multi' && img.arch === 'multi')) &&
    (img.name.toLowerCase().includes(search.toLowerCase()) || img.tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="容器镜像仓库"
        subtitle="平台基础镜像管理，支持多架构镜像（amd64 / arm64）及自定义镜像注册"
        icon={<Layers size={20} />}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" leftIcon={<Upload size={14} />} onClick={() => toast.info('镜像推送', 'docker push registry.zhiyun.ai/<name>:<tag>')}>推送命令</Button>
            <Link to="/admin/images/register"><Button size="sm" leftIcon={<Plus size={14} />}>注册外部镜像</Button></Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '镜像总数', value: mockImages.length, icon: <Layers size={14} />, color: 'text-accent' },
          { label: '多架构镜像', value: mockImages.filter(i => i.arch === 'multi').length, icon: <Cpu size={14} />, color: 'text-warning' },
          { label: '总存储空间', value: '66.4 GB', icon: <HardDrive size={14} />, color: 'text-success' },
          { label: '总拉取次数', value: mockImages.reduce((s, i) => s + i.pullCount, 0).toLocaleString(), icon: <Download size={14} />, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className={`flex items-center gap-2 mb-1 ${s.color}`}>{s.icon}<span className="text-xs text-text-muted">{s.label}</span></div>
            <p className="text-xl font-bold text-text-primary">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索镜像名称/标签…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
        </div>
        <Select value={filterArch} onChange={e => setFilterArch(e.target.value)} options={[
          { value: 'all', label: '全部架构' },
          { value: 'amd64', label: 'amd64' },
          { value: 'arm64', label: 'arm64' },
          { value: 'multi', label: '多架构 (multi)' },
        ]} />
        <Button size="sm" variant="ghost" leftIcon={<RefreshCw size={13} />} onClick={() => toast.info('刷新', '镜像列表已刷新')}>刷新</Button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['镜像名称', '标签', '架构支持', 'AI框架', '大小/层数', '拉取次数', '状态', '推送时间', '操作'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(img => (
                <tr key={img.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Layers size={13} className="text-accent flex-shrink-0" />
                      <div>
                        <p className="text-sm text-text-primary font-medium">{img.name}</p>
                        <p className="text-[11px] text-text-muted">{img.isPublic ? '公开' : '私有'} · {img.os}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Tag size={11} className="text-text-muted" />
                      <span className="text-xs font-mono text-text-secondary">{img.tag}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><ArchBadges arch={img.arch} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {img.aiFrameworks.slice(0, 3).map(f => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted border border-border">{f}</span>
                      ))}
                      {img.aiFrameworks.length > 3 && <span className="text-[10px] text-text-muted">+{img.aiFrameworks.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{img.size} / {img.layers}层</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{img.pullCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={img.status === 'active' ? 'success' : img.status === 'building' ? 'warning' : 'ghost'}>
                      {img.status === 'active' ? '可用' : img.status === 'building' ? '构建中' : img.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{new Date(img.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" leftIcon={<Download size={12} />}
                        onClick={() => toast.success('拉取命令', `docker pull registry.zhiyun.ai/${img.name}:${img.tag}`)}>拉取</Button>
                      <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} className="text-error hover:bg-error/10"
                        onClick={() => img.isPublic ? toast.error('操作拒绝', '不可删除平台公共镜像') : toast.success('已删除', `${img.name}:${img.tag} 已删除`)}>
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-text-muted">暂无匹配镜像</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
