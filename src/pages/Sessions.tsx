import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Video, Clock, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import type { Profile } from '@/integrations/supabase/types';

interface SessionRow {
  id: string;
  requester_id: string;
  responder_id: string;
  status: string;
  topic: string | null;
  scheduled_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
};

const Sessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<(SessionRow & { otherUser?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .or(`requester_id.eq.${user.id},responder_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const otherIds = (data as SessionRow[]).map(s =>
        s.requester_id === user.id ? s.responder_id : s.requester_id
      );
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds);

      const enriched = (data as SessionRow[]).map(s => {
        const otherId = s.requester_id === user.id ? s.responder_id : s.requester_id;
        return { ...s, otherUser: (profiles as Profile[] | null)?.find(p => p.id === otherId) };
      });
      setSessions(enriched);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const updateStatus = async (sessionId: string, status: string) => {
    await supabase.from('sessions').update({ status, updated_at: new Date().toISOString() }).eq('id', sessionId);
    toast.success(`Session ${status}`);
    fetchSessions();
  };

  const incoming = sessions.filter(s => s.responder_id === user?.id && s.status === 'pending');
  const active = sessions.filter(s => s.status === 'accepted');
  const past = sessions.filter(s => ['completed', 'rejected', 'cancelled'].includes(s.status));

  const renderSession = (s: SessionRow & { otherUser?: Profile }, showActions = false) => {
    const cfg = statusConfig[s.status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <Card key={s.id} className="hover:shadow transition-shadow">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-muted text-muted-foreground font-bold text-sm">
              {s.otherUser?.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{s.otherUser?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{s.topic || 'Skill Exchange'}</p>
            {s.scheduled_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {new Date(s.scheduled_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
              <Icon className="h-3 w-3" /> {cfg.label}
            </Badge>
            {showActions && s.status === 'pending' && s.responder_id === user?.id && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(s.id, 'accepted')}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => updateStatus(s.id, 'rejected')}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-muted-foreground text-sm">Manage your learning sessions.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="incoming">
            <TabsList>
              <TabsTrigger value="incoming">
                Incoming {incoming.length > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 text-[10px] justify-center gradient-primary text-white border-0">{incoming.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-3 mt-4">
              {incoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No incoming requests.</p>
              ) : incoming.map(s => renderSession(s, true))}
            </TabsContent>

            <TabsContent value="active" className="space-y-3 mt-4">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active sessions.</p>
              ) : active.map(s => renderSession(s))}
            </TabsContent>

            <TabsContent value="past" className="space-y-3 mt-4">
              {past.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No past sessions.</p>
              ) : past.map(s => renderSession(s))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Sessions;
