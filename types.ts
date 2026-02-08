
export interface WordDefinition {
  word: string;
  english: string;
  urdu: string;
  isLoading: boolean;
  error?: string;
  id: string;
}

export interface DefinitionResponse {
  english: string;
  urdu: string;
}

export interface Page {
  id: string;
  pageNumber: number;
  entries: WordDefinition[];
}

export interface Notebook {
  id: string;
  title: string;
  pages: Page[];
  createdAt: number;
}

export interface Workspace {
  notebooks: Notebook[];
  activeNotebookId: string;
  activePageIndex: number;
}
