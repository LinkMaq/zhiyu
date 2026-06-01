import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, ChevronDown, Settings, AlertCircle, CheckCircle2, Info, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { mockAlerts } from '../../data/mockData';

interface TopBarProps {
  breadcrumbs?: string[];
}

export function TopBar({ breadcrumbs }: TopBarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const unreadCount = mockAlerts.filter(a => a.status === 'firing').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-border shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-muted">
        {breadcrumbs?.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span>/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-text-secondary' : ''}>{b}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-border/60 text-text-muted hover:text-text-secondary transition-colors tooltip-hover"
          data-tip={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
        >
          {theme === 'dark'
            ? <Sun size={18} className="transition-transform duration-200 rotate-0 hover:rotate-12" />
            : <Moon size={18} className="transition-transform duration-200" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(v => !v); setShowUser(false); }}
            className="relative p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-elevated border border-border rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-text-primary">告警通知</span>
                <span className="text-xs text-text-muted">{unreadCount} 条触发中</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {mockAlerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex gap-3 px-4 py-3 hover:bg-white/3 border-b border-border/50 last:border-0">
                    {alert.level === 'critical' ? <AlertCircle size={16} className="text-error shrink-0 mt-0.5" /> :
                     alert.level === 'warning' ? <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" /> :
                     <Info size={16} className="text-accent shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{alert.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{alert.currentValue} / 阈值 {alert.threshold}</p>
                    </div>
                    {alert.status === 'resolved' && <CheckCircle2 size={14} className="text-success shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUser(v => !v); setShowNotif(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-text-primary">{user?.name}</p>
              <p className="text-xs text-text-muted">{user?.role === 'admin' ? '系统管理员' : user?.organization}</p>
            </div>
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-elevated border border-border rounded-xl shadow-2xl z-50 py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-text-primary">{user?.email}</p>
              </div>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors">
                <User size={14} /> 个人信息
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors">
                <Settings size={14} /> 账户设置
              </button>
              <div className="border-t border-border mt-1 pt-1">
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors">
                  <LogOut size={14} /> 退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
