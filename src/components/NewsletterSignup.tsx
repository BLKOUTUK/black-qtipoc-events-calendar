import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

const CRM_API_URL = 'https://crm.blkoutuk.cloud';

export const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [subscribeEvents, setSubscribeEvents] = useState(true);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${CRM_API_URL}/api/community/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          subscriptions: {
            newsletter: subscribeNewsletter,
            events: subscribeEvents,
            blkouthub: false,
            volunteer: false,
          },
          consentGiven: true,
          source: 'events_calendar',
          sourceUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for joining! Check your email for event updates.');
        setEmail('');
        setFirstName('');

        // Reset form after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        throw new Error(data.message || 'Signup failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 rounded-lg p-6 border border-yellow-500/30">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="h-6 w-6 text-yellow-500" />
        <h3 className="text-xl font-bold text-gray-100">
          Stay Connected
        </h3>
      </div>

      <p className="text-gray-300 text-sm mb-4">
        Get event updates and community news delivered to your inbox
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="First name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribeEvents}
              onChange={(e) => setSubscribeEvents(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 text-yellow-500 focus:ring-yellow-500"
            />
            Event updates & reminders
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribeNewsletter}
              onChange={(e) => setSubscribeNewsletter(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 text-yellow-500 focus:ring-yellow-500"
            />
            Community newsletter
          </label>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              Joining...
            </>
          ) : (
            'Join Community'
          )}
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
      </form>

      <p className="text-xs text-gray-500 mt-3">
        We respect your privacy. Unsubscribe anytime. Hosted on UK servers.
      </p>
    </div>
  );
};

export default NewsletterSignup;
