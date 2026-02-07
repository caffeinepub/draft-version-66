import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import SessionIndicator from './SessionIndicator';
import HamburgerMenu from './HamburgerMenu';
import MobileBackButton from './MobileBackButton';

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
      {/* Desktop Session Indicator */}
      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

      {/* Desktop Theme Toggle */}
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

      {/* Desktop Back Button - conditionally rendered */}
      {showBackButton && (
        <button
          onClick={handleBackClick}
          className="hidden md:block fixed top-20 left-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5 text-accent-cyan" />
        </button>
      )}

      {/* Mobile Back Button - conditionally rendered */}
      {mounted && showBackButton && <MobileBackButton show={true} onBack={onBack} />}

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}
    </>
  );
}
