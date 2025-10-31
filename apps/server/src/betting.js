import { config } from './config.js'
import { addBet, getRace, listBets } from './store.js'

export function placeBet({ raceId, userId, userType = 'player', horseId, amount }) {
  const race = getRace(raceId)
  if (!race) return { ok: false, error: 'race_not_found' }
  if (race.status !== 'open') return { ok: false, error: 'race_closed' }
  if (Date.now() >= race.closeAt) return { ok: false, error: 'betting_closed' }
  if (amount < config.minBet) return { ok: false, error: 'below_min_bet' }
  if (!(horseId >= 1 && horseId <= race.horses)) return { ok: false, error: 'invalid_horse' }

  const bet = { raceId, userId, userType, horseId, amount }
  addBet(raceId, bet)
  const bets = listBets(raceId)
  return { ok: true, bet, totalBets: bets.length }
}

