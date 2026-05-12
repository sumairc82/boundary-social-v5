export type TemplateId = 'matchday' | 'results' | 'performer' | 'signing' | 'weekend' | 'squad' | 'notice' | 'sponsor' | 'custom';
export type StyleId = 'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'|'l'|'m'|'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z'|'aa'|'ab'|'ac'|'ad'|'ae'|'af'|'ag'|'ah'|'ai'|'aj'|'ak'|'al'|'am'|'an'|'ao'|'ap'|'aq'|'ar'|'as'|'at'|'au'|'av'|'aw'|'ax'|'ay'|'az'|'ba'|'bb'|'bc'|'bd'|'be'|'bf'|'bg'|'bh'|'bi'|'bj';

export interface AppState {
  template: TemplateId;
  style: StyleId;
  palette: string;
  clubName: string;
  clubTagline: string;
  logoDataUrl: string;
  titleTop: string;
  titleBottom: string;
  tournamentText: string;
  // matchday / custom
  matchHome: string;
  matchAway: string;
  matchDate: string;
  matchTime: string;
  matchVenue: string;
  details: string[]; // up to 5
  // results
  results: { outcome: 'W'|'L'|'NR'; innings1: string; innings2: string; resultLine: string }[];
  resultCount: number;
  // performer
  players: { name: string; role: string; stat: string; photoDataUrl: string }[];
  playerCount: number;
  // signing
  signingName: string;
  signingRole: string;
  signingNote: string;
  signingPhotoDataUrl: string;
  // weekend fixtures
  fixtures: { badge: string; homeTeam: string; awayTeam: string; time: string; date: string; venue: string }[];
  // squad
  squadPlayers: { name: string; photoDataUrl: string }[];
  // notice
  noticeText: string;
  // sponsors
  sponsors: { name: string; logo: string }[];
  sponsorLayout: 'featured'|'compact'|'row'|'centred';
  sponsorCount: string;
  // adjustments (CSS vars)
  titleScale: number;    // 50-200, default 100
  fixtureScale: number;  // 50-200
  metaScale: number;     // 50-200
  badgeScale: number;    // 50-200
  sponsorScale: number;  // 35-200
  logoScale: number;     // 20-200
  topSpacing: number;    // 0-34
  bgOpacity: number;     // 0-100
  bgSize: number;        // 10-300
  bgPosX: number;        // 0-100
  bgPosY: number;        // 0-100
  mediaBrightness: number; // 80-200
  mediaContrast: number;   // 80-200
  mediaSaturate: number;   // 80-200
  bgImageDataUrl: string;
  customNavy: string;
  customBlue: string;
  customGold: string;
  textColor: string;
  accentColor: string;
  onboardingDone: boolean;
}
