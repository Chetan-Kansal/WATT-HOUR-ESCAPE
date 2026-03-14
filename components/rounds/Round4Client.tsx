'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle2, XCircle, Loader2, Sparkles, BrainCircuit, ScanLine, ImagePlus, Target } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageData { id: string; title: string; image_url: string; threshold: number; instructions: string }
interface SubmitResult { similarity_score: number; threshold: number; passed: boolean; message: string }

export default function Round4Client() {
    const router = useRouter()
    const [imageData, setImageData] = useState<ImageData | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<SubmitResult | null>(null)

    useEffect(() => {
        fetch('/api/round4/image', { cache: 'no-store' })
            .then(r => r.json())
            .then(setImageData)
            .catch(() => toast.error('Failed to load image'))
            .finally(() => setLoading(false))
    }, [])

    const onDrop = useCallback((files: File[]) => {
        const f = files[0]
        if (!f) return
        if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
        setFile(f)
        setPreview(URL.createObjectURL(f))
        setResult(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1,
    })

    const handleSubmit = async () => {
        if (!file || !imageData || submitting) return
        setSubmitting(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('image_id', imageData.id)
            const res = await fetch('/api/round4/submit', { method: 'POST', body: fd })
            const data: SubmitResult = await res.json()
            if (!res.ok) { toast.error((data as unknown as { error: string }).error); return }
            setResult(data)
            if (data.passed) {
                toast.success('✓ Neural Match Found! Round 4 complete!')
                setTimeout(() => router.push('/dashboard'), 3000)
            }
        } catch { toast.error('Neural analysis failed') }
        finally { setSubmitting(false) }
    }

    if (loading) return <div className="flex flex-col items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-fuchsia-500 mb-4" /><span className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">Initializing Vision Model...</span></div>

    // Generate segments for the neural network bar
    const segments = 20; 

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-card rounded-xl p-5 border border-fuchsia-500/20 bg-[#0f0f15]/80 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                    <BrainCircuit size={100} />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-3 font-mono tracking-tight">
                    <Sparkles size={20} className="text-fuchsia-400" /> Reverse prompt engineering
                </h2>
                <div className="bg-muted/20 p-4 rounded-lg border border-border/30">
                    <p className="text-sm text-muted-foreground/90 leading-relaxed font-sans">{imageData?.instructions}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Reference Image Container */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Target size={12} className="text-blue-400" /> Target Image
                        </span>
                        <span className="text-[10px] font-mono text-primary/50 uppercase">DATASET_{imageData?.id?.substring(0,4)}</span>
                    </div>
                    
                    <div className="glass-card rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-border/50 relative bg-[#0a0a0a] group">
                        {/* Scanning grid overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 transition-opacity group-hover:opacity-40" style={{ 
                            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)', 
                            backgroundSize: '20px 20px' 
                        }} />
                        
                        {imageData?.image_url ? (
                            <Image src={imageData.image_url} alt="Reference" width={400} height={400} className="object-cover w-full h-full" />
                        ) : (
                            <Loader2 size={32} className="animate-spin text-muted-foreground" />
                        )}
                        
                        {/* Corner brackets */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500/50" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500/50" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500/50" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500/50" />
                    </div>
                </div>

                {/* AI Scanner Dropzone */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <ScanLine size={12} className="text-fuchsia-400" /> AI Output Scanner
                        </span>
                        <span className="text-[10px] font-mono text-fuchsia-500/50 uppercase">{file ? 'READY' : 'AWAITING_INPUT'}</span>
                    </div>

                    <div
                        {...getRootProps()}
                        className={`aspect-square glass-card rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 relative group bg-[#0a0a0a]
                            ${isDragActive ? 'border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.15)] ring-1 ring-fuchsia-500/50' : 'border-border/50 hover:border-fuchsia-500/40'}
                        `}
                    >
                        <input {...getInputProps()} />
                        
                        {/* Scanner Laser Animation */}
                        {(isDragActive || submitting) && (
                            <motion.div 
                                className="absolute left-0 right-0 h-1 bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)] z-20 pointer-events-none"
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                            />
                        )}

                        {preview ? (
                            <>
                                <img src={preview} alt="Your upload" className={`object-cover w-full h-full transition-all duration-500 ${submitting ? 'opacity-50 saturate-0 blur-sm' : 'opacity-100'}`} />
                                {submitting && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                                        <ScanLine size={48} className="text-fuchsia-500 animate-pulse mb-4" />
                                        <span className="text-xs font-mono font-bold text-white tracking-widest bg-fuchsia-500/20 px-4 py-1.5 rounded-full border border-fuchsia-500/30">
                                            RUNNING NEURAL MATCH
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center p-6 relative z-10">
                                <motion.div 
                                    animate={{ y: [0, -5, 0] }} 
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center border border-dashed transition-colors
                                        ${isDragActive ? 'bg-fuchsia-500/10 border-fuchsia-500 scale-110' : 'bg-muted/10 border-muted-foreground'}
                                    `}
                                >
                                    <ImagePlus size={32} className={isDragActive ? 'text-fuchsia-400' : 'text-muted-foreground'} />
                                </motion.div>
                                <p className="text-sm font-semibold text-foreground/90 font-sans">
                                    {isDragActive ? 'DEPLOY FILE TO SCANNER' : 'DRAG & DROP IMAGE GENERATION'}
                                </p>
                                <p className="text-[10px] font-mono text-muted-foreground/60 mt-3 uppercase tracking-widest">
                                    Click to browse local files (Max 5MB)
                                </p>
                            </div>
                        )}
                        
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-fuchsia-500/50" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-500/50" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-500/50" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-fuchsia-500/50" />
                    </div>
                </div>
            </div>

            {/* Neural Similarity Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`glass-card rounded-xl p-6 border relative overflow-hidden bg-[#0A0A0A]
                            ${result.passed ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]'}
                        `}
                    >
                        {/* Background subtle glow */}
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none
                            ${result.passed ? 'bg-green-500' : 'bg-red-500'}
                        `} />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border
                                    ${result.passed ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}
                                `}>
                                    {result.passed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                </div>
                                <div>
                                    <h3 className={`text-sm font-bold font-mono tracking-widest uppercase ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.passed ? 'Match Accepted' : 'Match Failed'}
                                    </h3>
                                    <span className="text-xs text-muted-foreground font-sans">{result.message}</span>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest block mb-1">Confidence Score</span>
                                <span className={`text-3xl font-mono font-bold tracking-tighter ${result.passed ? 'text-foreground' : 'text-red-300'}`}>
                                    {Math.round(result.similarity_score * 100)}<span className="text-xl text-muted-foreground/50">%</span>
                                </span>
                            </div>
                        </div>

                        {/* Segmented Neural Bar */}
                        <div className="space-y-2 relative z-10">
                            <div className="flex gap-1 h-3 w-full relative group">
                                {/* Base segments */}
                                {[...Array(segments)].map((_, i) => {
                                    const percentVal = (i + 1) / segments;
                                    const isFilled = result.similarity_score >= percentVal;
                                    const isPassedState = result.passed;
                                    
                                    // Calculate color intensity based on position
                                    const intensity = isPassedState 
                                        ? `rgba(34, 197, 94, ${0.4 + (i/segments)*0.6})`  // Green gradient
                                        : `rgba(239, 68, 68, ${0.4 + (i/segments)*0.6})`; // Red gradient
                                        
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            transition={{ delay: i * 0.05, type: 'spring' }}
                                            className={`flex-1 rounded-sm border ${isFilled ? 'border-transparent' : 'border-border/30 bg-muted/10'}`}
                                            style={{ 
                                                backgroundColor: isFilled ? intensity : undefined,
                                                boxShadow: isFilled ? `0 0 8px ${intensity}` : 'none'
                                            }}
                                        />
                                    );
                                })}

                                {/* Threshold marker overlay */}
                                <div
                                    className="absolute top-[-4px] bottom-[-4px] w-[2px] bg-blue-400 z-10 flex flex-col items-center shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                                    style={{ left: `${result.threshold * 100}%` }}
                                >
                                    <div className="absolute -top-5 text-[9px] font-mono text-blue-400 uppercase tracking-widest whitespace-nowrap bg-[#0a0a0a] px-1 rounded border border-blue-500/20">
                                        Req: {Math.round(result.threshold * 100)}%
                                    </div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full absolute -bottom-1" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleSubmit}
                disabled={!file || submitting}
                className="w-full h-14 bg-fuchsia-600 text-white rounded-xl font-mono text-sm tracking-widest font-bold hover:bg-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(217,70,239,0.3)] relative overflow-hidden group border border-fuchsia-400/30"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                {submitting ? (
                    <><Loader2 size={18} className="animate-spin relative z-10" /> <span className="relative z-10">RUNNING ANALYSIS...</span></>
                ) : (
                    <><BrainCircuit size={18} className="relative z-10" /> <span className="relative z-10">INITIATE SCAN</span></>
                )}
            </button>
        </div>
    )
}
