import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, total, pageSize = 10, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2 justify-end text-sm text-text-muted">
      <span>共 {total} 条</span>
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
        .reduce<(number | '...')[]>((acc, p, idx, arr) => {
          if (idx > 0 && typeof arr[idx - 1] === 'number' && p - (arr[idx - 1] as number) > 1) acc.push('...');
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-primary text-white' : 'hover:bg-white/5 text-text-muted'}`}
            >
              {p}
            </button>
          )
        )}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
