import React, { useEffect, useRef, useState } from 'react'

function formatTime(ms) {
  const totalHundredths = Math.floor(ms / 10)
  const hundredths = totalHundredths % 100
  const totalSeconds = Math.floor(totalHundredths / 100)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}

export default function App() {
  const [running, setRunning] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState([])
  const [username, setUsername] = useState(localStorage.getItem('timeee_user') || '')
  const [leaderboard, setLeaderboard] = useState([])
  const [note, setNote] = useState('')
  const rafRef = useRef(null)

  useEffect(() => localStorage.setItem('timeee_user', username), [username])

  useEffect(() => {
    if (running) {
      const start = Date.now() - elapsed
      const loop = () => {
        setElapsed(Date.now() - start)
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } else {
      cancelAnimationFrame(rafRef.current)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  const handleStartStop = () => setRunning(r => !r)
  const handleReset = () => { setRunning(false); setElapsed(0); setLaps([]) }
  const handleLap = () => setLaps(p => [...p, { time: elapsed, label: `Lap ${p.length + 1}` }])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); handleStartStop() }
      if (e.key.toLowerCase() === 'r') handleReset()
      if (e.key.toLowerCase() === 'l') handleLap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const saveSession = async () => {
    if (!username) return alert('Please set username')
    const body = { username, durationMs: elapsed, laps, note, date: new Date().toISOString() }
    try {
      await fetch('http://localhost:3001/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      fetchLeaderboard()
      alert('Session saved!')
    } catch (err) {
      console.error(err)
      alert('Backend not running!')
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/leaderboard')
      const json = await res.json()
      setLeaderboard(json)
    } catch (err) { console.error(err) }
  }

  useEffect(() => fetchLeaderboard(), [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-center">⏱️ Timeee — Smart Stopwatch</h1>
        <div className="text-center text-6xl font-mono mb-4">{formatTime(elapsed)}</div>

        <div className="flex justify-center gap-4 mb-4">
          <button onClick={handleStartStop} className="px-4 py-2 rounded-lg bg-blue-600 text-white">{running ? 'Stop' : 'Start'}</button>
          <button onClick={handleLap} className="px-4 py-2 rounded-lg border">Lap</button>
          <button onClick={handleReset} className="px-4 py-2 rounded-lg border">Reset</button>
        </div>

        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full p-2 mb-2 rounded border" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Session note" className="w-full p-2 mb-4 rounded border" />
        <button onClick={saveSession} className="w-full bg-green-600 text-white p-2 rounded-lg">Save Session</button>

        <h2 className="mt-6 font-semibold mb-2">Laps</h2>
        {laps.length === 0 ? <p className="text-gray-500 text-sm">No laps yet.</p> :
          laps.map((lap, i) => (
            <div key={i} className="flex justify-between bg-gray-100 p-2 rounded mb-1">
              <span>{lap.label}</span>
              <span className="font-mono">{formatTime(lap.time)}</span>
            </div>
          ))}

        <h2 className="mt-6 font-semibold mb-2">Leaderboard</h2>
        {leaderboard.length === 0 ? <p className="text-gray-500 text-sm">No data yet.</p> :
          leaderboard.map((row, i) => (
            <div key={i} className="flex justify-between bg-gray-100 p-2 rounded mb-1">
              <span>{i + 1}. {row.username}</span>
              <span className="font-mono">{formatTime(row.totalMs)}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
