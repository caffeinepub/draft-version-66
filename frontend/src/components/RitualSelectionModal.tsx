import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import SavedRitualsCarousel from './SavedRitualsCarousel';

interface Ritual {
  meditationType: string;
  duration: number;
  ambientSound: string;
  ambientSoundVolume: number;
  timestamp: string;
  displayName: string;
}

interface RitualSelectionModalProps {
  open: boolean;
  onClose: () => void;
  rituals: Ritual[];
  onStart: (ritual: Ritual) => void;
  onDelete: (ritual: Ritual) => Promise<void>;
  isDeleting?: boolean;
}

export default function RitualSelectionModal({ 
  open, 
  onClose, 
  rituals, 
  onStart, 
  onDelete,
  isDeleting = false 
}: RitualSelectionModalProps) {
  // Limit to 5 rituals
  const displayRituals = rituals.slice(0, 5);

  // Reset active index when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose();
    }
  };

  if (displayRituals.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-accent-cyan-tinted">Your Rituals</DialogTitle>
            <DialogDescription className="text-base text-description-gray">
              You have no saved rituals yet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <p className="text-foreground text-center">
              Complete a meditation session and save it as a ritual to see it here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-accent-cyan-tinted">Your Rituals</DialogTitle>
          <DialogDescription className="text-base text-description-gray">
            Select a ritual to begin your meditation
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <SavedRitualsCarousel 
            rituals={displayRituals} 
            onStart={onStart} 
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
