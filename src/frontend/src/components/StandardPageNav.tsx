import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import SessionIndicator from './SessionIndicator';
import HamburgerMenu from './HamburgerMenu';

interface StandardPageNavProps {
  showBackButton?: boolean;
}

export default function StandardPageNav({ showBackButton = true }: StandardPageNavProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Desktop back button - top left */}
      {showBackButton && (
        <div className="hidden sm:block fixed top-6 left-6 z-50">
          <Button
            onClick={() => navigate({ to: '/dashboard' })}
            variant="ghost"
            size="icon"
            className="bg-card/70 backdrop-blur-sm hover:bg-card border border-accent-cyan/20 hover:border-accent-cyan/40 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-accent-cyan" />
          </Button>
        </div>
      )}

      {/* Theme toggle - top right */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <Button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          variant="ghost"
          size="icon"
          className="bg-card/70 backdrop-blur-sm hover:bg-card border border-accent-cyan/20 hover:border-accent-cyan/40 transition-all"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-accent-cyan" />
          ) : (
            <Moon className="w-5 h-5 text-accent-cyan" />
          )}
        </Button>

        {/* Session indicator - desktop only */}
        <div className="hidden sm:block">
          <SessionIndicator />
        </div>
      </div>

      {/* Mobile back button - top left */}
      {showBackButton && (
        <div className="sm:hidden fixed top-4 left-4 z-50">
          <Button
            onClick={() => navigate({ to: '/dashboard' })}
            variant="ghost"
            size="icon"
            className="bg-card/70 backdrop-blur-sm hover:bg-card border border-accent-cyan/20 hover:border-accent-cyan/40 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-accent-cyan" />
          </Button>
        </div>
      )}

      {/* Mobile hamburger menu - top right */}
      <div className="sm:hidden fixed top-4 right-4 z-50">
        <HamburgerMenu />
      </div>
    </>
  );
}
