import { useEffect, useRef, useState, type ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Blocker {
  exists: boolean
  type: string
  days_blocked: number
  waiting_on_team?: string
  waiting_on_person?: string
}

interface Member {
  name: string
  working_on: string
  okr_tag: string
  blocker: Blocker
  commitment: { what: string; by: string; at_risk: boolean }
}

interface TeamExtraction {
  team: string
  members: Member[]
  team_health: 'green' | 'amber' | 'red'
}

interface Match {
  match_id: string
  type: string
  severity: 'critical' | 'high' | 'medium'
  team_a: string
  person_a: string
  team_b: string
  person_b: string
  description: string
  days_unresolved: number
  okr_impact: string
  recommended_action: string
  silent: boolean
}

interface MatcherOutput {
  matches: Match[]
  shared_bottlenecks: { team: string; blocking_count: number; teams_affected: string[]; total_days_lost: number }[]
  escalate_to_ceo: { reason: string; match_id: string; urgency: string }[]
}

interface DigestItem {
  priority: number
  status: string
  title: string
  action: string
  owner: string
  due: string
  okr_impact: string
}

interface Digest {
  items: DigestItem[]
}

interface Props {
  extracted: Record<string, object | null>
  matcherOutput: object | null
  digestOutput: object | null
}

// ─── Static reference data ────────────────────────────────────────────────────

const OKRS = [
  { id: 'User Retention',        label: 'User Retention',       target: 'April 7 nudge launch', progress: 62 },
  { id: 'Reader Engagement',     label: 'Reader Engagement',    target: 'Q2 CEO report',        progress: 74 },
  { id: 'Content Safety',        label: 'Content Safety',       target: 'Moderation spec + model', progress: 51 },
  { id: 'Experiment Velocity',   label: 'Experiment Velocity',  target: 'April 3 A/B test',     progress: 68 },
  { id: 'Personalisation',       label: 'Personalisation',      target: 'Shadow mode Mar 25',   progress: 79 },
]

// health → sparkline number (3=green, 2=amber, 1=red)
const HEALTH_NUM: Record<string, number> = { green: 3, amber: 2, red: 1 }

const SPARKLINE_HISTORY: Record<string, number[]> = {
  product:     [2, 2, 2, 2], // stable amber
  datascience: [3, 3, 2, 2], // was green, degrading
  content:     [3, 2, 2, 1], // was green, nose-diving
}

// simulated commitment hit rates (6-sprint rolling average)
const HIT_RATES: Record<string, number> = {
  Rohan: 78, Lena: 71, James: 83, Priya: 89, Tomás: 67,
  Noor: 74, Vikram: 69, Sasha: 91, Jin: 52, Mei: 61,
  Daniela: 77, Marcus: 58, Yuki: 72, Ren: 45, Preethi: 68, Sofia: 82,
}

const TEAM_LABELS: Record<string, string> = {
  product: 'Product', datascience: 'Data Science', content: 'Content',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrgDashboard({ extracted, matcherOutput, digestOutput }: Props) {
  const teams = ['product', 'datascience', 'content']
    .map(k => extracted[k] as TeamExtraction | null)
    .filter(Boolean) as TeamExtraction[]

  const matcher = matcherOutput as MatcherOutput | null
  const digest  = digestOutput  as Digest | null
  const hasData = teams.length > 0

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0b09]">
      {!hasData ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs text-white/20 text-center px-8">
            Run analysis on the Intelligence tab to populate the dashboard
          </p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-12 gap-4">

          {/* Row 1 — OKR bars (7 cols) + Dependency map (5 cols) */}
          <div className="col-span-7">
            <OKRSection teams={teams} matcher={matcher} />
          </div>
          <div className="col-span-5">
            <DependencyMap matcher={matcher} />
          </div>

          {/* Row 2 — Sparklines (4 cols) + Commitment (8 cols) */}
          <div className="col-span-4">
            <SparklineSection teams={teams} />
          </div>
          <div className="col-span-8">
            <CommitmentSection teams={teams} />
          </div>

          {/* Row 3 — Action board (6 cols) + Impact calculator (6 cols) */}
          <div className="col-span-6">
            <ActionBoard matcher={matcher} digest={digest} />
          </div>
          <div className="col-span-6">
            <ImpactCalculator matcher={matcher} />
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <div className="bg-[#1a1714] border border-[#2a2520] rounded-lg overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2520] shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{title}</span>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">{badge}</span>
        )}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}

