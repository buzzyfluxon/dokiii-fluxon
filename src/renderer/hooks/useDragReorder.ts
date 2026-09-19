import { useState } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { WidgetId } from '../../shared/constants';

export const useDragReorder = () => {
  const { widgetOrder, reorderWidgets } = useWidgetStore();
  const [draggedId, setDraggedId] = useState<WidgetId | null>(null);
  const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);

  const dragProps = (id: WidgetId) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDraggedId(id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverId !== id) {
        setDragOverId(id);
      }
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }
      const newOrder = [...widgetOrder];
      const fromIdx = newOrder.indexOf(draggedId);
      const toIdx = newOrder.indexOf(id);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [removed] = newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, removed);
        reorderWidgets(newOrder);
      }
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  return {
    dragProps,
    isDragging: draggedId !== null,
    dragOverId,
    draggedId,
  };
};
