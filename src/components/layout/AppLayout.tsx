import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  Calendar,
  Users,
  Trophy,
  BookOpen,
  Settings,
  Menu,
  X,
  Link2,
  History,
  ClipboardCheck,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { SeasonSelector } from '@/components/seasons/SeasonSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveSeason } from '@/hooks/useSeasons';
import { AxprFooter } from '@/components/AxprFooter';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  coachOnly?: boolean;
  athleteOnly?: boolean;
  parentOnly?: boolean;
  hideForParent?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar, hideForParent: true },
  { name: 'Journal', href: '/journal', icon: BookOpen, athleteOnly: true },
  { name: 'Parent Access', href: '/parent-access', icon: Users, athleteOnly: true },
  { name: 'Athletes', href: '/athletes', icon: Users, coachOnly: true },
  { name: 'Attendance', href: '/attendance', icon: ClipboardCheck, hideForParent: true },
  { name: 'Records', href: '/records', icon: Trophy, hideForParent: true },
  { name: 'Audit Log', href: '/audit-log', icon: History, coachOnly: true },
  { name: 'Team Settings', href: '/team-settings', icon: Settings, coachOnly: true },
  { name: 'Link Child', href: '/link-child', icon: Link2, parentOnly: true },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isCoach, isAthlete, isParent, currentTeam, signOut } = useAuth();
  const { data: activeSeason } = useActiveSeason(currentTeam?.id);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // Filter navigation based on role
  const visibleNavigation = navigation.filter((item) => {
    if (item.coachOnly && !isCoach) return false;
    if (item.athleteOnly && !isAthlete) return false;
    if (item.parentOnly && !isParent) return false;
    if (item.hideForParent && isParent) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border lg:hidden">
        <div className="flex items-center justify-between px-4 h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FP</span>
            </div>
            <span className="font-heading font-semibold text-lg">Faster Pack</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1 animate-fade-in">
            {visibleNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border mt-2">
              <RoleSwitcher />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 mt-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </Button>
            </div>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
          <div className="flex items-center justify-between px-6 h-16 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">FP</span>
              </div>
              <div>
                <h1 className="font-heading font-semibold text-base">Faster Pack</h1>
                <p className="text-xs text-muted-foreground">Team Training</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1">
            {visibleNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-3">
            <RoleSwitcher />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Current Season</p>
              <SeasonSelector />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
          <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
          <AxprFooter />
        </main>
      </div>
    </div>
  );
}
