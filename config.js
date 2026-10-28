/* =========================================================
   AmazonControl — configurações compartilhadas
   Edite apenas este arquivo para ligar WhatsApp e Google Planilhas.
   ========================================================= */

window.AC_CONFIG = {
  // WhatsApp que recebe os leads: DDI + DDD + número, só dígitos (ex.: "5511999999999").
  // Enquanto estiver vazio, os botões de WhatsApp abrem o Linktree.
  whatsappNumber: "",

  // URL do App da Web do Google Apps Script (termina em /exec).
  // Veja o passo a passo no arquivo google-apps-script.gs.
  sheetsEndpoint: "https://script.google.com/macros/s/AKfycbzyxMFbQz914B9bY71iZ7C9oloj_uUP-uyAMwDdFRQTTdoESMp035SrhM6ECon1AFNtVg/exec",

  fallbackLink: "https://linktr.ee/amazoncontrolbrasil",
};

window.waLink = function (text) {
  const { whatsappNumber, fallbackLink } = window.AC_CONFIG;
  if (!whatsappNumber) return fallbackLink;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
};
