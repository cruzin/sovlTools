import React, { useState } from 'react';

const tierLabels = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
const iconFilenames = [
  'AbyssalChampion.png',
  'AbyssalDemonPlaceHolder.png',
  'ConclaveElfNoble.png',
  'DarkbornPriestess.png',
  'DwarfForeman.png',
  'GoblinShaman.png',
  'ImperialCaptain.png',
  'MinotaurLord.png',
  'NewtPriest.png',
  'RatkinWarlock.png',
  'TreantElder.png',
  'VampireKnight.png',
];

const getAssetUrl = (filename: string) => `/assets/${filename}`;

type TierState = Record<string, string[]>;

function getInitialTiers(): TierState {
  const tiers: TierState = {};
  tierLabels.forEach((label) => {
    tiers[label] = [];
  });
  tiers['Unassigned'] = [...iconFilenames];
  return tiers;
}

const tierColors: Record<string, string> = {
  S: '#ffe066', // Yellow
  A: '#7fff7f', // Green
  B: '#7fdfff', // Light Blue
  C: '#bcbcff', // Light Purple
  D: '#ffb366', // Orange
  E: '#ff8888', // Light Red
  F: '#ff3333', // Red
};

const LOCAL_STORAGE_KEY = 'sovlstuff-tierlist';

