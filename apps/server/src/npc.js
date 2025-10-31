import { listBets } from './store.js'
import { computeOdds } from './odds.js'
import { placeBet } from './betting.js'

function pickByRatio(odds, mode) {
  const sorted = [...odds].sort((a, b) => a.ratio - b.ratio) // low ratio = favorite
  if (mode === 'conservative') return sorted.slice(0, 3).map(o => o.horseId)
  if (mode === 'balanced') return [sorted[3]?.horseId, sorted[4]?.horseId].filter(Boolean)
  // aggressive: long shots
  const long = [...odds].sort((a, b) => b.ratio - a.ratio)
  return long.slice(0, 2).map(o => o.horseId)
}

export function npcBet(raceId) {
  const bets = listBets(raceId)
  const { odds } = computeOdds(bets)
  const profiles = [
    { id: 'npc:cons', mode: 'conservative', amount: 50 },
    { id: 'npc:bal', mode: 'balanced', amount: 80 },
    { id: 'npc:agg', mode: 'aggressive', amount: 120 }
  ]
  const placed = []
  for (const p of profiles) {
    const horses = pickByRatio(odds, p.mode)
    const share = Math.max(1, Math.floor(p.amount / (horses.length || 1)))
    for (const h of horses) {
      const out = placeBet({ raceId, userId: p.id, userType: 'npc', horseId: h, amount: share })
      if (out.ok) placed.push(out.bet)
    }
  }
  return { placed }
}

