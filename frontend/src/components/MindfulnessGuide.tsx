import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MeditationGuideStepper from './MeditationGuideStepper';

type MeditationTypeKey = 'mindfulness' | 'metta' | 'visualization' | 'ifs';

interface MindfulnessGuideProps {
  meditationType: MeditationTypeKey;
}

const guideContent: Record<MeditationTypeKey, { steps: { title: string; content: string }[] }> = {
  mindfulness: {
    steps: [
      {
        title: 'Find Your Posture',
        content:
          'Sit comfortably with your back straight but not rigid—imagine a string gently pulling the crown of your head toward the sky. You can sit on a chair with feet flat on the floor, or cross-legged on a cushion with your hips slightly elevated. Rest your hands gently on your lap or knees, palms facing down for grounding or up for receptivity. Let your shoulders relax away from your ears, and soften your jaw and facial muscles.',
      },
      {
        title: 'Begin with Breath Awareness',
        content:
          'Close your eyes gently or maintain a soft downward gaze about three feet in front of you. Bring your attention to your natural breath without trying to control it. Notice the cool sensation of air entering your nostrils and the warm sensation as you exhale. Feel your chest and belly rise and fall with each breath. If it helps, you can count breaths: "one" on the inhale, "two" on the exhale, up to ten, then start again.',
      },
      {
        title: 'Anchor in the Present',
        content:
          "When your mind wanders—and it will, this is completely normal—gently acknowledge the thought without judgment. You might silently note \"thinking\" or \"planning\" and then kindly return your focus to your breath. Each time you notice you've wandered and come back is a successful moment of practice. The breath is your anchor to the present moment. Be patient and compassionate with yourself.",
      },
      {
        title: 'Transition Mindfully & Benefits',
        content:
          'When ready to end, slowly deepen your breath for three cycles. Gently wiggle your fingers and toes, roll your shoulders, and when you feel ready, open your eyes softly. Take a moment to notice how you feel—any shifts in your body, mind, or emotions.\n\nBenefits: Regular mindfulness practice reduces stress and anxiety, improves focus and concentration, enhances emotional regulation, increases self-awareness, and promotes overall mental clarity and well-being.',
      },
    ],
  },
  metta: {
    steps: [
      {
        title: 'Settle into Comfort',
        content:
          'Sit in a comfortable position with your spine upright yet relaxed. You might place your hands over your heart center or rest them gently on your lap. Allow your face to soften into a gentle, natural smile—even a subtle one can shift your internal state. Take a few deep breaths to settle in, releasing any tension you notice in your body. Create a sense of warmth and safety within yourself.',
      },
      {
        title: 'Begin with Yourself',
        content:
          'Start by directing loving-kindness toward yourself—this is often the hardest but most important step. Visualize yourself as you are right now, or as a younger version of yourself. Silently repeat these phrases with genuine intention: "May I be happy. May I be healthy. May I be safe. May I live with ease." Let the words resonate in your heart. If resistance arises, acknowledge it with compassion and continue. You deserve this kindness.',
      },
      {
        title: 'Extend to Others',
        content:
          'Bring to mind someone you care about deeply—a loved one, friend, or mentor. Visualize them clearly: their face, their presence, how they make you feel. Now direct the same loving phrases toward them with warmth and sincerity: "May you be happy. May you be healthy. May you be safe. May you live with ease." Feel the genuine wish for their well-being radiating from your heart. You can extend this practice to neutral people, difficult people, and eventually all beings.',
      },
      {
        title: 'Rest in Loving-Kindness & Benefits',
        content:
          'Conclude by expanding your awareness to include all beings everywhere—near and far, known and unknown. Silently offer: "May all beings be happy. May all beings be healthy. May all beings be safe. May all beings live with ease." Rest in the warm, expansive feeling of universal compassion. Notice any shifts in your emotional state—perhaps more openness, warmth, or connection. When ready, gently open your eyes.\n\nBenefits: Metta practice cultivates compassion and empathy, reduces negative emotions like anger and resentment, increases positive emotions and life satisfaction, improves relationships and social connection, and enhances overall emotional resilience and well-being.',
      },
    ],
  },
  visualization: {
    steps: [
      {
        title: 'Create Your Sacred Space',
        content:
          "Find a quiet, comfortable space where you won't be disturbed for the duration of your practice. You can sit upright or lie down—choose whatever position helps you relax most deeply while staying alert. Close your eyes and take several slow, deep breaths. With each exhale, release tension from your body. Imagine yourself in a safe, peaceful sanctuary—this could be a real place you know or an imagined haven. Make it vivid: notice the colors, textures, sounds, and scents.",
      },
      {
        title: 'Engage All Your Senses',
        content:
          "Begin to build your visualization with rich sensory detail. If you're imagining a beach, feel the warm sand beneath you, hear the rhythmic waves, smell the salt air, see the endless blue horizon, taste the ocean breeze. The more senses you engage, the more powerful and immersive your visualization becomes. Let yourself fully inhabit this mental landscape. Your mind doesn't distinguish between vividly imagined experiences and real ones—use this to your advantage.",
      },
      {
        title: 'Set Your Intention',
        content:
          'Now introduce your specific visualization goal. This might be healing (imagine golden light flowing to areas of pain or tension), confidence (see yourself succeeding at a challenge), peace (visualize stress dissolving like mist in sunlight), or creativity (picture ideas flowing freely). Whatever your intention, make it concrete and positive. See it, feel it, believe it. Spend several minutes dwelling in this visualization, allowing it to permeate your entire being.',
      },
      {
        title: 'Return Gently & Benefits',
        content:
          "When you're ready to conclude, take a few deep breaths and slowly bring your awareness back to your physical body. Wiggle your fingers and toes, stretch gently, and open your eyes when it feels right. Carry the feelings and insights from your visualization into your day. You can return to this practice anytime you need its benefits.\n\nBenefits: Visualization enhances creativity and problem-solving, reduces anxiety and stress, improves performance and confidence, accelerates healing and recovery, and strengthens the mind-body connection for overall well-being.",
      },
    ],
  },
  ifs: {
    steps: [
      {
        title: 'Ground in Self-Energy',
        content:
          'Sit comfortably and take several deep breaths to center yourself. In IFS (Internal Family Systems), we begin by accessing "Self"—your core essence characterized by curiosity, compassion, calm, and clarity. Notice any tension or emotion in your body without judgment. Imagine yourself as a compassionate observer, ready to meet different parts of yourself with openness and kindness. This is your foundation: a calm, centered presence from which to explore.',
      },
      {
        title: 'Identify a Part',
        content:
          'Bring your attention to a feeling, thought pattern, or behavior that\'s been present lately—perhaps anxiety, self-criticism, procrastination, or anger. In IFS, these are "parts" of you, not your whole self. Ask internally: "What part of me is feeling this?" Notice where you sense it in your body. Give it space to be present. You might visualize it as a shape, color, age, or character. Approach it with genuine curiosity: "What do you want me to know?"',
      },
      {
        title: 'Listen with Compassion',
        content:
          'From your centered Self, ask this part: "What are you trying to protect me from?" or "What do you need?" Listen without trying to fix or change anything. Parts often carry burdens from past experiences—they\'re trying to help, even when their strategies cause problems. Thank the part for its efforts to protect you. Acknowledge its positive intention. You might ask: "How old do you think I am?" Often, parts are stuck in the past, unaware that you\'ve grown and have more resources now.',
      },
      {
        title: 'Integrate and Heal & Benefits',
        content:
          "Offer this part what it needs—perhaps reassurance, appreciation, or permission to rest. Let it know you (Self) are now capable of handling what it's been protecting you from. Imagine the part relaxing, updating its role, or even transforming. You might visualize it becoming lighter, younger, or more peaceful. Thank it for this dialogue. Slowly return your awareness to your breath and body, carrying this new understanding forward.\n\nBenefits: IFS meditation promotes self-compassion and inner harmony, resolves internal conflicts and self-sabotage, heals emotional wounds and trauma, increases self-awareness and emotional intelligence, and fosters integration and wholeness of the psyche.",
      },
    ],
  },
};

