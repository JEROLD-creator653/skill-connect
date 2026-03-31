import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Loader2, ShieldCheck } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  full_name: string;
  rating_avg: number;
  rating_count: number;
  is_verified: boolean;
}

const rankIcons = [
  <Trophy className="h-5 w-5 text-yellow-500" />,
  <Medal className="h-5 w-5 text-gray-400" />,
  <Award className="h-5 w-5 text-amber-600" />,
];

const Leaderboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, rating_avg, rating_count, is_verified')
        .gt('rating_count', 0)
        .order('rating_avg', { ascending: false })
        .limit(50);
      if (data) setUsers(data as LeaderboardUser[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">Top-rated skill swappers.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No ratings yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {users.map((u, i) => (
              <Card key={u.id} className={u.id === user?.id ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="w-8 text-center font-bold text-lg text-muted-foreground">
                    {i < 3 ? rankIcons[i] : i + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={i < 3 ? 'gradient-primary text-white font-bold' : 'bg-muted'}>
                      {u.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{u.full_name || 'Anonymous'}</p>
                      {u.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.rating_count} reviews</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{u.rating_avg.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">/ 5.0</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
