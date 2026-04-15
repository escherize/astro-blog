import { useState } from 'react';

const layers = [
  {
    id: 'specs',
    name: 'Specifications as Source',
    tools: 'TLA+, Lean 4, Spec Kit, SPARK',
    catches: 'Requirements drift',
    color: '#e85d04',
    slips: 'Correct spec, wrong implementation',
    examples: [
      'AWS found a 35-step data-loss bug in DynamoDB replication via TLA+',
      'Microsoft found Xbox 360 bug just by writing the spec',
      'Error reductions of up to 50% with human-refined specs',
    ],
    coverage: 15,
  },
  {
    id: 'arch',
    name: 'Architecture as Constraint',
    tools: 'FC/IS, CQRS, Event Sourcing, Actors',
    catches: 'Boundary violations',
    color: '#8338ec',
    slips: 'Logic errors within correct boundaries',
    examples: [
      'Compiler enforces boundaries - AI cannot violate them',
      'WhatsApp: 50 engineers, 900M users on Erlang actors',
      'Teams report 30% productivity increase from reduced complexity',
    ],
    coverage: 30,
  },
  {
    id: 'types',
    name: 'Types as Automated Review',
    tools: 'Rust, TypeScript strict, ADTs, null safety',
    catches: 'Type & memory bugs',
    color: '#e85d04',
    slips: 'Logically valid but semantically wrong',
    examples: [
      'Rust eliminates ~70% of security vulnerabilities at compile time',
      'Google: 1,000x reduction in memory vulnerability density',
      'Type errors dropped from 33% (JS) to 12.4% (TS)',
    ],
    coverage: 55,
  },
  {
    id: 'verify',
    name: 'Advanced Verification',
    tools: 'PBT, mutation testing, fuzzing, formal proof',
    catches: 'Logic & edge cases',
    color: '#8338ec',
    slips: 'Environment-specific & integration issues',
    examples: [
      'PBT found real bugs in NumPy at $9.93 per valid bug',
      '100% coverage can have 0% mutation score',
      'OSS-Fuzz: 13,000 vulnerabilities across 1,000+ projects',
    ],
    coverage: 75,
  },
  {
    id: 'delivery',
    name: 'Progressive Delivery',
    tools: 'Feature flags, canary, ring-based rollout',
    catches: 'Deploy failures',
    color: '#e85d04',
    slips: 'Slow degradation, business value misses',
    examples: [
      'Auto-rollback when success rate drops below 95%',
      'Flag debt grows ~30% per quarter without cleanup',
      'Microsoft ring model: employees -> beta -> broad -> full',
    ],
    coverage: 88,
  },
  {
    id: 'observe',
    name: 'Production Observability',
    tools: 'OTel, synthetic monitoring, RUM, profiling',
    catches: 'Runtime failures',
    color: '#8338ec',
    slips: 'Aggregate value & business impact',
    examples: [
      'OTel: 10 billion daily spans, 2nd most active CNCF project',
      'RUM catches rage clicks, dead clicks, layout issues',
      'Continuous profiling: 1-5% CPU overhead',
    ],
    coverage: 95,
  },
  {
    id: 'budget',
    name: 'Error Budget Governance',
    tools: 'SLOs, burn-rate alerts, auto-halt',
    catches: 'Value erosion',
    color: '#e85d04',
    slips: 'Nothing - this is the final gate',
    examples: [
      '99.9% SLO = 43.2 min acceptable downtime/month',
      'Home Depot: 0 to 800 SLO-supported services in <1 year',
      'Netflix used SLOs to manage Christmas Eve incident',
    ],
    coverage: 100,
  },
];

