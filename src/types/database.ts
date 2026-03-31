export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type SkillType = 'offer' | 'want';
export type SessionStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type NotificationType = 'match' | 'session_request' | 'session_accepted' | 'session_rejected' | 'quiz_assigned' | 'rating';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  resume_url: string | null;
  certificate_url: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  skill_level: SkillLevel;
  skill_type: SkillType;
  created_at: string;
}
