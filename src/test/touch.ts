import { fireEvent } from '@testing-library/react';

/**
 * jsdom 没有实现 Touch / TouchEvent，这里提供最小 polyfill，
 * 让测试可以派发携带 touches 数据的真实 TouchEvent。
 */
export function installTouchPolyfill(): void {
  const win = window as unknown as Record<string, unknown>;

  if (!win.Touch) {
    class TouchPolyfill {
      readonly identifier: number;
      readonly target: EventTarget;
      readonly clientX = 0;
      readonly clientY = 0;
      readonly pageX = 0;
      readonly pageY = 0;
      readonly screenX = 0;
      readonly screenY = 0;
      readonly radiusX = 0;
      readonly radiusY = 0;
      readonly rotationAngle = 0;
      readonly force = 0;

      constructor(init: { identifier: number; target: EventTarget }) {
        this.identifier = init.identifier;
        this.target = init.target;
      }
    }
    win.Touch = TouchPolyfill;
  }

  if (!win.TouchEvent) {
    class TouchEventPolyfill extends Event {
      readonly touches: Touch[];
      readonly targetTouches: Touch[];
      readonly changedTouches: Touch[];

      constructor(
        type: string,
        init: EventInit & {
          touches?: Touch[];
          targetTouches?: Touch[];
          changedTouches?: Touch[];
        } = {}
      ) {
        super(type, init);
        this.touches = init.touches ?? [];
        this.targetTouches = init.targetTouches ?? [];
        this.changedTouches = init.changedTouches ?? [];
      }
    }
    win.TouchEvent = TouchEventPolyfill;
  }
}

export interface TouchRecord {
  type: string;
  touchCount: number;
  isTouchEvent: boolean;
}

/** 监听元素的 touchstart / touchend，记录事件类型与 touches 数量。 */
export function recordTouches(el: Element): TouchRecord[] {
  const records: TouchRecord[] = [];
  const listener = (type: string) => (e: Event) => {
    const touchEvent = e as TouchEvent;
    records.push({
      type,
      touchCount: touchEvent.touches?.length ?? -1,
      isTouchEvent: e instanceof TouchEvent,
    });
  };
  el.addEventListener('touchstart', listener('touchstart'));
  el.addEventListener('touchend', listener('touchend'));
  return records;
}

/**
 * 模拟一次真实触屏点按：touchstart → touchend → click。
 * 浏览器会在 touchend 之后合成兼容 click（jsdom 不会自动合成，这里按真实顺序补齐）。
 */
export function touchTap(el: Element): void {
  const touch = new Touch({ identifier: 1, target: el });
  fireEvent.touchStart(el, {
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch],
  });
  fireEvent.touchEnd(el, {
    touches: [],
    targetTouches: [],
    changedTouches: [touch],
  });
  fireEvent.click(el);
}
