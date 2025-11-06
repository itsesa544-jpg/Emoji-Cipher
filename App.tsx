

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { emojiPool, chars } from './constants';
import { themes, Theme } from './themes';

// --- Cipher Logic Utilities ---

// Normalizes emoji strings by removing the invisible variation selector character (U+FE0F).
// This makes emoji matching reliable across different platforms that may handle copy-paste differently.
const normalizeEmoji = (str: string) => str.replace(/\uFE0F/g, '');

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function seededShuffle(arr: string[], seed: number): string[] {
  const a = [...arr];
  let m = a.length;
  const random = mulberry32(seed);
  while (m) {
    const i = Math.floor(random() * m--);
    const t = a[m];
    a[m] = a[i];
    a[i] = t;
  }
  return a;
}

function reverseMap(map: { [key: string]: string }): { [key: string]: string } {
  const rev: { [key: string]: string } = {};
  for (const k in map) {
    // Keys are characters, values are emojis. Normalize the emoji for the reverse map key.
    rev[normalizeEmoji(map[k])] = k;
  }
  return rev;
}

// --- Custom Hook for Theme Management ---

const useTheme = (): [Theme, (theme: Theme) => void] => {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const savedThemeKey = localStorage.getItem('emoji-cipher-theme');
            return themes.find(t => t.key === savedThemeKey) || themes[0];
        } catch {
            return themes[0];
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        document.body.style.background = theme.colors['--bg-gradient-to'];
        try {
            localStorage.setItem('emoji-cipher-theme', theme.key);
        } catch (error) {
            // FIX: The error object from a catch block is of type 'unknown'. Cast to string for type-safe logging.
            console.error("Could not save theme to localStorage:", String(error));
        }
    }, [theme]);

    return [theme, setTheme];
};

// --- Main App Component ---

