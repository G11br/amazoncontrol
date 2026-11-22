/* =========================================================
   AmazonControl — home (v3): motion e interações
   ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isSmall = () => window.innerWidth < 700;
const motion = hasGsap && !reduceMotion;
if (!motion) document.documentElement.classList.add("no-motion");

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

$("#year").textContent = new Date().getFullYear();

/* ---------- WhatsApp ---------- */
const waText = "Olá! Gostaria de solicitar uma proposta de controle de pragas para a minha empresa.";
const waHref = window.waLink ? window.waLink(waText) : "https://linktr.ee/amazoncontrolbrasil";
$("#waBtn").href = waHref;
$$(".js-wa").forEach((a) => (a.href = waHref));

/* =========================================================
   Smooth scroll (Lenis) + GSAP
   ========================================================= */
let lenis = null;
if (motion) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.lenis = lenis;
  }
}
function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 });
  else (typeof target === "number" ? window.scrollTo({ top: target, behavior: "smooth" }) : target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));
}
$$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  if (id === "#") return;
  const el = id === "#top" ? 0 : $(id);
  if (el === null) return;
  e.preventDefault();
  setMenu(false);
  scrollToTarget(el);
}));

/* =========================================================
   Cursor
   ========================================================= */
const cursor = $("#cursor");
const cursorLabel = $("#cursorLabel");
const pointer = { x: -999, y: -999, down: false, lastMove: 0 };
if (finePointer && !reduceMotion) {
  document.body.classList.add("has-cursor");
  let cx = -999, cy = -999;
  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.lastMove = performance.now();
    cursor.classList.add("is-on");
    const spray = e.target.closest("[data-cursor-mode='spray']") && !e.target.closest("a, button");
    cursor.classList.toggle("is-spray", !!spray);
    const lab = e.target.closest("[data-cursor]");
    cursor.classList.toggle("is-label", !!lab);
    if (lab) cursorLabel.textContent = lab.dataset.cursor;
  });
  document.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  window.addEventListener("pointerdown", () => { pointer.down = true; cursor.classList.add("is-down"); });
  window.addEventListener("pointerup", () => { pointer.down = false; cursor.classList.remove("is-down"); });
  (function loop() {
    cx += (pointer.x - cx) * 0.3; cy += (pointer.y - cy) * 0.3;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

/* =========================================================
   Header + menu
   ========================================================= */
const hdr = $("#hdr");
const menu = $("#menu");
const menuBtn = $("#menuBtn");
function setMenu(open) {
  if (menu.classList.contains("is-open") === open) return;
  menu.classList.toggle("is-open", open);
  menu.setAttribute("aria-hidden", !open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  document.body.style.overflow = open ? "hidden" : "";
  if (lenis) open ? lenis.stop() : lenis.start();
}
menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
$$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
const onScrollHeader = () => hdr.classList.toggle("is-compact", window.scrollY > 140);
window.addEventListener("scroll", onScrollHeader, { passive: true });

const hero = $("#hero");

/* =========================================================
   Loader
   ========================================================= */
function runLoader(done) {
  const loader = $("#loader");
  const num = $("#loaderNum");
  const bar = $("#loaderBar");
  if (reduceMotion) { loader.classList.add("is-done"); return done(); }
  let loaded = document.readyState === "complete";
  window.addEventListener("load", () => (loaded = true));
  const t0 = performance.now();
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    num.textContent = 100; bar.style.width = "100%";
    setTimeout(() => { loader.classList.add("is-done"); done(); }, 250);
  }
  (function frame(now) {
    if (finished) return;
    const k = Math.min((now - t0) / 1400, loaded ? 1 : 0.9);
    const eased = 1 - Math.pow(1 - k, 3);
    num.textContent = Math.round(eased * 100);
    bar.style.width = `${eased * 100}%`;
    if (k >= 1) finish(); else requestAnimationFrame(frame);
  })(t0);
  // segurança: nunca prende o visitante no carregamento
  setTimeout(finish, 3500);
}

/* =========================================================
   Temas por seção (fundo do site muda ao rolar)
   ========================================================= */
const themeColors = { light: "#f9f7f5", white: "#ffffff", sky: "#e4eefb", navy: "#12345a", dark: "#05172b", black: "#000000", accent: "#3a86dc" };
const themeMeta = $('meta[name="theme-color"]');
function setTheme(t) {
  if (document.body.dataset.theme === t) return;
  document.body.dataset.theme = t;
  themeMeta.setAttribute("content", themeColors[t]);
}
const themed = $$("[data-theme]").filter((el) => el !== document.body);
const themeObserver = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) setTheme(en.target.dataset.theme); });
}, { rootMargin: "-50% 0px -50% 0px" });
themed.forEach((el) => themeObserver.observe(el));

/* =========================================================
   Texto: palavras e linhas
   ========================================================= */
$$("[data-words]").forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
});
$$(".big").forEach((h) => {
  [...h.children].forEach((child) => {
    const wrap = document.createElement("span");
    wrap.className = "ln";
    child.classList.add("ln__in");
    h.insertBefore(wrap, child);
    wrap.appendChild(child);
  });
});

