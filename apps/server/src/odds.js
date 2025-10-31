import { config } from './config.js'

export function computePools(bets) {
  const pools = new Map()
  let total = 0
  for (const b of bets) {
    total += b.amount
    pools.set(b.horseId, (pools.get(b.horseId) || 0) + b.amount)
  }
  return { total, pools }
}

export function computeOdds(bets) {
  const { total, pools } = computePools(bets)
  const v = config.virtualPoolPerHorse
  const totalVirtual = v * config.horses
  const afterCut = (total + totalVirtual) * (1 - config.houseCut)
  const odds = []
  for (let h = 1; h <= config.horses; h++) {
    const onHorse = (pools.get(h) || 0) + v
    const ratio = afterCut / onHorse
    odds.push({ horseId: h, pool: onHorse, ratio })
  }
  return { total: total + totalVirtual, afterCut, odds }
}
