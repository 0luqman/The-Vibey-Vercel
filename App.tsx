
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { WordDefinition, Notebook, Page, Workspace } from './types';
import { fetchDefinition } from './services/dictionaryService';
import WordEntry from './components/WordEntry';

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_WORKSPACE: Workspace = {
  notebooks: [
    {
      id: 'default',
      title: 'My First Notebook',
      pages: [{ id: generateId(), pageNumber: 1, entries: [] }],
      createdAt: Date.now(),
    }
  ],
  activeNotebookId: 'default',
  activePageIndex: 0,
};

const App: React.FC = () => {
  // --- State ---
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    try {
      const saved = localStorage.getItem('vibey_workspace');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.notebooks) && parsed.notebooks.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load workspace", e);
    }
    return INITIAL_WORKSPACE;
  });

  const [currentInput, setCurrentInput] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Modals for Notebook actions
  const [isNewNbModalOpen, setIsNewNbModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [newNbTitle, setNewNbTitle] = useState('');
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [jumpPage, setJumpPage] = useState('');
  const [userKey, setUserKey] = useState(localStorage.getItem('vibey_user_api_key') || '');
  const [hasActiveKey, setHasActiveKey] = useState(!!(localStorage.getItem('vibey_user_api_key') || process.env.API_KEY));
  const [isPageChanging, setIsPageChanging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newNbInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // --- Derived State ---
  const activeNotebook = useMemo(() => 
    workspace.notebooks.find(nb => nb.id === workspace.activeNotebookId) || workspace.notebooks[0]
  , [workspace.notebooks, workspace.activeNotebookId]);

  const activePage = useMemo(() => 
    activeNotebook.pages[workspace.activePageIndex] || activeNotebook.pages[0] || activeNotebook.pages[activeNotebook.pages.length - 1]
  , [activeNotebook, workspace.activePageIndex]);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('vibey_workspace', JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    if (!isApiModalOpen && !isSidebarOpen && !isNewNbModalOpen && !isRenameModalOpen && !isDeleteModalOpen) {
      inputRef.current?.focus();
    }
    if (isNewNbModalOpen) {
      setTimeout(() => newNbInputRef.current?.focus(), 100);
    }
    if (isRenameModalOpen) {
      setTimeout(() => renameInputRef.current?.focus(), 100);
    }
  }, [isApiModalOpen, isSidebarOpen, isNewNbModalOpen, isRenameModalOpen, isDeleteModalOpen, workspace.activePageIndex]);

  // --- Handlers ---
  const saveApiKey = () => {
    const trimmed = userKey.trim();
    if (trimmed) {
      localStorage.setItem('vibey_user_api_key', trimmed);
      setHasActiveKey(true);
    } else {
      localStorage.removeItem('vibey_user_api_key');
      setHasActiveKey(!!process.env.API_KEY);
    }
    setIsApiModalOpen(false);
  };

  const handleCreateNotebook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newNbTitle.trim() || "Untitled Notebook";
    
    const newNb: Notebook = {
      id: generateId(),
      title,
      pages: [{ id: generateId(), pageNumber: 1, entries: [] }],
      createdAt: Date.now(),
    };

    setWorkspace(prev => ({
      ...prev,
      notebooks: [...prev.notebooks, newNb],
      activeNotebookId: newNb.id,
      activePageIndex: 0,
    }));

    setNewNbTitle('');
    setIsNewNbModalOpen(false);
    setIsSidebarOpen(false);
  };

  const openRenameModal = (id: string, currentTitle: string) => {
    setRenameTargetId(id);
    setRenameValue(currentTitle);
    setIsRenameModalOpen(true);
  };

  const handleRenameNotebook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!renameTargetId) return;

    setWorkspace(prev => ({
      ...prev,
      notebooks: prev.notebooks.map(nb => 
        nb.id === renameTargetId ? { ...nb, title: renameValue.trim() || nb.title } : nb
      )
    }));
    setIsRenameModalOpen(false);
    setRenameTargetId(null);
  };

  const openDeleteModal = (id: string) => {
    if (workspace.notebooks.length <= 1) return;
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteNotebook = () => {
    if (!deleteTargetId) return;
    
    setWorkspace(prev => {
      const filtered = prev.notebooks.filter(nb => nb.id !== deleteTargetId);
      const newActiveId = prev.activeNotebookId === deleteTargetId ? filtered[0].id : prev.activeNotebookId;
      return {
        ...prev,
        notebooks: filtered,
        activeNotebookId: newActiveId,
        activePageIndex: 0,
      };
    });
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  const handlePageTurn = (newIndex: number) => {
    const pagesCount = activeNotebook.pages.length;
    if (newIndex < 0 || newIndex >= pagesCount) return;
    
    setIsPageChanging(true);
    setTimeout(() => {
      setWorkspace(prev => ({ ...prev, activePageIndex: newIndex }));
      setIsPageChanging(false);
    }, 200);
  };

  const addNewPage = () => {
    const newPage: Page = {
      id: generateId(),
      pageNumber: activeNotebook.pages.length + 1,
      entries: [],
    };
    
    setWorkspace(prev => ({
      ...prev,
      notebooks: prev.notebooks.map(nb => 
        nb.id === prev.activeNotebookId 
          ? { ...nb, pages: [...nb.pages, newPage] }
          : nb
      ),
      activePageIndex: activeNotebook.pages.length,
    }));
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

    const currentNbId = workspace.activeNotebookId;
    const currentPageIdx = workspace.activePageIndex;

    setWorkspace(prev => ({
      ...prev,
      notebooks: prev.notebooks.map(nb => 
        nb.id === currentNbId 
          ? {
              ...nb,
              pages: nb.pages.map((p, idx) => 
                idx === currentPageIdx 
                  ? { ...p, entries: [...p.entries, newEntry] }
                  : p
              )
            }
          : nb
      )
    }));
    setCurrentInput('');

    try {
      const data = await fetchDefinition(trimmedWord);
      setWorkspace(prev => ({
        ...prev,
        notebooks: prev.notebooks.map(nb => 
          nb.id === currentNbId 
            ? {
                ...nb,
                pages: nb.pages.map((p, idx) => 
                  idx === currentPageIdx 
                    ? { ...p, entries: p.entries.map(e => e.id === newId ? { ...e, ...data, isLoading: false } : e) }
                    : p
                )
              }
            : nb
        )
      }));
    } catch (error: any) {
      setWorkspace(prev => ({
        ...prev,
        notebooks: prev.notebooks.map(nb => 
          nb.id === currentNbId 
            ? {
                ...nb,
                pages: nb.pages.map((p, idx) => 
                  idx === currentPageIdx 
                    ? { ...p, entries: p.entries.map(e => e.id === newId ? { ...e, isLoading: false, error: error.message } : e) }
                    : p
                )
              }
            : nb
        )
      }));
    }
  }, [currentInput, workspace.activeNotebookId, workspace.activePageIndex]);

  // --- Export / Import ---
  const exportWorkspace = () => {
    const dataStr = JSON.stringify(workspace, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibey_workspace_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.notebooks && imported.notebooks.length > 0) {
          setWorkspace(imported);
          alert("Workspace imported successfully!");
        } else {
          throw new Error("Invalid notebook structure");
        }
      } catch (err) {
        alert("Failed to import. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  // --- Search ---
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const results: { pageIdx: number, word: string }[] = [];
    activeNotebook.pages.forEach((page, pIdx) => {
      page.entries.forEach(entry => {
        if (entry.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
            entry.english.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ pageIdx: pIdx, word: entry.word });
        }
      });
    });
    return results;
  }, [searchQuery, activeNotebook]);

  return (
    <div className="min-h-screen bg-[#e5e7eb] text-gray-800 flex flex-col font-sans items-center py-6 md:py-12 px-4 relative overflow-x-hidden">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30 transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-gray-800 text-white z-40 transform transition-transform duration-500 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-hand uppercase tracking-widest text-red-300 border-b-2 border-red-300/30">Bookshelf</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white text-3xl transition-colors">×</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {workspace.notebooks.map(nb => (
              <div key={nb.id} className={`group relative p-4 rounded-lg cursor-pointer transition-all border-l-4 ${workspace.activeNotebookId === nb.id ? 'bg-gray-700/50 border-red-400 shadow-lg scale-[1.02]' : 'border-transparent hover:bg-gray-700/30'}`}
                onClick={() => {
                  setWorkspace(prev => ({ ...prev, activeNotebookId: nb.id, activePageIndex: 0 }));
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}>
                <div className="font-hand text-xl ink-text truncate pr-8">{nb.title}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{nb.pages.length} Pages</div>
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openRenameModal(nb.id, nb.title); }}
                    className="text-gray-400 hover:text-white text-[10px] font-bold uppercase"
                  >
                    Edit
                  </button>
                  {workspace.notebooks.length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openDeleteModal(nb.id); }} 
                      className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase"
                    >
                      Burn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setIsNewNbModalOpen(true)} className="mt-8 w-full py-3 bg-red-400/20 border-2 border-dashed border-red-400/40 text-red-200 font-hand text-2xl rounded-lg hover:bg-red-400/30 transition-all active:scale-95">
            + Draft New Book
          </button>

          <div className="mt-8 border-t border-gray-700 pt-6 space-y-4">
            <button onClick={exportWorkspace} className="w-full text-left text-[10px] text-gray-400 hover:text-white flex items-center gap-3 uppercase tracking-widest transition-colors">
              <span className="text-lg">↑</span> Export Archive
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left text-[10px] text-gray-400 hover:text-white flex items-center gap-3 uppercase tracking-widest transition-colors">
              <span className="text-lg">↓</span> Restore Backup
            </button>
            <input type="file" ref={fileInputRef} onChange={importWorkspace} className="hidden" accept=".json" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full max-w-2xl flex-1 flex flex-col notepad-paper rounded-sm relative min-h-[85vh] overflow-hidden shadow-2xl transition-all duration-300">
        <header className="px-8 md:px-14 pt-10 pb-2">
            <div className="flex justify-between items-baseline border-b-[3px] border-red-200 pb-1">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="text-red-400 hover:scale-110 transition-transform active:rotate-12">
                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                  </button>
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-700 font-hand ink-text truncate max-w-[200px] md:max-w-xs">
                      {activeNotebook.title}
                    </h1>
                    <button 
                      onClick={() => openRenameModal(activeNotebook.id, activeNotebook.title)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-200 hover:text-red-400 p-1"
                      title="Rename this book"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="relative group">
                      <input 
                        type="text" 
                        placeholder="Search ink..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-24 bg-transparent border-b border-gray-100 text-[10px] uppercase font-sans tracking-widest px-1 py-1 focus:w-40 transition-all outline-none"
                      />
                      {searchQuery && (
                        <div className="absolute top-full right-0 bg-white shadow-2xl rounded-lg p-3 z-50 w-72 border border-gray-100 mt-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="text-[10px] text-gray-400 mb-3 font-bold uppercase tracking-widest border-b pb-1">Found in this book:</div>
                          <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                            {searchResults.length > 0 ? searchResults.map((res, i) => (
                              <button key={i} onClick={() => { handlePageTurn(res.pageIdx); setSearchQuery(''); }} className="w-full text-left p-2 hover:bg-red-50 rounded-lg transition-colors group">
                                <div className="font-hand text-xl text-gray-700 group-hover:text-red-500">{res.word}</div>
                                <div className="text-[9px] text-gray-300 uppercase tracking-tighter">Page {res.pageIdx + 1}</div>
                              </button>
                            )) : <div className="text-[10px] text-gray-300 italic py-4 text-center">No matching ink found...</div>}
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setIsApiModalOpen(true)} className={`text-[10px] uppercase tracking-[0.2em] font-sans font-bold px-3 py-1.5 rounded-full transition-all duration-300 border ${hasActiveKey ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-white text-gray-400 border-gray-100'}`}>
                      {hasActiveKey ? 'API ACTIVE' : 'KEY REQUIRED'}
                    </button>
                </div>
            </div>
        </header>

        <div className={`flex-1 px-8 md:px-14 py-4 overflow-y-auto transition-all duration-500 ${isPageChanging ? 'opacity-0 scale-[0.99] blur-sm' : 'opacity-100 scale-100 blur-0'}`} onClick={() => !isSidebarOpen && !isNewNbModalOpen && !isRenameModalOpen && !isDeleteModalOpen && inputRef.current?.focus()}>
            {activePage.entries.length === 0 && !currentInput && (
            <div className="mt-16 opacity-30 pointer-events-none space-y-6 text-center">
                <p className="text-4xl font-hand text-gray-400 animate-pulse">Page {activePage.pageNumber}</p>
                <div className="h-[2px] w-24 bg-gray-200 mx-auto" />
                <p className="text-xl font-hand text-gray-300 italic">Ready for your new words.</p>
            </div>
            )}

            <div className="space-y-0">
            {activePage.entries.map((entry) => (
                <WordEntry key={entry.id} entry={entry} />
            ))}
            </div>

            <div className="relative mt-2">
            <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === ' ' && (e.preventDefault(), handleSpace())}
                placeholder={activePage.entries.length === 0 ? "Start typing word..." : "Add to list..."}
                className="w-full bg-transparent border-none outline-none text-2xl font-bold font-hand text-gray-700 placeholder-gray-100/50"
                style={{ lineHeight: '2.5rem', height: '2.5rem' }}
                autoComplete="off"
                spellCheck="false"
            />
            </div>

            {/* Pagination */}
            <div className="h-24 flex items-center justify-between mt-12 border-t border-gray-50 opacity-40">
               <button 
                 disabled={workspace.activePageIndex === 0}
                 onClick={() => handlePageTurn(workspace.activePageIndex - 1)}
                 className="group flex flex-col items-start transition-all disabled:opacity-0"
               >
                 <span className="text-gray-300 text-[9px] uppercase tracking-[0.3em] font-bold group-hover:text-red-400">Previous</span>
                 <span className="text-xl font-hand text-gray-400 group-hover:text-red-400">← Turn Back</span>
               </button>
               
               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => workspace.activePageIndex === activeNotebook.pages.length - 1 ? addNewPage() : handlePageTurn(workspace.activePageIndex + 1)}
                   className="group flex flex-col items-end transition-all"
                 >
                   <span className="text-gray-300 text-[9px] uppercase tracking-[0.3em] font-bold group-hover:text-red-400">
                     {workspace.activePageIndex === activeNotebook.pages.length - 1 ? "New Page" : "Next"}
                   </span>
                   <span className="text-xl font-hand text-gray-400 group-hover:text-red-400">
                     {workspace.activePageIndex === activeNotebook.pages.length - 1 ? "+ Scribble More" : "Forward →"}
                   </span>
                 </button>
               </div>
            </div>
        </div>
        
        {/* Page Footer */}
        <div className="absolute bottom-5 right-12 flex items-center gap-4 z-10">
            <div className="relative group">
              <input 
                type="number"
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (handlePageTurn(parseInt(jumpPage) - 1), setJumpPage(''))}
                placeholder="Pg"
                className="w-8 bg-transparent border-b border-gray-200 text-[11px] font-sans text-center outline-none focus:border-red-400 transition-colors placeholder-gray-200"
              />
            </div>
            <div className="text-3xl font-hand text-gray-300/60 select-none pb-1 border-b-2 border-red-50">#{activePage.pageNumber}</div>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
      </main>

      {/* MODALS */}

      {/* New Notebook Modal */}
      {isNewNbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-lg notepad-paper border-t-[12px] border-red-400 p-8 shadow-2xl transform animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-bold font-hand text-gray-700 mb-6 underline decoration-red-200 decoration-4">New Notebook</h2>
            <form onSubmit={handleCreateNotebook} className="space-y-6">
              <input 
                ref={newNbInputRef}
                type="text"
                placeholder="Name your book..."
                value={newNbTitle}
                onChange={(e) => setNewNbTitle(e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-100 focus:border-red-400 outline-none py-3 px-1 font-hand text-2xl text-gray-700 transition-colors"
                maxLength={30}
              />
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setIsNewNbModalOpen(false)} className="text-xs uppercase tracking-widest text-gray-400 font-bold hover:text-gray-600 transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-red-400 text-white font-bold rounded-lg uppercase tracking-widest text-xs shadow-lg hover:bg-red-500 transition-all active:scale-95">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Notebook Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-lg notepad-paper border-t-[12px] border-blue-400 p-8 shadow-2xl transform animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-bold font-hand text-gray-700 mb-6 underline decoration-blue-200 decoration-4">Rename Book</h2>
            <form onSubmit={handleRenameNotebook} className="space-y-6">
              <input 
                ref={renameInputRef}
                type="text"
                placeholder="Rename your book..."
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-100 focus:border-blue-400 outline-none py-3 px-1 font-hand text-2xl text-gray-700 transition-colors"
                maxLength={30}
              />
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => { setIsRenameModalOpen(false); setRenameTargetId(null); }} className="text-xs uppercase tracking-widest text-gray-400 font-bold hover:text-gray-600 transition-colors">Discard</button>
                <button type="submit" className="px-8 py-3 bg-blue-500 text-white font-bold rounded-lg uppercase tracking-widest text-xs shadow-lg hover:bg-blue-600 transition-all active:scale-95">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-lg notepad-paper border-t-[12px] border-red-600 p-8 shadow-2xl transform animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-bold font-hand text-red-600 mb-4 underline decoration-red-100 decoration-4">Burn Book?</h2>
            <p className="text-gray-500 font-hand text-lg mb-8 italic">Are you sure you want to burn this notebook? All pages and ink within will be lost forever.</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} 
                className="px-6 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-colors"
              >
                Keep it
              </button>
              <button 
                onClick={confirmDeleteNotebook} 
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Burn it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-lg notepad-paper border-t-[12px] border-emerald-400 p-8 shadow-2xl">
            <h2 className="text-3xl font-bold font-hand text-gray-700 mb-2 underline decoration-emerald-200 decoration-4">Key Setup</h2>
            <p className="text-gray-400 font-hand text-lg mb-6 italic leading-snug">The ink needs power. Connect your Gemini API key to start studying.</p>
            <input 
              type="password"
              placeholder="Paste Gemini Key..."
              value={userKey}
              onChange={(e) => setUserKey(e.target.value)}
              className="w-full bg-gray-50 border-b-2 border-gray-100 focus:border-emerald-400 outline-none py-3 px-2 font-mono text-sm mb-8 transition-colors"
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsApiModalOpen(false)} className="text-xs uppercase tracking-widest text-gray-400 font-bold hover:text-gray-600 transition-colors">Later</button>
              <button onClick={saveApiKey} className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-lg shadow-lg hover:bg-emerald-600 transition-all active:scale-95 uppercase tracking-widest text-xs">Save Key</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="mt-10 flex flex-col items-center gap-3 pb-10">
        <div className="text-gray-400 text-[10px] font-sans tracking-[0.4em] uppercase opacity-60 flex items-center gap-4">
          <span>{workspace.notebooks.length} Active Books</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-200" />
          <span>Page {activePage.pageNumber}</span>
        </div>
        <a href="https://mirmohmmadluqman.github.io/portfolio/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-gray-400 hover:text-gray-600 transition-all duration-300 grayscale hover:grayscale-0">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">Curated by Luqman</span>
          <div className="p-2 rounded-full border border-gray-200 group-hover:border-red-200 group-hover:bg-red-50 transition-all">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          </div>
        </a>
      </footer>
    </div>
  );
};

export default App;
