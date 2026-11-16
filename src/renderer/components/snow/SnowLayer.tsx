import React, { useEffect, useRef } from 'react';
import { useConfigStore } from '../../store/configStore';
import { DEFAULT_SNOW_CONFIG } from '../../../shared/constants';
import { getSnowEngine } from './snowEngine';
import './snow.css';

const SnowLayer: React.FC = () => {
  const snow = useConfigStore((s) => s.dock.snow);
  const initialized = useConfigStore((s) => s.initialized);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const enabled = snow?.enabled ?? DEFAULT_SNOW_CONFIG.enabled;
  const intensity = snow?.intensity ?? DEFAULT_SNOW_CONFIG.intensity;
  const snowballs = snow?.snowballs ?? DEFAULT_SNOW_CONFIG.snowballs;
  const onWindows = snow?.onWindows ?? DEFAULT_SNOW_CONFIG.onWindows;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const engine = getSnowEngine();
    engine.attach(container, canvas);
    return () => engine.detach();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    getSnowEngine().configure({ enabled, intensity, snowballs, onWindows });
  }, [initialized, enabled, intensity, snowballs, onWindows]);

  return (
    <div ref={containerRef} className="snow-layer" style={{ display: 'none' }}>
      <canvas ref={canvasRef} className="snow-canvas" />
    </div>
  );
};

export default SnowLayer;
