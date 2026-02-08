
import React from 'react';
import { WordDefinition } from '../types';

interface WordEntryProps {
  entry: WordDefinition;
}

const WordEntry: React.FC<WordEntryProps> = ({ entry }) => {
  const getErrorMessage = (err?: string) => {
    switch(err) {
      case "MISSING_API_KEY": return "API Key missing in environment.";
      case "INVALID_API_KEY": return "The provided API Key is invalid.";
      default: return "I couldn't write this definition.";
    }
  };

  return (
    <div className="mb-0 relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-baseline h-10 ml-2 md:ml-0">
        <span className="text-2xl font-bold text-slate-800 font-hand tracking-wide ink-text">
          {entry.word}
        </span>
        {entry.isLoading && (
          <span className="text-sm text-blue-400 ml-4 font-hand animate-pulse">
            scribbling...
          </span>
        )}
      </div>

      <div className="ml-6 md:ml-8">
        {entry.error ? (
          <div className="text-red-400 text-lg font-hand h-10 flex items-center italic">
            {getErrorMessage(entry.error)}
          </div>
        ) : (
          <>
            <div className={`text-blue-700 font-hand text-xl h-10 flex items-center transition-all duration-700 ease-out ${entry.isLoading ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}>
               <span className="text-gray-300 text-[10px] font-sans mr-3 select-none uppercase tracking-widest">Def</span>
               <span className="ink-text">{entry.english}</span>
            </div>
            
            <div className={`text-emerald-800 h-10 flex items-center transition-all duration-1000 delay-100 ease-out ${entry.isLoading ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}>
              <span className="text-gray-300 text-[10px] font-sans mr-3 select-none uppercase tracking-widest">Urdu</span>
              <span dir="rtl" className="font-urdu text-lg leading-none pt-1">{entry.urdu}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WordEntry;
