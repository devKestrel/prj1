export const config = {
  bettingCloseSeconds: Number(process.env.BET_CLOSE_SEC || 15),
  minBet: Number(process.env.MIN_BET || 10),
  currency: process.env.CURRENCY || 'coin',
  houseCut: Number(process.env.HOUSE_CUT || 0.1), // 10%
  horses: 10,
  trackLen: 1000,
  // Opening odds smoothing using virtual liquidity per horse
  virtualPoolPerHorse: Number(process.env.VIRTUAL_POOL || 10)
}
