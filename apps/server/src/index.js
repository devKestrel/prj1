import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import { simulateRace } from './raceEngine.js'
import { router as apiRouter } from './routes.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'server', version: '0.1.0' })
})

app.post('/api/bets', (req, res) => {
  res.status(501).json({ error: 'Not Implemented' })
})

app.post('/api/races/simulate', (req, res) => {
  const seed = Number(req.body?.seed ?? Date.now())
  const result = simulateRace(seed)
  res.json({ seed, result })
})

app.use('/api', apiRouter)

const server = http.createServer(app)
const io = new SocketIOServer(server, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  socket.emit('welcome', { t: Date.now() })
})

const PORT = Number(process.env.PORT || 3000)
server.listen(PORT, () => {
  console.log(`server listening on :${PORT}`)
})
