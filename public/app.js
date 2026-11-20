// MindMate AI - Personal Wellness & Student Productivity Companion
// Client-side Controller & UI Logic

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    currentTab: 'chat',
    selectedMood: {
      mood: 'calm',
      score: 80
    },
    chatHistory: [],
    moodHistory: [],
    studyPlans: [],
    wellnessTips: [],
    profile: null,
    
    // Voice Recognition
    speechRecognition: null,
    isListening: false,

    // Breathing Exercise State
    breatheInterval: null,
    breatheTimeout: null,
    isBreathing: false,

    // Pomodoro Timer State
    pomodoroInterval: null,
    pomodoroDuration: 1500, // 25 mins in seconds
    pomodoroRemaining: 1500,
    isTimerRunning: false
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================
  initNavigation();
  initVoiceSupport();
  initChat();
  initMoodTracker();
  initStudyPlanner();
  initWellnessHub();
  loadStudentProfile();

  // ==========================================
  // 1. NAVIGATION & TAB SWITCHING
  // ==========================================
  function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.tab-content');

    function switchTab(targetTab) {
      state.currentTab = targetTab;
      tabs.forEach(t => {
        if (t.dataset.tab === targetTab) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });

      sections.forEach(s => {
        if (s.id === `tab-${targetTab}`) {
          s.style.display = 'block';
          s.style.animation = 'fadeIn 0.3s ease';
        } else {
          s.style.display = 'none';
        }
      });

      // Special on-tab activations
      if (targetTab === 'mood') {
        loadMoodHistory();
      } else if (targetTab === 'study') {
        loadStudyPlans();
      } else if (targetTab === 'wellness') {
        loadWellnessTips();
      } else if (targetTab === 'profile') {
        loadStudentProfile();
      }
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
      });
    });

    // Handle in-page navigation buttons (e.g., Quick action shortcuts)
    document.querySelectorAll('.nav-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (target) {
          switchTab(target);
        }
      });
    });
  }

  // ==========================================
  // 2. SPEECH-TO-TEXT & TEXT-TO-SPEECH
  // ==========================================
  function initVoiceSupport() {
    const micBtn = document.getElementById('micBtn');
    const chatInput = document.getElementById('chatInput');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      state.speechRecognition = new SpeechRecognition();
      state.speechRecognition.continuous = false;
      state.speechRecognition.interimResults = false;
      state.speechRecognition.lang = 'en-US';

      state.speechRecognition.onstart = () => {
        state.isListening = true;
        micBtn.classList.add('active-mic');
        micBtn.title = 'Listening... Speak now';
        chatInput.placeholder = 'Listening to your voice...';
      };

      state.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        chatInput.focus();
      };

      state.speechRecognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        stopListening();
      };

      state.speechRecognition.onend = () => {
        stopListening();
      };

      micBtn.addEventListener('click', () => {
        if (!state.isListening) {
          try {
            state.speechRecognition.start();
          } catch (e) {
            console.warn(e);
          }
        } else {
          state.speechRecognition.stop();
        }
      });
    } else {
      micBtn.title = 'Speech recognition not supported in this browser';
      micBtn.style.opacity = '0.5';
      micBtn.addEventListener('click', () => {
        alert('Voice recognition (Web Speech API) is available in Chromium-based browsers like Chrome, Edge, and Brave.');
      });
    }

    function stopListening() {
      state.isListening = false;
      micBtn.classList.remove('active-mic');
      micBtn.title = 'Voice Input (Speech to Text)';
      chatInput.placeholder = "Share how you're feeling, ask about exams, or plan a study session...";
    }
  }

  // Text to Speech
  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // ==========================================
  // 3. AI COMPANION CHAT
  // ==========================================
  function initChat() {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');

    // Load initial chat history
    fetch('/api/chat/history')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.messages) {
          state.chatHistory = data.messages;
          renderChatMessages();
        }
      })
      .catch(err => console.error('Error fetching chat history:', err));

    // Check Gemini AI Status
    fetch('/api/ai-status')
      .then(res => res.json())
      .then(data => {
        const badge = document.getElementById('aiModelBadge');
        if (badge && data.aiEnabled) {
          badge.innerHTML = `✨ ${data.model}`;
        }
      })
      .catch(() => {});

    // Send Message Handler
    async function handleSendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;

      chatInput.value = '';
      sendBtn.disabled = true;

      // Optimistic user render
      const tempId = `temp-${Date.now()}`;
      const tempUserMsg = {
        id: tempId,
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      appendSingleMessage(tempUserMsg);

      // Typing indicator
      const typingEl = document.createElement('div');
      typingEl.className = 'msg-wrapper ai';
      typingEl.id = 'typingIndicator';
      typingEl.innerHTML = `
        <div class="msg-avatar ai">🧠</div>
        <div class="msg-bubble" style="color: var(--text-muted); font-style: italic;">
          MindMate is thinking...
        </div>
      `;
      chatMessages.appendChild(typingEl);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const result = await response.json();

        // Remove typing indicator
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();

        if (result.success) {
          // Replace temp with verified and append AI reply
          appendSingleMessage(result.reply);

          // Update sidebar emotion state
          if (result.analysis) {
            updateSidebarEmotion(result.analysis);
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
        appendSingleMessage({
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: "I'm having a slight connection issue. Please make sure the local server is running.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } finally {
        sendBtn.disabled = false;
        chatInput.focus();
      }
    }

    sendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });

    // Reset Chat
    clearChatBtn.addEventListener('click', () => {
      if (confirm('Start a fresh conversation?')) {
        chatMessages.innerHTML = '';
        state.chatHistory = [];
        appendSingleMessage({
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: "Hello Yash! Fresh session started. How can I support your study goals or mental well-being right now?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });
  }

  function renderChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    state.chatHistory.forEach(msg => {
      appendSingleMessage(msg, false);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendSingleMessage(msg, scroll = true) {
    const chatMessages = document.getElementById('chatMessages');
    const isUser = msg.sender === 'user';

    const msgWrapper = document.createElement('div');
    msgWrapper.className = `msg-wrapper ${isUser ? 'user' : 'ai'}`;

    // Emotion Badge HTML
    let emotionHtml = '';
    if (msg.emotion) {
      const emoClass = msg.emotion.toLowerCase();
      emotionHtml = `<span class="emotion-badge ${emoClass}">${getEmotionEmoji(msg.emotion)} ${msg.emotion}</span>`;
    }

    // Source Model Badge (Gemini)
    let sourceHtml = '';
    if (!isUser && msg.source && msg.source.includes('gemini')) {
      sourceHtml = `<span style="font-size: 0.68rem; color: #4338ca; background: #e0e7ff; padding: 0.1rem 0.45rem; border-radius: 4px; font-weight: 700; letter-spacing: -0.2px;">✨ Gemini</span>`;
    }

    // TTS speaker button for AI messages
    const ttsBtnHtml = !isUser 
      ? `<button class="tts-speak-btn" title="Read Aloud" style="background:none; border:none; cursor:pointer; font-size:0.85rem; opacity:0.6; padding:0 2px;">🔊</button>` 
      : '';

    // Suggestion chips
    let suggestionsHtml = '';
    if (msg.suggestions && msg.suggestions.length > 0) {
      suggestionsHtml = `
        <div class="suggestion-chips">
          ${msg.suggestions.map(s => `<button class="chip-btn chat-suggestion-chip">${s}</button>`).join('')}
        </div>
      `;
    }

    // Crisis banner styling
    const crisisStyle = msg.isCrisis 
      ? 'border: 2px solid #ef4444; background: #fef2f2 !important;' 
      : '';

    msgWrapper.innerHTML = `
      <div class="msg-avatar ${isUser ? 'user' : 'ai'}">
        ${isUser ? '👤' : '🧠'}
      </div>
      <div class="msg-bubble" style="${crisisStyle}">
        <div class="msg-text">${escapeHtml(msg.text)}</div>
        ${suggestionsHtml}
        <div class="msg-meta">
          ${emotionHtml}
          ${sourceHtml}
          <span>${msg.timestamp || ''}</span>
          ${ttsBtnHtml}
        </div>
      </div>
    `;

    // TTS Button listener
    if (!isUser) {
      const speakBtn = msgWrapper.querySelector('.tts-speak-btn');
      if (speakBtn) {
        speakBtn.addEventListener('click', () => {
          speakText(msg.text);
        });
      }
    }

    // Suggestion chips listener
    msgWrapper.querySelectorAll('.chat-suggestion-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const chatInput = document.getElementById('chatInput');
        chatInput.value = btn.innerText;
        document.getElementById('sendBtn').click();
      });
    });

    chatMessages.appendChild(msgWrapper);
    if (scroll) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function updateSidebarEmotion(analysis) {
    const liveEmoji = document.getElementById('liveEmotionEmoji');
    const liveLabel = document.getElementById('liveEmotionLabel');
    const liveConf = document.getElementById('liveEmotionConfidence');
    const liveAdvice = document.getElementById('liveEmotionAdvice');

    if (!analysis) return;

    liveEmoji.innerText = getEmotionEmoji(analysis.emotion);
    liveLabel.innerText = analysis.emotion;
    liveConf.innerText = `Confidence: ${Math.round(analysis.confidence * 100)}%`;

    const adviceMap = {
      stressed: "High academic stress detected. Recommend pausing for a 2-minute 4-7-8 breathing reset before continuing.",
      exhausted: "Mental fatigue detected. Your brain needs restorative rest. Step away from screens for at least 15 minutes.",
      motivated: "Peak focus state! Perfect time to tackle high-cognitive tasks like algorithm proofs or machine learning models.",
      calm: "Steady, balanced cognitive state. Ideal for consistent study sprint and syllabus revision.",
      sad: "Low energy detected. Be gentle with yourself today. Focus on light, manageable study milestones.",
      crisis: "Urgent: Please take a pause and talk to someone. You can reach India's Tele-MANAS helpline 24/7 at 14416.",
      neutral: "Standard focus level. Plan your next 50-minute study sprint using the Pomodoro timer."
    };

    liveAdvice.innerText = adviceMap[analysis.emotion.toLowerCase()] || adviceMap.neutral;
  }

  function getEmotionEmoji(emotion) {
    const map = {
      stressed: '😫',
      calm: '😊',
      motivated: '🤩',
      exhausted: '😴',
      sad: '🥺',
      crisis: '🚨',
      neutral: '🧘‍♂️'
    };
    return map[(emotion || '').toLowerCase()] || '✨';
  }

  // ==========================================
  // 4. MOOD TRACKER & SVG CHART RENDERING
  // ==========================================
  function initMoodTracker() {
    const moodOptions = document.querySelectorAll('.mood-option');
    const saveMoodBtn = document.getElementById('saveMoodBtn');
    const moodNoteInput = document.getElementById('moodNoteInput');
    const moodTagSelect = document.getElementById('moodTagSelect');

    // Mood selection cards
    moodOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        moodOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        state.selectedMood = {
          mood: opt.dataset.mood,
          score: Number(opt.dataset.score)
        };
      });
    });

    // Save Mood Button
    saveMoodBtn.addEventListener('click', async () => {
      const payload = {
        mood: state.selectedMood.mood,
        score: state.selectedMood.score,
        note: moodNoteInput.value.trim(),
        tag: moodTagSelect.value
      };

      saveMoodBtn.disabled = true;
      try {
        const res = await fetch('/api/mood', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          moodNoteInput.value = '';
          await loadMoodHistory();
          // Brief success feedback
          saveMoodBtn.innerHTML = `<span>✓ Logged!</span>`;
          setTimeout(() => {
            saveMoodBtn.innerHTML = `<span>Log Mood</span>`;
            saveMoodBtn.disabled = false;
          }, 1500);
        }
      } catch (err) {
        console.error('Save mood error:', err);
        saveMoodBtn.disabled = false;
      }
    });
  }

  async function loadMoodHistory() {
    try {
      const res = await fetch('/api/mood/history');
      const data = await res.json();
      if (data.success) {
        state.moodHistory = data.moods || [];
        
        // Update stats summary
        const avgDisplay = document.getElementById('avgScoreDisplay');
        const streakDisplay = document.getElementById('streakDisplay');
        if (avgDisplay && data.stats) {
          avgDisplay.innerText = `${data.stats.averageScore}/100`;
        }
        if (streakDisplay && data.stats) {
          streakDisplay.innerText = `${data.stats.streakDays} Days 🔥`;
        }

        renderMoodChart(state.moodHistory);
        renderMoodLogList(state.moodHistory);
      }
    } catch (err) {
      console.error('Load mood history error:', err);
    }
  }

  function renderMoodChart(moods) {
    const svg = document.getElementById('moodChartSvg');
    if (!svg || !moods || moods.length === 0) return;

    // Use last 7 data entries
    const recent = moods.slice(-7);
    const width = 700;
    const height = 220;
    const padding = { top: 25, right: 35, bottom: 40, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Scale helpers
    const minScore = 20;
    const maxScore = 100;
    const getY = (score) => padding.top + chartH - ((score - minScore) / (maxScore - minScore)) * chartH;
    const getX = (index) => padding.left + (index / (recent.length - 1 || 1)) * chartW;

    // Compute coordinate points
    const points = recent.map((m, i) => ({
      x: getX(i),
      y: getY(m.score),
      score: m.score,
      date: m.date.slice(5), // mm-dd
      mood: m.mood
    }));

    // Generate Path Strings
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth cubic bezier curve
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Horizontal Grid Lines
    let gridLinesHtml = '';
    [30, 50, 70, 90].forEach(scoreVal => {
      const yPos = getY(scoreVal);
      gridLinesHtml += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#e2e8f0" stroke-dasharray="4" />
        <text x="${padding.left - 10}" y="${yPos + 4}" font-size="11" fill="#94a3b8" text-anchor="end">${scoreVal}</text>
      `;
    });

    // Dots and Data Labels
    let dotsHtml = '';
    points.forEach(pt => {
      dotsHtml += `
        <g class="chart-point" style="cursor: pointer;">
          <circle cx="${pt.x}" cy="${pt.y}" r="6" fill="#ffffff" stroke="#6366f1" stroke-width="3" />
          <text x="${pt.x}" y="${pt.y - 12}" font-size="11" font-weight="700" fill="#4f46e5" text-anchor="middle">${pt.score}</text>
          <text x="${pt.x}" y="${padding.top + chartH + 20}" font-size="11" fill="#64748b" text-anchor="middle">${pt.date}</text>
        </g>
      `;
    });

    svg.innerHTML = `
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      ${gridLinesHtml}
      <path d="${areaPath}" fill="url(#chartGradient)" />
      <path d="${linePath}" fill="none" stroke="#6366f1" stroke-width="3.5" stroke-linecap="round" />
      ${dotsHtml}
    `;
  }

  function renderMoodLogList(moods) {
    const list = document.getElementById('moodLogList');
    if (!list) return;

    if (moods.length === 0) {
      list.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem;">No mood entries recorded yet.</div>`;
      return;
    }

    const recentDesc = [...moods].reverse().slice(0, 6);
    list.innerHTML = recentDesc.map(entry => `
      <div style="background: rgba(255, 255, 255, 0.7); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <span style="font-size: 1.5rem;">${getEmotionEmoji(entry.mood)}</span>
          <div>
            <strong style="text-transform: capitalize; font-size: 0.95rem;">${entry.mood}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">(${entry.date})</span>
            <p style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 0.15rem;">${escapeHtml(entry.note || 'No notes added')}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="background: #f1f5f9; color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 50px;">
            ${entry.tag || 'General'}
          </span>
          <span style="font-size: 1rem; font-weight: 800; color: var(--accent-indigo);">
            ${entry.score}/100
          </span>
        </div>
      </div>
    `).join('');
  }

  // ==========================================
  // 5. STUDY PLANNER
  // ==========================================
  function initStudyPlanner() {
    const openModalBtn = document.getElementById('openScheduleModalBtn');
    const closeModalBtn = document.getElementById('closeScheduleModalBtn');
    const modal = document.getElementById('scheduleModal');
    const scheduleForm = document.getElementById('scheduleForm');

    openModalBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    scheduleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = document.getElementById('schedSubject').value.trim();
      const examDate = document.getElementById('schedDate').value;
      const targetHours = document.getElementById('schedHours').value;
      const topics = document.getElementById('schedTopics').value.trim();

      const submitBtn = scheduleForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Generating Plan...';

      try {
        const res = await fetch('/api/study/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, examDate, targetHours, topics })
        });
        const data = await res.json();
        if (data.success) {
          modal.style.display = 'none';
          scheduleForm.reset();
          await loadStudyPlans();
        }
      } catch (err) {
        console.error('Schedule generator error:', err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Generate Schedule';
      }
    });
  }

  async function loadStudyPlans() {
    try {
      const res = await fetch('/api/study/plans');
      const data = await res.json();
      if (data.success) {
        state.studyPlans = data.plans || [];
        renderStudyPlans();
      }
    } catch (err) {
      console.error('Load study plans error:', err);
    }
  }

  function renderStudyPlans() {
    const grid = document.getElementById('studyGrid');
    if (!grid) return;

    if (state.studyPlans.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No study schedules found. Click "Generate AI Schedule" to create one.</div>`;
      return;
    }

    grid.innerHTML = state.studyPlans.map(plan => `
      <div class="subject-card" data-plan-id="${plan.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent-indigo); background: #e0e7ff; padding: 0.2rem 0.55rem; border-radius: 50px; text-transform: uppercase;">
              ${plan.code}
            </span>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 0.35rem; color: var(--text-primary);">${escapeHtml(plan.subject)}</h3>
          </div>
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--accent-rose); background: #fee2e2; padding: 0.25rem 0.6rem; border-radius: 6px;">
            ⏳ ${plan.daysLeft} days left
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-muted); margin-top: 0.5rem;">
          <span>Target: <strong>${plan.targetHours}h total</strong></span>
          <span>Progress: <strong class="plan-progress-num">${plan.progress}%</strong></span>
        </div>

        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${plan.progress}%;"></div>
        </div>

        <div class="task-list" style="margin-top: 1rem;">
          ${plan.tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
              <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''} 
              />
              <span class="task-title ${task.completed ? 'completed' : ''}" style="flex: 1;">
                ${escapeHtml(task.title)}
              </span>
              <span style="font-size: 0.74rem; color: var(--text-muted);">${task.duration}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Attach checkbox toggle listeners
    grid.querySelectorAll('.task-checkbox').forEach(box => {
      box.addEventListener('change', async (e) => {
        const taskItem = e.target.closest('.task-item');
        const taskId = taskItem.dataset.taskId;
        const taskTitle = taskItem.querySelector('.task-title');

        try {
          const res = await fetch(`/api/study/tasks/${taskId}`, { method: 'PATCH' });
          const data = await res.json();
          if (data.success) {
            if (data.task.completed) {
              taskTitle.classList.add('completed');
            } else {
              taskTitle.classList.remove('completed');
            }

            // Update subject card progress bar
            const card = taskItem.closest('.subject-card');
            if (card && data.plan) {
              const fill = card.querySelector('.progress-bar-fill');
              const num = card.querySelector('.plan-progress-num');
              if (fill) fill.style.width = `${data.plan.progress}%`;
              if (num) num.innerText = `${data.plan.progress}%`;
            }
          }
        } catch (err) {
          console.error('Task toggle error:', err);
          e.target.checked = !e.target.checked; // Revert
        }
      });
    });
  }

  // ==========================================
  // 6. WELLNESS & FOCUS HUB (BREATHING & POMODORO)
  // ==========================================
  function initWellnessHub() {
    // ----------------------------------------
    // 4-7-8 Breathing Mechanism
    // ----------------------------------------
    const breatheCircle = document.getElementById('breatheCircle');
    const breathePrompt = document.getElementById('breathePrompt');
    const breatheCount = document.getElementById('breatheCount');
    const startBreatheBtn = document.getElementById('startBreatheBtn');
    const stopBreatheBtn = document.getElementById('stopBreatheBtn');

    let currentPhase = 'idle'; // inhale, hold, exhale
    let phaseSeconds = 0;

    function runBreathingCycle() {
      // Phase 1: Inhale (4s)
      currentPhase = 'inhale';
      phaseSeconds = 4;
      breathePrompt.innerText = 'Inhale...';
      breathePrompt.style.color = '#3b82f6';
      breatheCount.innerText = `${phaseSeconds}s`;
      breatheCircle.style.transform = 'scale(1.35)';

      const stepInterval = setInterval(() => {
        phaseSeconds--;
        if (phaseSeconds > 0) {
          breatheCount.innerText = `${phaseSeconds}s`;
        } else {
          clearInterval(stepInterval);
          if (!state.isBreathing) return;

          // Phase 2: Hold (7s)
          currentPhase = 'hold';
          phaseSeconds = 7;
          breathePrompt.innerText = 'Hold breath...';
          breathePrompt.style.color = '#8b5cf6';
          breatheCount.innerText = `${phaseSeconds}s`;

          const holdInterval = setInterval(() => {
            phaseSeconds--;
            if (phaseSeconds > 0) {
              breatheCount.innerText = `${phaseSeconds}s`;
            } else {
              clearInterval(holdInterval);
              if (!state.isBreathing) return;

              // Phase 3: Exhale (8s)
              currentPhase = 'exhale';
              phaseSeconds = 8;
              breathePrompt.innerText = 'Exhale mouth...';
              breathePrompt.style.color = '#10b981';
              breatheCount.innerText = `${phaseSeconds}s`;
              breatheCircle.style.transform = 'scale(1.0)';

              const exhaleInterval = setInterval(() => {
                phaseSeconds--;
                if (phaseSeconds > 0) {
                  breatheCount.innerText = `${phaseSeconds}s`;
                } else {
                  clearInterval(exhaleInterval);
                  if (state.isBreathing) {
                    runBreathingCycle(); // Loop
                  }
                }
              }, 1000);

              state.breatheInterval = exhaleInterval;
            }
          }, 1000);

          state.breatheInterval = holdInterval;
        }
      }, 1000);

      state.breatheInterval = stepInterval;
    }

    startBreatheBtn.addEventListener('click', () => {
      state.isBreathing = true;
      startBreatheBtn.style.display = 'none';
      stopBreatheBtn.style.display = 'inline-flex';
      runBreathingCycle();
    });

    stopBreatheBtn.addEventListener('click', () => {
      state.isBreathing = false;
      clearInterval(state.breatheInterval);
      breatheCircle.style.transform = 'scale(1.0)';
      breathePrompt.innerText = 'Ready';
      breathePrompt.style.color = 'var(--accent-indigo)';
      breatheCount.innerText = '4s';
      startBreatheBtn.style.display = 'inline-flex';
      stopBreatheBtn.style.display = 'none';
    });

    // ----------------------------------------
    // Pomodoro Focus Timer
    // ----------------------------------------
    const timerDisplay = document.getElementById('timerDisplay');
    const timerToggleBtn = document.getElementById('timerToggleBtn');
    const timerResetBtn = document.getElementById('timerResetBtn');
    const timerModeBtns = document.querySelectorAll('.timer-mode-btn');

    function updateTimerDisplay() {
      const mins = Math.floor(state.pomodoroRemaining / 60);
      const secs = state.pomodoroRemaining % 60;
      timerDisplay.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    timerModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timerModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const newDuration = Number(btn.dataset.time);
        state.pomodoroDuration = newDuration;
        state.pomodoroRemaining = newDuration;
        pauseTimer();
        updateTimerDisplay();
      });
    });

    function startTimer() {
      state.isTimerRunning = true;
      timerToggleBtn.innerText = 'Pause';
      timerToggleBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';

      state.pomodoroInterval = setInterval(() => {
        if (state.pomodoroRemaining > 0) {
          state.pomodoroRemaining--;
          updateTimerDisplay();
        } else {
          pauseTimer();
          playBeep();
          alert('⏰ Focus sprint completed! Take a mindful break.');
        }
      }, 1000);
    }

    function pauseTimer() {
      state.isTimerRunning = false;
      clearInterval(state.pomodoroInterval);
      timerToggleBtn.innerText = 'Start Focus';
      timerToggleBtn.style.background = 'linear-gradient(135deg, #4f46e5, #3b82f6)';
    }

    timerToggleBtn.addEventListener('click', () => {
      if (state.isTimerRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    timerResetBtn.addEventListener('click', () => {
      pauseTimer();
      state.pomodoroRemaining = state.pomodoroDuration;
      updateTimerDisplay();
    });

    // Web Audio synthesizer beep
    function playBeep() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {
        console.warn('AudioContext not allowed or supported');
      }
    }
  }

  async function loadWellnessTips() {
    const grid = document.getElementById('wellnessTipsGrid');
    if (!grid) return;

    try {
      const res = await fetch('/api/wellness');
      const data = await res.json();
      if (data.success && data.tips) {
        grid.innerHTML = data.tips.map(tip => `
          <div style="background: rgba(255, 255, 255, 0.7); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: 0 4px 16px rgba(148, 163, 184, 0.05); display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem;">
              <span style="font-size: 1.5rem;">${tip.icon || '🌱'}</span>
              <strong style="font-size: 1rem; color: var(--text-primary);">${escapeHtml(tip.title)}</strong>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; flex: 1;">
              ${escapeHtml(tip.description)}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent-indigo); background: #e0e7ff; padding: 0.2rem 0.55rem; border-radius: 50px;">
                ${tip.category}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">
                ⏱️ ${tip.duration}
              </span>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Load wellness tips error:', err);
    }
  }

  // ==========================================
  // 7. STUDENT PROFILE LOADER
  // ==========================================
  async function loadStudentProfile() {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        state.profile = p;

        const nameEl = document.getElementById('profileName');
        const branchEl = document.getElementById('profileBranch');
        const colEl = document.getElementById('profileCollege');
        const rollEl = document.getElementById('profileRoll');
        const yrEl = document.getElementById('profileYear');
        const hrsEl = document.getElementById('profileHours');
        const scoreEl = document.getElementById('profileScore');
        const avatarEl = document.getElementById('profileAvatar');

        if (nameEl) nameEl.innerText = p.name;
        if (branchEl) branchEl.innerText = `${p.branch} • ${p.semester || '6th Semester'}`;
        if (colEl) colEl.innerText = p.institution || p.college || 'Institute of Engineering and Technology (IET), Lucknow';
        if (rollEl) rollEl.innerText = p.rollNo;
        if (yrEl) yrEl.innerText = p.academicYear;
        if (hrsEl) hrsEl.innerText = `${p.totalStudyHoursThisWeek || p.weeklyStudyHours || 18.5} hrs`;
        if (scoreEl) scoreEl.innerText = `${p.overallWellnessScore || p.averageWellnessScore || 82} / 100`;
        if (avatarEl) avatarEl.src = p.avatarUrl || p.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=YashKumar&backgroundColor=e0e7ff';
      }
    } catch (err) {
      console.error('Load profile error:', err);
    }
  }

  // Utility to prevent XSS in chat & cards
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
