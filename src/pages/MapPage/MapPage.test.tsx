import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MapPage from './MapPage';
import CompareTray from '@/components/CompareTray/CompareTray';
import { useBenchStore, MAX_COMPARE } from '@/store/useBenchStore';
import { mockBenches } from '@/data/mockBenches';
import { recordTouches, touchTap } from '@/test/touch';

function renderMapPage() {
  return render(
    <MemoryRouter initialEntries={['/map']}>
      <Routes>
        <Route path="/map" element={<MapPage />} />
        <Route path="/bench/:id" element={<div>长椅详情页</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderMapWithTray() {
  return render(
    <MemoryRouter initialEntries={['/map']}>
      <Routes>
        <Route path="/map" element={<MapPage />} />
        <Route path="/compare" element={<div>对比页</div>} />
        <Route path="/bench/:id" element={<div>长椅详情页</div>} />
      </Routes>
      <CompareTray />
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

describe('地图页：标记保持原生按钮', () => {
  it('标记渲染为原生 button，可聚焦，键盘 Enter 触发详情导航', async () => {
    const user = userEvent.setup();
    renderMapPage();

    const marker = screen.getByRole('button', { name: `查看${mockBenches[0].name}详情` });
    expect(marker.tagName).toBe('BUTTON');

    marker.focus();
    expect(marker).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(await screen.findByText('长椅详情页')).toBeInTheDocument();
  });

  it('鼠标点击标记同样进入详情', async () => {
    const user = userEvent.setup();
    renderMapPage();

    await user.click(screen.getByRole('button', { name: `查看${mockBenches[1].name}详情` }));

    expect(await screen.findByText('长椅详情页')).toBeInTheDocument();
  });
});

describe('地图页：对比列表选点', () => {
  it('点按（触屏/鼠标）可将长椅加入对比栏', async () => {
    const user = userEvent.setup();
    renderMapPage();

    await user.click(screen.getByRole('button', { name: `将${mockBenches[0].name}加入对比` }));

    expect(useBenchStore.getState().compareIds).toEqual([mockBenches[0].id]);
    expect(
      screen.getByRole('button', { name: `将${mockBenches[0].name}移出对比` })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('已选 1/3，选 2-3 张')).toBeInTheDocument();
  });

  it('键盘聚焦后 Enter 选入、Space 移出', async () => {
    const user = userEvent.setup();
    renderMapPage();

    const toggle = screen.getByRole('button', { name: `将${mockBenches[1].name}加入对比` });
    toggle.focus();
    expect(toggle).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(useBenchStore.getState().compareIds).toEqual([mockBenches[1].id]);

    // 选中后按钮 aria-label 更新，焦点保持在原按钮上
    const pressed = screen.getByRole('button', { name: `将${mockBenches[1].name}移出对比` });
    expect(pressed).toHaveFocus();

    await user.keyboard(' ');
    expect(useBenchStore.getState().compareIds).toEqual([]);
  });

  it('可通过选择面板稳定选满三张，第四张被禁用', async () => {
    const user = userEvent.setup();
    renderMapPage();

    for (const bench of mockBenches.slice(0, MAX_COMPARE)) {
      await user.click(screen.getByRole('button', { name: `将${bench.name}加入对比` }));
    }
    expect(useBenchStore.getState().compareIds).toHaveLength(MAX_COMPARE);

    const fourth = screen.getByRole('button', { name: `将${mockBenches[3].name}加入对比` });
    expect(fourth).toBeDisabled();

    await user.click(fourth);
    expect(useBenchStore.getState().compareIds).toHaveLength(MAX_COMPARE);
    expect(useBenchStore.getState().compareIds).not.toContain(mockBenches[3].id);
  });

  it('已在对比栏的长椅在地图上带选中角标，且选择面板可移出', async () => {
    const user = userEvent.setup();
    useBenchStore.setState({ compareIds: [mockBenches[0].id] });
    renderMapPage();

    const removeButton = screen.getByRole('button', { name: `将${mockBenches[0].name}移出对比` });
    expect(removeButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(removeButton);
    expect(useBenchStore.getState().compareIds).toEqual([]);
  });
});

describe('地图页：真实触屏选点', () => {
  // 选择面板与对比栏的移除按钮同名，查询时限定在选择面板内
  const picker = () => within(screen.getByTestId('compare-picker'));

  it('touch 点按选择按钮加入对比栏，touchstart/touchend 真实到达', () => {
    renderMapWithTray();

    const toggle = screen.getByRole('button', { name: `将${mockBenches[0].name}加入对比` });
    const records = recordTouches(toggle);

    touchTap(toggle);

    expect(records.map((r) => r.type)).toEqual(['touchstart', 'touchend']);
    expect(records[0].isTouchEvent).toBe(true);
    expect(records[0].touchCount).toBe(1);
    expect(records[1].touchCount).toBe(0);
    expect(useBenchStore.getState().compareIds).toEqual([mockBenches[0].id]);
    expect(
      picker().getByRole('button', { name: `将${mockBenches[0].name}移出对比` })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('touch 点按已加入按钮移出对比', () => {
    useBenchStore.setState({ compareIds: [mockBenches[0].id] });
    renderMapWithTray();

    touchTap(picker().getByRole('button', { name: `将${mockBenches[0].name}移出对比` }));

    expect(useBenchStore.getState().compareIds).toEqual([]);
  });

  it('touch 点按对比栏清空按钮移除全部选择', () => {
    useBenchStore.setState({ compareIds: [mockBenches[0].id, mockBenches[1].id] });
    renderMapWithTray();

    const clearButton = screen.getByRole('button', { name: '清空对比栏' });
    const records = recordTouches(clearButton);

    touchTap(clearButton);

    expect(records.map((r) => r.type)).toEqual(['touchstart', 'touchend']);
    expect(useBenchStore.getState().compareIds).toEqual([]);
    // 对比栏随空选择消失
    expect(screen.queryByRole('button', { name: '清空对比栏' })).not.toBeInTheDocument();
  });

  it('touch 连续选满三张后，第四张禁用且点按无效', () => {
    renderMapWithTray();

    for (const bench of mockBenches.slice(0, MAX_COMPARE)) {
      touchTap(screen.getByRole('button', { name: `将${bench.name}加入对比` }));
    }
    expect(useBenchStore.getState().compareIds).toHaveLength(MAX_COMPARE);

    const fourth = screen.getByRole('button', { name: `将${mockBenches[3].name}加入对比` });
    expect(fourth).toBeDisabled();

    touchTap(fourth);
    expect(useBenchStore.getState().compareIds).toHaveLength(MAX_COMPARE);
    expect(useBenchStore.getState().compareIds).not.toContain(mockBenches[3].id);
  });

  it('touch 点按地图标记进入详情页', () => {
    renderMapWithTray();

    const marker = screen.getByRole('button', { name: `查看${mockBenches[0].name}详情` });
    const records = recordTouches(marker);

    touchTap(marker);

    expect(records.map((r) => r.type)).toEqual(['touchstart', 'touchend']);
    expect(screen.getByText('长椅详情页')).toBeInTheDocument();
  });
});
