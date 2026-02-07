import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Timer, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Ritual } from '../backend';

interface SavedRitualsCarouselProps {
  rituals: Ritual[];
  onSelect: (ritual: Ritual) => void;
  onDelete: (ritual: Ritual) => Promise<void>;
  isDeleting?: boolean;
}

const meditationTypeIcons: Record<string, string> = {
  mindfulness: '/assets/mindfulness.png',
  metta: '/assets/meta.png',
  visualization: '/assets/visualization.png',
  ifs: '/assets/ifs.png',
};

const ambientSoundLabels: Record<string, string> = {
  'none': 'None',
  'ocean': 'Ocean',
  'rain': 'Rain',
  'birds': 'Birds',
  'crickets': 'Crickets',
  'nature-resonance': 'Nature Resonance',
  'nature-resonance-2': 'Nature Resonance 2',
  'nature-resonance-3': 'Nature Resonance 3',
  'singing-bowl': 'Singing Bowl',
  'soothing': 'Soothing',
  'temple': 'Temple',
};

export default function SavedRitualsCarousel({ rituals, onSelect, onDelete, isDeleting = false }: SavedRitualsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ritualToDelete, setRitualToDelete] = useState<Ritual | null>(null);
  const [deletingRitualTimestamp, setDeletingRitualTimestamp] = useState<bigint | null>(null);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? rituals.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === rituals.length - 1 ? 0 : prev + 1));
  };

  const handleDeleteClick = (ritual: Ritual) => {
    setRitualToDelete(ritual);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ritualToDelete) {
      setDeletingRitualTimestamp(ritualToDelete.timestamp);
      try {
        await onDelete(ritualToDelete);
        // Adjust index if needed after deletion
        if (currentIndex >= rituals.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } catch (error: any) {
        // Error already handled by mutation onError
      } finally {
        setDeletingRitualTimestamp(null);
      }
    }
    setDeleteDialogOpen(false);
    setRitualToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setRitualToDelete(null);
  };

  if (rituals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No saved rituals yet</p>
      </div>
    );
  }

  const currentRitual = rituals[currentIndex];
  const isDeletingThisRitual = deletingRitualTimestamp === currentRitual.timestamp;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Carousel Container */}
      <div className="relative min-h-[180px] mb-10">
        <div className={`bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-accent-cyan/20 shadow-lg ${isDeletingThisRitual ? 'opacity-50' : ''}`}>
          <div className="space-y-4">
            {/* Ritual Details */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg">
                <img 
                  src={meditationTypeIcons[currentRitual.meditationType] || '/assets/mindfulness.png'} 
                  alt={currentRitual.meditationType}
                  className="w-4 h-4 object-contain"
                />
                <span className="text-base font-medium text-accent-cyan capitalize">
                  {currentRitual.meditationType}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg">
                <Timer className="w-4 h-4 text-accent-cyan" />
                <span className="text-base font-medium text-accent-cyan">
                  {currentRitual.duration.toString()} min
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg">
                <Music className="w-4 h-4 text-accent-cyan" />
                <span className="text-base font-medium text-accent-cyan">
                  {ambientSoundLabels[currentRitual.ambientSound] || currentRitual.ambientSound}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onSelect(currentRitual)}
                disabled={isDeletingThisRitual}
                className="flex-1 bg-accent-cyan hover:bg-accent-cyan-tinted"
              >
                Start Ritual
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDeleteClick(currentRitual)}
                disabled={isDeletingThisRitual}
                className="border-red-500/50 hover:bg-red-500/10"
              >
                {isDeletingThisRitual ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-500" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {rituals.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={isDeletingThisRitual}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 hover:bg-accent-cyan/10"
            >
              <ChevronLeft className="w-6 h-6 text-accent-cyan" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={isDeletingThisRitual}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 hover:bg-accent-cyan/10"
            >
              <ChevronRight className="w-6 h-6 text-accent-cyan" />
            </Button>
          </>
        )}
      </div>

      {/* Indicator Dots */}
      {rituals.length > 1 && (
        <div className="flex justify-center gap-2">
          {rituals.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              disabled={isDeletingThisRitual}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-accent-cyan w-6' : 'bg-accent-cyan/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ritual?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ritual? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