// ─── 1. OKR Progress bars ─────────────────────────────────────────────────────

function OKRSection({ teams, matcher }: { teams: TeamExtraction[]; matcher: MatcherOutput | null }) {
  // Sum days_blocked per OKR tag from all blockers
  const daysAtRisk: Record<string, number> = {}
  for (const team of teams) {
    for (const m of team.members) {
      if (m.blocker.exists && m.blocker.days_blocked > 0 && m.okr_tag) {
        const tag = m.okr_tag
        const existing = daysAtRisk[tag] ?? 0
        daysAtRisk[tag] = Math.max(existing, m.blocker.days_blocked)
      }
    }
  }

  // Also collect cross-team match impact
  const matchDays: Record<string, number> = {}
  if (matcher) {
    for (const m of matcher.matches) {
      if (m.okr_impact && m.severity === 'critical') {
        // Extract OKR name (before ' — ')
        const okrName = m.okr_impact.split(' — ')[0].trim().split(' — ')[0]
        matchDays[okrName] = Math.max(matchDays[okrName] ?? 0, m.days_unresolved)
      }
    }
  }

  return (
    <Section title="OKR Progress" badge={`${OKRS.length} objectives`}>
      <div className="px-4 py-3 flex flex-col gap-3">
        {OKRS.map(okr => {
          const risk = Math.max(daysAtRisk[okr.id] ?? 0, matchDays[okr.id] ?? 0)
          // Erosion: each day at risk erodes ~1.8 points
          const erosion = Math.min(risk * 1.8, okr.progress * 0.35)
          return (
            <OKRBar key={okr.id} okr={okr} erosion={erosion} daysAtRisk={risk} />
          )
        })}
      </div>
    </Section>
  )
}

function OKRBar({ okr, erosion, daysAtRisk }: {
  okr: typeof OKRS[0]; erosion: number; daysAtRisk: number
}) {
  const healthy = okr.progress - erosion

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-white/80">{okr.label}</span>
        <div className="flex items-center gap-2">
          {daysAtRisk > 0 && (
            <span className="text-[10px] text-[#E8714A] font-semibold">
              −{erosion.toFixed(0)} pts · {daysAtRisk}d at risk
            </span>
          )}
          <span className="text-xs font-bold text-white/50">{okr.progress}%</span>
        </div>
      </div>
      <div className="relative h-5 bg-[#0d0b09] rounded overflow-hidden border border-[#2a2520]">
        {/* Base progress */}
        <div
          className="absolute inset-y-0 left-0 rounded bg-white/10 transition-all duration-700"
          style={{ width: `${okr.progress}%` }}
        />
        {/* Healthy portion */}
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-700"
          style={{
            width: `${healthy}%`,
            background: healthy < 50
              ? '#E8714A'
              : healthy < 65
                ? '#E8B84B'
                : '#4E9E8A',
            opacity: 0.7,
          }}
        />
        {/* At-risk erosion overlay */}
        {erosion > 0 && (
          <div
            className="absolute inset-y-0 rounded-r bg-[#E8714A]/40 border-l border-[#E8714A]/60"
            style={{ left: `${healthy}%`, width: `${erosion}%` }}
          />
        )}
        {/* Target label */}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-[9px] text-white/30 truncate">{okr.target}</span>
        </div>
      </div>
    </div>
  )
}

// ─── 2. Team health sparklines ────────────────────────────────────────────────

function SparklineSection({ teams }: { teams: TeamExtraction[] }) {
  return (
    <Section title="Team Health Trend" badge="5 standups">
      <div className="px-4 py-3 flex flex-col gap-4">
        {['product', 'datascience', 'content'].map(key => {
          const team = teams.find(t => t.team === key)
          const todayVal = team ? (HEALTH_NUM[team.team_health] ?? 2) : 2
          const history = [...(SPARKLINE_HISTORY[key] ?? [2, 2, 2, 2]), todayVal]
          return (
            <TeamSparkline
              key={key}
              label={TEAM_LABELS[key] ?? key}
              values={history}
              health={team?.team_health ?? 'amber'}
            />
          )
        })}
      </div>
    </Section>
  )
}

