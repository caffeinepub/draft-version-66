import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SavedRitualsCarousel from './SavedRitualsCarousel';
import type { Ritual } from '../backend';

interface RitualSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rituals: Ritual[];
  onSelect: (ritual: Ritual) => void;
  onDelete: (ritual: Ritual) => Promise<void>;
  isDeleting?: boolean;
}

export default function RitualSelectionModal({
  open,
  onOpenChange,
  rituals,
  onSelect,
  onDelete,
  isDeleting = false,
}: RitualSelectionModalProps) {
  const handleSelect = (ritual: Ritual) => {
    onSelect(ritual);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-sm border-accent-cyan/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-accent-cyan">Your Rituals</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a ritual to begin your meditation session
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <SavedRitualsCarousel 
            rituals={rituals} 
            onSelect={handleSelect} 
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
