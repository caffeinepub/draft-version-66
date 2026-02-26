import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, RotateCcw, ChevronLeft } from 'lucide-react';
import type { QuizQuestion } from '../lib/knowledgeContent';

interface KnowledgeQuizDialogProps {
  open: boolean;
  onClose: () => void;
  categoryTitle: string;
  questions: QuizQuestion[];
  onComplete: (score: number, total: number) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function KnowledgeQuizDialog({
  open,
  onClose,
  categoryTitle,
  questions,
  onComplete,
}: KnowledgeQuizDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answersByQuestion, setAnswersByQuestion] = useState<Map<number, number>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);

  // Shuffle questions when dialog opens
  useEffect(() => {
    if (open && questions.length > 0) {
      setShuffledQuestions(shuffleArray(questions));
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setAnswersByQuestion(new Map());
      setShowResults(false);
    }
  }, [open, questions]);

  // Restore selected answer when navigating back to a question
  useEffect(() => {
    const savedAnswer = answersByQuestion.get(currentQuestionIndex);
    if (savedAnswer !== undefined) {
      setSelectedAnswer(savedAnswer.toString());
    } else {
      setSelectedAnswer('');
    }
  }, [currentQuestionIndex, answersByQuestion]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;

  const handleNext = () => {
    if (selectedAnswer === '') return;

    const answerIndex = Number(selectedAnswer);
    const newAnswers = new Map(answersByQuestion);
    newAnswers.set(currentQuestionIndex, answerIndex);
    setAnswersByQuestion(newAnswers);

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz complete - compute results from final answers
      const correctCount = Array.from(newAnswers.entries()).reduce((count, [qIndex, answer]) => {
        return count + (answer === shuffledQuestions[qIndex].correctAnswer ? 1 : 0);
      }, 0);
      setShowResults(true);
      onComplete(correctCount, shuffledQuestions.length);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRetake = () => {
    setShuffledQuestions(shuffleArray(questions));
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setAnswersByQuestion(new Map());
    setShowResults(false);
  };

  const handleClose = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setAnswersByQuestion(new Map());
    setShowResults(false);
    onClose();
  };

  const handleOptionClick = (index: number) => {
    setSelectedAnswer(index.toString());
  };

  if (!currentQuestion && !showResults) {
    return null;
  }

  const correctCount = Array.from(answersByQuestion.entries()).reduce((count, [qIndex, answer]) => {
    return count + (answer === shuffledQuestions[qIndex].correctAnswer ? 1 : 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        id="wwm4eh"
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-md border-2 border-accent-cyan/30"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-playfair text-accent-cyan">
            {categoryTitle} Quiz
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {showResults
              ? 'Quiz completed! Here are your results.'
              : `Question ${currentQuestionIndex + 1} of ${shuffledQuestions.length}`}
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6 py-4">
            <Progress value={progress} className="h-2" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{currentQuestion.question}</h3>

              <RadioGroup 
                key={`question-${currentQuestionIndex}`}
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
              >
                <div className="space-y-3">
                  {currentQuestion.choices.map((choice, index) => (
                    <div
                      key={`q${currentQuestionIndex}-choice${index}`}
                      onClick={() => handleOptionClick(index)}
                      className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border/50 hover:border-accent-cyan/50 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`q${currentQuestionIndex}-choice-${index}`} 
                      />
                      <Label 
                        htmlFor={`q${currentQuestionIndex}-choice-${index}`} 
                        className="flex-1 cursor-pointer text-foreground"
                      >
                        {choice}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-accent-cyan/50 hover:bg-accent-cyan/10"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === ''}
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-8"
              >
                {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next' : 'Finish'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan">
                <span className="text-3xl font-bold text-accent-cyan">
                  {correctCount}/{shuffledQuestions.length}
                </span>
              </div>
              <p className="text-xl font-semibold text-foreground">
                You scored {Math.round((correctCount / shuffledQuestions.length) * 100)}%
              </p>
              <p className="text-muted-foreground">
                {correctCount === shuffledQuestions.length
                  ? 'Perfect score! You have mastered this technique.'
                  : correctCount >= shuffledQuestions.length * 0.7
                  ? 'Great job! You have a solid understanding.'
                  : 'Keep learning! Review the content and try again.'}
              </p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {shuffledQuestions.map((question, index) => {
                const userAnswer = answersByQuestion.get(index);
                const isCorrect = userAnswer === question.correctAnswer;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect 
                        ? 'border-accent-cyan/50 bg-accent-cyan/5' 
                        : 'border-muted/50 bg-muted/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-foreground">{question.question}</p>
                        {!isCorrect && (
                          <p className="text-sm text-muted-foreground">
                            Correct answer: {question.choices[question.correctAnswer]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end">
              <Button onClick={handleRetake} variant="outline" className="border-accent-cyan/50 hover:bg-accent-cyan/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
              <Button onClick={handleClose} className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
