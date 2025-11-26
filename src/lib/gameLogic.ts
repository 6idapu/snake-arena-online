// Pure game logic functions - fully testable

export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameMode = 'passthrough' | 'walls';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  snake: Position[];
  direction: Direction;
  food: Position;
  score: number;
  gameOver: boolean;
  mode: GameMode;
  gridSize: { width: number; height: number };
}

export const GRID_SIZE = { width: 25, height: 25 };
export const INITIAL_SNAKE: Position[] = [
  { x: 12, y: 12 },
  { x: 11, y: 12 },
  { x: 10, y: 12 },
];

export const createInitialState = (mode: GameMode = 'walls'): GameState => ({
  snake: [...INITIAL_SNAKE],
  direction: 'right',
  food: generateFood(INITIAL_SNAKE, GRID_SIZE),
  score: 0,
  gameOver: false,
  mode,
  gridSize: GRID_SIZE,
});

export const generateFood = (snake: Position[], gridSize: { width: number; height: number }): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * gridSize.width),
      y: Math.floor(Math.random() * gridSize.height),
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  
  return food;
};

export const getNextHeadPosition = (head: Position, direction: Direction): Position => {
  const nextHead = { ...head };
  
  switch (direction) {
    case 'up':
      nextHead.y -= 1;
      break;
    case 'down':
      nextHead.y += 1;
      break;
    case 'left':
      nextHead.x -= 1;
      break;
    case 'right':
      nextHead.x += 1;
      break;
  }
  
  return nextHead;
};

export const wrapPosition = (pos: Position, gridSize: { width: number; height: number }): Position => {
  return {
    x: (pos.x + gridSize.width) % gridSize.width,
    y: (pos.y + gridSize.height) % gridSize.height,
  };
};

export const isCollisionWithSelf = (head: Position, snake: Position[]): boolean => {
  return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
};

export const isCollisionWithWalls = (head: Position, gridSize: { width: number; height: number }): boolean => {
  return head.x < 0 || head.x >= gridSize.width || head.y < 0 || head.y >= gridSize.height;
};

export const isOppositeDirection = (current: Direction, next: Direction): boolean => {
  return (
    (current === 'up' && next === 'down') ||
    (current === 'down' && next === 'up') ||
    (current === 'left' && next === 'right') ||
    (current === 'right' && next === 'left')
  );
};

export const updateGameState = (state: GameState, newDirection?: Direction): GameState => {
  // Update direction if provided and valid
  let direction = state.direction;
  if (newDirection && !isOppositeDirection(state.direction, newDirection)) {
    direction = newDirection;
  }
  
  const head = state.snake[0];
  let nextHead = getNextHeadPosition(head, direction);
  
  // Handle game mode
  if (state.mode === 'passthrough') {
    nextHead = wrapPosition(nextHead, state.gridSize);
  } else if (state.mode === 'walls') {
    if (isCollisionWithWalls(nextHead, state.gridSize)) {
      return { ...state, gameOver: true };
    }
  }
  
  // Check self-collision
  if (isCollisionWithSelf(nextHead, state.snake)) {
    return { ...state, gameOver: true };
  }
  
  const newSnake = [nextHead, ...state.snake];
  let newFood = state.food;
  let newScore = state.score;
  
  // Check if food is eaten
  if (nextHead.x === state.food.x && nextHead.y === state.food.y) {
    newScore += 10;
    newFood = generateFood(newSnake, state.gridSize);
  } else {
    newSnake.pop();
  }
  
  return {
    ...state,
    snake: newSnake,
    direction,
    food: newFood,
    score: newScore,
  };
};

export const getRandomDirection = (): Direction => {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  return directions[Math.floor(Math.random() * directions.length)];
};

export const getSmartDirection = (snake: Position[], food: Position, currentDirection: Direction, mode: GameMode, gridSize: { width: number; height: number }): Direction => {
  const head = snake[0];
  const possibleDirections: Direction[] = ['up', 'down', 'left', 'right'];
  
  // Filter out opposite direction
  const validDirections = possibleDirections.filter(dir => !isOppositeDirection(currentDirection, dir));
  
  // Score each direction
  const scoredDirections = validDirections.map(dir => {
    const nextPos = getNextHeadPosition(head, dir);
    const wrappedPos = mode === 'passthrough' ? wrapPosition(nextPos, gridSize) : nextPos;
    
    // Check for collisions
    if (mode === 'walls' && isCollisionWithWalls(wrappedPos, gridSize)) {
      return { direction: dir, score: -1000 };
    }
    
    if (isCollisionWithSelf(wrappedPos, snake)) {
      return { direction: dir, score: -500 };
    }
    
    // Calculate distance to food
    const distance = Math.abs(wrappedPos.x - food.x) + Math.abs(wrappedPos.y - food.y);
    
    return { direction: dir, score: -distance };
  });
  
  // Sort by score and pick best
  scoredDirections.sort((a, b) => b.score - a.score);
  
  return scoredDirections[0]?.direction || currentDirection;
};
