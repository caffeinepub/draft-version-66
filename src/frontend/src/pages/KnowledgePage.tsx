import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import KnowledgeCategoryCarousel from '../components/KnowledgeCategoryCarousel';
import KnowledgeBookPager from '../components/KnowledgeBookPager';
import KnowledgeQuizDialog from '../components/KnowledgeQuizDialog';
import { TECHNIQUE_CONTENT } from '../lib/knowledgeContent';
import { saveQuizScore, getQuizScores } from '../utils/knowledgeQuizStorage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

type KnowledgeCategory = 'mindfulness' | 'metta' | 'ifs' | 'visualization';

export default function KnowledgePage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/knowledge' });
  const { identity } = useInternetIdentity();

  const initialCategory = (searchParams as any)?.category || 'mindfulness';
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory>(initialCategory);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizScores, setQuizScores] = useState<Record<KnowledgeCategory, number | null>>({
    mindfulness: null,
    metta: null,
    ifs: null,
    visualization: null,
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // Load quiz scores on mount and when identity changes
  useEffect(() => {
    const principalId = identity?.getPrincipal().toString();
    const allScores = getQuizScores(principalId);
    
    const scores: Record<KnowledgeCategory, number | null> = {
      mindfulness: allScores['mindfulness'] ? Math.round((allScores['mindfulness'].score / allScores['mindfulness'].total) * 100) : null,
      metta: allScores['metta'] ? Math.round((allScores['metta'].score / allScores['metta'].total) * 100) : null,
      ifs: allScores['ifs'] ? Math.round((allScores['ifs'].score / allScores['ifs'].total) * 100) : null,
      visualization: allScores['visualization'] ? Math.round((allScores['visualization'].score / allScores['visualization'].total) * 100) : null,
    };
    setQuizScores(scores);
  }, [identity]);

  // Handle deep-link scroll from Pre-meditation "More details" button
  useEffect(() => {
    if ((searchParams as any)?.category && !hasScrolledRef.current && contentRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams]);

  const currentContent = TECHNIQUE_CONTENT.find(t => t.id === selectedCategory);
  const currentScore = quizScores[selectedCategory];

  // Build categories array for carousel
  const categories = TECHNIQUE_CONTENT.map(t => ({
    id: t.id,
    title: t.title,
    icon: t.icon,
  }));

  const handleQuizComplete = (score: number, total: number) => {
    const percentage = Math.round((score / total) * 100);
    const principalId = identity?.getPrincipal().toString();
    saveQuizScore(selectedCategory, score, total, principalId);
    setQuizScores((prev) => ({ ...prev, [selectedCategory]: percentage }));
    setQuizOpen(false);
  };

  if (!currentContent) {
    return null;
  }

  return (
    <PageBackgroundShell>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
        <div className="max-w-5xl mx-auto w-full space-y-8 sm:space-y-10 animate-fade-in mt-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Knowledge Base
            </h1>
            <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              Deepen your understanding of meditation techniques
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          {/* Category Carousel */}
          <KnowledgeCategoryCarousel
            categories={categories}
            selectedId={selectedCategory}
            onSelect={(id) => setSelectedCategory(id as KnowledgeCategory)}
          />

          {/* Content Section */}
          <div ref={contentRef} className="scroll-mt-20">
            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/20">
              <CardContent className="pt-6 space-y-6">
                {/* Category Title and Quiz Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-accent-cyan/20">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-accent-cyan mb-2">
                      {currentContent.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {currentContent.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => setQuizOpen(true)}
                    variant="outline"
                    className="border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 text-accent-cyan shrink-0"
                  >
                    Take Quiz
                    {currentScore !== null && (
                      <Badge variant="secondary" className="ml-2 bg-accent-cyan/20 text-accent-cyan border-0">
                        {currentScore}%
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Book-style Pager */}
                <KnowledgeBookPager 
                  pages={currentContent.pages} 
                  categoryTitle={currentContent.title}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Quiz Dialog */}
      <KnowledgeQuizDialog
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        categoryTitle={currentContent.title}
        questions={currentContent.quiz}
        onComplete={handleQuizComplete}
      />
    </PageBackgroundShell>
  );
}
