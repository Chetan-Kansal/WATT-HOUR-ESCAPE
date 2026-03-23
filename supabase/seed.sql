-- ============================================================
-- SEED DATA — GDG × IEEE PES Competition Platform
-- ============================================================

-- ============================================================
-- QUIZ QUESTIONS (Round 1) — 35 questions
-- ============================================================
INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, category, difficulty) VALUES

-- Programming
('What does the "git stash" command do?',
 'Deletes uncommitted changes permanently',
 'Temporarily shelves changes so you can work on something else',
 'Commits all staged changes',
 'Merges two branches together',
 'B', 'programming', 'easy'),

('What is the time complexity of binary search on a sorted array of n elements?',
 'O(n)', 'O(log n)', 'O(n²)', 'O(1)',
 'B', 'programming', 'easy'),

('Which data structure uses LIFO (Last In, First Out) ordering?',
 'Queue', 'Linked List', 'Stack', 'Binary Tree',
 'C', 'programming', 'easy'),

('What does REST stand for in web development?',
 'Rapid Execution State Transfer',
 'Representational State Transfer',
 'Remote Execution Service Technology',
 'Resource Endpoint State Transfer',
 'B', 'programming', 'easy'),

('Which sorting algorithm has an average time complexity of O(n log n)?',
 'Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort',
 'C', 'programming', 'medium'),

('What is the purpose of a hash function in a hash table?',
 'Sort elements in order',
 'Map keys to array indices',
 'Encrypt stored data',
 'Balance the tree structure',
 'B', 'programming', 'medium'),

('In Python, what does the "yield" keyword do?',
 'Returns a value like "return" but immediately exits the function',
 'Pauses execution and produces a value, making the function a generator',
 'Imports a module into the current scope',
 'Creates a new thread',
 'B', 'programming', 'medium'),

('What is the output of: print(type([])) in Python?',
 '<class list>',
 '<class array>',
 '<class tuple>',
 'list_type',
 'A', 'programming', 'easy'),

('What is a deadlock in operating systems?',
 'When CPU usage reaches 100%',
 'When two or more processes wait indefinitely for each other to release resources',
 'When a process terminates unexpectedly',
 'When memory is fully utilized',
 'B', 'programming', 'medium'),

('Which HTTP status code indicates "Not Found"?',
 '200', '301', '404', '500',
 'C', 'programming', 'easy'),

-- CS Fundamentals
('What is the primary function of the Transmission Control Protocol (TCP)?',
 'Route packets between different networks',
 'Provide reliable, ordered delivery of data streams',
 'Assign IP addresses to devices',
 'Encrypt data during transit',
 'B', 'cs_fundamentals', 'medium'),

('What does DNS stand for?',
 'Dynamic Network Service',
 'Data Network System',
 'Domain Name System',
 'Distributed Node Server',
 'C', 'cs_fundamentals', 'easy'),

('In computer architecture, what is a cache miss?',
 'When a cache memory unit fails completely',
 'When requested data is not found in the cache and must be fetched from RAM',
 'When encryption fails during memory access',
 'When the CPU executes an invalid instruction',
 'B', 'cs_fundamentals', 'medium'),

('What is the difference between process and thread?',
 'They are identical — just different terms',
 'A process is a thread with higher priority',
 'A process has its own memory space; threads share memory within a process',
 'A thread can run on multiple CPUs simultaneously',
 'C', 'cs_fundamentals', 'medium'),

('Which layer of the OSI model handles IP addressing?',
 'Data Link Layer',
 'Network Layer',
 'Transport Layer',
 'Session Layer',
 'B', 'cs_fundamentals', 'medium'),

('What is a race condition?',
 'A performance benchmark test',
 'Two processes competing for CPU scheduling',
 'A bug caused by output depending on the unpredictable sequence of concurrent operations',
 'A memory leak in multi-threaded programs',
 'C', 'cs_fundamentals', 'hard'),