function TeamSparkline({ label, values, health }: { label: string; values: number[]; health: string }) {
  const w = 100, h = 36, pad = 4
  const maxV = 3, minV = 1
  const range = maxV - minV
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - minV) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const dotColor = health === 'green' ? '#4E9E8A' : health === 'red' ? '#E8714A' : '#E8B84B'
  const lastPt = values[values.length - 1]
  const lastX = pad + (w - pad * 2)
  const lastY = h - pad - ((lastPt - minV) / range) * (h - pad * 2)

  const trend = values[values.length - 1] - values[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/70">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] ${trend < 0 ? 'text-[#E8714A]' : trend > 0 ? 'text-[#4E9E8A]' : 'text-white/30'}`}>
            {trend < 0 ? '↓ degrading' : trend > 0 ? '↑ improving' : '→ stable'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {/* Grid lines */}
        {[1, 2, 3].map(v => {
          const y = h - pad - ((v - minV) / range) * (h - pad * 2)
          return (
            <line key={v} x1={pad} y1={y} x2={w - pad} y2={y}
              stroke="white" strokeOpacity={0.04} strokeWidth={0.5} strokeDasharray="2,3" />
          )
        })}
        {/* Area fill */}
        <polyline
          points={pts}
          fill="none"
          stroke={dotColor}
          strokeWidth={1.5}
          strokeOpacity={0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Today dot */}
        <circle cx={lastX} cy={lastY} r={3} fill={dotColor} opacity={0.9} />
        <circle cx={lastX} cy={lastY} r={5} fill={dotColor} opacity={0.15} />
      </svg>
    </div>
  )
}

// ─── 3. Dependency map (force-directed SVG) ───────────────────────────────────

const NODE_POSITIONS = {
  product:     { x: 200, y: 55 },
  datascience: { x: 80,  y: 185 },
  content:     { x: 320, y: 185 },
}

