import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Armchair,
  Clock,
  Compass,
  Gauge,
  Layers,
  Scale,
  Star,
  Sun,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useBenchStore, MAX_COMPARE } from '@/store/useBenchStore';
import {
  MATERIAL_LABELS,
  NOISE_LABELS,
  ORIENTATION_LABELS,
  SHADE_LABELS,
  STAY_DURATION_LABELS,
} from '@/types';
import type { Bench } from '@/types';
import Rating from '@/components/Rating/Rating';
import { calculateComfortScore, getComfortColor, getComfortLevel } from '@/utils/comfort';

interface AttributeRow {
  label: string;
  icon: typeof Sun;
  render: (bench: Bench) => ReactNode;
}

const attributeRows: AttributeRow[] = [
  { label: '材质', icon: Layers, render: (b) => MATERIAL_LABELS[b.material] },
  { label: '朝向', icon: Compass, render: (b) => ORIENTATION_LABELS[b.orientation] },
  { label: '遮阴', icon: Sun, render: (b) => SHADE_LABELS[b.shadeLevel] },
  { label: '噪音', icon: Volume2, render: (b) => NOISE_LABELS[b.noiseLevel] },
  {
    label: '靠背',
    icon: Armchair,
    render: (b) =>
      b.hasBackrest ? (
        <span className="text-moss-green">有</span>
      ) : (
        <span className="text-ink-light/70">无</span>
      ),
  },
  { label: '停留时长', icon: Clock, render: (b) => STAY_DURATION_LABELS[b.stayDuration] },
];

export default function ComparePage() {
  const navigate = useNavigate();
  const { compareIds, benches, initialize, initialized, removeFromCompare, clearCompare } =
    useBenchStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const compareBenches = compareIds
    .map((id) => benches.find((bench) => bench.id === id))
    .filter((bench): bench is Bench => Boolean(bench));

  const count = compareBenches.length;

  if (count === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-semibold text-deep-brown mb-1">
            长椅对比
          </h2>
          <p className="text-ink-light text-sm">并排比较多张长椅的各项属性</p>
        </div>

        <div className="paper-texture rounded-xl shadow-paper p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-moss-green/10 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-moss-green/50" />
          </div>
          <h3 className="font-serif text-lg font-medium text-deep-brown mb-2">
            还没有选择要对比的长椅
          </h3>
          <p className="text-ink-light text-sm mb-6">
            在列表或地图中点击「加入对比」，选择 2-3 张长椅进行并排对比
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-moss-green text-white text-sm font-medium rounded-lg hover:bg-moss-light transition-colors shadow-md"
          >
            去挑选长椅
          </button>
        </div>
      </div>
    );
  }

  const comfortScores = compareBenches.map((bench) => calculateComfortScore(bench));
  const bestComfort = Math.max(...comfortScores);
  const bestRating = Math.max(...compareBenches.map((bench) => bench.rating));

  const gridTemplateColumns = `112px repeat(${count}, minmax(0, 1fr))`;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-deep-brown mb-1">
            长椅对比
          </h2>
          <p className="text-ink-light text-sm">
            并排比较 {count} 张长椅的各项属性
          </p>
        </div>
        <button
          onClick={clearCompare}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-ink-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">清空对比</span>
        </button>
      </div>

      {count === 1 && (
        <div className="mb-4 flex items-center justify-between gap-3 p-3 bg-ochre/10 border border-ochre/20 rounded-lg fade-in">
          <p className="text-sm text-ochre">再选 1 张长椅即可开始对比</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-ochre hover:text-ochre-light transition-colors flex-shrink-0"
          >
            去挑选
          </button>
        </div>
      )}

      <div className="paper-texture rounded-xl shadow-paper overflow-hidden fade-in opacity-0 stagger-1">
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* 表头：长椅名称与操作 */}
            <div className="grid border-b border-deep-brown/10" style={{ gridTemplateColumns }}>
              <div className="p-4" />
              {compareBenches.map((bench) => (
                <div key={bench.id} className="p-4 border-l border-deep-brown/5 relative">
                  <button
                    onClick={() => removeFromCompare(bench.id)}
                    title="移出对比"
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-ink-light/60 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div
                    onClick={() => navigate(`/bench/${bench.id}`)}
                    className="cursor-pointer group"
                  >
                    <h3 className="font-serif font-semibold text-deep-brown group-hover:text-moss-green transition-colors pr-6 line-clamp-1">
                      {bench.name}
                    </h3>
                    <p className="text-xs text-ink-light line-clamp-1 mt-0.5">
                      {bench.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 基础属性行 */}
            {attributeRows.map((row, index) => (
              <div
                key={row.label}
                className={`grid ${index % 2 === 0 ? 'bg-deep-brown/[0.02]' : ''}`}
                style={{ gridTemplateColumns }}
              >
                <div className="p-3 flex items-center gap-1.5 text-sm text-ink-light">
                  <row.icon className="w-4 h-4 flex-shrink-0" />
                  {row.label}
                </div>
                {compareBenches.map((bench) => (
                  <div
                    key={bench.id}
                    className="p-3 border-l border-deep-brown/5 text-sm font-medium text-deep-brown flex items-center"
                  >
                    {row.render(bench)}
                  </div>
                ))}
              </div>
            ))}

            {/* 舒适度行 */}
            <div
              className={`grid ${attributeRows.length % 2 === 0 ? 'bg-deep-brown/[0.02]' : ''}`}
              style={{ gridTemplateColumns }}
            >
              <div className="p-3 flex items-center gap-1.5 text-sm text-ink-light">
                <Gauge className="w-4 h-4 flex-shrink-0" />
                舒适度
              </div>
              {compareBenches.map((bench, index) => {
                const score = comfortScores[index];
                const isBest = count > 1 && score === bestComfort;
                return (
                  <div
                    key={bench.id}
                    className={`p-3 border-l border-deep-brown/5 ${isBest ? 'bg-moss-green/10' : ''}`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold font-serif ${getComfortColor(score)}`}>
                        {score}
                      </span>
                      <span className="text-xs text-ink-light">{getComfortLevel(score)}</span>
                      {isBest && (
                        <span className="text-xs font-medium text-moss-green">最佳</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-warm-beige rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          score >= 4 ? 'bg-moss-green' : score >= 3 ? 'bg-ochre' : 'bg-ink-light'
                        }`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 评分行 */}
            <div className="grid" style={{ gridTemplateColumns }}>
              <div className="p-3 flex items-center gap-1.5 text-sm text-ink-light">
                <Star className="w-4 h-4 flex-shrink-0" />
                评分
              </div>
              {compareBenches.map((bench) => {
                const isBest = count > 1 && bench.rating === bestRating;
                return (
                  <div
                    key={bench.id}
                    className={`p-3 border-l border-deep-brown/5 flex items-center gap-2 ${
                      isBest ? 'bg-moss-green/10' : ''
                    }`}
                  >
                    <Rating value={bench.rating} readOnly size="sm" />
                    <span className="text-sm font-medium text-deep-brown">
                      {bench.rating.toFixed(1)}
                    </span>
                    {isBest && (
                      <span className="text-xs font-medium text-moss-green">最高</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-ink-light">
          在列表或地图中可继续调整对比的长椅，最多 {MAX_COMPARE} 张
        </p>
      </div>
    </div>
  );
}
