/* =========================================================
   AmazonControl — home (v2): motion e interações
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
const waText = "Olá! Gostaria de um orçamento com a AmazonControl.";
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
   Insetos desenhados em canvas (barata e formiga)
   ========================================================= */
class Bug {
  constructor(kind, x, y, a, size) {
    Object.assign(this, { kind, x, y, a, size });
    this.speed = kind === "roach" ? rand(60, 95) : rand(38, 58);
    this.walk = rand(0, TAU);
    this.turn = 0;
    this.hp = 1;
    this.dead = 0; // 0 = vivo; >0 = progresso da morte
    this.spin = rand(-6, 6);
  }
  update(dt) {
    if (this.dead) {
      this.dead += dt * 1.3;
      this.a += this.spin * dt * (1 - Math.min(this.dead, 1));
      return;
    }
    this.turn += rand(-1, 1) * dt * 6;
    this.turn *= 0.94;
    this.a += this.turn * dt * 2;
    this.x += Math.cos(this.a) * this.speed * dt;
    this.y += Math.sin(this.a) * this.speed * dt;
    this.walk += this.speed * dt * (this.kind === "roach" ? 0.42 : 0.6);
  }
  steerTo(tx, ty, k) {
    const want = Math.atan2(ty - this.y, tx - this.x);
    let d = want - this.a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.a += d * k;
  }
  draw(ctx, t) {
    const d = Math.min(this.dead, 1);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);
    const s = this.size * (1 - d * 0.35);
    ctx.scale(s, s);
    ctx.globalAlpha = 1 - d;
    if (this.kind === "roach") drawRoach(ctx, this, t, d);
    else drawAnt(ctx, this, t, d);
    ctx.restore();
  }
}

function legs(ctx, bases, angles, l1, l2, phase, amp, side, curl) {
  for (let i = 0; i < 3; i++) {
    const p = phase + ((i + (side > 0 ? 1 : 0)) % 2) * Math.PI;
    const sw = curl ? 0.3 * Math.sin(phase * 3 + i) : Math.sin(p) * amp;
    const a = side * angles[i] + sw;
    const kx = bases[i] + Math.cos(a) * l1, ky = side * 2 + Math.sin(a) * l1;
    const a2 = a + side * (curl ? 1.6 : 0.55);
    ctx.beginPath();
    ctx.moveTo(bases[i], side * 2);
    ctx.lineTo(kx, ky);
    ctx.lineTo(kx + Math.cos(a2) * l2, ky + Math.sin(a2) * l2);
    ctx.stroke();
  }
}

function drawRoach(ctx, b, t, d) {
  const curl = d > 0;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2a1a0e";
  ctx.lineWidth = 1.5;
  [-1, 1].forEach((side) => legs(ctx, [8, 1, -5], [0.65, 1.55, 2.45], 10, 11, b.walk, 0.42, side, curl));
  // antenas
  ctx.lineWidth = 1;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(15, side * 2);
    ctx.quadraticCurveTo(30, side * (4 + Math.sin(t * 7 + side) * 3), 44, side * 15);
    ctx.stroke();
  });
  // cercos
  ctx.beginPath(); ctx.moveTo(-17, -3); ctx.lineTo(-22, -5); ctx.moveTo(-17, 3); ctx.lineTo(-22, 5); ctx.stroke();
  // corpo
  ctx.fillStyle = curl ? "#9a7a55" : "#5b371f";
  ctx.beginPath(); ctx.ellipse(-3, 0, 15, 8.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = curl ? "#a88864" : "#734a2a";
  ctx.beginPath(); ctx.ellipse(9, 0, 6, 7.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#2e1d10";
  ctx.beginPath(); ctx.arc(15, 0, 3.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(4, 0); ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,.25)";
  ctx.beginPath(); ctx.moveTo(-8, -7); ctx.quadraticCurveTo(-4, 0, -8, 7); ctx.stroke();
}

function drawAnt(ctx, b, t, d) {
  const curl = d > 0;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#161616";
  ctx.lineWidth = 1.1;
  [-1, 1].forEach((side) => legs(ctx, [1.5, 0, -1.5], [0.7, 1.6, 2.4], 5, 5.5, b.walk, 0.5, side, curl));
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(8, side * 1);
    ctx.lineTo(11, side * (3 + Math.sin(t * 9 + side) * 0.8));
    ctx.lineTo(15, side * 5);
    ctx.stroke();
  });
  ctx.fillStyle = curl ? "#6b6b6b" : "#171717";
  ctx.beginPath(); ctx.ellipse(-7, 0, 5.2, 3.8, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 3.3, 2.2, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(6.5, 0, 2.7, 0, TAU); ctx.fill();
}

