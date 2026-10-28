/* =========================================================
   AmazonControl — formulário de orçamento em etapas (estilo quiz)
   ========================================================= */

const CFG = window.AC_CONFIG;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STORE_KEY = "ac_quiz_b2b_v1";

const first = (name = "") => name.trim().split(/\s+/)[0] || "";
const digits = (v = "") => v.replace(/\D/g, "");
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LETTERS = "ABCDEFGHIJ";

/* ---------- Etapas ---------- */
const STEPS = [
  { id: "intro", type: "intro" },
  {
    id: "nome", type: "text", label: "Nome",
    title: "Primeiro, qual é o seu nome?",
    sub: "Assim personalizamos o atendimento.",
    placeholder: "Seu nome", autocomplete: "name",
    validate: (v) => v.trim().length >= 2 || "Digite seu nome para continuar.",
  },
  {
    id: "contato", type: "contact", label: "WhatsApp",
    title: (d) => `Prazer, ${esc(first(d.nome))}! Qual é o seu WhatsApp?`,
    sub: "É por lá que vamos enviar a sua proposta.",
  },
  {
    id: "empresa", type: "text", label: "Empresa",
    title: "Qual é o nome da empresa?",
    sub: "Se tiver mais de uma unidade, informe a principal.",
    placeholder: "Nome da empresa", autocomplete: "organization",
    validate: (v) => v.trim().length >= 2 || "Informe o nome da empresa.",
  },
  {
    id: "segmento", type: "single", label: "Segmento",
    title: (d) => (d.empresa ? `${esc(d.empresa)} atua em qual segmento?` : "Em qual segmento a empresa atua?"),
    options: [["🏭", "Indústria alimentícia"], ["🍽️", "Restaurante / Cozinha industrial"], ["🛒", "Supermercado / Varejo"], ["🏥", "Hospital / Clínica"], ["🚚", "Logística / Armazém"], ["🏢", "Condomínio / Shopping"], ["🏨", "Hotel / Escola / Escritório"], ["💼", "Outro segmento"]],
  },
  {
    id: "servicos", type: "multi", label: "Pragas / serviços",
    title: "O que precisa ser controlado?",
    sub: "Pode marcar mais de uma opção.",
    options: [["🪳", "Baratas"], ["🐀", "Ratos e camundongos"], ["🐜", "Formigas"], ["🪰", "Moscas"], ["🪵", "Cupins"], ["🦂", "Escorpiões"], ["🦠", "Sanitização / desinfecção"], ["🛡️", "Prevenção geral (MIP)"], ["🤔", "Não sei identificar"]],
  },
  {
    id: "modalidade", type: "single", label: "Modalidade",
    title: "Que tipo de atendimento você procura?",
    options: [["📋", "Contrato contínuo (MIP)", "Visitas periódicas + relatórios"], ["🔧", "Serviço pontual", "Uma aplicação específica"], ["🚨", "Emergência", "Infestação ou fiscalização próxima"], ["🤔", "Ainda estou avaliando"]],
  },
  {
    id: "area", type: "single", label: "Área",
    title: "Qual o tamanho da área a ser atendida?",
    options: [["📏", "Até 200 m²"], ["📐", "200 a 500 m²"], ["🏬", "500 a 1.000 m²"], ["🏭", "1.000 a 5.000 m²"], ["🏗️", "Acima de 5.000 m²"], ["🗺️", "Várias unidades"]],
  },
  {
    id: "urgencia", type: "single", label: "Urgência",
    title: "Para quando você precisa?",
    options: [["⚡", "Imediato / emergência"], ["📅", "Nesta semana"], ["🗓️", "Neste mês"], ["🔎", "Planejando para os próximos meses"]],
  },
  {
    id: "periodo", type: "single", label: "Horário do serviço",
    title: "Qual o melhor horário para o serviço?",
    sub: "Planejamos para não atrapalhar a operação.",
    options: [["🕘", "Durante o expediente"], ["🌙", "Fora do expediente"], ["📆", "Fins de semana"], ["👍", "A combinar"]],
  },
  { id: "endereco", type: "address", label: "Endereço", title: "Onde fica a unidade?", sub: "Digite o CEP que a gente completa o resto." },
  {
    id: "documentos", type: "multi", label: "Documentação",
    title: "Quais documentos a empresa precisa?",
    sub: "Pode marcar mais de uma opção.",
    options: [["📄", "Certificado de execução"], ["🔬", "Laudo técnico"], ["🗺️", "Mapa de iscagem"], ["📊", "Relatórios de monitoramento"], ["🏛️", "Para vigilância sanitária"], ["✅", "Para auditoria / certificação"], ["🤷", "Ainda não sei"]],
  },
  {
    id: "origem", type: "single", label: "Como nos conheceu",
    title: "Como você conheceu a AmazonControl?",
    options: [["🔍", "Google"], ["📸", "Instagram"], ["💼", "LinkedIn"], ["🤝", "Indicação"], ["⭐", "Já sou cliente"], ["💬", "Outro"]],
  },
  { id: "review", type: "review", label: "Revisão final", title: (d) => `Quase lá, ${esc(first(d.nome))}! Confira e envie` },
  { id: "success", type: "success" },
];
const QUESTION_STEPS = STEPS.filter((s) => !["intro", "success"].includes(s.type));

