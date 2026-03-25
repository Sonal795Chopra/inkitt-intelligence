type TeamKey = 'product' | 'datascience' | 'content'

interface Member {
  name: string
  working_on: string
  okr_tag: string
  blocker: {
    exists: boolean
    type: string
    description: string
    days_blocked: number
    waiting_on_team?: string
    waiting_on_person?: string
  }
  timeline: { status: string }
}

interface TeamExtraction {
  team: string
  members: Member[]
  team_health: string
}

interface Match {
  match_id: string
  person_a: string
  person_b: string
  team_a: string
  team_b: string
}

interface MatcherOutput {
  matches: Match[]
  escalate_to_ceo: { match_id: string; reason: string }[]
}

interface Props {
  extracted: Record<TeamKey, object | null>
  matcherOutput: object | null
}

const TEAM_CONFIGS: { key: TeamKey; label: string }[] = [
  { key: 'product', label: 'Product' },
  { key: 'datascience', label: 'Data Science' },
  { key: 'content', label: 'Content / Publishing' },
]

export default function IntelligencePanel({ extracted, matcherOutput }: Props) {
  const matcher = matcherOutput as MatcherOutput | null

  const crossTeamPeople = new Set<string>()
  const ceoPeople = new Set<string>()

  if (matcher) {
    const ceoMatchIds = new Set((matcher.escalate_to_ceo ?? []).map((e: { match_id: string }) => e.match_id))

    for (const m of matcher.matches ?? []) {
      crossTeamPeople.add(`${m.team_a}::${m.person_a}`)
      crossTeamPeople.add(`${m.team_b}::${m.person_b}`)
      if (ceoMatchIds.has(m.match_id)) {
        ceoPeople.add(`${m.team_a}::${m.person_a}`)
        ceoPeople.add(`${m.team_b}::${m.person_b}`)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col border-r border-[#2a2a2a] overflow-hidden">
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-[#2a2a2a]">
        <p className="text-xs text-white/30 uppercase tracking-widest">Team Intelligence</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {TEAM_CONFIGS.map(({ key, label }) => {
          const data = extracted[key] as TeamExtraction | null
          return (
            <TeamCard
              key={key}
              teamKey={key}
              label={label}
              data={data}
              crossTeamPeople={crossTeamPeople}
              ceoPeople={ceoPeople}
            />
          )
        })}
      </div>
    </div>
  )
}

function TeamCard({
  teamKey,
  label,
  data,
  crossTeamPeople,
  ceoPeople,
}: {
  teamKey: TeamKey
  label: string
  data: TeamExtraction | null
  crossTeamPeople: Set<string>
  ceoPeople: Set<string>
}) {
  const healthDot = data ? healthColor(data.team_health) : null

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          {healthDot ? (
            <span className={`w-2 h-2 rounded-full ${healthDot}`} />
          ) : (
            <span className="w-2 h-2 rounded-full bg-white/10" />
          )}
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        {data && (
          <span className="text-xs text-white/30">
            {data.members.length} member{data.members.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Members */}
      {!data ? (
        <div className="px-4 py-5 text-xs text-white/20 italic">Waiting for extraction…</div>
      ) : (
        <div className="divide-y divide-[#2a2a2a]">
          {data.members.map(member => {
            const nameKey = `${data.team ?? teamKey}::${member.name}`
            const isCrossTeam = crossTeamPeople.has(nameKey)
            const isCEO = ceoPeople.has(nameKey)
            return (
              <MemberRow
                key={member.name}
                member={member}
                isCrossTeam={isCrossTeam}
                isCEO={isCEO}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MemberRow({
  member,
  isCrossTeam,
  isCEO,
}: {
  member: Member
  isCrossTeam: boolean
  isCEO: boolean
}) {
  const chip = blockerChip(member.blocker)

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-start justify-between gap-2">
        {/* Name + badges */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-xs font-semibold text-white shrink-0">{member.name}</span>
          {isCEO && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 shrink-0">
              CEO ⚠
            </span>
          )}
          {isCrossTeam && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 shrink-0">
              CROSS-TEAM ↗
            </span>
          )}
        </div>
        {/* Blocker chip */}
        <div className="shrink-0">{chip}</div>
      </div>

      {/* Working on */}
      <p className="text-xs text-white/40 mt-1 leading-snug line-clamp-1">
        {member.working_on}
      </p>
    </div>
  )
}

function blockerChip(blocker: Member['blocker']) {
  if (!blocker.exists) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25">
        CLEAR
      </span>
    )
  }

  const type = blocker.type
  const days = blocker.days_blocked

  if (type === 'waiting_known' || type === 'waiting_unknown') {
    const label = type === 'waiting_known' ? 'WAITING' : 'UNRESOLVED'
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25">
        {label}{days > 0 ? ` · ${days}d` : ''}
      </span>
    )
  }

  if (type === 'fundamental') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25">
        FUNDAMENTAL
      </span>
    )
  }

  // at_risk or other
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25">
      CONFLICT
    </span>
  )
}

function healthColor(health: string) {
  if (health === 'green') return 'bg-[#22c55e]'
  if (health === 'red') return 'bg-[#ef4444]'
  return 'bg-[#f59e0b]' // amber
}