export default function ValidationStack() {
  const [active, setActive] = useState<number | null>(null);
  const [enabled, setEnabled] = useState<boolean[]>(new Array(7).fill(true));
  const [hovered, setHovered] = useState<number | null>(null);

  const totalCoverage = enabled.reduce(
    (acc, on, i) => (on ? Math.max(acc, layers[i].coverage) : acc),
    0
  );

  const enabledCount = enabled.filter(Boolean).length;

  const toggleLayer = (i: number) => {
    const next = [...enabled];
    next[i] = !next[i];
    setEnabled(next);
  };

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Hero coverage readout */}
      <div style={{
        background: 'var(--color-bg-elevated, #fff)',
        border: '3px solid var(--color-fg, #1a1a1a)',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 20,
        boxShadow: '6px 6px 0 var(--color-fg, #1a1a1a)',
        position: 'relative' as const,
        overflow: 'hidden',
      }}>
        {/* Decorative corner blob */}
        <div style={{
          position: 'absolute' as const,
          top: -30, right: -30,
          width: 100, height: 100,
          borderRadius: '50%',
          background: totalCoverage >= 90 ? '#e85d04' : totalCoverage >= 50 ? '#8338ec' : '#dc2626',
          opacity: 0.1,
          pointerEvents: 'none' as const,
        }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 12, gap: 16, flexWrap: 'wrap' as const,
        }}>
          <div>
            <div style={{
              fontFamily: "'Source Code Pro', 'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const, letterSpacing: 2,
              color: 'var(--color-fg-muted, #4a4a4a)',
              marginBottom: 4,
            }}>
              Cumulative Bug Coverage
            </div>
            <div style={{
              fontSize: 12, color: 'var(--color-fg-subtle, #6b6b6b)',
            }}>
              {enabledCount}/7 layers active
            </div>
          </div>
          <div style={{
            fontSize: 56, fontWeight: 700, letterSpacing: -3,
            lineHeight: 1,
            color: totalCoverage >= 90 ? '#e85d04' : totalCoverage >= 50 ? '#8338ec' : '#dc2626',
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {totalCoverage}%
          </div>
        </div>

        {/* Chunky coverage bar */}
        <div style={{
          height: 14,
          background: 'var(--color-bg-alt, #f0ece4)',
          borderRadius: 4,
          border: '2px solid var(--color-fg, #1a1a1a)',
          overflow: 'hidden',
          position: 'relative' as const,
        }}>
          <div style={{
            height: '100%',
            width: `${totalCoverage}%`,
            background: totalCoverage >= 90 ? '#e85d04' : totalCoverage >= 50 ? '#8338ec' : '#dc2626',
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease',
          }} />
        </div>
      </div>

      {/* Layers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {layers.map((layer, i) => {
          const isActive = active === i;
          const isOn = enabled[i];
          const isHovered = hovered === i;

          return (
            <div key={layer.id}>
              <div
                onClick={() => setActive(isActive ? null : i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isOn
                    ? 'var(--color-bg-elevated, #fff)'
                    : 'var(--color-bg-alt, #f0ece4)',
                  border: `3px solid ${isActive ? layer.color : isHovered && isOn ? 'var(--color-fg, #1a1a1a)' : 'var(--color-border, #e0dcd4)'}`,
                  borderRadius: isActive ? '12px 12px 0 0' : 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  opacity: isOn ? 1 : 0.45,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isHovered && isOn ? 'translateX(4px)' : 'translateX(0)',
                  boxShadow: isActive
                    ? `4px 4px 0 ${layer.color}`
                    : isHovered && isOn
                      ? '4px 4px 0 var(--color-fg, #1a1a1a)'
                      : 'none',
                  position: 'relative' as const,
                  textDecoration: isOn ? 'none' : 'line-through',
                  textDecorationColor: 'var(--color-border, #e0dcd4)',
                }}
              >
                {/* Toggle - chunky switch */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLayer(i); }}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: `3px solid ${isOn ? layer.color : 'var(--color-border, #e0dcd4)'}`,
                    background: isOn ? layer.color : 'var(--color-bg-alt, #f0ece4)',
                    color: isOn ? '#fff' : 'var(--color-fg-subtle, #6b6b6b)',
                    cursor: 'pointer',
                    fontWeight: 700, fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isOn ? `2px 2px 0 var(--color-fg, #1a1a1a)` : 'none',
                    transform: isOn ? 'translate(-1px, -1px)' : 'translate(0, 0)',
                    textDecoration: 'none',
                  }}
                  aria-label={`Toggle layer ${i + 1}`}
                >
                  {isOn ? String(i + 1) : ''}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, letterSpacing: -0.5,
                    color: isOn ? 'var(--color-fg, #1a1a1a)' : 'var(--color-fg-subtle, #6b6b6b)',
                    textDecoration: isOn ? 'none' : 'line-through',
                    textDecorationColor: 'var(--color-border, #e0dcd4)',
                  }}>
                    {layer.name}
                  </div>
                  <div style={{
                    fontFamily: "'Source Code Pro', 'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: 'var(--color-fg-subtle, #6b6b6b)',
                    textDecoration: 'none',
                  }}>
                    {layer.tools}
                  </div>
                </div>

                {/* Catches badge - chunky */}
                <span style={{
                  fontFamily: "'Space Grotesk', system-ui",
                  fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase' as const, letterSpacing: 0.5,
                  padding: '4px 12px', borderRadius: 6,
                  background: layer.color,
                  color: '#fff',
                  whiteSpace: 'nowrap' as const, flexShrink: 0,
                  boxShadow: `2px 2px 0 var(--color-fg, #1a1a1a)`,
                  textDecoration: 'none',
                }}>
                  {layer.catches}
                </span>

                {/* Expand chevron */}
                <span style={{
                  fontSize: 18, fontWeight: 700,
                  color: isActive ? layer.color : 'var(--color-fg-subtle, #6b6b6b)',
                  transform: isActive ? 'rotate(90deg)' : 'rotate(0)',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
                  flexShrink: 0,
                  textDecoration: 'none',
                }}>
                  ▸
                </span>
              </div>

              {/* Expanded detail panel */}
              {isActive && (
                <div style={{
                  background: 'var(--color-bg-elevated, #fff)',
                  border: `3px solid ${layer.color}`,
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  padding: '20px 24px',
                  boxShadow: `4px 4px 0 ${layer.color}`,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                      <div style={{
                        fontFamily: "'Space Grotesk', system-ui",
                        fontSize: 12, fontWeight: 700,
                        textTransform: 'uppercase' as const, letterSpacing: 1,
                        color: layer.color, marginBottom: 10,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: layer.color, display: 'inline-block',
                        }} />
                        Evidence
                      </div>
                      <ul style={{
                        listStyle: 'none', padding: 0, margin: 0,
                        fontSize: 13, lineHeight: 1.7,
                      }}>
                        {layer.examples.map((ex, j) => (
                          <li key={j} style={{
                            paddingLeft: 16, position: 'relative' as const,
                            marginBottom: 6,
                            color: 'var(--color-fg, #1a1a1a)',
                          }}>
                            <span style={{
                              position: 'absolute' as const, left: 0, top: 0,
                              color: layer.color, fontWeight: 700, fontSize: 16,
                            }}>//</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "'Space Grotesk', system-ui",
                        fontSize: 12, fontWeight: 700,
                        textTransform: 'uppercase' as const, letterSpacing: 1,
                        color: '#dc2626', marginBottom: 10,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#dc2626', display: 'inline-block',
                        }} />
                        What Slips Through
                      </div>
                      <p style={{
                        fontSize: 14, lineHeight: 1.6,
                        color: 'var(--color-fg, #1a1a1a)',
                        margin: '0 0 16px',
                        fontWeight: 500,
                      }}>
                        {layer.slips}
                      </p>

                      {/* Coverage mini-bar */}
                      <div style={{
                        background: 'var(--color-bg-alt, #f0ece4)',
                        border: '2px solid var(--color-fg, #1a1a1a)',
                        borderRadius: 8,
                        padding: '12px 14px',
                      }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                          marginBottom: 6,
                        }}>
                          <span style={{
                            fontFamily: "'Source Code Pro', monospace",
                            fontSize: 10, fontWeight: 700,
                            textTransform: 'uppercase' as const, letterSpacing: 1,
                            color: 'var(--color-fg-muted, #4a4a4a)',
                          }}>
                            Coverage at this layer
                          </span>
                          <span style={{
                            fontSize: 20, fontWeight: 700, color: layer.color,
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {layer.coverage}%
                          </span>
                        </div>
                        <div style={{
                          height: 10,
                          background: 'var(--color-bg-elevated, #fff)',
                          borderRadius: 3,
                          border: '2px solid var(--color-fg, #1a1a1a)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${layer.coverage}%`,
                            background: layer.color,
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
