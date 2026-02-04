import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

export default function SessionIndicator() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Don't show anything while initializing
  if (isInitializing) {
    return null;
  }

  // Check if user is authenticated (not anonymous)
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  const handleReturnToStart = () => {
    navigate({ to: '/' });
  };

  const handleLogout = async () => {
    // Clear all authenticated queries before logout
    queryClient.removeQueries({ queryKey: ['journalEntries'] });
    queryClient.removeQueries({ queryKey: ['progressStats'] });
    queryClient.removeQueries({ queryKey: ['currentUserProfile'] });
    queryClient.removeQueries({ queryKey: ['rituals'] });
    
    await clear();
    navigate({ to: '/' });
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed top-6 left-6 z-50 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-border/50 max-sm:left-2">
        <span className="text-xs sm:text-sm font-medium text-accent-cyan">
          Exploring as Guest (Saved Locally)
        </span>
        <Button
          onClick={handleReturnToStart}
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs hover:bg-accent-cyan/10 hover:text-accent-cyan transition-all"
        >
          <LogIn className="w-3 h-3 mr-1" />
          Return to Start
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-6 left-6 z-50 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-border/50 max-sm:left-2">
      <span className="text-xs sm:text-sm font-medium text-accent-cyan">
        Logged In
      </span>
      <Button
        onClick={handleLogout}
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs hover:bg-accent-cyan/10 hover:text-accent-cyan transition-all"
      >
        <LogOut className="w-3 h-3 mr-1" />
        Logout
      </Button>
    </div>
  );
}
