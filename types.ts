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