const typeDisplayName: Record<MeditationTypeKey, string> = {
  mindfulness: 'Mindfulness',
  metta: 'Metta',
  visualization: 'Visualization',
  ifs: 'IFS',
};

const typeToKnowledgeCategory: Record<MeditationTypeKey, string> = {
  mindfulness: 'mindfulness',
  metta: 'metta',
  visualization: 'visualization',
  ifs: 'ifs',
};

export default function MindfulnessGuide({ meditationType }: MindfulnessGuideProps) {
  const navigate = useNavigate();

  const guide = guideContent[meditationType] ?? guideContent.mindfulness;
  const displayName = typeDisplayName[meditationType] ?? 'Mindfulness';
  const dynamicTitle = `${displayName} Meditation Guide`;

  const handleMoreDetails = () => {
    const category = typeToKnowledgeCategory[meditationType] ?? 'mindfulness';
    navigate({ to: '/knowledge', search: { category } as Record<string, string> });
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-5 flex flex-col gap-4">
      {/* Centered title at the top */}
      <h3 className="text-base font-semibold text-foreground leading-tight text-center">
        {dynamicTitle}
      </h3>

      {/* Stepper — manages its own step state internally */}
      <MeditationGuideStepper steps={guide.steps} />

      {/* More Details button centered at the bottom */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMoreDetails}
          className="flex items-center gap-1.5 text-xs border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/10"
        >
          <BookOpen className="w-3.5 h-3.5" />
          More Details
        </Button>
      </div>
    </div>
  );
}
