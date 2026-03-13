'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle2, XCircle, Loader2, ImageIcon, Sparkles } from 'lucide-react'
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
                toast.success('✓ Image accepted! Round 4 complete!')
                setTimeout(() => router.push('/dashboard'), 3000)
            }
        } catch { toast.error('Submission failed') }
        finally { setSubmitting(false) }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary" /></div>

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="glass-card rounded-2xl p-5">
                <p className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                    <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    {imageData?.instructions}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Reference Image */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon size={14} /> Reference Image
                    </h3>
                    <div className="glass-card rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
                        {imageData?.image_url ? (
                            <Image src={imageData.image_url} alt="Reference" width={400} height={400} className="object-cover w-full h-full rounded-2xl" />
                        ) : (
                            <div className="text-muted-foreground text-5xl">🖼️</div>
                        )}
                    </div>
                </div>

                {/* Upload area */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Upload size={14} /> Your AI Image
                    </h3>
                    <div
                        {...getRootProps()}
                        className={`aspect-square glass-card rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}
              ${preview ? 'border-transparent' : 'border-2 border-dashed'}
            `}
                    >
                        <input {...getInputProps()} />
                        {preview ? (
                            <img src={preview} alt="Your upload" className="object-cover w-full h-full rounded-2xl" />
                        ) : (
                            <div className="text-center p-6">
                                <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                <p className="text-sm text-muted-foreground">
                                    {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                                </p>
                                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP · Max 5MB</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Similarity Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`glass-card rounded-2xl p-6 border ${result.passed ? 'border-green-500/30' : 'border-red-500/30'}`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            {result.passed ? <CheckCircle2 size={20} className="text-green-400" /> : <XCircle size={20} className="text-red-400" />}
                            <span className={`font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.message}</span>
                        </div>
                        {/* Similarity bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Similarity Score</span>
                                <span className="font-mono font-bold text-foreground">{Math.round(result.similarity_score * 100)}%</span>
                            </div>
                            <div className="relative h-3 bg-muted rounded-full overflow-visible">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(result.similarity_score * 100, 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${result.passed ? 'bg-green-500' : 'bg-orange-500'}`}
                                />
                                {/* Threshold marker */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded"
                                    style={{ left: `${result.threshold * 100}%` }}
                                />
                                <span
                                    className="absolute top-5 text-xs text-blue-400 font-mono -translate-x-1/2"
                                    style={{ left: `${result.threshold * 100}%` }}
                                >
                                    {Math.round(result.threshold * 100)}% min
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleSubmit}
                disabled={!file || submitting}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-glow-blue"
            >
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Sparkles size={18} /> Submit Image</>}
            </button>
        </div>
    )
}
