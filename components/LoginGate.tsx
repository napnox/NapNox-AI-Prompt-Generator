import React, { useState } from 'react';
import { devLogin, isWordPress } from '../services/api';
import type { Session } from '../types';
import { NapNoxLogo } from './icons/NapNoxLogo';

interface LoginGateProps {
  session: Session;
  onSignedIn: (session: Session) => void;
}

/**
 * Shown to signed-out visitors. Generating a prompt requires a registered
 * account, so this is the only thing an anonymous visitor can see.
 *
 * Inside WordPress it links to the real login and registration pages. In
 * standalone dev mode it offers a throwaway email sign-in so the flow can be
 * tested without WordPress.
 */
export const LoginGate: React.FC<LoginGateProps> = ({ session, onSignedIn }) => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDevLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await devLogin(email));
    } catch (err: any) {
      setError(err?.message ?? 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-8 text-center animate-fade-in-up">
      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <NapNoxLogo className="h-9 w-9" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to generate prompts</h2>
      <p className="text-gray-600 mb-7 leading-relaxed">
        Prompt generation is for registered members. Create a free account to get{' '}
        <strong className="text-gray-900">10 free prompt generations</strong> — no card needed.
      </p>

      {isWordPress() ? (
        <div className="space-y-3">
          <a
            href={session.loginUrl}
            className="block w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Log in
          </a>
          {session.registerUrl && (
            <a
              href={session.registerUrl}
              className="block w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors"
            >
              Create a free account
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={handleDevLogin} className="space-y-3 text-left">
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-3">
            Local development sign-in. On your WordPress site this is replaced by your real
            registration plugin's login and register links.
          </div>
          <label htmlFor="napnox-email" className="block text-sm font-semibold text-gray-700">
            Email address
          </label>
          <input
            id="napnox-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {busy ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      )}
    </div>
  );
};
