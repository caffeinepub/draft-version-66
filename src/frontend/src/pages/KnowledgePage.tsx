import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, BookOpen, Award, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LotusCanvas from '../components/LotusCanvas';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import KnowledgeQuizDialog from '../components/KnowledgeQuizDialog';
import MobileBackButton from '../components/MobileBackButton';
import KnowledgeCategoryCarousel from '../components/KnowledgeCategoryCarousel';
import KnowledgeBookPager from '../components/KnowledgeBookPager';
import { TECHNIQUE_CONTENT } from '../lib/knowledgeContent';
import { useQuizScores } from '../utils/knowledgeQuizStorage';

interface KnowledgeSearch {
  category?: string;
  scrollToContent?: boolean;
}

export default function KnowledgePage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const search = useSearch({ from: '/knowledge' }) as KnowledgeSearch;
  const [mounted, setMounted] = useState(false);
  
  // Initialize selectedCategory from search param if valid, otherwise use first category
  const getInitialCategory = () => {
    if (search.category) {
      const isValid = TECHNIQUE_CONTENT.some((t) => t.id === search.category);
      if (isValid) return search.category;
    }
    return TECHNIQUE_CONTENT[0].id;
  };
  
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory());
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizCategory, setQuizCategory] = useState<string | null>(null);
  const [categoryTransitioning, setCategoryTransitioning] = useState(false);
  const { scores, saveScore } = useQuizScores();
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update selectedCategory when search.category changes (e.g., from navigation)
  useEffect(() => {
    if (search.category) {
      const isValid = TECHNIQUE_CONTENT.some((t) => t.id === search.category);
      if (isValid && search.category !== selectedCategory) {
        setSelectedCategory(search.category);
      }
    }
  }, [search.category]);

  // Handle deep-link scroll from Pre-meditation "More details"
  useEffect(() => {
    if (mounted && search.scrollToContent && !hasScrolledRef.current && contentSectionRef.current) {
      hasScrolledRef.current = true;
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Clear only scrollToContent param, preserve category
        navigate({ 
          to: '/knowledge', 
          search: search.category ? { category: search.category } : {}, 
          replace: true 
        });
      }, 100);
    }
  }, [mounted, search.scrollToContent, search.category, navigate]);

  const selectedContent = TECHNIQUE_CONTENT.find((t) => t.id === selectedCategory) || TECHNIQUE_CONTENT[0];
  const quizContent = TECHNIQUE_CONTENT.find((t) => t.id === quizCategory);

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId !== selectedCategory) {
      setCategoryTransitioning(true);
      setTimeout(() => {
        setSelectedCategory(categoryId);
        setCategoryTransitioning(false);
      }, 150);
    }
  };

  const handleTakeQuiz = (categoryId: string) => {
    setQuizCategory(categoryId);
    setQuizOpen(true);
  };

  const handleQuizComplete = (score: number, total: number) => {
    if (quizCategory) {
      saveScore(quizCategory, score, total);
    }
  };

  const categories = TECHNIQUE_CONTENT.map((t) => ({
    id: t.id,
    title: t.title,
    icon: t.icon,
  }));

  return (
    <div className="relative min-h-screen bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      <LotusCanvas variant="enhanced" intensity={0.5} />

      {/* Desktop Session Indicator */}
      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

      {/* Desktop Theme Toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-accent-cyan" />
          ) : (
            <Moon className="h-5 w-5 text-primary-dark" />
          )}
        </button>
      )}

      {/* Desktop Back Button */}
      <button
        onClick={() => navigate({ to: '/dashboard' })}
        className="hidden md:block fixed top-20 left-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-5 w-5 text-accent-cyan" />
      </button>

      {/* Mobile Back Button */}
      {mounted && <MobileBackButton show={true} />}

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}

      {/* Main Content */}
      <main className="relative z-10 min-h-screen px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-accent-cyan">
              Knowledge Center
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore in-depth guides on meditation techniques
            </p>
          </div>

          {/* Category Carousel */}
          <KnowledgeCategoryCarousel
            categories={categories}
            selectedId={selectedCategory}
            onSelect={handleCategorySelect}
          />

          {/* Content Section Anchor for deep-link scroll */}
          <div ref={contentSectionRef} className="scroll-mt-4" />

          {/* Category Header - No bordered container */}
          <div
            className={`transition-opacity duration-150 ${categoryTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h2 className="text-2xl font-playfair font-bold text-accent-cyan">
                    {selectedContent.title}
                  </h2>
                  {scores[selectedContent.id] && (
                    <Badge variant="outline" className="border-accent-cyan/50 text-accent-cyan w-fit">
                      <Award className="w-3 h-3 mr-1" />
                      Score: {scores[selectedContent.id].score}/{scores[selectedContent.id].total}
                    </Badge>
                  )}
                </div>
                <p className="text-base text-muted-foreground">{selectedContent.description}</p>
              </div>
              <Button
                onClick={() => handleTakeQuiz(selectedContent.id)}
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold w-full sm:w-auto"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Take Quiz
              </Button>
            </div>

            {/* Book Pager - Uses natural page scroll with anchor-based scrolling */}
            <div className="mt-6">
              <KnowledgeBookPager 
                key={selectedContent.id}
                pages={selectedContent.pages} 
                categoryTitle={selectedContent.title} 
              />
            </div>
          </div>
        </div>
      </main>

      {/* Quiz Dialog */}
      {quizContent && (
        <KnowledgeQuizDialog
          open={quizOpen}
          onClose={() => {
            setQuizOpen(false);
            setQuizCategory(null);
          }}
          categoryTitle={quizContent.title}
          questions={quizContent.quiz}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
}
