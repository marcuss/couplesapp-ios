import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Heart, LogOut, Mail, ArrowLeft, Check, X, UserPlus, Link2Off } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/repositories/supabaseClient';

interface Invitation {
  id: string;
  from_user_id: string;
  to_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  inviter?: {
    name: string | null;
    email: string | null;
  };
}

export const ProfilePage: React.FC = () => {
  const { user, partner, disconnectPartner, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectMessage, setDisconnectMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPendingInvitations();
  }, [user]);

  const loadPendingInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          inviter:profiles!invitations_from_user_id_fkey(name, email)
        `)
        .eq('to_email', user.email)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingInvitations(data || []);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (error) throw error;

      // Reload to update state
      window.location.reload();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Failed to accept invitation');
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      // Remove from local state
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      alert('Failed to reject invitation');
    }
  };

  const handleDisconnect = async () => {
    if (!partner) return;
    
    const partnerName = partner.name || partner.email;
    
    if (!window.confirm(`Are you sure you want to disconnect from ${partnerName}?`)) {
      return;
    }

    setDisconnecting(true);
    try {
      await disconnectPartner();
      setDisconnectMessage(`Disconnected from ${partnerName}`);
      setTimeout(() => setDisconnectMessage(null), 3000);
    } catch (err) {
      console.error('Error disconnecting:', err);
      alert('Failed to disconnect from partner');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Disconnect Success Message */}
        {disconnectMessage && (
          <div data-testid="disconnect-message" className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg">
            <p className="text-success-700 font-medium">{disconnectMessage}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-surface rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 data-testid="profile-name" className="text-2xl font-bold text-ink mb-1">
              {user.name || 'User'}
            </h1>
            <p className="text-slate">{user.email}</p>
          </div>

          {/* Partner Information */}
          <div data-testid="partner-section" className="border-t border-quiet-border pt-6">
            <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-teal-500" />
              Partner Information
            </h2>

            {partner ? (
              <div data-testid="partner-info" className="bg-teal-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      {partner.name || 'Partner'}
                    </p>
                    <p className="text-sm text-slate">{partner.email}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-sm text-success-600">
                      <Check className="w-4 h-4" />
                      Connected
                    </span>
                  </div>
                  <button
                    data-testid="disconnect-button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex items-center gap-2 px-4 py-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                  >
                    <Link2Off className="w-4 h-4" />
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-background rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate">Not connected to a partner</p>
                    <p className="text-sm text-slate mt-1">
                      Invite your partner to start planning together
                    </p>
                  </div>
                  <Link
                    data-testid="invite-partner-button"
                    to="/invite"
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite Partner
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div data-testid="pending-invitations" className="bg-surface rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-ochre-500" />
              Pending Invitations ({pendingInvitations.length})
            </h2>

            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border border-quiet-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">
                        {invitation.inviter?.name || 'Someone'} invited you
                      </p>
                      <p className="text-sm text-slate">
                        {invitation.inviter?.email}
                      </p>
                      <p className="text-xs text-slate mt-1">
                        Received {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        data-testid="accept-invitation-button"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        data-testid="reject-invitation-button"
                        onClick={() => handleRejectInvitation(invitation.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="bg-surface rounded-2xl shadow-xl p-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-error-300 text-error-600 rounded-lg hover:bg-error-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
