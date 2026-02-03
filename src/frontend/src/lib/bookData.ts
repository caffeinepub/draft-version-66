import type { Book } from '../backend';

// Extended Book type with Amazon link
export interface BookWithAmazon extends Omit<Book, 'goodreadsLink'> {
  amazonLink: string;
}

export const BOOK_RECOMMENDATIONS: BookWithAmazon[] = [
  {
    title: 'The Science of Enlightenment',
    author: 'Shinzen Young',
    description: 'A comprehensive guide to meditation practice, blending scientific insights with spiritual wisdom. Shinzen Young offers a systematic approach to understanding consciousness and achieving deep meditative states.',
    amazonLink: 'https://www.amazon.com/Science-Enlightenment-How-Meditation-Works/dp/1591794609',
    tags: ['Mindfulness', 'Enlightenment', 'Practice'],
    icon: 'lotus',
  },
  {
    title: 'Mastering the Core Teachings of the Buddha',
    author: 'Daniel Ingram',
    description: 'An in-depth exploration of advanced meditation practices from a practical, no-nonsense perspective. This book provides detailed maps of meditative progress and addresses common challenges practitioners face.',
    amazonLink: 'https://www.amazon.com/Mastering-Core-Teachings-Buddha-Unusually/dp/1911597108',
    tags: ['Buddhism', 'Practice', 'Advanced'],
    icon: 'brain',
  },
  {
    title: 'The Mind Illuminated',
    author: 'Culadasa (John Yates), Matthew Immergut, Jeremy Graves',
    description: 'A detailed, step-by-step meditation manual combining Buddhist wisdom with neuroscience. This comprehensive guide offers a clear roadmap for developing stable attention and mindfulness.',
    amazonLink: 'https://www.amazon.com/Mind-Illuminated-Meditation-Integrating-Mindfulness/dp/1501156985',
    tags: ['Focus', 'Mindfulness', 'Neuroscience'],
    icon: 'book',
  },
  {
    title: 'The Power of Now',
    author: 'Eckhart Tolle',
    description: 'A spiritual guide focused on mindfulness, present moment awareness, and the transformative power of living mindfully. Tolle explores how to free yourself from the prison of time and discover inner peace.',
    amazonLink: 'https://www.amazon.com/Power-Now-Guide-Spiritual-Enlightenment/dp/1577314808',
    tags: ['Mindfulness', 'Spirituality', 'Present Moment'],
    icon: 'heart',
  },
  {
    title: '10% Happier',
    author: 'Dan Harris',
    description: 'A personal journey into mindfulness meditation, offering practical tips and insights for skeptics. Harris shares his transformation from stressed news anchor to meditation advocate with humor and honesty.',
    amazonLink: 'https://www.amazon.com/10-Happier-Self-Help-Actually-Works/dp/0062265431',
    tags: ['Personal Growth', 'Mindfulness', 'Beginner-Friendly'],
    icon: 'meditation',
  },
  {
    title: 'Real Happiness',
    author: 'Sharon Salzberg',
    description: 'An accessible guide introducing meditation techniques and principles for sustainable happiness. Salzberg offers a 28-day program that makes meditation approachable for beginners.',
    amazonLink: 'https://www.amazon.com/Real-Happiness-Power-Meditation-Program/dp/0761159258',
    tags: ['Happiness', 'Mindfulness', 'Beginner-Friendly'],
    icon: 'book',
  },
  {
    title: 'Waking Up',
    author: 'Sam Harris',
    description: 'An exploration of meditation, mindfulness, and non-duality from a neuroscience and philosophy perspective. Harris bridges the gap between spirituality and rationality with clarity and depth.',
    amazonLink: 'https://www.amazon.com/Waking-Up-Spirituality-Without-Religion/dp/1451636016',
    tags: ['Neuroscience', 'Non-duality', 'Philosophy'],
    icon: 'meditation',
  },
  {
    title: 'Wherever You Go, There You Are',
    author: 'Jon Kabat-Zinn',
    description: 'A classic introduction to mindfulness meditation and its practical application in daily life. Kabat-Zinn shows how mindfulness can transform ordinary moments into opportunities for awareness.',
    amazonLink: 'https://www.amazon.com/Wherever-You-Go-There-Are/dp/1401307787',
    tags: ['Mindful Living', 'Self-help', 'Daily Practice'],
    icon: 'lotus',
  },
  {
    title: 'Radical Acceptance',
    author: 'Tara Brach',
    description: 'A powerful guide to embracing your life with the heart of a Buddha. Brach combines Western psychology with Eastern spiritual practices to help readers overcome self-judgment and fear.',
    amazonLink: 'https://www.amazon.com/Radical-Acceptance-Embracing-Heart-Buddha/dp/0553380990',
    tags: ['Self-Compassion', 'Mindfulness', 'Psychology'],
    icon: 'heart',
  },
  {
    title: 'The Miracle of Mindfulness',
    author: 'Thich Nhat Hanh',
    description: 'A beautiful introduction to mindfulness practice through simple exercises and profound insights. Thich Nhat Hanh teaches how to bring awareness to everyday activities.',
    amazonLink: 'https://www.amazon.com/Miracle-Mindfulness-Introduction-Practice-Meditation/dp/0807012394',
    tags: ['Mindfulness', 'Daily Practice', 'Zen'],
    icon: 'lotus',
  },
  {
    title: 'Mindfulness in Plain English',
    author: 'Bhante Henepola Gunaratana',
    description: 'A clear, straightforward guide to Vipassana meditation. This classic text demystifies meditation practice with practical instructions and addresses common misconceptions.',
    amazonLink: 'https://www.amazon.com/Mindfulness-Plain-English-Bhante-Gunaratana/dp/0861719069',
    tags: ['Vipassana', 'Practice', 'Beginner-Friendly'],
    icon: 'book',
  },
  {
    title: 'The Untethered Soul',
    author: 'Michael A. Singer',
    description: 'A journey beyond yourself to discover inner peace and freedom. Singer explores the nature of consciousness and offers insights on releasing limiting thoughts and emotions.',
    amazonLink: 'https://www.amazon.com/Untethered-Soul-Journey-Beyond-Yourself/dp/1572245379',
    tags: ['Consciousness', 'Freedom', 'Spirituality'],
    icon: 'meditation',
  },
];
