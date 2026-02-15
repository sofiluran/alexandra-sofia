document.addEventListener('DOMContentLoaded', () => {

  // 1. INITIERA GSAP & PLUGIN
  gsap.registerPlugin(ScrollTrigger);

  // Scrolla till toppen vid omladdning
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  };

  // 2. LÖSENORDSKONTROLL (Körs direkt vid laddning)
  const passwordScreen = document.getElementById('password-screen');
  if (localStorage.getItem('wedding_access') === 'true') {
    if (passwordScreen) passwordScreen.style.display = 'none';
  }

  // 3. RIDÅ-LOGIK (Öppnas vid klick)
  const curtain = document.getElementById('curtain');
  if (curtain) {
    document.body.style.overflow = 'hidden'; // Lås scroll initialt

    curtain.addEventListener('click', () => {
      curtain.classList.add('is-open');
      
      setTimeout(() => {
        document.body.style.overflow = 'auto'; // Tillåt scroll efter animation
      }, 2000); 
    });
  }

  // 4. COUNTDOWN LOGIK
  const targetDate = new Date("2027-07-31T00:00:00").getTime();
  const countdown = document.querySelector(".countdown");
  
  if (countdown) {
    countdown.classList.add("countdown-container");
    
    function createBox(label) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("time-wrapper");
      const box = document.createElement("div");
      box.classList.add("time-box");
      const value = document.createElement("div");
      value.classList.add("time-value");
      box.appendChild(value);
      const text = document.createElement("div");
      text.textContent = label;
      text.classList.add("time-label");
      wrapper.appendChild(box);
      wrapper.appendChild(text);
      return { wrapper, value };
    }

    const days = createBox("Dagar");
    const hours = createBox("Timmar");
    const minutes = createBox("Minuter");
    const seconds = createBox("Sekunder");
    countdown.append(days.wrapper, hours.wrapper, minutes.wrapper, seconds.wrapper);

    function updateCountdown() {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        countdown.textContent = "🎉 Det är idag!";
        clearInterval(timer);
        return;
      }
      days.value.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
      hours.value.textContent = Math.floor((diff / (1000 * 60 * 60)) % 24);
      minutes.value.textContent = Math.floor((diff / (1000 * 60)) % 60);
      seconds.value.textContent = Math.floor((diff / 1000) % 60);
    }
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
  }

  // 5. SKRAPLOTTS-LOGIK
  const canvases = document.querySelectorAll('.scratch-canvas');
  let hasExploded = false;
  let finishedCanvases = { "canvas-day": false, "canvas-month": false, "canvas-year": false };

  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 100;
    canvas.height = 100;
    let localScratchCount = 0;
    const canvasId = canvas.id;

    const gradient = ctx.createLinearGradient(0, 0, 100, 100);
    gradient.addColorStop(0, '#d4a373');
    gradient.addColorStop(0.3, '#ffffff');
    gradient.addColorStop(0.5, '#e5c08b');
    gradient.addColorStop(1, '#b38b5d');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2);
    ctx.fill();

    let isDrawing = false;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function scratch(e) {
      if (!isDrawing) return;
      const pos = getPos(e);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fill();

      if (!finishedCanvases[canvasId]) {
        localScratchCount++;
        if (localScratchCount > 20) {
          finishedCanvases[canvasId] = true;
          checkIfAllFinished(canvas);
        }
      }
    }

    function checkIfAllFinished(currentCanvas) {
      if (hasExploded) return;
      const allDone = Object.values(finishedCanvases).every(status => status === true);
      if (allDone) {
        const rect = currentCanvas.getBoundingClientRect();
        triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        hasExploded = true;
      }
    }

    canvas.addEventListener('mousedown', () => isDrawing = true);
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; if(e.cancelable) e.preventDefault(); }, { passive: false });
    window.addEventListener('touchend', () => isDrawing = false);
    window.addEventListener('touchmove', (e) => { if (isDrawing) { scratch(e); if(e.cancelable) e.preventDefault(); } }, { passive: false });
  });

  // 6. SCROLL-ANIMATIONER (OSA-formulär)
  gsap.from("#OSA", {
    scrollTrigger: {
      trigger: "#OSA",
      start: "top 85%",
      toggleActions: "play none none reverse"
    },
    opacity: 0,
    y: 80,
    duration: 1.5,
    ease: "expo.out"
  });

  gsap.from(".form-info > div", {
    scrollTrigger: {
      trigger: ".form-info",
      start: "top 80%"
    },
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 1,
    ease: "power2.out"
  });

  // Koppla enter-knapp till lösenordsfältet
  document.getElementById('password-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
}); 

// --- FRISTÅENDE FUNKTIONER ---

function checkPassword() {
  const password = document.getElementById('password-input').value;
  const correctPassword = "stockholm"; // Ditt valda lösenord
  const errorMsg = document.getElementById('password-error');
  const screen = document.getElementById('password-screen');

  if (password === correctPassword) {
    localStorage.setItem('wedding_access', 'true');
    gsap.to(screen, { 
      opacity: 0, 
      duration: 0.8, 
      onComplete: () => screen.style.display = 'none' 
    });
  } else {
    errorMsg.style.display = 'block';
    gsap.fromTo(".password-box", { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true });
  }
}

function triggerConfetti(sourceX, sourceY) {
  const x = sourceX / window.innerWidth;
  const y = sourceY / window.innerHeight;
  const colors = ['#D4AF37', '#F5E6CC', '#AA8A59', '#FFFFFF'];
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { x: x, y: y },
    colors: colors,
    shapes: ['circle'],
    scalar: 0.8,
    zIndex: 9999
  });
}

function toggleNights(show) {
  const nightsContainer = document.getElementById('nights-container');
  if (show) {
    nightsContainer.style.display = 'block';
    gsap.fromTo(nightsContainer, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
  } else {
    gsap.to(nightsContainer, { opacity: 0, y: -20, duration: 0.4, onComplete: () => {
      nightsContainer.style.display = 'none';
    }});
  }
}