/* ---------- Estado ---------- */
let data = { servicos: [], documentos: [] };
let current = 0;
let history = [];
let returnToReview = false;
let waUrl = "";

try {
  const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
  if (saved && saved.data) data = { ...data, ...saved.data };
} catch (_) { /* storage indisponível */ }

if (!data.lead_id) {
  data.lead_id = `AC-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  data.started_at = new Date().toLocaleString("pt-BR");
  data.seq = 0;
}

const params = new URLSearchParams(location.search);
const SEGMENT_SLUGS = {
  industria: "Indústria alimentícia", restaurante: "Restaurante / Cozinha industrial", varejo: "Supermercado / Varejo",
  saude: "Hospital / Clínica", logistica: "Logística / Armazém", condominio: "Condomínio / Shopping", servicos: "Hotel / Escola / Escritório",
};
if (SEGMENT_SLUGS[params.get("segmento")]) data.segmento = SEGMENT_SLUGS[params.get("segmento")];
["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach((k) => {
  if (params.get(k)) data[k] = params.get(k);
});

function persist() {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ data })); } catch (_) {}
}

/* ---------- DOM ---------- */
const stage = document.getElementById("stage");
const form = document.getElementById("quiz");
const backBtn = document.getElementById("backBtn");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const titleOf = (step) => (typeof step.title === "function" ? step.title(data) : step.title);

/* ---------- Renderização de cada tipo ---------- */
function optionHTML(step, [emoji, label, hint], i) {
  const multi = step.type === "multi";
  const checked = multi ? data[step.id]?.includes(label) : data[step.id] === label;
  return `
    <label class="opt${hint ? " opt--hint" : ""}" style="--i:${i + 3}">
      <input type="${multi ? "checkbox" : "radio"}" name="${step.id}" value="${esc(label)}" ${checked ? "checked" : ""}>
      <span class="opt__key">${LETTERS[i]}</span>
      <span class="opt__emoji">${emoji}</span>
      <span class="opt__text"><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span>
      <span class="opt__check"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>
    </label>`;
}

function field({ name, label, type = "text", value = "", attrs = "", cls = "" }) {
  return `
    <label class="qfield ${cls}">
      <input type="${type}" name="${name}" id="f_${name}" value="${esc(value)}" placeholder=" " ${attrs}>
      <span>${label}</span>
      <em class="qfield__err" data-err="${name}"></em>
    </label>`;
}

function okButton(text = "Continuar", hint = true) {
  return `
    <div class="qactions" style="--i:8">
      <button type="submit" class="btn btn--green btn--lg qok">${text}
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
      ${hint ? `<span class="qhint">ou pressione <kbd>Enter ↵</kbd></span>` : ""}
    </div>`;
}

function stepNumber(step) {
  const n = QUESTION_STEPS.indexOf(step) + 1;
  return n > 0 ? `<span class="qnum" style="--i:0">${n} <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>` : "";
}

function render(step) {
  const head = `
    ${stepNumber(step)}
    <h1 class="qtitle" style="--i:1">${titleOf(step)}</h1>
    ${step.sub ? `<p class="qsub" style="--i:2">${step.sub}</p>` : ""}`;

  switch (step.type) {
    case "intro":
      return `
        <div class="qintro">
          <div class="qintro__badge" style="--i:0"><svg viewBox="0 0 64 64"><use href="#icon-shield"/></svg></div>
          <h1 class="qtitle qtitle--xl" style="--i:1">Sua operação protegida começa <span>aqui.</span></h1>
          <p class="qsub" style="--i:2">Responda algumas perguntas sobre a sua empresa e receba uma proposta técnica de controle de pragas direto no WhatsApp.</p>
          <ul class="qintro__perks" style="--i:3">
            <li>⏱ Cerca de 2 minutos</li><li>📄 Proposta técnica</li><li>✅ Sem compromisso</li>
          </ul>
          <div class="qactions" style="--i:4">
            <button type="submit" class="btn btn--green btn--lg qok">Solicitar proposta
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <span class="qhint">ou pressione <kbd>Enter ↵</kbd></span>
          </div>
        </div>`;

    case "text":
      return `${head}
        <div class="qbody" style="--i:3">
          ${field({ name: step.id, label: step.placeholder, value: data[step.id] || "", attrs: `autocomplete="${step.autocomplete}" required`, cls: "qfield--big" })}
        </div>
        ${okButton()}`;

    case "single":
    case "multi":
      return `${head}
        <div class="opts${step.options.length > 6 ? " opts--grid" : ""}" role="${step.type === "single" ? "radiogroup" : "group"}">
          ${step.options.map((o, i) => optionHTML(step, o, i)).join("")}
        </div>
        <em class="qfield__err qfield__err--block" data-err="${step.id}"></em>
        ${step.type === "multi" ? okButton("Continuar", false) : ""}`;

    case "address":
      return `${head}
        <div class="qbody qgrid" style="--i:3">
          <div class="qcep">
            ${field({ name: "cep", label: "CEP", value: data.cep || "", attrs: `inputmode="numeric" autocomplete="postal-code" maxlength="9"` })}
            <span class="qcep__spin" id="cepSpin" aria-hidden="true"></span>
            <a class="qcep__help" href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener">Não sei meu CEP</a>
          </div>
          ${field({ name: "endereco", label: "Rua / Avenida", value: data.endereco || "", attrs: `autocomplete="address-line1" required`, cls: "span-2" })}
          ${field({ name: "numero", label: "Número", value: data.numero || "", attrs: `required` })}
          ${field({ name: "complemento", label: "Complemento (opcional)", value: data.complemento || "", attrs: `autocomplete="address-line2"` })}
          ${field({ name: "bairro", label: "Bairro", value: data.bairro || "", attrs: `required` })}
          ${field({ name: "cidade", label: "Cidade", value: data.cidade || "", attrs: `autocomplete="address-level2" required` })}
          ${field({ name: "uf", label: "UF", value: data.uf || "", attrs: `autocomplete="address-level1" maxlength="2"` })}
        </div>
        ${okButton()}`;

    case "contact":
      return `${head}
        <div class="qbody qgrid qgrid--1" style="--i:3">
          ${field({ name: "whatsapp", label: "WhatsApp com DDD", type: "tel", value: data.whatsapp || "", attrs: `inputmode="tel" autocomplete="tel-national" required maxlength="16"`, cls: "qfield--big" })}
          <p class="qnote">🔒 Usamos seu número só para enviar a proposta. Nada de spam.</p>
        </div>
        ${okButton()}`;

    case "review":
      return `${head}
        <div class="qreview" style="--i:3">
          ${reviewRows().map(([label, value, idx]) => `
            <button type="button" class="qreview__row" data-goto="${idx}">
              <span>${label}</span><b>${esc(value) || "—"}</b><i>Editar</i>
            </button>`).join("")}
        </div>
        <div class="qbody" style="--i:4">
          ${field({ name: "email", label: "E-mail (opcional)", type: "email", value: data.email || "", attrs: `autocomplete="email"` })}
          <label class="qfield">
            <textarea name="observacoes" id="f_observacoes" rows="3" placeholder=" ">${esc(data.observacoes || "")}</textarea>
            <span>Algo mais que devemos saber? (opcional)</span>
          </label>
          <label class="qconsent">
            <input type="checkbox" name="consentimento" ${data.consentimento ? "checked" : ""}>
            <span class="qconsent__box"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>
            <span>Autorizo a AmazonControl a usar meus dados para elaborar a proposta e entrar em contato pelo WhatsApp.</span>
          </label>
          <em class="qfield__err qfield__err--block" data-err="consentimento"></em>
        </div>
        <div class="qactions" style="--i:5">
          <button type="submit" class="btn btn--green btn--lg qok qsend">
            <svg viewBox="0 0 24 24" class="wa"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.1L2 22l5-1.3A11 11 0 0 0 20.5 3.5Z"/></svg>
            Enviar e falar no WhatsApp
          </button>
        </div>`;

    case "success":
      return `
        <div class="qdone">
          <div class="qdone__check" style="--i:0">
            <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg>
          </div>
          <h1 class="qtitle qtitle--xl" style="--i:1">Obrigado, <span>${esc(first(data.nome))}!</span></h1>
          <p class="qsub" style="--i:2">Recebemos seu pedido. Abrimos o WhatsApp com tudo preenchido — é só tocar em <b>enviar</b> por lá. Se ele não abriu, use o botão abaixo.</p>
          <div class="qactions qactions--center" style="--i:3">
            <a href="${esc(waUrl)}" target="_blank" rel="noopener" class="btn btn--green btn--lg">
              <svg viewBox="0 0 24 24" class="wa"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.1L2 22l5-1.3A11 11 0 0 0 20.5 3.5Z"/></svg>
              Abrir WhatsApp
            </a>
            <a href="index.html" class="btn btn--ghost btn--lg">Voltar ao site</a>
          </div>
        </div>
        <div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="--x:${Math.random() * 100}%;--d:${(Math.random() * 0.8).toFixed(2)}s;--r:${Math.floor(Math.random() * 360)}deg;--c:${i % 3}"></i>`).join("")}</div>`;
  }
}

