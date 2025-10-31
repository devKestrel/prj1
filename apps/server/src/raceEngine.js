function mulberry32(a) {
  let t = a >>> 0
  return function () {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function simulateRace(seed) {
  const rand = mulberry32(seed)
  const N = 10
  const trackLen = 1000
  const dt = 1 / 60
  const horses = Array.from({ length: N }, (_, i) => ({
    id: i + 1,
    base: 3 + rand() * 3,
    stamina: 0.8 + rand() * 0.4,
    var: -0.5 + rand() * 1.0,
    pos: 0,
    t: 0,
    done: false
  }))
  let finished = 0
  for (let step = 0; step < 60 * 60 && finished < N; step++) {
    for (const h of horses) {
      if (h.done) continue
      const noise = h.var * (rand() - 0.5)
      const boost = h.stamina > 1 && rand() < 0.02 ? h.stamina : 0
      const v = Math.max(0, h.base + noise + boost)
      h.pos += v
      h.t += dt
      if (h.pos >= trackLen) {
        h.done = true
        finished++
      }
    }
  }
  const order = [...horses].sort((a, b) => a.t - b.t)
  return order.map((h, idx) => ({ rank: idx + 1, id: h.id, time: Number(h.t.toFixed(3)) }))
}