function DependencyMap({ matcher }: { matcher: MatcherOutput | null }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [matcher])

  if (!matcher) {
    return (
      <Section title="Blocker Dependency Map">
        <div className="flex items-center justify-center h-full text-xs text-white/20 p-4">
          Waiting for matcher output…
        </div>
      </Section>
    )
  }

  const bottleneckTeams = new Set(matcher.shared_bottlenecks.map(b => b.team))

  // Build edge data: one edge per unique team pair, aggregate severity and days
  const edgeMap: Record<string, { teams: [string, string]; maxDays: number; severity: 'critical' | 'high' | 'medium'; count: number }> = {}
  for (const m of matcher.matches) {
    const key = [m.team_a, m.team_b].sort().join('::')
    const existing = edgeMap[key]
    if (!existing) {
      edgeMap[key] = { teams: [m.team_a, m.team_b], maxDays: m.days_unresolved, severity: m.severity, count: 1 }
    } else {
      existing.maxDays = Math.max(existing.maxDays, m.days_unresolved)
      existing.count += 1
      // escalate severity
      if (m.severity === 'critical') existing.severity = 'critical'
      else if (m.severity === 'high' && existing.severity === 'medium') existing.severity = 'high'
    }
  }

  const edges = Object.values(edgeMap)
  const allTeams = Array.from(new Set(matcher.matches.flatMap(m => [m.team_a, m.team_b])))

  return (
    <Section title="Blocker Dependency Map" badge={`${matcher.matches.length} matches`}>
      <div className="px-3 py-3 h-full flex flex-col">
        <svg ref={svgRef} viewBox="0 0 400 240" className="w-full flex-1">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map(edge => {
            const [ta, tb] = edge.teams
            const pa = NODE_POSITIONS[ta as keyof typeof NODE_POSITIONS]
            const pb = NODE_POSITIONS[tb as keyof typeof NODE_POSITIONS]
            if (!pa || !pb) return null

            const color = edge.severity === 'critical' ? '#E8714A' : edge.severity === 'high' ? '#E8B84B' : '#5a5248'
            const strokeW = Math.max(1, Math.min(edge.maxDays * 0.8, 5))

            // Curved path
            const mx = (pa.x + pb.x) / 2
            const my = (pa.y + pb.y) / 2 - 20
            const d = `M ${pa.x} ${pa.y} Q ${mx} ${my} ${pb.x} ${pb.y}`

            return (
              <g key={`${ta}-${tb}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeW}
                  strokeOpacity={visible ? 0.5 : 0}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-opacity 0.8s ease' }}
                  filter="url(#glow)"
                />
                {/* Match count badge */}
                <circle cx={mx} cy={my} r={8} fill="#1a1714" stroke={color} strokeOpacity={0.4} strokeWidth={0.5} />
                <text x={mx} y={my + 3.5} textAnchor="middle" fill={color} fontSize={7} fontWeight="bold" opacity={0.9}>
                  {edge.count}
                </text>
                {/* Days tag */}
                <text x={(pa.x + mx) / 2 + 4} y={(pa.y + my) / 2 - 3} fill={color} fontSize={6} opacity={0.6}>
                  {edge.maxDays}d
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {allTeams.map(teamKey => {
            const pos = NODE_POSITIONS[teamKey as keyof typeof NODE_POSITIONS]
            if (!pos) return null
            const isBottleneck = bottleneckTeams.has(teamKey)
            const teamData = ['product', 'datascience', 'content'].includes(teamKey)
            const label = TEAM_LABELS[teamKey] ?? teamKey

            // Count outgoing critical matches
            const critCount = matcher.matches.filter(
              m => (m.team_a === teamKey || m.team_b === teamKey) && m.severity === 'critical'
            ).length
            const nodeR = 28 + Math.min(critCount * 2, 8)

            return (
              <g key={teamKey} transform={`translate(${pos.x},${pos.y})`}>
                {/* Ping ring for bottlenecks */}
                {isBottleneck && (
                  <>
                    <circle r={nodeR + 8} fill="none" stroke="#E8714A" strokeWidth={1} opacity={0.3}>
                      <animate attributeName="r" values={`${nodeR + 4};${nodeR + 16};${nodeR + 4}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle r={nodeR + 4} fill="none" stroke="#E8714A" strokeWidth={0.5} opacity={0.2} />
                  </>
                )}

                {/* Node circle */}
                <circle
                  r={nodeR}
                  fill="#1a1714"
                  stroke={isBottleneck ? '#E8714A' : teamData ? '#2a2a2a' : '#2a2a2a'}
                  strokeWidth={isBottleneck ? 1.5 : 1}
                  strokeOpacity={visible ? 1 : 0}
                  style={{ transition: 'stroke-opacity 0.5s ease' }}
                />

                {/* Team label */}
                <text
                  y={-5}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity={0.85}
                  fontSize={8}
                  fontWeight="600"
                >
                  {label}
                </text>
                {isBottleneck && (
                  <text y={6} textAnchor="middle" fill="#E8714A" fontSize={6.5}>
                    BOTTLENECK
                  </text>
                )}
                {critCount > 0 && !isBottleneck && (
                  <text y={6} textAnchor="middle" fill="#E8B84B" fontSize={6.5} opacity={0.7}>
                    {critCount} critical
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="flex items-center gap-1 text-[9px] text-white/30">
            <span className="inline-block w-5 h-0.5 bg-[#E8714A]" /> critical
          </span>
          <span className="flex items-center gap-1 text-[9px] text-white/30">
            <span className="inline-block w-5 h-0.5 bg-[#E8B84B]" /> high
          </span>
          <span className="flex items-center gap-1 text-[9px] text-white/30">
            <span className="inline-block w-3 h-0.5 bg-[#E8714A]" />
            <span className="inline-block w-3 h-0.5 bg-[#E8714A]" />
            pulsing ring = bottleneck
          </span>
        </div>
      </div>
    </Section>
  )
}

// ─── 4. Commitment hit rate ───────────────────────────────────────────────────

function CommitmentSection({ teams }: { teams: TeamExtraction[] }) {
  const people = teams.flatMap(t =>
    t.members.map(m => ({
      name: m.name,
      team: t.team,
      rate: HIT_RATES[m.name] ?? 70,
      atRisk: m.commitment.at_risk,
    }))
  ).sort((a, b) => a.rate - b.rate)

  return (
    <Section title="Commitment Hit Rate" badge="6-sprint rolling">
      <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {people.map(p => (
          <CommitmentBar key={`${p.team}-${p.name}`} person={p} />
        ))}
      </div>
    </Section>
  )
}

function CommitmentBar({ person }: { person: { name: string; team: string; rate: number; atRisk: boolean } }) {
  const isBad = person.rate < 60
  const isOk  = person.rate >= 60 && person.rate < 75
  const color  = isBad ? '#E8714A' : isOk ? '#E8B84B' : '#4E9E8A'
  const teamLabel = TEAM_LABELS[person.team] ?? person.team

  return (
    <div>
      <div className="flex items-baseline justify-between mb-0.5">
        <span className="text-xs text-white/70">{person.name}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/25">{teamLabel}</span>
          {person.atRisk && (
            <span className="text-[9px] text-[#E8B84B]">⚠</span>
          )}
          <span className="text-[10px] font-bold" style={{ color }}>{person.rate}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-[#0d0b09] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${person.rate}%`, backgroundColor: color, opacity: 0.75 }}
        />
      </div>
      {isBad && (
        <p className="text-[9px] text-[#E8714A]/70 mt-0.5">Below threshold — review commitments</p>
      )}
    </div>
  )
}

// ─── 5. Action board ─────────────────────────────────────────────────────────

function ActionBoard({ matcher, digest }: { matcher: MatcherOutput | null; digest: Digest | null }) {
  if (!matcher && !digest) {
    return (
      <Section title="Action Board">
        <div className="flex items-center justify-center h-24 text-xs text-white/20">
          Waiting for analysis…
        </div>
      </Section>
    )
  }

  // Build rows from escalate_to_ceo first, then remaining criticals
  const ceoMatchIds = new Set((matcher?.escalate_to_ceo ?? []).map(e => e.match_id))
  const criticals = (matcher?.matches ?? []).filter(m => m.severity === 'critical')

  type Row = { action: string; owner: string; due: string; unblocks: string; okr: string; urgent: boolean }

  const rows: Row[] = []

  // CEO escalations first
  for (const esc of (matcher?.escalate_to_ceo ?? [])) {
    const m = criticals.find(c => c.match_id === esc.match_id)
    if (m) {
      rows.push({
        action: m.recommended_action,
        owner: m.person_b || m.person_a,
        due: esc.urgency === 'today' ? 'Today' : 'This week',
        unblocks: `${m.person_a} (${TEAM_LABELS[m.team_a] ?? m.team_a})`,
        okr: m.okr_impact.split(' — ')[0],
        urgent: true,
      })
    }
  }

  // Remaining criticals not already in CEO list
  for (const m of criticals) {
    if (!ceoMatchIds.has(m.match_id)) {
      rows.push({
        action: m.recommended_action,
        owner: m.person_b || m.person_a,
        due: m.days_unresolved >= 3 ? 'Today' : 'This week',
        unblocks: `${m.person_a} (${TEAM_LABELS[m.team_a] ?? m.team_a})`,
        okr: m.okr_impact.split(' — ')[0],
        urgent: m.days_unresolved >= 3,
      })
    }
  }

  return (
    <Section title="Action Board" badge={`${rows.length} actions`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2a2520]">
              {['Action', 'Owner', 'Due', 'Unblocks', 'OKR'].map(h => (
                <th key={h} className="text-left text-[9px] font-semibold uppercase tracking-widest text-white/25 px-4 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {rows.map((row, i) => (
              <tr key={i} className={row.urgent ? 'bg-[#E8714A]/5' : ''}>
                <td className="px-4 py-2.5 max-w-[240px]">
                  <span className={`leading-snug ${row.urgent ? 'text-white/80' : 'text-white/55'}`}>
                    {row.urgent && <span className="text-[#E8714A] mr-1">▲</span>}
                    {row.action.length > 90 ? row.action.slice(0, 90) + '…' : row.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-white/70 font-medium">{row.owner}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    row.due === 'Today' ? 'bg-[#E8714A]/20 text-[#E8714A]' : 'bg-white/5 text-white/40'
                  }`}>
                    {row.due}
                  </span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-white/50">{row.unblocks}</td>
                <td className="px-4 py-2.5 text-white/40 max-w-[120px] truncate">{row.okr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

// ─── 6. Impact calculator ─────────────────────────────────────────────────────

function ImpactCalculator({ matcher }: { matcher: MatcherOutput | null }) {
  if (!matcher) {
    return (
      <Section title="Impact Calculator">
        <div className="flex items-center justify-center h-24 text-xs text-white/20">
          Waiting for analysis…
        </div>
      </Section>
    )
  }

  const criticals = matcher.matches.filter(m => m.severity === 'critical')
  // Dedupe by OKR so we don't show the same OKR twice
  const seen = new Set<string>()
  const unique = criticals.filter(m => {
    const key = m.okr_impact.split(' — ')[0]
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <Section title="Impact Calculator" badge="critical blockers only">
      <div className="px-4 py-3 flex flex-col gap-3 overflow-y-auto max-h-full">
        {unique.map(m => <ImpactCard key={m.match_id} match={m} />)}
        {unique.length === 0 && (
          <p className="text-xs text-white/20 text-center py-4">No critical blockers found</p>
        )}
      </div>
    </Section>
  )
}

function ImpactCard({ match }: { match: Match }) {
  const okrLabel = match.okr_impact.split(' — ')[0]
  const okrDetail = match.okr_impact.split(' — ').slice(1).join(' — ')
  const okr = OKRS.find(o => o.id === okrLabel)

  const alreadyLost = match.days_unresolved
  const projected = alreadyLost + 5

  // Impact estimate: each unresolved day erodes ~1.8 pts; 5 more days adds ~9pts
  const currentErosion = Math.min(alreadyLost * 1.8, 25)
  const projectedErosion = Math.min(projected * 1.8, 35)
  const baseProgress = okr?.progress ?? 65

  return (
    <div className="border border-[#2a2520] rounded-lg p-3 bg-[#0d0b09]">
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <span className="text-[10px] font-bold text-[#E8714A] uppercase tracking-widest">Critical</span>
          <p className="text-xs font-semibold text-white mt-0.5">
            {match.person_a} ← {match.person_b}
          </p>
          <p className="text-[10px] text-white/35 mt-0.5">
            {TEAM_LABELS[match.team_a] ?? match.team_a} waiting on {TEAM_LABELS[match.team_b] ?? match.team_b}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#E8714A]">{alreadyLost}d</p>
          <p className="text-[9px] text-white/30">already lost</p>
        </div>
      </div>

      {/* OKR erosion bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-white/40">{okrLabel}</span>
          <span className="text-[9px] text-[#E8714A]">
            −{currentErosion.toFixed(0)} pts now · −{projectedErosion.toFixed(0)} pts in 5 days
          </span>
        </div>
        <div className="relative h-4 bg-[#1a1714] rounded border border-[#2a2520] overflow-hidden">
          {/* Current healthy portion */}
          <div
            className="absolute inset-y-0 left-0 bg-[#4E9E8A]/50 rounded"
            style={{ width: `${baseProgress - currentErosion}%` }}
          />
          {/* Current erosion */}
          <div
            className="absolute inset-y-0 bg-[#E8714A]/40 border-l border-[#E8714A]/40"
            style={{ left: `${baseProgress - currentErosion}%`, width: `${currentErosion}%` }}
          />
          {/* Projected additional erosion */}
          <div
            className="absolute inset-y-0 bg-[#E8714A]/20 border-l border-[#E8714A]/20 border-dashed"
            style={{ left: `${baseProgress}%`, width: `${projectedErosion - currentErosion}%` }}
          />
          {/* Labels */}
          <div className="absolute inset-0 flex items-center justify-between px-1.5">
            <span className="text-[8px] text-white/50">{(baseProgress - currentErosion).toFixed(0)}%</span>
            <span className="text-[8px] text-[#E8714A]/60">→ {(baseProgress - projectedErosion).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Consequence */}
      {okrDetail && (
        <p className="text-[10px] text-white/35 leading-snug border-t border-[#2a2520] pt-2">
          ⚠ {okrDetail}
        </p>
      )}
    </div>
  )
}
