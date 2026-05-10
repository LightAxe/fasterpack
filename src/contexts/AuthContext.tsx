import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type UserRole = 'coach' | 'athlete' | 'parent';

type Profile = Tables<'profiles'>;
type TeamMembership = Tables<'team_memberships'> & {
  teams: { id: string; name: string } | null;
};

// Data stored during signup before OTP verification
export interface PendingSignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
}

type OtpPurpose = 'login' | 'phone_verification';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  currentTeam: { id: string; name: string } | null;
  teamMemberships: TeamMembership[];
  isLoading: boolean;
  isCoach: boolean;
  isAthlete: boolean;
  isParent: boolean;
  pendingSignupData: PendingSignupData | null;
  setPendingSignupData: (data: PendingSignupData | null) => void;
  sendOtp: (identifier: string, method?: 'email' | 'sms', purpose?: OtpPurpose) => Promise<{ error: Error | null }>;
  verifyOtp: (identifier: string, token: string, method?: 'email' | 'sms') => Promise<{ error: Error | null; isNewUser: boolean; needsSignup?: boolean }>;
  sendPhoneVerificationOtp: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setCurrentTeam: (team: { id: string; name: string } | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teamMemberships, setTeamMemberships] = useState<TeamMembership[]>([]);
  const [currentTeam, setCurrentTeam] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSignupData, setPendingSignupData] = useState<PendingSignupData | null>(() => {
    try {
      const raw = sessionStorage.getItem('pending-signup-data');
      return raw ? JSON.parse(raw) as PendingSignupData : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (pendingSignupData) {
      sessionStorage.setItem('pending-signup-data', JSON.stringify(pendingSignupData));
    } else {
      sessionStorage.removeItem('pending-signup-data');
    }
  }, [pendingSignupData]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  };

  const fetchTeamMemberships = async (userId: string) => {
    const { data, error } = await supabase
      .from('team_memberships')
      .select('*, teams(id, name)')
      .eq('profile_id', userId);

    if (error) {
      console.error('Error fetching team memberships:', error);
      return [];
    }
    return data as TeamMembership[];
  };

  const refreshProfile = async () => {
    if (!user) return;

    const [profileData, memberships] = await Promise.all([
      fetchProfile(user.id),
      fetchTeamMemberships(user.id)
    ]);

    setProfile(profileData);
    setTeamMemberships(memberships);

    if (!currentTeam && memberships.length > 0 && memberships[0].teams) {
      setCurrentTeam(memberships[0].teams);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const [profileData, memberships] = await Promise.all([
              fetchProfile(session.user.id),
              fetchTeamMemberships(session.user.id)
            ]);

            setProfile(profileData);
            setTeamMemberships(memberships);

            if (memberships.length > 0 && memberships[0].teams) {
              setCurrentTeam(memberships[0].teams);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setTeamMemberships([]);
          setCurrentTeam(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Maps the in-memory PendingSignupData to the metadata key shape that
  // handle_new_user() reads in the database trigger. Snake-case here is the
  // contract with the SQL — keep them in sync.
  const signupDataAsMetadata = () =>
    pendingSignupData
      ? {
          first_name: pendingSignupData.firstName,
          last_name: pendingSignupData.lastName,
          role: pendingSignupData.role,
          phone: pendingSignupData.phone ?? null,
        }
      : undefined;

  const sendOtp = async (
    identifier: string,
    method: 'email' | 'sms' = 'email',
    purpose: OtpPurpose = 'login'
  ) => {
    try {
      // Phone verification on an already-signed-in user goes through
      // updateUser, which makes Supabase send an SMS code to the new phone
      // and stores it as the user's pending phone (confirmed by phone_change
      // verifyOtp call below).
      if (purpose === 'phone_verification') {
        const { error } = await supabase.auth.updateUser({ phone: identifier });
        return { error: error as Error | null };
      }

      // Login/signup OTP. shouldCreateUser=true only when we have signup
      // data in hand — that's how we distinguish "create the account" from
      // "user better already exist."
      const shouldCreateUser = !!pendingSignupData;
      const data = signupDataAsMetadata();

      const { error } = method === 'email'
        ? await supabase.auth.signInWithOtp({
            email: identifier,
            options: { shouldCreateUser, data },
          })
        : await supabase.auth.signInWithOtp({
            phone: identifier,
            options: { shouldCreateUser, data },
          });

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const verifyOtp = async (identifier: string, token: string, method: 'email' | 'sms' = 'email') => {
    try {
      const { error } = method === 'email'
        ? await supabase.auth.verifyOtp({ email: identifier, token, type: 'email' })
        : await supabase.auth.verifyOtp({ phone: identifier, token, type: 'sms' });

      if (error) {
        // Supabase returns a 4xx with "Signups not allowed for otp" (or
        // similar) when shouldCreateUser=false hits a non-existent user.
        // Surface that as needsSignup so the UI can route to /signup.
        const msg = error.message?.toLowerCase() ?? '';
        const needsSignup =
          msg.includes('signups not allowed') ||
          msg.includes('not found') ||
          msg.includes('does not exist');
        return { error: error as Error, isNewUser: false, needsSignup };
      }

      // Session establishes via the auth state listener; nothing to do here
      // beyond resolving the signup intent.
      const isNewUser = !!pendingSignupData;
      // Keep pendingSignupData around if a phone is queued for verification
      // post-signup (the ProtectedRoute checks pendingSignupData?.phone to
      // gate /verify-phone). Otherwise clear it.
      if (isNewUser && !pendingSignupData?.phone) {
        setPendingSignupData(null);
      }

      return { error: null, isNewUser, needsSignup: false };
    } catch (error) {
      return { error: error as Error, isNewUser: false, needsSignup: false };
    }
  };

  const sendPhoneVerificationOtp = async (phone: string) => {
    return sendOtp(phone, 'sms', 'phone_verification');
  };

  const verifyPhoneOtp = async (phone: string, code: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'phone_change',
      });
      if (error) return { error: error as Error };

      // The mirror_auth_phone_to_profile trigger copies the confirmed phone
      // into profiles.phone. Clear pendingSignupData now that signup +
      // phone verification are both done.
      setPendingSignupData(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTeamMemberships([]);
    setCurrentTeam(null);
    setPendingSignupData(null);
  };

  const isCoach = profile?.role === 'coach';
  const isAthlete = profile?.role === 'athlete';
  const isParent = profile?.role === 'parent';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      currentTeam,
      teamMemberships,
      isLoading,
      isCoach,
      isAthlete,
      isParent,
      pendingSignupData,
      setPendingSignupData,
      sendOtp,
      verifyOtp,
      sendPhoneVerificationOtp,
      verifyPhoneOtp,
      signOut,
      refreshProfile,
      setCurrentTeam
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
