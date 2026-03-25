import type { TeamExtraction, Blocker, BlockerSeverity, BlockerType } from '../types'

const SEVERITY_STYLES: Record<BlockerSeverity, { dot: string; badge: string; border: string }> = {
  red:   { dot: 'bg-red-500',    badge: 'bg-red-900/40 text-red-300 border-red-700',    border: 'border-l-red-500' },
  amber: { dot: 'bg-amber-400',  badge: 'bg-amber-900/40 text-amber-300 border-amber-700', border: 'border-l-amber-400' },
  green: { dot: 'bg-emerald-500',badge: 'bg-emerald-900/30 text-emerald-300 border-emerald-700', border: 'border-l-emerald-500' },
}

const TYPE_LABEL: Record<BlockerType, string> = {
  technical: 'Technical',
  dependency: 'Dependency',
  resource: 'Resource',
  process: 'Process',
  external: 'External',
}

const TEAM_COLORS: Record<string, string> = {
  product:     'text-blue-400',
  datascience: 'text-purple-400',
  content:     'text-emerald-400',
}

const TEAM_LABELS: Record<string, string> = {
  product:     'Product',
  datascience: 'Data Science',
  content:     'Content / Publishing',
}

function BlockerCard({ blocker }: { blocker: Blocker }) {
  const s = SEVERITY_STYLES[blocker.severity]
  return (
    <div className={`border-l-2 ${s.border} bg-gray-800/50 rounded-r-md p-3 space-y-1.5`}>
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        <p className="text-xs text-gray-200 leading-relaxed">{blocker.description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-4">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${s.badge}`}>
          {blocker.severity.toUpperCase()}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-400">
          {TYPE_LABEL[blocker.type]}
        </span>
        {blocker.crossTeamDependency && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-indigo-700 text-indigo-400">
            ⇄ {blocker.crossTeamDependency}
          </span>
        )}
      </div>
      {blocker.okrImpact && (
        <p className="text-[10px] text-gray-500 pl-4">OKR: {blocker.okrImpact}</p>
      )}
    </div>
  )
}

function TeamCard({ extraction }: { extraction: TeamExtraction }) {
  const color = TEAM_COLORS[extraction.team] ?? 'text-gray-400'
  const label = TEAM_LABELS[extraction.team] ?? extraction.team
  const reds = extraction.blockers.filter(b => b.severity === 'red').length
  const ambers = extraction.blockers.filter(b => b.severity === 'amber').length

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-900 flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</span>
        <div className="flex gap-2 text-[10px]">
          {reds > 0 && <span className="bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">{reds} red</span>}
          {ambers > 0 && <span className="bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded">{ambers} amber</span>}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-gray-400 leading-relaxed">{extraction.summary}</p>

        {extraction.blockers.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Blockers</p>
            {extraction.blockers.map(b => <BlockerCard key={b.id} blocker={b} />)}
          </div>
        )}

        {extraction.wins.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Wins</p>
            {extraction.wins.map((w, i) => (
              <p key={i} className="text-xs text-gray-500 pl-3 before:content-['✓'] before:text-emerald-600 before:mr-2">{w}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  extractions: TeamExtraction[]
  isLoading: boolean
}

export default function ExtractionPanel({ extractions, isLoading }: Props) {
  return (
    <div className="w-1/3 border-r border-gray-800 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <h2 className="text-sm font-semibold text-gray-300">Structured Extraction</h2>
        <p className="text-xs text-gray-600 mt-0.5">Blockers, severity, cross-team flags</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Extracting blockers…</p>
          </div>
        )}
        {!isLoading && extractions.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-12">
            Run analysis to see structured extractions
          </p>
        )}
        {extractions.map(e => <TeamCard key={e.team} extraction={e} />)}
      </div>
    </div>
  )
}
