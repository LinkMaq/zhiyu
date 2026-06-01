import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';

export default function CreateTenant() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    contactName: '',
    contactEmail: '',
    industry: '电信运营',
    gpuQuota: '64',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setTenantName(form.name);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">租户注册成功</h2>
      <p className="text-text-muted text-sm">租户 <span className="text-text-secondary font-medium">{tenantName}</span> 已成功注册并激活</p>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/admin/business')}>
          返回业务管理
        </Button>
        <Button onClick={() => { setSubmitted(false); setForm({ name: '', shortName: '', contactName: '', contactEmail: '', industry: '电信运营', gpuQuota: '64' }); }}>
          再注册一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/admin/business" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 业务管理
        </Link>
        <span>/</span>
        <span className="text-text-secondary">注册租户</span>
      </div>
      <PageHeader
        title="注册新租户"
        subtitle="将新的企业/组织注册为平台租户并分配 GPU 配额"
        icon={<Building2 size={20} />}
      />

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">租户信息</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="租户名称 *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="如：中国电信AI研究院"
                required
              />
              <Input
                label="简称 *"
                value={form.shortName}
                onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                placeholder="如：CTAI"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="联系人姓名 *"
                value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                placeholder="负责人姓名"
                required
              />
              <Input
                label="联系人邮箱 *"
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                placeholder="contact@org.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="行业"
                value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                options={[
                  { value: '电信运营', label: '电信运营' },
                  { value: '政务数据', label: '政务数据' },
                  { value: '云计算服务', label: '云计算服务' },
                  { value: '金融科技', label: '金融科技' },
                  { value: '医疗健康', label: '医疗健康' },
                  { value: '其他', label: '其他' },
                ]}
              />
              <Input
                label="GPU 配额 (卡)"
                type="number"
                min="1"
                value={form.gpuQuota}
                onChange={e => setForm(f => ({ ...f, gpuQuota: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{saving ? '注册中...' : '注册租户'}</Button>
          <Link to="/admin/business">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
