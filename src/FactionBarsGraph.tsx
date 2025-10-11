import React, { useState, useEffect, useMemo } from 'react';
import factionsData from '../assets/factions.json';
import { factionBackgroundColors } from './factionBackgroundColors';

interface Faction {
  name: string;
  icon: string;
  color1: string;
  color2: string;
}

type SortMode = 'none' | 'number';

const STORAGE_KEY = 'factionBarValues';

function getBarValues(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setBarValues(values: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

function getFactionColors(factionName: string) {
  const cleanName = factionName.replace(/\s*\(.*\)\s*/, '').trim();
  return (
    factionBackgroundColors[cleanName] || { primary: '#222', secondary: '#444' }
  );
}

const minHeight = 20;
const maxHeight = 400;

export const FactionBarsGraph: React.FC = () => {
  const [barValues, setBarValuesState] =
    useState<Record<string, number>>(getBarValues());
  const [sortMode, setSortMode] = useState<SortMode>('number');

  useEffect(() => {
    setBarValues(barValues);
  }, [barValues]);

  const factions = useMemo(
    () =>
      (factionsData as Faction[]).map((f) => ({
        ...f,
        value: barValues[f.name] ?? 0,
      })),
    [barValues],
  );
  const visibleFactions = useMemo(
    () => factions.filter((f) => f.value > 0),
    [factions],
  );
  const maxValue = useMemo(
    () =>
      visibleFactions.length > 0
        ? Math.max(...visibleFactions.map((f) => f.value))
        : 1,
    [visibleFactions],
  );

  const sortedFactions = useMemo(() => {
    if (sortMode === 'number') {
      return [...visibleFactions].sort((a, b) => b.value - a.value);
    }
    return visibleFactions;
  }, [visibleFactions, sortMode]);

  const updateValue = (name: string, delta: number) => {
    setBarValuesState((prev) => {
      return { ...prev, [name]: Math.max(0, (prev[name] ?? 0) + delta) };
    });
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: 'auto',
        padding: 32,
        background: '#2A4E53',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          background: '#1E2D30',
          border: '2px solid #101C1F',
          borderRadius: 10,
          padding: 24,
          boxShadow: '0 2px 8px #101C1F',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#E3C66A' }}>Sort:</span>
          <label>
            <input
              type="radio"
              name="faction-sort"
              value="none"
              checked={sortMode === 'none'}
              onChange={() => setSortMode('none')}
            />
            <span style={{ color: '#E3C66A' }}>No sorting</span>
          </label>
          <label>
            <input
              type="radio"
              name="faction-sort"
              value="number"
              checked={sortMode === 'number'}
              onChange={() => setSortMode('number')}
            />
            <span style={{ color: '#E3C66A' }}>Sort by number</span>
          </label>
        </div>
        <div
          className="faction-bar-row"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            margin: '32px 0',
          }}
        >
          {sortedFactions.map((faction) => {
            const colors = getFactionColors(faction.name);
            const barHeight =
              minHeight + ((maxHeight - minHeight) * faction.value) / maxValue;
            return (
              <div
                className="faction-bar"
                key={faction.name}
                style={{
                  minWidth: 64,
                  maxWidth: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  margin: '0 16px',
                }}
              >
                <div
                  className="bar"
                  style={{
                    width: 48,
                    height: barHeight,
                    background: `linear-gradient(135deg, ${colors.primary} 0 50%, ${colors.secondary} 50% 100%)`,
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    justifyContent: 'flex-start',
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 8,
                    transition: 'height 0.2s',
                  }}
                >
                  <div
                    className="bar-fill"
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0,0,0,0.2)',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                    }}
                  />
                  <span
                    className="bar-label"
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 0,
                      width: '100%',
                      textAlign: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px #000',
                    }}
                  >
                    {faction.value}
                  </span>
                </div>
                <img
                  src={`/assets/${faction.icon}`}
                  alt={faction.name}
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: 'contain',
                    margin: '12px auto',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '4px 0',
                  }}
                >
                  <button onClick={() => updateValue(faction.name, -1)}>
                    <span
                      style={{
                        color: '#E3C66A',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                      }}
                    >
                      -
                    </span>
                  </button>
                  <button onClick={() => updateValue(faction.name, 1)}>
                    <span
                      style={{
                        color: '#E3C66A',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                      }}
                    >
                      +
                    </span>
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '4px 0',
                  }}
                >
                  <button onClick={() => updateValue(faction.name, -1)}>
                    <span
                      style={{
                        color: '#c00',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                      }}
                    >
                      -
                    </span>
                  </button>
                  <button onClick={() => updateValue(faction.name, 1)}>
                    <span
                      style={{
                        color: '#c00',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                      }}
                    >
                      +
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