/* ---------- Cena (canvas + partículas) ---------- */
function makeScene(canvas) {
  const ctx = canvas.getContext("2d");
  const scene = { canvas, ctx, w: 0, h: 0, bugs: [], parts: [] };
  scene.resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    scene.w = canvas.clientWidth; scene.h = canvas.clientHeight;
    canvas.width = Math.round(scene.w * dpr); canvas.height = Math.round(scene.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  scene.resize();
  return scene;
}

function emitMist(scene, x, y, n, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), v = rand(20, 90) * power;
    scene.parts.push({ x: x + rand(-6, 6), y: y + rand(-6, 6), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 12, life: 0, max: rand(0.6, 1.2), r: rand(3, 6), grow: rand(14, 26), kind: "mist" });
  }
}
function emitPuff(scene, x, y) {
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + rand(-0.2, 0.2), v = rand(80, 170);
    scene.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rand(0.45, 0.8), r: rand(2, 4), grow: 2, kind: "spark" });
  }
  scene.parts.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.6, r: 6, grow: 70, kind: "ring" });
}
function drawParts(scene, dt) {
  const { ctx } = scene;
  scene.parts = scene.parts.filter((p) => (p.life += dt) < p.max);
  for (const p of scene.parts) {
    const k = p.life / p.max;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.93; p.vy *= 0.93;
    const r = p.r + p.grow * k;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    if (p.kind === "ring") {
      ctx.strokeStyle = `rgba(11,26,51,${0.6 * (1 - k)})`;
      ctx.lineWidth = 3 * (1 - k) + 0.5;
      ctx.stroke();
    } else if (p.kind === "spark") {
      ctx.fillStyle = `rgba(20,120,235,${1 - k})`;
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(46,155,255,${0.42 * (1 - k)})`;
      ctx.fill();
    }
  }
}

/* =========================================================
   Fundo topográfico (curvas de nível)
   ========================================================= */
(function topo() {
  const canvas = $("#topo");
  const ctx = canvas.getContext("2d");
  const seed = [rand(0, 9), rand(0, 9), rand(0, 9), rand(0, 9)];
  const field = (x, y) =>
    Math.sin(x * 0.0035 + seed[0]) * Math.cos(y * 0.0042 + seed[1]) +
    0.65 * Math.sin((x + y * 0.6) * 0.0026 + seed[2]) +
    0.35 * Math.cos(x * 0.0078 - y * 0.0051 + seed[3]);

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(80,100,135,.2)";
    ctx.lineWidth = 1;
    const cell = 14;
    const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
    const v = [];
    for (let j = 0; j < rows; j++) { v[j] = []; for (let i = 0; i < cols; i++) v[j][i] = field(i * cell, j * cell); }
    const lerp = (a, b, l) => (l - a) / (b - a);
    ctx.beginPath();
    for (let level = -1.8; level <= 1.8; level += 0.22) {
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], d = v[j + 1][i];
          const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const x = i * cell, y = j * cell;
          const T = [x + cell * lerp(a, b, level), y];
          const R = [x + cell, y + cell * lerp(b, c, level)];
          const B = [x + cell * lerp(d, c, level), y + cell];
          const L = [x, y + cell * lerp(a, d, level)];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(L, B); break;
            case 2: case 13: seg(B, R); break;
            case 3: case 12: seg(L, R); break;
            case 4: case 11: seg(T, R); break;
            case 5: seg(L, T); seg(B, R); break;
            case 6: case 9: seg(T, B); break;
            case 7: case 8: seg(L, T); break;
            case 10: seg(T, R); seg(L, B); break;
          }
        }
      }
    }
    ctx.stroke();
  }
  draw();
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 200); });
})();

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

/* =========================================================
   Hero: insetos + spray interativo
   ========================================================= */
const hero = $("#hero");
const killEl = $("#killCount");
let kills = 0;
const hint = $("#sprayHint");
if (!finePointer) hint.textContent = "Toque nos insetos para dedetizar";

const heroScene = (() => {
  const scene = makeScene($("#bugs"));
  const target = () => (isSmall() ? 6 : 10);
  const local = { x: -999, y: -999, active: 0, down: false };
  let running = true, last = performance.now(), respawnAt = 0;

  function spawn(fromEdge) {
    const { w, h } = scene;
    let x, y, a;
    if (fromEdge) {
      const e = Math.floor(rand(0, 4));
      x = e === 0 ? -30 : e === 1 ? w + 30 : rand(0, w);
      y = e === 2 ? -30 : e === 3 ? h + 30 : rand(0, h);
      a = Math.atan2(h / 2 - y, w / 2 - x) + rand(-0.6, 0.6);
    } else {
      x = rand(w * 0.05, w * 0.95); y = rand(h * 0.12, h * 0.9); a = rand(0, TAU);
    }
    const kind = Math.random() < 0.6 ? "roach" : "ant";
    const size = kind === "roach" ? rand(0.85, 1.35) * (isSmall() ? 0.85 : 1) : rand(1.3, 1.8);
    scene.bugs.push(new Bug(kind, x, y, a, size));
  }

  function hit(px, py, power) {
    for (const b of scene.bugs) {
      if (b.dead) continue;
      const dist = Math.hypot(b.x - px, b.y - py);
      if (dist < 70) b.hp -= power * (1 - dist / 90);
      if (b.hp <= 0) {
        b.dead = 0.001;
        emitPuff(scene, b.x, b.y);
        kills++;
        killEl.textContent = String(kills).padStart(2, "0");
        killEl.classList.remove("bump"); void killEl.offsetWidth; killEl.classList.add("bump");
        if (kills === 1) hint.textContent = "Isso! Continue…";
        if (kills === 5) hint.textContent = "Ambiente quase limpo 💪";
        if (kills === 10) hint.textContent = "Profissional! Peça seu orçamento ↗";
      }
    }
  }

  function toLocal(e) {
    const r = scene.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  hero.addEventListener("pointermove", (e) => {
    const p = toLocal(e);
    const moved = Math.hypot(p.x - local.x, p.y - local.y);
    local.x = p.x; local.y = p.y; local.active = performance.now();
    if (e.target.closest("a, button")) return;
    emitMist(scene, p.x, p.y, Math.min(8, 1 + Math.floor(moved / 6)), local.down ? 1.4 : 1);
  });
  hero.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    const p = toLocal(e);
    local.x = p.x; local.y = p.y; local.down = true; local.active = performance.now();
    emitMist(scene, p.x, p.y, 26, 1.8);
    hit(p.x, p.y, e.pointerType === "touch" ? 1.2 : 0.5);
  });
  window.addEventListener("pointerup", () => (local.down = false));
  hero.addEventListener("pointerleave", () => { local.x = local.y = -999; });

  for (let i = 0; i < target(); i++) spawn(false);

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const { ctx, w, h } = scene;
    ctx.clearRect(0, 0, w, h);
    const spraying = now - local.active < 140 || local.down;
    if (spraying) hit(local.x, local.y, dt * (local.down ? 3.2 : 1.9));
    if (local.down) emitMist(scene, local.x, local.y, 3, 1.6);

    for (const b of scene.bugs) {
      if (!b.dead) {
        // foge do spray e evita sair da tela
        const dx = b.x - local.x, dy = b.y - local.y, d = Math.hypot(dx, dy);
        if (d < 180) { b.steerTo(b.x + dx, b.y + dy, 0.06); b.speedBoost = 1.5; } else b.speedBoost = 1;
        const m = 40;
        if (b.x < m || b.x > w - m || b.y < m || b.y > h - m) b.steerTo(w / 2, h / 2, 0.05);
        const sp = b.speed; b.speed = sp * b.speedBoost; b.update(dt); b.speed = sp;
      } else b.update(dt);
      b.draw(ctx, now / 1000);
    }
    scene.bugs = scene.bugs.filter((b) => b.dead < 1.2);
    const alive = scene.bugs.filter((b) => !b.dead).length;
    if (alive < target() && now > respawnAt) { spawn(true); respawnAt = now + rand(900, 1800); }
    drawParts(scene, dt);
    if (running) requestAnimationFrame(frame);
  }

  new IntersectionObserver(([en]) => {
    const was = running;
    running = en.isIntersecting && !reduceMotion;
    if (running && !was) { last = performance.now(); requestAnimationFrame(frame); }
  }).observe(hero);
  window.addEventListener("resize", () => scene.resize());
  if (reduceMotion) { running = false; frame(performance.now()); } else requestAnimationFrame(frame);
  return scene;
})();

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
const themeColors = { light: "#f2f5fa", dark: "#0b1a33", black: "#070d1a", accent: "#2e9bff" };
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
   Formigas x barreira
   ========================================================= */
let wallProgress = motion ? 0 : 1;
(function ants() {
  const stage = $("#antStage");
  const scene = makeScene($("#ants"));
  const wall = $("#wall");
  const count = () => (isSmall() ? 9 : 16);
  let running = false, last = performance.now();

  function spawn(initial) {
    const { w, h } = scene;
    const b = new Bug("ant", initial ? rand(-w * 0.1, w * 0.55) : rand(-80, -20), rand(h * 0.12, h * 0.88), rand(-0.2, 0.2), rand(1.2, 1.6));
    b.lane = b.y;
    b.back = false;
    scene.bugs.push(b);
  }
  for (let i = 0; i < count(); i++) spawn(true);

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const { ctx, w, h } = scene;
    ctx.clearRect(0, 0, w, h);
    const wx = w * 0.64;
    const covered = h * (1 - wallProgress); // a barreira cresce de baixo para cima
    wall.style.transform = `scaleY(${wallProgress})`;
    wall.classList.toggle("is-full", wallProgress >= 0.99);

    for (const b of scene.bugs) {
      const blocked = b.y > covered - 6;
      if (!b.back && blocked && b.x > wx - 34 && b.x < wx - 4) {
        b.back = true; b.speed *= 1.25;
      }
      const goal = b.back ? Math.PI : 0;
      let d = goal - b.a; d = Math.atan2(Math.sin(d), Math.cos(d));
      b.a += d * Math.min(dt * (b.back ? 5 : 1.5), 1);
      b.a += Math.sin(now / 400 + b.lane) * 0.01;
      // mantém a formiga perto da sua "faixa"
      b.y += (b.lane - b.y) * dt * 0.6;
      b.update(dt);
      b.turn = 0;
      b.draw(ctx, now / 1000);
    }
    scene.bugs = scene.bugs.filter((b) => b.x > -120 && b.x < w + 60);
    while (scene.bugs.length < count()) spawn(false);
    if (running) requestAnimationFrame(frame);
  }
  new IntersectionObserver(([en]) => {
    const was = running;
    running = en.isIntersecting;
    if (running && !was) { last = performance.now(); requestAnimationFrame(frame); }
  }).observe(stage);
  window.addEventListener("resize", () => scene.resize());
})();

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
function setScan(drawP, beamP) {
  housePaths.forEach((p, i) => {
    const local = clamp(drawP * 1.6 - (i / housePaths.length) * 0.6, 0, 1);
    p.style.strokeDashoffset = String(1 - local);
  });
  const x = beamP * 1000;
  beam.setAttribute("x1", x); beam.setAttribute("x2", x);
  beam.style.opacity = beamP > 0 && beamP < 1 ? 1 : 0;
  spots.forEach((s) => s.classList.toggle("is-on", beamP >= +s.dataset.at));
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
    .add(() => $(".scribble--hero").classList.add("is-in"), 0.9);

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
      const offset = (el, axis) => {
        const g = grid.getBoundingClientRect(), r = el.getBoundingClientRect();
        return axis === "x" ? (g.left + g.width / 2) - (r.left + r.width / 2) : (g.top + g.height / 2) - (r.top + r.height / 2);
      };
      gsap.from(papers, {
        x: (i, el) => offset(el, "x"), y: (i, el) => offset(el, "y"),
        rotate: (i) => (i - 2.5) * 7, scale: 0.85, ease: "power2.out",
        scrollTrigger: { trigger: grid, start: "top 80%", end: "center 55%", scrub: 0.8, invalidateOnRefresh: true },
      });
      gsap.from($$(".doc h3, .doc p", grid), { opacity: 0, y: 16, stagger: 0.03, scrollTrigger: { trigger: grid, start: "center 70%", end: "center 50%", scrub: true } });
    },
    "(max-width: 900px)": () => {
      $$(".doc").forEach((d) => gsap.from(d, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: d, start: "top 88%" } }));
    },
  });

  // Barreira das formigas
  gsap.to({ v: 0 }, {
    v: 1, ease: "none",
    scrollTrigger: { trigger: ".barrier__stage", start: "top 85%", end: "center 45%", scrub: 0.5 },
    onUpdate() { wallProgress = this.targets()[0].v; },
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
