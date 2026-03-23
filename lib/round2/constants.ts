export interface DebugProblem {
    id: number;
    title: string;
    description: string;
    language: 'python' | 'javascript' | 'cpp';
    code: string;
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
        code: `def calculate_checkout_total(prices):
    total = sum(prices)
    
    # Apply 10% discount for orders over $100
    if total >= 100:
        total = total * 0.9
    
    # Add shipping fee for small orders
    if total < 50:
        total = total - 5 # BUG LINE
    
    return total`,
        buggyLineIndex: 8,
        fixes: [
            "total = total + 5",
            "total = total * 1.05",
            "total = 50",
            "return total + 5"
        ],
        correctFixIndex: 0,
        expectedBehavior: "For total < 50, shipping should be ADDED."
    },
    {
        id: 1,
        title: "User Profile Health Check",
        description: "Validate a profile. It's valid if length >= 3 and email ends with @example.com.",
        language: 'javascript',
        code: `function validateProfile(username, email) {
    const isNameValid = username.length >= 3;
    const isEmailValid = email.endsWith("@example.com");
    
    if (isNameValid && isEmailValid) {
        return false; // BUG LINE
    }
    
    return false;
}`,
        buggyLineIndex: 5,
        fixes: [
            "return true;",
            "return \"VALID\";",
            "return isNameValid;",
            "throw new Error();"
        ],
        correctFixIndex: 0,
        expectedBehavior: "Should return true for valid profiles."
    },
    {
        id: 2,
        title: "Student Performance Summary",
        description: "Calculate average. If 50 or above, return 'Pass'. Otherwise, return 'Fail'.",
        language: 'python',
        code: `def summarize_performance(grades):
    if not grades: return "Fail"
    
    avg = sum(grades) / len(grades)
    
    # Check passing threshold
    if avg > 50: # BUG LINE
        return "Pass"
    
    return "Fail"`,
        buggyLineIndex: 6,
        fixes: [
            "if avg >= 50:",
            "if avg == 50:",
            "if avg > 49:",
            "if avg != 0:"
        ],
        correctFixIndex: 0,
        expectedBehavior: "Average of exactly 50 should be a 'Pass'."
    },
    {
        id: 3,
        title: "Smart Inventory Alert",
        description: "Restock if status is 'active' AND quantity is 5 or less.",
        language: 'javascript',
        code: `function shouldRestock(status, quantity) {
    const isActive = status === 'active';
    
    if (isActive && quantity >= 5) { // BUG LINE
        return true;
    }
    
    return false;
}`,
        buggyLineIndex: 3,
        fixes: [
            "if (isActive && quantity <= 5) {",
            "if (isActive || quantity <= 5) {",
            "if (quantity < 5) {",
            "if (isActive) {"
        ],
        correctFixIndex: 0,
        expectedBehavior: "Quantity of 5 or less should trigger restock."
    }
];
