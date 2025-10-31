import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../services/api'

type Stage = 'lobby' | 'betting' | 'race' | 'result'

export function App() {
  const [stage, setStage] = useState<Stage>('lobby')
  const [raceId, setRaceId] = useState<string | null>(null)
  const [closeAt, setCloseAt] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [odds, setOdds] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [horseId, setHorseId] = useState<number>(1)
  const [amount, setAmount] = useState<number>(50)

  // countdown timer
  useEffect(() => {
    if (!closeAt) return
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((closeAt - Date.now()) / 1000))
      setCountdown(s)
    }, 250)
    return () => clearInterval(id)
  }, [closeAt])

  // poll odds during betting
  useEffect(() => {
    if (!raceId || stage !== 'betting') return
    let alive = true
    const tick = async () => {
      try {
        const data = await api.odds(raceId)
        if (alive) setOdds(data)
      } catch {}
    }
    const id = setInterval(tick, 1000)
    tick()
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [raceId, stage])

  const createRace = async () => {
    const { race } = await api.createRace(undefined, 15)
    setRaceId(race.id)
    setCloseAt(race.closeAt)
    setStage('betting')
    try {
      const data = await api.odds(race.id)
      setOdds(data)
    } catch {}
  }

  const placeBet = async () => {
    if (!raceId) return
    await api.placeBet(raceId, horseId, amount)
  }

  const npcBet = async () => {
    if (!raceId) return
    await api.npcBet(raceId)
  }

  const startRace = () => {
    setStage('race')
  }

  const onRaceFinished = async () => {
    if (!raceId) return
    const out = await api.settle(raceId)
    setResult(out)
    setStage('result')
  }

  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui', padding: 16, maxWidth: 960, margin: '0 auto' }}>
      <h1>경마 게임 클라이언트 (MVP)</h1>
      {stage === 'lobby' && (
        <section>
          <p>새 레이스를 생성하고 베팅을 시작하세요.</p>
          <button onClick={createRace}>새 레이스 생성 (15초 마감)</button>
        </section>
      )}

      {stage === 'betting' && raceId && (
        <section style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/track.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(1px)', transform: 'scale(1.02)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.35))' }} />
          <div style={{ position: 'relative', padding: 16, color: 'white' }}>
          <h2>베팅 (레이스 #{raceId})</h2>
          <p>마감까지: {countdown}s</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <label>
              말 번호
              <input type="number" min={1} max={10} value={horseId} onChange={(e) => setHorseId(Number(e.target.value))} style={{ marginLeft: 8, width: 72 }} />
            </label>
            <label>
              금액
              <input type="number" min={10} step={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ marginLeft: 8, width: 96 }} />
            </label>
            <button onClick={placeBet}>베팅</button>
            <button onClick={npcBet}>NPC 베팅</button>
            <button disabled={countdown > 0} onClick={startRace} title={countdown > 0 ? '마감 후 시작' : ''}>레이스 시작</button>
          </div>

          <h3 style={{ marginTop: 16 }}>현재 배당(개장가 포함)</h3>
          <OddsList horses={10} odds={odds?.odds || []} total={odds?.total} afterCut={odds?.afterCut} />
          </div>
        </section>
      )}

      {stage === 'race' && raceId && (
        <section>
          <h2>레이스 진행</h2>
          <RaceCanvas horses={10} onFinished={onRaceFinished} />
        </section>
      )}

      {stage === 'result' && result && (
        <section>
          <h2>결과</h2>
          <ResultView result={result} onReset={() => { setStage('lobby'); setRaceId(null); setResult(null); setOdds(null); }} />
        </section>
      )}
    </div>
  )}

