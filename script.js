/* =========================================================
   AmazonControl — interações e motion
   ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

document.body.classList.add("is-loading");
if (!hasGsap || reduceMotion) document.documentElement.classList.add("no-gsap");
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- WhatsApp ---------- */
const waFloat = document.getElementById("waFloat");
waFloat.href = waLink("Olá! Gostaria de um orçamento com a AmazonControl.");


/* ---------- Header ---------- */
const header = document.getElementById("header");
const progress = document.getElementById("scrollProgress");
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle("is-scrolled", y > 40);
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  waFloat.classList.toggle("is-visible", y > window.innerHeight * 0.6);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Nav: indicador deslizante + seção ativa ---------- */
const nav = document.getElementById("nav");
const indicator = document.getElementById("navIndicator");
const navLinks = [...nav.querySelectorAll("a")];
let activeLink = null;

function moveIndicator(link) {
  if (!link) { indicator.style.opacity = 0; return; }
  indicator.style.width = `${link.offsetWidth}px`;
  indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  indicator.style.opacity = 1;
}
navLinks.forEach((a) => a.addEventListener("mouseenter", () => moveIndicator(a)));
nav.addEventListener("mouseleave", () => moveIndicator(activeLink));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    activeLink = navLinks.find((a) => a.hash === `#${entry.target.id}`) || null;
    navLinks.forEach((a) => a.classList.toggle("is-active", a === activeLink));
    if (!nav.matches(":hover")) moveIndicator(activeLink);
  });
}, { rootMargin: "-45% 0px -50% 0px" });
["inicio", ...navLinks.map((a) => a.hash.slice(1))].forEach((id) => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});
window.addEventListener("resize", () => moveIndicator(activeLink));

/* ---------- Mobile menu ---------- */
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");
function setMenu(open) {
  mobileMenu.classList.toggle("is-open", open);
  mobileMenu.setAttribute("aria-hidden", !open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("is-open")));
mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* ---------- Custom cursor ---------- */
if (finePointer && !reduceMotion) {
  const cursor = document.querySelector(".cursor");
  let cx = 0, cy = 0, tx = 0, ty = 0;
  window.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add("is-active");
  });
  document.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  (function loop() {
    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll("a, button, .card, .env, summary, .chips span").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

/* ---------- Magnetic buttons ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
  });
}

/* ---------- Card tilt + spotlight origin ---------- */
document.querySelectorAll(".tilt").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
    if (finePointer && !reduceMotion) {
      card.style.transform = `rotateY(${(px - 0.5) * 12}deg) rotateX(${(0.5 - py) * 10}deg) translateY(-6px)`;
    }
  });
  card.addEventListener("mouseleave", () => { card.style.transform = ""; });
});

