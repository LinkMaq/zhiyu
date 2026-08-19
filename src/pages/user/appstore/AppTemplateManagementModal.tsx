import type { ReactNode } from 'react';
import { CopyPlus, Power, Sparkles, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { ApplicationTemplate } from '../../../data/appMarketplace';
import type { AppSpace } from '../../../types';

type TemplateAction = 'create' | 'clone' | 'toggle' | 'delete';

interface AppTemplateManagementModalProps {
  open: boolean;
  templates: ApplicationTemplate[];
  onClose: () => void;
  onAction: (action: TemplateAction, template: ApplicationTemplate) => void;
  categoryIcon: (category: AppSpace['category']) => ReactNode;
}

export function AppTemplateManagementModal({ open, templates, onClose, onAction, categoryIcon }: AppTemplateManagementModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="应用模板管理" width="xl">
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-4 text-xs leading-5 text-text-muted"><span className="font-medium text-primary">模板治理：</span>平台模板可启停但不可删除；从任意模板克隆得到的用户副本可独立启停、删除，并可直接用于构建应用空间。</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {templates.map(template => (
            <Card key={template.id} className={template.status === 'disabled' ? 'opacity-65' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-text-primary">{template.name}</p><Badge variant={template.status === 'enabled' ? 'success' : 'ghost'}>{template.status === 'enabled' ? '已启用' : '已停用'}</Badge></div>
                  <p className="mt-1 text-xs text-text-muted">{template.source === 'platform' ? '平台模板' : '用户模板'} · {template.industry}</p>
                </div>
                <span className="rounded-lg border border-border bg-base p-2 text-primary">{categoryIcon(template.category) ?? <Sparkles size={16} />}</span>
              </div>
              <p className="mt-3 min-h-10 text-xs leading-5 text-text-muted">{template.description}</p>
              <div className="mt-3 flex flex-wrap gap-1"><Badge variant="ghost">{template.modelName}</Badge><Badge variant="ghost">{template.gpuType} × {template.gpuCount}</Badge></div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button size="sm" onClick={() => onAction('create', template)} disabled={template.status === 'disabled'}>从模板创建</Button>
                <Button size="sm" variant="outline" leftIcon={<CopyPlus size={11} />} onClick={() => onAction('clone', template)}>克隆</Button>
                <Button size="sm" variant="ghost" leftIcon={<Power size={11} />} onClick={() => onAction('toggle', template)}>{template.status === 'enabled' ? '停用' : '启用'}</Button>
                {template.source === 'user' && <Button size="sm" variant="ghost" leftIcon={<Trash2 size={11} />} className="text-error hover:text-error/80" onClick={() => onAction('delete', template)}>删除</Button>}
              </div>
              <p className="mt-3 text-[11px] text-text-muted">更新于 {template.updatedAt}</p>
            </Card>
          ))}
        </div>
      </div>
    </Modal>
  );
}
