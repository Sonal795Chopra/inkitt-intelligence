import { useState, useCallback } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import type { Transcripts, TeamExtraction, CEODigest } from '../types'
import { SAMPLE_TRANSCRIPTS } from '../lib/sampleData'
import { buildExtractionPrompt } from '../lib/prompt'

const MODEL = 'claude-sonnet-4-6'

export function useIntelligence() {
  const [transcripts, setTranscripts] = useState<Transcripts>(SAMPLE_TRANSCRIPTS)
  const [extractions, setExtractions] = useState<TeamExtraction[]>([])
  const [digest, setDigest] = useState<CEODigest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setTranscript = useCallback((team: keyof Transcripts, value: string) => {
    setTranscripts(prev => ({ ...prev, [team]: value }))
  }, [])

  const runAnalysis = useCallback(async () => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
    if (!apiKey) {
      setError('Missing VITE_ANTHROPIC_API_KEY. Add it to your .env file.')
      return
    }

    setIsLoading(true)
    setError(null)
    setExtractions([])
    setDigest(null)

    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

      const stream = await client.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: buildExtractionPrompt(transcripts) }],
      })

      const message = await stream.finalMessage()
      const raw = message.content.find(b => b.type === 'text')?.text ?? ''

      // Strip any accidental markdown fences
      const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(json) as {
        teams: TeamExtraction[]
        digest: CEODigest & { items: CEODigest['items'] }
      }

      setExtractions(parsed.teams)
      setDigest({
        ...parsed.digest,
        generatedAt: new Date().toLocaleTimeString(),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Analysis failed: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }, [transcripts])

  return { transcripts, setTranscript, extractions, digest, isLoading, error, runAnalysis }
}