('What does ACID stand for in database systems?',
 'Array, Collection, Index, Data',
 'Atomicity, Consistency, Isolation, Durability',
 'Authentication, Caching, Integration, Distribution',
 'Aggregation, Compression, Indexing, Deduplication',
 'B', 'cs_fundamentals', 'medium'),

('What is virtual memory?',
 'Memory stored in the cloud',
 'Additional RAM added by the OS automatically',
 'A technique where secondary storage is used as an extension of RAM',
 'A memory allocation technique that avoids fragmentation',
 'C', 'cs_fundamentals', 'medium'),

-- Energy Systems
('What is the unit of electrical power?',
 'Joule', 'Volt', 'Watt', 'Ohm',
 'C', 'energy_systems', 'easy'),

('Which renewable energy source has the highest global installed capacity?',
 'Solar PV', 'Wind', 'Hydropower', 'Geothermal',
 'C', 'energy_systems', 'medium'),

('What is the purpose of an LDR (Light Dependent Resistor)?',
 'Store energy in a magnetic field',
 'Vary resistance based on light intensity',
 'Convert AC to DC power',
 'Measure temperature changes',
 'B', 'energy_systems', 'easy'),

('In a solar panel system, what does the MPPT controller do?',
 'Converts AC power to DC',
 'Stores excess solar energy',
 'Maximizes power output by tracking the ideal operating point',
 'Regulates current for battery charging only',
 'C', 'energy_systems', 'hard'),

('What is the typical frequency of AC power in India?',
 '50 Hz', '60 Hz', '40 Hz', '100 Hz',
 'A', 'energy_systems', 'easy'),

('What does NPN stand for in transistor terminology?',
 'Negative-Positive-Negative',
 'Neutral-Positive-Neutral',
 'Not-Pass-Network',
 'Node-Pulse-Node',
 'A', 'energy_systems', 'medium'),

('What is the function of a diode in an electrical circuit?',
 'Amplify signal strength',
 'Store electrical charge',
 'Allow current to flow in one direction only',
 'Regulate voltage output',
 'C', 'energy_systems', 'easy'),

('What is Kirchhoff''s Current Law (KCL)?',
 'The voltage across parallel branches is equal',
 'The sum of currents entering a node equals the sum of currents leaving it',
 'Power dissipated equals voltage times resistance',
 'Current is directly proportional to resistance',
 'B', 'energy_systems', 'medium'),

('Smart grids primarily differ from traditional grids by:',
 'Using exclusively renewable energy sources',
 'Operating at higher voltages',
 'Enabling bidirectional communication and energy flow',
 'Eliminating the need for transformers',
 'C', 'energy_systems', 'hard'),

('What is the Betz limit in wind turbine theory?',
 'Maximum structural load a turbine blade can handle',
 'The theoretical maximum efficiency (≈59.3%) a wind turbine can achieve',
 'Minimum wind speed required for turbine operation',
 'Maximum voltage output of a wind generator',
 'B', 'energy_systems', 'hard'),

-- Logic
('If all roses are flowers and some flowers fade quickly, which is definitely true?',
 'All roses fade quickly',
 'Some roses fade quickly',
 'Roses are not flowers',
 'We cannot conclude anything about roses fading',
 'D', 'logic', 'medium'),

('A train travels from A to B at 60 km/h and returns at 40 km/h. What is the average speed?',
 '50 km/h', '48 km/h', '52 km/h', '45 km/h',
 'B', 'logic', 'hard'),

('What is the next number in the series: 2, 6, 12, 20, 30, ?',
 '40', '42', '44', '36',
 'B', 'logic', 'medium'),

('In binary, what is the decimal value of 1101?',
 '11', '13', '15', '12',
 'B', 'logic', 'easy'),

('A clock shows 3:15. What is the angle between the hour and minute hands?',
 '0°', '7.5°', '15°', '22.5°',
 'B', 'logic', 'hard'),

