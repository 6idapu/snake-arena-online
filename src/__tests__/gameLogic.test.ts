import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  generateFood,
  generateBoost,
  generatePenalty,
  getNextHeadPosition,
  wrapPosition,
  isCollisionWithSelf,
  isCollisionWithWalls,
  isOppositeDirection,
  updateGameState,
  getSmartDirection,
  GRID_SIZE,
  Position,
  Direction,
} from '../lib/gameLogic';

describe('gameLogic', () => {
  describe('createInitialState', () => {
    it('should create initial state with walls mode', () => {
      const state = createInitialState('walls');
      expect(state.mode).toBe('walls');
      expect(state.snake.length).toBe(3);
      expect(state.score).toBe(0);
      expect(state.gameOver).toBe(false);
      expect(state.direction).toBe('right');
    });

    it('should create initial state with passthrough mode', () => {
      const state = createInitialState('passthrough');
      expect(state.mode).toBe('passthrough');
    });
  });

  describe('generateFood', () => {
    it('should generate food not on snake', () => {
      const snake: Position[] = [{ x: 5, y: 5 }];
      const food = generateFood(snake, GRID_SIZE);
      
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(GRID_SIZE.width);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(GRID_SIZE.height);
      
      const onSnake = snake.some(seg => seg.x === food.x && seg.y === food.y);
      expect(onSnake).toBe(false);
    });
  });

  describe('getNextHeadPosition', () => {
    it('should move up correctly', () => {
      const head: Position = { x: 5, y: 5 };
      const next = getNextHeadPosition(head, 'up');
      expect(next).toEqual({ x: 5, y: 4 });
    });

    it('should move down correctly', () => {
      const head: Position = { x: 5, y: 5 };
      const next = getNextHeadPosition(head, 'down');
      expect(next).toEqual({ x: 5, y: 6 });
    });

    it('should move left correctly', () => {
      const head: Position = { x: 5, y: 5 };
      const next = getNextHeadPosition(head, 'left');
      expect(next).toEqual({ x: 4, y: 5 });
    });

    it('should move right correctly', () => {
      const head: Position = { x: 5, y: 5 };
      const next = getNextHeadPosition(head, 'right');
      expect(next).toEqual({ x: 6, y: 5 });
    });
  });

  describe('wrapPosition', () => {
    it('should wrap position when going left past edge', () => {
      const pos: Position = { x: -1, y: 5 };
      const wrapped = wrapPosition(pos, GRID_SIZE);
      expect(wrapped).toEqual({ x: GRID_SIZE.width - 1, y: 5 });
    });

    it('should wrap position when going right past edge', () => {
      const pos: Position = { x: GRID_SIZE.width, y: 5 };
      const wrapped = wrapPosition(pos, GRID_SIZE);
      expect(wrapped).toEqual({ x: 0, y: 5 });
    });

    it('should wrap position when going up past edge', () => {
      const pos: Position = { x: 5, y: -1 };
      const wrapped = wrapPosition(pos, GRID_SIZE);
      expect(wrapped).toEqual({ x: 5, y: GRID_SIZE.height - 1 });
    });

    it('should wrap position when going down past edge', () => {
      const pos: Position = { x: 5, y: GRID_SIZE.height };
      const wrapped = wrapPosition(pos, GRID_SIZE);
      expect(wrapped).toEqual({ x: 5, y: 0 });
    });
  });

  describe('isCollisionWithSelf', () => {
    it('should detect collision with self', () => {
      const head: Position = { x: 5, y: 5 };
      const snake: Position[] = [{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }];
      expect(isCollisionWithSelf(head, snake)).toBe(true);
    });

    it('should not detect collision when not colliding', () => {
      const head: Position = { x: 5, y: 5 };
      const snake: Position[] = [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }];
      expect(isCollisionWithSelf(head, snake)).toBe(false);
    });
  });

  describe('isCollisionWithWalls', () => {
    it('should detect collision with left wall', () => {
      const pos: Position = { x: -1, y: 5 };
      expect(isCollisionWithWalls(pos, GRID_SIZE)).toBe(true);
    });

    it('should detect collision with right wall', () => {
      const pos: Position = { x: GRID_SIZE.width, y: 5 };
      expect(isCollisionWithWalls(pos, GRID_SIZE)).toBe(true);
    });

    it('should detect collision with top wall', () => {
      const pos: Position = { x: 5, y: -1 };
      expect(isCollisionWithWalls(pos, GRID_SIZE)).toBe(true);
    });

    it('should detect collision with bottom wall', () => {
      const pos: Position = { x: 5, y: GRID_SIZE.height };
      expect(isCollisionWithWalls(pos, GRID_SIZE)).toBe(true);
    });

    it('should not detect collision when within bounds', () => {
      const pos: Position = { x: 5, y: 5 };
      expect(isCollisionWithWalls(pos, GRID_SIZE)).toBe(false);
    });
  });

  describe('isOppositeDirection', () => {
    it('should detect up-down as opposite', () => {
      expect(isOppositeDirection('up', 'down')).toBe(true);
      expect(isOppositeDirection('down', 'up')).toBe(true);
    });

    it('should detect left-right as opposite', () => {
      expect(isOppositeDirection('left', 'right')).toBe(true);
      expect(isOppositeDirection('right', 'left')).toBe(true);
    });

    it('should not detect perpendicular as opposite', () => {
      expect(isOppositeDirection('up', 'left')).toBe(false);
      expect(isOppositeDirection('down', 'right')).toBe(false);
    });
  });

  describe('updateGameState', () => {
    it('should move snake forward', () => {
      const state = createInitialState('walls');
      const newState = updateGameState(state);
      
      expect(newState.snake[0].x).toBe(state.snake[0].x + 1);
      expect(newState.snake.length).toBe(state.snake.length);
    });

    it('should not allow opposite direction change', () => {
      const state = createInitialState('walls');
      state.direction = 'right';
      const newState = updateGameState(state, 'left');
      
      expect(newState.direction).toBe('right');
    });

    it('should grow snake when eating food', () => {
      const state = createInitialState('walls');
      state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
      
      const newState = updateGameState(state);
      
      expect(newState.snake.length).toBe(state.snake.length + 1);
      expect(newState.score).toBeGreaterThan(state.score);
    });

    it('should end game on wall collision in walls mode', () => {
      const state = createInitialState('walls');
      state.snake = [{ x: 0, y: 5 }, { x: 1, y: 5 }];
      state.direction = 'left';
      
      const newState = updateGameState(state);
      
      expect(newState.gameOver).toBe(true);
    });

    it('should wrap around in passthrough mode', () => {
      const state = createInitialState('passthrough');
      state.snake = [{ x: 0, y: 5 }, { x: 1, y: 5 }];
      state.direction = 'left';
      
      const newState = updateGameState(state);
      
      expect(newState.gameOver).toBe(false);
      expect(newState.snake[0].x).toBe(GRID_SIZE.width - 1);
    });

    it('should end game on self collision', () => {
      const state = createInitialState('walls');
      state.snake = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
      ];
      state.direction = 'down';
      
      const newState = updateGameState(state, 'right');
      const newerState = updateGameState(newState, 'up');
      
      expect(newerState.gameOver).toBe(true);
    });
  });

  describe('getSmartDirection', () => {
    it('should move toward food', () => {
      const snake: Position[] = [{ x: 5, y: 5 }];
      const food: Position = { x: 10, y: 5 };
      
      const direction = getSmartDirection(snake, food, 'up', 'walls', GRID_SIZE);
      
      expect(direction).toBe('right');
    });

    it('should avoid walls in walls mode', () => {
      const snake: Position[] = [{ x: 0, y: 0 }];
      const food: Position = { x: 10, y: 10 };
      
      const direction = getSmartDirection(snake, food, 'right', 'walls', GRID_SIZE);
      
      expect(direction).not.toBe('left');
      expect(direction).not.toBe('up');
    });

    it('should avoid self collision', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
      ];
      const food: Position = { x: 10, y: 10 };
      
      const direction = getSmartDirection(snake, food, 'right', 'walls', GRID_SIZE);
      
      // Should not go down into its own body
      expect(direction).not.toBe('down');
    });
  });

  describe('Boosts and Penalties', () => {
    it('should generate boost at unoccupied position', () => {
      const snake: Position[] = [{ x: 12, y: 12 }];
      const food: Position = { x: 10, y: 10 };
      const boost = generateBoost(snake, food, GRID_SIZE, [], []);
      
      expect(boost.position.x).toBeGreaterThanOrEqual(0);
      expect(boost.position.x).toBeLessThan(GRID_SIZE.width);
      expect(boost.position.y).toBeGreaterThanOrEqual(0);
      expect(boost.position.y).toBeLessThan(GRID_SIZE.height);
      expect(boost.type).toMatch(/^(speed|points)$/);
      expect(boost.duration).toBeGreaterThan(0);
    });

    it('should generate penalty at unoccupied position', () => {
      const snake: Position[] = [{ x: 12, y: 12 }];
      const food: Position = { x: 10, y: 10 };
      const penalty = generatePenalty(snake, food, GRID_SIZE, [], []);
      
      expect(penalty.position.x).toBeGreaterThanOrEqual(0);
      expect(penalty.position.x).toBeLessThan(GRID_SIZE.width);
      expect(penalty.position.y).toBeGreaterThanOrEqual(0);
      expect(penalty.position.y).toBeLessThan(GRID_SIZE.height);
      expect(penalty.points).toBeLessThan(0);
    });

    it('should apply points multiplier when points boost is active', () => {
      const state = createInitialState('walls');
      const stateWithBoost = {
        ...state,
        activeBoosts: [{ type: 'points' as const, remaining: 10 }],
        food: { x: 13, y: 12 },
      };
      
      const newState = updateGameState(stateWithBoost, 'right');
      expect(newState.score).toBe(20); // 10 * 2
    });

    it('should collect boost when snake head hits it', () => {
      const state = createInitialState('walls');
      const stateWithBoost = {
        ...state,
        boosts: [{ position: { x: 13, y: 12 }, type: 'speed' as const, duration: 50 }],
      };
      
      const newState = updateGameState(stateWithBoost, 'right');
      expect(newState.boosts.length).toBe(0);
      expect(newState.activeBoosts.length).toBe(1);
      expect(newState.activeBoosts[0].type).toBe('speed');
    });

    it('should lose points when hitting penalty', () => {
      const state = createInitialState('walls');
      const stateWithPenalty = {
        ...state,
        score: 50,
        penalties: [{ position: { x: 13, y: 12 }, points: -20 }],
      };
      
      const newState = updateGameState(stateWithPenalty, 'right');
      expect(newState.score).toBe(30);
      expect(newState.penalties.length).toBe(0);
    });

    it('should not allow score to go below 0', () => {
      const state = createInitialState('walls');
      const stateWithPenalty = {
        ...state,
        score: 10,
        penalties: [{ position: { x: 13, y: 12 }, points: -20 }],
      };
      
      const newState = updateGameState(stateWithPenalty, 'right');
      expect(newState.score).toBe(0);
    });

    it('should decrease active boost duration each tick', () => {
      const state = createInitialState('walls');
      const stateWithBoost = {
        ...state,
        activeBoosts: [{ type: 'speed' as const, remaining: 5 }],
      };
      
      const newState = updateGameState(stateWithBoost, 'right');
      expect(newState.activeBoosts[0].remaining).toBe(4);
    });

    it('should remove expired boosts', () => {
      const state = createInitialState('walls');
      const stateWithBoost = {
        ...state,
        activeBoosts: [{ type: 'speed' as const, remaining: 1 }],
      };
      
      const newState = updateGameState(stateWithBoost, 'right');
      expect(newState.activeBoosts.length).toBe(0);
    });
  });
});
