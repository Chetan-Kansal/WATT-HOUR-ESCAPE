// Database types for Supabase — compatible with @supabase/supabase-js v2
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
    public: {
        Tables: {
            teams: {
                Row: {
                    id: string
                    team_name: string
                    email: string
                    current_round: number
                    start_time: string | null
                    end_time: string | null
                    total_time: number | null
                    status: 'registered' | 'active' | 'completed' | 'disqualified'
                    created_at: string
                }
                Insert: {
                    id?: string
                    team_name: string
                    email: string
                    current_round?: number
                    start_time?: string | null
                    end_time?: string | null
                    total_time?: number | null
                    status?: 'registered' | 'active' | 'completed' | 'disqualified'
                    created_at?: string
                }
                Update: {
                    id?: string
                    team_name?: string
                    email?: string
                    current_round?: number
                    start_time?: string | null
                    end_time?: string | null
                    total_time?: number | null
                    status?: 'registered' | 'active' | 'completed' | 'disqualified'
                    created_at?: string
                }
                Relationships: []
            }
            progress: {
                Row: {
                    id: string
                    team_id: string
                    round1_completed: boolean
                    round2_completed: boolean
                    round3_completed: boolean
                    round4_completed: boolean
                    round5_completed: boolean
                    round1_time: string | null
                    round2_time: string | null
                    round3_time: string | null
                    round4_time: string | null
                    round5_time: string | null
                    quiz_streak: number
                    quiz_questions_seen: string[]
                    debug_attempts: number
                    updated_at: string
                }
                Insert: {
                    id?: string
                    team_id: string
                    round1_completed?: boolean
                    round2_completed?: boolean
                    round3_completed?: boolean
                    round4_completed?: boolean
                    round5_completed?: boolean
                    round1_time?: string | null
                    round2_time?: string | null
                    round3_time?: string | null
                    round4_time?: string | null
                    round5_time?: string | null
                    quiz_streak?: number
                    quiz_questions_seen?: string[]
                    debug_attempts?: number
                    updated_at?: string
                }
                Update: {
                    team_id?: string
                    round1_completed?: boolean
                    round2_completed?: boolean
                    round3_completed?: boolean
                    round4_completed?: boolean
                    round5_completed?: boolean
                    round1_time?: string | null
                    round2_time?: string | null
                    round3_time?: string | null
                    round4_time?: string | null
                    round5_time?: string | null
                    quiz_streak?: number
                    quiz_questions_seen?: string[]
                    debug_attempts?: number
                    updated_at?: string
                }
                Relationships: []
            }
            quiz_questions: {
                Row: {
                    id: string
                    question: string
                    option_a: string
                    option_b: string
                    option_c: string
                    option_d: string
                    correct_option: 'A' | 'B' | 'C' | 'D'
                    category: 'programming' | 'cs_fundamentals' | 'energy_systems' | 'logic'
                    difficulty: 'easy' | 'medium' | 'hard'
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    question: string
                    option_a: string
                    option_b: string
                    option_c: string
                    option_d: string
                    correct_option: 'A' | 'B' | 'C' | 'D'
                    category: 'programming' | 'cs_fundamentals' | 'energy_systems' | 'logic'
                    difficulty?: 'easy' | 'medium' | 'hard'
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    question?: string
                    option_a?: string
                    option_b?: string
                    option_c?: string
                    option_d?: string
                    correct_option?: 'A' | 'B' | 'C' | 'D'
                    category?: 'programming' | 'cs_fundamentals' | 'energy_systems' | 'logic'
                    difficulty?: 'easy' | 'medium' | 'hard'
                    is_active?: boolean
                }
                Relationships: []
            }
            debug_problems: {
                Row: {
                    id: string
                    title: string
                    problem_text: string
                    code_snippet: string
                    language: 'python' | 'javascript' | 'cpp' | 'java'
                    expected_output: string
                    test_cases: Json
                    judge0_language_id: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    problem_text: string
                    code_snippet: string
                    language: 'python' | 'javascript' | 'cpp' | 'java'
                    expected_output: string
                    test_cases?: Json
                    judge0_language_id?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    title?: string
                    problem_text?: string
                    code_snippet?: string
                    language?: 'python' | 'javascript' | 'cpp' | 'java'
                    expected_output?: string
                    test_cases?: Json
                    judge0_language_id?: number
                    is_active?: boolean
                }
                Relationships: []
            }
            circuit_problems: {
                Row: {
                    id: string
                    title: string
                    problem: string
                    diagram_options: Json
                    correct_option: string
                    explanation: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    problem: string
                    diagram_options: Json
                    correct_option: string
                    explanation: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    title?: string
                    problem?: string
                    diagram_options?: Json
                    correct_option?: string
                    explanation?: string
                    is_active?: boolean
                }
                Relationships: []
            }
            image_round: {
                Row: {
                    id: string
                    title: string
                    image_url: string
                    prompt_hidden: string
                    similarity_threshold: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    image_url: string
                    prompt_hidden: string
                    similarity_threshold?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    title?: string
                    image_url?: string
                    prompt_hidden?: string
                    similarity_threshold?: number
                    is_active?: boolean
                }
                Relationships: []
            }
            morse_data: {
                Row: {
                    id: string
                    audio_url: string
                    word: string
                    morse_code: string
                    is_final_key: boolean
                    sort_order: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    audio_url: string
                    word: string
                    morse_code: string
                    is_final_key?: boolean
                    sort_order?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    audio_url?: string
                    word?: string
                    morse_code?: string
                    is_final_key?: boolean
                    sort_order?: number
                    is_active?: boolean
                }
                Relationships: []
            }
            submission_log: {
                Row: {
                    id: string
                    team_id: string
                    round: number
                    attempt_count: number
                    last_attempt_at: string
                }
                Insert: {
                    id?: string
                    team_id: string
                    round: number
                    attempt_count?: number
                    last_attempt_at?: string
                }
                Update: {
                    attempt_count?: number
                    last_attempt_at?: string
                }
                Relationships: []
            }
            ip_log: {
                Row: {
                    id: string
                    team_id: string | null
                    ip_address: string
                    endpoint: string
                    method: string
                    logged_at: string
                }
                Insert: {
                    id?: string
                    team_id?: string | null
                    ip_address: string
                    endpoint: string
                    method?: string
                    logged_at?: string
                }
                Update: {
                    team_id?: string | null
                    ip_address?: string
                    endpoint?: string
                    method?: string
                }
                Relationships: []
            }
        }
        Views: {
            leaderboard: {
                Row: {
                    id: string
                    team_name: string
                    current_round: number
                    status: string
                    start_time: string | null
                    end_time: string | null
                    total_time: number | null
                    created_at: string
                    rank: number
                }
            }
        }
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}

// Convenience types
export type Team = Database['public']['Tables']['teams']['Row']
export type Progress = Database['public']['Tables']['progress']['Row']
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
export type DebugProblem = Database['public']['Tables']['debug_problems']['Row']
export type CircuitProblem = Database['public']['Tables']['circuit_problems']['Row']
export type ImageRound = Database['public']['Tables']['image_round']['Row']
export type MorseData = Database['public']['Tables']['morse_data']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row']