/* ---------- Hero mist (spray particles) ---------- */
(function mist() {
  const canvas = document.getElementById("mist");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w, h, particles = [];
  const mouse = { x: -9999, y: -9999 };
  const colors = ["166,224,92", "63,174,42", "255,255,255"];

  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (w * h) / 14000));
    particles = Array.from({ length: count }, () => spawn(true));
  }
  function spawn(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.4 + 0.1),
      a: Math.random() * 0.5 + 0.15,
      c: colors[Math.floor(Math.random() * colors.length)],
    };
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 16000) {
        const f = (16000 - d2) / 16000;
        p.vx += (dx / Math.sqrt(d2 || 1)) * f * 0.6;
        p.vy += (dy / Math.sqrt(d2 || 1)) * f * 0.6;
      }
      p.vx *= 0.96; p.vy = p.vy * 0.96 - 0.012;
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10 || p.x < -10 || p.x > w + 10) Object.assign(p, spawn(false));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.fill();
    }
    // linhas sutis entre partículas próximas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = dx * dx + dy * dy;
        if (d < 7000) {
          ctx.strokeStyle = `rgba(166,224,92,${0.12 * (1 - d / 7000)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    if (running) requestAnimationFrame(frame);
  }
  let running = true;
  resize();
  window.addEventListener("resize", resize);
  canvas.parentElement.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });

  if (reduceMotion) { frame(); running = false; return; }
  // pausa quando o hero sai da tela
  new IntersectionObserver(([entry]) => {
    const was = running;
    running = entry.isIntersecting;
    if (running && !was) requestAnimationFrame(frame);
  }).observe(canvas);
  requestAnimationFrame(frame);
})();

/* ---------- Statement: quebra em palavras ---------- */
const statement = document.getElementById("statement");
statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");

/* ---------- Counters ---------- */
function runCounter(el) {
  const to = +el.dataset.to;
  if (reduceMotion) { el.textContent = to; return; }
  const start = performance.now(), dur = 1800;
  (function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - t, 4)));
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

/* ---------- Intro + scroll animations ---------- */
function hideLoader() {
  document.getElementById("loader").classList.add("is-done");
  document.body.classList.remove("is-loading");
}

window.addEventListener("load", () => {
  setTimeout(() => {
    hideLoader();
    if (hasGsap && !reduceMotion) initMotion();
    else initFallback();
  }, 900);
});

function initFallback() {
  document.querySelectorAll(".statement__text .w").forEach((w) => (w.style.opacity = 1));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); io.unobserve(e.target); } });
  });
  document.querySelectorAll(".count").forEach((c) => io.observe(c));
  document.querySelectorAll(".step").forEach((s) => s.classList.add("is-active"));
  document.getElementById("stepsProgress").style.height = "100%";
}

function initMotion() {
  gsap.registerPlugin(ScrollTrigger);

  // Hero intro
  const intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.25 });
  intro
    .from(".header__bar", { y: -30, opacity: 0, duration: 1.1 })
    .from(".hero__title .line > span", { yPercent: 110, duration: 1.3, stagger: 0.12 }, "<0.1")
    .from(".hero .reveal-up", { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, "<0.3")
    .from(".orb", { scale: 0.6, opacity: 0, rotate: -30, duration: 1.6 }, "<-0.6")
    .from(".orb__chip", { scale: 0, opacity: 0, duration: 0.8, stagger: 0.1, ease: "back.out(2)" }, "<0.5");

  // Hero parallax on scroll
  gsap.to(".hero__content", { yPercent: 18, opacity: 0.3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".orb", { yPercent: 30, scale: 0.9, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Faixa: velocidade constante, com leve aceleração suave ao rolar
  const track = document.querySelector(".marquee__track");
  track.style.animation = "none";
  const BASE_SPEED = 60; // px por segundo
  let offset = 0, boost = 0, targetBoost = 0, lastT = performance.now();
  ScrollTrigger.create({
    onUpdate: (self) => { targetBoost = Math.min(Math.abs(self.getVelocity()) / 1500, 2); },
  });
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    targetBoost *= 0.92;                 // o impulso do scroll vai sumindo aos poucos
    boost += (targetBoost - boost) * 0.08; // e a velocidade acompanha suavemente
    const half = track.scrollWidth / 2;
    offset = (offset + BASE_SPEED * (1 + boost) * dt) % half;
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  });

  // Generic reveals (fora do hero)
  gsap.utils.toArray(".reveal-up").filter((el) => !el.closest(".hero")).forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  gsap.utils.toArray(".reveal-scale").forEach((el, i) => {
    gsap.from(el, { y: 80, scale: 0.92, opacity: 0, duration: 1.2, delay: (i % 4) * 0.08, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  // Service cards stagger
  gsap.from(".card", {
    y: 90, opacity: 0, rotateX: -25, duration: 1.2, stagger: 0.12, ease: "expo.out",
    scrollTrigger: { trigger: ".cards", start: "top 82%" },
    clearProps: "transform",
  });

  // Statement word highlight
  gsap.to(".statement__text .w", {
    opacity: 1, stagger: 0.05, ease: "none",
    scrollTrigger: { trigger: ".statement", start: "top 75%", end: "bottom 45%", scrub: true },
  });

  // Counters
  document.querySelectorAll(".count").forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => runCounter(el) });
  });
  gsap.from(".stat", { x: -30, opacity: 0, stagger: 0.1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".stats", start: "top 80%" } });

  // Process progress line + active steps
  gsap.to("#stepsProgress", {
    height: "100%", ease: "none",
    scrollTrigger: { trigger: ".steps", start: "top 60%", end: "bottom 60%", scrub: true },
  });
  gsap.utils.toArray(".step").forEach((step) => {
    ScrollTrigger.create({
      trigger: step, start: "top 62%",
      onEnter: () => step.classList.add("is-active"),
      onLeaveBack: () => step.classList.remove("is-active"),
    });
    gsap.from(step, { x: 60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: step, start: "top 88%" } });
  });

  // Benefits icons pop
  gsap.from(".benefit__icon", { scale: 0, rotate: -90, duration: 1, stagger: 0.12, ease: "back.out(2)", scrollTrigger: { trigger: ".benefits", start: "top 80%" } });

  // Card de orçamento
  gsap.from(".quiz-teaser", { x: 80, rotate: 3, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".cta", start: "top 70%" } });

  // Recalcula após fontes carregarem
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
