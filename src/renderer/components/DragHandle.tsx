import React from 'react';

const DragHandle: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      marginRight: '6px',
      cursor: 'grab',
      opacity: 0.5
    }}>
      <div style={{ width: '4px', height: '4px', background: 'white', borderRadius: '50%' }} />
      <div style={{ width: '4px', height: '4px', background: 'white', borderRadius: '50%' }} />
      <div style={{ width: '4px', height: '4px', background: 'white', borderRadius: '50%' }} />
    </div>
  );
};

export default DragHandle;
