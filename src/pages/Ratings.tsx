import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';

interface RatingRow {
  id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  feedback: string | null;
  created_at: string;
  rater_name?: string;
}

const Ratings = () => {
  const { user, profile } = useAuth();
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('rated_id', user.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const raterIds = (data as RatingRow[]).map(r => r.rater_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', raterIds);

      const enriched = (data as RatingRow[]).map(r => ({
        ...r,
        rater_name: (profiles as { id: string; full_name: string }[] | null)?.find(p => p.id === r.rater_id)?.full_name || 'Anonymous',
      }));
      setRatings(enriched);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const renderStars = (score: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= score ? 'fill-accent text-accent' : 'text-muted'}`} />
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Ratings & Feedback</h1>
          <p className="text-muted-foreground text-sm">See what others say about your teaching.</p>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-gradient">{profile?.rating_avg?.toFixed(1) || '—'}</p>
            <div className="flex justify-center mt-2">
              {renderStars(Math.round(profile?.rating_avg || 0))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{profile?.rating_count || 0} reviews</p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No ratings yet.</p>
        ) : (
          <div className="space-y-3">
            {ratings.map(r => (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-xs">{r.rater_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{r.rater_name}</p>
                    <div className="mt-0.5">{renderStars(r.score)}</div>
                    {r.feedback && <p className="text-sm text-muted-foreground mt-1">{r.feedback}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
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

export default Ratings;
