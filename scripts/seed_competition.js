const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local to get values
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envLines = envFile.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('Error reading .env.local:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCompetitionData() {
  console.log('🌱 Starting competition data seeding process...');
  console.log('Using Supabase URL:', supabaseUrl);

  try {
    // ---------------------------------------------------------
    // 0. CLEAR EXISTING DATA
    // ---------------------------------------------------------
    console.log('🗑️  Clearing existing data from all competition tables...');
    
    // Deleting teams will cascade to progress and submission_log
    const { error: errTeams } = await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    const { error: errQuiz } = await supabase.from('quiz_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: errDebug } = await supabase.from('debug_problems').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: errCircuit } = await supabase.from('circuit_problems').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: errImage } = await supabase.from('image_round').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: errMorse } = await supabase.from('morse_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (errTeams) console.error('Error clearing teams:', errTeams.message);
    if (errQuiz) console.error('Error clearing quiz_questions:', errQuiz.message);
    
    console.log('✅ Base tables cleared.');

    // ---------------------------------------------------------
    // 1. ROUND 1: QUIZ QUESTIONS
    // ---------------------------------------------------------
    console.log('📝 Seeding Round 1 - Quiz Questions...');
    const round1Questions = [
      {
        question: "What is the time complexity of binary search?",
        option_a: "O(n)", option_b: "O(log n)", option_c: "O(n log n)", option_d: "O(1)",
        correct_option: "B", category: "programming", difficulty: "medium"
      },
      {
        question: "Which data structure uses FIFO?",
        option_a: "Stack", option_b: "Queue", option_c: "Tree", option_d: "Graph",
        correct_option: "B", category: "programming", difficulty: "easy"
      },
      {
        question: "Which HTTP status means success?",
        option_a: "404", option_b: "200", option_c: "500", option_d: "301",
        correct_option: "B", category: "cs_fundamentals", difficulty: "easy"
      },
      {
        question: "Which keyword prevents inheritance in Java?",
        option_a: "const", option_b: "static", option_c: "final", option_d: "sealed",
        correct_option: "C", category: "programming", difficulty: "medium"
      },
      {
        question: "Which is NOT a programming paradigm?",
        option_a: "Object oriented", option_b: "Functional", option_c: "Procedural", option_d: "Relational",
        correct_option: "D", category: "programming", difficulty: "easy"
      },
      {
        question: "Which sorting algorithm is stable?",
        option_a: "Quick sort", option_b: "Heap sort", option_c: "Merge sort", option_d: "Selection sort",
        correct_option: "C", category: "programming", difficulty: "medium"
      },
      {
        question: "Which protocol is used for secure web?",
        option_a: "HTTP", option_b: "FTP", option_c: "HTTPS", option_d: "SMTP",
        correct_option: "C", category: "cs_fundamentals", difficulty: "easy"
      },
      {
        question: "Which structure supports LIFO?",
        option_a: "Queue", option_b: "Stack", option_c: "Array", option_d: "Linked list",
        correct_option: "B", category: "programming", difficulty: "easy"
      },
      {
        question: "Which SQL command removes table?",
        option_a: "DELETE", option_b: "REMOVE", option_c: "DROP", option_d: "CLEAR",
        correct_option: "C", category: "cs_fundamentals", difficulty: "medium"
      },
      {
        question: "Which is fastest lookup?",
        option_a: "Array", option_b: "HashMap", option_c: "LinkedList", option_d: "Queue",
        correct_option: "B", category: "programming", difficulty: "easy"
      },
      {
        question: "Which OS scheduling is preemptive?",
        option_a: "FCFS", option_b: "Round Robin", option_c: "FIFO", option_d: "None",
        correct_option: "B", category: "cs_fundamentals", difficulty: "medium"
      },
      {
        question: "Which language runs in browser?",
        option_a: "Python", option_b: "C++", option_c: "JavaScript", option_d: "Rust",
        correct_option: "C", category: "programming", difficulty: "easy"
      },
      {
        question: "Which is primary key property?",
        option_a: "Duplicate allowed", option_b: "Unique", option_c: "Optional", option_d: "Nullable",
        correct_option: "B", category: "cs_fundamentals", difficulty: "easy"
      },
      {
        question: "Which is NoSQL?",
        option_a: "MySQL", option_b: "Postgres", option_c: "MongoDB", option_d: "Oracle",
        correct_option: "C", category: "cs_fundamentals", difficulty: "easy"
      },
      {
        question: "Which layer handles routing?",
        option_a: "Transport", option_b: "Network", option_c: "Application", option_d: "Session",
        correct_option: "B", category: "cs_fundamentals", difficulty: "hard"
      }
    ];

    const { error: errQ1 } = await supabase.from('quiz_questions').insert(round1Questions);
    if (errQ1) throw new Error(`Round 1 Error: ${errQ1.message}`);
    console.log(`✅ Inserted ${round1Questions.length} Round 1 questions.`);


    // ---------------------------------------------------------
    // 2. ROUND 2: DEBUG PROBLEMS
    // ---------------------------------------------------------
    console.log('🐛 Seeding Round 2 - Debug Problems...');
    const round2Problems = [
      {
        title: "Fix the Broken Sum Function",
        problem_text: "The function should return the sum of numbers from 1 to n.\nCurrent implementation gives wrong output.\nFix the code.",
        code_snippet: "def sum_n(n):\n    total = 0\n    for i in range(1,n):\n        total += i\n    return total",
        language: "python",
        expected_output: "15\n55\n1\n5050",
        test_cases: JSON.stringify([
          { input: "print(sum_n(5))", expected: "15" },
          { input: "print(sum_n(10))", expected: "55" },
          { input: "print(sum_n(1))", expected: "1" },
          { input: "print(sum_n(100))", expected: "5050" }
        ]),
        judge0_language_id: 71,
        is_active: true
      },
      {
        title: "Fix Fibonacci Logic",
        problem_text: "The function should return the nth Fibonacci number. However, the recursive logic has a flaw. Fix it.",
        code_snippet: "def fib(n):\n    if n <=1:\n        return n\n    return fib(n-1)+fib(n-3)",
        language: "python",
        expected_output: "1\n5\n55",
        test_cases: JSON.stringify([
          { input: "print(fib(1))", expected: "1" },
          { input: "print(fib(5))", expected: "5" },
          { input: "print(fib(10))", expected: "55" }
        ]),
        judge0_language_id: 71,
        is_active: true
      }
    ];

    const { error: errQ2 } = await supabase.from('debug_problems').insert(round2Problems);
    if (errQ2) throw new Error(`Round 2 Error: ${errQ2.message}`);
    console.log(`✅ Inserted ${round2Problems.length} Round 2 debug problems.`);

    // ---------------------------------------------------------
    // 3. ROUND 3: CIRCUIT LAB
    // ---------------------------------------------------------
    console.log('⚡ Seeding Round 3 - Circuit Problems...');
    const round3Problems = [
      {
        title: "Step Down Voltage",
        problem: "You need to step down 12V to 5V for microcontroller.\nWhich circuit is correct?",
        diagram_options: JSON.stringify([
          { id: "A", label: "Voltage divider using resistors.", description: "Voltage divider using resistors.", image_url: "/circuits/default_a.svg" },
          { id: "B", label: "Linear voltage regulator 7805.", description: "Linear voltage regulator 7805.", image_url: "/circuits/default_b.svg" },
          { id: "C", label: "Direct connection.", description: "Direct connection.", image_url: "/circuits/default_c.svg" },
          { id: "D", label: "Transformer only.", description: "Transformer only.", image_url: "/circuits/default_d.svg" }
        ]),
        correct_option: "B",
        explanation: "Voltage divider cannot supply stable current.",
        is_active: true
      },
      {
        title: "Reverse Polarity Protection",
        problem: "Which circuit protects from reverse polarity?",
        diagram_options: JSON.stringify([
          { id: "A", label: "Series diode", description: "Series diode", image_url: "/circuits/default_a.svg" },
          { id: "B", label: "Parallel resistor", description: "Parallel resistor", image_url: "/circuits/default_b.svg" },
          { id: "C", label: "Capacitor", description: "Capacitor", image_url: "/circuits/default_c.svg" },
          { id: "D", label: "Inductor", description: "Inductor", image_url: "/circuits/default_d.svg" }
        ]),
        correct_option: "A",
        explanation: "A series diode only allows current to flow in one direction, preventing backwards voltage from damaging sensitive electronics.",
        is_active: true
      }
    ];

    const { error: errQ3 } = await supabase.from('circuit_problems').insert(round3Problems);
    if (errQ3) throw new Error(`Round 3 Error: ${errQ3.message}`);
    console.log(`✅ Inserted ${round3Problems.length} Round 3 circuit problems.`);

    // ---------------------------------------------------------
    // 4. ROUND 4: AI RECONSTRUCTION
    // ---------------------------------------------------------
    console.log('🖼️  Seeding Round 4 - AI Reconstruction...');
    const round4Image = {
      title: "Cyberpunk Cityscape",
      image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800", // Fallback placeholder visual, text is evaluated via api
      prompt_hidden: "A futuristic neon cyberpunk city at night, purple and blue lights, rain reflections, ultra detailed digital art",
      similarity_threshold: 0.80,
      is_active: true
    };

    const { error: errQ4 } = await supabase.from('image_round').insert(round4Image);
    if (errQ4) throw new Error(`Round 4 Error: ${errQ4.message}`);
    console.log(`✅ Inserted 1 Round 4 AI Reconstruction prompt.`);

    // ---------------------------------------------------------
    // 5. ROUND 5: MORSE CODE PUZZLE
    // ---------------------------------------------------------
    console.log('📻 Seeding Round 5 - Morse Code Data...');
    const round5MorseWords = [
      { audio_url: "/audio/morse/sos.mp3", word: "SOS", morse_code: "... --- ...", is_final_key: false, sort_order: 1 },
      { audio_url: "/audio/morse/ai.mp3", word: "AI", morse_code: ".- ..", is_final_key: false, sort_order: 2 },
      { audio_url: "/audio/morse/make.mp3", word: "MAKE", morse_code: "-- .- -.- .", is_final_key: false, sort_order: 3 },
      { audio_url: "/audio/morse/makeai.mp3", word: "MAKEAI", morse_code: "-- .- -.- . .- ..", is_final_key: true, sort_order: 4 }
    ];

    const { error: errQ5 } = await supabase.from('morse_data').insert(round5MorseWords);
    if (errQ5) throw new Error(`Round 5 Error: ${errQ5.message}`);
    console.log(`✅ Inserted ${round5MorseWords.length} Round 5 Morse Code chunks.`);

    // ---------------------------------------------------------
    // 6. LEADERBOARD / TEAMS DATA
    // ---------------------------------------------------------
    console.log('👥 Seeding Leaderboard Teams...');
    const testTeams = [
      { team_name: "Team Alpha", email: "alpha@test.com", status: "completed", current_round: 5, total_time: 1500 },
      { team_name: "Team Quantum", email: "quantum@test.com", status: "completed", current_round: 5, total_time: 2100 },
      { team_name: "Team ByteForce", email: "byteforce@test.com", status: "active", current_round: 3, total_time: 0 },
      { team_name: "Team CircuitBreakers", email: "circuit@test.com", status: "active", current_round: 4, total_time: 0 },
      { team_name: "Team NeuralNinjas", email: "neural@test.com", status: "active", current_round: 2, total_time: 0 }
    ];

    const { error: errTeamsFinal } = await supabase.from('teams').insert(testTeams);
    if (errTeamsFinal) throw new Error(`Teams Seeding Error: ${errTeamsFinal.message}`);
    console.log(`✅ Inserted ${testTeams.length} test teams for leaderboard.`);

    console.log('\n🎉 ALL SEEDING COMPLETED SUCCESSFULLY! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ SEEDING FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

seedCompetitionData();
