const STORAGE_KEY = "vantLeadHunter.v2";
const CONFIG_KEY = "vantLeadHunter.supabase";

const initialState = {
  campaign: {
    id: null,
    name: "Parceria hotel Recife",
    niche: "Hoteis e pousadas",
    location: "Recife, PE",
    goal: "Conseguir parceria para 1 diaria",
    offer: "",
    senderEmail: "admin@vant.business",
    tone: "direto e cordial",
    criteria:
      "Instagram ativo, WhatsApp visivel, boa localizacao, perfil compativel com parceria.",
  },
  leads: [],
  selectedLeadId: null,
};

let state = loadState();
let dbConfig = loadDbConfig();

const elements = {
  databaseForm: document.querySelector("#databaseForm"),
  supabaseUrl: document.querySelector("#supabaseUrl"),
  supabaseAnonKey: document.querySelector("#supabaseAnonKey"),
  loadDatabase: document.querySelector("#loadDatabase"),
  storageStatus: document.querySelector("#storageStatus"),
  campaignForm: document.querySelector("#campaignForm"),
  campaignName: document.querySelector("#campaignName"),
  niche: document.querySelector("#niche"),
  location: document.querySelector("#location"),
  goal: document.querySelector("#goal"),
  offer: document.querySelector("#offer"),
  senderEmail: document.querySelector("#senderEmail"),
  tone: document.querySelector("#tone"),
  criteria: document.querySelector("#criteria"),
  leadForm: document.querySelector("#leadForm"),
  leadName: document.querySelector("#leadName"),
  leadCategory: document.querySelector("#leadCategory"),
  leadArea: document.querySelector("#leadArea"),
  leadWhatsapp: document.querySelector("#leadWhatsapp"),
  leadEmail: document.querySelector("#leadEmail"),
  leadInstagram: document.querySelector("#leadInstagram"),
  leadSite: document.querySelector("#leadSite"),
  leadNotes: document.querySelector("#leadNotes"),
  leadList: document.querySelector("#leadList"),
  selectedEmpty: document.querySelector("#selectedEmpty"),
  selectedLead: document.querySelector("#selectedLead"),
  selectedCategory: document.querySelector("#selectedCategory"),
  selectedName: document.querySelector("#selectedName"),
  leadStatus: document.querySelector("#leadStatus"),
  emailSubject: document.querySelector("#emailSubject"),
  generatedMessage: document.querySelector("#generatedMessage"),
  copySubject: document.querySelector("#copySubject"),
  copyMessage: document.querySelector("#copyMessage"),
  openMail: document.querySelector("#openMail"),
  openWhatsapp: document.querySelector("#openWhatsapp"),
  markSent: document.querySelector("#markSent"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  leadItemTemplate: document.querySelector("#leadItemTemplate"),
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(initialState);

  try {
    return { ...structuredClone(initialState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadDbConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (!saved) return { supabaseUrl: "", supabaseAnonKey: "" };

  try {
    return JSON.parse(saved);
  } catch {
    return { supabaseUrl: "", supabaseAnonKey: "" };
  }
}

function saveDbConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(dbConfig));
}

function isDatabaseConfigured() {
  return Boolean(dbConfig.supabaseUrl && dbConfig.supabaseAnonKey);
}

function updateStorageStatus(message) {
  const online = isDatabaseConfigured();
  elements.storageStatus.textContent =
    message || (online ? "Banco conectado" : "Modo local");
  elements.storageStatus.classList.toggle("online", online);
}

function dbHeaders(prefer) {
  const headers = {
    apikey: dbConfig.supabaseAnonKey,
    Authorization: `Bearer ${dbConfig.supabaseAnonKey}`,
    "Content-Type": "application/json",
  };

  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function dbRequest(path, options = {}) {
  if (!isDatabaseConfigured()) return null;

  const response = await fetch(`${dbConfig.supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: { ...dbHeaders(options.prefer), ...(options.headers || {}) },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Supabase error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function campaignToDb(campaign) {
  return {
    name: campaign.name,
    niche: campaign.niche,
    location: campaign.location,
    goal: campaign.goal,
    offer: campaign.offer,
    sender_email: campaign.senderEmail,
    tone: campaign.tone,
    criteria: campaign.criteria,
    updated_at: new Date().toISOString(),
  };
}

function campaignFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    niche: row.niche,
    location: row.location,
    goal: row.goal,
    offer: row.offer,
    senderEmail: row.sender_email,
    tone: row.tone,
    criteria: row.criteria || "",
  };
}

function leadToDb(lead) {
  return {
    campaign_id: lead.campaignId || state.campaign.id,
    name: lead.name,
    category: lead.category,
    area: lead.area,
    whatsapp: lead.whatsapp,
    email: lead.email,
    instagram: lead.instagram,
    site: lead.site,
    notes: lead.notes,
    status: lead.status,
    updated_at: new Date().toISOString(),
  };
}

function leadFromDb(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    category: row.category || "",
    area: row.area || "",
    whatsapp: row.whatsapp || "",
    email: row.email || "",
    instagram: row.instagram || "",
    site: row.site || "",
    notes: row.notes || "",
    status: row.status || "Novo",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadFromDatabase() {
  if (!isDatabaseConfigured()) {
    updateStorageStatus("Configure o banco");
    return;
  }

  updateStorageStatus("Carregando...");
  const campaigns = await dbRequest(
    "lead_hunter_campaigns?select=*&order=created_at.desc&limit=1",
  );

  if (!campaigns || campaigns.length === 0) {
    await saveCampaignToDatabase();
    updateStorageStatus("Banco conectado");
    return;
  }

  state.campaign = campaignFromDb(campaigns[0]);
  const leads = await dbRequest(
    `lead_hunter_leads?select=*&campaign_id=eq.${state.campaign.id}&order=created_at.desc`,
  );
  state.leads = (leads || []).map(leadFromDb);
  state.selectedLeadId = state.leads[0]?.id || null;
  saveState();
  fillCampaignForm();
  renderLeads();
  updateStorageStatus("Banco conectado");
}

async function saveCampaignToDatabase() {
  if (!isDatabaseConfigured()) return;

  const payload = campaignToDb(state.campaign);

  if (state.campaign.id) {
    const rows = await dbRequest(
      `lead_hunter_campaigns?id=eq.${state.campaign.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        prefer: "return=representation",
      },
    );
    state.campaign = campaignFromDb(rows[0]);
    saveState();
    return;
  }

  const rows = await dbRequest("lead_hunter_campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
    prefer: "return=representation",
  });
  state.campaign = campaignFromDb(rows[0]);
  saveState();
}

async function saveLeadToDatabase(lead) {
  if (!isDatabaseConfigured()) return lead;

  if (!state.campaign.id) await saveCampaignToDatabase();

  const rows = await dbRequest("lead_hunter_leads", {
    method: "POST",
    body: JSON.stringify(leadToDb({ ...lead, campaignId: state.campaign.id })),
    prefer: "return=representation",
  });

  return leadFromDb(rows[0]);
}

async function updateLeadStatusInDatabase(lead) {
  if (!isDatabaseConfigured() || !lead.id) return;

  await dbRequest(`lead_hunter_leads?id=eq.${lead.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: lead.status,
      updated_at: new Date().toISOString(),
    }),
  });
}

function fillDatabaseForm() {
  elements.supabaseUrl.value = dbConfig.supabaseUrl || "";
  elements.supabaseAnonKey.value = dbConfig.supabaseAnonKey || "";
  updateStorageStatus();
}

function fillCampaignForm() {
  elements.campaignName.value = state.campaign.name;
  elements.niche.value = state.campaign.niche;
  elements.location.value = state.campaign.location;
  elements.goal.value = state.campaign.goal;
  elements.offer.value = state.campaign.offer;
  elements.senderEmail.value = state.campaign.senderEmail;
  elements.tone.value = state.campaign.tone;
  elements.criteria.value = state.campaign.criteria;
}

function getSelectedLead() {
  return state.leads.find((lead) => lead.id === state.selectedLeadId);
}

function renderLeads() {
  elements.leadList.innerHTML = "";

  if (state.leads.length === 0) {
    elements.leadList.innerHTML =
      '<div class="empty-state">Cadastre o primeiro lead para gerar mensagens.</div>';
    renderSelectedLead();
    return;
  }

  state.leads.forEach((lead) => {
    const fragment = elements.leadItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".lead-item");
    const button = fragment.querySelector(".lead-select");
    const title = fragment.querySelector(".lead-title");
    const meta = fragment.querySelector(".lead-meta");
    const status = fragment.querySelector(".status-pill");

    title.textContent = lead.name;
    meta.textContent = [lead.category, lead.area].filter(Boolean).join(" | ");
    status.textContent = lead.status;
    item.dataset.selected = String(lead.id === state.selectedLeadId);

    button.addEventListener("click", () => {
      state.selectedLeadId = lead.id;
      saveState();
      renderLeads();
      renderSelectedLead();
    });

    elements.leadList.appendChild(fragment);
  });

  renderSelectedLead();
}

function renderSelectedLead() {
  const lead = getSelectedLead();

  if (!lead) {
    elements.selectedEmpty.classList.remove("hidden");
    elements.selectedLead.classList.add("hidden");
    return;
  }

  const message = buildMessage(lead);

  elements.selectedEmpty.classList.add("hidden");
  elements.selectedLead.classList.remove("hidden");
  elements.selectedCategory.textContent = [lead.category, lead.area]
    .filter(Boolean)
    .join(" | ");
  elements.selectedName.textContent = lead.name;
  elements.leadStatus.value = lead.status;
  elements.emailSubject.value = buildEmailSubject(lead);
  elements.generatedMessage.value = message;
}

function buildEmailSubject(lead) {
  const subjectBase = state.campaign.goal || "Proposta de parceria";
  return `${subjectBase} - ${lead.name}`;
}

function buildMessage(lead) {
  const campaign = state.campaign;
  const isHospitality =
    campaign.niche.toLowerCase().includes("hotel") ||
    campaign.niche.toLowerCase().includes("pousada");
  const intro = isHospitality
    ? `Estou organizando uma viagem curta para ${campaign.location} com minha namorada e encontrei ${lead.name}.`
    : `Estou analisando empresas do nicho de ${campaign.niche} em ${campaign.location} e encontrei ${lead.name}.`;

  const contextLines = [
    lead.instagram ? `Vi tambem o Instagram: ${lead.instagram}.` : "",
    lead.site ? `Tambem consultei o site: ${lead.site}.` : "",
    lead.notes ? `Observacao: ${lead.notes}` : "",
  ].filter(Boolean);

  return [
    "Ola, tudo bem?",
    "",
    `Me chamo Victor, da VANT.Business. ${intro}`,
    "",
    `Meu objetivo nesta campanha: ${campaign.goal}.`,
    "",
    "Minha oferta:",
    campaign.offer || "[preencha a oferta da campanha antes de enviar]",
    "",
    contextLines.join("\n"),
    "",
    `Se fizer sentido, posso te enviar os detalhes por aqui. A abordagem sera ${campaign.tone}.`,
    "",
    "Obrigado.",
    "Victor",
  ]
    .filter((part) => part !== "")
    .join("\n");
}

function collectCampaignForm() {
  return {
    ...state.campaign,
    name: elements.campaignName.value.trim(),
    niche: elements.niche.value.trim(),
    location: elements.location.value.trim(),
    goal: elements.goal.value.trim(),
    offer: elements.offer.value.trim(),
    senderEmail: elements.senderEmail.value.trim(),
    tone: elements.tone.value,
    criteria: elements.criteria.value.trim(),
  };
}

async function updateLeadStatus(status) {
  const lead = getSelectedLead();
  if (!lead) return;

  lead.status = status;
  lead.updatedAt = new Date().toISOString();
  saveState();
  renderLeads();

  try {
    await updateLeadStatusInDatabase(lead);
  } catch (error) {
    updateStorageStatus("Erro ao salvar status");
    console.error(error);
  }
}

function normalizeWhatsapp(value) {
  return value.replace(/\D/g, "");
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

elements.databaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  dbConfig = {
    supabaseUrl: elements.supabaseUrl.value.trim().replace(/\/$/, ""),
    supabaseAnonKey: elements.supabaseAnonKey.value.trim(),
  };
  saveDbConfig();
  updateStorageStatus("Conectando...");

  try {
    await loadFromDatabase();
  } catch (error) {
    updateStorageStatus("Erro no banco");
    console.error(error);
  }
});

elements.loadDatabase.addEventListener("click", async () => {
  try {
    await loadFromDatabase();
  } catch (error) {
    updateStorageStatus("Erro ao carregar");
    console.error(error);
  }
});

elements.campaignForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.campaign = collectCampaignForm();
  saveState();
  renderSelectedLead();

  try {
    await saveCampaignToDatabase();
    updateStorageStatus();
  } catch (error) {
    updateStorageStatus("Erro ao salvar campanha");
    console.error(error);
  }
});

elements.leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const lead = {
    id: crypto.randomUUID(),
    campaignId: state.campaign.id,
    name: elements.leadName.value.trim(),
    category: elements.leadCategory.value.trim(),
    area: elements.leadArea.value.trim(),
    whatsapp: elements.leadWhatsapp.value.trim(),
    email: elements.leadEmail.value.trim(),
    instagram: elements.leadInstagram.value.trim(),
    site: elements.leadSite.value.trim(),
    notes: elements.leadNotes.value.trim(),
    status: "Novo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.leads.unshift(lead);
  state.selectedLeadId = lead.id;
  saveState();
  elements.leadForm.reset();
  renderLeads();

  try {
    const savedLead = await saveLeadToDatabase(lead);
    const index = state.leads.findIndex((item) => item.id === lead.id);
    state.leads[index] = savedLead;
    state.selectedLeadId = savedLead.id;
    saveState();
    renderLeads();
    updateStorageStatus();
  } catch (error) {
    updateStorageStatus("Lead salvo local");
    console.error(error);
  }
});

elements.leadStatus.addEventListener("change", () => {
  updateLeadStatus(elements.leadStatus.value);
});

elements.copySubject.addEventListener("click", async () => {
  await copyText(elements.emailSubject.value);
});

elements.copyMessage.addEventListener("click", async () => {
  await copyText(elements.generatedMessage.value);
  updateLeadStatus("Mensagem preparada");
});

elements.openMail.addEventListener("click", () => {
  const lead = getSelectedLead();
  if (!lead) return;

  const params = new URLSearchParams({
    subject: elements.emailSubject.value,
    body: elements.generatedMessage.value,
  });
  const to = lead.email || "";
  window.location.href = `mailto:${to}?${params.toString()}`;
  updateLeadStatus("Mensagem preparada");
});

elements.openWhatsapp.addEventListener("click", () => {
  const lead = getSelectedLead();
  if (!lead || !lead.whatsapp) return;

  const phone = normalizeWhatsapp(lead.whatsapp);
  const text = encodeURIComponent(elements.generatedMessage.value);
  window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener");
  updateLeadStatus("Mensagem preparada");
});

elements.markSent.addEventListener("click", () => {
  updateLeadStatus("Mensagem enviada");
});

elements.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vant-lead-hunter-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

elements.importData.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const content = await file.text();
  const importedState = JSON.parse(content);
  state = { ...structuredClone(initialState), ...importedState };
  saveState();
  fillCampaignForm();
  renderLeads();
});

fillDatabaseForm();
fillCampaignForm();
renderLeads();

if (isDatabaseConfigured()) {
  loadFromDatabase().catch((error) => {
    updateStorageStatus("Modo local");
    console.error(error);
  });
}
