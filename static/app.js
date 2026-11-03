// Sarvam AI Avatar Tutor — Full Interactive Frontend
// Voice: Sarvam Bulbul TTS playback + Sarvam Saaras STT via MediaRecorder

document.addEventListener("DOMContentLoaded", () => {
  // ── Mermaid init ──
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    darkMode: true,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    securityLevel: "loose",
    themeVariables: {
      primaryColor: "#1e1b4b",
      primaryTextColor: "#e2e8f0",
      primaryBorderColor: "#6366f1",
      lineColor: "#818cf8",
      secondaryColor: "#064e3b",
      tertiaryColor: "#1e293b",
    },
  });

  // ── State ──
  const state = {
    language: "en-IN",
    speaker: "aditya",
    topic: "Photosynthesis",
    mastery: 15,
    history: [],
    isSpeaking: false,
    isRecording: false,
    currentQuestion: null,
    mediaRecorder: null,
    audioChunks: [],
    recordingStartTime: null,
    recordingTimerInterval: null,
    lastSpokenText: "",
    lastAudioBase64: null,
  };

  // ── DOM refs ──
  const $ = (id) => document.getElementById(id);
  const chatFeed = $("chatFeed");
  const chatForm = $("chatForm");
  const userInput = $("userInput");
  const micBtn = $("micBtn");
  const micIcon = $("micIcon");
  const micPulse = $("micPulse");
  const languageSelect = $("languageSelect");
  const speakerSelect = $("speakerSelect");
  const masteryDisplay = $("masteryDisplay");
  const tutorAudio = $("tutorAudio");
  const tutorSpokenBubble = $("tutorSpokenBubble");
  const soundWave = $("soundWave");
  const avatarStatusDot = $("avatarStatusDot");
  const avatarStatusText = $("avatarStatusText");
  const avatarMouth = $("avatarMouth");
  const leftEye = $("leftEye");
  const rightEye = $("rightEye");
  const whiteboardTitle = $("whiteboardTitle");
  const diagramLayer = $("diagramLayer");
  const formulaLayer = $("formulaLayer");
  const stepsLayer = $("stepsLayer");
  const mermaidTarget = $("mermaidTarget");
  const katexTarget = $("katexTarget");
  const viewDiagramBtn = $("viewDiagramBtn");
  const viewFormulaBtn = $("viewFormulaBtn");
  const viewStepsBtn = $("viewStepsBtn");
  const resetWhiteboardBtn = $("resetWhiteboardBtn");
  const adaptiveCard = $("adaptiveCard");
  const adaptiveQuestionText = $("adaptiveQuestionText");
  const adaptiveOptions = $("adaptiveOptions");
  const adaptiveFeedback = $("adaptiveFeedback");
  const voiceRecordingBanner = $("voiceRecordingBanner");
  const recordingStatusText = $("recordingStatusText");
  const recordingTimer = $("recordingTimer");
  const testVoiceBtn = $("testVoiceBtn");
  const testVoiceIcon = $("testVoiceIcon");
  const replayVoiceBtn = $("replayVoiceBtn");

  // ═══════════════════════════════════════════════
  // 1. AVATAR ANIMATIONS — blink + lip-sync
  // ═══════════════════════════════════════════════
  function triggerBlink() {
    leftEye.setAttribute("ry", "0.5");
    rightEye.setAttribute("ry", "0.5");
    setTimeout(() => {
      leftEye.setAttribute("ry", "6");
      rightEye.setAttribute("ry", "6");
    }, 160);
    setTimeout(triggerBlink, Math.random() * 4000 + 2500);
  }
  setTimeout(triggerBlink, 2000);

  let mouthInterval = null;
  function startSpeakingAnimation() {
    state.isSpeaking = true;
    document.body.classList.add("avatar-speaking");
    soundWave.classList.add("wave-animating");
    soundWave.classList.remove("opacity-40");
    avatarStatusDot.className =
      "w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400 animate-pulse";
    avatarStatusText.textContent = "Speaking...";
    avatarStatusText.className = "text-xs font-semibold text-indigo-400";
    let open = false;
    mouthInterval = setInterval(() => {
      open = !open;
      avatarMouth.setAttribute(
        "d",
        open ? "M86 108 Q100 126 114 108" : "M88 110 Q100 115 112 110"
      );
    }, 140);
  }

  function stopSpeakingAnimation() {
    state.isSpeaking = false;
    document.body.classList.remove("avatar-speaking");
    soundWave.classList.remove("wave-animating");
    soundWave.classList.add("opacity-40");
    avatarStatusDot.className =
      "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400";
    avatarStatusText.textContent = "Ready";
    avatarStatusText.className = "text-xs font-semibold text-emerald-400";
    clearInterval(mouthInterval);
    avatarMouth.setAttribute("d", "M88 110 Q100 118 112 110");
  }

  // ═══════════════════════════════════════════════
  // 2. VOICE PLAYBACK — Sarvam Bulbul TTS + fallback
  // ═══════════════════════════════════════════════
  function playTutorSpeech(text, audioBase64) {
    state.lastSpokenText = text;
    state.lastAudioBase64 = audioBase64;

    if (audioBase64) {
      tutorAudio.src = "data:audio/mp3;base64," + audioBase64;
      tutorAudio.onplay = startSpeakingAnimation;
      tutorAudio.onended = stopSpeakingAnimation;
      tutorAudio.onerror = () => fallbackWebSpeech(text);
      tutorAudio.play().catch(() => fallbackWebSpeech(text));
    } else {
      fallbackWebSpeech(text);
    }
  }

  function fallbackWebSpeech(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = state.language;
    u.rate = 1.0;
    u.pitch = 1.05;
    u.onstart = startSpeakingAnimation;
    u.onend = stopSpeakingAnimation;
    u.onerror = stopSpeakingAnimation;
    window.speechSynthesis.speak(u);
  }

  // ═══════════════════════════════════════════════
  // 3. TEST VOICE button — quick Bulbul TTS test
  // ═══════════════════════════════════════════════
  if (testVoiceBtn) {
    testVoiceBtn.addEventListener("click", async () => {
      testVoiceBtn.disabled = true;
      testVoiceIcon.textContent = "⏳";
      try {
        const res = await fetch(
          "/api/test-voice?speaker=" +
            encodeURIComponent(state.speaker) +
            "&language_code=" +
            encodeURIComponent(state.language)
        );
        if (!res.ok) throw new Error("TTS test failed");
        const data = await res.json();
        playTutorSpeech(
          "Namaste! I am your Sarvam AI Tutor. My voice is ready!",
          data.audio_base64
        );
      } catch (e) {
        console.warn("Test voice error:", e);
        fallbackWebSpeech("Voice test: Hello, I am your AI Tutor!");
      } finally {
        testVoiceBtn.disabled = false;
        testVoiceIcon.textContent = "🔊";
      }
    });
  }

  // ═══════════════════════════════════════════════
  // 4. REPLAY button — replays last tutor utterance
  // ═══════════════════════════════════════════════
  if (replayVoiceBtn) {
    replayVoiceBtn.addEventListener("click", () => {
      if (state.lastSpokenText) {
        playTutorSpeech(state.lastSpokenText, state.lastAudioBase64);
      }
    });
  }

  // ═══════════════════════════════════════════════
  // 5. WHITEBOARD view switching + rendering
  // ═══════════════════════════════════════════════
  function switchWhiteboardView(view) {
    diagramLayer.classList.add("hidden");
    formulaLayer.classList.add("hidden");
    stepsLayer.classList.add("hidden");
    const inactive =
      "view-tab px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200";
    const active =
      "view-tab active px-3 py-1.5 rounded-lg text-indigo-300 font-semibold bg-indigo-600/30";
    viewDiagramBtn.className = inactive;
    viewFormulaBtn.className = inactive;
    viewStepsBtn.className = inactive;
    if (view === "diagram") {
      diagramLayer.classList.remove("hidden");
      viewDiagramBtn.className = active;
    } else if (view === "formula") {
      formulaLayer.classList.remove("hidden");
      viewFormulaBtn.className = active;
    } else {
      stepsLayer.classList.remove("hidden");
      viewStepsBtn.className = active;
    }
  }
  viewDiagramBtn.addEventListener("click", () =>
    switchWhiteboardView("diagram")
  );
  viewFormulaBtn.addEventListener("click", () =>
    switchWhiteboardView("formula")
  );
  viewStepsBtn.addEventListener("click", () => switchWhiteboardView("steps"));

  async function renderWhiteboard(wb) {
    if (!wb) return;
    if (wb.title) whiteboardTitle.textContent = wb.title;
    const type = wb.type || "diagram";
    const content = wb.content || "";
    if (type === "diagram") {
      switchWhiteboardView("diagram");
      try {
        const id = "mermaid-" + Math.floor(Math.random() * 100000);
        const { svg } = await mermaid.render(id, content);
        mermaidTarget.innerHTML = svg;
      } catch (err) {
        console.warn("Mermaid render error:", err);
        mermaidTarget.innerHTML =
          '<pre class="text-xs text-indigo-200 font-mono text-left p-4 bg-[#11192a] rounded-xl">' +
          content +
          "</pre>";
      }
    } else if (type === "formula") {
      switchWhiteboardView("formula");
      try {
        katex.render(content, katexTarget, {
          throwOnError: false,
          displayMode: true,
        });
      } catch {
        katexTarget.textContent = content;
      }
    } else {
      switchWhiteboardView("steps");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      stepsLayer.innerHTML = lines
        .map(
          (l, i) =>
            '<div class="bg-[#121b2f] border border-[#1f2e4d] rounded-xl p-3.5">' +
            '<span class="text-xs font-bold text-indigo-400">Key Point ' +
            (i + 1) +
            "</span>" +
            '<p class="text-xs text-slate-300 mt-1">' +
            l.replace(/^[-*•0-9.]+\s*/, "") +
            "</p></div>"
        )
        .join("");
    }
  }

  resetWhiteboardBtn.addEventListener("click", () => {
    renderWhiteboard({
      title: "Clean Slate",
      type: "diagram",
      content:
        "flowchart TD\n  Start[Interactive Lesson Ready] --> Ask[Ask any question or pick a topic]",
    });
  });

  // ═══════════════════════════════════════════════
  // 6. CHAT helpers
  // ═══════════════════════════════════════════════
  function appendChat(role, message) {
    const div = document.createElement("div");
    div.className = "flex items-start gap-2.5";
    if (role === "user") {
      div.innerHTML =
        '<div class="flex-1"></div>' +
        '<div class="bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3 text-xs leading-relaxed max-w-[85%] shadow-md">' +
        message +
        "</div>" +
        '<div class="w-7 h-7 rounded-xl bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center text-xs shrink-0">👤</div>';
    } else {
      div.innerHTML =
        '<div class="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-xs shrink-0 font-bold shadow-md shadow-indigo-600/30">G</div>' +
        '<div class="bg-[#152036] border border-[#233354] rounded-2xl rounded-tl-sm p-3 text-xs text-slate-200 leading-relaxed max-w-[85%] shadow-sm">' +
        message +
        "</div>";
    }
    chatFeed.appendChild(div);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function updateMastery(val) {
    state.mastery = Math.min(Math.max(val, 0), 100);
    masteryDisplay.textContent = state.mastery + "%";
  }

  // ═══════════════════════════════════════════════
  // 7. ADAPTIVE QUESTION checkpoint
  // ═══════════════════════════════════════════════
  function renderAdaptiveQuestion(question, options, correctIdx, feedback) {
    if (!question) {
      adaptiveCard.classList.add("hidden");
      return;
    }
    state.currentQuestion = { question, options, correctIdx, feedback };
    adaptiveQuestionText.textContent = question;
    adaptiveOptions.innerHTML = "";
    adaptiveFeedback.classList.add("hidden");
    if (options && options.length > 0) {
      options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className =
          "w-full text-left px-3.5 py-2 rounded-xl bg-[#131c30] border border-[#223252] text-xs text-slate-200 hover:border-indigo-500/60 hover:bg-indigo-600/10 transition flex items-center justify-between";
        btn.innerHTML =
          "<span><strong class='text-indigo-400 mr-2'>" +
          String.fromCharCode(65 + idx) +
          ".</strong> " +
          opt +
          '</span> <span class="text-xs text-slate-500">➔</span>';
        btn.addEventListener("click", () => handleAnswer(idx, btn));
        adaptiveOptions.appendChild(btn);
      });
    }
    adaptiveCard.classList.remove("hidden");
  }

  function handleAnswer(selectedIdx, btnEl) {
    const q = state.currentQuestion;
    if (!q) return;
    const correct = q.correctIdx !== null && selectedIdx === q.correctIdx;
    adaptiveFeedback.classList.remove("hidden");
    if (correct) {
      btnEl.className =
        "w-full text-left px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/60 text-xs text-emerald-200 font-semibold";
      adaptiveFeedback.className = "text-xs mt-2 font-medium text-emerald-400";
      adaptiveFeedback.textContent =
        "🎉 Excellent! " + (q.feedback || "You nailed it!");
      updateMastery(state.mastery + 15);
    } else {
      btnEl.className =
        "w-full text-left px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/60 text-xs text-amber-200";
      adaptiveFeedback.className = "text-xs mt-2 font-medium text-amber-400";
      adaptiveFeedback.textContent =
        "💡 Good try! " + (q.feedback || "Let's explore this deeper.");
      updateMastery(state.mastery + 5);
    }
    Array.from(adaptiveOptions.children).forEach((c) => (c.disabled = true));
    setTimeout(() => {
      sendUserMessage(
        'I answered: "' +
          q.options[selectedIdx] +
          '". Explain whether that is right and move to the next concept.'
      );
    }, 1200);
  }

  // ═══════════════════════════════════════════════
  // 8. SEND MESSAGE → Sarvam 105B + TTS
  // ═══════════════════════════════════════════════
  async function sendUserMessage(text) {
    if (!text || !text.trim()) return;
    const msg = text.trim();
    userInput.value = "";
    appendChat("user", msg);
    state.history.push({ role: "user", content: msg });

    // thinking indicator
    avatarStatusDot.className =
      "w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping";
    avatarStatusText.textContent = "Thinking...";
    avatarStatusText.className = "text-xs font-semibold text-amber-400";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          language: state.language,
          speaker: state.speaker,
          topic: state.topic,
          current_mastery: state.mastery,
          history: state.history,
        }),
      });
      if (!res.ok) throw new Error("Server " + res.status);
      const data = await res.json();

      const spoken = data.spoken_explanation || "Let's explore this together.";
      tutorSpokenBubble.textContent = '"' + spoken + '"';
      appendChat("assistant", spoken);
      state.history.push({ role: "assistant", content: spoken });

      if (data.whiteboard) renderWhiteboard(data.whiteboard);
      if (data.adaptive_question)
        renderAdaptiveQuestion(
          data.adaptive_question,
          data.options,
          data.correct_option_index,
          data.feedback
        );
      if (data.mastery_score) updateMastery(data.mastery_score);

      playTutorSpeech(spoken, data.audio_base64);
    } catch (err) {
      console.error("Chat error:", err);
      avatarStatusDot.className = "w-2.5 h-2.5 rounded-full bg-red-400";
      avatarStatusText.textContent = "Error";
      avatarStatusText.className = "text-xs font-semibold text-red-400";
      appendChat("assistant", "Connection issue — please check the server.");
    }
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendUserMessage(userInput.value);
  });

  // ═══════════════════════════════════════════════
  // 9. TOPIC CHIPS
  // ═══════════════════════════════════════════════
  document.querySelectorAll(".topic-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll(".topic-chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.topic = chip.getAttribute("data-topic");
      sendUserMessage(
        "Give me a visual interactive lesson on " + state.topic + "."
      );
    });
  });

  // ═══════════════════════════════════════════════
  // 10. VOICE INPUT — MediaRecorder → Sarvam Saaras STT
  // ═══════════════════════════════════════════════
  function formatTimer(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return m + ":" + s;
  }

  function showRecordingUI() {
    state.isRecording = true;
    micIcon.textContent = "⏹️";
    micBtn.classList.add(
      "bg-red-500/30",
      "border-red-500/60",
      "text-red-300"
    );
    micPulse.classList.remove("hidden");
    if (voiceRecordingBanner) {
      voiceRecordingBanner.classList.remove("hidden");
      recordingStatusText.textContent = "Recording your voice...";
    }
    avatarStatusDot.className =
      "w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse";
    avatarStatusText.textContent = "Listening...";
    avatarStatusText.className = "text-xs font-semibold text-red-400";

    // Timer
    let elapsed = 0;
    if (recordingTimer) recordingTimer.textContent = "00:00";
    state.recordingTimerInterval = setInterval(() => {
      elapsed++;
      if (recordingTimer) recordingTimer.textContent = formatTimer(elapsed);
      // auto-stop at 30s
      if (elapsed >= 30) stopRecording();
    }, 1000);
  }

  function hideRecordingUI() {
    state.isRecording = false;
    micIcon.textContent = "🎙️";
    micBtn.classList.remove(
      "bg-red-500/30",
      "border-red-500/60",
      "text-red-300"
    );
    micPulse.classList.add("hidden");
    if (voiceRecordingBanner) voiceRecordingBanner.classList.add("hidden");
    clearInterval(state.recordingTimerInterval);
    avatarStatusDot.className =
      "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400";
    avatarStatusText.textContent = "Ready";
    avatarStatusText.className = "text-xs font-semibold text-emerald-400";
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Prefer webm; fall back to whatever the browser supports
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "";
          }
        }
      }

      state.audioChunks = [];
      const options = mimeType ? { mimeType } : {};
      state.mediaRecorder = new MediaRecorder(stream, options);

      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.audioChunks.push(e.data);
      };

      state.mediaRecorder.onstop = async () => {
        // Stop all mic tracks
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(state.audioChunks, {
          type: state.mediaRecorder.mimeType || "audio/webm",
        });
        if (blob.size < 1000) {
          hideRecordingUI();
          appendChat("assistant", "I didn't catch any audio. Please try again.");
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result.split(",")[1];
          hideRecordingUI();

          // Show processing state
          avatarStatusDot.className =
            "w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping";
          avatarStatusText.textContent = "Transcribing...";
          avatarStatusText.className = "text-xs font-semibold text-amber-400";
          if (recordingStatusText)
            recordingStatusText.textContent = "Transcribing with Sarvam Saaras...";

          try {
            const res = await fetch("/api/stt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audio_base64: base64,
                language_code: state.language,
                mime_type: blob.type || "audio/webm",
              }),
            });
            const data = await res.json();
            if (data.transcript && data.transcript.trim()) {
              userInput.value = data.transcript;
              sendUserMessage(data.transcript);
            } else {
              // Fallback: tell user nothing was heard
              appendChat(
                "assistant",
                "I couldn't understand the audio. Try speaking louder or type your question."
              );
              avatarStatusDot.className =
                "w-2.5 h-2.5 rounded-full bg-emerald-400";
              avatarStatusText.textContent = "Ready";
              avatarStatusText.className =
                "text-xs font-semibold text-emerald-400";
            }
          } catch (err) {
            console.error("STT fetch error:", err);
            appendChat(
              "assistant",
              "Voice transcription failed. Please type your question instead."
            );
            avatarStatusDot.className =
              "w-2.5 h-2.5 rounded-full bg-emerald-400";
            avatarStatusText.textContent = "Ready";
            avatarStatusText.className =
              "text-xs font-semibold text-emerald-400";
          }
        };
        reader.readAsDataURL(blob);
      };

      state.mediaRecorder.start();
      state.recordingStartTime = Date.now();
      showRecordingUI();
    } catch (err) {
      console.error("Mic access error:", err);
      alert(
        "Microphone access denied. Please allow microphone permission and try again."
      );
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state === "recording") {
      state.mediaRecorder.stop();
    }
  }

  // Mic button click: toggle recording
  micBtn.addEventListener("click", () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  // ═══════════════════════════════════════════════
  // 11. SETTINGS CHANGES
  // ═══════════════════════════════════════════════
  languageSelect.addEventListener("change", (e) => {
    state.language = e.target.value;
  });
  speakerSelect.addEventListener("change", (e) => {
    state.speaker = e.target.value;
  });
});
