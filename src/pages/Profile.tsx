import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Upload, FileText, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save profile');
    } else {
      await refreshProfile();
      toast.success('Profile updated!');
    }
  };

  const handleFileUpload = async (file: File, type: 'resume' | 'certificate') => {
    if (!user) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setUploading(type);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${type}_${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    const updateField = type === 'resume' ? 'resume_url' : 'certificate_url';

    // Check if both docs will be uploaded
    const otherField = type === 'resume' ? 'certificate_url' : 'resume_url';
    const otherExists = profile?.[otherField];

    const updateData: Record<string, unknown> = {
      [updateField]: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    };

    if (otherExists) {
      updateData.is_verified = true;
    }

    await supabase.from('profiles').update(updateData).eq('id', user.id);
    await refreshProfile();
    setUploading(null);
    toast.success(`${type === 'resume' ? 'Resume' : 'Certificate'} uploaded!`);

    if (otherExists) {
      toast.success('🎉 Profile verified! You can now find matches.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your profile and verification documents.</p>
        </div>

        {/* Verification status */}
        <Card className={profile?.is_verified ? 'border-primary/30 bg-primary/5' : 'border-accent/30 bg-accent/5'}>
          <CardContent className="flex items-center gap-3 p-4">
            {profile?.is_verified ? (
              <>
                <ShieldCheck className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-primary">Verified</p>
                  <p className="text-xs text-muted-foreground">Your profile is verified. You can match with others.</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-accent-foreground" />
                <div>
                  <p className="font-semibold">Not Verified</p>
                  <p className="text-xs text-muted-foreground">Upload resume and certificates to get verified.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary text-white border-0">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" /> Verification Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resume */}
            <div className="space-y-2">
              <Label>Resume (PDF)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf"
                  disabled={uploading === 'resume'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'resume');
                  }}
                />
                {profile?.resume_url && (
                  <Badge variant="outline" className="gap-1 text-primary border-primary/30 whitespace-nowrap">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </Badge>
                )}
                {uploading === 'resume' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>

            {/* Certificate */}
            <div className="space-y-2">
              <Label>Certificate / Course Proof (PDF or Image)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  disabled={uploading === 'certificate'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'certificate');
                  }}
                />
                {profile?.certificate_url && (
                  <Badge variant="outline" className="gap-1 text-primary border-primary/30 whitespace-nowrap">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </Badge>
                )}
                {uploading === 'certificate' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
