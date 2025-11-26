// Centralized mock API service - all backend calls go through here

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  mode: 'passthrough' | 'walls';
  date: string;
}

export interface ActivePlayer {
  id: string;
  username: string;
  score: number;
  position: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
  snake: Array<{ x: number; y: number }>;
}

// Mock storage
const mockUsers: User[] = [
  { id: '1', username: 'SnakeMaster', email: 'master@snake.io' },
  { id: '2', username: 'CyberViper', email: 'viper@snake.io' },
  { id: '3', username: 'NeonSerpent', email: 'neon@snake.io' },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { id: '1', username: 'SnakeMaster', score: 8500, mode: 'walls', date: '2025-11-25' },
  { id: '2', username: 'CyberViper', score: 7200, mode: 'passthrough', date: '2025-11-25' },
  { id: '3', username: 'NeonSerpent', score: 6800, mode: 'walls', date: '2025-11-24' },
  { id: '4', username: 'GridGhost', score: 5900, mode: 'passthrough', date: '2025-11-24' },
  { id: '5', username: 'ByteBoa', score: 5400, mode: 'walls', date: '2025-11-23' },
];

let currentUser: User | null = null;
let mockActivePlayers: ActivePlayer[] = [];

// Auth API
export const mockApi = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      const user = mockUsers.find(u => u.email === email);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      currentUser = user;
      return { user, token: 'mock-jwt-token-' + user.id };
    },

    signup: async (username: string, email: string, password: string): Promise<{ user: User; token: string }> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mockUsers.find(u => u.email === email)) {
        throw new Error('Email already exists');
      }
      
      const newUser: User = {
        id: String(mockUsers.length + 1),
        username,
        email,
      };
      
      mockUsers.push(newUser);
      currentUser = newUser;
      return { user: newUser, token: 'mock-jwt-token-' + newUser.id };
    },

    logout: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      currentUser = null;
    },

    getCurrentUser: (): User | null => {
      return currentUser;
    },
  },

  leaderboard: {
    getTopScores: async (mode?: 'passthrough' | 'walls'): Promise<LeaderboardEntry[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = [...mockLeaderboard];
      if (mode) {
        filtered = filtered.filter(entry => entry.mode === mode);
      }
      
      return filtered.sort((a, b) => b.score - a.score).slice(0, 10);
    },

    submitScore: async (score: number, mode: 'passthrough' | 'walls'): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (!currentUser) {
        throw new Error('Must be logged in to submit score');
      }
      
      const newEntry: LeaderboardEntry = {
        id: String(mockLeaderboard.length + 1),
        username: currentUser.username,
        score,
        mode,
        date: new Date().toISOString().split('T')[0],
      };
      
      mockLeaderboard.push(newEntry);
    },
  },

  spectator: {
    getActivePlayers: async (): Promise<ActivePlayer[]> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Generate mock active players if none exist
      if (mockActivePlayers.length === 0) {
        mockActivePlayers = [
          {
            id: '2',
            username: 'CyberViper',
            score: 450,
            position: { x: 10, y: 10 },
            direction: 'right',
            snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
          },
          {
            id: '3',
            username: 'NeonSerpent',
            score: 320,
            position: { x: 15, y: 15 },
            direction: 'down',
            snake: [{ x: 15, y: 15 }, { x: 15, y: 14 }, { x: 15, y: 13 }],
          },
        ];
      }
      
      return mockActivePlayers;
    },

    watchPlayer: async (playerId: string): Promise<ActivePlayer | null> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const player = mockActivePlayers.find(p => p.id === playerId);
      return player || null;
    },
  },
};

// Helper to update active player (for AI simulation)
export const updateActivePlayer = (playerId: string, updates: Partial<ActivePlayer>): void => {
  const index = mockActivePlayers.findIndex(p => p.id === playerId);
  if (index !== -1) {
    mockActivePlayers[index] = { ...mockActivePlayers[index], ...updates };
  }
};
