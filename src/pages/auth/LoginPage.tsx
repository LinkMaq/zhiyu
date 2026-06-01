import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Network, Lock, Mail, AlertCircle, Cpu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockUsers } from '../../data/mockUsers';
import { Button } from '../../components/ui/Button';

const CREDS = {
  'user@zhiyun.ai': { password: 'User@2025', userId: 'u001' },
  'admin@zhiyun.ai': { password: 'Admin@2025', userId: 'a001' },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cred = CREDS[email as keyof typeof CREDS];
    if (!cred || cred.password !== password) {
      setError('邮箱或密码错误，请检查后重试');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const user = mockUsers.find(u => u.id === cred.userId);
    if (!user) { setError('用户不存在'); setLoading(false); return; }
    login(user);
    navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  };

  return (
    <div className="login-root">
      {/* ── Layer 1: aurora blobs ── */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />
      <div className="login-blob login-blob-4" />

      {/* ── Layer 2: orbital rings ── */}
      <div className="login-rings" aria-hidden>
        <div className="login-ring login-ring-1" />
        <div className="login-ring login-ring-2" />
        <div className="login-ring login-ring-3" />
      </div>

      {/* ── Layer 3: dot grid ── */}
      <div className="login-dots" />

      {/* ── Layer 4: edge vignette ── */}
      <div className="login-vignette" />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="login-logo-icon">
            <Network size={32} className="text-white" />
          </div>
          <h1 className="login-title">智云</h1>
          <p className="text-text-muted text-sm mt-2 tracking-[0.22em] uppercase font-light">
            ZhiYun AI Computing Platform
          </p>

          {/* Decorative divider */}
          <div className="flex items-center gap-3 mt-5 w-48">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/40" />
            <Cpu size={11} className="text-primary/50" />
            <span className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </div>

        {/* Login card */}
        <div className="login-card">
          <h2 className="text-base font-semibold text-text-primary mb-6 tracking-wide">登录账户</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">邮箱</label>
              <div className="relative login-field-with-left-icon">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted login-field-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="login-input"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">密码</label>
              <div className="relative login-field-with-left-icon login-field-with-right-icon">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted login-field-icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors z-10"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-error/10 border border-error/30 rounded-lg px-3 py-2.5 text-sm text-error">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2 login-btn">
              登录
            </Button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(107,126,159,0.5)' }}>
          © 2025 破晓石科技 · ZhiYun Platform
        </p>
      </div>
    </div>
  );
}
