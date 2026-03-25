import { useState } from 'react'
import { SAMPLE_TRANSCRIPTS } from './data/sampleTranscripts.js'
import { extractStandup } from './prompts/extraction.js'
import { matchCrossTeamBlockers } from './prompts/crossTeamMatch.js'
import { generateCEODigest } from './prompts/ceoDigest.js'
import TranscriptPanel from './components/TranscriptPanel'
import IntelligencePanel from './components/IntelligencePanel'
import DigestPanel from './components/DigestPanel'
import OrgDashboard from './components/OrgDashboard'

const TEAMS = ['product', 'datascience', 'content'] as const
type TeamKey = typeof TEAMS[number]
type AppTab = 'intelligence' | 'dashboard'

type LoadingPhase =
  | 'idle'
  | 'extracting_product'
  | 'extracting_datascience'
  | 'extracting_content'
  | 'matching'
  | 'generating_digest'
  | 'done'
  | 'error'

export default function App() {
  const [tab, setTab] = useState<AppTab>('intelligence')

  const [transcripts, setTranscripts] = useState<Record<TeamKey, string>>({
    product: '',
    datascience: '',
    content: '',
  })

  const [extracted, setExtracted] = useState<Record<TeamKey, object | null>>({
    product: null,
    datascience: null,
    content: null,
  })

  const [matcherOutput, setMatcherOutput] = useState<object | null>(null)
  const [digestOutput, setDigestOutput] = useState<object | null>(null)
  const [phase, setPhase] = useState<LoadingPhase>('idle')
  const [error, setError] = useState<string | null>(null)

  function loadSample(team: TeamKey) {
    setTranscripts(prev => ({ ...prev, [team]: SAMPLE_TRANSCRIPTS[team] }))
  }

  async function runAnalysis() {
    setError(null)
    setExtracted({ product: null, datascience: null, content: null })
    setMatcherOutput(null)
    setDigestOutput(null)

    try {
      setPhase('extracting_product')

      const [productResult, dsResult, contentResult] = await Promise.all([
        extractStandup(transcripts.product).then(r => {
          setExtracted(prev => ({ ...prev, product: r }))
          setPhase('extracting_datascience')
          return r
        }),
        extractStandup(transcripts.datascience).then(r => {
          setExtracted(prev => ({ ...prev, datascience: r }))
          setPhase('extracting_content')
          return r
        }),
        extractStandup(transcripts.content).then(r => {
          setExtracted(prev => ({ ...prev, content: r }))
          return r
        }),
      ])

      setPhase('matching')
      const matcher = await matchCrossTeamBlockers([productResult, dsResult, contentResult])
      setMatcherOutput(matcher)

      setPhase('generating_digest')
      const digest = await generateCEODigest(matcher, [productResult, dsResult, contentResult])
      setDigestOutput(digest)

      setPhase('done')
    } catch (e: unknown) {
      setPhase('error')
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const isRunning = [
    'extracting_product', 'extracting_datascience', 'extracting_content',
    'matching', 'generating_digest',
  ].includes(phase)

  const canRun =
    transcripts.product.trim().length > 0 &&
    transcripts.datascience.trim().length > 0 &&
    transcripts.content.trim().length > 0 &&
    !isRunning

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d0b09] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-0 border-b border-[#2a2520] shrink-0">
        {/* Left: wordmark + tabs */}
        <div className="flex items-center gap-0">
          <div className="flex items-center gap-2 pr-6 border-r border-[#2a2520] py-3">
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }} className="text-[21px] text-[#F5EFE8] tracking-tight leading-none">
              Inkitt
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase text-[#E8714A]/70 self-end pb-[3px]">
              Org Intelligence
            </span>
          </div>
          <div className="flex items-center gap-0 pl-2">
            {(['intelligence', 'dashboard'] as AppTab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-4 py-3 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px',
                  tab === t
                    ? 'text-white border-white'
                    : 'text-white/35 border-transparent hover:text-white/60',
                ].join(' ')}
              >
                {t === 'intelligence' ? 'Intelligence' : 'Org Dashboard'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: status */}
        <StatusBar phase={phase} error={error} />
      </header>

      {/* Body */}
      {tab === 'intelligence' ? (
        <div className="flex flex-1 overflow-hidden">
          <TranscriptPanel
            transcripts={transcripts}
            onTranscriptChange={(team, val) =>
              setTranscripts(prev => ({ ...prev, [team]: val }))
            }
            onLoadSample={loadSample}
            onRun={runAnalysis}
            canRun={canRun}
            isRunning={isRunning}
          />
          <IntelligencePanel extracted={extracted} matcherOutput={matcherOutput} />
          <DigestPanel digest={digestOutput} />
        </div>
      ) : (
        <OrgDashboard
          extracted={extracted}
          matcherOutput={matcherOutput}
          digestOutput={digestOutput}
        />
      )}
    </div>
  )
}

function StatusBar({ phase, error }: { phase: LoadingPhase; error: string | null }) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#E8714A]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E8714A]" />
        Error — check console
      </div>
    )
  }

  const labels: Partial<Record<LoadingPhase, string>> = {
    extracting_product:     'Extracting Product standup…',
    extracting_datascience: 'Extracting Data Science standup…',
    extracting_content:     'Extracting Content standup…',
    matching:               'Matching cross-team blockers…',
    generating_digest:      'Generating CEO digest…',
    done:                   'Analysis complete',
  }

  if (phase === 'idle') return null
  const isDone = phase === 'done'
  const label  = labels[phase]

  return (
    <div className="flex items-center gap-2 text-xs">
      {!isDone && (
        <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      )}
      {isDone && <span className="w-1.5 h-1.5 rounded-full bg-[#4E9E8A]" />}
      <span className={isDone ? 'text-[#4E9E8A]' : 'text-white/50'}>{label}</span>
    </div>
  )
}
