export interface TerminalProblem {
    id: number;
    title: string;
    description: string;
    language: 'python' | 'javascript' | 'cpp';
    codeSnippet: string; // The code with a blank (e.g., requests.____("url"))
    expectedAnswer: string; // The correct word (e.g., "get")
}

export const ROUND2_PROBLEMS: TerminalProblem[] = [
    {
        id: 0,
        title: "The Secure Payload",
        description: "This Python function fetches data from a secure endpoint, but the request method is missing. Enter the standard method used to retrieve data.",
        language: 'python',
        codeSnippet: `import requests

def fetch_secure_payload():
    url = "https://api.sys-core.local/v1/payload"
    # Initiate secure connection
    response = requests.____(url, timeout=5)
    
    if response.status_code == 200:
        return response.json()
    return None`,
        expectedAnswer: "get"
    },
    {
        id: 1,
        title: "Dynamic Arrays",
        description: "A JavaScript data stream is receiving packets. We need to add the new packet to the END of the processing queue. What array method does this?",
        language: 'javascript',
        codeSnippet: `function queueDataPacket(processingQueue, newPacket) {
    if (!newPacket) return processingQueue;
    
    // Append the packet to the end of the queue
    processingQueue.____(newPacket);
    
    return processingQueue;
}`,
        expectedAnswer: "push"
    },
    {
        id: 2,
        title: "Loop Termination",
        description: "This scanner hunts for an anomaly. Once found, it needs to immediately STOP scanning and exit the loop. What keyword stops a loop?",
        language: 'python',
        codeSnippet: `def scan_for_anomalies(data_stream):
    anomaly_found = False
    for packet in data_stream:
        if is_corrupted(packet):
            anomaly_found = True
            # Halt the scan immediately
            ____
            
    return anomaly_found`,
        expectedAnswer: "break"
    },
    {
        id: 3,
        title: "Strict Equality",
        description: "In JavaScript, we need to compare a status code to the number 200. It must match both VALUE and TYPE exactly. What operator should be used?",
        language: 'javascript',
        codeSnippet: `function verifyStatus(statusCode) {
    // Check if the status code is exactly the number 200
    // not just the string "200"
    if (statusCode ____ 200) {
        return "System Optimal";
    }
    
    return "Error Detected";
}`,
        expectedAnswer: "==="
    },
    {
        id: 4,
        title: "The Pythonic Constructor",
        description: "A Python class representing a NetworkNode is missing the name of its initialization method (the constructor). Fill in the standard magic method name (including underscores).",
        language: 'python',
        codeSnippet: `class NetworkNode:
    # Initialize the node with an IP address
    def ____(self, ip_address):
        self.ip = ip_address
        self.status = "ONLINE"
        self.connections = 0

    def connect(self):
        self.connections += 1`,
        expectedAnswer: "__init__"
    }
];
