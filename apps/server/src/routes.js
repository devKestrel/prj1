import { Router } from 'express'
import { config } from './config.js'
import { createRace, getRace, listBets } from './store.js'
import { computeOdds } from './odds.js'
import { placeBet } from './betting.js'
import { settleRace } from './settlement.js'
import { npcBet } from './npc.js'

export const router = Router()

router.post('/races', (req, res) => {
  const now = Date.now()
  const seed = Number(req.body?.seed ?? now)
  const closeIn = Number(req.body?.closeInSeconds ?? config.bettingCloseSeconds)
  const closeAt = now + closeIn * 1000
  const race = createRace({ seed, closeAt, horses: config.horses })
  res.status(201).json({ race })
})

router.get('/races/:id', (req, res) => {
  const race = getRace(req.params.id)
  if (!race) return res.status(404).json({ error: 'not_found' })
  const bets = listBets(race.id)
  res.json({ race, betsCount: bets.length })
})

router.get('/odds', (req, res) => {
  const raceId = req.query.raceId
  const race = getRace(raceId)
  if (!race) return res.status(404).json({ error: 'race_not_found' })
  const { total, afterCut, odds } = computeOdds(listBets(raceId))
  res.json({ raceId, total, afterCut, odds })
})

router.get('/config', (req, res) => {
  res.json({
    bettingCloseSeconds: config.bettingCloseSeconds,
    minBet: config.minBet,
    currency: config.currency,
    houseCut: config.houseCut,
    horses: config.horses
  })
})

router.post('/bets', (req, res) => {
  const { raceId, userId = 'player:local', userType = 'player', horseId, amount } = req.body || {}
  const out = placeBet({ raceId, userId, userType, horseId: Number(horseId), amount: Number(amount) })
  if (!out.ok) return res.status(400).json(out)
  res.status(201).json(out)
})

router.post('/races/:id/settle', (req, res) => {
  const out = settleRace(req.params.id)
  if (!out.ok) return res.status(400).json(out)
  res.json(out)
})

router.post('/races/:id/npc-bet', (req, res) => {
  const out = npcBet(req.params.id)
  res.json(out)
})
