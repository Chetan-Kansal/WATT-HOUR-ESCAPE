'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Server, Sun, Wind, CheckCircle2, RefreshCw, ChevronRight, Activity, Cpu } from 'lucide-react'

// [Top, Right, Bottom, Left]
type Edges = [boolean, boolean, boolean, boolean]

interface Tile {
  type: 'straight' | 'corner' | 't-junction' | 'cross' | 'source' | 'target' | 'renewable'
  rotation: number // 0, 90, 180, 270
  id: string
  x: number
  y: number
  isPowered: boolean
}

const getEdges = (type: Tile['type'], rotation: number): Edges => {
  let base: Edges = [false, false, false, false]
  switch (type) {
    case 'straight': base = [true, false, true, false]; break
    case 'corner': base = [true, true, false, false]; break
    case 't-junction': base = [true, true, true, false]; break
    case 'cross': base = [true, true, true, true]; break
    case 'source': base = [false, true, false, false]; break
    case 'target': base = [false, false, false, true]; break
    case 'renewable': base = [true, true, true, true]; break
  }

  const shift = (rotation / 90) % 4
  for (let i = 0; i < shift; i++) {
    const last = base.pop()!
    base.unshift(last)
  }
  return base
}

const LEVELS = [
  { size: 5, name: 'Local Substation', phase: 'ALPHA' },
  { size: 6, name: 'Regional Hub', phase: 'BETA' },
  { size: 7, name: 'Smart Grid Backbone', phase: 'GAMMA' },
]

