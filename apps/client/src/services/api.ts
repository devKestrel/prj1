export type Race = { id: string; seed: number; closeAt: number; status: string; horses: number }

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  health: () => fetch('/health').then(j),
  createRace: (seed?: number, closeInSeconds?: number) =>
    fetch('/api/races', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed, closeInSeconds })
    }).then(j) as Promise<{ race: Race }>,
  getRace: (id: string) => fetch(`/api/races/${id}`).then(j),
  placeBet: (raceId: string, horseId: number, amount: number) =>
    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId, horseId, amount })
    }).then(j),
  npcBet: (raceId: string) =>
    fetch(`/api/races/${raceId}/npc-bet`, { method: 'POST' }).then(j),
  odds: (raceId: string) => fetch(`/api/odds?raceId=${raceId}`).then(j),
  settle: (raceId: string) => fetch(`/api/races/${raceId}/settle`, { method: 'POST' }).then(j)
}

