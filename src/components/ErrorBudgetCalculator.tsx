import { useState } from 'react';

const presets = [
  { label: '99%', nines: '2 nines', value: 99 },
  { label: '99.9%', nines: '3 nines', value: 99.9 },
  { label: '99.95%', nines: '3.5 nines', value: 99.95 },
  { label: '99.99%', nines: '4 nines', value: 99.99 },
];

function formatDuration(minutes: number): string {
  if (minutes >= 60 * 24) {
    const days = minutes / (60 * 24);
    return `${days.toFixed(1)}d`;
  }
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  }
  if (minutes >= 1) {
    return `${minutes.toFixed(1)}m`;
  }
  return `${(minutes * 60).toFixed(0)}s`;
}

function formatDurationLong(minutes: number): string {
  if (minutes >= 60 * 24) {
    const days = minutes / (60 * 24);
    return `${days.toFixed(1)} days`;
  }
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours.toFixed(1)} hours`;
  }
  if (minutes >= 1) {
    return `${minutes.toFixed(1)} minutes`;
  }
  return `${(minutes * 60).toFixed(0)} seconds`;
}

export default function ErrorBudgetCalculator() {
  const [slo, setSlo] = useState(99.9);
  const [hoveredPreset, setHoveredPreset] = useState<number | null>(null);

  const budgetPercent = 100 - slo;
  const monthlyMinutes = 30 * 24 * 60;
  const downtimeMinutes = monthlyMinutes * (budgetPercent / 100);
  const yearlyDowntime = downtimeMinutes * 12;

  const fastBurn = downtimeMinutes * 0.02;
  const slowBurn = downtimeMinutes * 0.10;

  const scenarios = [
    { name: 'Healthy', pct: 5, desc: 'Ship fast', icon: '//' },
    { name: 'Elevated', pct: 30, desc: 'Watch closely', icon: '/!' },
    { name: 'Burning', pct: 70, desc: 'Slow down', icon: '!!' },
    { name: 'Exhausted', pct: 100, desc: 'Halt deploys', icon: 'XX' },
  ];

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* SLO Selector - Hero treatment */}
      <div style={{
        background: 'var(--color-bg-elevated, #fff)',
        border: '3px solid var(--color-fg, #1a1a1a)',
        borderRadius: 12,
        padding: '28px 28px 24px',
        marginBottom: 20,
        boxShadow: '6px 6px 0 var(--color-fg, #1a1a1a)',
        position: 'relative' as const,
        overflow: 'hidden',
      }}>
        {/* Decorative corner */}
        <div style={{
          position: 'absolute' as const,
          top: 0, right: 0,
          width: 100, height: 100,
          background: '#e85d04',
          opacity: 0.08,
          borderRadius: '0 0 0 100%',
          pointerEvents: 'none' as const,
        }} />

        {/* Big SLO readout */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: 20, gap: 16, flexWrap: 'wrap' as const,
        }}>
          <div>
            <div style={{
              fontFamily: "'Source Code Pro', 'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const, letterSpacing: 2,
              color: 'var(--color-fg-muted, #4a4a4a)',
              marginBottom: 4,
            }}>
              SLO Target
            </div>
          </div>
          <div style={{
            fontSize: 64, fontWeight: 700, letterSpacing: -3,
            lineHeight: 0.9,
            color: '#e85d04',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {slo >= 99.99 ? slo.toFixed(3) : slo >= 99.9 ? slo.toFixed(2) : slo.toFixed(1)}
            <span style={{ fontSize: 32, color: 'var(--color-fg-muted, #4a4a4a)' }}>%</span>
          </div>
        </div>

        {/* Preset buttons - chunky tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
          {presets.map((p, pi) => {
            const isSelected = slo === p.value;
            const isHov = hoveredPreset === pi;
            return (
              <button
                key={p.value}
                onClick={() => setSlo(p.value)}
                onMouseEnter={() => setHoveredPreset(pi)}
                onMouseLeave={() => setHoveredPreset(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: `3px solid ${isSelected ? '#e85d04' : isHov ? 'var(--color-fg, #1a1a1a)' : 'var(--color-border, #e0dcd4)'}`,
                  background: isSelected ? '#e85d04' : 'var(--color-bg-elevated, #fff)',
                  color: isSelected ? '#fff' : 'var(--color-fg, #1a1a1a)',
                  fontFamily: "'Space Grotesk', system-ui",
                  fontSize: 15, fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected
                    ? '4px 4px 0 var(--color-fg, #1a1a1a)'
                    : isHov
                      ? '3px 3px 0 var(--color-fg, #1a1a1a)'
                      : 'none',
                  transform: isSelected
                    ? 'translate(-2px, -2px)'
                    : isHov
                      ? 'translate(-1px, -1px)'
                      : 'translate(0, 0)',
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2,
                }}
              >
                <span>{p.label}</span>
                <span style={{
                  fontSize: 9, fontWeight: 500, letterSpacing: 0.5,
                  opacity: 0.7,
                  textTransform: 'uppercase' as const,
                }}>{p.nines}</span>
              </button>
            );
          })}
        </div>

        {/* Slider with tick marks */}
        <div style={{ position: 'relative' as const }}>
          <input
            type="range"
            min={90}
            max={99.999}
            step={0.001}
            value={slo}
            onChange={(e) => setSlo(parseFloat(e.target.value))}
            style={{
              width: '100%', accentColor: '#e85d04',
              height: 8,
            }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 4, padding: '0 2px',
          }}>
            {['90%', '95%', '99%', '99.9%', '99.99%'].map((label) => (
              <span key={label} style={{
                fontFamily: "'Source Code Pro', 'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: 600,
                color: 'var(--color-fg-subtle, #6b6b6b)',
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards - dramatic numbers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          {
            value: formatDuration(downtimeMinutes),
            long: formatDurationLong(downtimeMinutes),
            label: 'Monthly Budget',
            color: '#e85d04',
          },
          {
            value: formatDuration(yearlyDowntime),
            long: formatDurationLong(yearlyDowntime),
            label: 'Yearly Budget',
            color: '#8338ec',
          },
          {
            value: `${budgetPercent.toFixed(budgetPercent < 0.01 ? 4 : budgetPercent < 0.1 ? 3 : 2)}%`,
            long: 'Allowable failure rate',
            label: 'Error Budget',
            color: '#059669',
          },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: 'var(--color-bg-elevated, #fff)',
            border: '3px solid var(--color-fg, #1a1a1a)',
            borderRadius: 12,
            padding: '20px 18px',
            boxShadow: `4px 4px 0 ${kpi.color}`,
            textAlign: 'center' as const,
          }}>
            <div style={{
              fontSize: 36, fontWeight: 700, letterSpacing: -2,
              color: kpi.color, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: 4,
              transition: 'color 0.3s ease',
            }}>
              {kpi.value}
            </div>
            <div style={{
              fontFamily: "'Source Code Pro', 'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase' as const, letterSpacing: 1.5,
              color: 'var(--color-fg-muted, #4a4a4a)',
              marginBottom: 2,
            }}>
              {kpi.label}
            </div>
            <div style={{
              fontSize: 11, color: 'var(--color-fg-subtle, #6b6b6b)',
            }}>
              {kpi.long}
            </div>
          </div>
        ))}
      </div>

      {/* Burn Rate Alerts - urgent treatment */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        marginBottom: 20,
      }}>
        {/* Fast burn */}
        <div style={{
          background: 'var(--color-bg-elevated, #fff)',
          border: '3px solid #dc2626',
          borderRadius: 12,
          padding: '18px 20px',
          boxShadow: '4px 4px 0 #dc2626',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 10,
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', system-ui",
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const, letterSpacing: 1,
              padding: '3px 10px', borderRadius: 4,
              background: '#dc2626', color: '#fff',
              boxShadow: '2px 2px 0 var(--color-fg, #1a1a1a)',
            }}>
              PAGE
            </span>
            <span style={{
              fontSize: 12, color: 'var(--color-fg-muted, #4a4a4a)',
              fontWeight: 500,
            }}>
              Fast burn
            </span>
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700, color: '#dc2626',
            letterSpacing: -1, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 4,
          }}>
            {formatDuration(fastBurn)}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--color-fg-subtle, #6b6b6b)',
          }}>
            2% of budget in 1 hour
          </div>
        </div>

        {/* Slow burn */}
        <div style={{
          background: 'var(--color-bg-elevated, #fff)',
          border: '3px solid #d97706',
          borderRadius: 12,
          padding: '18px 20px',
          boxShadow: '4px 4px 0 #d97706',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 10,
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', system-ui",
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const, letterSpacing: 1,
              padding: '3px 10px', borderRadius: 4,
              background: '#d97706', color: '#fff',
              boxShadow: '2px 2px 0 var(--color-fg, #1a1a1a)',
            }}>
              TICKET
            </span>
            <span style={{
              fontSize: 12, color: 'var(--color-fg-muted, #4a4a4a)',
              fontWeight: 500,
            }}>
              Slow burn
            </span>
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700, color: '#d97706',
            letterSpacing: -1, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 4,
          }}>
            {formatDuration(slowBurn)}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--color-fg-subtle, #6b6b6b)',
          }}>
            10% of budget in 3 days
          </div>
        </div>
      </div>

      {/* Budget Consumption Scenarios */}
      <div style={{
        background: 'var(--color-bg-elevated, #fff)',
        border: '3px solid var(--color-fg, #1a1a1a)',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '4px 4px 0 var(--color-fg, #1a1a1a)',
      }}>
        <div style={{
          fontFamily: "'Source Code Pro', 'JetBrains Mono', monospace",
          fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase' as const, letterSpacing: 2,
          color: 'var(--color-fg-muted, #4a4a4a)',
          marginBottom: 16,
        }}>
          What happens when the budget burns?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scenarios.map((s) => {
            const barColor = s.pct >= 100
              ? '#dc2626'
              : s.pct >= 70
                ? '#d97706'
                : s.pct >= 30
                  ? '#e85d04'
                  : '#059669';

            return (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 14px',
                borderRadius: 8,
                border: `2px solid ${s.pct >= 100 ? '#dc2626' : 'var(--color-border, #e0dcd4)'}`,
                background: s.pct >= 100 ? 'rgba(220, 38, 38, 0.05)' : 'transparent',
              }}>
                {/* Status icon */}
                <span style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 12, fontWeight: 700,
                  color: barColor,
                  width: 24, flexShrink: 0,
                }}>
                  {s.icon}
                </span>

                <div style={{ width: 80, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: s.pct >= 100 ? '#dc2626' : 'var(--color-fg, #1a1a1a)',
                  }}>
                    {s.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--color-fg-subtle, #6b6b6b)',
                  }}>
                    {s.desc}
                  </div>
                </div>

                {/* Chunky bar */}
                <div style={{
                  flex: 1, height: 12,
                  background: 'var(--color-bg-alt, #f0ece4)',
                  borderRadius: 3,
                  border: '2px solid var(--color-fg, #1a1a1a)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${s.pct}%`,
                    background: barColor,
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>

                <span style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 14, fontWeight: 700,
                  color: barColor,
                  width: 44, textAlign: 'right' as const, flexShrink: 0,
                }}>
                  {s.pct}%
                </span>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: '2px solid var(--color-border, #e0dcd4)',
          fontSize: 12,
          color: 'var(--color-fg-subtle, #6b6b6b)',
        }}>
          When budget hits 100%, deployments auto-halt. The team shifts from features to reliability.
        </div>
      </div>
    </div>
  );
}
