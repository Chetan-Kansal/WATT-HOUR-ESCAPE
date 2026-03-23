export interface DebugProblem {
    id: number;
    title: string;
    description: string;
    brokenCode: {
        python: string;
        javascript: string;
    };
    expectedBehavior: string;
    input: string;
    expectedOutput: string;
    pythonFunction: string;
    jsFunction: string;
}

export const ROUND2_PROBLEMS: DebugProblem[] = [
    {
        id: 0,
        title: "E-Commerce Checkout System",
        description: "This function calculates the final total for a shopping cart. It should sum all item prices, and if the total is $100 or more, apply a 10% discount. Finally, if the total is under $50, it adds a $5 shipping fee.",
        brokenCode: {
            python: `def calculate_checkout_total(prices):\n    total = 0\n    for p in prices:\n        total += p\n    \n    # Apply 10% discount for orders over $100\n    if total >= 100:\n        discount = total * 0.1\n        total = total - discount\n    \n    # Add shipping fee for small orders\n    if total < 50:\n        total = total - 5 # BUG: Subtracting shipping fee instead of adding\n    \n    return total`,
            javascript: `function calculateCheckoutTotal(prices) {\n    let total = 0;\n    for (let p of prices) {\n        total += p;\n    }\n    \n    // Apply 10% discount for orders over $100\n    if (total >= 100) {\n        let discount = total * 0.1;\n        total = total - discount;\n    }\n    \n    // Add shipping fee for small orders\n    if (total < 50) {\n        total = total - 5; // BUG: Subtracting shipping fee instead of adding\n    }\n    \n    return total;\n}`
        },
        expectedBehavior: "For prices=[20, 10], total is 30. With $5 shipping, result should be 35.",
        input: "[20, 10]",
        expectedOutput: "35",
        pythonFunction: "calculate_checkout_total",
        jsFunction: "calculateCheckoutTotal"
    },
    {
        id: 1,
        title: "User Profile Health Check",
        description: "Validate a user profile. A profile is valid if the username is at least 3 characters long and the email ends with '@example.com'.",
        brokenCode: {
            python: `def validate_profile(username, email):\n    # Check username length\n    is_name_valid = len(username) >= 3\n    \n    # Check email domain\n    is_email_valid = email.endswith("@example.com")\n    \n    # Final validation\n    if is_name_valid:\n        if is_email_valid:\n            return False # BUG: Returning False for a valid profile\n    \n    return False`,
            javascript: `function validateProfile(username, email) {\n    // Check username length\n    let isNameValid = username.length >= 3;\n    \n    // Check email domain\n    let isEmailValid = email.endsWith("@example.com");\n    \n    // Final validation\n    if (isNameValid) {\n        if (isEmailValid) {\n            return false; // BUG: Returning false for a valid profile\n        }\n    }\n    \n    return false;\n}`
        },
        expectedBehavior: "For 'Admin' and 'test@example.com', it should return 'True' (or true).",
        input: "'Admin', 'test@example.com'",
        expectedOutput: "True",
        pythonFunction: "validate_profile",
        jsFunction: "validateProfile"
    },
    {
        id: 2,
        title: "Student Performance Summary",
        description: "Calculate the average of a list of grades. If the average is 50 or above, return 'Pass'. Otherwise, return 'Fail'.",
        brokenCode: {
            python: `def summarize_performance(grades):\n    if not grades:\n        return "Fail"\n    \n    total_sum = 0\n    for score in grades:\n        total_sum += score\n    \n    average = total_sum / len(grades)\n    \n    # Check passing threshold\n    if average > 50: # BUG: Needs to be >= 50 to pass\n        return "Pass"\n    else:\n        return "Fail"`,
            javascript: `function summarizePerformance(grades) {\n    if (grades.length === 0) return "Fail";\n    \n    let totalSum = 0;\n    for (let score of grades) {\n        totalSum += score;\n    }\n    \n    let average = totalSum / grades.length;\n    \n    // Check passing threshold\n    if (average > 50) { // BUG: Needs to be >= 50 to pass\n        return "Pass";\n    } else {\n        return "Fail";\n    }\n}`
        },
        expectedBehavior: "For grades=[50, 50, 50], average is 50, so the result should be 'Pass'.",
        input: "[50, 50, 50]",
        expectedOutput: "Pass",
        pythonFunction: "summarize_performance",
        jsFunction: "summarizePerformance"
    },
    {
        id: 3,
        title: "Smart Inventory Alert",
        description: "An inventory system alerts us if we need to restock. We restock if an item is 'active' AND the quantity is 5 or less.",
        brokenCode: {
            python: `def should_restock(status, quantity):\n    is_active = status == "active"\n    \n    # Return True if we should restock\n    if is_active:\n        if quantity >= 5: # BUG: Should be <= 5\n            return True\n    \n    return False`,
            javascript: `function shouldRestock(status, quantity) {\n    let isActive = (status === "active");\n    \n    // Return true if we should restock\n    if (isActive) {\n        if (quantity >= 5) { // BUG: Should be <= 5\n            return true;\n        }\n    }\n    \n    return false;\n}`
        },
        expectedBehavior: "For status='active' and quantity=3, it should return 'True' (or true).",
        input: "'active', 3",
        expectedOutput: "True",
        pythonFunction: "should_restock",
        jsFunction: "shouldRestock"
    }
];
