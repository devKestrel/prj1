import fs from 'fs'
import path from 'path'

const dataDir = path.resolve(process.cwd(), 'data')
const dbFile = path.join(dataDir, 'dev.json')

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

function load() {
  ensureDir()
  if (!fs.existsSync(dbFile)) return { races: {}, bets: {} }
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf-8'))
  } catch {
    return { races: {}, bets: {} }
  }
}

function save(db) {
  ensureDir()
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
}

let db = load()

let idSeq = 1
function genId() {
  return String(idSeq++)
}

export function createRace({ seed, closeAt, horses = 10 }) {
  const id = genId()
  db.races[id] = { id, seed, closeAt, status: 'open', horses, createdAt: Date.now() }
  db.bets[id] = []
  save(db)
  return db.races[id]
}

export function getRace(id) {
  return db.races[id] || null
}

export function listBets(raceId) {
  return db.bets[raceId] || []
}

export function addBet(raceId, bet) {
  if (!db.bets[raceId]) db.bets[raceId] = []
  db.bets[raceId].push({ ...bet, createdAt: Date.now() })
  save(db)
}

export function setRaceResult(raceId, result) {
  if (!db.races[raceId]) return null
  db.races[raceId].result = result
  db.races[raceId].status = 'settled'
  save(db)
  return db.races[raceId]
}

export function closeRace(raceId) {
  if (db.races[raceId]) {
    db.races[raceId].status = 'closed'
    save(db)
  }
}