function addressText(d = data) {
  const line = [d.endereco, d.numero && `nº ${d.numero}`, d.complemento].filter(Boolean).join(", ");
  const city = [d.bairro, [d.cidade, d.uf].filter(Boolean).join("/")].filter(Boolean).join(" - ");
  return [line, city, d.cep && `CEP ${d.cep}`].filter(Boolean).join(" · ");
}

function reviewRows() {
  const idx = (id) => STEPS.findIndex((s) => s.id === id);
  return [
    ["Nome", data.nome, idx("nome")],
    ["WhatsApp", data.whatsapp, idx("contato")],
    ["Empresa", data.empresa, idx("empresa")],
    ["Segmento", data.segmento, idx("segmento")],
    ["Pragas / serviços", (data.servicos || []).join(", "), idx("servicos")],
    ["Modalidade", data.modalidade, idx("modalidade")],
    ["Área", data.area, idx("area")],
    ["Urgência", data.urgencia, idx("urgencia")],
    ["Horário", data.periodo, idx("periodo")],
    ["Endereço", addressText(), idx("endereco")],
    ["Documentação", (data.documentos || []).join(", "), idx("documentos")],
    ["Conheceu por", data.origem, idx("origem")],
  ];
}

/* ---------- Navegação ---------- */
function updateChrome() {
  const step = STEPS[current];
  const n = QUESTION_STEPS.indexOf(step);
  const pct = step.type === "success" ? 100 : step.type === "intro" ? 0 : (n / QUESTION_STEPS.length) * 100;
  progressBar.style.width = `${pct}%`;
  progressText.textContent = n >= 0 ? `${n + 1} de ${QUESTION_STEPS.length}` : "";
  backBtn.classList.toggle("is-hidden", history.length === 0 || step.type === "success");
  document.body.dataset.step = step.type;
}