('If P → Q is true and Q is false, what must be true?',
 'P is true', 'P is false', 'P could be either true or false', 'Q implies P',
 'B', 'logic', 'hard'),

('You have two buckets: 3L and 5L. How do you measure exactly 4 litres of water?',
 'Fill 5L, pour into 3L, empty 3L, pour remaining 2L into 3L, fill 5L again, pour into 3L until full — 4L remains in 5L',
 'Fill 3L twice and combine',
 'Fill 5L and remove 1L',
 'It is impossible with these capacities',
 'A', 'logic', 'medium'),

-- NEW HARDENED QUESTIONS
('What is the "Ferranti Effect" in power systems?',
 'The decrease in voltage at the receiving end of a long transmission line',
 'The rise in voltage at the receiving end of a long transmission line under no-load or light-load conditions',
 'The loss of synchronization between generators',
 'The failure of a circuit breaker to trip during a fault',
 'B', 'energy_systems', 'hard'),

('The "Duck Curve" in solar energy management describes:',
 'The physical shape of a solar panel array',
 'The timing imbalance between peak demand and solar energy production',
 'The migration patterns of birds near solar farms',
 'The efficiency drop of solar cells at high temperatures',
 'B', 'energy_systems', 'hard'),

('In a 3-phase system, what is the relation between Line Voltage (VL) and Phase Voltage (VP) in a Delta connection?',
 'VL = VP',
 'VL = √3 * VP',
 'VL = VP / √3',
 'VL = 3 * VP',
 'A', 'energy_systems', 'hard'),

('What is the primary purpose of a "Synchronous Condenser" in a power grid?',
 'To store large amounts of electrical energy',
 'To provide reactive power support and stabilize voltage',
 'To convert DC power from solar farms to AC',
 'To measure the frequency of the grid with high precision',
 'B', 'energy_systems', 'hard'),

('Which phenomenon describes the tendency of alternating current to become distributed within a conductor such that the current density is largest near the surface?',
 'Corona Effect',
 'Skin Effect',
 'Proximity Effect',
 'Hall Effect',
 'B', 'energy_systems', 'medium'),

('The CAP theorem states that a distributed data store cannot simultaneously provide more than two out of which three guarantees?',
 'Cashing, Availability, Partitioning',
 'Consistency, Availability, Partition Tolerance',
 'Concurrency, Accuracy, Persistence',
 'Complexity, Availability, Portability',
 'B', 'cs_fundamentals', 'hard'),

('In the context of the Raft consensus algorithm, what is the purpose of "Heartbeats"?',
 'To synchronize the clocks of all nodes in the cluster',
 'For the leader to maintain authority and prevent new elections',
 'To transfer log entries to follower nodes',
 'To check the hardware health of the servers',
 'B', 'cs_fundamentals', 'hard'),

('What is the "Byzantine Generals Problem" primarily concerned with?',
 'Optimizing network routing algorithms',
 'Achieving consensus in a system where components may fail and provide conflicting information',
 'Protecting against SQL injection attacks',
 'Reducing the latency of database queries',
 'B', 'cs_fundamentals', 'hard'),

('Which data structure is most commonly used to implement a Priority Queue to achieve O(log n) insertion and deletion?',
 'Sorted Linked List',
 'Balanced Binary Search Tree',
 'Binary Heap',
 'Hash Table',
 'C', 'cs_fundamentals', 'medium'),

('What is the time complexity of building a heap from an unordered array of n elements?',
 'O(log n)',
 'O(n)',
 'O(n log n)',
 'O(n²)',
 'B', 'cs_fundamentals', 'hard'),

('If a logical system is "Sound", what does that imply?',
 'Every provable statement is true',
 'Every true statement is provable',
 'The system contains no contradictions',
 'The system can represent any mathematical concept',
 'A', 'logic', 'hard'),

('Five people are standing in a row. A is next to B but not next to C. If C is next to D and D is next to E, who is definitely not in the middle?',
 'A', 'B', 'C', 'E',
 'D', 'logic', 'hard'),

