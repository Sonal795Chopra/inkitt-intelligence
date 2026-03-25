interface DigestItem {
  priority: number
  status: string
  title: string
  situation: string
  how_long: string
  okr_impact: string
  action: string
  owner: string
  due: string
}

interface CompanyPulse {
  teams_on_track: string[]
  teams_at_risk: string[]
  total_days_lost_to_waiting: number
  shared_bottlenecks: string[]
}

interface Digest {
  digest_date: string
  headline: string
  items: DigestItem[]
  company_pulse: CompanyPulse
}

interface Props {
  digest: object | null
}

export default function DigestPanel({ digest }: Props) {
  const data = digest as Digest | null

  return (
    <div className="w-[420px] shrink-0 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-[#2a2520]">
        <p className="text-xs text-white/30 uppercase tracking-widest">CEO Morning Digest</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!data ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-white/20 text-center px-8">
              Run analysis to generate the CEO digest
            </p>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            {/* Date + Headline */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                {data.digest_date}
              </p>
              <p className="text-sm font-semibold text-white leading-snug">{data.headline}</p>
            </div>

            {/* Priority items */}
            <div className="flex flex-col gap-3">
              {data.items.map(item => (
                <ItemCard key={item.priority} item={item} />
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-[#2a2520] pt-4">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Company Pulse</p>
              <PulseSection pulse={data.company_pulse} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ItemCard({ item }: { item: DigestItem }) {
  const isRed = item.status === '🔴'
  const isGreen = item.status === '✅'

  return (
    <div
      className={[
        'rounded-lg border overflow-hidden',
        isRed
          ? 'border-[#E8714A]/30 bg-[#E8714A]/5'
          : isGreen
            ? 'border-[#4E9E8A]/30 bg-[#4E9E8A]/5'
            : 'border-[#E8B84B]/30 bg-[#E8B84B]/5',
      ].join(' ')}
    >
      {/* Item header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span className="text-sm leading-none">{item.status}</span>
        <span className="text-xs font-bold text-white uppercase tracking-wide flex-1">
          {item.title}
        </span>
        <span
          className={[
            'text-[10px] font-semibold px-1.5 py-0.5 rounded',
            item.due === 'today'
              ? 'bg-[#E8714A]/20 text-[#E8714A]'
              : 'bg-white/10 text-white/50',
          ].join(' ')}
        >
          {item.due}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 flex flex-col gap-2">
        {/* Situation */}
        <p className="text-xs text-white/50 leading-snug line-clamp-2">{item.situation}</p>

        {/* How long */}
        <p className="text-[10px] text-white/30">⏱ {item.how_long}</p>

        {/* Action */}
        <div className="bg-white/5 rounded px-2.5 py-2">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Action</p>
          <p className="text-xs font-semibold text-white leading-snug">{item.action}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <span>{item.owner}</span>
          <span className="text-white/20">{item.okr_impact}</span>
        </div>
      </div>
    </div>
  )
}

function PulseSection({ pulse }: { pulse: CompanyPulse }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[#1a1714] border border-[#2a2520] rounded-lg p-3">
          <p className="text-2xl font-bold text-[#E8714A]">{pulse.total_days_lost_to_waiting}</p>
          <p className="text-[10px] text-white/30 mt-0.5">days lost to waiting</p>
        </div>
        <div className="flex-1 bg-[#1a1714] border border-[#2a2520] rounded-lg p-3">
          <p className="text-2xl font-bold text-[#4E9E8A]">{pulse.teams_on_track.length}</p>
          <p className="text-[10px] text-white/30 mt-0.5">teams on track</p>
        </div>
        <div className="flex-1 bg-[#1a1714] border border-[#2a2520] rounded-lg p-3">
          <p className="text-2xl font-bold text-[#E8B84B]">{pulse.teams_at_risk.length}</p>
          <p className="text-[10px] text-white/30 mt-0.5">teams at risk</p>
        </div>
      </div>

      {/* On track */}
      {pulse.teams_on_track.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">On Track</p>
          <div className="flex flex-wrap gap-1.5">
            {pulse.teams_on_track.map(team => (
              <span
                key={team}
                className="text-xs px-2 py-0.5 rounded-full bg-[#4E9E8A]/15 text-[#4E9E8A] border border-[#4E9E8A]/25"
              >
                {team}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* At risk */}
      {pulse.teams_at_risk.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">At Risk</p>
          <div className="flex flex-wrap gap-1.5">
            {pulse.teams_at_risk.map(team => (
              <span
                key={team}
                className="text-xs px-2 py-0.5 rounded-full bg-[#E8714A]/15 text-[#E8714A] border border-[#E8714A]/25"
              >
                {team}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottlenecks */}
      {pulse.shared_bottlenecks.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">Shared Bottlenecks</p>
          <div className="flex flex-col gap-1.5">
            {pulse.shared_bottlenecks.map((b, i) => (
              <div
                key={i}
                className="text-xs text-white/50 bg-[#1a1714] border border-[#2a2520] rounded px-2.5 py-1.5"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
