import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Users, RefreshCw, Loader2, ShieldCheck, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserSkill } from '@/types/database';

interface MatchedUser {
  id: string;
  full_name: string;
  bio: string | null;
  is_verified: boolean;
  rating_avg: number;
  matchPercentage: number;
  commonSkills: { theyOffer: string; youWant: string }[];
}

const Matches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const findMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get current user's skills
    const { data: mySkills } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id);

    if (!mySkills || mySkills.length === 0) {
      toast.info('Add some skills first to find matches');
      setLoading(false);
      return;
    }

    const myOffers = (mySkills as UserSkill[]).filter(s => s.skill_type === 'offer').map(s => s.skill_name.toLowerCase());
    const myWants = (mySkills as UserSkill[]).filter(s => s.skill_type === 'want').map(s => s.skill_name.toLowerCase());

    // Get all other users' skills
    const { data: allSkills } = await supabase
      .from('user_skills')
      .select('*')
      .neq('user_id', user.id);

    if (!allSkills) { setLoading(false); return; }

    // Group by user
    const userSkillMap = new Map<string, UserSkill[]>();
    (allSkills as UserSkill[]).forEach(s => {
      const list = userSkillMap.get(s.user_id) || [];
      list.push(s);
      userSkillMap.set(s.user_id, list);
    });

    // Find mutual matches
    const matchedUsers: MatchedUser[] = [];

    for (const [otherUserId, otherSkills] of userSkillMap) {
      const theirOffers = otherSkills.filter(s => s.skill_type === 'offer').map(s => s.skill_name.toLowerCase());
      const theirWants = otherSkills.filter(s => s.skill_type === 'want').map(s => s.skill_name.toLowerCase());

      // They offer what I want
      const theyOfferIWant = theirOffers.filter(s => myWants.includes(s));
      // I offer what they want
      const iOfferTheyWant = myOffers.filter(s => theirWants.includes(s));

      // Mutual match: both conditions must be satisfied
      if (theyOfferIWant.length > 0 && iOfferTheyWant.length > 0) {
        const totalPossible = Math.max(myWants.length + myOffers.length, 1);
        const matched = theyOfferIWant.length + iOfferTheyWant.length;
        const pct = Math.min(Math.round((matched / totalPossible) * 100), 100);

        matchedUsers.push({
          id: otherUserId,
          full_name: '',
          bio: null,
          is_verified: false,
          rating_avg: 0,
          matchPercentage: pct,
          commonSkills: theyOfferIWant.map((s, i) => ({
            theyOffer: s,
            youWant: iOfferTheyWant[i] || iOfferTheyWant[0],
          })),
        });
      }
    }

    // Fetch profiles
    if (matchedUsers.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, bio, is_verified, rating_avg')
        .in('id', matchedUsers.map(m => m.id));

      if (profiles) {
        matchedUsers.forEach(m => {
          const p = (profiles as { id: string; full_name: string; bio: string | null; is_verified: boolean; rating_avg: number }[]).find(pr => pr.id === m.id);
          if (p) {
            m.full_name = p.full_name || 'Anonymous';
            m.bio = p.bio;
            m.is_verified = p.is_verified;
            m.rating_avg = p.rating_avg;
          }
        });
      }
    }

    matchedUsers.sort((a, b) => b.matchPercentage - a.matchPercentage);
    setMatches(matchedUsers);
    setLoading(false);
  }, [user]);

  useEffect(() => { findMatches(); }, [findMatches]);

  const requestSession = async (matchedUserId: string) => {
    if (!user) return;
    const { error } = await supabase.from('sessions').insert({
      requester_id: user.id,
      responder_id: matchedUserId,
      status: 'pending',
      topic: 'Skill Exchange',
    });
    if (error) {
      toast.error('Failed to send request');
    } else {
      toast.success('Session request sent!');
      // Create notification
      await supabase.from('notifications').insert({
        user_id: matchedUserId,
        type: 'session_request',
        title: 'New Session Request',
        message: `Someone wants to exchange skills with you!`,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Matches</h1>
            <p className="text-muted-foreground text-sm">Users who can exchange skills with you.</p>
          </div>
          <Button onClick={findMatches} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No matches yet</h3>
              <p className="text-sm text-muted-foreground">Add more skills to increase your matching chances.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(m => (
              <Card key={m.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="gradient-primary text-white font-bold">
                        {m.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{m.full_name}</h3>
                        {m.is_verified && <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />}
                      </div>
                      {m.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{m.bio}</p>}
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Match</span>
                          <span className="font-bold text-primary">{m.matchPercentage}%</span>
                        </div>
                        <Progress value={m.matchPercentage} className="h-2" />
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {m.commonSkills.slice(0, 3).map((cs, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {cs.theyOffer}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        className="w-full gradient-primary text-white border-0"
                        onClick={() => requestSession(m.id)}
                      >
                        <Video className="mr-1 h-3.5 w-3.5" /> Request Session
                      </Button>
                    </div>
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

export default Matches;
