import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../infrastructure/repositories/supabaseClient';
import emailjs from '@emailjs/browser';

interface User {
  id: string;
  email: string;
  name: string | null;
  partner_id: string | null;
}

interface Partner {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  invitePartner: (email: string) => Promise<string>;
  disconnectPartner: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPartner = useCallback(async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('id', partnerId)
        .single();

      if (error) throw error;

      if (data) {
        setPartner({
          id: data.id,
          email: data.email,
          name: data.name,
        });
      }
    } catch (err) {
      console.error('Error loading partner:', err);
      setPartner(null);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;

        if (profile) {
          const userData: User = {
            id: authUser.id,
            email: authUser.email!,
            name: profile.name,
            partner_id: profile.partner_id,
          };
          setUser(userData);

          // Load partner if connected
          if (profile.partner_id) {
            await loadPartner(profile.partner_id);
          } else {
            setPartner(null);
          }
        }
      } else {
        setUser(null);
        setPartner(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setUser(null);
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }, [loadPartner]);

  useEffect(() => {
    loadUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await loadUser();
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name }
      }
    });
    if (error) throw error;
    
    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email, name }]);
      
      if (profileError) throw profileError;
    }
    
    await loadUser();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPartner(null);
  };

  const invitePartner = async (email: string): Promise<string> => {
    if (!user) throw new Error('Must be logged in to invite a partner');

    // Generate unique token
    const token = crypto.randomUUID();
    
    // Use environment variable for base URL, fallback to window.location.origin
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const invitationUrl = `${baseUrl}/invitation/${token}`;

    // Create invitation in database
    const { error } = await supabase
      .from('invitations')
      .insert([{
        from_user_id: user.id,
        to_email: email,
        token,
        status: 'pending',
      }]);

    if (error) throw error;

    // Send email via EmailJS
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_name: email.split('@')[0],
            from_name: user.name || user.email,
            to_email: email,
            invitation_link: invitationUrl,
            current_date: new Date().toLocaleDateString(),
          },
          publicKey
        );
        console.log('Invitation email sent successfully');
      } else {
        console.warn('EmailJS not configured, skipping email send');
      }
    } catch (emailErr) {
      console.error('Failed to send invitation email:', emailErr);
      // Don't throw - the invitation was created successfully
    }

    return invitationUrl;
  };

  const disconnectPartner = async () => {
    if (!user || !user.partner_id) throw new Error('No partner to disconnect');

    const partnerId = user.partner_id;

    try {
      // Update current user's partner_id to null
      const { error: userError } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update partner's partner_id to null
      const { error: partnerError } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', partnerId);

      if (partnerError) throw partnerError;

      // Update local state
      setUser(prev => prev ? { ...prev, partner_id: null } : null);
      setPartner(null);
    } catch (err) {
      console.error('Error disconnecting partner:', err);
      throw err;
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        loading,
        login,
        signup,
        logout,
        invitePartner,
        disconnectPartner,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
