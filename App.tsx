
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WordDefinition } from './types';
import { fetchDefinition } from './services/dictionaryService';
import WordEntry from './components/WordEntry';

/**
 * AIStudio interface to match the environment's expected type.
 * This resolves conflicting property declarations in Window.
 */
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [entries, setEntries] = useState<WordDefinition[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [hasKey, setHasKey] = useState<boolean>(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if an API key is already selected on mount to show status
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (err) {
          console.debug("Could not check key status", err);
        }
      }
    };
    checkKey();
  }, []);

  // Auto-scroll to bottom when entries or input change
  useEffect(() => {
    if (entries.length > 0 || currentInput.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [entries, currentInput]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * handleSelectKey - Triggers the AI Studio API key selection dialog.
   * Following guidelines: trigger openSelectKey() and assume success.
   */
  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // GUIDELINE: Assume success after triggering openSelectKey and proceed.
        setHasKey(true);
      } catch (err) {
        console.error("Failed to open key selection", err);
      }
    }
  };

  const handleSpace = useCallback(async () => {
    const trimmedWord = currentInput.trim();
    if (!trimmedWord) {
      setCurrentInput('');
      return;
    }

    const newId = generateId();
    
    const newEntry: WordDefinition = {
      word: trimmedWord,
      english: '',
      urdu: '',
      isLoading: true,
      id: newId,
    };

    setEntries(prev => [...prev, newEntry]);
    setCurrentInput('');

    try {
      const data = await fetchDefinition(trimmedWord);
      setEntries(prev => 
        prev.map(entry => 
          entry.id === newId 
            ? { ...entry, english: data.english, urdu: data.urdu, isLoading: false }
            : entry
        )
      );
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // GUIDELINE: If the request fails with "Requested entity was not found.",
      // reset the key selection state to prompt re-selection.
      if (errorMessage.includes("Requested entity was not found")) {
        setHasKey(false);
      }

      setEntries(prev => 
        prev.map(entry => 
          entry.id === newId 
            ? { ...entry, isLoading: false, error: errorMessage }
            : entry
        )
      );
    }
  }, [currentInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault(); 
      handleSpace();
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#e5e7eb] text-gray-800 flex flex-col font-sans items-center py-6 md:py-12 px-4"
    >
      <main className="w-full max-w-2xl flex-1 flex flex-col notepad-paper rounded-sm relative min-h-[80vh] overflow-hidden">
        <header className="px-8 md:px-14 pt-10 pb-2">
            <div className="flex justify-between items-baseline border-b-[3px] border-red-200 pb-1">
                <h1 className="text-4xl font-bold tracking-tight text-gray-700 font-hand ink-text">
                The Vibey Vercel
                </h1>
                <div className="flex gap-3 items-center">
                    <button 
                      onClick={handleSelectKey}
                      title="Select your own Gemini API Key"
                      className={`text-[10px] uppercase tracking-[0.2em] font-sans font-bold px-2 py-1 rounded transition-all duration-300 border ${hasKey ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600'}`}
                    >
                      {hasKey ? 'API ACTIVE' : 'SET API'}
                    </button>
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-sans font-semibold">Vocabulary Lab</div>
                </div>
            </div>
            { !hasKey && (
              <div className="mt-2 text-[9px] text-gray-400 font-sans tracking-tight italic flex justify-end">
                <span>Use a paid project key for better stability. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 ml-1">Billing Docs</a></span>
              </div>
            )}
        </header>

        <div className="flex-1 px-8 md:px-14 py-4 overflow-y-auto" onClick={() => inputRef.current?.focus()}>
            {entries.length === 0 && !currentInput && (
            <div className="mt-12 opacity-30 pointer-events-none space-y-4">
                <p className="text-3xl font-hand text-gray-400 animate-pulse">Start writing here...</p>
                <p className="text-xl font-hand text-gray-300">Type a word, then press space to see the magic.</p>
            </div>
            )}

            <div className="space-y-0">
            {entries.map((entry) => (
                <WordEntry key={entry.id} entry={entry} />
            ))}
            </div>

            <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={entries.length === 0 ? "" : "Next word..."}
                className="w-full bg-transparent border-none outline-none text-2xl font-bold font-hand text-gray-700 placeholder-gray-200"
                style={{ lineHeight: '2.5rem', height: '2.5rem' }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
            />
            </div>
            <div ref={bottomRef} className="h-40" />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
      </main>

      <footer className="mt-8 text-gray-500 text-xs font-hand tracking-widest uppercase opacity-60">
        Curated by Gemini Flash • No Ink Wasted
      </footer>
    </div>
  );
};

export default App;
