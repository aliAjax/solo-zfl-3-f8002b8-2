import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ComparePage from './ComparePage';
import { useBenchStore } from '@/store/useBenchStore';
import { mockBenches } from '@/data/mockBenches';
import { calculateComfortScore, getComfortLevel } from '@/utils/comfort';
import {
  MATERIAL_LABELS,
  NOISE_LABELS,
  ORIENTATION_LABELS,
  SHADE_LABELS,
  STAY_DURATION_LABELS,
} from '@/types';
import type { Bench } from '@/types';

const [bench001, bench002, bench003, , , bench006] = mockBenches;

function renderComparePage() {
  return render(
    <MemoryRouter initialEntries={['/compare']}>
      <Routes>
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/" element={<div>列表页</div>} />
        <Route path="/bench/:id" element={<div>长椅详情页</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function setCompare(benches: Bench[]) {
  useBenchStore.setState({ compareIds: benches.map((bench) => bench.id) });
}

function cell(label: string, bench: Bench) {
  return screen.getByTestId(`compare-cell-${label}-${bench.id}`);
}

beforeEach(() => {
  localStorage.clear();
  useBenchStore.setState({
    benches: mockBenches,
    compareIds: [],
    initialized: true,
  });
});

describe('对比页：并排属性展示', () => {
  it('两张长椅逐行展示材质、朝向、遮阴、噪音、靠背、停留时长', () => {
    setCompare([bench002, bench003]);
    renderComparePage();

    // 表头列
    expect(screen.getByTestId(`compare-col-${bench002.id}`)).toHaveTextContent(bench002.name);
    expect(screen.getByTestId(`compare-col-${bench002.id}`)).toHaveTextContent(bench002.location);
    expect(screen.getByTestId(`compare-col-${bench003.id}`)).toHaveTextContent(bench003.name);

    // 六个属性行 × 两列
    for (const bench of [bench002, bench003]) {
      expect(cell('材质', bench)).toHaveTextContent(MATERIAL_LABELS[bench.material]);
      expect(cell('朝向', bench)).toHaveTextContent(ORIENTATION_LABELS[bench.orientation]);
      expect(cell('遮阴', bench)).toHaveTextContent(SHADE_LABELS[bench.shadeLevel]);
      expect(cell('噪音', bench)).toHaveTextContent(NOISE_LABELS[bench.noiseLevel]);
      expect(cell('靠背', bench)).toHaveTextContent(bench.hasBackrest ? '有' : '无');
      expect(cell('停留时长', bench)).toHaveTextContent(STAY_DURATION_LABELS[bench.stayDuration]);
    }

    // 抽查具体值，确认列没有串位
    expect(cell('材质', bench002)).toHaveTextContent('金属');
    expect(cell('材质', bench003)).toHaveTextContent('石质');
    expect(cell('靠背', bench002)).toHaveTextContent('有');
    expect(cell('靠背', bench003)).toHaveTextContent('无');
  });

  it('舒适度行展示分数、等级与进度条', () => {
    setCompare([bench002, bench003]);
    renderComparePage();

    for (const bench of [bench002, bench003]) {
      const score = calculateComfortScore(bench);
      const comfortCell = cell('舒适度', bench);
      expect(comfortCell).toHaveTextContent(String(score));
      expect(comfortCell).toHaveTextContent(getComfortLevel(score));
      const bar = comfortCell.querySelector('[style*="width"]');
      expect(bar).toHaveStyle({ width: `${(score / 5) * 100}%` });
    }
  });

  it('评分行展示五颗星级与数值', () => {
    setCompare([bench002, bench003]);
    renderComparePage();

    for (const bench of [bench002, bench003]) {
      const ratingCell = cell('评分', bench);
      expect(within(ratingCell).getAllByRole('button')).toHaveLength(5);
      expect(ratingCell).toHaveTextContent(bench.rating.toFixed(1));
    }
  });
});

describe('对比页：两张时最高值与最佳标记', () => {
  it('舒适度更高的一列标记「最佳」，另一列没有', () => {
    setCompare([bench002, bench003]);
    renderComparePage();

    const best = calculateComfortScore(bench002) > calculateComfortScore(bench003) ? bench002 : bench003;
    const other = best === bench002 ? bench003 : bench002;

    expect(within(cell('舒适度', best)).getByText('最佳')).toBeInTheDocument();
    expect(cell('舒适度', best).className).toContain('bg-moss-green/10');
    expect(within(cell('舒适度', other)).queryByText('最佳')).not.toBeInTheDocument();
    expect(cell('舒适度', other).className).not.toContain('bg-moss-green/10');
  });

  it('评分更高的一列标记「最高」，另一列没有', () => {
    setCompare([bench002, bench003]);
    renderComparePage();

    expect(within(cell('评分', bench002)).getByText('最高')).toBeInTheDocument();
    expect(within(cell('评分', bench003)).queryByText('最高')).not.toBeInTheDocument();
  });
});

describe('对比页：三张时最高值与最佳标记', () => {
  it('舒适度最高列唯一标记「最佳」', () => {
    setCompare([bench003, bench001, bench006]);
    renderComparePage();

    // bench-001 全满分属性，舒适度必然最高
    expect(within(cell('舒适度', bench001)).getByText('最佳')).toBeInTheDocument();
    expect(within(cell('舒适度', bench003)).queryByText('最佳')).not.toBeInTheDocument();
    expect(within(cell('舒适度', bench006)).queryByText('最佳')).not.toBeInTheDocument();
  });

  it('评分并列最高时两列都标记「最高」，其余列没有', () => {
    setCompare([bench003, bench001, bench006]);
    renderComparePage();

    // bench-001 与 bench-006 评分均为 5，并列最高
    expect(bench001.rating).toBe(bench006.rating);
    expect(within(cell('评分', bench001)).getByText('最高')).toBeInTheDocument();
    expect(within(cell('评分', bench006)).getByText('最高')).toBeInTheDocument();
    expect(within(cell('评分', bench003)).queryByText('最高')).not.toBeInTheDocument();
  });

  it('三张长椅的全部属性列完整渲染', () => {
    setCompare([bench001, bench003, bench006]);
    renderComparePage();

    for (const bench of [bench001, bench003, bench006]) {
      expect(cell('材质', bench)).toHaveTextContent(MATERIAL_LABELS[bench.material]);
      expect(cell('朝向', bench)).toHaveTextContent(ORIENTATION_LABELS[bench.orientation]);
      expect(cell('遮阴', bench)).toHaveTextContent(SHADE_LABELS[bench.shadeLevel]);
      expect(cell('噪音', bench)).toHaveTextContent(NOISE_LABELS[bench.noiseLevel]);
      expect(cell('靠背', bench)).toHaveTextContent(bench.hasBackrest ? '有' : '无');
      expect(cell('停留时长', bench)).toHaveTextContent(STAY_DURATION_LABELS[bench.stayDuration]);
      expect(cell('舒适度', bench)).toHaveTextContent(String(calculateComfortScore(bench)));
      expect(cell('评分', bench)).toHaveTextContent(bench.rating.toFixed(1));
    }
  });
});

describe('对比页：数量边界与调整', () => {
  it('未选择时显示空态引导', () => {
    renderComparePage();

    expect(screen.getByText('还没有选择要对比的长椅')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去挑选长椅' })).toBeInTheDocument();
  });

  it('仅一张时提示再选一张，且不出现最佳/最高标记', () => {
    setCompare([bench001]);
    renderComparePage();

    expect(screen.getByText('再选 1 张长椅即可开始对比')).toBeInTheDocument();
    expect(screen.queryByText('最佳')).not.toBeInTheDocument();
    expect(screen.queryByText('最高')).not.toBeInTheDocument();
  });

  it('点击列头移除按钮移出对应长椅', async () => {
    const user = userEvent.setup();
    setCompare([bench001, bench003]);
    renderComparePage();

    await user.click(screen.getByRole('button', { name: `将${bench001.name}移出对比` }));

    expect(useBenchStore.getState().compareIds).toEqual([bench003.id]);
    expect(screen.queryByTestId(`compare-col-${bench001.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`compare-col-${bench003.id}`)).toBeInTheDocument();
  });

  it('点击清空对比回到空态', async () => {
    const user = userEvent.setup();
    setCompare([bench001, bench003]);
    renderComparePage();

    await user.click(screen.getByRole('button', { name: '清空对比' }));

    expect(useBenchStore.getState().compareIds).toEqual([]);
    expect(screen.getByText('还没有选择要对比的长椅')).toBeInTheDocument();
  });
});
