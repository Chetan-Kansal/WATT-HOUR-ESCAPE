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
        question: "What is the 'Ferranti Effect' in power systems?",
        option_a: "Voltage decrease at receiving end", option_b: "Voltage rise at receiving end under light load", option_c: "Frequency instability", option_d: "Transformer core saturation",
        correct_option: "B", category: "energy_systems", difficulty: "hard"
      },
      {
        question: "The 'Duck Curve' in solar management refers to:",
        option_a: "Panel tilt angle", option_b: "Net load imbalance during sunset", option_c: "Efficiency of thin-film cells", option_d: "Grid frequency oscillations",
        correct_option: "B", category: "energy_systems", difficulty: "hard"
      },
      {
        question: "In a Delta connection, what is the relation between Line and Phase voltage?",
        option_a: "VL = VP", option_b: "VL = √3 * VP", option_c: "VL = VP / √3", option_d: "VL = 3 * VP",
        correct_option: "A", category: "energy_systems", difficulty: "hard"
      },
      {
        question: "Which guarantee is NOT part of the CAP theorem?",
        option_a: "Consistency", option_b: "Availability", option_c: "Partition Tolerance", option_d: "Durability",
        correct_option: "D", category: "cs_fundamentals", difficulty: "hard"
      },
      {
        question: "What is the purpose of heartbeats in Raft consensus?",
        option_a: "Clock sync", option_b: "Maintain leadership authority", option_c: "Memory cleanup", option_d: "User auth",
        correct_option: "B", category: "cs_fundamentals", difficulty: "hard"
      },
      {
        question: "Which data structure implements a Priority Queue in O(log n)?",
        option_a: "Linked List", option_b: "Binary Heap", option_c: "Hash Map", option_d: "Stack",
        correct_option: "B", category: "programming", difficulty: "medium"
      },
      {
        question: "Time complexity to build a heap from n elements?",
        option_a: "O(log n)", option_b: "O(n)", option_c: "O(n log n)", option_d: "O(n²)",
        correct_option: "B", category: "programming", difficulty: "hard"
      },
      {
        question: "A sound logical system ensures that:",
        option_a: "All provable statements are true", option_b: "All true statements are provable", option_c: "The system is complete", option_d: "No axioms are redundant",
        correct_option: "A", category: "logic", difficulty: "hard"
      },
      {
        question: "What is the minimum weighings to find 1 heavy coin out of 8?",
        option_a: "1", option_b: "2", option_c: "3", option_d: "4",
        correct_option: "B", category: "logic", difficulty: "hard"
      },
      {
        question: "Which is a non-linear load causing harmonics?",
        option_a: "Incandescent bulb", option_b: "VFD (Variable Frequency Drive)", option_c: "Heater", option_d: "Transformer",
        correct_option: "B", category: "energy_systems", difficulty: "hard"
      },
      {
        question: "The average time complexity of Merge Sort is:",
        option_a: "O(n)", option_b: "O(n log n)", option_c: "O(n²)", option_d: "O(log n)",
        correct_option: "B", category: "programming", difficulty: "medium"
      },
      {
        question: "Which layer of OSI model handles IP addressing?",
        option_a: "Data Link", option_b: "Network", option_c: "Transport", option_d: "Session",
        correct_option: "B", category: "cs_fundamentals", difficulty: "medium"
      },
      {
        question: "What does ACID stand for in databases?",
        option_a: "Atomicity, Consistency, Isolation, Durability", option_b: "Array, Collection, Index, Data", option_c: "Access, Control, Integration, Distribution", option_d: "Auto, Create, Insert, Delete",
        correct_option: "A", category: "cs_fundamentals", difficulty: "easy"
      },
      {
        question: "In Python, which keyword creates a generator?",
        option_a: "return", option_b: "yield", option_c: "break", option_d: "next",
        correct_option: "B", category: "programming", difficulty: "medium"
      },
      {
        question: "What is the binary value of decimal 13?",
        option_a: "1100", option_b: "1101", option_c: "1011", option_d: "1111",
        correct_option: "B", category: "logic", difficulty: "easy"
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
