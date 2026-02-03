import { useState } from 'react';
import { BookOpen, TrendingUp, Book } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

const navItems: NavItem[] = [
  {
    id: 'journal',
    label: 'Journal',
    icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />,
    path: '/journal',
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
    path: '/progress',
  },
  {
    id: 'books',
    label: 'Books',
    icon: <Book className="w-5 h-5 sm:w-6 sm:h-6" />,
    path: '/books',
  },
];

export default function FloatingNav() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleClick = (item: NavItem) => {
    if (item.path) {
      navigate({ to: item.path });
    }
  };

  return (
    <div className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 space-y-4 sm:space-y-6">
      {navItems.map((item, index) => (
        <div
          key={item.id}
          className="relative animate-float"
          style={{
            animationDelay: `${index * 0.2}s`,
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <button
            onClick={() => handleClick(item)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-card/60 backdrop-blur-md border-2 border-accent-cyan/30 hover:border-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300 flex items-center justify-center text-accent-cyan hover:scale-110 shadow-lg"
            aria-label={item.label}
          >
            {item.icon}
          </button>

          {hoveredItem === item.id && (
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap">
              <div className="bg-card/90 backdrop-blur-md border border-accent-cyan/50 rounded-lg px-4 py-2 shadow-glow animate-fade-in">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
