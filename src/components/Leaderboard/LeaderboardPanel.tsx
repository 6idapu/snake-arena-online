import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockApi, LeaderboardEntry } from '@/services/mockApi';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardPanelProps {
  mode?: 'passthrough' | 'walls';
}

export const LeaderboardPanel = ({ mode }: LeaderboardPanelProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [mode]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await mockApi.leaderboard.getTopScores(mode);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-accent" />;
    if (index === 1) return <Medal className="w-5 h-5 text-primary" />;
    if (index === 2) return <Medal className="w-5 h-5 text-secondary" />;
    return <span className="w-5 text-center text-muted-foreground">{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-primary/20">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted/20 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-primary/20">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Leaderboard
      </h2>
      
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {getRankIcon(index)}
              <span className="font-semibold text-foreground">{entry.username}</span>
              <Badge variant="outline" className="ml-auto border-primary/30 text-xs">
                {entry.mode}
              </Badge>
            </div>
            
            <div className="text-right ml-4">
              <div className="font-bold text-primary">{entry.score.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{entry.date}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
