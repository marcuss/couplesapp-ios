import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/repositories/supabaseClient';
import { Heart, Check, X, Loader2, AlertCircle } from 'lucide-react';

interface Invitation {
  id: string;
  from_user_id: string;
  to_email: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  inviter?: {
    name: string | null;
    email: string | null;
  };
}

export const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadInvitation();
  }, [token]);

  const checkAuthAndLoadInvitation = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      // Load invitation details
      const { data, error: inviteError } = await supabase
        .from('invitations')
        .select(`
          *,
          inviter:profiles!invitations_from_user_id_fkey(name, email)
        `)
        .eq('token', token)
        .single();

      if (inviteError || !data) {
        setError('Invitation not found or has expired');
        setLoading(false);
        return;
      }

      if (data.status === 'accepted') {
        setError('This invitation has already been accepted');
        setLoading(false);
        return;
      }

      if (data.status === 'rejected') {
        setError('This invitation has been rejected');
        setLoading(false);
        return;
      }

      setInvitation(data);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation || !currentUser) return;

    setProcessing(true);
    try {
      // Start a transaction by making multiple updates
      
      // 1. Update invitation status to accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // 2. Update current user's partner_id to link to inviter
      const { error: userUpdateError } = await supabase
        .from('profiles')
        .update({ partner_id: invitation.from_user_id })
        .eq('id', currentUser.id);

      if (userUpdateError) throw userUpdateError;

      // 3. Update inviter's partner_id to link to current user
      const { error: inviterUpdateError } = await supabase
        .from('profiles')
        .update({ partner_id: currentUser.id })
        .eq('id', invitation.from_user_id);

      if (inviterUpdateError) throw inviterUpdateError;

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!invitation) return;

    setProcessing(true);
    try {
      // Update invitation status to rejected (not deleted)
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitation.id);

      if (error) throw error;

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      setError('Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-ink mb-2">
            Oops!
          </h1>
          <p className="text-slate mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-success-500" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">
            Connected!
          </h1>
          <p className="text-slate mb-6">
            You are now connected with {invitation?.inviter?.name || invitation?.inviter?.email}
          </p>
          <p className="text-sm text-slate">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Heart className="w-16 h-16 text-brand-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-ink mb-2">
            You've Been Invited!
          </h1>
          <p className="text-slate mb-2">
            {invitation?.inviter?.name || invitation?.inviter?.email} wants to connect with you on CouplePlan
          </p>
          <p className="text-slate mb-6">
            Please log in or sign up to accept this invitation
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login', { state: { invitationToken: token } })}
              className="w-full py-3 px-4 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup', { state: { invitationToken: token } })}
              className="w-full py-3 px-4 border border-brand-500 text-brand-500 font-medium rounded-lg hover:bg-brand-50 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">
            Partner Invitation
          </h1>
          <p className="text-slate">
            {invitation?.inviter?.name || invitation?.inviter?.email} wants to connect with you on CouplePlan
          </p>
        </div>

        <div className="space-y-4">
          <button
            data-testid="accept-button"
            onClick={handleAccept}
            disabled={processing}
            className="w-full py-3 px-4 bg-gradient-brand text-white font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            Accept Invitation
          </button>

          <button
            data-testid="reject-button"
            onClick={handleReject}
            disabled={processing}
            className="w-full py-3 px-4 border border-quiet-border text-ink font-medium rounded-lg hover:bg-background focus:outline-none focus:ring-2 focus:ring-slate focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Decline
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate">
          By accepting, you'll be able to share goals, budgets, and events with each other
        </p>
      </div>
    </div>
  );
};
