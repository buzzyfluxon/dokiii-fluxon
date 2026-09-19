import { useRef, useEffect, useCallback, useState } from 'react';

interface UseDockMagnificationOptions {
  dockRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
  maxScale: number;
  radius?: number;
  position?: 'bottom' | 'left' | 'right';
  isDragging?: boolean;
}

interface HoveredItemInfo {
  id: string;
  title: string;
  rect: DOMRect;
}

export const useDockMagnification = ({
  dockRef,
  enabled,
  maxScale,
  radius = 165,
  position = 'bottom',
  isDragging = false,
}: UseDockMagnificationOptions) => {
  const isVertical = position === 'left' || position === 'right';

  const isHoveredRef = useRef(false);
  const pointerCoordRef = useRef<number | null>(null);
  const scalesRef = useRef<Map<HTMLElement, number>>(new Map());
  const rafIdRef = useRef<number | null>(null);

  const [hoveredItem, setHoveredItem] = useState<HoveredItemInfo | null>(null);

  const updateItems = useCallback(() => {
    if (!dockRef.current) return;

    const items = Array.from(
      dockRef.current.querySelectorAll<HTMLElement>('[data-dock-item]')
    );

    if (items.length === 0) return;

    const pointerCoord = pointerCoordRef.current;
    const isHovered = isHoveredRef.current && !isDragging && enabled && pointerCoord !== null;

    let maxCurrentScale = 1;
    let closestItem: HTMLElement | null = null;
    let anyNeedsUpdate = false;

    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      const rect = el.getBoundingClientRect();

      let targetScale = 1;

      if (isHovered && pointerCoord !== null) {
        const itemCenter = isVertical
          ? rect.top + rect.height / 2
          : rect.left + rect.width / 2;

        const dist = Math.abs(pointerCoord - itemCenter);

        if (dist < radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2)) ** 2;
          targetScale = 1 + (maxScale - 1) * factor;
        }
      }

      const currentScale = scalesRef.current.get(el) ?? 1;
      const diff = targetScale - currentScale;

      let newScale = currentScale;
      if (Math.abs(diff) > 0.001) {
        newScale = currentScale + diff * 0.22;
        anyNeedsUpdate = true;
      } else {
        newScale = targetScale;
      }

      scalesRef.current.set(el, newScale);

      if (newScale > maxCurrentScale) {
        maxCurrentScale = newScale;
        closestItem = el;
      }

      const marginDelta = (newScale - 1) * (isVertical ? 8 : 10);

      el.style.transform = `scale(${newScale.toFixed(4)})`;

      if (isVertical) {
        el.style.transformOrigin = position === 'left' ? '0% 50%' : '100% 50%';
        el.style.marginTop = `${marginDelta.toFixed(2)}px`;
        el.style.marginBottom = `${marginDelta.toFixed(2)}px`;
        el.style.marginLeft = '0px';
        el.style.marginRight = '0px';
      } else {
        el.style.transformOrigin = '50% 100%';
        el.style.marginLeft = `${marginDelta.toFixed(2)}px`;
        el.style.marginRight = `${marginDelta.toFixed(2)}px`;
        el.style.marginTop = '0px';
        el.style.marginBottom = '0px';
      }
    }

    if (isHovered && closestItem && maxCurrentScale > 1.15) {
      const title = closestItem.getAttribute('data-dock-title') || '';
      const id = closestItem.getAttribute('data-dock-item') || '';
      if (title) {
        setHoveredItem({
          id,
          title,
          rect: closestItem.getBoundingClientRect(),
        });
      } else {
        setHoveredItem(null);
      }
    } else {
      setHoveredItem(null);
    }

    if (anyNeedsUpdate || isHovered) {
      rafIdRef.current = requestAnimationFrame(updateItems);
    } else {
      rafIdRef.current = null;
    }
  }, [dockRef, enabled, maxScale, radius, position, isVertical, isDragging]);

  const startLoop = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(updateItems);
    }
  }, [updateItems]);

  const onPointerEnter = useCallback(() => {
    isHoveredRef.current = true;
    startLoop();
  }, [startLoop]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      isHoveredRef.current = true;
      pointerCoordRef.current = isVertical ? e.clientY : e.clientX;
      startLoop();
    },
    [isVertical, startLoop]
  );

  const onPointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    pointerCoordRef.current = null;
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    if (!enabled || isDragging) {
      isHoveredRef.current = false;
      pointerCoordRef.current = null;
      startLoop();
    }
  }, [enabled, isDragging, startLoop]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return {
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
    hoveredItem,
  };
};

export default useDockMagnification;
