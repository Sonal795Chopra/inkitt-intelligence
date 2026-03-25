import { useState } from 'react'

const TABS = [
  { key: 'product', label: 'Product' },
  { key: 'datascience', label: 'Data Science' },
  { key: 'content', label: 'Content/Publishing' },
] as const

type TeamKey = 'product' | 'datascience' | 'content'

interface Props {
  transcripts: Record<TeamKey, string>
  onTranscriptChange: (team: TeamKey, value: string) => void
  onLoadSample: (team: TeamKey) => void
  onRun: () => void
  canRun: boolean
  isRunning: boolean
}

export default function TranscriptPanel({
  transcripts,
  onTranscriptChange,
  onLoadSample,
  onRun,
  canRun,
  isRunning,
}: Props) {
  const [activeTab, setActiveTab] = useState<TeamKey>('product')

  return (
    <div className="w-[380px] shrink-0 flex flex-col border-r border-[#2a2a2a]">
      {/* Panel header */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Standup Transcripts</p>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#2a2a2a]">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                activeTab === tab.key
                  ? 'text-white border-b-2 border-white -mb-px'
                  : 'text-white/40 hover:text-white/70',
              ].join(' ')}
            >
              {tab.label}
              {transcripts[tab.key].trim().length > 0 && (
                <span className="ml-1.5 inline-block w-1 h-1 rounded-full bg-[#22c55e] align-middle" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea + load sample */}
      <div className="flex-1 flex flex-col p-4 gap-2 min-h-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">
            {TABS.find(t => t.key === activeTab)?.label} standup transcript
          </span>
          <button
            onClick={() => onLoadSample(activeTab)}
            className="text-xs text-white/40 hover:text-white/80 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Load sample
          </button>
        </div>
        <textarea
          value={transcripts[activeTab]}
          onChange={e => onTranscriptChange(activeTab, e.target.value)}
          placeholder="Paste standup transcript here…"
          spellCheck={false}
          className="flex-1 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2.5 text-xs text-white/80 placeholder-white/20 resize-none outline-none focus:border-white/30 font-mono leading-relaxed min-h-0"
        />
      </div>

      {/* Run button */}
      <div className="px-4 pb-4 shrink-0">
        <button
          onClick={onRun}
          disabled={!canRun}
          className={[
            'w-full py-2.5 rounded-md text-sm font-semibold transition-all',
            canRun
              ? 'bg-white text-black hover:bg-white/90 cursor-pointer'
              : isRunning
                ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-white/40 cursor-not-allowed'
                : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white/20 cursor-not-allowed',
          ].join(' ')}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              Running…
            </span>
          ) : (
            'Run Analysis'
          )}
        </button>
        {!canRun && !isRunning && (
          <p className="text-xs text-white/20 text-center mt-2">
            Load all three transcripts to run
          </p>
        )}
      </div>
    </div>
  )
}
