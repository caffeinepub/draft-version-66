import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import LotusCanvas from '../components/LotusCanvas';

export default function LandingPage() {
  const { login, isLoggingIn, identity, isInitializing } = useInternetIdentity();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isInitializing && identity && !identity.getPrincipal().isAnonymous()) {
      navigate({ to: '/dashboard' });
    }
  }, [identity, isInitializing, navigate]);

  const handleStartJourney = async () => {
    await login();
    // Navigation will happen automatically via the useEffect above after successful login
  };

  const handleGuestMode = () => {
    console.log('Entering guest mode with local storage only');
    navigate({ to: '/dashboard' });
  };

  // Don't render if we're redirecting
  if (!isInitializing && identity && !identity.getPrincipal().isAnonymous()) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      {/* Canvas Background with z-index 0 */}
      <LotusCanvas />

      {/* Theme Toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-accent-cyan" />
          ) : (
            <Moon className="h-5 w-5 text-primary-dark" />
          )}
        </button>
      )}

      {/* Main Content - Centered with refined spacing */}
      <main className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-5 animate-fade-in">
          {/* Headline with animation - clean sans-serif font */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight font-sans animate-breathe-gentle text-accent-cyan-tinted">
            Inner Bloom
          </h1>

          {/* Subheadline with Playfair Display - italic */}
          <p className="text-2xl md:text-3xl lg:text-4xl font-playfair italic text-foreground/90 font-light leading-relaxed pt-1">
            Your Daily Path to Calm & Clarity
          </p>

          {/* Description - increased font size and weight for better readability */}
          <p className="text-lg md:text-xl lg:text-[1.375rem] text-description-gray max-w-2xl mx-auto leading-relaxed px-4 font-medium pt-2">
            Personalized meditations tailored to how you feel today. Build a gentle habit with
            meditation sessions, peaceful sounds, progress tracking, reflections, and inspiring
            recommendations — all in one beautiful space.
          </p>

          {/* CTA Buttons - refined sizing and spacing */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={handleStartJourney}
              disabled={isLoggingIn}
              size="lg"
              className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-8 py-6 text-base rounded-full shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105 min-w-[200px]"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-dark" />
                  Connecting...
                </span>
              ) : (
                'Start Your Journey'
              )}
            </Button>

            <Button
              onClick={handleGuestMode}
              size="lg"
              variant="outline"
              className="border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 text-foreground font-semibold px-8 py-6 text-base rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-sm min-w-[200px]"
            >
              Explore as Guest
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
