import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@tanstack/react-router';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import KnowledgeCategoryCarousel from '../components/KnowledgeCategoryCarousel';
import KnowledgeBookPager from '../components/KnowledgeBookPager';
import KnowledgeQuizDialog from '../components/KnowledgeQuizDialog';
import { TECHNIQUE_CONTENT } from '../lib/knowledgeContent';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { getQuizScores, saveQuizScore } from '../utils/knowledgeQuizStorage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface KnowledgeSearch {
  category?: string;
  scrollToContent?: boolean;
}

export default function KnowledgePage() {
  const search = useSearch({ from: '/knowledge' }) as KnowledgeSearch;
  const { identity } = useInternetIdentity();
  
  // Sync category with search param, validate it exists
  const validCategory = TECHNIQUE_CONTENT.find((t) => t.id === search.category);
  const initialCategoryId = validCategory ? search.category! : TECHNIQUE_CONTENT[0].id;
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const selectedTechnique = TECHNIQUE_CONTENT.find((t) => t.id === selectedCategoryId) || TECHNIQUE_CONTENT[0];

  // Sync selectedCategoryId when search.category changes
  useEffect(() => {
    if (search.category) {
      const validCat = TECHNIQUE_CONTENT.find((t) => t.id === search.category);
      if (validCat) {
        setSelectedCategoryId(search.category);
      }
    }
  }, [search.category]);

  // Load quiz scores on mount and when identity changes
  useEffect(() => {
    const principalId = identity?.getPrincipal().toString();
    const scores = getQuizScores(principalId);
    const scoreMap: Record<string, number> = {};
    Object.values(scores).forEach((score) => {
      scoreMap[score.categoryId] = score.score;
    });
    setQuizScores(scoreMap);
  }, [identity]);

  // Handle deep-link scroll from Pre-meditation "More details"
  useEffect(() => {
    if (search.scrollToContent && !hasScrolledRef.current && contentRef.current) {
      hasScrolledRef.current = true;
      // Small delay to ensure layout is complete
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [search.scrollToContent, selectedCategoryId]);

  // Reset scroll flag when category changes
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [selectedCategoryId]);

  const handleQuizComplete = (score: number, total: number) => {
    const principalId = identity?.getPrincipal().toString();
    saveQuizScore(selectedTechnique.id, score, total, principalId);
    setQuizScores((prev) => ({
      ...prev,
      [selectedTechnique.id]: score,
    }));
  };

  return (
    <PageBackgroundShell variant="default" intensity={0.35}>
      {/* Standard navigation overlay */}
      <StandardPageNav />

      <div className="relative z-10 min-h-screen pb-20">
        <div className="container mx-auto px-4 pt-24 pb-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Knowledge Library
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore meditation techniques with in-depth guides and test your understanding
            </p>
          </div>

          {/* Category Carousel */}
          <div className="mb-12">
            <KnowledgeCategoryCarousel
              categories={TECHNIQUE_CONTENT}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </div>

          {/* Content Section */}
          <div ref={contentRef} className="max-w-4xl mx-auto">
            <div>
              {/* Technique Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedTechnique.icon}
                    alt={selectedTechnique.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {selectedTechnique.title}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {selectedTechnique.description}
                    </p>
                  </div>
                </div>

                {/* Quiz Button with Score Badge */}
                <Button
                  onClick={() => setQuizOpen(true)}
                  className="bg-accent-cyan hover:bg-accent-cyan/90 text-white relative"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Take Quiz
                  {quizScores[selectedTechnique.id] !== undefined && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {quizScores[selectedTechnique.id]}
                    </span>
                  )}
                </Button>
              </div>

              {/* Book-style Pager */}
              <KnowledgeBookPager 
                pages={selectedTechnique.pages}
                categoryTitle={selectedTechnique.title}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Dialog */}
      <KnowledgeQuizDialog
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        categoryTitle={selectedTechnique.title}
        questions={selectedTechnique.quiz}
        onComplete={handleQuizComplete}
      />
    </PageBackgroundShell>
  );
}
