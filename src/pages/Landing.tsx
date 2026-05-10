import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Trophy,
  BookOpen,
  ClipboardCheck,
  CalendarSync,
  Download,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Workout Calendar',
    description: 'Schedule workouts for your team and track completion across the roster.',
  },
  {
    icon: Trophy,
    title: 'Race Management',
    description: 'Organize meets, record results, and automatically track PRs.',
  },
  {
    icon: BookOpen,
    title: 'Training Journal',
    description: 'Athletes log workouts with distance, pace, and notes — coaches see it all.',
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance Tracking',
    description: 'Take daily practice attendance and monitor consistency over time.',
  },
  {
    icon: CalendarSync,
    title: 'Calendar Sync',
    description: 'iCal feed lets athletes subscribe in Google Calendar or Apple Calendar.',
  },
  {
    icon: Download,
    title: 'Data Export',
    description: 'Export workout logs, race results, and attendance as CSV for reporting.',
  },
];

const roles = [
  {
    title: 'Coaches',
    points: [
      'Schedule workouts and view team compliance',
      'Take attendance and track consistency',
      'Manage meets, results, and records',
      'Export data for reports and analysis',
    ],
  },
  {
    title: 'Athletes',
    points: [
      'Log personal workouts and view your history',
      'See scheduled workouts in your calendar app',
      'Track PRs and compare with teammates',
      'Keep a training journal with notes',
    ],
  },
  {
    title: 'Parents',
    points: [
      'Read-only access to your child\'s training',
      'View upcoming workouts and race schedule',
      'See attendance and workout compliance',
      'Stay informed without disrupting coaching',
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FP</span>
            </div>
            <span className="font-heading font-semibold text-lg">Faster Pack</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Your team's training,{' '}
            <span className="text-primary">all in one place</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A simple platform for cross country and track coaches to schedule workouts,
            track attendance, manage meets, and keep athletes and parents in the loop.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10">
            Everything your program needs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/60">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-heading font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role benefits */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10">
            Built for everyone on the team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role) => (
              <div key={role.title}>
                <h3 className="font-heading font-semibold text-xl mb-4">{role.title}</h3>
                <ul className="space-y-3">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 sm:px-6 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4">
            Ready to streamline your program?
          </h2>
          <p className="text-muted-foreground mb-6">
            Create a team in seconds. Free for coaches, athletes, and parents.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Faster Pack</span>
          <p>
            Part of the{' '}
            <a
              href="https://axpr.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              axpr
            </a>{' '}
            cinematic universe
          </p>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
