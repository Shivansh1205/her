/* ============================================================
   HOW I FELL FOR YOU — Game Engine
   Handles story rendering, typewriter, transitions,
   confetti, floating hearts, and music toggle.
   ============================================================ */

(function () {
  'use strict';

  // ---- DOM References ----
  const storyCard     = document.getElementById('story-card');
  const storyTextEl   = document.getElementById('story-text');
  const revealTextEl  = document.getElementById('reveal-text');
  const buttonsEl     = document.getElementById('buttons-container');
  const heartsContainer = document.getElementById('hearts-container');
  const musicToggle   = document.getElementById('music-toggle');
  const bgMusic       = document.getElementById('bg-music');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const ctx           = confettiCanvas.getContext('2d');

  // ---- State ----
  let storyData     = null;   // loaded from story.json
  let currentScene  = null;
  let typewriterTimer = null;
  let isMusicPlaying = false;
  let confettiPieces = [];
  let confettiAnimId = null;
  let celebrationHeartsId = null;
  let sceneCount = 0;

  // ---- Constants ----
  const TYPEWRITER_SPEED  = 45;   // ms per character
  const FADE_DURATION     = 400;  // ms for card fade transition
  const HEART_EMOJIS      = ['💕', '💖', '💗', '💘', '💝', '❤️', '🩷', '🤍', '💜'];
  const NUM_BG_HEARTS     = 15;

  /* ==========================================================
     1. INITIALIZATION
     ========================================================== */

  /**
   * Load story.json and kick off the experience.
   */
  async function init() {
    try {
      const response = await fetch('story.json');
      storyData = await response.json();
    } catch (err) {
      // Fallback: if fetch fails (file:// protocol), embed a mini story
      console.warn('Could not fetch story.json – using embedded fallback.', err);
      storyData = getEmbeddedStory();
    }

    createBackgroundHearts();
    setupMusicToggle();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Start from scene1
    showScene('scene1');
  }

  /* ==========================================================
     2. SCENE RENDERING
     ========================================================== */

  /**
   * Transition to a new scene with a fade effect.
   * @param {string} sceneId - key in storyData.scenes
   */
  function showScene(sceneId) {
    clearTypewriter();
    currentScene = storyData.scenes[sceneId];

    if (!currentScene) {
      console.error('Scene not found:', sceneId);
      return;
    }

    // Increase hearts with each scene
    sceneCount++;
    createBackgroundHearts();

    // Fade out
    storyCard.classList.remove('fade-in');
    storyCard.classList.add('fade-out');

    setTimeout(() => {
      // Clear previous content
      storyTextEl.textContent = '';
      revealTextEl.textContent = '';
      revealTextEl.innerHTML = '';
      buttonsEl.innerHTML = '';

      // Delegate to the right renderer
      if (currentScene.type === 'terms') {
        renderTerms(currentScene);
      } else if (currentScene.type === 'finale') {
        renderFinale(currentScene);
      } else if (currentScene.type === 'celebration') {
        renderCelebration(currentScene);
      } else {
        renderNormalScene(currentScene);
      }

      // Fade in
      storyCard.classList.remove('fade-out');
      storyCard.classList.add('fade-in');
    }, FADE_DURATION);
  }

  /**
   * Render a standard story scene with typewriter text + buttons.
   */
  function renderNormalScene(scene) {
    if (scene.typewriter) {
      typewriterText(scene.text, storyTextEl, () => {
        // If there's a reveal line (scene4), type it after main text
        if (scene.revealText) {
          setTimeout(() => {
            typewriterText(scene.revealText, revealTextEl, () => {
              showButtons(scene.buttons);
            });
          }, 500);
        } else {
          showButtons(scene.buttons);
        }
      });
    } else {
      storyTextEl.textContent = scene.text;
      showButtons(scene.buttons);
    }
  }

  /**
   * Render the final romantic scene with line-by-line reveal, then proposal.
   */
  function renderFinale(scene) {
    // Start hearts and confetti for the finale
    startCelebrationHearts();

    const linesContainer = document.createElement('div');
    linesContainer.className = 'final-lines';

    scene.lines.forEach((line) => {
      const lineEl = document.createElement('p');
      lineEl.className = 'line';
      lineEl.textContent = line;
      linesContainer.appendChild(lineEl);
    });

    storyTextEl.textContent = '';
    storyCard.querySelector('.story-text').after(linesContainer);

    // Reveal lines one by one
    const lineEls = linesContainer.querySelectorAll('.line');
    lineEls.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, (i + 1) * 1200);
    });

    // After all lines, show proposal
    const totalDelay = (lineEls.length + 1) * 1200;
    setTimeout(() => {
      const proposalEl = document.createElement('p');
      proposalEl.className = 'proposal-text';
      proposalEl.textContent = scene.proposal;
      linesContainer.after(proposalEl);

      setTimeout(() => {
        proposalEl.classList.add('visible');
        showButtons(scene.buttons);
      }, 200);
    }, totalDelay);
  }

  /**
   * Render the "Terms & Conditions" proposal scene.
   * Each line is typewritten one after another.
   */
  function renderTerms(scene) {
    startCelebrationHearts();

    storyTextEl.textContent = '';

    const termsContainer = document.createElement('div');
    termsContainer.className = 'final-lines';
    storyTextEl.after(termsContainer);

    let lineIndex = 0;

    function typeNextLine() {
      if (lineIndex >= scene.lines.length) {
        // All lines typed — show buttons after a pause
        setTimeout(() => {
          showButtons(scene.buttons);
        }, 800);
        return;
      }

      const lineEl = document.createElement('p');
      lineEl.className = 'line';
      termsContainer.appendChild(lineEl);

      // Make the last line (the proposal) stand out
      const isLast = lineIndex === scene.lines.length - 1;
      if (isLast) {
        lineEl.classList.add('proposal-line');
      }

      // Typewriter this line, then move to the next
      const text = scene.lines[lineIndex];
      let charIndex = 0;
      lineEl.style.opacity = '1';
      lineEl.style.transform = 'translateY(0)';

      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      lineEl.appendChild(cursor);

      const timer = setInterval(() => {
        if (charIndex < text.length) {
          if (text[charIndex] === '\n') {
            lineEl.insertBefore(document.createElement('br'), cursor);
          } else {
            lineEl.insertBefore(document.createTextNode(text[charIndex]), cursor);
          }
          charIndex++;
        } else {
          clearInterval(timer);
          cursor.remove();
          lineIndex++;
          // Pause between lines
          setTimeout(typeNextLine, isLast ? 600 : 1000);
        }
      }, TYPEWRITER_SPEED);
    }

    typeNextLine();
  }

  /**
   * Render the celebration (after YES is clicked).
   */
  function renderCelebration(scene) {
    startConfetti();
    startCelebrationHearts();

    storyTextEl.textContent = '';
    const celebEl = document.createElement('p');
    celebEl.className = 'celebration-text';
    celebEl.textContent = scene.text;
    storyTextEl.after(celebEl);
  }

  /* ==========================================================
     3. TYPEWRITER EFFECT
     ========================================================== */

  /**
   * Display text character by character.
   * @param {string} text - text to type
   * @param {HTMLElement} element - target element
   * @param {function} onDone - callback when typing finishes
   */
  function typewriterText(text, element, onDone) {
    clearTypewriter();
    let index = 0;
    element.textContent = '';

    // Add blinking cursor
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    element.appendChild(cursor);

    typewriterTimer = setInterval(() => {
      if (index < text.length) {
        // Insert character before cursor
        element.insertBefore(
          document.createTextNode(text[index]),
          cursor
        );
        index++;
      } else {
        clearInterval(typewriterTimer);
        typewriterTimer = null;
        // Remove cursor after a brief pause
        setTimeout(() => {
          if (cursor.parentNode) cursor.remove();
          if (onDone) onDone();
        }, 400);
      }
    }, TYPEWRITER_SPEED);
  }

  function clearTypewriter() {
    if (typewriterTimer) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
  }

  /* ==========================================================
     4. BUTTONS
     ========================================================== */

  /**
   * Create and display choice buttons.
   * @param {Array} buttons - array of { label, nextScene }
   */
  function showButtons(buttons) {
    if (!buttons || buttons.length === 0) return;

    buttonsEl.innerHTML = '';
    buttons.forEach((btn, index) => {
      const button = document.createElement('button');
      button.className = 'story-btn' + (btn.bounce ? ' bounce' : '');
      button.textContent = btn.label;
      button.style.opacity = '0';
      button.style.transform = 'translateY(15px)';

      if (!btn.bounce) {
        button.addEventListener('click', () => {
          showScene(btn.nextScene);
        });
      }

      buttonsEl.appendChild(button);

      // Staggered fade-in for buttons
      setTimeout(() => {
        button.style.transition = 'opacity 0.5s ease, transform 0.5s ease, left 0.3s ease, top 0.3s ease';
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
      }, 200 + index * 150);

      // Runaway effect for "wrong" choice buttons
      if (btn.bounce) {
        button.addEventListener('mouseenter', () => {
          const offsetX = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 80);
          const offsetY = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
          button.style.left = offsetX + 'px';
          button.style.top = offsetY + 'px';
        });
      }
    });
  }

  /* ==========================================================
     5. FLOATING HEARTS (Background)
     ========================================================== */

  /**
   * Create ambient floating hearts in the background.
   */
  function createBackgroundHearts() {
    heartsContainer.innerHTML = '';
    const heartCount = NUM_BG_HEARTS + (sceneCount * 8);
    for (let i = 0; i < heartCount; i++) {
      const heart = document.createElement('span');
      heart.className = 'floating-heart';
      heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
      heart.style.left = Math.random() * 100 + '%';
      heart.style.setProperty('--duration', (6 + Math.random() * 8) + 's');
      heart.style.setProperty('--delay', (Math.random() * 10) + 's');
      heart.style.fontSize = (0.9 + Math.random() * 1) + 'rem';
      heartsContainer.appendChild(heart);
    }
  }

  /**
   * Burst extra hearts for celebration scenes.
   */
  function startCelebrationHearts() {
    // Stop any existing celebration hearts
    if (celebrationHeartsId) clearInterval(celebrationHeartsId);

    celebrationHeartsId = setInterval(() => {
      const heart = document.createElement('span');
      heart.className = 'floating-heart';
      heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
      heart.style.left = Math.random() * 100 + '%';
      heart.style.setProperty('--duration', (4 + Math.random() * 4) + 's');
      heart.style.setProperty('--delay', '0s');
      heart.style.fontSize = (1.2 + Math.random() * 1.2) + 'rem';
      heartsContainer.appendChild(heart);

      // Remove after animation
      setTimeout(() => {
        if (heart.parentNode) heart.remove();
      }, 8000);
    }, 250);
  }

  /* ==========================================================
     6. CONFETTI
     ========================================================== */

  function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  /**
   * Launch confetti burst on the canvas.
   */
  function startConfetti() {
    confettiPieces = [];
    const colors = ['#ff6b8a', '#a855f7', '#ff8fa3', '#c9a0dc', '#fce4ec', '#e84a6f', '#ffd700'];

    // Create confetti particles
    for (let i = 0; i < 150; i++) {
      confettiPieces.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        speedX: (Math.random() - 0.5) * 4,
        speedY: 2 + Math.random() * 4,
        opacity: 1
      });
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    let activeCount = 0;
    confettiPieces.forEach((p) => {
      if (p.opacity <= 0) return;
      activeCount++;

      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      // Fade out when near bottom
      if (p.y > confettiCanvas.height * 0.85) {
        p.opacity -= 0.02;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (activeCount > 0) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      // Restart confetti for continuous celebration
      setTimeout(startConfetti, 1000);
    }
  }

  /* ==========================================================
     7. MUSIC TOGGLE
     ========================================================== */

  function setupMusicToggle() {
    musicToggle.addEventListener('click', () => {
      if (isMusicPlaying) {
        bgMusic.pause();
        musicToggle.textContent = '🎵';
        musicToggle.classList.remove('playing');
      } else {
        bgMusic.play().catch(() => {
          // Music file may not exist — that's OK
          console.info('No music file found. Add music.mp3 to enable.');
        });
        musicToggle.textContent = '🔇';
        musicToggle.classList.add('playing');
      }
      isMusicPlaying = !isMusicPlaying;
    });
  }

  /* ==========================================================
     8. EMBEDDED FALLBACK STORY
     (Used when story.json can't be fetched, e.g. file:// protocol)
     ========================================================== */

  function getEmbeddedStory() {
    return {
      scenes: {
        scene1: {
          text: "One day, a boy decided to send a simple text to a girl.",
          typewriter: true,
          buttons: [
            { label: "Send the message 💌", nextScene: "scene2" },
            { label: "Overthink and not send it 😰", nextScene: "overthink", bounce: true }
          ]
        },
        overthink: {
          text: "That message changed everything. Good thing he sent it.",
          typewriter: true,
          buttons: [
            { label: "Continue ➜", nextScene: "scene2" }
          ]
        },
        scene2: {
          text: "They started talking. One conversation turned into many.",
          typewriter: true,
          buttons: [
            { label: "Talk for hours 🌙", nextScene: "scene3" },
            { label: "Keep conversations short 💬", nextScene: "scene3", bounce: true }
          ]
        },
        scene3: {
          text: "Days turned into weeks. Talking to her became the best part of his day.",
          typewriter: true,
          buttons: [
            { label: "Wait and see where it goes ⏳", nextScene: "scene4", bounce: true },
            { label: "Realize something special is happening ✨", nextScene: "scene4" }
          ]
        },
        scene4: {
          text: "After a month of talking, the boy realized something.",
          typewriter: true,
          revealText: "He had caught feelings for her.",
          buttons: [
            { label: "Continue ➜", nextScene: "final" }
          ]
        },
        final: {
          type: "terms",
          lines: [
            "Before I ask you something important,\nthere are a few terms and conditions.",
            "Do you agree to always disturb me for no reason?",
            "Do you agree to spam me with random texts when you're bored?",
            "Do you agree to accept my flaws, my weird habits, and my bad jokes?",
            "Do you agree to listen to my stupid stories again and again?",
            "Do you agree to be the reason I smile every day?",
            "Do you agree to let me be the reason you smile too?",
            "And finally...",
            "Do you agree to be my girlfriend?"
          ],
          buttons: [
            { label: "YES ❤️", nextScene: "tease" },
            { label: "OBVIOUSLY YES ❤️", nextScene: "tease" }
          ]
        },
        tease: {
          text: "just yes?? no excitement?? 🥺",
          typewriter: true,
          buttons: [
            { label: "YESSSS!! 🎉💖🥹", nextScene: "celebration" },
            { label: "A THOUSAND TIMES YES!! 💕💕💕", nextScene: "celebration" }
          ]
        },
        celebration: {
          type: "celebration",
          text: "You just made me the happiest guy alive. 🥹💖"
        }
      }
    };
  }

  /* ==========================================================
     BOOT
     ========================================================== */
  document.addEventListener('DOMContentLoaded', init);

})();
