export interface DebugProblem {
    id: number;
    title: string;
    description: string;
    language: 'python' | 'javascript' | 'cpp';
    codeLines: string[];
    buggyLineIndex: number; // 0-indexed
    fixes: string[]; // 4 options, one of which is correct
    correctFixIndex: number;
    expectedBehavior: string;
}

export const ROUND2_PROBLEMS: DebugProblem[] = [
    {
        id: 0,
        title: "E-Commerce Checkout System",
        description: "This function sums item prices and adds a $5 shipping fee if the total is under $50. Locate the logic leak.",
        language: 'python',
        codeLines: [
            "def calculate_checkout_total(prices):",
            "    total = sum(prices)",
            "    ",
            "    # Apply 10% discount for orders over $100",
            "    if total >= 100:",
            "        total = total * 0.9",
            "    ",
            "    # Add shipping fee for small orders",
            "    if total < 50:",
            "        total = total - 5",
            "    ",
            "    return total"
        ],
        buggyLineIndex: 9,
        fixes: [
            "total = total + 5",
            "total = total * 1.05",
            "total = 50",
            "return total + 5"
        ],
        correctFixIndex: 0,
        expectedBehavior: "For prices=[20, 10], result should be 35."
    },
    {
        id: 1,
        title: "Access Control Logic",
        description: "This validator should only approve users with a name of 3+ chars AND a specific domain. It's letting too many people in.",
        language: 'javascript',
        codeLines: [
            "function validateProfile(username, email) {",
            "    const isNameValid = username.length >= 3;",
            "    const isEmailValid = email.endsWith(\"@example.com\");",
            "    ",
            "    if (isNameValid && isEmailValid) {",
            "        return false;",
            "    }",
            "    ",
            "    return false;",
            "}"
        ],
        buggyLineIndex: 5,
        fixes: [
            "return true;",
            "return username === email;",
            "return isEmailValid;",
            "throw new Error('Access Denied');"
        ],
        correctFixIndex: 0,
        expectedBehavior: "For valid inputs, should return true. Currently always returns false."
    },
    {
        id: 2,
        title: "Grade Summarizer",
        description: "This script calculates if a student passed. It should require an average strictly GREATER than 50. Currently, 50-score students are failing wrongly.",
        language: 'python',
        codeLines: [
            "def summarize_performance(grades):",
            "    if not grades: return \"Fail\"",
            "    ",
            "    avg = sum(grades) / len(grades)",
            "    ",
            "    # Check passing threshold",
            "    if avg > 50:",
            "        return \"Pass\"",
            "    ",
            "    return \"Fail\""
        ],
        buggyLineIndex: 6,
        fixes: [
            "if avg >= 50:",
            "if avg == 50:",
            "if avg > 49:",
            "return \"Pass\" if avg >= 50 else \"Fail\""
        ],
        correctFixIndex: 0,
        expectedBehavior: "A student with 50 average should receive 'Pass'."
    },
    {
        id: 3,
        title: "Inventory Alert",
        description: "The system should ONLY alert for restocking if the product is 'active' AND quantity is BELOW 5. It's alerting for high stock!",
        language: 'javascript',
        codeLines: [
            "function shouldRestock(status, quantity) {",
            "    const isActive = status === 'active';",
            "    ",
            "    if (isActive && quantity >= 5) {",
            "        return true;",
            "    }",
            "    ",
            "    return false;",
            "}"
        ],
        buggyLineIndex: 3,
        fixes: [
            "if (isActive && quantity < 5) {",
            "if (isActive || quantity < 5) {",
            "if (quantity < 5) {",
            "return quantity < 5;"
        ],
        correctFixIndex: 0,
        expectedBehavior: "For isActive=true, quantity=10, should return false."
    }
];
