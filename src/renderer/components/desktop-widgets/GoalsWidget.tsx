import React, { useState } from 'react';
import { DesktopWidgetSize } from '../../../shared/constants';
import { IconPencil, IconPlus, IconClose } from '../Icons';

interface Goal {
  id: string;
  title: string;
  progress: number;
}

interface GoalsData {
  goals?: Goal[];
}

interface GoalsWidgetProps {
  size: DesktopWidgetSize;
  data?: GoalsData;
  onUpdateData: (patch: Partial<GoalsData>) => void;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ size, data, onUpdateData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const goals = data?.goals || [];

  const updateGoal = (id: string, patch: Partial<Goal>) => {
    onUpdateData({ goals: goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  };

  const removeGoal = (id: string) => {
    onUpdateData({ goals: goals.filter((g) => g.id !== id) });
  };

  const addGoal = () => {
    if (!newTitle.trim() || goals.length >= 5) return;
    onUpdateData({ goals: [...goals, { id: `goal-${Date.now()}`, title: newTitle.trim(), progress: 0 }] });
    setNewTitle('');
  };

  const barMax = size === 'large' ? 5 : size === 'medium' ? 5 : 4;
  const visibleGoals = isEditing ? goals : goals.slice(0, barMax);

  if (isEditing) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px', overflowY: 'auto' }}
      >
        {goals.map((g) => (
          <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                value={g.title}
                onChange={(e) => updateGoal(g.id, { title: e.target.value })}
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#ffffff', fontSize: '11px', fontWeight: 600, outline: 'none' }}
              />
              <button onClick={() => removeGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <IconClose size={10} color="rgba(255,255,255,0.5)" />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={g.progress}
                onChange={(e) => updateGoal(g.id, { progress: Number(e.target.value) })}
                style={{ flex: 1, accentColor: '#0a84ff' }}
              />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', minWidth: '28px', textAlign: 'right' }}>{g.progress}%</span>
            </div>
          </div>
        ))}

        {goals.length < 5 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              placeholder="New goal"
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '6px 8px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
            />
            <button
              onClick={addGoal}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', borderRadius: '8px', border: 'none', background: '#0a84ff', color: '#ffffff', cursor: 'pointer' }}
            >
              <IconPlus size={11} />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsEditing(false)}
          style={{ padding: '6px 0', fontSize: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer' }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', justifyContent: goals.length ? 'flex-start' : 'center', gap: '8px', cursor: 'pointer' }}
    >
      {visibleGoals.length ? (
        visibleGoals.map((g) => (
          <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{g.progress}%</span>
            </div>
            <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${g.progress}%`, borderRadius: '2px', background: '#0a84ff' }} />
            </div>
          </div>
        ))
      ) : (
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Click to add goals</span>
      )}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconPencil size={11} color="rgba(255,255,255,0.85)" />
        </div>
      )}
    </div>
  );
};
