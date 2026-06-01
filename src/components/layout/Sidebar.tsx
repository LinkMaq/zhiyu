import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Database, BrainCircuit, Terminal, Zap, AppWindow,
  HardDrive, KeyRound, ChevronLeft, ChevronRight, Cpu, Server, Box,
  Boxes, BarChart3, ScrollText, ShieldCheck, Gauge, Building2, Network,
  ShieldAlert,
  Cloud,
  FileText
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const userNav: NavItem[] = [
  { path: '/user/dashboard', label: '工作台', icon: <LayoutDashboard size={18} /> },
  { path: '/user/datasets', label: '数据集', icon: <Database size={18} /> },
  { path: '/user/models', label: '模型广场', icon: <BrainCircuit size={18} /> },
  { path: '/user/development', label: '开发环境', icon: <Terminal size={18} /> },
  { path: '/user/training', label: '训练任务', icon: <Zap size={18} /> },
  { path: '/user/inference', label: '推理服务', icon: <Cloud size={18} /> },
  { path: '/user/inference/batch', label: '批量推理', icon: <FileText size={18} /> },
  { path: '/user/appstore', label: '应用管理', icon: <AppWindow size={18} /> },
  { path: '/user/storage', label: '存储空间', icon: <HardDrive size={18} /> },
  { path: '/user/settings', label: 'API 密钥', icon: <KeyRound size={18} /> },
];

const adminNav: NavItem[] = [
  { path: '/admin/dashboard', label: '总览', icon: <LayoutDashboard size={18} /> },
  { path: '/admin/compute', label: 'GPU 管理', icon: <Cpu size={18} /> },
  { path: '/admin/storage', label: '存储管理', icon: <HardDrive size={18} /> },
  { path: '/admin/images', label: '镜像仓库', icon: <Box size={18} /> },
  { path: '/admin/kubernetes', label: 'K8s 集群', icon: <Server size={18} /> },
  { path: '/admin/resources', label: '资源池', icon: <Boxes size={18} /> },
  { path: '/admin/monitoring', label: '监控告警', icon: <BarChart3 size={18} /> },
  { path: '/admin/apikeys', label: 'API 密钥', icon: <KeyRound size={18} /> },
  { path: '/admin/sensitive', label: '敏感词管理', icon: <ShieldAlert size={18} /> },
  { path: '/admin/operations', label: '操作审计', icon: <ScrollText size={18} /> },
  { path: '/admin/permissions', label: '权限管理', icon: <ShieldCheck size={18} /> },
  { path: '/admin/quota', label: '配额管理', icon: <Gauge size={18} /> },
  { path: '/admin/business', label: '业务管理', icon: <Building2 size={18} /> },
];

interface SidebarProps {
  role: 'user' | 'admin';
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const nav = role === 'user' ? userNav : adminNav;

  return (
    <aside className={`flex flex-col bg-surface border-r border-border transition-all duration-300 shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className={`h-16 px-3 border-b border-border shrink-0 bg-gradient-to-r from-base/80 to-surface ${collapsed ? 'flex items-center justify-center' : 'flex items-center gap-2.5'}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-blue-500 to-secondary flex items-center justify-center shadow-[0_6px_16px_rgba(30,95,255,0.25)] shrink-0">
          <Network size={16} className="text-white" />
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-[0.02em] text-text-primary leading-tight">智云 AI Platform</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted leading-tight">Enterprise Console</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5 transition-all group ${
                active
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-text-muted hover:bg-white/5 hover:text-text-secondary'
              }`}
            >
              <span className={`shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary'}`}>{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto px-1.5 py-0.5 text-xs bg-error/20 text-red-300 rounded">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`flex items-center gap-2 mx-2 mb-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors ${collapsed ? 'justify-center' : ''}`}
      >
        {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs">收起</span></>}
      </button>
    </aside>
  );
}
