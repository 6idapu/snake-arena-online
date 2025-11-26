import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SnakeGame } from '@/components/Game/SnakeGame';
import { LeaderboardPanel } from '@/components/Leaderboard/LeaderboardPanel';
import { SpectatorView } from '@/components/Spectator/SpectatorView';
import { AuthModal } from '@/components/Auth/AuthModal';
import { mockApi } from '@/services/mockApi';
import { GameMode } from '@/lib/gameLogic';
import { LogIn, LogOut, Trophy, Eye, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [user, setUser] = useState(mockApi.auth.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('walls');
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    setUser(mockApi.auth.getCurrentUser());
  }, []);

  const handleAuthSuccess = () => {
    setUser(mockApi.auth.getCurrentUser());
  };

  const handleLogout = async () => {
    await mockApi.auth.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleGameOver = async (score: number) => {
    if (user) {
      try {
        await mockApi.leaderboard.submitScore(score, gameMode);
        toast.success('Score submitted to leaderboard!');
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Gamepad2 className="w-10 h-10 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                NEON SNAKE
              </h1>
              <p className="text-sm text-muted-foreground">Multiplayer Arcade Classic</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Badge variant="outline" className="border-primary/30 text-primary px-4 py-2">
                  {user.username}
                </Badge>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <Tabs defaultValue="play" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-card border border-primary/20">
            <TabsTrigger value="play" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Play
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="spectate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Eye className="w-4 h-4 mr-2" />
              Watch
            </TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="space-y-6">
            <div className="grid md:grid-cols-[1fr,300px] gap-6">
              <div className="space-y-4">
                <div className="flex gap-2 justify-center">
                  <Button
                    variant={gameMode === 'walls' ? 'default' : 'outline'}
                    onClick={() => setGameMode('walls')}
                    className={gameMode === 'walls' ? 'bg-primary' : 'border-primary/30'}
                  >
                    🧱 Walls Mode
                  </Button>
                  <Button
                    variant={gameMode === 'passthrough' ? 'default' : 'outline'}
                    onClick={() => setGameMode('passthrough')}
                    className={gameMode === 'passthrough' ? 'bg-primary' : 'border-primary/30'}
                  >
                    🌀 Pass-through Mode
                  </Button>
                </div>

                <SnakeGame
                  mode={gameMode}
                  onScoreChange={setCurrentScore}
                  onGameOver={handleGameOver}
                />
              </div>

              <div>
                <LeaderboardPanel mode={gameMode} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="max-w-2xl mx-auto">
            <LeaderboardPanel />
          </TabsContent>

          <TabsContent value="spectate" className="max-w-2xl mx-auto">
            <SpectatorView />
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
