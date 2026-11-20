require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { 
  studentProfile, 
  moodHistory, 
  studyPlans, 
  initialMessages, 
  wellnessTips 
} = require('./mockData');
const { 
  analyzeEmotionAndIntent, 
  generateCompanionResponse 
} = require('./nlpService');
const {
  generateGeminiCompanionResponse
} = require('./geminiService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// In-memory application state
let conversations = [...initialMessages];
let currentMoods = [...moodHistory];
let currentPlans = [...studyPlans];

// ==========================================
// 1. PROFILE & STATUS API
// ==========================================
app.get('/api/profile', (req, res) => {
  res.json({ success: true, profile: studentProfile });
});

app.get('/api/ai-status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    success: true,
    aiEnabled: hasKey,
    provider: hasKey ? 'Google Gemini AI (gemini-3.5-flash-lite)' : 'Local NLP Rule Engine',
    model: hasKey ? 'gemini-3.5-flash-lite' : 'heuristic-v1'
  });
});

// ==========================================
// 2. AI COMPANION & EMOTION CHAT API
// ==========================================
app.get('/api/chat/history', (req, res) => {
  res.json({ success: true, messages: conversations });
});

app.post('/api/chat', async (req, res) => {
  const userText = (req.body.message || '').trim();
  if (!userText) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let emotion = 'neutral';
  let confidence = 0.85;
  let replyText = '';
  let suggestions = [];
  let isCrisis = false;
  let source = 'gemini';

  // Attempt Gemini API Generation first
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiResult = await generateGeminiCompanionResponse(userText, conversations, studentProfile);
      replyText = geminiResult.reply;
      emotion = geminiResult.emotion || 'neutral';
      confidence = geminiResult.confidence || 0.90;
      suggestions = geminiResult.suggestions || [];
      isCrisis = geminiResult.isCrisis || false;
      source = geminiResult.model || 'gemini';
    } catch (geminiErr) {
      console.warn('[Server] Gemini failed, falling back to local NLP:', geminiErr.message);
      source = 'local-nlp-fallback';
    }
  } else {
    source = 'local-nlp';
  }

  // Fallback to local rule engine if Gemini wasn't used or failed
  if (!replyText) {
    const analysis = analyzeEmotionAndIntent(userText);
    const companionReply = generateCompanionResponse(userText, analysis, studentProfile.name);
    emotion = analysis.emotion;
    confidence = analysis.confidence;
    replyText = companionReply.text;
    suggestions = companionReply.suggestions || [];
    isCrisis = companionReply.isCrisis || false;
  }

  // Store user message
  const userMsg = {
    id: `msg-${Date.now()}-u`,
    sender: 'user',
    text: userText,
    timestamp: timeStr,
    emotion: emotion
  };
  conversations.push(userMsg);

  // Store AI response
  const aiMsg = {
    id: `msg-${Date.now()}-ai`,
    sender: 'ai',
    text: replyText,
    timestamp: timeStr,
    emotion: emotion,
    suggestions: suggestions,
    isCrisis: isCrisis,
    source: source
  };
  conversations.push(aiMsg);

  res.json({
    success: true,
    userMessage: userMsg,
    reply: aiMsg,
    analysis: {
      emotion,
      confidence,
      source
    }
  });
});

// ==========================================
// 3. DAILY MOOD TRACKING API
// ==========================================
app.get('/api/mood/history', (req, res) => {
  // Calculate average wellness score
  const totalScore = currentMoods.reduce((acc, curr) => acc + curr.score, 0);
  const avgScore = Math.round(totalScore / currentMoods.length);

  res.json({
    success: true,
    moods: currentMoods,
    stats: {
      averageScore: avgScore,
      totalEntries: currentMoods.length,
      predominantMood: 'Focused & Calm',
      streakDays: studentProfile.streakDays
    }
  });
});

app.post('/api/mood', (req, res) => {
  const { mood, score, note, tag } = req.body;
  if (!mood) {
    return res.status(400).json({ error: 'Mood selection is required.' });
  }

  const newEntry = {
    id: `m-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    mood: mood.toLowerCase(),
    score: Number(score) || 75,
    note: note || '',
    tag: tag || 'General'
  };

  currentMoods.push(newEntry);
  res.json({ success: true, entry: newEntry });
});

// ==========================================
// 4. AI STUDY PLANNER API
// ==========================================
app.get('/api/study/plans', (req, res) => {
  res.json({ success: true, plans: currentPlans });
});

// Toggle task completion
app.patch('/api/study/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  let foundTask = null;
  let targetPlan = null;

  for (const plan of currentPlans) {
    const task = plan.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      foundTask = task;
      targetPlan = plan;
      break;
    }
  }

  if (!foundTask) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Recalculate plan completion percentage
  const completedCount = targetPlan.tasks.filter(t => t.completed).length;
  targetPlan.progress = Math.round((completedCount / targetPlan.tasks.length) * 100);

  res.json({ success: true, task: foundTask, plan: targetPlan });
});

// AI Study Schedule Generator
app.post('/api/study/generate', (req, res) => {
  const { subject, examDate, targetHours, topics } = req.body;
  if (!subject) {
    return res.status(400).json({ error: 'Subject name is required.' });
  }

  const topicList = topics ? topics.split(',').map(s => s.trim()).filter(Boolean) : [
    "Core theoretical foundations & syllabus mapping",
    "High-weightage units & numerical derivations",
    "Previous year university examination papers (2024-25)",
    "Formula flashcards & fast active recall"
  ];

  const newPlan = {
    id: `sp-${Date.now()}`,
    subject,
    code: `CSE-${Math.floor(600 + Math.random() * 50)}`,
    examDate: examDate || "2026-12-05",
    daysLeft: 14,
    progress: 0,
    targetHours: Number(targetHours) || 12,
    tasks: topicList.map((t, idx) => ({
      id: `t-${Date.now()}-${idx}`,
      title: t,
      duration: `${45 + (idx % 2) * 15}m`,
      completed: false
    }))
  };

  currentPlans.unshift(newPlan);
  res.json({ success: true, plan: newPlan });
});

// ==========================================
// 5. WELLNESS RECOMMENDATIONS API
// ==========================================
app.get('/api/wellness', (req, res) => {
  res.json({ success: true, tips: wellnessTips });
});

app.listen(PORT, () => {
  console.log(`🌿 MindMate AI running on http://localhost:${PORT}`);
  console.log(`✨ Gemini AI Integration: ${process.env.GEMINI_API_KEY ? 'Active (gemini-3.5-flash-lite)' : 'Inactive (Local NLP)'}`);
});
