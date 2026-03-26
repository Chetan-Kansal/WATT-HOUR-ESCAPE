'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Cpu, Zap, Activity, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

type GateType = 'AND' | 'OR' | 'XOR'

interface Round6ClientProps {}

export default function Round6Client({}: Round6ClientProps) {
    const router = useRouter()
    const LEVELS = [
        { 
            name: "ROUTING_ALPHA", 
            inputs: [1, 0, 1], 
            target: 0, 
            gates: ['AND', 'AND'] as GateType[],
            description: "Synchronize primary cooling valves for the substation cluster."
        },
        { 
            name: "LOGIC_SIGMA", 
            inputs: [1, 1, 0, 1], 
            target: 1, 
            gates: ['XOR', 'OR', 'AND'] as GateType[],
            description: "Bypass secondary phase-lock sensors in the cloud node farm."
        },
        { 
            name: "CORE_DELTA", 
            inputs: [0, 1, 1, 0, 1], 
            target: 0, 
            gates: ['AND', 'OR', 'XOR', 'AND'] as GateType[],
            description: "Calibrate regional containment field topology."
        },
        {
            name: "QUANTUM_GRID",
            inputs: [1, 0, 1, 1, 0, 1],
            target: 1,
            gates: ['XOR', 'AND', 'OR', 'XOR', 'AND'] as GateType[],
            description: "Finalize high-voltage state alignment. Grid stability critical."
        }
    ]

    const [currentLevel, setCurrentLevel] = useState(0)
    const [gates, setGates] = useState<GateType[]>(LEVELS[0].gates)
    const [currentOutput, setCurrentOutput] = useState<number>(0)
    const [submitting, setSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [levelTransitioning, setLevelTransitioning] = useState(false)
    const [intermediateStates, setIntermediateStates] = useState<number[]>([])

    const inputs = LEVELS[currentLevel].inputs
    const targetOutput = LEVELS[currentLevel].target

    useEffect(() => {
        const compute = () => {
            const currentGates = gates
            const currentInputs = inputs
            const states: number[] = [currentInputs[0]]
            let r = currentInputs[0]

            for (let i = 0; i < currentGates.length; i++) {
                const nextInput = currentInputs[i+1]
                const gate = currentGates[i]
                if (gate === 'AND') r = r & nextInput
                else if (gate === 'OR') r = r | nextInput
                else if (gate === 'XOR') r = r ^ nextInput
                states.push(r)
            }
            
            setIntermediateStates(states)
            setCurrentOutput(r)
        }
        compute()
    }, [gates, inputs, currentLevel])

    const cycleGate = (index: number) => {
        if (isSuccess || levelTransitioning) return
        const types: GateType[] = ['AND', 'OR', 'XOR']
        setGates(prev => {
            const next = [...prev]
            const currentIdx = types.indexOf(next[index])
            next[index] = types[(currentIdx + 1) % types.length]
            return next
        })
    }

    const handleSubmit = async () => {
        if (currentOutput !== targetOutput) {
            toast.error("Logic Error: Output mismatch in current grid topology.")
            return
        }

        if (currentLevel < LEVELS.length - 1) {
            setLevelTransitioning(true)
            toast.success(`Sector ${currentLevel + 1} Secured. Syncing...`)
            setTimeout(() => {
                const nextLevel = currentLevel + 1
                setCurrentLevel(nextLevel)
                setGates(LEVELS[nextLevel].gates)
                setLevelTransitioning(false)
            }, 1200)
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/round6/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passed: true })
            })
            const data = await res.json()
            if (res.ok && data.passed) {
                setIsSuccess(true)
                toast.success("Grid Secure. Handshaking Complete.")
                setTimeout(() => {
                    router.push('/dashboard')
                    router.refresh()
                }, 2000)
            } else {
                toast.error(data.error || "Uplink rejected.")
            }
        } catch {
            toast.error("Packet loss detected in uplink.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Top Deck: Mission Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="md:col-span-2 glass-card rounded-2xl p-6 border border-cyan-500/30 bg-[#020617]/80 backdrop-blur-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Cpu size={120} className="text-cyan-400" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                            <Activity className="text-cyan-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Logic_Gate_Synchronizer</h2>
                                <div className="flex gap-1.5">
                                    {LEVELS.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`h-2 rounded-full transition-all duration-700 ${i < currentLevel ? 'w-8 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : i === currentLevel ? 'w-12 bg-cyan-400 animate-pulse' : 'w-4 bg-white/10'}`} 
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-[10px] font-mono text-cyan-400 font-black uppercase tracking-[0.4em]">Substation_Sector: 0{currentLevel + 1} // {LEVELS[currentLevel].name}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl mb-6">
                        <p className="text-xs text-cyan-100/70 leading-relaxed font-mono uppercase italic">
                            <span className="text-cyan-400 font-black mr-2">BLOCK_TASK:</span>
                            {LEVELS[currentLevel].description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center">
                            <span className="text-[9px] font-mono text-cyan-400/50 uppercase tracking-widest mb-1">Target_Topology</span>
                            <span className={`text-4xl font-black font-mono tracking-tighter ${targetOutput === 1 ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-blue-500'}`}>
                                {targetOutput}
                            </span>
                        </div>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center">
                            <span className="text-[9px] font-mono text-cyan-400/50 uppercase tracking-widest mb-1">Current_Output</span>
                            <motion.span 
                                key={currentOutput}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-4xl font-black font-mono tracking-tighter ${isSuccess ? 'text-green-400' : 'text-cyan-400/30'}`}
                            >
                                {isSuccess ? currentOutput : '?'}
                            </motion.span>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card rounded-2xl p-6 border border-white/5 bg-[#0A0A0A]/40 backdrop-blur-xl flex flex-col justify-between"
                >
                    <div>
                        <h3 className="text-xs font-mono text-white/40 uppercase tracking-[0.3em] mb-4">Gate_Schematics</h3>
                        <div className="space-y-4">
                            {[
                                { gate: 'AND', desc: 'Outputs 1 only if all inputs are 1.' },
                                { gate: 'OR', desc: 'Outputs 1 if any input is 1.' },
                                { gate: 'XOR', desc: 'Outputs 1 only if inputs differ.' }
                            ].map(guide => (
                                <div key={guide.gate} className="flex gap-3">
                                    <div className="w-10 h-8 rounded border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-[10px] font-mono text-cyan-400 font-black">{guide.gate}</div>
                                    <p className="text-[9px] font-mono text-white/50 leading-tight uppercase">{guide.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                            <span className="text-[10px] font-mono text-cyan-400/60 uppercase">Encryption: AES_256_ACTIVE</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Circuit Area: The Interactive Grid */}
            <div className="relative glass-card rounded-3xl border border-white/10 bg-black/60 min-h-[500px] flex items-center justify-start lg:justify-center overflow-x-auto overflow-y-hidden">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden" style={{ 
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #22d3ee 1px, transparent 0)', 
                    backgroundSize: '40px 40px' 
                }} />

                <div className="flex items-center gap-0 min-w-max h-full pl-32 pr-20 py-12 relative z-10">
                    {/* IN_0 */}
                    <div className="relative group">
                        <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center font-mono font-black text-2xl transition-all duration-500
                            ${inputs[0] === 1 ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/10 text-white/20 bg-white/5'}
                        `}>
                            {inputs[0]}
                        </div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/30 uppercase tracking-[0.4em] font-black group-hover:text-cyan-400 transition-colors">IN_00</div>
                    </div>

                    {gates.map((gate, idx) => (
                        <div key={idx} className="flex items-center gap-0">
                            {/* Trace Line */}
                            <div className="relative w-16 md:w-24 lg:w-32 h-[2px]">
                                <div className="absolute inset-0 bg-white/10" />
                                <motion.div 
                                    className={`absolute inset-0 ${isSuccess ? (intermediateStates[idx] === 1 ? 'bg-cyan-500 shadow-[0_0_15px_#22d3ee]' : 'bg-transparent') : 'bg-white/5'}`}
                                    animate={isSuccess && intermediateStates[idx] === 1 ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                />
                                <motion.div 
                                    className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full blur-[2px] ${isSuccess ? (intermediateStates[idx] === 1 ? 'bg-cyan-400' : 'transparent') : 'bg-white/10'}`}
                                    animate={{ 
                                        x: [0, 80, 0],
                                        opacity: isSuccess ? (intermediateStates[idx] === 1 ? 1 : 0) : [0.1, 0.3, 0.1]
                                    }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                />
                            </div>

                            {/* Gate Card */}
                            <div className="flex flex-col items-center relative gap-6">
                                {/* Vertical Input Line */}
                                <div className="absolute -top-12 md:-top-16 flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-mono font-black text-lg transition-all
                                        ${inputs[idx + 1] === 1 ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-white/10 text-white/20'}
                                    `}>
                                        {inputs[idx + 1]}
                                    </div>
                                    <div className="w-[2px] h-6 md:h-8 bg-white/10" />
                                    <span className="absolute -top-16 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/20 uppercase">IN_{idx + 1}</span>
                                </div>

                                <motion.div 
                                    whileHover={{ scale: 1.05, borderColor: 'rgba(34, 211, 238, 0.8)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => cycleGate(idx)}
                                    className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all group relative overflow-hidden
                                        ${isSuccess ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-900/40'}
                                    `}
                                >
                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-[10px] font-mono text-cyan-500/50 font-black italic tracking-widest relative z-10">0{idx}</span>
                                    <span className="text-xl md:text-2xl font-black font-mono italic text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] relative z-10">
                                        {gate}
                                    </span>
                                    <div className="flex gap-0.5 mt-1">
                                        {[0,1,2].map(i => <div key={i} className={`w-1.5 h-0.5 rounded-full ${gate === ['AND','OR','XOR'][i] ? 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]' : 'bg-white/10'}`} />)}
                                    </div>
                                    <Zap size={12} className="text-cyan-400/30 group-hover:text-cyan-400 transition-colors mt-2" />
                                </motion.div>
                            </div>
                        </div>
                    ))}

                    {/* Final Sector */}
                    <div className="flex items-center">
                        <div className="w-12 md:w-20 h-[2px] relative transition-all duration-500">
                             <div className="absolute inset-0 bg-white/10" />
                             <motion.div 
                                className={`absolute inset-0 ${isSuccess ? 'bg-green-500/30' : 'bg-transparent'}`}
                                animate={isSuccess ? { opacity: [0.5, 1, 0.5] } : { opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                        </div>
                        <div className="relative">
                            <motion.div 
                                animate={isSuccess ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-4 flex items-center justify-center transition-all duration-500 bg-black/90 relative z-20
                                    ${isSuccess ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'border-white/10'}
                                `}
                            >
                                <motion.span 
                                    key={currentOutput}
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    className={`text-4xl md:text-5xl font-black font-mono tracking-tighter ${isSuccess ? 'text-green-400' : 'text-white/20'}`}
                                >
                                    {isSuccess ? currentOutput : '?'}
                                </motion.span>
                                
                                {isSuccess && (
                                    <div className="absolute -inset-4 border border-green-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                                )}
                            </motion.div>
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] font-black">OUT_STREAM</span>
                                {isSuccess && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-[2px] bg-green-500 mt-1 shadow-[0_0_10px_#22c55e]" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 glass-card rounded-3xl border border-white/5 bg-[#030712]/60 backdrop-blur-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-4 text-cyan-400/60 max-w-md">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                        <Info size={20} className="animate-pulse" />
                    </div>
                    <p className="text-[11px] font-mono leading-relaxed uppercase tracking-wider">
                        Click on <span className="text-white font-black">logic processors</span> to cycle operations. 
                        Target current is <span className="text-cyan-400 font-bold underline underline-offset-4">{targetOutput}</span>. 
                        Sync all sectors to secure the handshake.
                    </p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="text-right hidden md:block">
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Topology_Status</p>
                        <p className={`text-xs font-mono font-black ${isSuccess ? 'text-green-500' : 'text-cyan-500/50'}`}>
                            {isSuccess ? 'SYNCHRONIZED' : 'UPLINK_READY'}
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={submitting || isSuccess}
                        className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 text-sm relative overflow-hidden group/btn
                            ${isSuccess 
                                ? 'bg-green-500 text-black' 
                                : 'bg-cyan-500 text-black hover:bg-cyan-400'}
                        `}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                        {submitting ? (
                            <>SYNCING_DATA... <Activity className="animate-spin" size={20} /></>
                        ) : isSuccess ? (
                            <>UPLINK_SECURED <CheckCircle2 size={20} /></>
                        ) : (
                            <>DEPLOY_TOPOLOGY <Zap size={20} /></>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    )
}
