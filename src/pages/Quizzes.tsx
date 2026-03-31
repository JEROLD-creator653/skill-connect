import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ClipboardList, Plus, Play, CheckCircle, Loader2 } from 'lucide-react';

interface QuizRow {
  id: string;
  session_id: string | null;
  creator_id: string;
  taker_id: string;
  title: string;
  created_at: string;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  order_num: number;
}

interface QuizResultRow {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
}

const Quizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [results, setResults] = useState<QuizResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: QuizRow; questions: QuestionRow[] } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: q } = await supabase
      .from('quizzes')
      .select('*')
      .or(`creator_id.eq.${user.id},taker_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (q) setQuizzes(q as QuizRow[]);

    const { data: r } = await supabase.from('quiz_results').select('*').eq('taker_id', user.id);
    if (r) setResults(r as QuizResultRow[]);

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  const startQuiz = async (quiz: QuizRow) => {
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_num');
    if (data) {
      setActiveQuiz({ quiz, questions: data as QuestionRow[] });
      setAnswers({});
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !user) return;
    setSubmitting(true);

    const { questions, quiz } = activeQuiz;
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) score++;
    });

    await supabase.from('quiz_results').insert({
      quiz_id: quiz.id,
      taker_id: user.id,
      score,
      total_questions: questions.length,
      answers,
    });

    toast.success(`Quiz completed! Score: ${score}/${questions.length}`);
    setActiveQuiz(null);
    setSubmitting(false);
    fetchQuizzes();
  };

  const myQuizzes = quizzes.filter(q => q.creator_id === user?.id);
  const assignedQuizzes = quizzes.filter(q => q.taker_id === user?.id);
  const completedIds = new Set(results.map(r => r.quiz_id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground text-sm">Take and create quizzes for skill assessment.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned quizzes */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Assigned to You</h2>
              {assignedQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quizzes assigned yet.</p>
              ) : assignedQuizzes.map(q => (
                <Card key={q.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</p>
                    </div>
                    {completedIds.has(q.id) ? (
                      <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
                        <CheckCircle className="h-3 w-3" />
                        {results.find(r => r.quiz_id === q.id)?.score}/{results.find(r => r.quiz_id === q.id)?.total_questions}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => startQuiz(q)} className="gradient-primary text-white border-0">
                        <Play className="mr-1 h-3.5 w-3.5" /> Take
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* My created quizzes */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Created by You</h2>
              {myQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't created any quizzes yet.</p>
              ) : myQuizzes.map(q => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quiz taking dialog */}
        {activeQuiz && (
          <Dialog open onOpenChange={() => setActiveQuiz(null)}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{activeQuiz.quiz.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {activeQuiz.questions.map((q, i) => (
                  <div key={q.id} className="space-y-3">
                    <p className="font-medium text-sm">{i + 1}. {q.question}</p>
                    <RadioGroup
                      value={answers[q.id]?.toString()}
                      onValueChange={(v) => setAnswers(prev => ({ ...prev, [q.id]: parseInt(v) }))}
                    >
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center space-x-2">
                          <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} />
                          <Label htmlFor={`${q.id}-${oi}`} className="text-sm">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
                <Button
                  onClick={submitQuiz}
                  disabled={submitting || Object.keys(answers).length < activeQuiz.questions.length}
                  className="w-full gradient-primary text-white border-0"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Quiz
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Quizzes;
