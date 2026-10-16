import React from 'react';

interface FitBoxProps {
  width: number;
  height: number;
  designWidth: number;
  designHeight: number;
  children: React.ReactNode;
}

export const FitBox: React.FC<FitBoxProps> = ({ width, height, designWidth, designHeight, children }) => {
  const scale = Math.min(width / designWidth, height / designHeight);
  return (
    <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${designWidth}px`,
          height: `${designHeight}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default FitBox;
