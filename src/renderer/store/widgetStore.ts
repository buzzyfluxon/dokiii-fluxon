import { create } from 'zustand';
import { WidgetId, DEFAULT_ENABLED_WIDGETS, WIDGET_REGISTRY } from '../../shared/constants';
import type { NoteData } from '../types/widget';

interface WidgetState {
  enabledWidgets: WidgetId[];
  widgetOrder: WidgetId[];
  notes: NoteData[];
  initialized: boolean;
  toggleWidget: (id: WidgetId) => void;
  removeWidget: (id: WidgetId) => void;
  reorderWidgets: (newOrder: WidgetId[]) => void;
  addNote: (note: NoteData) => void;
  updateNote: (id: string, data: Partial<NoteData>) => void;
  deleteNote: (id: string) => void;
  setEnabledWidgets: (widgets: WidgetId[]) => void;
  init: () => Promise<void>;
}

const persist = (data: Partial<{ enabledWidgets: WidgetId[]; widgetOrder: WidgetId[]; notes: NoteData[] }>) => {
  try {
    window.electronAPI?.saveConfig(data);
  } catch (_) {}
};

export const useWidgetStore = create<WidgetState>((set, get) => ({
  enabledWidgets: [],
  widgetOrder: [],
  notes: [],
  initialized: false,
  toggleWidget: (id) => {
    const { enabledWidgets, widgetOrder } = get();
    const isEnabled = enabledWidgets.includes(id);
    const newEnabled = isEnabled
      ? enabledWidgets.filter((w) => w !== id)
      : Array.from(new Set([...enabledWidgets, id]));
    const newOrder = widgetOrder.includes(id)
      ? widgetOrder
      : Array.from(new Set([...widgetOrder, id]));
    set({ enabledWidgets: newEnabled, widgetOrder: newOrder });
    persist({ enabledWidgets: newEnabled, widgetOrder: newOrder });
  },
  removeWidget: (id) => {
    const { enabledWidgets, widgetOrder } = get();
    const newEnabled = enabledWidgets.filter((w) => w !== id);
    set({ enabledWidgets: newEnabled });
    persist({ enabledWidgets: newEnabled, widgetOrder });
  },
  reorderWidgets: (newOrder) => {
    const cleanOrder = Array.from(new Set(newOrder));
    set({ widgetOrder: cleanOrder });
    persist({ widgetOrder: cleanOrder });
  },
  addNote: (note) => {
    const newNotes = [...get().notes, note];
    set({ notes: newNotes });
    persist({ notes: newNotes });
  },
  updateNote: (id, data) => {
    const newNotes = get().notes.map((n) => (n.id === id ? { ...n, ...data } : n));
    set({ notes: newNotes });
    persist({ notes: newNotes });
  },
  deleteNote: (id) => {
    const newNotes = get().notes.filter((n) => n.id !== id);
    set({ notes: newNotes });
    persist({ notes: newNotes });
  },
  setEnabledWidgets: (widgets) => {
    set({ enabledWidgets: widgets });
    persist({ enabledWidgets: widgets });
  },
  init: async () => {
    const allRegisteredIds = WIDGET_REGISTRY.map((w) => w.id);
    try {
      const config = await window.electronAPI.getConfig();
      const rawEnabled = config?.enabledWidgets || DEFAULT_ENABLED_WIDGETS;
      const validEnabled = Array.from(new Set(rawEnabled)).filter((id): id is WidgetId =>
        allRegisteredIds.includes(id as WidgetId)
      );

      const rawOrder = config?.widgetOrder || allRegisteredIds;
      const validOrder = Array.from(new Set(rawOrder)).filter((id): id is WidgetId =>
        allRegisteredIds.includes(id as WidgetId)
      );

      const missingFromOrder = allRegisteredIds.filter((id) => !validOrder.includes(id));
      const finalOrder = [...validOrder, ...missingFromOrder];

      set({
        enabledWidgets: validEnabled.length ? validEnabled : DEFAULT_ENABLED_WIDGETS,
        widgetOrder: finalOrder,
        notes: config?.notes || [],
        initialized: true,
      });
    } catch (_) {
      set({
        enabledWidgets: [...DEFAULT_ENABLED_WIDGETS],
        widgetOrder: [...allRegisteredIds],
        notes: [],
        initialized: true,
      });
    }
  },
}));
