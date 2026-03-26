export const MORSE_MAP: Record<string, string> = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': ' '
};

export const ROUND5_SIGNALS = [
    { id: 'ALPHA', word: 'GDGMINDSCAPE', label: 'INTERCEPT_ALPHA' },
    { id: 'BETA', word: 'MORSECODED', label: 'INTERCEPT_BETA' }, // CORRECT ONE
    { id: 'GAMMA', word: 'IEEEXGOOGLE', label: 'INTERCEPT_GAMMA' }
];

export const ROUND5_CORRECT_KEY = 'MORSECODED';