/* =========================================================
   Painel de monitoramento (MIP): pontos verificados ao rolar
   ========================================================= */
const monitor = (() => {
  const stations = $$("#stations .st");
  const checkedEl = $("#mCheck");
  const issuesEl = $("#mIssues");
  const bars = $$("#mBars i");
  const chip = $("#mChip");
  const total = stations.length;
  const startIssues = 9;
  // ordem fixa e espalhada, para os pontos acenderem por toda a planta
  const order = stations.map((_, i) => i).sort((a, b) => ((a * 7) % total) - ((b * 7) % total));
  return function set(p) {
    const n = Math.round(p * total);
    order.forEach((idx, k) => stations[idx].classList.toggle("is-ok", k < n));
    checkedEl.textContent = n;
    issuesEl.textContent = Math.round(startIssues * (1 - p));
    bars.forEach((b, i) => b.style.setProperty("--p", clamp(p * 1.4 - i * 0.08, 0, 1)));
    chip.classList.toggle("is-on", p >= 0.98);
  };
})();
if (!motion) monitor(1);

/* =========================================================
   Cards de serviço: névoa segue o mouse
   ========================================================= */
$$(".cardx").forEach((c) => c.addEventListener("pointermove", (e) => {
  const r = c.getBoundingClientRect();
  c.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  c.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
}));

/* =========================================================
   Contadores
   ========================================================= */
