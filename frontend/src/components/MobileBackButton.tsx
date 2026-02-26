import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface MobileBackButtonProps {
  show?: boolean;
  onBack?: () => void;
}

export default function MobileBackButton({ show = false, onBack }: MobileBackButtonProps) {
  const navigate = useNavigate();

  if (!show) return null;

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    }
    navigate({ to: '/dashboard' });
  };

  return (
    <button
      onClick={handleGoBack}
      className="md:hidden fixed top-6 left-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
      aria-label="Go back to dashboard"
    >
      <ArrowLeft className="h-5 w-5 text-accent-cyan" />
    </button>
  );
}