('In a set of 8 identical-looking coins, one is slightly heavier. What is the minimum number of weighings on a balance scale to find the heavy coin?',
 '2', '3', '4', '1',
 'A', 'logic', 'hard'),

('Which of these is a non-linear load that typically introduces harmonics into a power system?',
 'Incandescent light bulb',
 'Electric heater',
 'Variable Frequency Drive (VFD)',
 'Induction motor running at constant speed',
 'C', 'energy_systems', 'hard'),

('What is "Shadow Price" in the context of economic dispatch in power systems?',
 'The cost of fuel for the most expensive generator',
 'The change in total system cost for a unit change in load at a specific bus',
 'The hidden environmental cost of coal power',
 'The price of electricity in the black market',
 'B', 'energy_systems', 'hard');

-- ============================================================
-- DEBUG PROBLEMS (Round 2) — 3 problems
-- ============================================================
INSERT INTO debug_problems (title, problem_text, code_snippet, language, expected_output, test_cases, judge0_language_id) VALUES

('Fibonacci Sum Bug',
 'The function below is supposed to compute the sum of the first N Fibonacci numbers. However, it produces incorrect results. Find and fix the bug.',
 'def fibonacci_sum(n):
    if n <= 0:
        return 0
    a, b = 0, 1
    total = 0
    for i in range(n):
        total += a
        a, b = b, a + b  # BUG: should be a, b = b, a + b AFTER adding
    return total

# Test
print(fibonacci_sum(5))  # Expected: 7 (0+1+1+2+3)
print(fibonacci_sum(1))  # Expected: 0
print(fibonacci_sum(6))  # Expected: 12 (0+1+1+2+3+5)',
 'python',
 '7
0
12',
 '[{"input": "fibonacci_sum(5)", "expected": "7"}, {"input": "fibonacci_sum(1)", "expected": "0"}, {"input": "fibonacci_sum(6)", "expected": "12"}]',
 71),

('Palindrome Check Error',
 'The function should check if a string is a palindrome (ignoring spaces and case). The current implementation has a logic error. Fix it to produce the correct output.',
 'def is_palindrome(s):
    cleaned = s.replace(" ", "").lower()
    n = len(cleaned)
    for i in range(n // 2):
        if cleaned[i] != cleaned[n - i]:  # BUG: off-by-one error
            return False
    return True

print(is_palindrome("racecar"))    # Expected: True
print(is_palindrome("hello"))      # Expected: False
print(is_palindrome("A man a plan a canal Panama"))  # Expected: True',
 'python',
 'True
False
True',
 '[{"input":"is_palindrome(\"racecar\")", "expected":"True"}, {"input":"is_palindrome(\"hello\")", "expected":"False"}]',
 71),

('Binary Search Off-By-One',
 'The binary search below should find the index of a target element in a sorted list and return -1 if not found. It has a classic off-by-one bug causing infinite loops or wrong results. Fix it.',
 'def binary_search(arr, target):
    left, right = 0, len(arr)  # BUG: should be len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

nums = [1, 3, 5, 7, 9, 11, 13]
print(binary_search(nums, 7))   # Expected: 3
print(binary_search(nums, 1))   # Expected: 0
print(binary_search(nums, 10))  # Expected: -1',
 'python',
 '3
0
-1',
 '[{"input":"binary_search([1,3,5,7,9,11,13], 7)", "expected":"3"}, {"input":"binary_search([1,3,5,7,9,11,13], 10)", "expected":"-1"}]',
 71);

-- ============================================================
-- CIRCUIT PROBLEMS (Round 3) — 4 problems
-- ============================================================
INSERT INTO circuit_problems (title, problem, diagram_options, correct_option, explanation) VALUES

('Automatic Street Light',
 'Design a circuit for an automatic street light that turns ON when it is dark and turns OFF when there is sufficient natural light. The circuit should use an LDR (Light Dependent Resistor) as the sensor and an NPN transistor as the switch.',
 '[
   {"id": "A", "label": "LDR in series with LED, direct connection", "description": "Simple series circuit — LDR directly controls LED brightness, no transistor switching", "image_url": "/circuits/ldr_a.svg"},
   {"id": "B", "label": "LDR voltage divider driving NPN transistor base", "description": "LDR and fixed resistor form a voltage divider; output drives NPN base — LED in collector circuit turns ON in darkness", "image_url": "/circuits/ldr_b.svg"},
   {"id": "C", "label": "LDR in parallel with relay coil", "description": "LDR placed in parallel with relay, activating when resistance drops in bright light", "image_url": "/circuits/ldr_c.svg"},
   {"id": "D", "label": "LDR directly powers motor to open/close shutter", "description": "Mechanical shutter system — no electronic switching", "image_url": "/circuits/ldr_d.svg"}
 ]',
 'B',
 'Option B is correct. The LDR and a fixed resistor form a voltage divider. In darkness, LDR resistance is high, creating a lower voltage at the midpoint — insufficient to turn on the NPN transistor. In light conditions, LDR resistance drops, increasing the midpoint voltage and switching the transistor ON (which would turn ON a relay or LED). By inverting the logic, the LED turns ON in darkness. This is the classic light-sensitive switch design used in street lighting systems.'),

