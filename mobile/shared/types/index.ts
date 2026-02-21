
export type Role = 'user' | 'model';

export type AnalysisMode = 'integrated' | 'blood' | 'mbti' | 'saju' | 'face' | 'couple' | 'zodiac' | 'unified';

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export type CalendarType = 'solar' | 'lunar';

export interface PersonData {
  name: string;
  birthDate: string; // YYYY-MM-DD
  calendarType: CalendarType; // Added: Solar or Lunar
  birthTime: string; // HH:mm
  birthPlace: string;
  bloodType: string;
  mbti: string;
  gender: 'male' | 'female' | 'other';
  faceFeatures?: string; // Pre-analyzed text description of the face
  zodiacSign?: ZodiacSign; // Calculated from birthDate
}

export interface UserProfile extends PersonData {
  residence: string; // Current residence
  faceImage?: string; // Transient Base64 string (Deleted immediately after analysis)
  partner?: PersonData; // Partner data including faceFeatures
}

export interface SystemPromptConfig {
  mode: AnalysisMode;
  userProfile: UserProfile;
}

export interface ChatState {
  depthScore: number; // 0 to 100
  isReadyForRevelation: boolean; // true if score >= 70
}
