import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WordDefinition } from './types';
import { fetchDefinition } from './services/dictionaryService';
import WordEntry from './components/WordEntry';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [entries, setEntries] = useState<WordDefinition[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setIsApiKeyMissing(true);
    }
  }, []);

  // Scroll to bottom when entries change or input grows
  useEffect(() => {
    if (entries.length > 0 || currentInput.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [entries, currentInput]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSpace = useCallback(async () => {
    const trimmedWord = currentInput.trim();
    if (!trimmedWord) {
      setCurrentInput(''); // Just clear leading spaces
      return;
    }

    const newId = generateId();
    
    // 1. Add optimistic entry with loading state
    const newEntry: WordDefinition = {
      word: trimmedWord,
      english: '',
      urdu: '',
      isLoading: true,
      id: newId,
    };

    setEntries(prev => [...prev, newEntry]);
    setCurrentInput(''); // Clear input immediately for next word

    try {
      // 2. Fetch definition
      const data = await fetchDefinition(trimmedWord);
      
      // 3. Update entry with data
      setEntries(prev => 
        prev.map(entry => 
          entry.id === newId 
            ? { ...entry, english: data.english, urdu: data.urdu, isLoading: false }
            : entry
        )
      );
    } catch (error) {
      // 4. Handle error
      setEntries(prev => 
        prev.map(entry => 
          entry.id === newId 
            ? { ...entry, isLoading: false, error: 'Failed to fetch definition' }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  if (isApiKeyMissing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-200 p-4 font-sans text-gray-800">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-t-8 border-red-500">
          <h1 className="text-2xl font-bold mb-4 text-red-600 font-hand">Missing Ink (API Key)</h1>
          <p className="mb-6 font-hand text-lg">
            This notepad needs a Gemini API key to start writing definitions.
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all mb-4">
            process.env.API_KEY
          </div>
          <p className="text-sm text-gray-500 italic">Please check your environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#e5e7eb] text-gray-800 flex flex-col font-sans items-center py-6 md:py-12 px-4"
      onClick={focusInput}
    >
      {/* Main Content Area - Looks like paper */}
      <main className="w-full max-w-2xl flex-1 flex flex-col notepad-paper rounded-sm relative min-h-[80vh] overflow-hidden">
        
        {/* Header inside the paper */}
        <header className="px-8 md:px-14 pt-10 pb-2">
            <div className="flex justify-between items-baseline border-b-[3px] border-red-200 pb-1">
                <h1 className="text-4xl font-bold tracking-tight text-gray-700 font-hand ink-text">
                The Vibey Vercel
                </h1>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-sans font-semibold">Vocabulary Lab</div>
            </div>
        </header>

        <div className="flex-1 px-8 md:px-14 py-4 overflow-y-auto">
            {/* Placeholder/Instruction if empty */}
            {entries.length === 0 && !currentInput && (
            <div className="mt-12 opacity-30 pointer-events-none space-y-4">
                <p className="text-3xl font-hand text-gray-400 animate-pulse">Start writing here...</p>
                <p className="text-xl font-hand text-gray-300">Type a word, then press space to see the magic.</p>
            </div>
            )}

            {/* List of processed entries */}
            <div className="space-y-0">
            {entries.map((entry) => (
                <WordEntry key={entry.id} entry={entry} />
            ))}
            </div>

            {/* Active Input Line */}
            <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none text-2xl font-bold font-hand text-gray-700 placeholder-gray-200"
                style={{ lineHeight: '2.5rem', height: '2.5rem' }}
                placeholder={entries.length > 0 ? "" : ""}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
            />
            </div>
            
            {/* Spacer for scroll */}
            <div ref={bottomRef} className="h-40" />
        </div>
        
        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
      </main>

      <footer className="mt-8 text-gray-500 text-xs font-hand tracking-widest uppercase opacity-60">
        Curated by Gemini Flash • No Ink Wasted
      </footer>
    </div>
  );
};

export default App;