import { useEffect, useState } from 'react';

const REDIRECT_AFTER_MS = 5000;
const TARGET = 'https://fasterpack.net';

export function LovableRedirect() {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(REDIRECT_AFTER_MS / 1000));

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((n) => Math.max(0, n - 1));
    }, 1000);
    const redirect = setTimeout(() => {
      window.location.replace(TARGET);
    }, REDIRECT_AFTER_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-sm p-10 text-center">
        <div className="inline-flex items-center justify-center bg-primary text-primary-foreground font-bold text-lg w-12 h-12 rounded-xl mb-6">
          FP
        </div>
        <h1 className="text-2xl font-heading font-bold mb-3">Faster Pack has moved</h1>
        <p className="text-muted-foreground mb-8">
          The app is now hosted at{' '}
          <a href={TARGET} className="text-primary font-semibold underline underline-offset-2">
            fasterpack.net
          </a>
          . Update your bookmarks.
        </p>
        <a
          href={TARGET}
          className="inline-block bg-primary text-primary-foreground hover:opacity-90 font-semibold px-6 py-3 rounded-lg transition-opacity"
        >
          Go to fasterpack.net
        </a>
        <p className="text-sm text-muted-foreground mt-6">
          Redirecting automatically in {secondsLeft}s…
        </p>
      </div>
    </div>
  );
}
