import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';

export default function CreateBucket() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bucketCreated, setBucketCreated] = useState('');
  const [form, setForm] = useState({
    bucketName: '',
    region: '华西-成都',
    accessPolicy: 'private',
    capacityGB: '1024',
    versioning: false,
    namespace: 'default',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await new Promise(r => setTimeout(r, 700));
    setCreating(false);
    setBucketCreated(form.bucketName);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">Bucket 创建成功</h2>
      <p className="text-text-muted text-sm">存储桶 <span className="text-text-secondary font-medium">{bucketCreated}</span> 已在 <span className="text-text-secondary font-medium">{form.region}</span> 就绪</p>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/admin/storage')}>
          返回存储管理
        </Button>
        <Button onClick={() => { setSubmitted(false); setForm({ bucketName: '', region: '华西-成都', accessPolicy: 'private', capacityGB: '1024', versioning: false, namespace: 'default' }); }}>
          再创建一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/admin/storage" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 存储管理
        </Link>
        <span>/</span>
        <span className="text-text-secondary">创建 Bucket</span>
      </div>
      <PageHeader
        title="创建 S3 Bucket"
        subtitle="在平台 MinIO 集群中创建新的对象存储桶"
        icon={<HardDrive size={20} />}
      />

      <form onSubmit={handleCreate} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">基本配置</h3>
          <div className="space-y-4">
            <Input
              label="Bucket 名称 *"
              value={form.bucketName}
              onChange={e => setForm(f => ({ ...f, bucketName: e.target.value }))}
              placeholder="如：zhiyun-training-data"
              hint="只能包含小写字母、数字和短横线，3-63 个字符"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="区域"
                value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                options={[
                  { value: '华西-成都', label: '华西-成都（可用区 1）' },
                  { value: '华东-杭州', label: '华东-杭州（可用区 2）' },
                  { value: '华北-北京', label: '华北-北京（可用区 3）' },
                ]}
              />
              <Input
                label="容量限额 (GB)"
                type="number"
                min="1"
                value={form.capacityGB}
                onChange={e => setForm(f => ({ ...f, capacityGB: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="访问策略"
                value={form.accessPolicy}
                onChange={e => setForm(f => ({ ...f, accessPolicy: e.target.value }))}
                options={[
                  { value: 'private', label: '私有（仅 API 访问）' },
                  { value: 'public-read', label: '公开读（匿名可下载）' },
                  { value: 'public-read-write', label: '公开读写（不推荐）' },
                ]}
              />
              <Input
                label="命名空间"
                value={form.namespace}
                onChange={e => setForm(f => ({ ...f, namespace: e.target.value }))}
                hint="Kubernetes namespace"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="versioning"
              checked={form.versioning}
              onChange={e => setForm(f => ({ ...f, versioning: e.target.checked }))}
              className="mt-0.5 w-4 h-4 accent-primary"
            />
            <label htmlFor="versioning" className="flex-1 cursor-pointer">
              <span className="text-sm text-text-secondary">启用版本控制</span>
              <span className="block text-xs text-text-muted mt-1">保留对象的所有历史版本，支持回滚与版本比对，适合重要数据集</span>
            </label>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={creating}>{creating ? '创建中...' : '创建 Bucket'}</Button>
          <Link to="/admin/storage">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
