import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, Zap, Video, ClipboardList, Star, ShieldCheck, Upload, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const statCards = [
  { label: 'Skills', icon: Zap, path: '/skills', color: 'from-primary to-secondary' },
  { label: 'Matches', icon: Users, path: '/matches', color: 'from-secondary to-primary' },
  { label: 'Sessions', icon: Video, path: '/sessions', color: 'from-accent to-destructive' },
  { label: 'Quizzes', icon: ClipboardList, path: '/quizzes', color: 'from-primary to-accent' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl lg:text-4xl font-bold">
            Welcome back, <span className="text-gradient">{profile?.full_name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your skill exchanges.</p>
        </motion.div>

        {/* Verification alert */}
        {profile && !profile.is_verified && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-accent/40 bg-accent/5">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                  <Upload className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Complete Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your resume and certificates to get verified and start matching.
                  </p>
                </div>
                <Button asChild size="sm" className="gradient-primary text-white border-0">
                  <Link to="/profile">
                    Verify Now <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {profile?.is_verified && (
          <Badge className="gap-1.5 bg-primary/10 text-primary border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified Profile
          </Badge>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, icon: Icon, path, color }, i) => (
            <motion.div key={label} custom={i} variants={fadeIn} initial="hidden" animate="visible">
              <Link to={path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-5">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} mb-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm text-muted-foreground">{label}</h3>
                    <p className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">—</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-accent" /> Your Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{profile?.rating_avg?.toFixed(1) || '—'}</span>
                <span className="text-muted-foreground text-sm">/ 5.0</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{profile?.rating_count || 0} reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/skills"><Zap className="mr-2 h-4 w-4" /> Manage Skills</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/matches"><Users className="mr-2 h-4 w-4" /> Find Matches</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
