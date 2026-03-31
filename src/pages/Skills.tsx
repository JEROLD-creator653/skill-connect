import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Zap, Plus, Trash2, BookOpen, GraduationCap } from 'lucide-react';
import type { UserSkill, SkillLevel, SkillType } from '@/integrations/supabase/types';

const levelColors: Record<SkillLevel, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  advanced: 'bg-purple-100 text-purple-700 border-purple-200',
};

const Skills = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [skillType, setSkillType] = useState<SkillType>('offer');

  const fetchSkills = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSkills(data as UserSkill[]);
  }, [user]);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  const addSkill = async () => {
    if (!user || !skillName.trim()) {
      toast.error('Please enter a skill name');
      return;
    }
    const exists = skills.some(s => s.skill_name.toLowerCase() === skillName.trim().toLowerCase() && s.skill_type === skillType);
    if (exists) {
      toast.error('You already have this skill');
      return;
    }

    const { error } = await supabase.from('user_skills').insert({
      user_id: user.id,
      skill_name: skillName.trim(),
      skill_level: skillLevel,
      skill_type: skillType,
    });
    if (error) {
      toast.error('Failed to add skill');
    } else {
      toast.success('Skill added!');
      setSkillName('');
      fetchSkills();
    }
  };

  const removeSkill = async (id: string) => {
    await supabase.from('user_skills').delete().eq('id', id);
    fetchSkills();
    toast.success('Skill removed');
  };

  const offered = skills.filter(s => s.skill_type === 'offer');
  const wanted = skills.filter(s => s.skill_type === 'want');

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Skills</h1>
          <p className="text-muted-foreground text-sm">Add skills you can teach and skills you want to learn.</p>
        </div>

        {/* Add skill form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add a Skill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <Label className="text-xs">Type</Label>
                <Select value={skillType} onValueChange={(v) => setSkillType(v as SkillType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">I Can Teach</SelectItem>
                    <SelectItem value="want">I Want to Learn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-1">
                <Label className="text-xs">Skill Name</Label>
                <Input
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. React, Piano"
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
              </div>
              <div className="sm:col-span-1">
                <Label className="text-xs">Level</Label>
                <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v as SkillLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={addSkill} className="w-full gradient-primary text-white border-0">
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Skills I Offer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {offered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills offered yet.</p>
              ) : offered.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.skill_name}</span>
                    <Badge variant="outline" className={`text-[10px] ${levelColors[s.skill_level]}`}>
                      {s.skill_level}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSkill(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" /> Skills I Want
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wanted.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills wanted yet.</p>
              ) : wanted.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.skill_name}</span>
                    <Badge variant="outline" className={`text-[10px] ${levelColors[s.skill_level]}`}>
                      {s.skill_level}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSkill(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Skills;
