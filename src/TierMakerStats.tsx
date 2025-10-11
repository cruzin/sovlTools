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
const tierColors: Record<string, string> = {
  S: '#ffe066', // Yellow
  A: '#7fff7f', // Green
  B: '#7fdfff', // Light Blue
  C: '#bcbcff', // Light Purple
  D: '#ffb366', // Orange
  E: '#ff8888', // Light Red
  F: '#ff3333', // Red
};
// Helper: grade <-> number
const gradeToNum: Record<string, number> = {
  S: 7,
  A: 6,
  B: 5,
  C: 4,
  D: 3,
  E: 2,
  F: 1,
};
const numToGrade = (num: number) => {
  if (num >= 6.5) return 'S';
  if (num >= 5.5) return 'A';
  if (num >= 4.5) return 'B';
  if (num >= 3.5) return 'C';
  if (num >= 2.5) return 'D';
  if (num >= 1.5) return 'E';
  return 'F';
};

const TierMakerStats: React.FC = () => {
  const [importedLists, setImportedLists] = useState<TierState[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importValue, setImportValue] = useState('');

  // Import: Parse JSON and add to importedLists
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importValue);
      if (
        typeof parsed === 'object' &&
        tierLabels.every((label) => Array.isArray(parsed[label]))
      ) {
        setImportedLists((prev) => [...prev, parsed]);
        setImportValue(''); // Clear textarea but keep import UI open
      } else {
        alert('Invalid format.');
      }
    } catch {
      alert('Invalid JSON.');
    }
  };

  // Compute average for each icon
  const iconAverages: Record<
    string,
    { avg: number; grade: string; allGrades: string[] }
  > = {};
  iconFilenames.forEach((icon) => {
    const grades: number[] = [];
    importedLists.forEach((list) => {
      for (const label of tierLabels) {
        if (list[label].includes(icon)) grades.push(gradeToNum[label]);
      }
    });
    if (grades.length > 0) {
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
      iconAverages[icon] = {
        avg,
        grade: numToGrade(avg),
        allGrades: grades.map(
          (n) =>
            Object.keys(gradeToNum).find((k) => gradeToNum[k] === n) || '?',
        ),
      };
    } else {
      iconAverages[icon] = { avg: 0, grade: '-', allGrades: [] };
    }
  });

  // Group icons by their average grade for final outcome rows
  const iconsByGrade: Record<string, string[]> = {};
  tierLabels.forEach((label) => {
    iconsByGrade[label] = [];
  });
  iconFilenames.forEach((icon) => {
    const grade = iconAverages[icon].grade;
    if (tierLabels.includes(grade)) {
      iconsByGrade[grade].push(icon);
    }
  });

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
      <h2 style={{ color: '#E3C66A', marginBottom: 24 }}>
        TierMaker Stats: Average Grades
      </h2>
      <div
        style={{
          marginBottom: 24,
          background: '#1E2D30',
          border: '2px solid #101C1F',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 2px 8px #101C1F',
        }}
      >
        <button
          onClick={() => setShowImport((v) => !v)}
          style={{
            padding: '10px 24px',
            fontSize: 16,
            background: '#3B6A71',
            color: '#FFD86E',
            border: '1px solid #101C1F',
            borderRadius: 6,
            marginRight: 12,
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#2A4E53')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#3B6A71')}
        >
          {showImport ? 'Hide Import' : 'Import from Text'}
        </button>
        {showImport && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 8,
            }}
          >
            <textarea
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              rows={3}
              style={{
                width: 400,
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
              onMouseOut={(e) => (e.currentTarget.style.background = '#3B6A71')}
            >
              Import
            </button>
            <div style={{ fontSize: 13, color: '#E3C66A' }}>
              Imported lists: {importedLists.length}
            </div>
          </div>
        )}
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#1E2D30',
          color: '#E3C66A',
          border: '2px solid #101C1F',
          borderRadius: 10,
          boxShadow: '0 2px 8px #101C1F',
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: '2px solid #101C1F', padding: 8 }}>
              Icon
            </th>
            <th style={{ borderBottom: '2px solid #101C1F', padding: 8 }}>
              Name
            </th>
            <th style={{ borderBottom: '2px solid #101C1F', padding: 8 }}>
              All Grades
            </th>
            <th style={{ borderBottom: '2px solid #101C1F', padding: 8 }}>
              Average
            </th>
          </tr>
        </thead>
        <tbody>
          {iconFilenames.map((icon) => (
            <tr key={icon}>
              <td style={{ padding: 8, textAlign: 'center' }}>
                <img
                  src={getAssetUrl(icon)}
                  alt={icon}
                  style={{
                    width: 100,
                    height: 100,
                    background: '#2A4E53',
                    borderRadius: 4,
                    border: '1px solid #101C1F',
                  }}
                />
              </td>
              <td style={{ padding: 8 }}>{icon.replace('.png', '')}</td>
              <td style={{ padding: 8 }}>
                {iconAverages[icon].allGrades.join(', ') || '-'}
              </td>
              <td
                style={{
                  padding: 8,
                  fontWeight: 'bold',
                  color: tierColors[iconAverages[icon].grade] || '#FFD86E',
                }}
              >
                {iconAverages[icon].grade}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Final outcome in rows, like TierMaker */}
      <div style={{ marginTop: 48 }}>
        <h3 style={{ color: '#FFD86E', marginBottom: 16 }}>
          Final Outcome (Averaged Tier List)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tierLabels.map((label) => (
            <div
              key={label}
              style={{
                minWidth: 1200,
                maxWidth: 1200,
                minHeight: 100,
                height: 100,
                background: '#1E2D30',
                borderBottom: '2px solid #101C1F',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                padding: 4, // reduced from 8
                gap: 8,
              }}
            >
              <span
                style={{
                  fontWeight: 'bold',
                  fontSize: 20,
                  width: 32,
                  color: tierColors[label],
                }}
              >
                {label}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {iconsByGrade[label].map((icon) => (
                  <img
                    key={icon}
                    src={getAssetUrl(icon)}
                    alt={icon}
                    style={{
                      width: 90,
                      height: 90,
                      cursor: 'default',
                      border: '1px solid #101C1F',
                      borderRadius: 4,
                      background: '#2A4E53',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* Unassigned row for icons not in any grade */}
          <div
            style={{
              minWidth: 1200,
              maxWidth: 1200,
              minHeight: 100,
              height: 100,
              background: '#101C1F',
              borderBottom: '2px solid #101C1F',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              padding: 4, // reduced from 8
              gap: 8,
              marginTop: 16,
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
              {iconFilenames
                .filter((icon) => iconAverages[icon].grade === '-')
                .map((icon) => (
                  <img
                    key={icon}
                    src={getAssetUrl(icon)}
                    alt={icon}
                    style={{
                      width: 90,
                      height: 90,
                      cursor: 'default',
                      border: '1px solid #101C1F',
                      borderRadius: 4,
                      background: '#2A4E53',
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierMakerStats;
