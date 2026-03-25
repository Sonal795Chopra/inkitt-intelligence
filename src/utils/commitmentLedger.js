// ─── Date helpers ─────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0] // e.g. '2026-03-25'

function daysDelta(dueDateStr) {
  if (!dueDateStr) return null
  const due   = new Date(dueDateStr + 'T00:00:00')
  const today = new Date(TODAY     + 'T00:00:00')
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

// Parse a variety of date strings from LLM output into YYYY-MM-DD
const MONTH_MAP = {
  jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
  jul:7, aug:8, sep:9, oct:10, nov:11, dec:12
}

function parseDate(by) {
  if (!by) return null
  const s = by.trim()

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // Today / EOD variants
  if (/^(eod|today|end[\s-]of[\s-]day|end of sprint)$/i.test(s)) return TODAY

  // "March 25" / "Mar 25" / "March 25th"
  const mname = s.match(/^(\w{3,})\s+(\d{1,2})/i)
  if (mname) {
    const mkey = mname[1].toLowerCase().slice(0, 3)
    const m = MONTH_MAP[mkey]
    const d = parseInt(mname[2], 10)
    if (m && d) {
      return `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }

  // "25 March"
  const dname = s.match(/^(\d{1,2})\s+(\w{3,})/i)
  if (dname) {
    const mkey = dname[2].toLowerCase().slice(0, 3)
    const m = MONTH_MAP[mkey]
    const d = parseInt(dname[1], 10)
    if (m && d) {
      return `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }

  // Relative: "Friday", "next week" → fall back to 3 days from now
  return null
}

function computeStatus(dueDateStr, atRisk) {
  const delta = daysDelta(dueDateStr)
  if (delta === null) return 'open'
  if (delta === 0) return 'due_today'
  if (delta > 0)  return 'open'
  // delta < 0: overdue
  if (delta <= -2 || atRisk) return 'slipped'
  return 'slipped' // 1 day late with no at_risk still counts as slipped
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TEAM_LABEL = {
  product: 'Product', datascience: 'Data Science', content: 'Content',
}

// 7 seeded CLOSED items — distributed to give meaningful per-team hit rates
// Product: 3 closed + 1 slipped → 75% green
// Data Science: 2 closed + 1 slipped → 67% amber
// Content: 2 closed + 3 slipped → 40% red
const SEEDED_CLOSED = [
  { id: 'seed_c1', owner: 'Rohan',   team: 'Product',      what: 'Nudge push copy finalised for April 7 launch',     due_date: '2026-03-18', status: 'closed', days_delta: -7, okr_tag: 'OKR 1.1', at_risk: false, downstream: [],        source: 'seeded' },
  { id: 'seed_c2', owner: 'Lena',    team: 'Product',      what: 'Segment targeting spec v1 shared with DS team',    due_date: '2026-03-17', status: 'closed', days_delta: -8, okr_tag: 'OKR 2.1', at_risk: false, downstream: ['Jin'],   source: 'seeded' },
  { id: 'seed_c3', owner: 'James',   team: 'Product',      what: 'A/B test plan reviewed with Vikram',               due_date: '2026-03-19', status: 'closed', days_delta: -6, okr_tag: 'OKR 3.1', at_risk: false, downstream: [],        source: 'seeded' },
  { id: 'seed_c4', owner: 'Noor',    team: 'Data Science', what: 'Retention model v2 evaluation metrics delivered',  due_date: '2026-03-20', status: 'closed', days_delta: -5, okr_tag: 'OKR 1.3', at_risk: false, downstream: [],        source: 'seeded' },
  { id: 'seed_c5', owner: 'Sasha',   team: 'Data Science', what: 'Embedding pipeline latency report shared',         due_date: '2026-03-18', status: 'closed', days_delta: -7, okr_tag: 'OKR 2.2', at_risk: false, downstream: [],        source: 'seeded' },
  { id: 'seed_c6', owner: 'Daniela', team: 'Content',      what: 'Series metadata tagging for Q1 catalog complete',  due_date: '2026-03-17', status: 'closed', days_delta: -8, okr_tag: 'OKR 2.3', at_risk: false, downstream: [],        source: 'seeded' },
  { id: 'seed_c7', owner: 'Sofia',   team: 'Content',      what: 'Creator onboarding guide final review done',       due_date: '2026-03-19', status: 'closed', days_delta: -6, okr_tag: 'OKR 1.2', at_risk: false, downstream: [],        source: 'seeded' },
]

// 5 seeded SLIPPED items — as specified
const SEEDED_SLIPPED = [
  { id: 'seed_s1', owner: 'Marcus',  team: 'Content',      what: 'Title shortlist of 12 finalized for spring campaign', due_date: '2026-03-19', status: 'slipped', days_delta: daysDelta('2026-03-19'), okr_tag: '',         at_risk: true, downstream: ['Daniela'],    source: 'seeded' },
  { id: 'seed_s2', owner: 'Ren',     team: 'Content',      what: 'Getting started guide first draft',                   due_date: '2026-03-16', status: 'slipped', days_delta: daysDelta('2026-03-16'), okr_tag: 'OKR 1.2',  at_risk: true, downstream: [],            source: 'seeded' },
  { id: 'seed_s3', owner: 'Preethi', team: 'Content',      what: 'Q2 content performance report to CEO',                due_date: '2026-03-20', status: 'slipped', days_delta: daysDelta('2026-03-20'), okr_tag: 'OKR 2.1',  at_risk: true, downstream: ['CEO'],        source: 'seeded' },
  { id: 'seed_s4', owner: 'Vikram',  team: 'Data Science', what: 'Feed ranking model to shadow mode',                   due_date: '2026-03-20', status: 'slipped', days_delta: daysDelta('2026-03-20'), okr_tag: 'OKR 1.3',  at_risk: true, downstream: ['Aditya'],     source: 'seeded' },
  { id: 'seed_s5', owner: 'Tomás',   team: 'Product',      what: 'Content moderation spec escalation logic',            due_date: '2026-03-21', status: 'slipped', days_delta: daysDelta('2026-03-21'), okr_tag: 'OKR 4.2',  at_risk: true, downstream: ['Engineering'], source: 'seeded' },
]

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Build the full commitment ledger from live extractions + seeded history.
 * @param {object[]} extractedTeams   Array of team extraction objects from Stage 1
 * @param {object|null} matcherOutput Matcher output from Stage 2
 * @returns {object[]}                Sorted array of commitment entries
 */
export function buildCommitmentLedger(extractedTeams, matcherOutput) {
  const matches = matcherOutput?.matches ?? []
  const ceoMatchIds = new Set((matcherOutput?.escalate_to_ceo ?? []).map(e => e.match_id))

  // Build downstream lookup: personName → [names waiting on them]
  const downstreamMap = {}
  for (const m of matches) {
    if (!downstreamMap[m.person_b]) downstreamMap[m.person_b] = []
    // If this match is CEO-escalated, note CEO; otherwise note the blocked person
    const waiter = ceoMatchIds.has(m.match_id) ? 'CEO' : m.person_a
    if (!downstreamMap[m.person_b].includes(waiter)) {
      downstreamMap[m.person_b].push(waiter)
    }
  }

  // Build live entries from extractions
  let idCounter = 1
  const liveEntries = []

  for (const teamObj of extractedTeams) {
    if (!teamObj || !Array.isArray(teamObj.members)) continue
    const teamKey   = teamObj.team ?? 'unknown'
    const teamLabel = TEAM_LABEL[teamKey] ?? teamKey

    for (const member of teamObj.members) {
      const c = member.commitment
      if (!c || !c.what) continue

      const dueDate = parseDate(c.by)
      const delta   = dueDate ? daysDelta(dueDate) : null
      const status  = dueDate ? computeStatus(dueDate, c.at_risk) : 'open'

      liveEntries.push({
        id:         `commit_${String(idCounter++).padStart(3, '0')}`,
        owner:      member.name,
        team:       teamLabel,
        what:       c.what,
        due_date:   dueDate ?? '',
        status,
        days_delta: delta ?? 99,
        okr_tag:    member.okr_tag ?? '',
        at_risk:    c.at_risk ?? false,
        downstream: downstreamMap[member.name] ?? [],
        source:     'standup',
      })
    }
  }

  // Merge everything
  const all = [...SEEDED_CLOSED, ...SEEDED_SLIPPED, ...liveEntries]

  // Sort: slipped (most overdue first) → due_today → open (soonest first) → closed
  const ORDER = { slipped: 0, due_today: 1, open: 2, closed: 3 }
  all.sort((a, b) => {
    const oa = ORDER[a.status] ?? 2
    const ob = ORDER[b.status] ?? 2
    if (oa !== ob) return oa - ob
    // Within slipped: most overdue first (most negative delta)
    if (a.status === 'slipped') return (a.days_delta ?? 0) - (b.days_delta ?? 0)
    // Within open: soonest first
    if (a.status === 'open') return (a.days_delta ?? 99) - (b.days_delta ?? 99)
    return 0
  })

  return all
}
