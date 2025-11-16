import languagesData from './languages.json';

export interface Language {
  name: string;
  category: 'Standard' | 'Exotic' | 'Secret' | 'Dialect';
  typicalSpeakers: string;
  description: string;
  implementationNotes: string;
}

export const LANGUAGES: Language[] = languagesData as Language[];

export const getLanguagesByCategory = (category: Language['category']): Language[] => {
  return LANGUAGES.filter(lang => lang.category === category);
};

export const getLanguageByName = (name: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.name === name);
};