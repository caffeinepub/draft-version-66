import { useState, useEffect } from 'react';
import { Menu, Moon, Sun, LogIn, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function HamburgerMenu() {
  const { theme, setTheme } = useTheme();
  const { identity, clear, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  const handleReturnToStart = () => {
    setOpen(false);
    navigate({ to: '/' });
  };

  const handleLogout = async () => {
    // Clear all authenticated queries before logout
    queryClient.removeQueries({ queryKey: ['journalEntries'] });
    queryClient.removeQueries({ queryKey: ['progressStats'] });
    queryClient.removeQueries({ queryKey: ['currentUserProfile'] });
    queryClient.removeQueries({ queryKey: ['rituals'] });
    
    await clear();
    setOpen(false);
    navigate({ to: '/' });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-accent-cyan" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-card/95 backdrop-blur-md border-l border-border/50 p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-accent-cyan text-xl">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6">
          {/* Theme Toggle */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Theme</p>
            <Button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              variant="outline"
              className="w-full justify-start border-border/50 hover:border-accent-cyan/50 hover:bg-accent-cyan/10 text-foreground"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 mr-2 text-accent-cyan" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2 text-primary-dark" />
                  <span>Dark Mode</span>
                </>
              )}
            </Button>
          </div>

          {/* User State Indicator */}
          <div className="space-y-2 pt-4 border-t border-border/30">
            <p className="text-sm font-medium text-foreground">Account</p>
            {!isAuthenticated ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                  <p className="text-sm text-accent-cyan font-medium">
                    Exploring as Guest
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Data saved locally
                  </p>
                </div>
                <Button
                  onClick={handleReturnToStart}
                  variant="outline"
                  className="w-full justify-start border-border/50 hover:border-accent-cyan/50 hover:bg-accent-cyan/10 text-foreground"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Return to Start
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                  <p className="text-sm text-accent-cyan font-medium">
                    Logged In
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Data synced to cloud
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start border-border/50 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
