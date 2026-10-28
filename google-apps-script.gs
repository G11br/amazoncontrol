/**
 * AmazonControl — recebe os leads do formulário (orcamento.html) e salva no Google Planilhas.
 *
 * Cada lead ocupa UMA linha, criada assim que a pessoa informa o WhatsApp (2ª pergunta)
 * e atualizada a cada etapa. As colunas "Formulário", "Onde parou" e "Progresso" mostram
 * se a pessoa terminou e em que pergunta ela parou. A aba "Funil" resume tudo.
 *
 * COMO CONFIGURAR / ATUALIZAR:
 *  1. Na planilha, abra  Extensões > Apps Script.
 *  2. Apague o código que aparece e cole TODO este arquivo. Clique em Salvar.
 *  3. Primeira vez:  Implantar > Nova implantação > App da Web
 *       - Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 *     Atualizando (mantém a mesma URL):
 *       Implantar > Gerenciar implantações > ✏️ editar > Versão: "Nova versão" > Implantar
 *  4. Cole a URL /exec em  sheetsEndpoint  no arquivo config.js do site (só na primeira vez).
 *
 * Opcional: preencha NOTIFY_EMAIL para receber um e-mail a cada orçamento concluído.
 */

const SHEET_NAME = "Leads";
const FUNNEL_SHEET = "Funil";
const NOTIFY_EMAIL = ""; // ex.: "contato@amazoncontrol.com.br"

// [chave enviada pelo site, título da coluna]
const COLUMNS = [
  ["id", "ID"],
  ["data_hora", "Data/hora"],
  ["ultima_atualizacao", "Última atualização"],
  ["status", "Status"],
  ["form_status", "Formulário"],
  ["etapa_atual", "Onde parou"],
  ["progresso", "Progresso"],
  ["nome", "Nome"],
  ["empresa", "Empresa"],
  ["segmento", "Segmento"],
  ["whatsapp", "WhatsApp"],
  ["link_whatsapp", "Link WhatsApp"],
  ["email", "E-mail"],
  ["servicos", "Serviços"],
  ["modalidade", "Modalidade"],
  ["area", "Área"],
  ["urgencia", "Urgência"],
  ["periodo", "Melhor período"],
  ["documentos", "Documentação"],
  ["cep", "CEP"],
  ["endereco", "Endereço"],
  ["numero", "Número"],
  ["complemento", "Complemento"],
  ["bairro", "Bairro"],
  ["cidade", "Cidade"],
  ["uf", "UF"],
  ["origem", "Como conheceu"],
  ["observacoes", "Observações"],
  ["consentimento", "Consentimento"],
  ["utm_source", "utm_source"],
  ["utm_medium", "utm_medium"],
  ["utm_campaign", "utm_campaign"],
  ["utm_content", "utm_content"],
  ["utm_term", "utm_term"],
  ["fbclid", "fbclid"],
  ["gclid", "gclid"],
  ["pagina", "Página"],
  ["dispositivo", "Dispositivo"],
  ["seq", "Seq"],
];

// Etapas do formulário depois do WhatsApp, na ordem (iguais aos "label" do orcamento.js)
const FUNNEL_STEPS = [
  "Empresa", "Segmento", "Pragas / serviços", "Modalidade", "Área", "Urgência",
  "Horário do serviço", "Endereço", "Documentação", "Como nos conheceu", "Revisão final", "Concluído",
];
const FUNNEL_VERSION = "b2b-1"; // mude para recriar a aba "Funil" com novas etapas

const STATUS_OPTIONS = ["Novo", "Em atendimento", "Orçamento enviado", "Fechado", "Perdido"];

// Colunas que o site atualiza. "Status" fica de fora para não apagar o que a equipe marcou.
const SITE_KEYS = COLUMNS.map(([k]) => k).filter((k) => k !== "status");

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!data.id || !data.whatsapp) return json_({ ok: false, error: "campos obrigatórios ausentes" });

    const sheet = getSheet_();
    const cols = headerMap_(sheet);
    const rowIndex = findRow_(sheet, cols.id, data.id);

    if (rowIndex) {
      // ignora atualizações que chegaram fora de ordem
      const currentSeq = Number(sheet.getRange(rowIndex, cols.seq).getValue()) || 0;
      if (Number(data.seq) <= currentSeq) return json_({ ok: true, id: data.id, skipped: true });
      SITE_KEYS.forEach((key) => {
        if (cols[key] && data[key] !== undefined) sheet.getRange(rowIndex, cols[key]).setValue(sanitize_(data[key]));
      });
    } else {
      data.status = "Novo";
      const row = new Array(sheet.getLastColumn()).fill("");
      COLUMNS.forEach(([key]) => { if (cols[key]) row[cols[key] - 1] = sanitize_(data[key]); });
      sheet.appendRow(row);
    }

    if (data.form_status === "Completo" && NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        `Novo orçamento: ${data.nome} — ${data.servicos || ""}`,
        COLUMNS.map(([key, title]) => `${title}: ${data[key] || ""}`).join("\n")
      );
    }
    return json_({ ok: true, id: data.id, updated: !!rowIndex });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, message: "Endpoint de leads AmazonControl ativo." });
}

