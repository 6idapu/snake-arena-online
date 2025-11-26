import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Direction, GameMode, createInitialState, updateGameState } from '@/lib/gameLogic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SnakeGameProps {
  mode: GameMode;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

const CELL_SIZE = 20;
const GAME_SPEED = 150;

export const SnakeGame = ({ mode, onScoreChange, onGameOver }: SnakeGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(mode));
  const [isPaused, setIsPaused] = useState(true);
  const [nextDirection, setNextDirection] = useState<Direction>('right');
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const drawGame = useCallback((state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(230, 25%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'hsl(230, 20%, 15%)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= state.gridSize.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, state.gridSize.height * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= state.gridSize.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(state.gridSize.width * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food with glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'hsl(100, 100%, 50%)';
    ctx.fillStyle = 'hsl(100, 100%, 50%)';
    ctx.fillRect(
      state.food.x * CELL_SIZE + 2,
      state.food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );

    // Draw snake with gradient
    ctx.shadowBlur = 10;
    state.snake.forEach((segment, index) => {
      const alpha = 1 - (index / state.snake.length) * 0.5;
      if (index === 0) {
        ctx.shadowColor = 'hsl(185, 100%, 50%)';
        ctx.fillStyle = 'hsl(185, 100%, 50%)';
      } else {
        ctx.shadowColor = 'hsl(320, 100%, 50%)';
        ctx.fillStyle = `hsla(320, 100%, 50%, ${alpha})`;
      }
      
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    ctx.shadowBlur = 0;
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState.gameOver) return;

    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
    };

    const direction = keyMap[e.key];
    if (direction) {
      e.preventDefault();
      setNextDirection(direction);
      
      if (isPaused) {
        setIsPaused(false);
      }
    }

    if (e.key === ' ') {
      e.preventDefault();
      setIsPaused(p => !p);
    }
  }, [gameState.gameOver, isPaused]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (isPaused || gameState.gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setGameState(prevState => {
        const newState = updateGameState(prevState, nextDirection);
        
        if (newState.gameOver && !prevState.gameOver) {
          onGameOver?.(newState.score);
        }
        
        if (newState.score !== prevState.score) {
          onScoreChange?.(newState.score);
        }
        
        return newState;
      });
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPaused, gameState.gameOver, nextDirection, onScoreChange, onGameOver]);

  useEffect(() => {
    drawGame(gameState);
  }, [gameState, drawGame]);

  useEffect(() => {
    setGameState(createInitialState(mode));
    setIsPaused(true);
    setNextDirection('right');
  }, [mode]);

  const handleReset = () => {
    setGameState(createInitialState(mode));
    setIsPaused(true);
    setNextDirection('right');
  };

  const handleTogglePause = () => {
    setIsPaused(p => !p);
  };

  return (
    <Card className="p-6 bg-card border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary/30 text-primary font-bold text-lg px-4 py-1">
            Score: {gameState.score}
          </Badge>
          <Badge variant="outline" className="border-secondary/30 text-secondary">
            {mode === 'walls' ? '🧱 Walls' : '🌀 Pass-through'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleTogglePause}
            disabled={gameState.gameOver}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            onClick={handleReset}
            variant="outline"
            className="border-secondary/30 hover:bg-secondary/10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={gameState.gridSize.width * CELL_SIZE}
          height={gameState.gridSize.height * CELL_SIZE}
          className="border-2 border-primary/20 rounded-lg shadow-lg"
        />
        
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-destructive to-secondary bg-clip-text text-transparent">
                Game Over!
              </div>
              <div className="text-2xl text-muted-foreground">
                Final Score: <span className="text-primary font-bold">{gameState.score}</span>
              </div>
              <Button onClick={handleReset} className="bg-primary hover:bg-primary/90">
                Play Again
              </Button>
            </div>
          </div>
        )}
        
        {isPaused && !gameState.gameOver && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">Paused</div>
              <div className="text-sm text-muted-foreground">Press SPACE or click Play to start</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground text-center">
        Use Arrow Keys or WASD to move • SPACE to pause
      </div>
    </Card>
  );
};