('Motor Direction Control',
 'An engineer needs to control a DC motor so it can rotate in BOTH directions (forward and reverse) for an automated solar panel tracker. Which circuit topology achieves this?',
 '[
   {"id": "A", "label": "Single NPN transistor switch", "description": "One transistor allows current flow in one direction only — motor runs forward, no reverse", "image_url": "/circuits/motor_a.svg"},
   {"id": "B", "label": "H-Bridge with 4 transistors", "description": "Two pairs of transistors arranged in H configuration — alternating pairs allow bidirectional current flow through motor", "image_url": "/circuits/motor_b.svg"},
   {"id": "C", "label": "Voltage divider network", "description": "Resistor network to split voltage — only controls speed, not direction", "image_url": "/circuits/motor_c.svg"},
   {"id": "D", "label": "Full-wave bridge rectifier", "description": "Converts AC to DC — not suitable for direction control", "image_url": "/circuits/motor_d.svg"}
 ]',
 'B',
 'Option B is correct. An H-Bridge circuit uses 4 transistors (or MOSFETs) arranged so that two diagonal transistors conduct simultaneously. Pair 1 ON: current flows forward through motor. Pair 2 ON: current flows in reverse. Never turn all 4 ON simultaneously (short circuit). H-Bridges are used in robotics, EVs, and solar trackers for bidirectional motor control.'),

('Solar Battery Charge Controller',
 'A solar battery charge controller must prevent overcharging of a 12V lead-acid battery. When battery voltage reaches 14.4V, charging must stop automatically. Select the correct control mechanism.',
 '[
   {"id": "A", "label": "Zener diode voltage clamp at 14.4V", "description": "Zener diode breaks down at 14.4V, shunting excess current to ground, regulating charge voltage", "image_url": "/circuits/solar_a.svg"},
   {"id": "B", "label": "Simple fuse between solar panel and battery", "description": "Fuse only protects against overcurrent, not overvoltage charging", "image_url": "/circuits/solar_b.svg"},
   {"id": "C", "label": "Voltage comparator driving MOSFET cutoff switch", "description": "Op-amp compares battery voltage with 14.4V reference; when exceeded, comparator output switches MOSFET OFF, cutting charge path", "image_url": "/circuits/solar_c.svg"},
   {"id": "D", "label": "LED indicator only circuit", "description": "Only provides visual warning, does not interrupt charging", "image_url": "/circuits/solar_d.svg"}
 ]',
 'C',
 'Option C is correct. A voltage comparator (e.g., LM393) continuously compares battery terminal voltage with a precision 14.4V reference (set by a voltage divider or Zener). When battery voltage exceeds the threshold, the comparator''s output reverses, turning OFF a MOSFET (or relay) in the charge path. Charging stops until voltage drops. This is the principle behind real MPPT and PWM solar charge controllers used in renewable energy installations.'),

