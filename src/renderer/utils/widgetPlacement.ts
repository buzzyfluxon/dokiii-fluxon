import { DesktopWidgetItem, DesktopWidgetSize, DESKTOP_WIDGET_SIZES } from '../../shared/constants';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SCAN_STEP = 8;

const SCAN_PASSES = [
  { inset: 40, gap: 16 },
  { inset: 10, gap: 8 },
];

const overlaps = (a: Rect, b: Rect, gap: number): boolean =>
  a.x < b.x + b.width + gap &&
  a.x + a.width + gap > b.x &&
  a.y < b.y + b.height + gap &&
  a.y + a.height + gap > b.y;

export const getDockReservedRect = (
  position: 'bottom' | 'left' | 'right',
  dockSize: number,
  winW: number,
  winH: number
): Rect => {
  const thickness = dockSize + 48;
  if (position === 'left') return { x: 0, y: 0, width: thickness, height: winH };
  if (position === 'right') return { x: winW - thickness, y: 0, width: thickness, height: winH };
  return { x: 0, y: winH - thickness, width: winW, height: thickness };
};

export const findFreeSpot = (
  widgets: DesktopWidgetItem[],
  size: DesktopWidgetSize,
  winW: number,
  winH: number,
  reserved: Rect | null
): { x: number; y: number } | null => {
  const target = DESKTOP_WIDGET_SIZES[size] || DESKTOP_WIDGET_SIZES.small;

  const occupied: Rect[] = widgets.map((w) => {
    const dims = DESKTOP_WIDGET_SIZES[w.size] || DESKTOP_WIDGET_SIZES.small;
    return {
      x: w.x < 0 ? winW + w.x : w.x,
      y: w.y < 0 ? winH + w.y : w.y,
      width: w.width ?? dims.width,
      height: w.height ?? dims.height,
    };
  });

  if (reserved) occupied.push(reserved);

  for (const { inset, gap } of SCAN_PASSES) {
    const maxX = winW - inset - target.width;
    const maxY = winH - inset - target.height;
    for (let y = inset; y <= maxY; y += SCAN_STEP) {
      for (let x = inset; x <= maxX; x += SCAN_STEP) {
        const candidate: Rect = { x, y, width: target.width, height: target.height };
        if (!occupied.some((rect) => overlaps(candidate, rect, gap))) {
          return { x, y };
        }
      }
    }
  }

  return null;
};