export default function Round3GridConnect({ onSuccess }: { onSuccess: () => void }) {
  const [levelIdx, setLevelIdx] = useState(0)
  const [grid, setGrid] = useState<Tile[]>([])
  const [solved, setSolved] = useState(false)
  const [moves, setMoves] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentLevel = LEVELS[levelIdx]

  // Initialize a solvable grid based on level size
  const initGrid = useCallback(() => {
    const newGrid: Tile[] = []
    const size = currentLevel.size
    const mid = Math.floor(size / 2)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let type: Tile['type'] = 'straight'
        if (x === 0 && y === mid) type = 'source'
        else if (x === size - 1 && y === mid) type = 'target'
        else if (Math.random() > 0.7) type = 'corner'
        else if (Math.random() > 0.85) type = 't-junction'
        else if (Math.random() > 0.95) type = 'renewable'
        else if (Math.random() > 0.95) type = 'cross'

        newGrid.push({
          id: `${x}-${y}`,
          x,
          y,
          type,
          rotation: type === 'source' || type === 'target' ? 0 : [0, 90, 180, 270][Math.floor(Math.random() * 4)],
          isPowered: false
        })
      }
    }
    setGrid(newGrid)
    
    // For Level 3, ensure at least 2 renewable nodes exist
    if (levelIdx === 2) {
      let count = newGrid.filter(t => t.type === 'renewable').length
      while (count < 2) {
        const idx = Math.floor(Math.random() * newGrid.length)
        const t = newGrid[idx]
        if (t.type === 'straight' || t.type === 'corner') {
          t.type = 'renewable'
          count++
        }
      }
    }

    setMoves(0)
    setSolved(false)
  }, [currentLevel, levelIdx])

  useEffect(() => {
    initGrid()
  }, [initGrid])

  const checkConnectivity = useCallback((currentGrid: Tile[]) => {
    const poweredIds = new Set<string>()
    const source = currentGrid.find(t => t.type === 'source')
    if (!source) return []

    const queue = [source]
    poweredIds.add(source.id)

    while (queue.length > 0) {
      const tile = queue.shift()!
      const edges = getEdges(tile.type, tile.rotation)

      const neighbors = [
        { x: tile.x, y: tile.y - 1, edgeIdx: 0, oppIdx: 2 }, // Top
        { x: tile.x + 1, y: tile.y, edgeIdx: 1, oppIdx: 3 }, // Right
        { x: tile.x, y: tile.y + 1, edgeIdx: 2, oppIdx: 0 }, // Bottom
        { x: tile.x - 1, y: tile.y, edgeIdx: 3, oppIdx: 1 }  // Left
      ]

      neighbors.forEach(n => {
        if (edges[n.edgeIdx]) {
          const neighborTile = currentGrid.find(t => t.x === n.x && t.y === n.y)
          if (neighborTile && !poweredIds.has(neighborTile.id)) {
            const neighborEdges = getEdges(neighborTile.type, neighborTile.rotation)
            if (neighborEdges[n.oppIdx]) {
              poweredIds.add(neighborTile.id)
              queue.push(neighborTile)
            }
          }
        }
      })
    }

    return Array.from(poweredIds)
  }, [])

  const handleNextLevel = useCallback(() => {
    if (levelIdx < LEVELS.length - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setLevelIdx(prev => prev + 1)
        setIsTransitioning(false)
      }, 2000)
    } else {
      onSuccess()
    }
  }, [levelIdx, onSuccess])

  const rotateTile = (id: string) => {
    if (solved || isTransitioning) return
    setGrid(prev => {
      const newGrid = prev.map(t => {
        if (t.id === id && t.type !== 'source' && t.type !== 'target') {
          return { ...t, rotation: (t.rotation + 90) % 360 }
        }
        return t
      })

      const poweredIds = checkConnectivity(newGrid)
      const updatedGrid = newGrid.map(t => ({
        ...t,
        isPowered: poweredIds.includes(t.id)
      }))

      const target = updatedGrid.find(t => t.type === 'target')
      const renewables = updatedGrid.filter(t => t.type === 'renewable')
      const allRenewablesPowered = renewables.every(r => r.isPowered)
      
      if (target?.isPowered && (levelIdx < 2 || allRenewablesPowered)) {
        setSolved(true)
        handleNextLevel()
      }

      return updatedGrid
    })
    setMoves(m => m + 1)
  }

  return (
    <div className="space-y-6 select-none relative">
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl border border-amber-500/20"
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Zap className="text-amber-500 animate-pulse" size={32} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Level Escalated</h3>
              <p className="text-amber-500/70 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Initializing {LEVELS[levelIdx + 1]?.name}...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="flex items-center justify-between px-2 text-[10px] font-mono uppercase tracking-[0.2em]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-amber-500">
              <Activity size={12} className="animate-pulse" />
              <span>Grid_Stability: {solved ? 'STABLE' : 'UNSTABLE'}</span>
            </div>
            <div className="text-muted-foreground">Encryption_Cycles: {moves}</div>
          </div>
          <div className="text-amber-500 font-bold">
            LEVEL_0{levelIdx + 1}: {currentLevel.name.replace(' ', '_')}
          </div>
        </div>
        <button onClick={initGrid} className="hover:text-amber-400 transition-colors flex items-center gap-1">
          <RefreshCw size={12} /> Reset_Topology
        </button>
      </div>

      {/* The Grid */}
      <div className="glass-card bg-black/60 p-4 rounded-xl border border-white/5 relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
            backgroundSize: `${100/currentLevel.size}% ${100/currentLevel.size}%` 
        }} />

        <div 
            className="grid gap-2 relative z-10 aspect-square"
            style={{ 
                gridTemplateColumns: `repeat(${currentLevel.size}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${currentLevel.size}, minmax(0, 1fr))`
            }}
        >
          {grid.map(tile => (
            <motion.div
              key={tile.id}
              whileHover={{ scale: tile.type === 'source' || tile.type === 'target' ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => rotateTile(tile.id)}
              className={`
                relative flex items-center justify-center rounded-lg cursor-pointer transition-all duration-500
                ${tile.isPowered ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/5'}
                border
                ${tile.type === 'source' ? 'bg-blue-500/10 border-blue-500/40' : ''}
                ${tile.type === 'target' && tile.isPowered ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : tile.type === 'target' ? 'bg-white/5 border-white/20' : ''}
              `}
            >
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-300"
                style={{ transform: `rotate(${tile.rotation}deg)` }}
              >
                <TileIcon type={tile.type} isPowered={tile.isPowered} />
              </div>

              {tile.isPowered && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 0.2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-amber-500 rounded-lg pointer-events-none"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* UI Footer */}
      <div className="flex gap-4">
        <div className="basis-2/3 glass-card p-4 rounded-xl border border-white/5 bg-amber-950/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Cpu size={40} className="text-amber-500" /></div>
            <h4 className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-2 font-black">Topology Guide</h4>
            <p className="text-[9px] font-mono text-amber-100/70 leading-relaxed uppercase">
                Phase {currentLevel.phase}: 
                {levelIdx < 2 
                  ? " Route the flow to the Node_Farm." 
                  : " Critical: Power all Renewable_Nodes + Route to Node_Farm."
                }
                Complete all 3 sectors to secure the handshake.
            </p>
        </div>
        <div className="basis-1/3 flex flex-col gap-2">
            <div className="flex-1 glass-card p-4 rounded-xl border border-white/5 bg-black/40 flex flex-col items-center justify-center">
                <span className="text-[8px] font-mono text-white/40 uppercase mb-1">Grid_Progress</span>
                <div className="flex gap-1.5">
                    {LEVELS.map((_, i) => (
                        <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i < levelIdx ? 'bg-green-500' : i === levelIdx ? 'bg-amber-500 w-10 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`} />
                    ))}
                </div>
            </div>
            <AnimatePresence>
                {solved && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-card px-4 py-2 rounded-xl border border-green-500/40 bg-green-500/10 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-[10px] font-mono text-green-400 uppercase font-black tracking-widest">ENCRYPTED</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function TileIcon({ type, isPowered }: { type: Tile['type'], isPowered: boolean }) {
  const color = isPowered ? 'text-amber-400' : 'text-white/20'
  
  switch (type) {
    case 'source':
      return <div className="relative scale-125"><Zap size={24} className="text-blue-400 animate-pulse" /><div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-blue-400" /></div>
    case 'target':
      return <div className="relative scale-125"><Server size={24} className={isPowered ? 'text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-white/20'} /><div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-current opacity-20" /></div>
    case 'renewable':
      return <Sun size={20} className={isPowered ? 'text-yellow-400' : 'text-white/10'} />
    case 'straight':
      return <div className={`w-1 h-full ${color} bg-current relative shadow-[0_0_5px_currentColor]`} />
    case 'corner':
      return (
        <div className="w-full h-full relative">
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 ${color} bg-current shadow-[0_0_5px_currentColor]`} />
            <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-1 ${color} bg-current shadow-[0_0_5px_currentColor]`} />
        </div>
      )
    case 't-junction':
      return (
        <div className="w-full h-full relative scale-110">
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 ${color} bg-current shadow-[0_0_5px_currentColor]`} />
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1/2 ${color} bg-current shadow-[0_0_5px_currentColor]`} />
            <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-1 ${color} bg-current shadow-[0_0_5px_currentColor]`} />
        </div>
      )
    case 'cross':
        return (
          <div className="w-full h-full relative scale-110">
              <div className={`absolute inset-0 m-auto w-1 h-full ${color} bg-current shadow-[0_0_5px_currentColor]`} />
              <div className={`absolute inset-0 m-auto w-full h-1 ${color} bg-current shadow-[0_0_5px_currentColor]`} />
          </div>
        )
    default:
      return null
  }
}
