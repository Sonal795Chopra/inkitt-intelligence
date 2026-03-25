export type Team = 'product' | 'datascience' | 'content'

export type BlockerSeverity = 'red' | 'amber' | 'green'
export type BlockerType = 'technical' | 'dependency' | 'resource' | 'process' | 'external'

export interface Blocker {
  id: string
  description: string
  severity: BlockerSeverity
  type: BlockerType
  owner?: string
  crossTeamDependency?: string   // which team it depends on / blocks
  okrImpact?: string
}

export interface TeamExtraction {
  team: Team
  summary: string
  blockers: Blocker[]
  wins: string[]
  risksAhead: string[]
}

export interface DigestItem {
  rank: number
  headline: string
  detail: string
  requiredAction: string
  owner: string
  okrTag: string
  severity: BlockerSeverity
}

export interface CEODigest {
  generatedAt: string
  items: DigestItem[]
  crossTeamDependencies: string[]
  oneLiner: string
}

export interface Transcripts {
  product: string
  datascience: string
  content: string
}
