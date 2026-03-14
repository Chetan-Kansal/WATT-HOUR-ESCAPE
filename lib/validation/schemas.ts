import { z } from 'zod'

// ── Auth ─────────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
    team_name: z.string().min(2, 'Team name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
})

// ── Round 1 ──────────────────────────────────────────────────────────────────
export const Round1SubmitSchema = z.object({
    question_id: z.string().uuid('Invalid question ID'),
    answer: z.enum(['A', 'B', 'C', 'D'], { message: 'Answer must be A, B, C, or D' }),
})

// ── Round 2 ──────────────────────────────────────────────────────────────────
export const Round2SubmitSchema = z.object({
    problem_id: z.string().uuid(),
    code: z.string().min(1, 'Code cannot be empty').max(10000, 'Code too long'),
    language: z.enum(['python', 'javascript', 'cpp', 'java', 'c']).default('python'),
})

// ── Round 3 ──────────────────────────────────────────────────────────────────
export const Round3SubmitSchema = z.object({
    problem_id: z.string().uuid(),
    selected_option: z.enum(['A', 'B', 'C', 'D']),
})

// ── Round 5 ──────────────────────────────────────────────────────────────────
export const Round5SubmitSchema = z.object({
    key: z.string().min(1).max(50).transform(s => s.trim().toUpperCase()),
})

// ── Admin ─────────────────────────────────────────────────────────────────────
export const QuizQuestionSchema = z.object({
    question: z.string().min(10),
    option_a: z.string().min(1),
    option_b: z.string().min(1),
    option_c: z.string().min(1),
    option_d: z.string().min(1),
    correct_option: z.enum(['A', 'B', 'C', 'D']),
    category: z.enum(['programming', 'cs_fundamentals', 'energy_systems', 'logic']),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

// ── Generic error response helper ────────────────────────────────────────────
export function validationError(message: string, status = 400) {
    return Response.json({ error: message }, { status })
}

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type Round1SubmitInput = z.infer<typeof Round1SubmitSchema>
export type Round2SubmitInput = z.infer<typeof Round2SubmitSchema>
export type Round3SubmitInput = z.infer<typeof Round3SubmitSchema>
export type Round5SubmitInput = z.infer<typeof Round5SubmitSchema>