function countUp(el) {
  const to = +el.dataset.count;
  if (!motion) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1600;
  (function tick(now) {
    const k = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

/* =========================================================
   Scanner da casa
   ========================================================= */
const housePaths = $$("#house .draw path");
housePaths.forEach((p) => { p.setAttribute("pathLength", "1"); p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = motion ? "1" : "0"; });
const beam = $("#beam");
const spots = $$("#spots .spot");
const legendItems = $$("#scanLegend li");
function setScan(drawP, beamP) {
  housePaths.forEach((p, i) => {
    const local = clamp(drawP * 1.6 - (i / housePaths.length) * 0.6, 0, 1);
    p.style.strokeDashoffset = String(1 - local);
  });
  const x = beamP * 1000;
  beam.setAttribute("x1", x); beam.setAttribute("x2", x);
  beam.style.opacity = beamP > 0 && beamP < 1 ? 1 : 0;
  spots.forEach((s, i) => {
    const on = beamP >= +s.dataset.at;
    s.classList.toggle("is-on", on);
    legendItems[i]?.classList.toggle("is-on", on);
  });
}
if (!motion) { setScan(1, 1); }

/* =========================================================
   Início: loader -> animações
   ========================================================= */
runLoader(() => {
  document.body.classList.remove("is-loading");
  if (lenis) lenis.start();
  if (motion) initMotion();
  else initStatic();
});

function initStatic() {
  $$(".scribble").forEach((s) => s.classList.add("is-in"));
  $$("[data-count]").forEach(countUp);
  $$(".manifesto__text .w").forEach((w) => (w.style.opacity = 1));
}

function initMotion() {
  // Intro do hero
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(".hdr > *", { y: -30, opacity: 0, duration: 1, stagger: 0.08, clearProps: "transform,opacity" })
    .from(".hero__title .ln__in", { yPercent: 115, duration: 1.4, stagger: 0.12 }, 0.05)
    .from(".hero .reveal-fade", { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, 0.5)
    .from(".hero__mark", { scale: 0.6, rotate: -60, opacity: 0, duration: 1.8, transformOrigin: "50% 50%" }, 0);

  // Marca gigante: gira ao rolar e acompanha o mouse de leve
  gsap.to(".hero__mark", { rotate: 35, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  if (finePointer) {
    const mx = gsap.quickTo(".hero__mark", "x", { duration: 1.2, ease: "power3" });
    const my = gsap.quickTo(".hero__mark", "y", { duration: 1.2, ease: "power3" });
    hero.addEventListener("pointermove", (e) => { mx((e.clientX / innerWidth - 0.5) * -40); my((e.clientY / innerHeight - 0.5) * -30); });
  }

  // Título do hero "afunda" ao rolar
  gsap.to(".hero__inner", { yPercent: 22, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Títulos grandes: linhas sobem
  $$(".big, .cta__title").forEach((h) => {
    gsap.from($$(".ln__in", h), { yPercent: 110, duration: 1.3, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 85%" } });
  });
  $$(".eyebrow").forEach((el) => gsap.from(el, { y: 14, opacity: 0, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }));

  // Rabiscos "escritos à mão"
  $$(".scribble:not(.scribble--hero)").forEach((s) => ScrollTrigger.create({ trigger: s.parentElement, start: "top 70%", once: true, onEnter: () => s.classList.add("is-in") }));

  // Manifesto: palavras acendem
  gsap.to(".manifesto__text .w", { opacity: 1, stagger: 0.04, ease: "none", scrollTrigger: { trigger: ".manifesto__text", start: "top 80%", end: "bottom 45%", scrub: true } });

  // Parallax de elementos soltos (só em telas largas)
  ScrollTrigger.matchMedia({
    "(min-width: 1001px)": () => {
      $$("[data-speed]").forEach((el) => {
        gsap.to(el, { y: () => +el.dataset.speed * -400, rotate: () => +el.dataset.speed * 20, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    "(max-width: 1000px)": () => {
      $$(".split__deco").forEach((el) => {
        gsap.to(el, { y: () => +el.dataset.speed * -200, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
  });
  gsap.from(".float-card", { scale: 0.6, opacity: 0, duration: 1, stagger: 0.1, ease: "back.out(1.8)", scrollTrigger: { trigger: ".manifesto", start: "top 70%" } });

  // Split
  gsap.from(".split__col p, .sq-btn", { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".split", start: "top 70%" } });

  // Marquee: segue a direção e a velocidade da rolagem
  const track = $("#mqTrack");
  let mqX = 0, mqDir = 1, mqBoost = 0, half = track.scrollWidth / 2;
  window.addEventListener("resize", () => (half = track.scrollWidth / 2));
  document.fonts?.ready.then(() => (half = track.scrollWidth / 2));
  gsap.ticker.add((_, delta) => {
    const dt = Math.min(delta / 1000, 0.05);
    const v = lenis ? lenis.velocity : 0;
    if (Math.abs(v) > 0.5) mqDir = v > 0 ? 1 : -1;
    mqBoost += (Math.min(Math.abs(v) * 0.08, 4) - mqBoost) * 0.1;
    mqX = (mqX + mqDir * 70 * (1 + mqBoost) * dt) % half;
    if (mqX < 0) mqX += half;
    track.style.transform = `translate3d(${-mqX}px,0,0)`;
  });

  // Scanner: desenha a casa e varre com o feixe
  const scanState = { draw: 0, beam: 0 };
  gsap.timeline({
    scrollTrigger: { trigger: ".scan", start: "top top", end: () => `+=${window.innerHeight * (isSmall() ? 1.6 : 2.2)}`, pin: ".scan__pin", scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
    onUpdate: () => setScan(scanState.draw, scanState.beam),
  })
    .to(scanState, { draw: 1, duration: 0.45, ease: "none" })
    .to(scanState, { beam: 1, duration: 0.55, ease: "none" }, 0.3);

  // Serviços
  gsap.from(".cardx", { y: 80, opacity: 0, duration: 1.2, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".svc__grid", start: "top 85%" } });

  // Setores: linhas entram em sequência
  gsap.from(".sector", { y: 40, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: ".sectors__list", start: "top 85%" } });

  // Documentação: os papéis saem de uma pilha e se espalham
  ScrollTrigger.matchMedia({
    "(min-width: 901px)": () => {
      const grid = $("#docsGrid");
      const papers = $$(".doc__paper", grid);
      // mede pelo cartão-pai (que não é transformado), para o cálculo não depender da animação
      const offset = (el, axis) => {
        const g = grid.getBoundingClientRect(), r = el.parentElement.getBoundingClientRect();
        return axis === "x"
          ? (g.left + g.width / 2) - (r.left + r.width / 2)
          : (g.top + g.height / 2) - (r.top + el.offsetHeight / 2);
      };
      gsap.fromTo(papers, {
        x: (i, el) => offset(el, "x"), y: (i, el) => offset(el, "y"),
        rotate: (i) => (i - 2.5) * 7, scale: 0.85,
      }, {
        x: 0, y: 0, rotate: (i) => [-2.5, 1.8, -1.2, 2.4, -1.8, 1.4][i % 6], scale: 1, ease: "power2.out",
        scrollTrigger: { trigger: grid, start: "top 80%", end: "center 55%", scrub: 0.8, invalidateOnRefresh: true },
      });
      gsap.from($$(".doc h3, .doc p", grid), { opacity: 0, y: 16, stagger: 0.03, scrollTrigger: { trigger: grid, start: "center 70%", end: "center 50%", scrub: true } });
    },
    "(max-width: 900px)": () => {
      $$(".doc").forEach((d) => gsap.from(d, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: d, start: "top 88%" } }));
    },
  });

  // Painel de monitoramento
  monitor(0);
  gsap.to({ v: 0 }, {
    v: 1, ease: "none",
    scrollTrigger: { trigger: ".monitor__board", start: "top 80%", end: "bottom 60%", scrub: 0.5 },
    onUpdate() { monitor(this.targets()[0].v); },
  });

  // Processo: rolagem horizontal em telas largas
  ScrollTrigger.matchMedia({
    "(min-width: 901px)": () => {
      const trackEl = $("#procTrack");
      const dist = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);
      gsap.to(trackEl, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".proc", start: "top top", end: () => `+=${dist()}`, pin: ".proc__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    },
    "(max-width: 900px)": () => {
      $$(".step").forEach((s) => gsap.from(s, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 88%" } }));
    },
  });

  // Números
  $$("[data-count]").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => countUp(el) }));

  // FAQ
  gsap.from(".faq details", { y: 24, opacity: 0, duration: 0.9, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: ".faq__list", start: "top 85%" } });

  // Rodapé: palavra gigante sobe
  gsap.from(".ftr__word", { yPercent: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: ".ftr", start: "top bottom", end: "bottom bottom", scrub: true } });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
