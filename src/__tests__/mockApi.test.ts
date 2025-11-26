import { describe, it, expect, beforeEach } from 'vitest';
import { mockApi } from '../services/mockApi';

describe('mockApi', () => {
  describe('auth', () => {
    beforeEach(async () => {
      // Reset state
      await mockApi.auth.logout();
    });

    it('should login with valid credentials', async () => {
      const result = await mockApi.auth.login('master@snake.io', 'password');
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('master@snake.io');
      expect(result.token).toBeDefined();
    });

    it('should throw error on invalid login', async () => {
      await expect(
        mockApi.auth.login('invalid@email.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should signup new user', async () => {
      const result = await mockApi.auth.signup(
        'NewPlayer',
        'new@snake.io',
        'password123'
      );
      
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('NewPlayer');
      expect(result.user.email).toBe('new@snake.io');
    });

    it('should throw error on duplicate email signup', async () => {
      await expect(
        mockApi.auth.signup('Test', 'master@snake.io', 'password')
      ).rejects.toThrow('Email already exists');
    });

    it('should logout user', async () => {
      await mockApi.auth.login('master@snake.io', 'password');
      expect(mockApi.auth.getCurrentUser()).not.toBeNull();
      
      await mockApi.auth.logout();
      expect(mockApi.auth.getCurrentUser()).toBeNull();
    });

    it('should get current user', async () => {
      const { user } = await mockApi.auth.login('master@snake.io', 'password');
      const currentUser = mockApi.auth.getCurrentUser();
      
      expect(currentUser).toEqual(user);
    });
  });

  describe('leaderboard', () => {
    it('should get top scores', async () => {
      const scores = await mockApi.leaderboard.getTopScores();
      
      expect(Array.isArray(scores)).toBe(true);
      expect(scores.length).toBeGreaterThan(0);
      expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score);
    });

    it('should filter scores by mode', async () => {
      const wallsScores = await mockApi.leaderboard.getTopScores('walls');
      
      expect(wallsScores.every(s => s.mode === 'walls')).toBe(true);
    });

    it('should submit score when logged in', async () => {
      await mockApi.auth.login('master@snake.io', 'password');
      
      await expect(
        mockApi.leaderboard.submitScore(1000, 'walls')
      ).resolves.not.toThrow();
    });

    it('should throw error when submitting score without login', async () => {
      await mockApi.auth.logout();
      
      await expect(
        mockApi.leaderboard.submitScore(1000, 'walls')
      ).rejects.toThrow('Must be logged in');
    });
  });

  describe('spectator', () => {
    it('should get active players', async () => {
      const players = await mockApi.spectator.getActivePlayers();
      
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBeGreaterThan(0);
      
      if (players.length > 0) {
        expect(players[0]).toHaveProperty('username');
        expect(players[0]).toHaveProperty('score');
        expect(players[0]).toHaveProperty('snake');
      }
    });

    it('should watch specific player', async () => {
      const players = await mockApi.spectator.getActivePlayers();
      
      if (players.length > 0) {
        const player = await mockApi.spectator.watchPlayer(players[0].id);
        
        expect(player).not.toBeNull();
        expect(player?.id).toBe(players[0].id);
      }
    });

    it('should return null for non-existent player', async () => {
      const player = await mockApi.spectator.watchPlayer('non-existent-id');
      
      expect(player).toBeNull();
    });
  });
});
