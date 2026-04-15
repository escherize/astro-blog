import { useState } from 'react';

interface PipelineStep {
  id: string;
  label: string;
  coreLogic: string;
  coreDesc: string;
  resources: string[];
}

const resources = [
  { id: 'db', label: 'DB', color: '#8338ec' },
  { id: 'payments', label: 'Payments', color: '#e85d04' },
  { id: 'shipping', label: 'Shipping', color: '#059669' },
  { id: 'email', label: 'Email', color: '#d97706' },
];

const steps: PipelineStep[] = [
  {
    id: 'validate',
    label: 'Validate',
    coreLogic: `validateOrder(stock, order) {
  if (stock.qty < order.qty)
    return { ok: false, reason: "Out of stock" }
  return { ok: true, amount: order.qty * stock.price }
}`,
    coreDesc: 'Pure: takes inventory + order, returns validation result',
    resources: ['db'],
  },
  {
    id: 'price',
    label: 'Price',
    coreLogic: `calculateTotal(items, discounts, tax) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const discount = applyBestDiscount(subtotal, discounts)
  return { subtotal, discount, tax: tax(subtotal - discount), total }
}`,
    coreDesc: 'Pure: takes items + rules, returns price breakdown',
    resources: ['db'],
  },
  {
    id: 'charge',
    label: 'Charge',
    coreLogic: `planPayment(total, user) {
  return {
    type: "charge",
    amount: total,
    method: user.defaultPayment,
    idempotencyKey: generateKey(user.id, total)
  }
}`,
    coreDesc: 'Pure: takes total + user, returns payment intent',
    resources: ['payments'],
  },
  {
    id: 'fulfill',
    label: 'Fulfill',
    coreLogic: `planFulfillment(order, warehouse) {
  const nearest = warehouse.nearest(order.address)
  return {
    ship: { from: nearest, to: order.address },
    notify: { to: order.email, template: "confirmed" },
    decrement: { item: order.itemId, qty: order.qty }
  }
}`,
    coreDesc: 'Pure: takes order + warehouse, returns effect plan',
    resources: ['db', 'shipping', 'email'],
  },
];

const SVG_W = 520;
const SVG_H = 300;
const CORE_R = 20;
const SHELL_R = 30;
const DIAMOND_S = 14;
const RESOURCE_Y = 50;
const STEP_Y = 180;

function stepX(i: number): number {
  const totalW = steps.length * (SHELL_R * 2) + (steps.length - 1) * 50;
  return (SVG_W - totalW) / 2 + SHELL_R + i * (SHELL_R * 2 + 50);
}

function resX(i: number): number {
  const totalW = resources.length * 50 + (resources.length - 1) * 24;
  return (SVG_W - totalW) / 2 + 25 + i * 74;
}

