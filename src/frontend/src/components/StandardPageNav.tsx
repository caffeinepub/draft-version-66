import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SessionIndicator from './SessionIndicator';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import MobileBackButton from './MobileBackButton';
import HamburgerMenu from './HamburgerMenu';

interface StandardPageNavProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function StandardPageNav({ showBackButton = true, onBack }: StandardPageNavProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
    navigate({ to: '/dashboard' });
  };

  return (
    <>
      {/* Desktop back button - top left */}
      {showBackButton && (
        <div className="fixed top-6 left-6 z-50 hidden sm:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Theme toggle - top right */}
      <div className="fixed top-6 right-6 z-50 hidden sm:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50 shadow-lg"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      {/* Session indicator - top center */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden sm:block">
        <SessionIndicator />
      </div>

      {/* Mobile back button - top left on mobile */}
      {showBackButton && <MobileBackButton onBack={onBack} />}

      {/* Mobile hamburger menu - top right on mobile */}
      <div className="sm:hidden">
        <HamburgerMenu />
      </div>
    </>
  );
}
