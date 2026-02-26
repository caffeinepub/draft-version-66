// Single source of truth for ambient sound mappings
export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  audioPath: string;
}

export const ambientSounds: AmbientSound[] = [
  {
    id: 'temple',
    name: 'Temple Bells',
    icon: '/assets/temple.png',
    audioPath: '/assets/Temple.mp3',
  },
  {
    id: 'singing-bowl',
    name: 'Singing Bowl',
    icon: '/assets/singing-bowl.png',
    audioPath: '/assets/Singing bowl.mp3',
  },
  {
    id: 'rain',
    name: 'Gentle Rain',
    icon: '/assets/rainy.png',
    audioPath: '/assets/Rain.mp3',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: '/assets/ocean wave.png',
    audioPath: '/assets/Ocean.mp3',
  },
  {
    id: 'soothing',
    name: 'Soothing Melody',
    icon: '/assets/soothing.png',
    audioPath: '/assets/Soothing.mp3',
  },
  {
    id: 'birds',
    name: 'Forest Birds',
    icon: '/assets/birds.png',
    audioPath: '/assets/Birds.mp3',
  },
  {
    id: 'crickets',
    name: 'Night Crickets',
    icon: '/assets/cricket.png',
    audioPath: '/assets/Crickets.mp3',
  },
];

export function getAmbientSoundById(id: string): AmbientSound | undefined {
  return ambientSounds.find((sound) => sound.id === id);
}

export function getAmbientSoundPath(id: string): string {
  const sound = getAmbientSoundById(id);
  return sound?.audioPath || '/assets/Temple.mp3';
}
