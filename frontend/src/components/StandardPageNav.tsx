import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import SessionIndicator from './SessionIndicator';
import HamburgerMenu from './HamburgerMenu';

interface StandardPageNavProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function StandardPageNav({ showBackButton = true, onBack }: StandardPageNavProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
    navigate({ to: '/dashboard' });
  };

  return (
    <>
      {/* Session Indicator - desktop only, fixed at top-left */}
      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

      {/* Theme Toggle - desktop only */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-accent-cyan" />
          ) : (
            <Moon className="h-5 w-5 text-primary-dark" />
          )}
        </button>
      )}

      {/* Back Button - always visible on ALL screen sizes.
          On mobile (< md): top-6 left-6 (session indicator is hidden, hamburger menu is shown instead)
          On desktop (>= md): top-20 left-6 — visually below the session indicator which sits at top-6 */}
      {showBackButton && (
        <button
          onClick={handleBackClick}
          className="fixed top-6 left-6 md:top-20 md:left-6 z-40 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5 text-accent-cyan" />
        </button>
      )}

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}
    </>
  );
}
