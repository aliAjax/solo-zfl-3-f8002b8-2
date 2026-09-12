import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CompareTray from './CompareTray';
import { useBenchStore } from '@/store/useBenchStore';
import { mockBenches } from '@/data/mockBenches';

function renderTray(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<CompareTray />} />
        <Route path="/compare" element={<CompareTray />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  useBenchStore.setState({
    benches: mockBenches,
    compareIds: [],
    initialized: true,
  });
});

describe('对比栏组件', () => {
  it('没有选择时不渲染', () => {
    const { container } = renderTray();
    expect(container).toBeEmptyDOMElement();
  });

  it('展示已选长椅与计数', () => {
    useBenchStore.setState({ compareIds: [mockBenches[0].id, mockBenches[1].id] });
    renderTray();

    expect(screen.getByText(mockBenches[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockBenches[1].name)).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('点击 chip 的移除按钮移出对应长椅', async () => {
    const user = userEvent.setup();
    useBenchStore.setState({ compareIds: [mockBenches[0].id, mockBenches[1].id] });
    renderTray();

    await user.click(screen.getByRole('button', { name: `将${mockBenches[0].name}移出对比` }));

    expect(useBenchStore.getState().compareIds).toEqual([mockBenches[1].id]);
    expect(screen.queryByText(mockBenches[0].name)).not.toBeInTheDocument();
    expect(screen.getByText(mockBenches[1].name)).toBeInTheDocument();
  });

  it('点击清空移除全部选择，对比栏消失', async () => {
    const user = userEvent.setup();
    useBenchStore.setState({ compareIds: [mockBenches[0].id, mockBenches[1].id] });
    const { container } = renderTray();

    await user.click(screen.getByRole('button', { name: '清空对比栏' }));

    expect(useBenchStore.getState().compareIds).toEqual([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('少于 2 张时开始对比按钮禁用，满 2 张后可用', async () => {
    const user = userEvent.setup();
    useBenchStore.setState({ compareIds: [mockBenches[0].id] });
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<CompareTray />} />
          <Route path="/compare" element={<div>对比页</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: '开始对比' })).toBeDisabled();

    // 通过 store 再选一张，按钮应立即变为可用（调整立即生效）
    useBenchStore.getState().toggleCompare(mockBenches[1].id);
    const startButton = await screen.findByRole('button', { name: '开始对比' });
    expect(startButton).toBeEnabled();

    await user.click(startButton);
    expect(await screen.findByText('对比页')).toBeInTheDocument();
  });

  it('已在对比页时隐藏开始对比按钮', () => {
    useBenchStore.setState({ compareIds: [mockBenches[0].id, mockBenches[1].id] });
    renderTray('/compare');

    expect(screen.queryByRole('button', { name: '开始对比' })).not.toBeInTheDocument();
    expect(screen.getByText(mockBenches[0].name)).toBeInTheDocument();
  });
});