export default function FCISExplainer() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const handleClick = (i: number) => setActiveStep(activeStep === i ? null : i);

  // Build all connections
  const connections: { si: number; ri: number }[] = [];
  steps.forEach((step, si) => {
    step.resources.forEach((resId) => {
      const ri = resources.findIndex((r) => r.id === resId);
      if (ri >= 0) connections.push({ si, ri });
    });
  });

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* SVG diagram */}
      <div style={{
        background: 'var(--color-bg-elevated, #fff)',
        border: '3px solid var(--color-fg, #1a1a1a)',
        borderRadius: activeStep !== null ? '12px 12px 0 0' : 12,
        padding: '12px 8px 8px',
        boxShadow: activeStep !== null ? 'none' : '6px 6px 0 var(--color-fg, #1a1a1a)',
        overflow: 'hidden',
      }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ display: 'block' }}>
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="#e85d04" strokeWidth="0.8" opacity="0.3" />
            </pattern>
            <pattern id="hatch-on" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="#e85d04" strokeWidth="1.2" opacity="0.5" />
            </pattern>
          </defs>

          {/* Resource row label */}
          <text x={SVG_W / 2} y={RESOURCE_Y - 26} textAnchor="middle"
            style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 700, fill: 'var(--color-fg-subtle, #6b6b6b)', letterSpacing: '1.5px' }}
          >
            EXTERNAL RESOURCES
          </text>

          {/* Connection lines - from step top to resource bottom */}
          {connections.map(({ si, ri }, ci) => {
            const x1 = stepX(si);
            const y1 = STEP_Y - SHELL_R;
            const x2 = resX(ri);
            const y2 = RESOURCE_Y + DIAMOND_S + 2;
            const isLit = activeStep === si;
            const resColor = resources[ri].color;
            // Control point: halfway vertically, biased toward step's x
            const cpY = (y1 + y2) / 2;

            return (
              <line
                key={ci}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={isLit ? resColor : 'var(--color-border, #e0dcd4)'}
                strokeWidth={isLit ? 2.5 : 1}
                strokeDasharray={isLit ? 'none' : '3 3'}
                opacity={isLit ? 0.9 : 0.4}
                style={{ transition: 'all 0.25s ease' }}
              />
            );
          })}

          {/* Resource diamonds */}
          {resources.map((res, ri) => {
            const x = resX(ri);
            const y = RESOURCE_Y;
            const s = DIAMOND_S;
            const isLit = activeStep !== null && steps[activeStep].resources.includes(res.id);

            return (
              <g key={res.id}>
                <polygon
                  points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
                  fill={isLit ? res.color : 'var(--color-bg-alt, #f0ece4)'}
                  stroke={isLit ? res.color : 'var(--color-fg, #1a1a1a)'}
                  strokeWidth={2}
                  style={{ transition: 'all 0.25s ease' }}
                />
                <text x={x} y={y + s + 14} textAnchor="middle"
                  style={{
                    fontFamily: "'Source Code Pro', monospace", fontSize: 10, fontWeight: 700,
                    fill: isLit ? res.color : 'var(--color-fg-muted, #4a4a4a)',
                    transition: 'fill 0.25s ease',
                  }}
                >
                  {res.label}
                </text>
              </g>
            );
          })}

          {/* Orchestrator shell - dashed rect */}
          <rect
            x={stepX(0) - SHELL_R - 16}
            y={STEP_Y - SHELL_R - 16}
            width={stepX(steps.length - 1) - stepX(0) + SHELL_R * 2 + 32}
            height={SHELL_R * 2 + 32}
            rx={14}
            fill="none"
            stroke="var(--color-fg, #1a1a1a)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            opacity={0.25}
          />

          {/* Flow arrows */}
          {steps.map((_, i) => {
            if (i === 0) return null;
            const x1 = stepX(i - 1) + SHELL_R + 3;
            const x2 = stepX(i) - SHELL_R - 3;
            const y = STEP_Y;
            return (
              <g key={`arr-${i}`}>
                <line x1={x1} y1={y} x2={x2 - 5} y2={y}
                  stroke="var(--color-fg, #1a1a1a)" strokeWidth={2} />
                <polygon
                  points={`${x2},${y} ${x2 - 7},${y - 3.5} ${x2 - 7},${y + 3.5}`}
                  fill="var(--color-fg, #1a1a1a)"
                />
              </g>
            );
          })}

          {/* Request label */}
          <text x={stepX(0) - SHELL_R - 20} y={STEP_Y + 4} textAnchor="end"
            style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 600, fill: 'var(--color-fg-muted, #4a4a4a)' }}
          >
            request
          </text>
          <line
            x1={stepX(0) - SHELL_R - 16} y1={STEP_Y}
            x2={stepX(0) - SHELL_R - 3} y2={STEP_Y}
            stroke="var(--color-fg, #1a1a1a)" strokeWidth={2}
          />
          <polygon
            points={`${stepX(0) - SHELL_R},${STEP_Y} ${stepX(0) - SHELL_R - 6},${STEP_Y - 3} ${stepX(0) - SHELL_R - 6},${STEP_Y + 3}`}
            fill="var(--color-fg, #1a1a1a)"
          />

          {/* Response curve */}
          {(() => {
            const lastX = stepX(steps.length - 1) + SHELL_R + 4;
            const endY = STEP_Y + SHELL_R + 30;
            return (
              <>
                <path
                  d={`M ${lastX} ${STEP_Y} Q ${lastX + 30} ${STEP_Y} ${lastX + 30} ${endY} L ${SVG_W / 2 + 20} ${endY}`}
                  fill="none" stroke="var(--color-fg, #1a1a1a)" strokeWidth={1.5}
                  strokeDasharray="4 3" opacity={0.35}
                />
                <text x={SVG_W / 2} y={endY + 4} textAnchor="middle"
                  style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, fontWeight: 600, fill: 'var(--color-fg-muted, #4a4a4a)' }}
                >
                  response
                </text>
              </>
            );
          })()}

          {/* Pipeline steps */}
          {steps.map((step, i) => {
            const x = stepX(i);
            const y = STEP_Y;
            const on = activeStep === i;
            const hov = hoveredStep === i;
            const hi = on || hov;

            return (
              <g key={step.id}
                onClick={() => handleClick(i)}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Shell */}
                <circle cx={x} cy={y} r={SHELL_R}
                  fill={on ? 'url(#hatch-on)' : 'url(#hatch)'}
                  stroke={hi ? '#e85d04' : 'var(--color-fg, #1a1a1a)'}
                  strokeWidth={hi ? 2.5 : 1.5}
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Core */}
                <circle cx={x} cy={y} r={CORE_R}
                  fill={on ? '#3b82f6' : '#93c5fd'}
                  stroke={hi ? '#1d4ed8' : 'var(--color-fg, #1a1a1a)'}
                  strokeWidth={hi ? 2 : 1.5}
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Label */}
                <text x={x} y={y + SHELL_R + 16} textAnchor="middle"
                  style={{
                    fontFamily: "'Space Grotesk', system-ui", fontSize: 12, fontWeight: 700,
                    fill: on ? '#e85d04' : 'var(--color-fg, #1a1a1a)',
                    transition: 'fill 0.2s ease',
                  }}
                >
                  {step.label}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(16, ${SVG_H - 30})`}>
            <circle cx={6} cy={0} r={5} fill="#93c5fd" stroke="var(--color-fg, #1a1a1a)" strokeWidth={1} />
            <text x={16} y={3}
              style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 8, fill: 'var(--color-fg-muted, #4a4a4a)' }}
            >functional core (pure)</text>

            <circle cx={136} cy={0} r={5} fill="url(#hatch)" stroke="var(--color-fg, #1a1a1a)" strokeWidth={1} />
            <text x={146} y={3}
              style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 8, fill: 'var(--color-fg-muted, #4a4a4a)' }}
            >imperative shell (IO)</text>

            <polygon points="262,-5 267,0 262,5 257,0" fill="var(--color-bg-alt, #f0ece4)" stroke="var(--color-fg, #1a1a1a)" strokeWidth={1} />
            <text x={274} y={3}
              style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 8, fill: 'var(--color-fg-muted, #4a4a4a)' }}
            >external resource</text>
          </g>
        </svg>
      </div>

      {/* Detail panel */}
      {activeStep !== null && (
        <div style={{
          background: 'var(--color-bg-alt, #f0ece4)',
          border: '3px solid var(--color-fg, #1a1a1a)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '18px 22px',
          boxShadow: '6px 6px 0 var(--color-fg, #1a1a1a)',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {/* Mini icon */}
            <svg width={24} height={24} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={10} fill="url(#hatch-on)" stroke="#e85d04" strokeWidth={1.5} />
              <circle cx={12} cy={12} r={7} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1.5} />
            </svg>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-fg, #1a1a1a)' }}>
                {steps[activeStep].label}
              </span>
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginLeft: 10 }}>
                {steps[activeStep].coreDesc}
              </span>
            </div>
            {steps[activeStep].resources.map((resId) => {
              const res = resources.find((r) => r.id === resId)!;
              return (
                <span key={resId} style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 4,
                  background: res.color, color: '#fff',
                  boxShadow: '2px 2px 0 var(--color-fg, #1a1a1a)',
                }}>
                  {res.label}
                </span>
              );
            })}
          </div>

          <pre style={{
            fontFamily: "'Source Code Pro', 'JetBrains Mono', monospace",
            fontSize: 13, lineHeight: 1.6, margin: 0,
            padding: '14px 18px',
            background: 'var(--color-bg-elevated, #fff)',
            border: '2px solid var(--color-fg, #1a1a1a)',
            borderRadius: 8,
            whiteSpace: 'pre-wrap' as const,
            color: 'var(--color-fg, #1a1a1a)',
            boxShadow: '3px 3px 0 #059669',
          }}>
            {steps[activeStep].coreLogic}
          </pre>

          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: '#059669', fontWeight: 600,
          }}>
            <span style={{
              fontFamily: "'Source Code Pro', monospace", fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 4, border: '2px solid #059669', color: '#059669',
            }}>
              PURE
            </span>
            Test with plain values. No mocks. No network. No database.
          </div>
        </div>
      )}

      {/* Insight bar */}
      {activeStep === null && (
        <div style={{
          background: 'var(--color-bg-elevated, #fff)',
          border: '3px solid var(--color-fg, #1a1a1a)',
          borderRadius: 12,
          padding: '14px 18px',
          boxShadow: '4px 4px 0 #8338ec',
          fontSize: 13,
          color: 'var(--color-fg, #1a1a1a)',
          lineHeight: 1.5,
          marginTop: 12,
        }}>
          Click a step to see its <strong>pure core</strong> - the business logic that's independently testable with no mocks.
          The <strong>shell</strong> (hatched ring) handles all IO to external resources.
        </div>
      )}
    </div>
  );
}
