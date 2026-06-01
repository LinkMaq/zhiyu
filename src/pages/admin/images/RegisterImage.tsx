import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Container, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function RegisterImage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageName, setImageName] = useState('');
  const [form, setForm] = useState({
    name: '',
    tag: 'latest',
    registryUrl: '',
    username: '',
    password: '',
    desc: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setImageName(`${form.name}:${form.tag}`);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">镜像注册已提交</h2>
      <p className="text-text-muted text-sm">镜像 <span className="text-text-secondary font-medium">{imageName}</span> 正在被平台同步拉取并安全扫描</p>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/admin/images')}>
          返回镜像仓库
        </Button>
        <Button onClick={() => { setSubmitted(false); setForm({ name: '', tag: 'latest', registryUrl: '', username: '', password: '', desc: '' }); }}>
          再注册一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/admin/images" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 容器镜像仓库
        </Link>
        <span>/</span>
        <span className="text-text-secondary">注册外部镜像</span>
      </div>
      <PageHeader
        title="注册外部镜像"
        subtitle="将外部 Docker 镜像拉取并缓存至平台内部镜像仓库"
        icon={<Container size={20} />}
      />

      <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3">
        <AlertTriangle size={15} className="text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          注册外部镜像后，平台将同步拉取并缓存至内部镜像仓库，确保网络安全与镜像可信度。拉取过程中将进行 CVE 安全扫描，高危漏洞镜像将被隔离待审。
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">镜像信息</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="镜像名称 *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="如：pytorch/pytorch"
                required
              />
              <Input
                label="标签 (Tag) *"
                value={form.tag}
                onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                placeholder="如：2.3.0-cuda12.1-cudnn8-runtime"
                required
              />
            </div>
            <Input
              label="Registry 地址 *"
              value={form.registryUrl}
              onChange={e => setForm(f => ({ ...f, registryUrl: e.target.value }))}
              placeholder="如：registry.hub.docker.com 或 ghcr.io/org/image"
              required
            />
            <Input
              label="描述（可选）"
              value={form.desc}
              onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
              placeholder="简要描述镜像的用途和版本信息"
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-1">Registry 认证（可选）</h3>
          <p className="text-xs text-text-muted mb-4">如目标 Registry 需要鉴权，请提供凭据。凭据仅用于本次拉取，不会持久化存储。</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="用户名"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Registry 用户名"
              autoComplete="off"
            />
            <Input
              label="密码 / Token"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Registry 密码或访问令牌"
              autoComplete="new-password"
            />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>{loading ? '提交中...' : '注册镜像'}</Button>
          <Link to="/admin/images">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