let busy = false;
function go(index, dir = 1) {
  if (busy) return;
  busy = true;
  const old = stage.firstElementChild;
  const next = document.createElement("div");
  next.className = `qstep qstep--${STEPS[index].type}`;
  next.innerHTML = render(STEPS[index]);
  current = index;
  updateChrome();

  const swap = () => {
    if (old) old.remove();
    stage.appendChild(next);
    bindStep(next, STEPS[index]);
    if (!reduceMotion) {
      next.animate(
        [{ opacity: 0, transform: `translateY(${dir * 40}px)` }, { opacity: 1, transform: "none" }],
        { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" }
      );
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    busy = false;
  };

  if (old && !reduceMotion) {
    old.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(${dir * -40}px)` }],
      { duration: 260, easing: "ease-in", fill: "forwards" }
    );
    setTimeout(swap, 260);
  } else swap();
}

function next() {
  if (busy) return;
  history.push(current);
  if (returnToReview) {
    returnToReview = false;
    go(STEPS.findIndex((s) => s.id === "review"), 1);
  } else {
    go(current + 1, 1);
  }
  trackProgress();
}

function back() {
  if (busy || !history.length) return;
  returnToReview = false;
  go(history.pop(), -1);
}
backBtn.addEventListener("click", back);

/* ---------- Comportamento por etapa ---------- */
function setError(name, msg) {
  const el = stage.querySelector(`[data-err="${name}"]`);
  if (el) el.textContent = msg || "";
  const input = stage.querySelector(`[name="${name}"]`);
  if (input) input.closest(".qfield")?.classList.toggle("has-error", !!msg);
  return !msg;
}

function shake() {
  const el = stage.firstElementChild;
  if (!el || reduceMotion) return;
  el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(0)" }], { duration: 380 });
}

function maskPhone(v) {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

async function lookupCep(cep) {
  const spin = document.getElementById("cepSpin");
  spin?.classList.add("is-on");
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const json = await res.json();
    if (json.erro) return setError("cep", "CEP não encontrado. Preencha o endereço abaixo.");
    setError("cep", "");
    const map = { endereco: json.logradouro, bairro: json.bairro, cidade: json.localidade, uf: json.uf };
    Object.entries(map).forEach(([k, v]) => {
      const input = stage.querySelector(`[name="${k}"]`);
      if (input && v) { input.value = v; data[k] = v; input.closest(".qfield")?.classList.add("is-filled"); setError(k, ""); }
    });
    persist();
    stage.querySelector(`[name="${json.logradouro ? "numero" : "endereco"}"]`)?.focus();
  } catch (_) {
    setError("cep", "Não foi possível buscar o CEP. Preencha manualmente.");
  } finally {
    spin?.classList.remove("is-on");
  }
}

function bindStep(el, step) {
  // foco automático no primeiro campo
  const firstInput = el.querySelector("input:not([type=radio]):not([type=checkbox]), textarea");
  if (firstInput && window.matchMedia("(hover: hover)").matches) setTimeout(() => firstInput.focus({ preventScroll: true }), reduceMotion ? 0 : 450);

  if (step.type === "single") {
    el.querySelectorAll("input[type=radio]").forEach((r) => r.addEventListener("change", () => {
      data[step.id] = r.value;
      persist();
      r.closest(".opt").classList.add("is-picked");
      setTimeout(next, reduceMotion ? 0 : 380);
    }));
    // clicar de novo numa opção já marcada também avança
    el.querySelectorAll(".opt").forEach((o) => o.addEventListener("click", (e) => {
      const r = o.querySelector("input");
      if (r.checked && data[step.id] === r.value && e.detail > 0) { e.preventDefault(); setTimeout(next, 120); }
    }));
  }

  if (step.type === "multi") {
    el.querySelectorAll("input[type=checkbox]").forEach((c) => c.addEventListener("change", () => {
      data[step.id] = [...el.querySelectorAll("input:checked")].map((i) => i.value);
      setError(step.id, "");
      persist();
    }));
  }

  if (step.type === "address") {
    const cep = el.querySelector("[name=cep]");
    cep.addEventListener("input", () => {
      const d = digits(cep.value).slice(0, 8);
      cep.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
      data.cep = cep.value;
      if (d.length === 8) lookupCep(d);
    });
  }

  if (step.type === "contact") {
    const phone = el.querySelector("[name=whatsapp]");
    phone.addEventListener("input", () => { phone.value = maskPhone(phone.value); });
  }

  if (step.type === "review") {
    el.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => {
      collect(el);
      history.push(current);
      returnToReview = true;
      go(+b.dataset.goto, -1);
    }));
  }

  // salva qualquer campo enquanto digita
  el.querySelectorAll(".qfield input, .qfield textarea").forEach((i) => i.addEventListener("input", () => {
    if (i.name !== "cep") data[i.name] = i.value;
    i.closest(".qfield").classList.toggle("is-filled", !!i.value);
    setError(i.name, "");
    persist();
  }));
}

function collect(el) {
  el.querySelectorAll(".qfield input, .qfield textarea").forEach((i) => { data[i.name] = i.value.trim(); });
  const consent = el.querySelector("[name=consentimento]");
  if (consent) data.consentimento = consent.checked;
  persist();
}

function validate(step, el) {
  collect(el);
  switch (step.type) {
    case "text": {
      const r = step.validate(data[step.id] || "");
      return setError(step.id, r === true ? "" : r);
    }
    case "single":
      return setError(step.id, data[step.id] ? "" : "Escolha uma opção.");
    case "multi":
      return setError(step.id, data[step.id]?.length ? "" : "Marque pelo menos uma opção.");
    case "address": {
      let ok = true;
      [["endereco", "Informe a rua."], ["numero", "Informe o número (ou s/n)."], ["bairro", "Informe o bairro."], ["cidade", "Informe a cidade."]]
        .forEach(([k, msg]) => { ok = setError(k, data[k] ? "" : msg) && ok; });
      if (data.cep && digits(data.cep).length !== 8) ok = setError("cep", "CEP incompleto.") && false;
      return ok;
    }
    case "contact": {
      const phone = digits(data.whatsapp);
      return setError("whatsapp", phone.length >= 10 && phone.length <= 11 ? "" : "Digite um WhatsApp válido com DDD.");
    }
    case "review": {
      let ok = setError("consentimento", data.consentimento ? "" : "Marque a autorização para enviarmos sua proposta.");
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) ok = setError("email", "E-mail inválido.") && false;
      return ok;
    }
    default:
      return true;
  }
}

/* ---------- Envio ---------- */
function buildMessage() {
  const lines = [
    "*Nova solicitação de proposta — AmazonControl*",
    "",
    `👤 *Nome:* ${data.nome}`,
    `🏢 *Empresa:* ${data.empresa}`,
    `🏷️ *Segmento:* ${data.segmento}`,
    `📱 *WhatsApp:* ${data.whatsapp}`,
    data.email ? `✉️ *E-mail:* ${data.email}` : null,
    `🐜 *Pragas / serviços:* ${(data.servicos || []).join(", ")}`,
    `📋 *Modalidade:* ${data.modalidade}`,
    `📐 *Área:* ${data.area}`,
    `⏰ *Urgência:* ${data.urgencia}`,
    `🕐 *Horário do serviço:* ${data.periodo}`,
    `📍 *Endereço:* ${addressText()}`,
    `📄 *Documentação:* ${(data.documentos || []).join(", ")}`,
    data.observacoes ? `📝 *Observações:* ${data.observacoes}` : null,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

function buildPayload(completo = false) {
  const step = STEPS[current];
  const answered = completo ? QUESTION_STEPS.length : Math.max(QUESTION_STEPS.indexOf(step), 0);
  const phone = digits(data.whatsapp);
  data.seq = (data.seq || 0) + 1;
  persist();
  return {
    id: data.lead_id,
    seq: data.seq,
    data_hora: data.started_at,
    ultima_atualizacao: new Date().toLocaleString("pt-BR"),
    form_status: completo ? "Completo" : "Incompleto",
    etapa_atual: completo ? "Concluído" : step.label,
    progresso: `${Math.round((answered / QUESTION_STEPS.length) * 100)}% (${answered} de ${QUESTION_STEPS.length})`,
    link_whatsapp: phone ? `https://wa.me/55${phone}` : "",
    nome: data.nome,
    whatsapp: data.whatsapp,
    email: data.email || "",
    empresa: data.empresa || "",
    segmento: data.segmento || "",
    modalidade: data.modalidade || "",
    documentos: (data.documentos || []).join(", "),
    servicos: (data.servicos || []).join(", "),
    area: data.area || "",
    urgencia: data.urgencia || "",
    periodo: data.periodo || "",
    cep: data.cep || "",
    endereco: data.endereco || "",
    numero: data.numero || "",
    complemento: data.complemento || "",
    bairro: data.bairro || "",
    cidade: data.cidade || "",
    uf: data.uf || "",
    origem: data.origem || "",
    observacoes: data.observacoes || "",
    consentimento: data.consentimento ? "Sim" : "Não",
    utm_source: data.utm_source || "",
    utm_medium: data.utm_medium || "",
    utm_campaign: data.utm_campaign || "",
    utm_content: data.utm_content || "",
    utm_term: data.utm_term || "",
    fbclid: data.fbclid || "",
    gclid: data.gclid || "",
    pagina: location.href.split("?")[0],
    dispositivo: navigator.userAgent,
  };
}

function sendToSheets(payload) {
  if (!CFG.sheetsEndpoint) {
    console.warn("[AmazonControl] sheetsEndpoint vazio em config.js — lead não foi salvo na planilha.", payload);
    return;
  }
  // text/plain evita o preflight de CORS; o Apps Script lê o corpo como JSON.
  fetch(CFG.sheetsEndpoint, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).catch((err) => console.error("[AmazonControl] Falha ao salvar na planilha:", err));
}

// A partir do momento em que temos o WhatsApp, cada avanço atualiza a linha do lead na planilha.
function trackProgress() {
  const phone = digits(data.whatsapp);
  if (phone.length < 10 || STEPS[current].type === "success") return;
  sendToSheets(buildPayload(false));
}

function submitLead(btn) {
  btn.disabled = true;
  btn.classList.add("is-loading");
  sendToSheets(buildPayload(true));
  waUrl = window.waLink(buildMessage());
  // abre o WhatsApp ainda dentro do clique para não ser bloqueado como pop-up
  window.open(waUrl, "_blank", "noopener");
  try { sessionStorage.removeItem(STORE_KEY); } catch (_) {}
  history = [];
  go(STEPS.length - 1, 1);
}

/* ---------- Submit / teclado ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (document.getElementById("hp").value) return; // bot
  const step = STEPS[current];
  const el = stage.firstElementChild;
  if (step.type === "intro") return next();
  if (!validate(step, el)) return shake();
  if (step.type === "review") return submitLead(el.querySelector(".qsend"));
  next();
});

document.addEventListener("keydown", (e) => {
  const step = STEPS[current];
  if (e.target.matches?.("input[type=text], input[type=tel], input[type=email], textarea")) return;
  if (["single", "multi"].includes(step.type) && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const i = LETTERS.indexOf(e.key.toUpperCase());
    const inputs = stage.querySelectorAll(".opt input");
    if (i >= 0 && inputs[i]) {
      e.preventDefault();
      if (step.type === "single" && inputs[i].checked) return next();
      inputs[i].click();
    }
  }
});

/* ---------- Início ---------- */
go(0);