/* ---------- Planilha ---------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(([, title]) => title));
  } else {
    // planilha antiga: acrescenta no fim as colunas que ainda não existem
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const missing = COLUMNS.filter(([, title]) => header.indexOf(title) === -1).map(([, title]) => title);
    if (missing.length) sheet.getRange(1, header.length + 1, 1, missing.length).setValues([missing]);
  }

  const lastCol = sheet.getLastColumn();
  sheet.getRange(1, 1, 1, lastCol).setFontWeight("bold").setBackground("#0b1f3a").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  const cols = headerMap_(sheet);
  const props = PropertiesService.getDocumentProperties();
  if (!props.getProperty("setup_v2")) {
    sheet.getRange(2, cols.status, sheet.getMaxRows() - 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STATUS_OPTIONS, true).build()
    );
    // cores: incompleto em laranja, completo em verde
    const formRange = sheet.getRange(2, cols.form_status, sheet.getMaxRows() - 1);
    sheet.setConditionalFormatRules(sheet.getConditionalFormatRules().concat([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Incompleto").setBackground("#fde8c8").setFontColor("#8a4b00").setRanges([formRange]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Completo").setBackground("#dcf2d0").setFontColor("#1f6b2a").setRanges([formRange]).build(),
    ]));
    props.setProperty("setup_v2", "1");
  }

  ensureFunnel_(ss, cols);
  return sheet;
}

function ensureFunnel_(ss, cols) {
  const props = PropertiesService.getDocumentProperties();
  const existing = ss.getSheetByName(FUNNEL_SHEET);
  if (existing && props.getProperty("funnel_version") === FUNNEL_VERSION) return;
  if (existing) ss.deleteSheet(existing); // etapas mudaram: recria o resumo
  props.setProperty("funnel_version", FUNNEL_VERSION);
  const f = ss.insertSheet(FUNNEL_SHEET);
  const stepCol = colLetter_(cols.etapa_atual);
  const formCol = colLetter_(cols.form_status);
  const L = `'${SHEET_NAME}'!`;

  f.getRange("A1:C1").setValues([["Onde o lead está agora", "Quantidade", "% do total"]])
    .setFontWeight("bold").setBackground("#0b1f3a").setFontColor("#ffffff");
  FUNNEL_STEPS.forEach((step, i) => {
    const r = i + 2;
    f.getRange(r, 1).setValue(step === "Concluído" ? "✅ Concluído (orçamento enviado)" : `Parou em: ${step}`);
    f.getRange(r, 2).setFormula(`=COUNTIF(${L}${stepCol}:${stepCol},"${step}")`);
    f.getRange(r, 3).setFormula(`=IFERROR(B${r}/B${FUNNEL_STEPS.length + 3},0)`).setNumberFormat("0%");
  });
  const totalRow = FUNNEL_STEPS.length + 3;
  f.getRange(totalRow, 1).setValue("Total de leads (com WhatsApp)").setFontWeight("bold");
  f.getRange(totalRow, 2).setFormula(`=COUNTA(${L}A2:A)`).setFontWeight("bold");
  f.getRange(totalRow + 1, 1).setValue("Incompletos (para recuperar)");
  f.getRange(totalRow + 1, 2).setFormula(`=COUNTIF(${L}${formCol}:${formCol},"Incompleto")`);
  f.getRange(totalRow + 2, 1).setValue("Taxa de conclusão");
  f.getRange(totalRow + 2, 2).setFormula(`=IFERROR(B${FUNNEL_STEPS.length + 1}/B${totalRow},0)`).setNumberFormat("0%");
  f.setColumnWidth(1, 300);
  f.setFrozenRows(1);
}

/* ---------- Utilitários ---------- */

function headerMap_(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  COLUMNS.forEach(([key, title]) => {
    const i = header.indexOf(title);
    if (i !== -1) map[key] = i + 1;
  });
  return map;
}

function findRow_(sheet, idCol, id) {
  if (sheet.getLastRow() < 2) return 0;
  const cell = sheet.getRange(2, idCol, sheet.getLastRow() - 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}

function colLetter_(n) {
  let s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// evita que textos começando com = + - @ sejam interpretados como fórmula
function sanitize_(value) {
  if (value === undefined || value === null) return "";
  const s = String(value).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
