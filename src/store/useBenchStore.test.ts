import { beforeEach, describe, expect, it } from 'vitest';
import { useBenchStore, MAX_COMPARE } from './useBenchStore';
import { mockBenches } from '@/data/mockBenches';

const BENCHES_KEY = 'bench-archive-data';
const COMPARE_KEY = 'bench-archive-compare';

function readStoredCompareIds(): string[] {
  const raw = localStorage.getItem(COMPARE_KEY);
  return raw ? JSON.parse(raw) : [];
}

beforeEach(() => {
  localStorage.clear();
  useBenchStore.setState({
    benches: [],
    searchQuery: '',
    materialFilter: null,
    orientationFilter: null,
    shadeFilter: null,
    noiseFilter: null,
    compareIds: [],
    initialized: false,
  });
});

describe('对比栏：选入与移出', () => {
  it('toggleCompare 选入长椅并持久化', () => {
    useBenchStore.getState().initialize();
    const id = mockBenches[0].id;

    useBenchStore.getState().toggleCompare(id);

    expect(useBenchStore.getState().compareIds).toEqual([id]);
    expect(readStoredCompareIds()).toEqual([id]);
  });

  it('再次 toggleCompare 移出长椅', () => {
    useBenchStore.getState().initialize();
    const id = mockBenches[0].id;

    useBenchStore.getState().toggleCompare(id);
    useBenchStore.getState().toggleCompare(id);

    expect(useBenchStore.getState().compareIds).toEqual([]);
    expect(readStoredCompareIds()).toEqual([]);
  });

  it('removeFromCompare 移出指定长椅，不影响其他选择', () => {
    useBenchStore.getState().initialize();
    const [a, b, c] = mockBenches.map((bench) => bench.id);
    [a, b, c].forEach((id) => useBenchStore.getState().toggleCompare(id));

    useBenchStore.getState().removeFromCompare(b);

    expect(useBenchStore.getState().compareIds).toEqual([a, c]);
    expect(readStoredCompareIds()).toEqual([a, c]);
  });

  it('clearCompare 清空全部选择并同步存储', () => {
    useBenchStore.getState().initialize();
    mockBenches.slice(0, 2).forEach((bench) => useBenchStore.getState().toggleCompare(bench.id));

    useBenchStore.getState().clearCompare();

    expect(useBenchStore.getState().compareIds).toEqual([]);
    expect(readStoredCompareIds()).toEqual([]);
  });
});

describe('对比栏：上限三张', () => {
  it('第 4 张无法加入，状态与存储均保持 3 张', () => {
    useBenchStore.getState().initialize();
    const ids = mockBenches.slice(0, 4).map((bench) => bench.id);

    ids.forEach((id) => useBenchStore.getState().toggleCompare(id));

    expect(useBenchStore.getState().compareIds).toHaveLength(MAX_COMPARE);
    expect(useBenchStore.getState().compareIds).toEqual(ids.slice(0, MAX_COMPARE));
    expect(readStoredCompareIds()).toEqual(ids.slice(0, MAX_COMPARE));
  });

  it('满员后移出一张即可再选', () => {
    useBenchStore.getState().initialize();
    const ids = mockBenches.slice(0, 4).map((bench) => bench.id);
    ids.slice(0, MAX_COMPARE).forEach((id) => useBenchStore.getState().toggleCompare(id));

    useBenchStore.getState().removeFromCompare(ids[0]);
    useBenchStore.getState().toggleCompare(ids[3]);

    expect(useBenchStore.getState().compareIds).toEqual([ids[1], ids[2], ids[3]]);
  });
});

describe('对比栏：刷新保留', () => {
  it('重新 initialize 后从 localStorage 恢复选择', () => {
    useBenchStore.getState().initialize();
    const [a, b] = mockBenches.map((bench) => bench.id);
    useBenchStore.getState().toggleCompare(a);
    useBenchStore.getState().toggleCompare(b);

    // 模拟刷新：内存状态丢失，localStorage 保留
    useBenchStore.setState({ benches: [], compareIds: [], initialized: false });
    useBenchStore.getState().initialize();

    expect(useBenchStore.getState().compareIds).toEqual([a, b]);
  });

  it('恢复时清洗已不存在的长椅 id', () => {
    localStorage.setItem(BENCHES_KEY, JSON.stringify(mockBenches));
    localStorage.setItem(COMPARE_KEY, JSON.stringify([mockBenches[0].id, 'ghost-id']));

    useBenchStore.getState().initialize();

    expect(useBenchStore.getState().compareIds).toEqual([mockBenches[0].id]);
  });

  it('存储内容损坏时回退为空选择', () => {
    localStorage.setItem(BENCHES_KEY, JSON.stringify(mockBenches));
    localStorage.setItem(COMPARE_KEY, '{not-valid-json');

    useBenchStore.getState().initialize();

    expect(useBenchStore.getState().compareIds).toEqual([]);
  });
});

describe('对比栏：长椅移除后同步', () => {
  it('deleteBench 将长椅移出对比栏并更新存储', () => {
    useBenchStore.getState().initialize();
    const [target, other] = mockBenches.map((bench) => bench.id);
    useBenchStore.getState().toggleCompare(target);
    useBenchStore.getState().toggleCompare(other);

    useBenchStore.getState().deleteBench(target);

    expect(useBenchStore.getState().benches.some((bench) => bench.id === target)).toBe(false);
    expect(useBenchStore.getState().compareIds).toEqual([other]);
    expect(readStoredCompareIds()).toEqual([other]);
  });

  it('删除不在对比栏中的长椅不影响已有选择', () => {
    useBenchStore.getState().initialize();
    const [a, b, c] = mockBenches.map((bench) => bench.id);
    useBenchStore.getState().toggleCompare(a);

    useBenchStore.getState().deleteBench(b);
    useBenchStore.getState().deleteBench(c);

    expect(useBenchStore.getState().compareIds).toEqual([a]);
  });
});
