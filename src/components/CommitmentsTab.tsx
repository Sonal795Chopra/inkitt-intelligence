interface Commitment {
  id: string
  owner: string
  team: string
  what: string
  due_date: string
  status: 'open' | 'due_today' | 'slipped' | 'closed'
  days_delta: number | null
  okr_tag: string
  at_risk: boolean
  downstream: string[]
  source: 'standup' | 'seeded'
}

interface Props {
  commitments: Commitment[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return '—'
  const [, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommitmentsTab({ commitments }: Props) {
  if (!commitments || commitments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0b09]">
        <p className="text-xs text-white/20">Run analysis to see commitments</p>
      </div>
    )
  }

  const slipped  = commitments.filter(c => c.status === 'slipped')
  const dueToday = commitments.filter(c => c.status === 'due_today')
  const open     = commitments.filter(c => c.status === 'open')
  const closed   = commitments.filter(c => c.status === 'closed')

  const hitRate = closed.length + slipped.length > 0
    ? Math.round((closed.length / (closed.length + slipped.length)) * 100)
    : null

  const hitRateColor = hitRate === null
    ? 'text-white/30'
    : hitRate >= 70 ? 'text-[#4E9E8A]' : hitRate >= 50 ? 'text-[#E8B84B]' : 'text-[#E8714A]'

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0b09]">
      <div className="max-w-[1400px] mx-auto p-5 flex flex-col gap-5">

