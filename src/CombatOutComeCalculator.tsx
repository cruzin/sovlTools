import React, { useState } from 'react';

// Precomputed 2d6 CDF for T = 0..12
const twoD6Cdf = [
  0, // 0
  0, // 1
  1 / 36, // 2
  3 / 36, // 3
  6 / 36, // 4
  10 / 36, // 5
  15 / 36, // 6
  21 / 36, // 7
  26 / 36, // 8
  30 / 36, // 9
  33 / 36, // 10
  35 / 36, // 11
  36 / 36, // 12
];
function p2d6AtMost(target: number): number {
  if (target < 2) return 0;
  if (target > 12) return 1;
  return twoD6Cdf[target];
}

// Binomial PMF
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

// SOVL thresholds for hit and save
function getHitProb(
  skillA: number,
  skillD: number,
  elvenAccuracy: boolean,
  putridStench: boolean,
): number {
  // Higher Skill: hit on 3+ (2/3), else 4+ (1/2)
  let base = skillA > skillD ? 2 / 3 : 1 / 2;
  // Elven Accuracy: reroll misses (attacker)
  if (elvenAccuracy) base = base + (1 - base) * base;
  // Putrid Stench: opponent rerolls hits (defender ability)
  if (putridStench) base = base * base;
  return base;
}
function getSaveProb(pow: number, def: number, poison: boolean): number {
  // Pow > Def: save on 5+ (1/3); if Pow-Def>2, save on 6+ (1/6)
  // Pow = Def: save on 4+ (1/2)
  // Pow < Def: save on 3+ (2/3); if Def-Pow>2, save on 2+ (5/6)
  let base: number;
  if (pow > def) {
    if (pow - def > 2) base = 1 / 6;
    else base = 1 / 3;
  } else if (pow < def) {
    if (def - pow > 2) base = 5 / 6;
    else base = 2 / 3;
  } else {
    base = 1 / 2;
  }
  // Poison: opponent rerolls 6's on defence rolls (defender ability)
  // For a d6 save on N+, the chance of rolling a 6 is always 1/6 if N<=6
  // Rerolling 6's: fail if 6 is rolled twice, so p_save = p_save - (1/6)*p_save + (1/6)*p_save*base
  if (poison && base < 1) {
    // Only applies if a 6 is a save (i.e., base < 1)
    // Probability of saving on 6: 1/6
    // Reroll: only succeeds if second roll is also a save
    // So, p_save = p_save - (1/6)*p_save + (1/6)*p_save*base
    base = base - (1 / 6) * base + (1 / 6) * base * base;
  }
  return base;
}

type SideInput = {
  width: number;
  models: number;
  spearmen: boolean;
  isFlanking: boolean;
  skill: number;
  power: number;
  defense: number;
  attacksPerModel: number;
  woundsPerModel: number;
  discipline: number;
  elvenAccuracy: boolean;
  putridStench: boolean;
  poison: boolean;
};

type Inputs = {
  A: SideInput;
  B: SideInput;
};

const numericOptions = (min: number, max: number, step = 1) => {
  const opts = [];
  for (let i = min; i <= max; i += step) opts.push(i);
  return opts;
};

const defaultInputs: Inputs = {
  A: {
    width: 7,
    models: 21,
    spearmen: false,
    isFlanking: false,
    skill: 4,
    power: 4,
    defense: 4,
    attacksPerModel: 1,
    woundsPerModel: 1,
    discipline: 7,
    elvenAccuracy: false,
    putridStench: false,
    poison: false,
  },
  B: {
    width: 7,
    models: 21,
    spearmen: false,
    isFlanking: false,
    skill: 4,
    power: 4,
    defense: 4,
    attacksPerModel: 1,
    woundsPerModel: 1,
    discipline: 7,
    elvenAccuracy: false,
    putridStench: false,
    poison: false,
  },
};

const CombatOutComeCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);

  function handleChange<K extends keyof SideInput>(
    side: 'A' | 'B',
    field: K,
    value: SideInput[K],
  ) {
    setInputs((prev) => ({
      ...prev,
      [side]: { ...prev[side], [field]: value },
    }));
  }

  function getModelsFront(side: SideInput) {
    return Math.min(side.models, side.width);
  }
  function getModelsSupport(side: SideInput) {
    const modelsFront = getModelsFront(side);
    const supportable = side.models - modelsFront;
    if (supportable <= 0) return 0;
    if (side.spearmen) {
      return Math.min(2 * side.width, supportable);
    } else {
      return Math.min(side.width, supportable);
    }
  }

  function getAttackDice(side: SideInput) {
    // Only front models can attack; supporting attacks if front engaged and not side engaged
    let dice = 0;
    const modelsFront = getModelsFront(side);
    const modelsSupport = getModelsSupport(side);
    dice += modelsFront * side.attacksPerModel;
    if (!side.isFlanking && modelsSupport > 0) {
      dice += modelsSupport * 1;
    }
    return dice;
  }

  function getTotalModels(side: SideInput) {
    return side.models;
  }

  function getRankBonus(side: SideInput) {
    if (side.width < 3) return 0;
    return Math.max(0, Math.floor(side.models / side.width));
  }

  function woundsPmf(N: number, p_hit: number, p_wound: number, HP: number) {
    const hitPmf = binomialPmf(N, p_hit);
    let woundsPmf = Array(N + 1).fill(0);
    for (let h = 0; h <= N; h++) {
      const woundsGivenH = binomialPmf(h, p_wound);
      for (let w = 0; w <= h; w++) {
        woundsPmf[w] += hitPmf[h] * woundsGivenH[w];
      }
    }
    // Remove the capping at HP+1 so the full wound distribution is shown
    // const sum = woundsPmf.reduce((a, b) => a + b, 0);
    // if (sum > 0) woundsPmf = woundsPmf.map((x) => x / sum);
    // return woundsPmf;
    const sum = woundsPmf.reduce((a, b) => a + b, 0);
    if (sum > 0) woundsPmf = woundsPmf.map((x) => x / sum);
    return woundsPmf;
  }

  function calculateAll() {
    const dA = {
      N: getAttackDice(inputs.A),
      p_hit: getHitProb(
        inputs.A.skill,
        inputs.B.skill,
        inputs.A.elvenAccuracy,
        inputs.B.putridStench,
      ),
      p_wound:
        1 - getSaveProb(inputs.A.power, inputs.B.defense, inputs.A.poison),
      HP: getTotalModels(inputs.B) * inputs.B.woundsPerModel,
      R: getRankBonus(inputs.A),
      discipline: inputs.A.discipline,
      isFlanking: inputs.A.isFlanking,
    };
    const dB = {
      N: getAttackDice(inputs.B),
      p_hit: getHitProb(
        inputs.B.skill,
        inputs.A.skill,
        inputs.B.elvenAccuracy,
        inputs.A.putridStench,
      ),
      p_wound:
        1 - getSaveProb(inputs.B.power, inputs.A.defense, inputs.B.poison),
      HP: getTotalModels(inputs.A) * inputs.A.woundsPerModel,
      R: getRankBonus(inputs.B),
      discipline: inputs.B.discipline,
      isFlanking: inputs.B.isFlanking,
    };
    const PA = woundsPmf(dA.N, dA.p_hit, dA.p_wound, dA.HP);
    const PB = woundsPmf(dB.N, dB.p_hit, dB.p_wound, dB.HP);
    const PA_wipe = PA.slice(dA.HP).reduce((a, b) => a + b, 0);
    const PB_wipe = PB.slice(dB.HP).reduce((a, b) => a + b, 0);
    const maxA = PA.length - 1;
    const maxB = PB.length - 1;
    let pA_flees = 0,
      pB_flees = 0;
    for (let n = 0; n <= maxA; n++) {
      for (let m = 0; m <= maxB; m++) {
        // Exclude cases where the side is wiped out (dead) from flee calculations
        if (n >= dA.HP || m >= dB.HP) continue;
        const p = PA[n] * PB[m];
        const CSA = n + (dA.isFlanking ? 1 : 0);
        const CSB = m + (dB.isFlanking ? 1 : 0);
        if (CSA > CSB) {
          const delta = CSA - CSB;
          const T = dB.discipline + dB.R - delta;
          const pfail = 1 - p2d6AtMost(Math.max(2, Math.min(12, T)));
          pB_flees += p * pfail;
        } else if (CSB > CSA) {
          const delta = CSB - CSA;
          const T = dA.discipline + dA.R - delta;
          const pfail = 1 - p2d6AtMost(Math.max(2, Math.min(12, T)));
          pA_flees += p * pfail;
        }
      }
    }
    return {
      woundsA: PA,
      woundsB: PB,
      wipeA: PA_wipe,
      wipeB: PB_wipe,
      fleeA: pA_flees,
      fleeB: pB_flees,
    };
  }

  const results = calculateAll();

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
      <h2 style={{ color: '#E3C66A', marginBottom: 24 }}>
        Combat Outcome Calculator
      </h2>
      <div
        style={{
          background: '#1E2D30',
          border: '2px solid #101C1F',
          borderRadius: 10,
          padding: 24,
          boxShadow: '0 2px 8px #101C1F',
        }}
      >
        <button
          onClick={() => setInputs(defaultInputs)}
          style={{
            marginBottom: 16,
            padding: '6px 18px',
            fontSize: 15,
            background: '#E3C66A',
            color: '#101C1F',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <div style={{ display: 'flex', gap: 32 }}>
          {['A', 'B'].map((side) => (
            <div key={side}>
              <h3 style={{ color: '#E3C66A' }}>Side {side}</h3>
              {[
                'width',
                'models',
                'spearmen',
                'isFlanking',
                'elvenAccuracy',
                'putridStench',
                'poison',
                'skill',
                'power',
                'defense',
                'attacksPerModel',
                'woundsPerModel',
                'discipline',
              ].map((k) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 6,
                    color: '#E3C66A',
                  }}
                >
                  <label
                    style={{
                      minWidth: 140,
                      textAlign: 'right',
                      marginRight: 8,
                      fontWeight: 500,
                      color: '#E3C66A',
                    }}
                  >
                    {(() => {
                      switch (k) {
                        case 'elvenAccuracy':
                          return 'Elven Accuracy';
                        case 'putridStench':
                          return 'Putrid Stench';
                        case 'poison':
                          return 'Poison';
                        case 'isFlanking':
                          return 'Is Flanking';
                        default:
                          return k.charAt(0).toUpperCase() + k.slice(1);
                      }
                    })()}
                    :
                  </label>
                  {k === 'isFlanking' ||
                  k === 'spearmen' ||
                  k === 'elvenAccuracy' ||
                  k === 'putridStench' ||
                  k === 'poison' ? (
                    <input
                      type="checkbox"
                      checked={
                        inputs[side as 'A' | 'B'][k as keyof SideInput] || false
                      }
                      onChange={(e) =>
                        handleChange(
                          side as 'A' | 'B',
                          k as keyof SideInput,
                          e.target.checked,
                        )
                      }
                      style={{ marginLeft: 4 }}
                    />
                  ) : (
                    <select
                      value={inputs[side as 'A' | 'B'][k as keyof SideInput]}
                      onChange={(e) =>
                        handleChange(
                          side as 'A' | 'B',
                          k as keyof SideInput,
                          Number(e.target.value),
                        )
                      }
                      style={{
                        marginLeft: 4,
                        minWidth: 60,
                        textAlign: 'right',
                        background: '#101C1F',
                        color: '#E3C66A',
                        border: '1px solid #E3C66A',
                        borderRadius: 5,
                      }}
                    >
                      {(() => {
                        switch (k) {
                          case 'width':
                            return numericOptions(1, 7).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ));
                          case 'models':
                            return numericOptions(1, 60).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ));
                          case 'skill':
                          case 'power':
                          case 'defense':
                          case 'discipline':
                            return numericOptions(1, 10).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ));
                          case 'attacksPerModel':
                          case 'woundsPerModel':
                            return numericOptions(1, 5).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ));
                          default:
                            return numericOptions(0, 20).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ));
                        }
                      })()}
                    </select>
                  )}
                </div>
              ))}
              <div
                style={{ fontSize: '0.9em', color: '#E3C66A', marginLeft: 8 }}
              >
                <div>
                  modelsFront: {getModelsFront(inputs[side as 'A' | 'B'])}
                </div>
                <div>
                  modelsSupport: {getModelsSupport(inputs[side as 'A' | 'B'])}
                </div>
              </div>
            </div>
          ))}
        </div>
        <hr style={{ borderColor: '#E3C66A' }} />
        <h3 style={{ color: '#E3C66A' }}>Results</h3>
        <div style={{ color: '#E3C66A' }}>
          <b>Chance A wipes B:</b> {(results.wipeA * 100).toFixed(3)}%
        </div>
        <div style={{ color: '#E3C66A' }}>
          <b>Chance B wipes A:</b> {(results.wipeB * 100).toFixed(3)}%
        </div>
        <div style={{ color: '#E3C66A' }}>
          <b>Chance A flees:</b> {(results.fleeA * 100).toFixed(3)}%
        </div>
        <div style={{ color: '#E3C66A' }}>
          <b>Chance B flees:</b> {(results.fleeB * 100).toFixed(3)}%
        </div>
        <hr style={{ borderColor: '#E3C66A' }} />
        <h3 style={{ color: '#E3C66A' }}>Wound Distribution (A → B)</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            height: 120,
            justifyContent: 'center',
          }}
        >
          {results.woundsA.map((p, n) => {
            const atLeast = results.woundsA.slice(n).reduce((a, b) => a + b, 0);
            return (
              <div key={n} style={{ textAlign: 'center', width: 18 }}>
                <div
                  style={{
                    background: '#4a90e2',
                    height: `${Math.round(p * 100 * 1.1)}px`,
                    width: '100%',
                    borderRadius: 2,
                    transition: 'height 0.2s',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  title={`W=${n}: ${(p * 100).toFixed(1)}%\nChance of at least ${n}: ${(atLeast * 100).toFixed(2)}%`}
                />
                <div style={{ fontSize: 10, color: '#E3C66A' }}>{n}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: '#E3C66A', marginBottom: 16 }}>
          Hover a bar to see the chance of doing at least n wounds.
        </div>
        <h3 style={{ color: '#E3C66A' }}>Wound Distribution (B → A)</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            height: 120,
            justifyContent: 'center',
          }}
        >
          {results.woundsB.map((p, n) => {
            const atLeast = results.woundsB.slice(n).reduce((a, b) => a + b, 0);
            return (
              <div key={n} style={{ textAlign: 'center', width: 18 }}>
                <div
                  style={{
                    background: '#e24a4a',
                    height: `${Math.round(p * 100 * 1.1)}px`,
                    width: '100%',
                    borderRadius: 2,
                    transition: 'height 0.2s',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  title={`W=${n}: ${(p * 100).toFixed(1)}%\nChance of at least ${n}: ${(atLeast * 100).toFixed(2)}%`}
                />
                <div style={{ fontSize: 10, color: '#E3C66A' }}>{n}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: '#E3C66A', marginBottom: 16 }}>
          Hover a bar to see the chance of doing at least n wounds.
        </div>
      </div>
    </div>
  );
};

export default CombatOutComeCalculator;
