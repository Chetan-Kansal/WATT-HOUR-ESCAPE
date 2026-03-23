export interface ReactorPuzzle {
    id: number;
    coreNumber: number;
    title: string;
    type: 'debug' | 'logic_gate' | 'binary' | 'anagram' | 'cipher' | 'base_convert' | 'sequence';
    description: string;
    displayData: string;
    hint?: string;
    choices?: string[];
    correctAnswer: string;
    warning?: string; // High-stakes warning text
}

export const ROUND2_PROBLEMS: ReactorPuzzle[] = [
    {
        id: 0,
        coreNumber: 1,
        title: "The Pizza Apocalypse",
        type: 'debug',
        description: "The automated pizzeria's AI is stuck in a deep recursion loop! It's generating topping combinations at an industrial scale. Identify the line number (1-10) where the recursive call fails to decrement, causing the infinite pepperoni surge.",
        displayData: "1: def serve_pizza(orders, batch_id):\n2:     if not orders:\n3:         return \"BATCH_COMPLETE\"\n4:     \n5:     current = orders[0]\n6:     print(f\"Processing {current} for {batch_id}\")\n7:     \n8:     # The recursion should move to the next order\n9:     # but something is stuck...\n10:    return serve_pizza(orders, batch_id)",
        hint: "The function calls itself with the exact same 'orders' list every time. It never reaches the empty list base case.",
        correctAnswer: "10",
        warning: "ALERT: PIZZA_OVERFLOW_DETECTED"
    },
    {
        id: 1,
        coreNumber: 2,
        title: "The Mars Rover Orbit Bug",
        type: 'debug',
        description: "The Mars Rover was supposed to enter a stable orbit, but it's spiraling into the sun because of a sign error in its thruster logic. Identify the variable name that should be 'POSITIVE' but is currently being subtracted.",
        displayData: "def adjust_orbit(velocity, gravity_constant):\n    # Thrust should counteract gravity\n    # to maintain stable altitude\n    orbital_push = velocity * 0.5\n    \n    # ERROR: This should be ADDED to thrust\n    trajectory = gravity_constant - orbital_push\n    \n    return trajectory",
        hint: "To stay in orbit, you need to add thrust to overcome the gravity constant, not subtract it from the constants.",
        correctAnswer: "orbital_push",
        warning: "CRITICAL: ROVER_SPIRAL_INITIATED"
    },
    {
        id: 2,
        coreNumber: 3,
        title: "The Coffee Machine Ghost",
        type: 'debug',
        description: "The office coffee machine says it's 100°C, but the water is ice cold. A local variable is 'shadowing' the real heater value. What is the actual temperature the internal heater sees?",
        displayData: "temp = 0\ndef heat_up():\n    temp = 100\nheat_up()",
        hint: "Python creates a new local variable 'temp' inside the function instead of updating the global one.",
        correctAnswer: "0",
        warning: "WARNING: CAFFEINE_LEVELS_ZERO"
    },
    {
        id: 3,
        coreNumber: 4,
        title: "The 404-Year-Old Intern",
        type: 'debug',
        description: "HR's database just gave an intern a '500-Year Loyal Service' award. An array index overflow is accessing random memory addresses. Which part of the code is reaching past the intern's actual years of service?",
        displayData: "for (i=0; i < years.length; i++) {\n    total += years[i+1];\n}",
        hint: "When i = length-1, i+1 is out of bounds.",
        correctAnswer: "i+1",
        warning: "NOTICE: INTERN_AGE_PHYSICS_BREACH"
    },
    {
        id: 4,
        coreNumber: 5,
        title: "The Vacuum Jailbreak",
        type: 'debug',
        description: "Your robot vacuum thinks the wall is a 'Power-Up' and is trying to drive through it. Operator precedence is making it ignore the 'WALL_MASK'. What two characters are missing to fix the bitwise check?",
        displayData: "if (status & WALL_MASK == WALL_MASK) { ... }",
        hint: "The == operator triggers before &. You need to wrap the bitwise operation in a specific pair of characters.",
        correctAnswer: "()",
        warning: "SYSTEM: VACUUM_WALL_MERGE_INITIATED"
    }
];
