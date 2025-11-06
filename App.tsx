
import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { GoogleGenAI } from "@google/genai";
import { emojiPool, chars } from './constants';
import { themes, Theme } from './themes';

const AboutModal = lazy(() => import('./AboutModal'));

// --- Cipher Logic Utilities (unchanged) ---

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
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

function buildMapping(passphrase: string): { [key: string]: string } {
  const seed = passphrase ? hashString(passphrase) : 1234567;
  const pool = seededShuffle(emojiPool, seed);
  const map: { [key: string]: string } = {};
  for (let i = 0; i < chars.length; i++) {
    map[chars[i]] = pool[i % pool.length];
  }
  return map;
}

function reverseMap(map: { [key: string]: string }): { [key: string]: string } {
  const rev: { [key: string]: string } = {};
  for (const k in map) {
    rev[map[k]] = k;
  }
  return rev;
}

// --- Main App Component ---

const App: React.FC = () => {
    const [plainText, setPlainText] = useState<string>('i love you');
    const [encodedText, setEncodedText] = useState<string>('');
    const [passphrase, setPassphrase] = useState<string>('');
    const [copyStatus, setCopyStatus] = useState<string>('');
    const [showMapping, setShowMapping] = useState<boolean>(false);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [activeTheme, setActiveTheme] = useState<Theme>(themes[0]);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(activeTheme.colors).forEach(([key, value]) => {
            // FIX: Explicitly cast `value` to string to resolve TypeScript error.
            // The type inference for Object.entries might be too loose in this environment.
            root.style.setProperty(key, value as string);
        });
    }, [activeTheme]);

    const mapping = useMemo(() => buildMapping(passphrase), [passphrase]);
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
        const output = [...textToEncode].map(char => mapping[char] || '❓').join(' ');
        setEncodedText(output);
    }, [plainText, mapping]);

    const handleDecode = useCallback(() => {
        if (!encodedText) {
            setPlainText('');
            return;
        }
        const tokens = encodedText.trim().split(/\s+/);
        const output = tokens.map(token => reversedMapping[token] || '?').join('');
        setPlainText(output);
    }, [encodedText, reversedMapping]);
    
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
            setter(text);
        } catch (error) {
            console.error("Paste failed:", error);
            alert("Failed to paste from clipboard.");
        }
    };

    const handleTranslate = async () => {
        if (!plainText || isTranslating) return;
        
        setIsTranslating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate the following text to Bengali: "${plainText}"`,
            });
            setPlainText(response.text);
        } catch (error) {
            console.error("Translation failed:", error);
            alert("Sorry, translation failed. Please try again.");
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)] text-[var(--text-primary)] font-['Inter',_sans-serif] flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-2xl flex flex-col gap-4">
                {/* Header */}
                <header className="text-center">
                    <h1 className="text-2xl font-bold">Emoji Cipher</h1>
                    <p className="text-sm text-[var(--text-secondary)]">গোপন কথা বলো ইমোজির ভাষায়</p>
                </header>

                {/* Theme Selector */}
                <div className="flex justify-center items-center gap-2 p-2 rounded-full bg-black/20 backdrop-blur-sm">
                    {themes.map((theme) => (
                        <button
                            key={theme.key}
                            onClick={() => setActiveTheme(theme)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                                activeTheme.key === theme.key
                                    ? 'bg-[var(--accent-from)] text-white shadow-lg shadow-[var(--accent-focus)]/20'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--button-bg)]'
                            }`}
                        >
                            {theme.name}
                        </button>
                    ))}
                </div>

                {/* Controls */}
                <div className="bg-gradient-to-b from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-2xl shadow-2xl shadow-black/50 p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label htmlFor="pass" className="text-xs text-[var(--text-secondary)] mb-1 block">Passphrase (ঐচ্ছিক)</label>
                        <input
                            id="pass"
                            type="text"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            placeholder="এখানে পাসফ্রেজ দিন"
                            className="w-full p-2 rounded-lg border border-[var(--input-border)] bg-transparent text-inherit text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-focus)]"
                        />
                    </div>
                    <button onClick={() => setShowMapping(!showMapping)} className="bg-[var(--button-bg)] px-4 py-2 rounded-md text-sm hover:bg-[var(--button-hover-bg)] transition-colors w-full md:w-auto">
                        {showMapping ? 'Hide' : 'Show'} Mapping
                    </button>
                </div>

                {/* Mapping Panel (Conditional) */}
                {showMapping && (
                    <div className="bg-black/20 p-4 rounded-lg">
                        <pre className="text-xs text-[var(--text-secondary)] p-2 rounded-lg border border-[var(--input-border)] bg-gradient-to-b from-[var(--card-gradient-from)] to-transparent h-[150px] overflow-auto font-mono">
                            {mappingDisplayText}
                        </pre>
                    </div>
                )}
                
                {/* Main Content */}
                <main className="flex flex-col gap-4">
                    {/* Plain Text Box */}
                    <div className="bg-gradient-to-b from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-2xl shadow-2xl shadow-black/50 p-4 flex flex-col">
                        <label className="font-bold mb-2">Plain Text (লিখো)</label>
                        <textarea
                            value={plainText}
                            onChange={(e) => setPlainText(e.target.value)}
                            placeholder="Type text here..."
                            className="flex-1 w-full p-3 rounded-lg border border-[var(--input-border)] bg-transparent text-inherit text-base resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] min-h-[150px]"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button onClick={handleEncode} className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-[var(--accent-focus)]/20 hover:opacity-90 transition-opacity">Encode ↓</button>
                            <button onClick={handleTranslate} disabled={!plainText || isTranslating} className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-[var(--accent-focus)]/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                                {isTranslating ? 'Translating...' : 'Translate to বাংলা'}
                            </button>
                            <button onClick={() => handlePaste(setPlainText)} className="bg-[var(--button-bg)] text-inherit font-bold py-2 px-4 rounded-xl hover:bg-[var(--button-hover-bg)] transition-colors">Paste</button>
                            <button onClick={() => setPlainText('')} className="bg-[var(--button-bg)] text-inherit font-bold py-2 px-4 rounded-xl hover:bg-[var(--button-hover-bg)] transition-colors">Clear</button>
                        </div>
                    </div>

                    {/* Encoded Text Box */}
                    <div className="bg-gradient-to-b from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-2xl shadow-2xl shadow-black/50 p-4 flex flex-col">
                        <label className="font-bold mb-2">Encoded Emoji (ইমোজি)</label>
                        <textarea
                            value={encodedText}
                            onChange={(e) => setEncodedText(e.target.value)}
                            placeholder="Encoded emoji appears here..."
                            className="flex-1 w-full p-3 rounded-lg border border-[var(--input-border)] bg-transparent text-inherit text-base resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] min-h-[150px]"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button onClick={handleDecode} className="bg-[var(--button-bg)] text-inherit font-bold py-2 px-4 rounded-xl hover:bg-[var(--button-hover-bg)] transition-colors">Decode ↑</button>
                            <button onClick={() => handleCopyToClipboard(encodedText, 'Emoji')} className="bg-[var(--button-bg)] text-inherit font-bold py-2 px-4 rounded-xl hover:bg-[var(--button-hover-bg)] transition-colors">Copy</button>
                            <button onClick={() => handlePaste(setEncodedText)} className="bg-[var(--button-bg)] text-inherit font-bold py-2 px-4 rounded-xl hover:bg-[var(--button-hover-bg)] transition-colors">Paste</button>
                            <button onClick={() => setEncodedText('')} className="bg-[var(--button-bg)] text-inherit font-bold py-2 px-4 rounded-xl hover:bg-[var(--button-hover-bg)] transition-colors">Clear</button>
                        </div>
                    </div>
                </main>
                
                {/* Footer */}
                <footer className="text-center text-xs text-[var(--text-secondary)] py-4">
                    <button onClick={() => setIsAboutModalOpen(true)} className="hover:text-[var(--text-primary)] transition-colors underline">
                        Powered by IM Muslim
                    </button>
                </footer>

                {/* Copy Status Toast */}
                {copyStatus && (
                    <div className="fixed bottom-5 right-5 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg transition-opacity duration-300 animate-pulse">
                        {copyStatus}
                    </div>
                )}
            </div>
            
            <Suspense fallback={null}>
              <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
            </Suspense>
        </div>
    );
};

export default App;
