import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useActor } from '../hooks/useActor';

interface QuizQuestion {
  question: string;
  options: string[];
}

interface QuizDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (recommendedType: string) => void;
}

// Revised quiz with 5 appropriate questions
const revisedQuizQuestions: QuizQuestion[] = [
  {
    question: 'How would you describe your current emotional state?',
    options: [
      'Stressed or overwhelmed',
      'Disconnected or lonely',
      'Restless or scattered',
      'Seeking deeper self-understanding',
    ],
  },
  {
    question: 'What is your primary goal for meditation right now?',
    options: [
      'To calm my mind and reduce anxiety',
      'To cultivate compassion and connection',
      'To gain clarity and focus',
      'To explore and understand my inner world',
    ],
  },
  {
    question: 'Which statement resonates most with you?',
    options: [
      'I need to ground myself in the present moment',
      'I want to feel more loving toward myself and others',
      'I need help visualizing positive outcomes',
      'I want to understand different parts of myself',
    ],
  },
  {
    question: 'What kind of mental state are you experiencing?',
    options: [
      'Racing thoughts and mental chatter',
      'Feeling closed off or guarded',
      'Difficulty concentrating or planning',
      'Inner conflict or confusion',
    ],
  },
  {
    question: 'What type of guidance appeals to you most?',
    options: [
      'Simple breath awareness and presence',
      'Phrases of loving-kindness and compassion',
      'Guided imagery and mental visualization',
      'Dialogue with different aspects of myself',
    ],
  },
];

export default function QuizDialog({ open, onClose, onComplete }: QuizDialogProps) {
  const { actor } = useActor();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<number | undefined>(undefined);
  const [showResult, setShowResult] = useState(false);
  const [recommendedType, setRecommendedType] = useState('');
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [quizQuestions] = useState<QuizQuestion[]>(revisedQuizQuestions);
  const [isLoading] = useState(false);

  const handleAnswer = (optionIndex: number) => {
    setCurrentAnswer(optionIndex);
  };

  const handleNext = async () => {
    if (currentAnswer === undefined) return;

    // Save the current answer
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = currentAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      // Move to next question and completely reset selection
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer(undefined);
    } else {
      // Calculate result with all answers
      await calculateResult(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Restore the previous answer
      setCurrentAnswer(answers[currentQuestion - 1]);
    }
  };

  const calculateResult = async (finalAnswers: number[]) => {
    try {
      // Calculate scores for each meditation type based on answers
      const scores = {
        mindfulness: 0,
        metta: 0,
        visualization: 0,
        ifs: 0,
      };

      // Score each answer (option 0 = mindfulness, 1 = metta, 2 = visualization, 3 = ifs)
      finalAnswers.forEach((answer) => {
        if (answer === 0) scores.mindfulness++;
        else if (answer === 1) scores.metta++;
        else if (answer === 2) scores.visualization++;
        else if (answer === 3) scores.ifs++;
      });

      // Find the highest score
      const maxScore = Math.max(...Object.values(scores));
      const recommendedTypes = Object.entries(scores)
        .filter(([_, score]) => score === maxScore)
        .map(([type]) => type);

      // If tie, use first answer as tiebreaker
      const recommended = recommendedTypes.length > 1 
        ? ['mindfulness', 'metta', 'visualization', 'ifs'][finalAnswers[0]]
        : recommendedTypes[0];

      const messages: Record<string, string> = {
        mindfulness: 'Mindfulness meditation will help you find calm and presence in the moment, anchoring you through breath awareness.',
        metta: 'Metta (loving-kindness) meditation will help you cultivate compassion and connection with yourself and others.',
        visualization: 'Visualization meditation will help you find clarity and focus through guided imagery and mental exploration.',
        ifs: 'IFS (Internal Family Systems) meditation will help you understand and integrate different parts of yourself with compassion.',
      };
      
      setRecommendedType(recommended);
      setRecommendationMessage(messages[recommended] || messages.mindfulness);
      setShowResult(true);
    } catch (error) {
      console.error('Failed to process quiz answers:', error);
      setRecommendedType('mindfulness');
      setRecommendationMessage('Based on your answers, Mindfulness meditation is recommended for your current state.');
      setShowResult(true);
    }
  };

  const handleComplete = () => {
    onComplete(recommendedType.toLowerCase());
    handleReset();
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentAnswer(undefined);
    setShowResult(false);
    setRecommendedType('');
    setRecommendationMessage('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const canProceed = currentAnswer !== undefined;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-center py-12">
            <div className="text-accent-cyan-tinted">Loading quiz...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-sm border-border/50">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-accent-cyan-tinted">No quiz questions available</div>
            <Button onClick={handleClose} className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-sm border-border/50">
        {!showResult ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-accent-cyan-tinted">
                Meditation Recommendation Quiz
              </DialogTitle>
              <DialogDescription className="text-quiz-question-light dark:text-description-gray">
                Question {currentQuestion + 1} of {quizQuestions.length}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                {quizQuestions[currentQuestion]?.question}
              </h3>
              <RadioGroup 
                value={currentAnswer !== undefined ? currentAnswer.toString() : ''} 
                onValueChange={(value) => handleAnswer(parseInt(value))}
              >
                <div className="space-y-3">
                  {quizQuestions[currentQuestion]?.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="text-base cursor-pointer text-foreground dark:text-foreground hover:text-accent-cyan transition-colors"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQuestion === 0}
                className="border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
              >
                {currentQuestion < quizQuestions.length - 1 ? 'Next' : 'Get Recommendation'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-accent-cyan-tinted">
                Your Recommended Meditation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-accent-cyan capitalize">
                  {recommendedType}
                </div>
                <p className="text-base text-accent-cyan-tinted leading-relaxed">
                  {recommendationMessage}
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
              >
                Begin This Meditation
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
