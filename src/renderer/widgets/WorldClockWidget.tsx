import React, { useState, useEffect } from 'react';
import { usePopover } from '../App';
import { IconClose } from '../components/Icons';
import { DEFAULT_WORLD_CLOCK_CITIES } from '../../shared/constants';

interface CityItem {
  name: string;
  timezone: string;
}

import { useMinuteTick } from '../store/timeStore';

export const WorldClockWidget: React.FC = () => {
  const { activePopover, openPopover, closePopover } = usePopover();
  const isPopoverOpen = activePopover === 'world-clock';

  const [cities, setCities] = useState<CityItem[]>(() => {
    try {
      const saved = localStorage.getItem('flowdock_world_clock');
      return saved ? JSON.parse(saved) : DEFAULT_WORLD_CLOCK_CITIES;
    } catch {
      return DEFAULT_WORLD_CLOCK_CITIES;
    }
  });

  const { now } = useMinuteTick();
  const [newCityName, setNewCityName] = useState('');
  const [newCityTimezone, setNewCityTimezone] = useState('');

  const saveCities = (updated: CityItem[]) => {
    setCities(updated);
    try {
      localStorage.setItem('flowdock_world_clock', JSON.stringify(updated));
    } catch {}
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPopoverOpen) {
      closePopover();
    } else {
      openPopover('world-clock');
    }
  };

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCityName.trim() && newCityTimezone.trim()) {
      const updated = [...cities, { name: newCityName.trim(), timezone: newCityTimezone.trim() }];
      saveCities(updated);
      setNewCityName('');
      setNewCityTimezone('');
    }
  };

  const handleRemoveCity = (index: number) => {
    const updated = cities.filter((_, i) => i !== index);
    saveCities(updated);
  };

  return (
    <div className="world-clock-widget" onClick={handleToggle} title="World Clock">
      {cities.slice(0, 3).map((city, index) => {
        let timeString = '--:--';
        try {
          timeString = new Intl.DateTimeFormat(undefined, {
            timeZone: city.timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(now);
        } catch {}

        return (
          <div key={index} className="clock-city-row">
            <span className="clock-city-name">{city.name}</span>
            <span className="clock-city-time">{timeString}</span>
          </div>
        );
      })}

      {isPopoverOpen && (
        <div className="popover" onClick={(e) => e.stopPropagation()} style={{ width: '260px' }}>
          <div className="popover-header">
            <span className="popover-title">World Clocks</span>
            <button className="popover-close" onClick={closePopover} title="Close">
              <IconClose size={10} />
            </button>
          </div>
          <div className="city-list">
            {cities.map((city, index) => {
              let timeStr = '--:--';
              try {
                timeStr = new Intl.DateTimeFormat(undefined, {
                  timeZone: city.timezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }).format(now);
              } catch {}

              return (
                <div key={index} className="city-item">
                  <span style={{ fontSize: '10px', color: 'var(--text-primary)' }}>{city.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600 }}>{timeStr}</span>
                    <button className="city-remove" onClick={() => handleRemoveCity(index)} title="Remove">
                      <IconClose size={9} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddCity} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              className="search-input"
              placeholder="City (e.g. Paris)"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="Timezone (e.g. Europe/Paris)"
              value={newCityTimezone}
              onChange={(e) => setNewCityTimezone(e.target.value)}
            />
            <button
              type="submit"
              className="btn"
              style={{
                background: 'var(--accent)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '10px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              Add City
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorldClockWidget;
