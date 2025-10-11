import React, { useState } from 'react';

// Elo calculation: given your Elo, Elo gain/loss, and K=30, find opponent's Elo before the game
// Elo_new = Elo + K * (result - expected)
// Elo_gain = Elo_new - Elo = K * (result - expected)
// expected = result - (Elo_gain / K)
// expected = 1 / (1 + 10^((oppElo - yourElo)/400))
// So, solve for oppElo:
// expected = result - (Elo_gain / K)
// expected = 1 / (1 + 10^((oppElo - yourElo)/400))
// 1/expected - 1 = 10^((oppElo - yourElo)/400)
// log10(1/expected - 1) = (oppElo - yourElo)/400
// oppElo = yourElo + 400 * log10(1/expected - 1)

function calculateOpponentElo(
  yourElo: number,
  eloGain: number,
  result: 1 | 0 | 0.5,
  k: number = 30,
): number | null {
  const expected = result - eloGain / k;
  if (expected <= 0 || expected >= 1) return null; // invalid
  const logArg = 1 / expected - 1;
  if (logArg <= 0) return null;
  const oppElo = yourElo + 500 * Math.log10(logArg);
  return Math.round(oppElo);
}

function calculateOpponentEloRange(
  yourElo: number,
  eloGain: number,
  result: 1 | 0 | 0.5,
  k: number = 30,
): [number | null, number | null] {
  // Lower bound: you could have gained up to 0.5 less
  const min = calculateOpponentElo(yourElo, eloGain + 0.5, result, k);
  // Upper bound: you could have gained up to 0.5 more
  const max = calculateOpponentElo(yourElo, eloGain - 0.5, result, k);
  return [min, max];
}

const EloCalculator: React.FC = () => {
  const [yourElo, setYourElo] = useState(800);
  const [eloGain, setEloGain] = useState(15);
  const [result, setResult] = useState<1 | 0 | 0.5>(1);

  const [minOppElo, maxOppElo] = calculateOpponentEloRange(
    yourElo,
    eloGain,
    result,
    30,
  );

  return (
    <div
      style={{
        maxWidth: 700,
        margin: 'auto',
        padding: 32,
        background: '#2A4E53',
        minHeight: '100vh',
      }}
    >
      <h2 style={{ color: '#E3C66A', marginBottom: 24 }}>Elo Calculator</h2>
      <div
        style={{
          background: '#1E2D30',
          border: '2px solid #101C1F',
          borderRadius: 10,
          padding: 24,
          boxShadow: '0 2px 8px #101C1F',
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <label>
            Your Elo:
            <input
              type="number"
              value={yourElo}
              onChange={(e) => setYourElo(Number(e.target.value))}
              style={{ marginLeft: 8, width: 80 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Elo gain/loss:
            <input
              type="number"
              value={eloGain}
              onChange={(e) => setEloGain(Number(e.target.value))}
              style={{ marginLeft: 8, width: 80 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Result:
            <select
              value={result}
              onChange={(e) => setResult(Number(e.target.value) as 1 | 0 | 0.5)}
              style={{ marginLeft: 8 }}
            >
              <option value={1}>Win</option>
              <option value={0.5}>Draw</option>
              <option value={0}>Loss</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: 20, fontSize: 18 }}>
          {minOppElo !== null && maxOppElo !== null ? (
            minOppElo === maxOppElo ? (
              <>
                Opponent's Elo before the game: <b>{minOppElo}</b>
              </>
            ) : (
              <>
                Opponent's Elo before the game:{' '}
                <b>
                  {Math.min(minOppElo, maxOppElo)} -{' '}
                  {Math.max(minOppElo, maxOppElo)}
                </b>
              </>
            )
          ) : (
            <span style={{ color: 'red' }}>Invalid input combination</span>
          )}
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: '#555' }}>
          This calculator uses K=30 and standard Elo formula. Enter your Elo,
          the Elo gain/loss from the game, and your result to find your
          opponent's Elo before the game. The result is shown as a range due to
          rounding of Elo changes.
        </div>
      </div>
    </div>
  );
};

export default EloCalculator;
