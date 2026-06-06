const STORAGE_KEY = "vantLeadHunter.v1";

const initialState = {
  campaign: {
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

const elements = {
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
  if (!saved) return initialState;

  try {
    return { ...initialState, ...JSON.parse(saved) };
  } catch {
    return initialState;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  const intro =
    campaign.niche.toLowerCase().includes("hotel") ||
    campaign.niche.toLowerCase().includes("pousada")
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

function updateLeadStatus(status) {
  const lead = getSelectedLead();
  if (!lead) return;

  lead.status = status;
  lead.updatedAt = new Date().toISOString();
  saveState();
  renderLeads();
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

elements.campaignForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.campaign = collectCampaignForm();
  saveState();
  renderSelectedLead();
});

elements.leadForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const lead = {
    id: crypto.randomUUID(),
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
  state = { ...initialState, ...importedState };
  saveState();
  fillCampaignForm();
  renderLeads();
});

fillCampaignForm();
renderLeads();
