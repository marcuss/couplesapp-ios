import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Copy, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InvitePartnerPage: React.FC = () => {
  const { invitePartner } = useAuth();
  const [email, setEmail] = useState('');
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const url = await invitePartner(email.trim());
      setInvitationUrl(url);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationUrl) return;
    
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = invitationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-surface rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-brand rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">
              Invite Your Partner
            </h1>
            <p className="text-slate">
              Send an invitation to connect with your partner on CouplePlan
            </p>
          </div>

          {error && (
            <div data-testid="error-message" className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-error-600 text-sm">{error}</p>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink mb-2"
                >
                  Partner's Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
                  <input
                    data-testid="email-input"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-quiet-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <button
                data-testid="send-invitation-button"
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 px-4 bg-gradient-brand text-white font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Invitation...
                  </span>
                ) : (
                  'Send Invitation'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div data-testid="invitation-success" className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-success-700 text-sm font-medium">
                  Invitation created successfully!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Invitation Link
                </label>
                <div className="flex gap-2">
                  <input
                    data-testid="invitation-url"
                    type="text"
                    value={invitationUrl || ''}
                    readOnly
                    className="flex-1 px-4 py-3 bg-background border border-quiet-border rounded-lg text-slate text-sm"
                  />
                  <button
                    data-testid="copy-link-button"
                    onClick={copyToClipboard}
                    className="px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <span data-testid="copied-indicator">
                        <Check className="w-5 h-5" />
                      </span>
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate">
                  Share this link with your partner to connect
                </p>
              </div>

              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setInvitationUrl(null);
                }}
                className="w-full py-3 px-4 border border-quiet-border text-ink font-medium rounded-lg hover:bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all"
              >
                Invite Another Partner
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
