import { setRaceResult, listBets, getRace, closeRace } from './store.js'
import { computePools } from './odds.js'
import { simulateRace } from './raceEngine.js'

export function settleRace(raceId) {
  const race = getRace(raceId)
  if (!race) return { ok: false, error: 'race_not_found' }
  if (race.result) return { ok: true, alreadySettled: true, result: race.result }
  if (Date.now() < race.closeAt) closeRace(raceId)

  const result = simulateRace(Number(race.seed))
  const winner = result.find(r => r.rank === 1)?.id
  const bets = listBets(raceId)
  const { total, pools } = computePools(bets)
  const houseCut = 0.1
  const afterCut = total * (1 - houseCut)
  const onWinner = pools.get(winner) || 0
  const ratio = onWinner > 0 ? afterCut / onWinner : 0
  const payouts = bets.map(b => ({ ...b, payout: b.horseId === winner ? Number((b.amount * ratio).toFixed(2)) : 0 }))

  const saved = setRaceResult(raceId, { result, winner, payouts, pool: { total, afterCut, onWinner, ratio } })
  return { ok: true, race: saved }
}

