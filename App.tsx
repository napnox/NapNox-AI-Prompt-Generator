import React, { useCallback, useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LoginGate } from './components/LoginGate';
import { MasterPromptForm } from './components/MasterPromptForm';
import { PromptResults } from './components/PromptResults';
import { UpgradeModal } from './components/UpgradeModal';
import { UsageMeter } from './components/UsageMeter';
import { bootstrapSession, devLogout, generatePrompts, getSession, isWordPress } from './services/api';
import type { GenerateRequest, GeneratedPrompt, Session, Usage } from './types';

const FALLBACK_SESSION: Session = {
  loggedIn: false,
  user: null,
  usage: null,
  loginUrl: '/wp-login.php',
  registerUrl: '',
  contact: { email: 'contact@napnox.com', whatsapp: '', message: '' },
};

const App: React.FC = () => {
  // The WordPress plugin renders the session into the page, so when embedded
  // the gate shows the right thing on first paint with no loading flash.
  const [session, setSession] = useState<Session | null>(bootstrapSession() ?? null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((fresh) => {
        if (!cancelled) {
          setSession(fresh);
          setSessionError(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Keep any bootstrapped session rather than locking the user out.
        setSession((current) => current ?? FALLBACK_SESSION);
        setSessionError(err?.message ?? 'Could not load your account details.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyUsage = (usage: Usage) =>
    setSession((current) => (current ? { ...current, usage } : current));

  const handleGenerate = useCallback(
    async (request: GenerateRequest) => {
      const usage = session?.usage;
      if (usage && !usage.unlimited && usage.remaining <= 0) {
        setShowUpgrade(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await generatePrompts(request);
        setPrompts(response.prompts);
        applyUsage(response.usage);
      } catch (err: any) {
        if (err?.code === 'limit_reached' || err?.status === 402) {
          if (err.usage) applyUsage(err.usage);
          setShowUpgrade(true);
        } else if (err?.code === 'not_logged_in' || err?.status === 401 || err?.status === 403) {
          // Session expired mid-visit: send them back to the gate.
          setSession((current) => (current ? { ...current, loggedIn: false, user: null } : current));
          setError('Your session has expired. Please sign in again.');
        } else {
          setError(err?.message ?? 'Could not generate prompts. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [session],
  );

  const handleLogout = async () => {
    try {
      setSession(await devLogout());
    } catch {
      setSession((current) => (current ? { ...current, loggedIn: false, user: null, usage: null } : current));
    }
    setPrompts([]);
  };

  const embedded = isWordPress();
  const current = session ?? FALLBACK_SESSION;
  const loading = session === null;

  return (
    <div className="napnox-app min-h-full bg-gray-50 text-gray-800 flex flex-col">
      {!embedded && <Header user={current.user} onLogout={handleLogout} />}

      <main className={`mx-auto w-full max-w-6xl px-4 flex-grow ${embedded ? 'py-6' : 'py-10'}`}>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Master <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">Prompt Generator</span>
          </h1>
          <p className="text-gray-600">
            Describe your idea once. Get ready-to-paste prompts for any AI tool — images, video,
            writing, code and more.
          </p>
        </div>

        {loading ? (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
            Loading your account...
          </div>
        ) : !current.loggedIn ? (
          <LoginGate session={current} onSignedIn={setSession} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600">
                Signed in as <strong className="text-gray-900">{current.user?.name}</strong>
              </p>
              {current.usage && <UsageMeter usage={current.usage} onUpgradeClick={() => setShowUpgrade(true)} />}
            </div>

            {current.notice && (
              <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                {current.notice}
              </div>
            )}
            {sessionError && (
              <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                {sessionError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <MasterPromptForm onGenerate={handleGenerate} isLoading={isLoading} usage={current.usage} />
              </div>
              <div className="lg:col-span-7">
                <PromptResults prompts={prompts} isLoading={isLoading} error={error} />
              </div>
            </div>
          </>
        )}
      </main>

      {!embedded && <Footer />}

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        usage={current.usage}
        contact={current.contact}
      />
    </div>
  );
};

export default App;
