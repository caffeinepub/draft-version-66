import type { Book } from '../backend';

// Extended Book type with Amazon link
export interface BookWithAmazon extends Omit<Book, 'goodreadsLink'> {
  amazonLink: string;
}

export const BOOK_RECOMMENDATIONS: BookWithAmazon[] = [
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
    title: 'Wherever You Go, There You Are',
    author: 'Jon Kabat-Zinn',
    description: 'A classic introduction to mindfulness meditation and its practical application in daily life. Kabat-Zinn shows how mindfulness can transform ordinary moments into opportunities for awareness.',
    amazonLink: 'https://www.amazon.com/Wherever-You-Go-There-Are/dp/1401307787',
    tags: ['Mindful Living', 'Self-help', 'Daily Practice'],
    icon: 'lotus',
  },
  {
    title: 'The Headspace Guide to Meditation and Mindfulness',
    author: 'Andy Puddicombe',
    description: 'A practical, accessible guide to developing and maintaining a daily meditation practice. Puddicombe breaks down meditation techniques into simple, actionable steps for modern life.',
    amazonLink: 'https://www.amazon.com/Get-Some-Headspace-Mindfulness-Minutes/dp/1250104904',
    tags: ['Mindfulness', 'Practice', 'Beginner-Friendly'],
    icon: 'focus',
  },
  {
    title: 'Mindfulness for Beginners',
    author: 'Jon Kabat-Zinn',
    description: 'A practical introduction to mindfulness techniques and their everyday benefits. This guide offers clear instructions and exercises to help you establish a consistent meditation practice.',
    amazonLink: 'https://www.amazon.com/Mindfulness-Beginners-Reclaiming-Present-Moment/dp/1604076585',
    tags: ['Mindfulness', 'Beginner-Friendly', 'Techniques'],
    icon: 'book',
  },
  {
    title: 'The Relaxation and Stress Reduction Workbook',
    author: 'Martha Davis, Elizabeth Robbins Eshelman, Matthew McKay',
    description: 'A comprehensive guide featuring evidence-based techniques for managing stress and anxiety through meditation, breathing exercises, and mindfulness practices.',
    amazonLink: 'https://www.amazon.com/Relaxation-Stress-Reduction-Workbook-Harbinger/dp/1684034833',
    tags: ['Stress Reduction', 'Techniques', 'Practical'],
    icon: 'heart',
  },
  {
    title: 'Breath: The New Science of a Lost Art',
    author: 'James Nestor',
    description: 'An exploration of breathing techniques and their profound impact on health and well-being. Nestor combines scientific research with practical exercises to improve meditation and daily life.',
    amazonLink: 'https://www.amazon.com/Breath-New-Science-Lost-Art/dp/0735213615',
    tags: ['Breathing', 'Science', 'Techniques'],
    icon: 'meditation',
  },
];
