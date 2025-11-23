export interface UserState {
  xp: number;
  level: number;
  streak: number;
  name: string;
  badges: string[];
  stats: {
    storiesRead: number;
    quizzesTaken: number;
    grammarMastered: number;
    wordsLearned: number;
    readingTimeMinutes: number;
  };
  tutorFeedback: string[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    time: string;
    xp: number;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioData?: string; // base64
  correction?: {
    original: string;
    corrected: string;
    explanation: string;
  };
}

export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export enum AppRoute {
  HOME = 'home',
  TUTOR = 'tutor',
  CHAT = 'chat',
  GAMES = 'games',
  GRAMMAR = 'grammar',
  STORY = 'story',
  READING = 'reading',
  PARENTS = 'parents'
}

export interface LiveConnectionState {
  isConnected: boolean;
  isSpeaking: boolean;
  error: string | null;
  volume: number;
}