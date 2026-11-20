/**
 * MindMate AI - Natural Language Processing & Emotion Classification Engine
 */

const EMOTION_PATTERNS = {
  crisis: [
    "suicide", "kill myself", "end my life", "want to die", "self harm", 
    "give up on life", "no reason to live", "harm myself", "hopeless life"
  ],
  stressed: [
    "stressed", "anxious", "panic", "overwhelmed", "nervous", "tension", 
    "exam fear", "pressure", "scared", "can't handle", "freaking out", "worried"
  ],
  exhausted: [
    "tired", "exhausted", "sleepy", "burnout", "burnt out", "no energy", 
    "drained", "can't stay awake", "fatigue", "headache", "sleepless"
  ],
  sad: [
    "sad", "depressed", "lonely", "crying", "unhappy", "down", "disappointed", 
    "failed", "bad grade", "low marks", "demotivated", "useless"
  ],
  motivated: [
    "motivated", "excited", "happy", "great", "confident", "prepared", 
    "ready", "passed", "scored well", "energetic", "crushed it", "proud"
  ],
  study_query: [
    "study", "plan", "schedule", "syllabus", "exam", "assignment", "revision", 
    "time table", "prepare", "daa", "ai", "os", "algorithms", "marks"
  ]
};

function analyzeEmotionAndIntent(text) {
  const lower = text.toLowerCase();

  // 1. Safety Check (Highest Priority)
  for (const word of EMOTION_PATTERNS.crisis) {
    if (lower.includes(word)) {
      return {
        emotion: "crisis",
        intent: "crisis_support",
        severity: "critical",
        confidence: 0.98
      };
    }
  }

  // 2. Emotion keyword matching
  let detectedEmotion = "neutral";
  let maxScore = 0;

  for (const [emotion, keywords] of Object.entries(EMOTION_PATTERNS)) {
    if (emotion === "crisis") continue;
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion;
    }
  }

  // Intent classification
  let intent = "general_conversation";
  if (detectedEmotion === "stressed" || detectedEmotion === "exhausted") {
    intent = "wellness_support";
  } else if (lower.includes("plan") || lower.includes("schedule") || lower.includes("study") || lower.includes("exam")) {
    intent = "study_planning";
  } else if (lower.includes("breathe") || lower.includes("calm") || lower.includes("break")) {
    intent = "mindfulness";
  }

  return {
    emotion: detectedEmotion,
    intent,
    severity: detectedEmotion === "stressed" ? "moderate" : "normal",
    confidence: maxScore > 0 ? Math.min(0.75 + maxScore * 0.1, 0.95) : 0.65
  };
}

function generateCompanionResponse(userText, analysis, studentName = "Yash") {
  const { emotion, intent } = analysis;

  // Crisis intervention
  if (emotion === "crisis") {
    return {
      text: `${studentName}, please know that you are deeply valued and you never have to carry this alone. If you are feeling overwhelmed, please pause and connect right now with someone who cares or a trained counselor. \n\nNational Tele-MANAS Mental Health Helpline (India): 14416 or 1800-891-4416 (24/7 Toll-Free)\nKIRAN Helpline: 1800-599-0019\nIET Lucknow Student Welfare Cell is also there to support you. Please reach out to them today.`,
      suggestions: ["Call Helpline 14416", "Talk to Campus Counselor", "Emergency Contacts"],
      isCrisis: true
    };
  }

  // Stressed / Exam Anxiety
  if (emotion === "stressed") {
    const responses = [
      `I understand, ${studentName}. Exam tension can make everything feel amplified. Remember: you don't need to conquer the entire syllabus today—just the next 45-minute block. Let's ground ourselves with a quick 4-7-8 breathing exercise, or shall we prioritize your upcoming exam tasks?`,
      `Take a gentle breath, ${studentName}. Stress is simply your body's signal that you care, but you have the capability to handle this one step at a time. Let's look at your subjects and turn this chaos into a structured daily plan.`
    ];
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      suggestions: ["Start 2-Min Breathing", "Generate Study Schedule", "Log Mood: Stressed"]
    };
  }

  // Exhaustion / Burnout
  if (emotion === "exhausted") {
    return {
      text: `Your brain has been working overtime, ${studentName}. Trying to study when sleep-deprived produces diminishing returns. Give yourself permission to take a 20-minute power nap or a screen-free walk. You'll absorb information twice as fast once rested.`,
      suggestions: ["Start 10-Min Rest Timer", "Desk Stretch Guide", "Log Mood: Exhausted"]
    };
  }

  // Sad / Demotivated
  if (emotion === "sad") {
    return {
      text: `It's completely normal to have days where motivation dips, ${studentName}. One difficult assignment or bad test does not define your intellect or your journey in CSE(AI). Be kind to yourself today. What is one small, easy win we can complete right now?`,
      suggestions: ["Review Easy Tasks", "Breathing Exercise", "Positive Affirmation"]
    };
  }

  // Motivated / Happy
  if (emotion === "motivated") {
    return {
      text: `Love this energy, ${studentName}! High momentum is the best state for deep work. Let's channel this into tackling that tricky Dynamic Programming or Neural Network module. What do you want to conquer first?`,
      suggestions: ["Start 50-Min Pomodoro", "Mark Tasks Done", "View Exam Countdown"]
    };
  }

  // Study Planning Intent
  if (intent === "study_planning") {
    return {
      text: `Let's get organized! Based on your timetable at IET Lucknow, you have Artificial Intelligence & ML in 5 days, followed by DAA. Breaking your prep into 3 daily sprint blocks with active recall will yield the highest retention. Would you like me to tailor a custom schedule?`,
      suggestions: ["Open Study Planner", "Generate AI Schedule", "Review DAA Checklist"]
    };
  }

  // Default / Friendly Support
  return {
    text: `I'm right here with you, ${studentName}. Whether you want to talk through some academic pressure, plan your next study sprint, or take a mindful pause—what's on your mind?`,
    suggestions: ["Start Focus Timer", "Log Daily Mood", "Study Planner"]
  };
}

module.exports = {
  analyzeEmotionAndIntent,
  generateCompanionResponse
};
