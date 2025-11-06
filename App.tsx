import React, { useState, useMemo, useCallback } from 'react';
import { emojiPool, chars } from './constants';

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

// --- Main App Component ---

const App: React.FC = () => {
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
            setter(text);
        } catch (error) {
            console.error("Paste failed:", error);
            alert("Failed to paste from clipboard.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center p-4">
            <div className="w-full max-w-2xl flex flex-col gap-6">
                {/* Header */}
                <header className="text-center">
                    <h1 className="text-3xl font-bold text-white">Emoji Cipher Demo</h1>
                    <p className="text-md text-gray-400 mt-1">Encode text into emojis, and decode back.</p>
                </header>

                {/* Main Content */}
                <main className="flex flex-col gap-4">
                    {/* Plain Text Box */}
                    <div className="bg-gray-800 rounded-xl shadow-lg p-5">
                        <label className="font-bold text-lg mb-2 block text-gray-300">Plain Text</label>
                        <textarea
                            value={plainText}
                            onChange={(e) => setPlainText(e.target.value)}
                            placeholder="Type text here..."
                            className="flex-1 w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                        />
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <button onClick={handleEncode} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Encode ↓</button>
                            <button onClick={() => handlePaste(setPlainText)} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Paste</button>
                            <button onClick={() => setPlainText('')} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Clear</button>
                        </div>
                    </div>

                    {/* Encoded Text Box */}
                    <div className="bg-gray-800 rounded-xl shadow-lg p-5">
                        <label className="font-bold text-lg mb-2 block text-gray-300">Encoded Emoji</label>
                        <textarea
                            value={encodedText}
                            onChange={(e) => setEncodedText(e.target.value)}
                            placeholder="Encoded emoji appears here..."
                            className="flex-1 w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            <button onClick={handleDecode} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Decode ↑</button>
                            <button onClick={() => handleCopyToClipboard(encodedText, 'Emoji')} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Copy</button>
                            <button onClick={() => handlePaste(setEncodedText)} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Paste</button>
                             <button onClick={() => setEncodedText('')} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Clear</button>
                        </div>
                    </div>
                </main>
                
                 {/* Mapping Toggle and Panel */}
                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => setShowMapping(!showMapping)} className="bg-gray-700 px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-600 transition-colors">
                        {showMapping ? 'Hide Character Mapping' : 'Show Character Mapping'}
                    </button>
                    {showMapping && (
                        <div className="w-full bg-gray-800 p-4 rounded-lg mt-2">
                            <pre className="text-xs text-gray-400 p-2 rounded-lg border border-gray-700 bg-gray-900 h-[150px] overflow-auto font-mono">
                                {mappingDisplayText}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="text-center text-xs text-gray-500 py-4">
                   A simple demo application.
                </footer>

                {/* Copy Status Toast */}
                {copyStatus && (
                    <div className="fixed bottom-5 right-5 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg">
                        {copyStatus}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
