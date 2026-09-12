import { useLocation, useNavigate } from 'react-router-dom';
import { Scale, X, Trash2 } from 'lucide-react';
import { useBenchStore, MAX_COMPARE } from '@/store/useBenchStore';
import type { Bench } from '@/types';

export default function CompareTray() {
  const { compareIds, benches, removeFromCompare, clearCompare } = useBenchStore();
  const navigate = useNavigate();
  const location = useLocation();

  const compareBenches = compareIds
    .map((id) => benches.find((bench) => bench.id === id))
    .filter((bench): bench is Bench => Boolean(bench));

  if (compareBenches.length === 0) return null;

  const onComparePage = location.pathname === '/compare';
  const canCompare = compareBenches.length >= 2;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="paper-texture rounded-xl shadow-paper-hover border border-deep-brown/10 px-4 py-3 flex items-center gap-3 flex-wrap fade-in">
        <div className="flex items-center gap-1.5 text-sm font-medium text-deep-brown flex-shrink-0">
          <Scale className="w-4 h-4 text-moss-green" />
          <span>对比</span>
          <span className="text-ink-light">
            {compareBenches.length}/{MAX_COMPARE}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          {compareBenches.map((bench) => (
            <span
              key={bench.id}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-moss-green/10 text-deep-brown text-xs rounded-full max-w-[140px]"
            >
              <span className="truncate">{bench.name}</span>
              <button
                onClick={() => removeFromCompare(bench.id)}
                title="移出对比"
                aria-label={`将${bench.name}移出对比`}
                className="w-4 h-4 rounded-full flex items-center justify-center text-ink-light/60 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={clearCompare}
            title="清空对比栏"
            aria-label="清空对比栏"
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-ink-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">清空</span>
          </button>
          {!onComparePage && (
            <button
              onClick={() => navigate('/compare')}
              disabled={!canCompare}
              title={canCompare ? '查看并排对比' : '至少选择 2 张长椅'}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                canCompare
                  ? 'bg-moss-green text-white shadow-md hover:bg-moss-light'
                  : 'bg-deep-brown/10 text-ink-light/50 cursor-not-allowed'
              }`}
            >
              开始对比
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
