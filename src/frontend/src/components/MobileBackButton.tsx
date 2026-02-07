import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileBackButtonProps {
  onBack?: () => void;
}

export default function MobileBackButton({ onBack }: MobileBackButtonProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
    navigate({ to: '/dashboard' });
  };

  return (
    <div className="fixed top-4 left-4 z-50 sm:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBackClick}
        className="bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50 shadow-lg mobile-back-button"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
    </div>
  );
}
