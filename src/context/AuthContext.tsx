import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  fitness_level: string | null;
  activity_level: string | null;
  training_days_per_week: number | null;
  goal: string | null;
  sport: string | null;
  workout_duration: string | null;
  training_location: string | null;
  equipment: string | null;
  dietary_preference: string | null;
  allergies: string | null;
  health_conditions: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSessionResolved = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AUTH] fetchProfile error:', error.message, error.code, error.details, error.hint);
    }

    setProfile(data as Profile | null);

    if (import.meta.env.DEV) {
      console.log('[AUTH] PROFILE:', data ? 'exists' : 'not found');
      if (data) {
        console.log('[AUTH] ONBOARDING:', data.onboarding_completed ? 'complete' : 'incomplete');
      }
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      currentUserIdRef.current = currentUser?.id ?? null;

      if (import.meta.env.DEV) {
        console.log('[AUTH]', currentUser ? 'authenticated' : 'no session');
        if (currentUser) console.log('[AUTH] USER:', currentUser.id);
      }

      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => {
          initialSessionResolved.current = true;
          setLoading(false);
        });
      } else {
        initialSessionResolved.current = true;
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        if (newUser.id !== currentUserIdRef.current) {
          currentUserIdRef.current = newUser.id;
          if (initialSessionResolved.current) {
            setLoading(true);
            fetchProfile(newUser.id).finally(() => setLoading(false));
          }
        }
      } else {
        currentUserIdRef.current = null;
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    currentUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
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