function OddsList({ horses, odds, total, afterCut }: { horses: number; odds: any[]; total?: number; afterCut?: number }) {
  const map = new Map<number, any>()
  for (const o of odds) map.set(o.horseId, o)
  return (
    <div style={{ background: 'rgba(255,255,255,0.9)', color: '#1a202c', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', fontSize: 12, color: '#2d3748', display: 'flex', justifyContent: 'space-between' }}>
        <span>총액 {total ?? '—'} / 컷 후 {afterCut?.toFixed ? afterCut.toFixed(0) : afterCut ?? '—'}</span>
        <span>배당 = (총액×(1-컷)) ÷ 말별 Pool</span>
      </div>
      <div>
        {Array.from({ length: horses }, (_, i) => i + 1).map((id) => {
          const o = map.get(id)
          return (
            <div key={id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr', gap: 8, padding: '8px 12px', borderTop: '1px solid #e2e8f0', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>#{id}</div>
              <div>Pool: {o?.pool?.toFixed ? o.pool.toFixed(0) : o?.pool ?? '—'}</div>
              <div>배당: {o?.ratio?.toFixed ? o.ratio.toFixed(2) : '계산중'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RaceCanvas({ horses, onFinished }: { horses: number; onFinished: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const W = (canvas.width = 980)
    const laneH = 44
    const laneGap = 8
    const marginX = 24
    const marginY = 24
    const H = (canvas.height = marginY * 2 + horses * (laneH + laneGap) - laneGap)
    const duration = 6000 // ms (base)
    const start = performance.now()
    const colors = ['#2b6cb0', '#c53030', '#2f855a', '#805ad5', '#b7791f', '#3182ce', '#d53f8c', '#38a169', '#718096', '#ed8936']

    // per-horse variability so they don't finish together
    function prand(seed: number) {
      // simple deterministic pseudo-random from seed
      const s = Math.sin(seed) * 10000
      return s - Math.floor(s)
    }
    const horseMeta = Array.from({ length: horses }, (_, i) => {
      const r1 = prand((i + 1) * 1.2345)
      const r2 = prand((i + 1) * 7.891)
      const dur = duration * (0.85 + r1 * 0.4) // 85% ~ 125% of base
      const wobble = 0.03 + r2 * 0.04 // lateral speed variance factor
      const easeBias = 0.6 + prand((i + 1) * 3.21) * 0.6 // easing strength
      return { dur, wobble, easeBias }
    })
    const maxDur = Math.max(...horseMeta.map(m => m.dur))

    // background image (put a real racetrack photo at apps/client/public/track.jpg)
    const bg = new Image()
    let bgReady = false
    bg.onload = () => (bgReady = true)
    bg.src = '/track.jpg'

    function drawHorse(ctx: CanvasRenderingContext2D, x: number, cy: number, scale: number, color: string, t: number, id: number) {
      ctx.save()
      ctx.translate(x, cy)
      ctx.scale(scale, scale)

      const phase = (id * 0.7) % (Math.PI * 2)
      const freq = 2.8
      const run = Math.sin(t * 2 * Math.PI * freq + phase)
      const bob = Math.sin(t * 2 * Math.PI * (freq * 0.5) + phase) * 2.5

      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.beginPath()
      ctx.ellipse(0, 12, 26, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      // body (longer, slimmer)
      ctx.translate(0, -bob)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(0, -1, 32, 11, 0.02, 0, Math.PI * 2)
      ctx.fill()

      // neck
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(14, -4)
      ctx.lineTo(26, -12)
      ctx.lineTo(28, -6)
      ctx.lineTo(18, -1)
      ctx.closePath()
      ctx.fill()

      // head (elongated) + ears
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(34, -10, 8, 6, 0.1, 0, Math.PI * 2)
      ctx.fill()
      // ears
      ctx.beginPath()
      ctx.moveTo(37, -16)
      ctx.lineTo(35, -12)
      ctx.lineTo(39, -13)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(33, -16)
      ctx.lineTo(32, -12)
      ctx.lineTo(35, -13)
      ctx.closePath()
      ctx.fill()
      // small eye highlight
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(36, -10, 1.1, 0, Math.PI * 2)
      ctx.fill()

      // bridle stripe (inspired color)
      ctx.strokeStyle = 'rgba(30,120,90,0.9)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(30, -10)
      ctx.lineTo(38, -6)
      ctx.stroke()

      // mane (waving along neck)
      ctx.strokeStyle = '#1a202c'
      ctx.lineWidth = 2
      ctx.beginPath()
      const mPhase = Math.cos(t * 2 * Math.PI * (freq * 0.8) + phase)
      ctx.moveTo(10, -6)
      ctx.quadraticCurveTo(18, -12 - mPhase * 2, 24, -14 - mPhase * 3)
      ctx.stroke()

      // tail (brushy)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      const tail = Math.cos(t * 2 * Math.PI * (freq * 1.2) + phase) * 7
      ctx.moveTo(-30, -3)
      ctx.quadraticCurveTo(-38, -8 + tail, -46, -1)
      ctx.stroke()

      // legs
      const legLen = 19
      ctx.strokeStyle = '#1a202c'
      ctx.lineWidth = 2
      // gallop: front pair opposite to hind pair
      const front = Math.sin(t * 2 * Math.PI * (freq * 1.1) + phase)
      const hind = Math.sin(t * 2 * Math.PI * (freq * 1.1) + phase + Math.PI)
      const legs = [
        { x: 16, base: 9, ang: front * 0.9 }, // RF
        { x: 8, base: 10, ang: -front * 0.7 }, // LF
        { x: -8, base: 10, ang: hind * 0.8 }, // RH
        { x: -16, base: 9, ang: -hind * 0.9 } // LH
      ]
      for (const L of legs) {
        const x1 = L.x
        const y1 = L.base
        const x2 = x1 + Math.sin(L.ang) * legLen
        const y2 = y1 + Math.cos(L.ang) * legLen
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        // hoof
        ctx.fillStyle = '#2d3748'
        ctx.fillRect(x2 - 2, y2 - 1, 4, 3)
      }

      // saddle cloth (red) + number
      ctx.fillStyle = 'rgba(197,48,48,0.95)'
      ctx.fillRect(-7, -9, 14, 12)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(id), 0, -3)

      ctx.restore()
    }

    function draw(ts: number) {
      const elapsed = ts - start
      const t = (ts - start) / 1000 // seconds
      const p = Math.min(1, elapsed / maxDur)
      ctx.clearRect(0, 0, W, H)

      // background (image or procedural fallback)
      if (bgReady) {
        // cover
        const iw = bg.width, ih = bg.height
        const scale = Math.max(W / iw, H / ih)
        const dw = iw * scale, dh = ih * scale
        // subtle parallax offset based on progress
        const ox = -((dw - W) * (0.2 + 0.6 * p))
        const oy = -((dh - H) * 0.5)
        ctx.drawImage(bg, ox, oy, dw, dh)
      } else {
        // procedural: grass + dirt track bands
        const grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, '#b7e28a')
        grad.addColorStop(1, '#7ac25b')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)
        // dirt stripe where lanes are
        const trackTop = marginY - laneGap / 2
        const trackHeight = horses * (laneH + laneGap) - laneGap + laneGap
        ctx.fillStyle = '#cdaa7d'
        ctx.fillRect(marginX - 8, trackTop, W - (marginX - 8) * 2, trackHeight)
      }

      // lanes and horses
      let allFinished = true
      for (let i = 0; i < horses; i++) {
        const yTop = marginY + i * (laneH + laneGap)
        const yMid = yTop + laneH / 2
        // lane
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 1
        ctx.strokeRect(marginX, yTop, W - marginX * 2, laneH)

        // per-horse progress with unique duration and wobble
        const m = horseMeta[i]
        const raw = Math.min(1, elapsed / m.dur)
        const ease = (x: number, k = m.easeBias) => 1 - Math.pow(1 - x, 2 + k) // easeOut with bias
        const base = ease(raw)
        // wobble decays near finish to guarantee completion
        const wobScale = 1 - base
        const wob = Math.sin(t * (2 + m.wobble * 10) + i) * m.wobble * wobScale
        let prog = base + wob
        if (raw >= 1 - 1e-6) prog = 1
        prog = Math.min(1, Math.max(0, prog))
        if (prog < 1) allFinished = false
        const x = marginX + prog * (W - marginX * 2 - 60)
        const color = colors[i % colors.length]
        drawHorse(ctx, x, yMid, 1, color, t, i + 1)

        // dust trail
        const dustSeed = i * 123.456
        for (let k = 0; k < 3; k++) {
          const dt = ((elapsed / 1000) + k * 0.1 + dustSeed) % 1
          const alpha = 1 - dt
          const dx = x - 20 - k * 12 - Math.random() * 4
          const dy = yMid + 10 + (Math.random() - 0.5) * 6
          ctx.fillStyle = `rgba(205,170,125,${0.25 * alpha})`
          ctx.beginPath()
          ctx.ellipse(dx, dy, 6 + 6 * dt, 3 + 3 * dt, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (!allFinished) raf = requestAnimationFrame(draw)
      else onFinished()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [horses, onFinished])
  return <canvas ref={ref} style={{ border: '1px solid #ddd', borderRadius: 8, width: '100%', maxWidth: 980, background: '#fff' }} />
}

function ResultView({ result, onReset }: { result: any; onReset: () => void }) {
  const winner = result?.race?.result?.winner
  const table = result?.race?.result?.result || []
  return (
    <div>
      <div>우승 말: #{winner}</div>
      <ol>
        {table.map((r: any) => (
          <li key={r.id}>#{r.id} - {r.time}s</li>
        ))}
      </ol>
      <button onClick={onReset}>처음으로</button>
    </div>
  )
}
