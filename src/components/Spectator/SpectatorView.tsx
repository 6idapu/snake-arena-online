import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockApi, ActivePlayer } from '@/services/mockApi';
import { GameState, createInitialState, updateGameState, getSmartDirection } from '@/lib/gameLogic';
import { Eye, Users } from 'lucide-react';

const CELL_SIZE = 16;

export const SpectatorView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [watchingPlayer, setWatchingPlayer] = useState<ActivePlayer | null>(null);
  const [gameStates, setGameStates] = useState<Map<string, GameState>>(new Map());

  useEffect(() => {
    loadActivePlayers();
    const interval = setInterval(loadActivePlayers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activePlayers.length === 0) return;

    // Initialize game states for active players
    const newStates = new Map<string, GameState>();
    activePlayers.forEach(player => {
      if (!gameStates.has(player.id)) {
        const state = createInitialState('walls');
        state.snake = player.snake;
        state.score = player.score;
        newStates.set(player.id, state);
      } else {
        newStates.set(player.id, gameStates.get(player.id)!);
      }
    });
    setGameStates(newStates);

    // AI game loop
    const interval = setInterval(() => {
      setGameStates(prevStates => {
        const updatedStates = new Map(prevStates);
        
        activePlayers.forEach(player => {
          const state = updatedStates.get(player.id);
          if (!state || state.gameOver) return;

          // AI determines next move
          const smartDirection = getSmartDirection(
            state.snake,
            state.food,
            state.direction,
            state.mode,
            state.gridSize
          );

          const newState = updateGameState(state, smartDirection);
          updatedStates.set(player.id, newState);
        });

        return updatedStates;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [activePlayers]);

  useEffect(() => {
    if (watchingPlayer) {
      drawGame(watchingPlayer.id);
    }
  }, [gameStates, watchingPlayer]);

  const loadActivePlayers = async () => {
    try {
      const players = await mockApi.spectator.getActivePlayers();
      setActivePlayers(players);
      
      if (!watchingPlayer && players.length > 0) {
        setWatchingPlayer(players[0]);
      }
    } catch (error) {
      console.error('Failed to load active players:', error);
    }
  };

  const drawGame = (playerId: string) => {
    const canvas = canvasRef.current;
    const state = gameStates.get(playerId);
    if (!canvas || !state) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(230, 25%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'hsl(230, 20%, 15%)';
    ctx.lineWidth = 0.5;
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

    // Draw food
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'hsl(100, 100%, 50%)';
    ctx.fillStyle = 'hsl(100, 100%, 50%)';
    ctx.fillRect(
      state.food.x * CELL_SIZE + 2,
      state.food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );

    // Draw boosts
    state.boosts.forEach(boost => {
      ctx.shadowBlur = 15;
      if (boost.type === 'speed') {
        ctx.shadowColor = 'hsl(45, 100%, 50%)';
        ctx.fillStyle = 'hsl(45, 100%, 50%)';
      } else {
        ctx.shadowColor = 'hsl(280, 100%, 50%)';
        ctx.fillStyle = 'hsl(280, 100%, 50%)';
      }
      ctx.beginPath();
      ctx.arc(
        boost.position.x * CELL_SIZE + CELL_SIZE / 2,
        boost.position.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Draw penalties
    state.penalties.forEach(penalty => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'hsl(0, 100%, 50%)';
      ctx.fillStyle = 'hsl(0, 100%, 50%)';
      ctx.fillRect(
        penalty.position.x * CELL_SIZE + 2,
        penalty.position.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    });

    // Draw snake
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
  };

  return (
    <Card className="p-6 bg-card border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Watch Live Games
        </h2>
        <Badge variant="outline" className="border-accent/30 text-accent">
          <Users className="w-3 h-3 mr-1" />
          {activePlayers.length} Active
        </Badge>
      </div>

      {activePlayers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active players at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {activePlayers.map(player => (
              <Button
                key={player.id}
                size="sm"
                variant={watchingPlayer?.id === player.id ? 'default' : 'outline'}
                onClick={() => setWatchingPlayer(player)}
                className={watchingPlayer?.id === player.id ? 'bg-primary' : 'border-primary/30'}
              >
                {player.username}
              </Button>
            ))}
          </div>

          {watchingPlayer && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{watchingPlayer.username}</span>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary font-bold">
                  Score: {gameStates.get(watchingPlayer.id)?.score || 0}
                </Badge>
              </div>

              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="border-2 border-primary/20 rounded-lg shadow-lg w-full"
              />

              <p className="text-xs text-center text-muted-foreground">
                Watching {watchingPlayer.username} play in real-time
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