        {/* ── Section 1: Summary bar ───────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Total Open"
            value={open.length + dueToday.length}
            color="text-white/80"
          />
          <MetricCard
            label="Due Today"
            value={dueToday.length}
            color="text-[#E8B84B]"
            highlight={dueToday.length > 0}
            highlightColor="border-[#E8B84B]/30 bg-[#E8B84B]/5"
          />
          <MetricCard
            label="Slipped"
            value={slipped.length}
            color="text-[#E8714A]"
            highlight={slipped.length > 0}
            highlightColor="border-[#E8714A]/30 bg-[#E8714A]/5"
          />
          <MetricCard
            label="Hit Rate"
            value={hitRate !== null ? `${hitRate}%` : '—'}
            color={hitRateColor}
            sub={`${closed.length} closed / ${closed.length + slipped.length} resolved`}
          />
        </div>

        {/* ── Section 2: Ledger table ──────────────────────────────────────── */}
        <div className="bg-[#1a1714] border border-[#2a2520] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2a2520] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Commitment Ledger
            </span>
            <span className="text-[10px] text-white/25">{commitments.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2a2520]">
                  {['Status', 'Owner', 'Team', 'Commitment', 'Due', 'Days', 'OKR', 'Downstream'].map(h => (
                    <th key={h} className="text-left text-[9px] font-semibold uppercase tracking-widest text-white/25 px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commitments.map((c, i) => (
                  <LedgerRow key={c.id} commitment={c} even={i % 2 === 0} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 3: Team health ───────────────────────────────────────── */}
        <div className="bg-[#1a1714] border border-[#2a2520] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2a2520]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Team Commitment Health
            </span>
          </div>
          <div className="divide-y divide-[#2a2520]">
            {['Product', 'Data Science', 'Content'].map(team => (
              <TeamHealthRow key={team} team={team} commitments={commitments} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, color, sub, highlight, highlightColor }: {
  label: string
  value: string | number
  color: string
  sub?: string
  highlight?: boolean
  highlightColor?: string
}) {
  return (
    <div className={[
      'bg-[#1a1714] border rounded-lg p-4',
      highlight ? highlightColor : 'border-[#2a2520]',
    ].join(' ')}>
      <p className={`text-2xl font-bold leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-[10px] text-white/35 uppercase tracking-widest">{label}</p>
      {sub && <p className="text-[9px] text-white/20 mt-1">{sub}</p>}
    </div>
  )
}

// ─── LedgerRow ────────────────────────────────────────────────────────────────

function LedgerRow({ commitment: c, even }: { commitment: Commitment; even: boolean }) {
  const isSlipped = c.status === 'slipped'

  return (
    <tr className={[
      even ? 'bg-[#1a1714]' : 'bg-[#1e1b18]',
      isSlipped ? 'border-l-[3px] border-l-[#E8714A]' : 'border-l-[3px] border-l-transparent',
    ].join(' ')}>

      {/* Status pill */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <StatusPill status={c.status} />
      </td>

      {/* Owner */}
      <td className="px-3 py-2.5 whitespace-nowrap font-medium text-white/80">
        {c.owner}
      </td>

      {/* Team pill */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <TeamPill team={c.team} />
      </td>

      {/* Commitment text */}
      <td className="px-3 py-2.5 max-w-[280px]">
        <span className={isSlipped ? 'text-white/70' : 'text-white/50'}>
          {truncate(c.what, 55)}
        </span>
      </td>

      {/* Due date */}
      <td className="px-3 py-2.5 whitespace-nowrap text-white/40">
        {formatDate(c.due_date)}
      </td>

      {/* Days delta */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <DaysCell delta={c.days_delta} status={c.status} />
      </td>

      {/* OKR */}
      <td className="px-3 py-2.5 whitespace-nowrap text-white/30 text-[10px]">
        {c.okr_tag || '—'}
      </td>

      {/* Downstream */}
      <td className="px-3 py-2.5">
        <DownstreamCell downstream={c.downstream} />
      </td>
    </tr>
  )
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Commitment['status'] }) {
  const cfg = {
    slipped:   { label: 'SLIPPED',   cls: 'bg-[#E8714A] text-white' },
    due_today: { label: 'DUE TODAY', cls: 'bg-[#E8B84B] text-[#1a1714]' },
    open:      { label: 'OPEN',      cls: 'bg-[#3B6FA0] text-white' },
    closed:    { label: 'CLOSED',    cls: 'bg-[#4E9E8A] text-white' },
  }[status] ?? { label: status.toUpperCase(), cls: 'bg-white/10 text-white/50' }

  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── TeamPill ─────────────────────────────────────────────────────────────────

function TeamPill({ team }: { team: string }) {
  const cfg: Record<string, string> = {
    'Product':      'bg-[#3B6FA0]/20 text-[#7BAFD4] border border-[#3B6FA0]/30',
    'Data Science': 'bg-[#7B5EA7]/20 text-[#B49BCF] border border-[#7B5EA7]/30',
    'Content':      'bg-[#E8714A]/15 text-[#E8A080] border border-[#E8714A]/25',
  }
  const cls = cfg[team] ?? 'bg-white/5 text-white/40 border border-white/10'
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${cls}`}>
      {team}
    </span>
  )
}

// ─── DaysCell ─────────────────────────────────────────────────────────────────

function DaysCell({ delta, status }: { delta: number | null; status: string }) {
  if (status === 'closed') return <span className="text-white/20 text-[10px]">—</span>
  if (delta === null || delta === 99) return <span className="text-white/20 text-[10px]">?</span>
  if (delta === 0) return <span className="text-[#E8B84B] text-[10px] font-semibold">Today</span>
  if (delta < 0)  return <span className="text-[#E8714A] text-[10px] font-semibold">{delta}d</span>
  return <span className="text-white/30 text-[10px]">+{delta}d</span>
}

// ─── DownstreamCell ───────────────────────────────────────────────────────────

function DownstreamCell({ downstream }: { downstream: string[] }) {
  if (!downstream.length) return <span className="text-white/20 text-[10px]">—</span>

  const hasCEO = downstream.includes('CEO')
  const others = downstream.filter(d => d !== 'CEO')

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {hasCEO && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E8714A]/20 text-[#E8714A] border border-[#E8714A]/30">
          CEO
        </span>
      )}
      {others.length > 0 && (
        <span className="text-[10px] text-white/40">
          {truncate(others.join(', '), 22)}
        </span>
      )}
    </div>
  )
}

// ─── TeamHealthRow ────────────────────────────────────────────────────────────

function TeamHealthRow({ team, commitments }: { team: string; commitments: Commitment[] }) {
  const tc = commitments.filter(c => c.team === team)
  const teamOpen     = tc.filter(c => c.status === 'open').length
  const teamDueToday = tc.filter(c => c.status === 'due_today').length
  const teamSlipped  = tc.filter(c => c.status === 'slipped').length
  const teamClosed   = tc.filter(c => c.status === 'closed').length

  const denom = teamClosed + teamSlipped
  const rate  = denom > 0 ? Math.round((teamClosed / denom) * 100) : null
  const rateColor = rate === null ? 'text-white/30' : rate >= 70 ? 'text-[#4E9E8A]' : rate >= 50 ? 'text-[#E8B84B]' : 'text-[#E8714A]'

  // Health bar: green portion = closed / (closed + slipped), red = slipped portion
  const greenPct = denom > 0 ? (teamClosed / denom) * 100 : 0

  return (
    <div className="flex items-center gap-6 px-5 py-3">
      {/* Team label */}
      <div className="w-28 shrink-0">
        <TeamPill team={team} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-5 text-xs">
        <StatCell label="Open"      value={teamOpen}     color="text-white/60" />
        <StatCell label="Due Today" value={teamDueToday} color="text-[#E8B84B]" />
        <StatCell label="Slipped"   value={teamSlipped}  color="text-[#E8714A]" />
      </div>

      {/* Hit rate */}
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold w-12 text-right ${rateColor}`}>
          {rate !== null ? `${rate}%` : '—'}
        </span>
        <span className="text-[9px] text-white/25 uppercase tracking-widest">hit rate</span>
      </div>

      {/* Health bar */}
      <div className="flex-1 max-w-[160px]">
        <div className="h-2 bg-[#0d0b09] rounded-full overflow-hidden border border-[#2a2520] flex">
          <div
            className="h-full bg-[#4E9E8A]/70 transition-all duration-700"
            style={{ width: `${greenPct}%` }}
          />
          <div
            className="h-full bg-[#E8714A]/70 transition-all duration-700"
            style={{ width: `${100 - greenPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-[#4E9E8A]/50">{teamClosed} closed</span>
          <span className="text-[8px] text-[#E8714A]/50">{teamSlipped} slipped</span>
        </div>
      </div>
    </div>
  )
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`font-semibold ${color}`}>{value}</span>
      <span className="text-[9px] text-white/25">{label}</span>
    </div>
  )
}
