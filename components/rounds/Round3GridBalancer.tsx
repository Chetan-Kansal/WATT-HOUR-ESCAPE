'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertTriangle, CheckCircle2, Loader2, Activity, Gauge, ArrowRight } from 'lucide-react'

interface LevelConfig {
  name: string
  range: number
  fluctuation: number
  interval: number
  gain: number
  driftSpeed: number
}

const LEVELS: LevelConfig[] = [
  { name: 'Local Grid Sync', range: 6, fluctuation: 12, interval: 1800, gain: 0.5, driftSpeed: 0 },
  { name: 'Regional Integration', range: 4, fluctuation: 18, interval: 1200, gain: 0.4, driftSpeed: 0.05 },
  { name: 'Continental Uplink', range: 2, fluctuation: 25, interval: 800, gain: 0.3, driftSpeed: 0.12 },
]

interface GridBalancerProps {
  onSuccess: () => void
}

export default function GridBalancer({ onSuccess }: GridBalancerProps) {
  const [level, setLevel] = useState(0)
  const [supply, setSupply] = useState(50)
  const [demand, setDemand] = useState(50)
  const [progress, setProgress] = useState(0) 
  const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'STABLE' | 'DANGER'>('IDLE')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [driftDir, setDriftDir] = useState(1)
  
  const requestRef = useRef<number>()
  const config = LEVELS[level]

  // Demand fluctuation + Drift logic
  useEffect(() => {
    if (isTransitioning) return

    const interval = setInterval(() => {
      setDemand(prev => {
        const change = (Math.random() - 0.5) * config.fluctuation * 2
        return Math.min(Math.max(prev + change, 10), 90)
      })
      // Occasionally flip drift direction
      if (Math.random() > 0.7) setDriftDir(d => -d)
    }, config.interval)
    return () => clearInterval(interval)
  }, [level, isTransitioning, config.fluctuation, config.interval])

  // Drift Application Loop
  useEffect(() => {
    if (isTransitioning || config.driftSpeed === 0) return
    
    const driftInterval = setInterval(() => {
        setDemand(prev => {
            const next = prev + (config.driftSpeed * driftDir)
            if (next <= 10 || next >= 90) {
                setDriftDir(d => -d)
                return prev
            }
            return next
        })
    }, 16) // roughly 60fps drift
    return () => clearInterval(driftInterval)
  }, [isTransitioning, config.driftSpeed, driftDir])

  // Sync Logic
  useEffect(() => {
    if (isTransitioning) return

    const animate = () => {
      const diff = Math.abs(supply - demand)
      const isClose = diff < config.range

      if (isClose) {
        setStatus('STABLE')
        setProgress(prev => {
          const next = prev + config.gain
          if (next >= 100) {
            handleLevelComplete()
            return 100
          }
          return next
        })
      } else {
        const isFar = diff > config.range * 3
        setStatus(isFar ? 'DANGER' : 'SYNCING')
        // Faster decay in danger or high levels
        const decay = isFar ? 1.0 : 0.5
        setProgress(prev => Math.max(prev - decay, 0))
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current!)
  }, [supply, demand, progress, isTransitioning, config, level])

  const handleLevelComplete = () => {
    if (level < LEVELS.length - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setLevel(prev => prev + 1)
        setProgress(0)
        setIsTransitioning(false)
      }, 2000)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="space-y-8 select-none relative">
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-2xl border border-amber-500/20"
          >
            <motion.div
              initial={{ scale: 0.8, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <CheckCircle2 className="text-amber-500" size={32} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1">Phase Synchronized</h3>
              <p className="text-amber-500/70 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Escalating to {LEVELS[level + 1]?.name}...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          {LEVELS.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
               <div className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i < level ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : i === level ? 'bg-amber-500 w-12 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-white/10'}`} />
               {i < LEVELS.length - 1 && <ArrowRight size={10} className="text-white/10" />}
            </div>
          ))}
        </div>
        <div className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          STAGE 0{level + 1} // CRITICAL
        </div>
      </div>

      {/* Waveform Display */}
      <motion.div 
        animate={status === 'DANGER' ? { x: [-1, 1, -1, 1, 0] } : {}}
        transition={status === 'DANGER' ? { duration: 0.1, repeat: Infinity } : {}}
        className={`glass-card bg-black/80 rounded-xl p-6 border transition-all duration-300 relative overflow-hidden h-64 flex flex-col justify-between
          ${status === 'DANGER' ? 'border-red-500 shadow-[inset_0_0_60px_rgba(239,68,68,0.2)]' : 'border-amber-500/30'}
        `}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
        }} />
        
        <div className="flex justify-between items-start relative z-10">
          <div>
              <h3 className="text-[10px] font-mono text-amber-500/70 uppercase tracking-[0.2em] mb-1">Phase Lock Monitor</h3>
              <div className="flex items-center gap-2">
                  <Activity size={14} className={status === 'STABLE' ? 'text-green-500' : status === 'DANGER' ? 'text-red-500 animate-pulse' : 'text-amber-500 animate-pulse'} />
                  <span className={`text-xl font-black font-mono italic tracking-tighter ${status === 'DANGER' ? 'text-red-500' : 'text-white'}`}>
                      {(49.5 + Math.random()).toFixed(2)} Hz
                  </span>
              </div>
          </div>
          <div className="text-right">
              <span className="text-[10px] font-mono text-amber-500/70 uppercase tracking-[0.2em]">Sync Confidence</span>
              <div className={`text-2xl font-black font-mono italic ${status === 'DANGER' ? 'text-red-400' : 'text-amber-100'}`}>
                  {Math.floor(progress)}%
              </div>
          </div>
        </div>

        {/* Waves Container */}
        <div className="relative h-24 flex items-center justify-center">
             {/* Target Zone - visualization of the range */}
            <motion.div 
              animate={{ 
                top: `${100 - demand - (config.range/2)}%`,
                height: `${config.range}%`,
                backgroundColor: status === 'STABLE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.05)'
              }}
              className="absolute inset-x-0 border-y border-amber-500/20 pointer-events-none transition-all duration-200" 
            />
            
            {/* Demand Line */}
            <motion.div 
                animate={{ top: `${100 - demand}%` }}
                className="absolute inset-x-0 h-[2px] bg-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.6)] z-0 transition-all duration-700 ease-in-out"
            >
                <div className="absolute -right-2 -top-1 px-1.5 py-0.5 bg-amber-500/30 rounded text-[8px] font-mono text-amber-100 whitespace-nowrap uppercase font-bold">GRID_LOAD</div>
            </motion.div>

            {/* Supply Line (User Controlled) */}
            <motion.div 
                animate={{ top: `${100 - supply}%` }}
                className={`absolute inset-x-0 h-[3px] z-10 transition-all duration-150 ease-out
                    ${status === 'STABLE' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)]' : status === 'DANGER' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]' : 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]'}
                `}
            >
                <div className="absolute -left-2 -top-4 px-2 py-0.5 bg-black/80 border border-white/20 rounded text-[9px] font-mono text-white whitespace-nowrap uppercase tracking-widest font-black">
                    GEN_{Math.round(supply)}MW
                </div>
            </motion.div>
        </div>

        {/* Status Bar */}
        <div className="flex gap-2 relative z-10">
            <div className={`flex-1 h-2 rounded-full overflow-hidden bg-white/5 border border-white/5`}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full transition-colors duration-500 ${status === 'STABLE' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : status === 'DANGER' ? 'bg-red-500' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'}`}
                />
            </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="glass-card bg-amber-950/20 rounded-xl p-8 border border-white/5 relative overflow-hidden">
        <label className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-2">
                <Gauge size={16} className="text-amber-500" />
                <span className="text-xs font-mono font-black text-amber-100 uppercase tracking-widest">Generator Throttle</span>
            </div>
            <span className={`text-sm font-mono font-black ${status === 'DANGER' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>{supply.toFixed(1)}%</span>
        </label>
        
        <input 
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={supply}
            disabled={isTransitioning}
            onChange={(e) => setSupply(parseFloat(e.target.value))}
            className="w-full h-4 bg-black/60 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all border border-white/10 disabled:opacity-50"
        />

        <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
            <div className={`p-4 rounded-lg border transition-all duration-500 ${status === 'STABLE' ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-black/40 border-white/5 opacity-40'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest">Frequency Lock</span>
                </div>
                <div className="text-[9px] font-mono opacity-70">{status === 'STABLE' ? 'LOCKED_SECURE' : 'ACQUIRING...'}</div>
            </div>
            <div className={`p-4 rounded-lg border transition-all duration-500 ${status === 'DANGER' ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-black/40 border-white/5 opacity-40'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className={status === 'DANGER' ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest">Grid Instability</span>
                </div>
                <div className="text-[9px] font-mono opacity-70">{status === 'DANGER' ? 'CRITICAL_LEAK' : 'NOMINAL'}</div>
            </div>
        </div>
      </div>
    </div>
  )
}
