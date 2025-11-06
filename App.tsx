
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { emojiPool, chars } from './constants';
import { themes, Theme } from './themes';
import AboutModal from './AboutModal';


// --- Cipher Logic Utilities ---

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

function buildMapping(): { [key: string]: string } {
  // Use a fixed seed for the demo instead of a passphrase
  const seed = 12345;
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
        document.body.style.background = `linear-gradient(to bottom right, ${theme.colors['--bg-gradient-from']}, ${theme.colors['--bg-gradient-to']})`;
        try {
            localStorage.setItem('emoji-cipher-theme', theme.key);
        } catch (error) {
            console.error("Could not save theme to localStorage:", error);
        }
    }, [theme]);

    return [theme, setTheme];
};

// --- Main App Component ---

const App: React.FC = () => {
    const [theme, setTheme] = useTheme();
    const [isAboutModalOpen, setAboutModalOpen] = useState(false);
    const [plainText, setPlainText] = useState<string>('hello world');
    const [encodedText, setEncodedText] = useState<string>('');
    const [copyStatus, setCopyStatus] = useState<string>('');
    const [showMapping, setShowMapping] = useState<boolean>(false);

    const mapping = useMemo(() => buildMapping(), []);
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
            // FIX: Argument of type 'unknown' is not assignable to parameter of type 'string'.
            // In some environments, the return type of readText() can be inferred as 'unknown'.
            // A type guard ensures we only proceed if the clipboard content is a string.
            if (typeof text === 'string') {
                setter(text);
            }
        } catch (error) {
            console.error("Paste failed:", error);
            alert("Failed to paste from clipboard.");
        }
    };

    return (
        <div className="min-h-screen text-[var(--text-primary)] font-sans flex items-center justify-center p-4">
            <div className="w-full max-w-2xl flex flex-col gap-6">
                {/* Header */}
                <header className="text-center">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Emoji Cipher Demo</h1>
                    <p className="text-md text-[var(--text-secondary)] mt-1">Encode text into emojis, and decode back.</p>
                </header>

                {/* Main Content */}
                <main className="flex flex-col gap-4">
                    {/* Plain Text Box */}
                    <div className="bg-gradient-to-br from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-xl shadow-lg p-5 border border-[var(--input-border)]">
                        <label className="font-bold text-lg mb-2 block text-[var(--text-primary)]">Plain Text</label>
                        <textarea
                            value={plainText}
                            onChange={(e) => setPlainText(e.target.value)}
                            placeholder="Type text here..."
                            className="flex-1 w-full p-3 rounded-lg border border-[var(--input-border)] bg-[var(--bg-gradient-to)] text-[var(--text-primary)] text-base resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] min-h-[150px]"
                        />
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <button onClick={handleEncode} className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">Encode ↓</button>
                            <button onClick={() => handlePaste(setPlainText)} className="bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors">Paste</button>
                            <button onClick={() => setPlainText('')} className="bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors">Clear</button>
                        </div>
                    </div>

                    {/* Encoded Text Box */}
                    <div className="bg-gradient-to-br from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] rounded-xl shadow-lg p-5 border border-[var(--input-border)]">
                        <label className="font-bold text-lg mb-2 block text-[var(--text-primary)]">Encoded Emoji</label>
                        <textarea
                            value={encodedText}
                            onChange={(e) => setEncodedText(e.target.value)}
                            placeholder="Encoded emoji appears here..."
                            className="flex-1 w-full p-3 rounded-lg border border-[var(--input-border)] bg-[var(--bg-gradient-to)] text-[var(--text-primary)] text-base resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] min-h-[150px]"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            <button onClick={handleDecode} className="bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors">Decode ↑</button>
                            <button onClick={() => handleCopyToClipboard(encodedText, 'Emoji')} className="bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors">Copy</button>
                            <button onClick={() => handlePaste(setEncodedText)} className="bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors">Paste</button>
                            <button onClick={() => setEncodedText('')} className="bg-[var(--button-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--button-hover-bg)] transition-colors">Clear</button>
                        </div>
                    </div>
                </main>
                
                 {/* Mapping Toggle and Panel */}
                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => setShowMapping(!showMapping)} className="bg-[var(--button-bg)] px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--button-hover-bg)] transition-colors">
                        {showMapping ? 'Hide Character Mapping' : 'Show Character Mapping'}
                    </button>
                    {showMapping && (
                        <div className="w-full bg-gradient-to-br from-[var(--card-gradient-from)] to-[var(--card-gradient-to)] p-4 rounded-lg mt-2 border border-[var(--input-border)]">
                            <pre className="text-xs text-[var(--text-secondary)] p-2 rounded-lg border border-[var(--input-border)] bg-[var(--bg-gradient-to)] h-[150px] overflow-auto font-mono">
                                {mappingDisplayText}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="w-full text-center py-4 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--text-secondary)]">Theme:</span>
                            {themes.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setTheme(t)}
                                    className={`w-6 h-6 rounded-full transition-all duration-200 border-2 ${theme.key === t.key ? 'border-[var(--accent-focus)] scale-110' : 'border-transparent hover:scale-110'}`}
                                    style={{ background: `linear-gradient(45deg, ${t.colors['--accent-from']}, ${t.colors['--accent-to']})` }}
                                    aria-label={`Select ${t.name} theme`}
                                    title={t.name}
                                />
                            ))}
                        </div>
                        <span className="text-[var(--text-secondary)] hidden sm:inline">|</span>
                        <button 
                            onClick={() => setAboutModalOpen(true)}
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:underline"
                        >
                            About IM Softworks
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] opacity-70">A simple demo application.</p>
                </footer>

                {/* Copy Status Toast */}
                {copyStatus && (
                    <div className="fixed bottom-5 right-5 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white py-2 px-4 rounded-lg shadow-lg">
                        {copyStatus}
                    </div>
                )}
            </div>
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} />
        </div>
    );
};

export default App;