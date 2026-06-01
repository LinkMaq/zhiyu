import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';

const ORGS = [
  '中国电信AI研究院',
  '中国移动大数据中心',
  '中国联通云计算分公司',
  '四川省大数据局',
  '绵阳科技局AI办公室',
];

export default function CreateUser() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userName, setUserName] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    organization: ORGS[0],
    gpu: '8',
    cpu: '32',
    memory: '128',
    storage: '1024',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setUserName(form.name);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-success" />
      </div>
      <h2 className="text-xl font-bold text-text-primary">用户创建成功</h2>
      <p className="text-text-muted text-sm">用户 <span className="text-text-secondary font-medium">{userName}</span> 已创建，激活邮件已发送</p>
      <div className="flex gap-3">
        <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/admin/users')}>
          返回用户管理
        </Button>
        <Button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', role: 'user', department: '', organization: ORGS[0], gpu: '8', cpu: '32', memory: '128', storage: '1024' }); }}>
          再创建一个
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/admin/users" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> 用户管理
        </Link>
        <span>/</span>
        <span className="text-text-secondary">创建用户</span>
      </div>
      <PageHeader
        title="创建用户"
        subtitle="为用户分配平台访问权限与 GPU 资源配额"
        icon={<UserPlus size={20} />}
      />

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">基本信息</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="姓名 *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="真实姓名"
                required
              />
              <Input
                label="邮箱 *"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@org.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="所属组织"
                value={form.organization}
                onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                options={ORGS.map(o => ({ value: o, label: o }))}
              />
              <Input
                label="部门"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="如：算法研究部"
              />
            </div>
            <Select
              label="系统角色"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              options={[
                { value: 'user', label: '普通用户' },
                { value: 'admin', label: '管理员' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">资源配额</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="GPU 配额 (卡)"
              type="number"
              min="0"
              value={form.gpu}
              onChange={e => setForm(f => ({ ...f, gpu: e.target.value }))}
            />
            <Input
              label="CPU 配额 (核)"
              type="number"
              min="1"
              value={form.cpu}
              onChange={e => setForm(f => ({ ...f, cpu: e.target.value }))}
            />
            <Input
              label="内存配额 (GB)"
              type="number"
              min="1"
              value={form.memory}
              onChange={e => setForm(f => ({ ...f, memory: e.target.value }))}
            />
            <Input
              label="存储配额 (GB)"
              type="number"
              min="10"
              value={form.storage}
              onChange={e => setForm(f => ({ ...f, storage: e.target.value }))}
            />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{saving ? '创建中...' : '创建用户'}</Button>
          <Link to="/admin/users">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