const App: React.FC = () => {
    const [theme, setTheme] = useTheme();
    const [passphrase, setPassphrase] = useState<string>('');
    const [plainText, setPlainText] = useState<string>('i love you');
    const [encodedText, setEncodedText] = useState<string>('');
    const [copyStatus, setCopyStatus] = useState<string>('');
    const [showMapping, setShowMapping] = useState<boolean>(false);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);

    const mapping = useMemo(() => {
        const seed = passphrase ? stringToSeed(passphrase) : 12345;
        const pool = seededShuffle(emojiPool, seed);
        const map: { [key: string]: string } = {};
        chars.forEach((char, i) => {
            map[char] = pool[i % pool.length];
        });
        return map;
    }, [passphrase]);

    const reversedMapping = useMemo(() => reverseMap(mapping), [mapping]);

    const mappingDisplayText = useMemo(() => {
        return chars.map(ch => {
            const label = ch === ' ' ? '[space]' : ch;
            return `${label} → ${mapping[ch]}`;
        }).join('\n');
    }, [mapping]);

    const handleEncode = useCallback(() => {
        if (!plainText) {
            setEncodedText('');
            return;
        }
        const textToEncode = plainText.toLowerCase();
        const output = [...textToEncode].map(char => mapping[char] || '❓').join('');
        setEncodedText(output);
    }, [plainText, mapping]);

    const handleDecode = useCallback(() => {
        if (!encodedText) {
            setPlainText('');
            return;
        }
        const tokens = [...encodedText];
        // Normalize each emoji token before lookup to ensure consistency across platforms.
        const output = tokens.map(token => reversedMapping[normalizeEmoji(token)] || '?').join('');
        setPlainText(output);
    }, [encodedText, reversedMapping]);
    
    const handleTranslate = useCallback(async () => {
        if (!plainText || isTranslating) return;
        setIsTranslating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // FIX: Refactored to align with Gemini API guidelines.
            // The response object is explicitly typed, and `response.text` is used directly,
            // removing the redundant type check as `response.text` is guaranteed to be a string.
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate the following text into Bengali. Provide only the pure translation, without any additional explanatory text: "${plainText}"`,
            });
            const resultText = response.text;
            setPlainText(resultText);
        } catch (error) {
            // FIX: The error object from a catch block is of type 'unknown'. Cast to string for type-safe logging.
            console.error("Translation failed:", String(error));
            alert("Translation failed. Please check the console for details.");
        } finally {
            setIsTranslating(false);
        }
    }, [plainText, isTranslating]);

    const handleCopyToClipboard = (text: string, type: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus(`${type} copied!`);
            setTimeout(() => setCopyStatus(''), 2000);
        }).catch(() => {
            setCopyStatus(`Failed to copy.`);
            setTimeout(() => setCopyStatus(''), 2000);
        });
    };
    
    const handlePaste = async (setter: React.Dispatch<React.SetStateAction<string>>) => {
        try {
            const text = await navigator.clipboard.readText();
            if (typeof text === 'string') {
                setter(text);
            }
        } catch (error) {
            // FIX: The error object from a catch block is of type 'unknown'. Cast to string for type-safe logging.
            console.error("Paste failed:", String(error));
            alert("Failed to paste from clipboard.");
        }
    };

    const secondaryButtonClass = "bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2.5 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors text-sm";
    const primaryButtonClass = "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-bold py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm";

    return (
        <div className="min-h-screen text-[var(--text-primary)] font-sans flex items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col gap-4">
                {/* Header */}
                <header className="text-center">
                    <h1 className="text-4xl font-bold text-[var(--text-primary)]">Emoji Cipher</h1>
                    <p className="text-lg text-[var(--text-secondary)] mt-1">গোপন কথা বলো ইমোজির ভাষায়</p>
                </header>

                {/* Theme Selector */}
                 <div className="flex justify-center items-center flex-wrap gap-1 bg-[var(--card-gradient-from)] p-1 rounded-full border border-[var(--input-border)]">
                    {themes.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTheme(t)}
                            className={`px-3 py-1.5 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-all ${theme.key === t.key ? 'bg-[var(--accent-from)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <main className="flex flex-col gap-4">
                    {/* Passphrase Box */}
                    <div className="bg-gradient-to-br from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-xl shadow-lg p-5 border border-[var(--input-border)]">
                        <label className="font-semibold text-md mb-2 block text-[var(--text-primary)]">Passphrase (ঐচ্ছিক)</label>
                        <input
                            type="text"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            placeholder="এখানে পাসফ্রেজ দিন"
                            className="w-full p-3 rounded-lg border border-[var(--input-border)] bg-[var(--bg-gradient-to)] text-[var(--text-primary)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]"
                            aria-label="Passphrase"
                        />
                        <button onClick={() => setShowMapping(!showMapping)} className="w-full mt-3 bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2.5 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors text-sm">
                            {showMapping ? 'Hide Mapping' : 'Show Mapping'}
                        </button>
                         {showMapping && (
                            <div className="w-full pt-4">
                                <pre className="text-xs text-[var(--text-secondary)] p-2 rounded-lg border border-[var(--input-border)] bg-[var(--bg-gradient-to)] h-[150px] overflow-auto font-mono">
                                    {mappingDisplayText}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Plain Text Box */}
                    <div className="bg-gradient-to-br from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-xl shadow-lg p-5 border border-[var(--input-border)]">
                        <label className="font-semibold text-md mb-2 block text-[var(--text-primary)]">Plain Text (লেখা)</label>
                        <textarea
                            value={plainText}
                            onChange={(e) => setPlainText(e.target.value)}
                            placeholder="Type text here..."
                            className="flex-1 w-full p-3 rounded-lg border border-[var(--input-border)] bg-[var(--bg-gradient-to)] text-[var(--text-primary)] text-base resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] min-h-[120px]"
                            aria-label="Plain Text Input"
                        />
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={handleEncode} className={primaryButtonClass}>Encode ↓</button>
                            <button onClick={handleTranslate} disabled={isTranslating} className={`${primaryButtonClass} disabled:opacity-50`}>
                                {isTranslating ? 'Translating...' : 'Translate to বাংলা'}
                            </button>
                            <button onClick={() => handlePaste(setPlainText)} className={secondaryButtonClass}>Paste</button>
                            <button onClick={() => setPlainText('')} className={secondaryButtonClass}>Clear</button>
                        </div>
                    </div>

                    {/* Encoded Text Box */}
                    <div className="bg-gradient-to-br from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-xl shadow-lg p-5 border border-[var(--input-border)]">
                        <label className="font-semibold text-md mb-2 block text-[var(--text-primary)]">Encoded Emoji (ইমোজি)</label>
                        <textarea
                            value={encodedText}
                            onChange={(e) => setEncodedText(e.target.value)}
                            placeholder="Encoded emoji appears here..."
                            className="flex-1 w-full p-3 rounded-lg border border-[var(--input-border)] bg-[var(--bg-gradient-to)] text-[var(--text-primary)] text-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] min-h-[120px]"
                            aria-label="Encoded Emoji Output"
                        />
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={handleDecode} className={primaryButtonClass}>Decode ↑</button>
                            <button onClick={() => handleCopyToClipboard(encodedText, 'Emoji')} className={secondaryButtonClass}>Copy</button>
                            <button onClick={() => handlePaste(setEncodedText)} className={secondaryButtonClass}>Paste</button>
                            <button onClick={() => setEncodedText('')} className={secondaryButtonClass}>Clear</button>
                        </div>
                    </div>
                </main>

                {/* Copy Status Toast */}
                {copyStatus && (
                    <div className="fixed bottom-5 right-5 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white py-2 px-4 rounded-lg shadow-lg">
                        {copyStatus}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;