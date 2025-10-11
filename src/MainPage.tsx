import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { FactionBarsGraph } from './FactionBarsGraph';
import CombatOutComeCalculator from './CombatOutComeCalculator';
import QuickProbability from './QuickProbability';
import EloCalculator from './EloCalculator';
import TierMaker from './TierMaker';
import TierMakerStats from './TierMakerStats';

const TOOLS = [
  {
    key: 'faction',
    label: 'Faction Bars Graph',
    path: '/faction',
    component: <FactionBarsGraph />,
  },
  {
    key: 'combat',
    label: 'Combat Outcome Calculator',
    path: '/combat',
    component: <CombatOutComeCalculator />,
  },
  {
    key: 'prob',
    label: 'Quick Probability Visualizer',
    path: '/prob',
    component: <QuickProbability />,
  },
  {
    key: 'elo',
    label: 'Elo Calculator',
    path: '/elo',
    component: <EloCalculator />,
  },
  {
    key: 'tier',
    label: 'Tier Maker',
    path: '/tier',
    component: <TierMaker />,
  },
  {
    key: 'tierstats',
    label: 'TierMaker Stats',
    path: '/tierstats',
    component: <TierMakerStats />,
  },
];

export const MainPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div
            style={{
              maxWidth: 600,
              margin: 'auto',
              padding: 32,
              textAlign: 'center',
              background: '#2A4E53',
              minHeight: '100vh',
            }}
          >
            <h1 style={{ color: '#E3C66A', marginBottom: 32 }}>
              SovlStuff Tools
            </h1>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: 20 }}>
              {TOOLS.map((tool) => (
                <li key={tool.key} style={{ margin: '24px 0' }}>
                  <Link
                    to={tool.path}
                    style={{
                      display: 'inline-block',
                      padding: '16px 32px',
                      fontSize: 18,
                      cursor: 'pointer',
                      background: '#3B6A71',
                      color: '#FFD86E',
                      border: '1px solid #101C1F',
                      borderRadius: 8,
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = '#2A4E53')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = '#3B6A71')
                    }
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        }
      />
      {TOOLS.map((tool) => (
        <Route
          key={tool.key}
          path={tool.path}
          element={
            <div
              style={{ padding: 24, background: '#2A4E53', minHeight: '100vh' }}
            >
              <button
                onClick={() => navigate('/')}
                style={{
                  marginBottom: 16,
                  padding: '10px 24px',
                  background: '#3B6A71',
                  color: '#FFD86E',
                  border: '1px solid #101C1F',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  position: 'absolute',
                  left: 24,
                  top: 24,
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = '#2A4E53')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = '#3B6A71')
                }
              >
                &larr; Back to main menu
              </button>
              <h2 style={{ color: '#E3C66A', marginLeft: 60 }}>{tool.label}</h2>
              <div>{tool.component}</div>
            </div>
          }
        />
      ))}
    </Routes>
  );
};

export default MainPage;
