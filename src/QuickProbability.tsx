import React, { useState } from 'react';

const DICE_COUNT = 21;
const DICE_SIZE = 32;
const DICE_GAP = 6;
const DICE_COLORS = {
  default: '#fff',
  selected: '#4caf50',
  border: '#333',
};

const diceFaceDots = [
  [], // 0 (unused)
  [[0.5, 0.5]], // 1
  [
    [0.25, 0.25],
    [0.75, 0.75],
  ], // 2
  [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ], // 3
  [
    [0.25, 0.25],
    [0.25, 0.75],
    [0.75, 0.25],
    [0.75, 0.75],
  ], // 4
  [
    [0.25, 0.25],
    [0.25, 0.75],
    [0.5, 0.5],
    [0.75, 0.25],
    [0.75, 0.75],
  ], // 5
  [
    [0.25, 0.25],
    [0.25, 0.5],
    [0.25, 0.75],
    [0.75, 0.25],
    [0.75, 0.5],
    [0.75, 0.75],
  ], // 6
];

function binomialPmf(n: number, p: number): number[] {
  const pmf = Array(n + 1).fill(0);
  for (let k = 0; k <= n; k++) {
    pmf[k] = binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }
  return pmf;
}
function binomialCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

const QuickProbability: React.FC = () => {
  const [hovered, setHovered] = useState<number | null>(null); // for N dice row
  const [target, setTarget] = useState(4); // default 4+
  const [N, setN] = useState<number>(0); // sticky N value
  const [NSticky, setNSticky] = useState(false); // sticky mode for N
  const [atLeastN, setAtLeastN] = useState(1); // selected n for at-least row
  const [hoveredAtLeast, setHoveredAtLeast] = useState<number | null>(null); // for at-least row preview
  const [atLeastSticky, setAtLeastSticky] = useState(false); // sticky mode for n selector
  // Add a reset state to force remount
  const [resetKey, setResetKey] = useState(0);

  // Probability of rolling X+ on a d6
  const p = (7 - target) / 6;
  // Use sticky N if set, else hovered
  const NValue = NSticky ? N : hovered === null ? 0 : hovered + 1;
  const pmf = binomialPmf(NValue, p);
  // Cumulative: odds of at least k successes
  const atLeast = Array(NValue + 1)
    .fill(0)
    .map((_, k) => pmf.slice(k).reduce((a, b) => a + b, 0));

  // Which n to show: preview if hovering and not sticky, else selected
  const nValue =
    !atLeastSticky && hoveredAtLeast !== null
      ? hoveredAtLeast + 1
      : Math.max(1, Math.min(atLeastN, NValue));

  // When N changes, clamp n if needed and reset sticky if nValue > N
  React.useEffect(() => {
    if (atLeastN > NValue) {
      setAtLeastN(NValue > 0 ? NValue : 1);
      setAtLeastSticky(false);
    }
  }, [NValue]);

  // For random dice values for white dice
  // function getRandomBelowThreshold(count: number, threshold: number) {
  //   // Returns an array of random values [1, threshold-1] for each die
  //   if (threshold <= 1) return Array(count).fill(1);
  //   return Array(count)
  //     .fill(0)
  //     .map(() => Math.floor(Math.random() * (threshold - 1)) + 1);
  // }

  // For the upper dice row, generate random values for white dice (1 to target-1)
  const randomWhiteDice = React.useMemo(() => {
    if (target <= 1) return Array(DICE_COUNT).fill(1);
    return Array(DICE_COUNT)
      .fill(0)
      .map(() => Math.floor(Math.random() * (target - 1)) + 1);
  }, [resetKey, target]);

  return (
    <div
      style={{
        maxWidth: 1700,
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
            justifyContent: 'flex-end',
            marginBottom: 8,
          }}
        >
          <button
            onClick={() => {
              setN(0);
              setNSticky(false);
              setAtLeastN(1);
              setAtLeastSticky(false);
              setHovered(null);
              setHoveredAtLeast(null);
              setResetKey((k) => k + 1);
            }}
            style={{ padding: '6px 18px', fontSize: 15 }}
          >
            Reset
          </button>
        </div>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <label style={{ fontWeight: 500, color: '#E3C66A' }}>
            Target roll:
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            style={{
              fontSize: 16,
              background: '#2A4E53',
              color: '#E3C66A',
              border: '1px solid #E3C66A',
              borderRadius: 4,
              padding: 8,
            }}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{`${n}+`}</option>
            ))}
          </select>
        </div>
        {/* Number above upper dice row */}
        <div
          style={{
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 18,
            marginBottom: 2,
            color: '#E3C66A',
          }}
        >
          {NValue > 0 ? `${NValue} dice` : 'Select number of dice'}
        </div>
        {/* Row 1: N dice selector */}
        <div
          style={{
            display: 'flex',
            gap: DICE_GAP,
            marginBottom: 12,
            minHeight: DICE_SIZE + 4,
            height: DICE_SIZE + 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseLeave={() => {
            if (!NSticky) {
              setTimeout(() => setHovered(null), 100);
            }
          }}
        >
          {Array(DICE_COUNT)
            .fill(0)
            .map((_, i) => {
              const isSelected = NSticky
                ? i < N
                : hovered !== null && i <= hovered;
              const isRed = NSticky && i === N - 1;
              const isWhite = !isSelected;
              return (
                <svg
                  key={i}
                  width={DICE_SIZE}
                  height={DICE_SIZE}
                  style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={() => {
                    if (!NSticky) setHovered(i);
                  }}
                  onClick={() => {
                    setN(i + 1);
                    setNSticky(true);
                    setHovered(null);
                  }}
                >
                  <rect
                    x={2}
                    y={2}
                    width={DICE_SIZE - 4}
                    height={DICE_SIZE - 4}
                    rx={6}
                    fill={
                      isSelected ? DICE_COLORS.selected : DICE_COLORS.default
                    }
                    stroke={isRed ? 'red' : DICE_COLORS.border}
                    strokeWidth={isRed ? 4 : 2}
                  />
                  {/* If white, show random dice face below threshold */}
                  {isWhite
                    ? diceFaceDots[randomWhiteDice[i]].map(([fx, fy], idx) => (
                        <circle
                          key={idx}
                          cx={fx * DICE_SIZE}
                          cy={fy * DICE_SIZE}
                          r={3.5}
                          fill="#bbb"
                        />
                      ))
                    : diceFaceDots[target].map(([fx, fy], idx) => (
                        <circle
                          key={idx}
                          cx={fx * DICE_SIZE}
                          cy={fy * DICE_SIZE}
                          r={3.5}
                          fill="#fff"
                        />
                      ))}
                </svg>
              );
            })}
        </div>
        {/* Row 2: at-least-n selector */}
        <div
          style={{
            display: 'flex',
            gap: DICE_GAP,
            marginBottom: 24,
            minHeight: DICE_SIZE + 4,
            height: DICE_SIZE + 4,
            alignItems: 'center',
          }}
        >
          {Array(NValue)
            .fill(0)
            .map((_, i) => (
              <svg
                key={i}
                width={DICE_SIZE}
                height={DICE_SIZE}
                style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onMouseEnter={() => {
                  if (!atLeastSticky) setHoveredAtLeast(i);
                }}
                onMouseLeave={() => {
                  if (!atLeastSticky) setHoveredAtLeast(null);
                }}
                onClick={() => {
                  setAtLeastN(i + 1);
                  setAtLeastSticky(true);
                  setHoveredAtLeast(null);
                }}
              >
                <rect
                  x={2}
                  y={2}
                  width={DICE_SIZE - 4}
                  height={DICE_SIZE - 4}
                  rx={6}
                  fill={
                    (
                      hoveredAtLeast !== null && !atLeastSticky
                        ? i <= hoveredAtLeast
                        : i < nValue
                    )
                      ? DICE_COLORS.selected
                      : DICE_COLORS.default
                  }
                  stroke={DICE_COLORS.border}
                  strokeWidth={2}
                />
                {diceFaceDots[target].map(([fx, fy], idx) => (
                  <circle
                    key={idx}
                    cx={fx * DICE_SIZE}
                    cy={fy * DICE_SIZE}
                    r={3.5}
                    fill={
                      (
                        hoveredAtLeast !== null && !atLeastSticky
                          ? i <= hoveredAtLeast
                          : i < nValue
                      )
                        ? '#fff'
                        : '#222'
                    }
                  />
                ))}
              </svg>
            ))}
          {atLeastSticky && (
            <button
              style={{
                marginLeft: 16,
                fontSize: 13,
                background: '#E3C66A',
                color: '#101C1F',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              onClick={() => setAtLeastSticky(false)}
            >
              Change
            </button>
          )}
        </div>
        <div
          style={{
            minHeight: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E3C66A',
          }}
        >
          {NValue > 0 ? (
            <div>
              <b>
                Probability of at least {nValue} successes (on {NValue} dice,{' '}
                {target}+):{' '}
              </b>
              <span>{(atLeast[nValue] * 100).toFixed(2)}%</span>
              {hoveredAtLeast !== null && !atLeastSticky && (
                <span style={{ color: '#888', marginLeft: 12 }}>(preview)</span>
              )}
            </div>
          ) : (
            <div style={{ color: '#888' }}>
              Click a die above to select how many dice to roll.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickProbability;
