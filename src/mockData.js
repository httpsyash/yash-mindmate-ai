/**
 * MindMate AI - Realistic Mock Data for Yash Kumar (CSE AI, IET Lucknow)
 */

const studentProfile = {
  name: "Yash Kumar",
  rollNo: "2400521520071",
  branch: "Computer Science & Engineering (Artificial Intelligence)",
  institution: "Institute of Engineering and Technology (IET), Lucknow",
  academicYear: "2026–27",
  semester: "6th Semester",
  streakDays: 5,
  totalStudyHoursThisWeek: 18.5,
  overallWellnessScore: 82, // out of 100
  avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=YashKumar&backgroundColor=e0e7ff"
};

// 7-day historical mood data
const moodHistory = [
  { id: "m-1", date: "2026-11-13", mood: "calm", score: 85, note: "Completed AI assignment on heuristic search.", tag: "Academic" },
  { id: "m-2", date: "2026-11-14", mood: "motivated", score: 90, note: "Good coding session on neural network backprop.", tag: "Coding" },
  { id: "m-3", date: "2026-11-15", mood: "stressed", score: 55, note: "Mid-term exam timetable announced. Feeling anxious about OS & DAA.", tag: "Exams" },
  { id: "m-4", date: "2026-11-16", mood: "exhausted", score: 50, note: "Late night lab file completion. Need more sleep.", tag: "Health" },
  { id: "m-5", date: "2026-11-17", mood: "okay", score: 70, note: "Did 3 Pomodoro sessions on dynamic programming.", tag: "Study" },
  { id: "m-6", date: "2026-11-18", mood: "calm", score: 80, note: "Morning walk in campus helped clear my head.", tag: "Wellness" },
  { id: "m-7", date: "2026-11-19", mood: "motivated", score: 88, note: "Prepared for tomorrow's AI lab presentation.", tag: "Academic" }
];

// Pre-populated Study Plans for IET Lucknow CSE(AI)
const studyPlans = [
  {
    id: "sp-1",
    subject: "Artificial Intelligence & ML",
    code: "CSE-601",
    examDate: "2026-11-24",
    daysLeft: 5,
    progress: 75,
    targetHours: 12,
    tasks: [
      { id: "t-1", title: "Review A* and Minimax Alpha-Beta Pruning", duration: "45m", completed: true },
      { id: "t-2", title: "Solve Decision Tree & Entropy numericals", duration: "60m", completed: true },
      { id: "t-3", title: "Study Convolutional Neural Networks (CNN) architecture", duration: "50m", completed: true },
      { id: "t-4", title: "Practice past year 2025 question papers", duration: "90m", completed: false }
    ]
  },
  {
    id: "sp-2",
    subject: "Design & Analysis of Algorithms",
    code: "CSE-602",
    examDate: "2026-11-27",
    daysLeft: 8,
    progress: 50,
    targetHours: 16,
    tasks: [
      { id: "t-5", title: "Master Dynamic Programming: Knapsack & LCS", duration: "60m", completed: true },
      { id: "t-6", title: "Greedy Algorithms: Huffman Coding & Prim/Kruskal", duration: "45m", completed: true },
      { id: "t-7", title: "Amortized Analysis & B-Trees", duration: "60m", completed: false },
      { id: "t-8", title: "NP-Completeness and Approximation Algorithms", duration: "75m", completed: false }
    ]
  },
  {
    id: "sp-3",
    subject: "Operating Systems",
    code: "CSE-604",
    examDate: "2026-12-02",
    daysLeft: 13,
    progress: 35,
    targetHours: 14,
    tasks: [
      { id: "t-9", title: "CPU Scheduling Algorithms (FCFS, SJF, Round Robin)", duration: "40m", completed: true },
      { id: "t-10", title: "Banker's Algorithm for Deadlock Avoidance", duration: "50m", completed: false },
      { id: "t-11", title: "Virtual Memory: Page Replacement (FIFO, LRU)", duration: "60m", completed: false },
      { id: "t-12", title: "File Systems and Disk Scheduling (SSTF, SCAN)", duration: "45m", completed: false }
    ]
  }
];

// Historical conversation messages
const initialMessages = [
  {
    id: "msg-1",
    sender: "user",
    text: "Hey MindMate, I have mid-terms next week and I'm feeling overwhelmed with DAA algorithms.",
    timestamp: "10:15 AM",
    emotion: "stressed"
  },
  {
    id: "msg-2",
    sender: "ai",
    text: "I hear you, Yash. DAA can feel heavy, but remember you don't have to tackle the entire syllabus in one sitting. Let's break it down into bite-sized 45-minute focus blocks starting with Dynamic Programming. Would you like a 2-minute breathing exercise first to reset your focus?",
    timestamp: "10:16 AM",
    emotion: "empathetic",
    suggestions: ["Start 2-min Breathing", "View DAA Study Plan", "Log Current Mood"]
  }
];

const wellnessTips = [
  {
    title: "The 50/10 Focus Rule",
    category: "Productivity",
    description: "Work with 100% focus for 50 minutes, then take a strict 10-minute screen-free break. Improves information retention by up to 35%."
  },
  {
    title: "4-7-8 Parasympathetic Reset",
    category: "Stress Relief",
    description: "Inhale for 4 seconds, hold for 7 seconds, exhale slowly for 8 seconds. This biological hack instantly lowers cortisol and heart rate."
  },
  {
    title: "Feynman Active Recall",
    category: "Study Technique",
    description: "Explain a difficult concept (like Backpropagation or Page Replacement) as if teaching a 10-year-old. Exposes hidden knowledge gaps immediately."
  },
  {
    title: "Hydration & Cognitive Function",
    category: "Health",
    description: "A 2% drop in body hydration leads to measurable fatigue and short-term memory lapses during prolonged exam preparation."
  }
];

module.exports = {
  studentProfile,
  moodHistory,
  studyPlans,
  initialMessages,
  wellnessTips
};
