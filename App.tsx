
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WordDefinition } from './types';
import { fetchDefinition } from './services/dictionaryService';
import WordEntry from './components/WordEntry';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [entries, setEntries] = useState<WordDefinition[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [userKey, setUserKey] = useState(localStorage.getItem('vibey_user_api_key') || '');
  const [hasActiveKey, setHasActiveKey] = useState(!!(localStorage.getItem('vibey_user_api_key') || process.env.API_KEY));
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (entries.length > 0 || currentInput.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [entries, currentInput]);

  // Focus input on mount
  useEffect(() => {
    if (!isApiModalOpen) {
      inputRef.current?.focus();
    }
  }, [isApiModalOpen]);

  const saveApiKey = () => {
    const trimmed = userKey.trim();
    if (trimmed) {
      localStorage.setItem('vibey_user_api_key', trimmed);
      setHasActiveKey(true);
      setIsApiModalOpen(false);
    } else {
      localStorage.removeItem('vibey_user_api_key');
      setHasActiveKey(!!process.env.API_KEY);
      setIsApiModalOpen(false);
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
    <div className="min-h-screen bg-[#e5e7eb] text-gray-800 flex flex-col font-sans items-center py-6 md:py-12 px-4 relative">
      <main className="w-full max-w-2xl flex-1 flex flex-col notepad-paper rounded-sm relative min-h-[80vh] overflow-hidden">
        <header className="px-8 md:px-14 pt-10 pb-2">
            <div className="flex justify-between items-baseline border-b-[3px] border-red-200 pb-1">
                <h1 className="text-4xl font-bold tracking-tight text-gray-700 font-hand ink-text">
                The Vibey Vercel
                </h1>
                <div className="flex gap-3 items-center">
                    <button 
                      onClick={() => setIsApiModalOpen(true)}
                      title="Set your custom Gemini API Key"
                      className={`text-[10px] uppercase tracking-[0.2em] font-sans font-bold px-2 py-1 rounded transition-all duration-300 border ${hasActiveKey ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600'}`}
                    >
                      {hasActiveKey ? 'API ACTIVE' : 'SET API'}
                    </button>
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-sans font-semibold">Vocabulary Lab</div>
                </div>
            </div>
        </header>

        <div className="flex-1 px-8 md:px-14 py-4 overflow-y-auto" onClick={() => !isApiModalOpen && inputRef.current?.focus()}>
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

      {/* Custom API Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded shadow-2xl overflow-hidden notepad-paper border-t-8 border-red-400 p-8 transform animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-hand text-gray-700 underline decoration-red-200 decoration-4">Setup Your API</h2>
              <button onClick={() => setIsApiModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 font-hand text-lg leading-tight">
              Paste your Gemini API key below. This key stays strictly in your browser's local storage and is used to fetch definitions.
            </p>

            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="password"
                  placeholder="Paste Key Here..."
                  value={userKey}
                  onChange={(e) => setUserKey(e.target.value)}
                  className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-red-400 outline-none py-2 px-1 font-mono text-sm transition-colors"
                />
                <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-red-100"></div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveApiKey}
                  className="px-6 py-2 bg-red-400 text-white font-bold rounded shadow-md hover:bg-red-500 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  Save Key
                </button>
              </div>
            </div>
            
            <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-tighter">
              No key? Get one for free at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-400">Google AI Studio</a>.
            </p>
          </div>
        </div>
      )}

      <footer className="mt-8 flex flex-col items-center gap-2">
        <div className="text-gray-500 text-xs font-hand tracking-widest uppercase opacity-60">
          Curated by Gemini Flash • No Ink Wasted
        </div>
        <a 
          href="https://mirmohmmadluqman.github.io/portfolio/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
          title="Developed by Luqman"
        >
          <span className="text-[10px] uppercase tracking-tighter font-bold opacity-0 group-hover:opacity-100 transition-opacity">Dev by Luqman</span>
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        </a>
      </footer>
    </div>
  );
};

export default App;