const TierMaker: React.FC = () => {
  // Load from localStorage if available
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed === 'object' &&
          tierLabels.every((label) => Array.isArray(parsed[label]))
        ) {
          // Remove all icons from all tiers
          const allAssigned = tierLabels.flatMap((label) => parsed[label]);
          const unassigned = iconFilenames.filter(
            (icon) => !allAssigned.includes(icon),
          );
          const newTiers: TierState = {};
          tierLabels.forEach((label) => {
            newTiers[label] = parsed[label];
          });
          newTiers['Unassigned'] = unassigned;
          return newTiers;
        }
      }
    } catch {}
    return getInitialTiers();
  };

  const [tiers, setTiers] = useState<TierState>(getInitialState());
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importValue, setImportValue] = useState('');
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);

  const onDragStart = (icon: string) => {
    setDraggedIcon(icon);
  };

  const onDrop = (tier: string) => {
    if (!draggedIcon) return;
    // Remove from all tiers
    const newTiers: TierState = {};
    Object.entries(tiers).forEach(([label, icons]) => {
      newTiers[label] = icons.filter((i) => i !== draggedIcon);
    });
    // Add to target tier
    newTiers[tier] = [...newTiers[tier], draggedIcon];
    setTiers(newTiers);
    setDraggedIcon(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Export: Copy current assignments to clipboard as JSON
  const handleExport = async () => {
    // Only export S-F, ignore Unassigned
    const exportData: Record<string, string[]> = {};
    tierLabels.forEach((label) => {
      exportData[label] = tiers[label];
    });
    await navigator.clipboard.writeText(JSON.stringify(exportData));
    alert('Tier list copied to clipboard!');
  };

  // Import: Parse JSON and update state
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importValue);
      // Validate structure
      if (
        typeof parsed === 'object' &&
        tierLabels.every((label) => Array.isArray(parsed[label]))
      ) {
        // Remove all icons from all tiers
        const allAssigned = tierLabels.flatMap((label) => parsed[label]);
        const unassigned = iconFilenames.filter(
          (icon) => !allAssigned.includes(icon),
        );
        const newTiers: TierState = {};
        tierLabels.forEach((label) => {
          newTiers[label] = parsed[label];
        });
        newTiers['Unassigned'] = unassigned;
        setTiers(newTiers);
        setShowImport(false);
        setImportValue('');
      } else {
        alert('Invalid format.');
      }
    } catch {
      alert('Invalid JSON.');
    }
  };

  // Save to localStorage on change
  React.useEffect(() => {
    const exportData: Record<string, string[]> = {};
    tierLabels.forEach((label) => {
      exportData[label] = tiers[label];
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exportData));
  }, [tiers]);

  // Reset to initial state
  const handleReset = () => {
    setTiers(getInitialTiers());
    setShowImport(false);
    setImportValue('');
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: 'auto',
        padding: 24,
        background: '#2A4E53',
        minHeight: '100vh',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tierLabels.map((label) => (
          <div
            key={label}
            onDrop={() => {
              onDrop(label);
              setDragOverTier(null);
            }}
            onDragOver={(e) => {
              onDragOver(e);
              setDragOverTier(label);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOverTier(label);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOverTier((prev) => (prev === label ? null : prev));
            }}
            style={{
              minWidth: 1200,
              maxWidth: 1200,
              minHeight: 120, // Ensure min height for icon rows
              background: '#1E2D30',
              borderBottom: '2px solid #101C1F',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              padding: 8,
              gap: 8,
            }}
          >
            <span
              style={{
                fontWeight: 'bold',
                fontSize: 20,
                width: 32,
                color: tierColors[label],
                transition: 'text-shadow 0.2s',
                textShadow:
                  dragOverTier === label
                    ? `0 0 16px ${tierColors[label]}, 0 0 32px ${tierColors[label]}`
                    : 'none',
              }}
            >
              {label}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {tiers[label].map((icon) => (
                <img
                  key={icon}
                  src={getAssetUrl(icon)}
                  alt={icon}
                  draggable
                  onDragStart={() => onDragStart(icon)}
                  style={{
                    width: 100,
                    height: 100,
                    cursor: 'grab',
                    border: '1px solid #101C1F',
                    borderRadius: 4,
                    background: '#2A4E53',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 32,
          background: '#101C1F',
          borderRadius: 8,
          padding: 12,
        }}
      >
        <div
          onDrop={() => onDrop('Unassigned')}
          onDragOver={onDragOver}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 56,
          }}
        >
          <span
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              width: 90,
              color: '#bbb',
            }}
          >
            Unassigned
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tiers['Unassigned'].map((icon) => (
              <img
                key={icon}
                src={getAssetUrl(icon)}
                alt={icon}
                draggable
                onDragStart={() => onDragStart(icon)}
                style={{
                  width: 100,
                  height: 100,
                  cursor: 'grab',
                  border: '1px solid #101C1F',
                  borderRadius: 4,
                  background: '#2A4E53',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 32,
          background: '#1E2D30',
          border: '2px solid #101C1F',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 2px 8px #101C1F',
        }}
      >
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <button
            onClick={handleExport}
            style={{
              padding: '10px 24px',
              fontSize: 16,
              background: '#3B6A71',
              color: '#FFD86E',
              border: '1px solid #101C1F',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#2A4E53')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#3B6A71')}
          >
            Export to Clipboard
          </button>
          <button
            onClick={() => setShowImport((v) => !v)}
            style={{
              padding: '10px 24px',
              fontSize: 16,
              background: '#3B6A71',
              color: '#FFD86E',
              border: '1px solid #101C1F',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#2A4E53')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#3B6A71')}
          >
            {showImport ? 'Cancel Import' : 'Import from Text'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 24px',
              fontSize: 16,
              background: '#3B6A71',
              color: '#FFD86E',
              border: '1px solid #101C1F',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#2A4E53')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#3B6A71')}
          >
            Reset
          </button>
          {showImport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                rows={3}
                style={{
                  width: 300,
                  fontSize: 14,
                  background: '#2A4E53',
                  color: '#FFD86E',
                  border: '1px solid #101C1F',
                  borderRadius: 6,
                  padding: 8,
                }}
                placeholder="Paste exported JSON here"
              />
              <button
                onClick={handleImport}
                style={{
                  padding: '8px 18px',
                  fontSize: 15,
                  background: '#3B6A71',
                  color: '#FFD86E',
                  border: '1px solid #101C1F',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = '#2A4E53')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = '#3B6A71')
                }
              >
                Import
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TierMaker;
