import React, { useEffect, useState } from 'react';

const tierLabels = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
const commanderIcons = [
  'AbyssalPrince.png',
  'AbyssalHerald.png',
  'AbyssalChampion.png',
  'AbyssalSorcerer.png',
  'NorthmenPackleader.png',
  'DarkbornNoble.png',
  'DarkbornPriestess.png',
  'DarkbornAssassin.png',
  'WightLord.png',
  'VampireKnight.png',
  'Necromancer.png',
  'DeepwoodNoble.png',
  'DeepwoodDruid.png',
  'TreantElder.png',
  'DwarfForeman.png',
  'RangerCaptain.png',
  'DwarfEngineer.png',
  'ElfNoble.png',
  'ElfMage.png',
  'ElfSpellsword.png',
  'Captain.png',
  'KnightCommander.png',
  'ImperialWizard.png',
  'GoatmanShaman.png',
  'GoatmanLonghorn.png',
  'MinotaurLord.png',
  'WarChief.png',
  'GoblinShaman.png',
  'GoblinKing.png',
  'Maiden.png',
  'Paladin.png',
  'RatkinWarlock.png',
  'RatkinChieftain.png',
  'RatkinInfiltrator.png',
  'NewtPriest.png',
  'SaurianWarlord.png',
  'AncientToad.png',
];

const getAssetUrl = (filename: string) => `/assets/commanders/${filename}`;
type TierState = Record<string, string[]>;

const tierColors: Record<string, string> = {
  S: '#ffe066',
  A: '#7fff7f',
  B: '#7fdfff',
  C: '#bcbcff',
  D: '#ffb366',
  E: '#ff8888',
  F: '#ff3333',
};

const LOCAL_STORAGE_KEY = 'sovlstuff-tierlist-commanders';

function getInitialTiers(): TierState {
  const tiers: TierState = Object.fromEntries(
    tierLabels.map((label) => [label, []]),
  );
  tiers.Unassigned = [...commanderIcons];
  return tiers;
}

function parseTierList(value: string): TierState | null {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object') return null;

  const record = parsed as Record<string, unknown>;
  if (!tierLabels.every((label) => Array.isArray(record[label]))) return null;

  const seen = new Set<string>();
  const tiers: TierState = {};
  tierLabels.forEach((label) => {
    tiers[label] = (record[label] as unknown[]).filter(
      (icon): icon is string =>
        typeof icon === 'string' &&
        commanderIcons.includes(icon) &&
        !seen.has(icon) &&
        Boolean(seen.add(icon)),
    );
  });
  tiers.Unassigned = commanderIcons.filter((icon) => !seen.has(icon));
  return tiers;
}

const TierMakerCommanders: React.FC = () => {
  const [tiers, setTiers] = useState<TierState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? parseTierList(saved) ?? getInitialTiers() : getInitialTiers();
    } catch {
      return getInitialTiers();
    }
  });
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importValue, setImportValue] = useState('');

  const onDrop = (tier: string) => {
    if (!draggedIcon) return;
    const next = Object.fromEntries(
      Object.entries(tiers).map(([label, icons]) => [
        label,
        icons.filter((icon) => icon !== draggedIcon),
      ]),
    );
    next[tier] = [...next[tier], draggedIcon];
    setTiers(next);
    setDraggedIcon(null);
  };

  const exportTiers = () =>
    Object.fromEntries(tierLabels.map((label) => [label, tiers[label]]));

  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportTiers()));
      alert('Commander tier list copied to clipboard!');
    } catch {
      alert('Could not copy the tier list to the clipboard.');
    }
  };

  const handleImport = () => {
    try {
      const imported = parseTierList(importValue);
      if (!imported) {
        alert('Invalid format.');
        return;
      }
      setTiers(imported);
      setShowImport(false);
      setImportValue('');
    } catch {
      alert('Invalid JSON.');
    }
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exportTiers()));
  }, [tiers]);

  const renderIcon = (icon: string) => (
    <img
      key={icon}
      src={getAssetUrl(icon)}
      alt={icon.replace('.png', '')}
      title={icon.replace('.png', '').replace(/([a-z])([A-Z])/g, '$1 $2')}
      draggable
      onDragStart={() => setDraggedIcon(icon)}
      style={{
        width: 100,
        height: 100,
        cursor: 'grab',
        border: '1px solid #101C1F',
        borderRadius: 4,
        background: '#2A4E53',
      }}
    />
  );

  const buttonStyle: React.CSSProperties = {
    padding: '10px 24px',
    fontSize: 16,
    background: '#3B6A71',
    color: '#FFD86E',
    border: '1px solid #101C1F',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
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
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragOverTier(label);
            }}
            onDragLeave={() =>
              setDragOverTier((current) => (current === label ? null : current))
            }
            style={{
              minHeight: 120,
              background: '#1E2D30',
              borderBottom: '2px solid #101C1F',
              display: 'flex',
              alignItems: 'center',
              padding: 8,
              gap: 8,
            }}
          >
            <span
              style={{
                flex: '0 0 32px',
                fontWeight: 'bold',
                fontSize: 20,
                color: tierColors[label],
                textShadow:
                  dragOverTier === label
                    ? `0 0 16px ${tierColors[label]}, 0 0 32px ${tierColors[label]}`
                    : 'none',
              }}
            >
              {label}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tiers[label].map(renderIcon)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, background: '#101C1F', borderRadius: 8, padding: 12 }}>
        <div
          onDrop={() => onDrop('Unassigned')}
          onDragOver={(event) => event.preventDefault()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 56 }}
        >
          <span style={{ flex: '0 0 90px', fontWeight: 'bold', color: '#bbb' }}>
            Unassigned
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tiers.Unassigned.map(renderIcon)}
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
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={buttonStyle}>Export to Clipboard</button>
          <button onClick={() => setShowImport((value) => !value)} style={buttonStyle}>
            {showImport ? 'Cancel Import' : 'Import from Text'}
          </button>
          <button
            onClick={() => {
              setTiers(getInitialTiers());
              setShowImport(false);
              setImportValue('');
            }}
            style={buttonStyle}
          >
            Reset
          </button>
          {showImport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={importValue}
                onChange={(event) => setImportValue(event.target.value)}
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
                placeholder="Paste exported commander tier-list JSON here"
              />
              <button onClick={handleImport} style={buttonStyle}>Import</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TierMakerCommanders;