('Overcurrent Protection',
 'An IEEE PES engineer needs to protect a sensitive load from overcurrent damage. When current exceeds 2A, the circuit should automatically disconnect the load. Which implementation is most appropriate?',
 '[
   {"id": "A", "label": "Shunt resistor + comparator + relay", "description": "Small shunt resistor measures current via voltage drop; comparator triggers relay to disconnect load when threshold crossed", "image_url": "/circuits/ocp_a.svg"},
   {"id": "B", "label": "Capacitor in series with load", "description": "Capacitor limits current at AC frequencies but does not protect against DC overcurrent", "image_url": "/circuits/ocp_b.svg"},
   {"id": "C", "label": "Inductor in parallel with load", "description": "Inductor opposes current changes but cannot disconnect the load", "image_url": "/circuits/ocp_c.svg"},
   {"id": "D", "label": "LED in series as current limiter", "description": "LED forward voltage drops only 2V, not sufficient for load protection", "image_url": "/circuits/ocp_d.svg"}
 ]',
 'A',
 'Option A is correct. A precision shunt resistor (e.g., 0.1Ω) is placed in series with the load. When 2A flows, it drops 0.2V across the shunt. A comparator (e.g., LM393) compares this with a reference voltage. When current exceeds 2A, the comparator fires, triggering a relay that opens the load circuit. This is exactly how electronic circuit breakers and overcurrent protection ICs (like INA219 + relay combinations) work in power systems.');

-- ============================================================
-- IMAGE ROUND (Round 4) — 1 active entry
-- ============================================================
INSERT INTO image_round (title, image_url, prompt_hidden, similarity_threshold) VALUES
('Renewable Energy Future',
 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800',
 'A futuristic cityscape powered entirely by renewable energy, giant wind turbines and solar panels integrated into skyscrapers, glowing green energy grid lines connecting buildings, photorealistic, cinematic lighting, dusk atmosphere',
 0.75);

-- ============================================================
-- MORSE DATA (Round 5) — 12 entries, 1 is the final key
-- ============================================================
INSERT INTO morse_data (audio_url, word, morse_code, is_final_key, sort_order) VALUES
('/audio/morse/photon.mp3', 'PHOTON', '.--. .... --- - --- -.', FALSE, 1),
('/audio/morse/voltage.mp3', 'VOLTAGE', '...- --- .-.. - .- --. .', FALSE, 2),
('/audio/morse/circuit.mp3', 'CIRCUIT', '-.-. .. .-. -.-. ..- .. -', FALSE, 3),
('/audio/morse/quantum.mp3', 'QUANTUM', '--.- ..- .- -. - ..- --', FALSE, 4),
('/audio/morse/fusion.mp3', 'FUSION', '..-. ..- ... .. --- -.', FALSE, 5),
('/audio/morse/neutron.mp3', 'NEUTRON', '-. . ..- - .-. --- -.', FALSE, 6),
('/audio/morse/solaris.mp3', 'SOLARIS', '... --- .-.. .- .-. .. ...', TRUE, 7),
('/audio/morse/plasma.mp3', 'PLASMA', '.--. .-.. .- ... -- .-', FALSE, 8),
('/audio/morse/entropy.mp3', 'ENTROPY', '. -. - .-. --- .--. -.--', FALSE, 9),
('/audio/morse/wattage.mp3', 'WATTAGE', '.-- .- - - .- --. .', FALSE, 10),
('/audio/morse/diode.mp3', 'DIODE', '-.. .. --- -.. .', FALSE, 11),
('/audio/morse/grid.mp3', 'GRID', '--. .-. .. -..', FALSE, 12);
