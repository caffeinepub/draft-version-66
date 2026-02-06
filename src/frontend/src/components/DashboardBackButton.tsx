import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function DashboardBackButton() {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop back button - top left */}
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

      {/* Mobile back button - top left */}
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
    </>
  );
}
