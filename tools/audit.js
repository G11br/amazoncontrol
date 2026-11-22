// Auditoria de responsividade: rode no console da página (ou via automação).
// Lista elementos que vazam a largura, textos que estouram a caixa, alvos de toque pequenos e fontes minúsculas.
window.__audit = () => {
  const vw = document.documentElement.clientWidth;
  const skip = (el) => el.closest(".mq, .hero__mark, .menu, .loader, .cursor") || (el.closest("svg") && el.tagName !== "svg");
  const isFixed = (el) => { for (let e = el; e; e = e.parentElement) if (getComputedStyle(e).position === "fixed") return true; return false; };
  const all = [...document.querySelectorAll("body *")].filter((el) => !skip(el) && el.offsetParent !== null);
  const name = (el) => `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(" ")[0]} "${(el.textContent || "").trim().slice(0, 24)}"`;
  const overflow = all.filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1) && !isFixed(el); }).map(name);
  const textClip = all.filter((el) => ["H1", "H2", "H3", "P", "SPAN", "A", "B", "STRONG", "SUMMARY", "BUTTON"].includes(el.tagName) && el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== "visible").map(name);
  const smallTap = [...document.querySelectorAll("a, button, summary, label")].filter((el) => !skip(el) && el.offsetParent !== null).filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.height && (r.height < 36 || r.width < 36) && getComputedStyle(el).display !== "inline"; }).map((el) => name(el) + ` ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
  const tiny = [...new Set(all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 11).map(name))];
  return { vw, vh: innerHeight, scrollW: document.documentElement.scrollWidth, overflow: overflow.slice(0, 10), textClip: textClip.slice(0, 10), smallTap: smallTap.slice(0, 10), tiny: tiny.slice(0, 10) };
};
