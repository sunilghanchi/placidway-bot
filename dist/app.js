const KNOWLEDGE_URL = "knowledge.json";
const CONTACT_URL = "https://www.placidway.com/profile/5/Alternative-Cancer-Treatment-by-ITC-Immunity-Therapy-Center";

const state = { knowledge: null, lastTopic: null, unanswered: JSON.parse(localStorage.getItem("unansweredQuestions") || "[]") };
const el = {
  form: document.querySelector("#chat-form"),
  input: document.querySelector("#question"),
  messages: document.querySelector("#messages"),
  evidence: document.querySelector("#evidence-list"),
  empty: document.querySelector("#evidence-empty"),
  count: document.querySelector("#source-count"),
  refresh: document.querySelector("#refresh-btn"),
  status: document.querySelector("#knowledge-status")
};

const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9$]+/g, " ").trim();
const hasAny = (text, terms) => terms.some(term => text.includes(term));
const source = id => state.knowledge.sources.find(item => item.id === id);
const treatmentId = text => text.includes("adenocarcinoma") ? "adenocarcinoma" : text.includes("adrenal") ? "adrenal" : (text.includes("anal cancer") || text.includes("colorectal")) ? "anal" : null;

function citations(ids) {
  return ids.map(id => source(id)).filter(Boolean);
}

function groundedAnswer(question) {
  const q = normalize(question);
  const prior = state.lastTopic;
  const topic = treatmentId(q) || (hasAny(q, ["itc", "clinic", "center"]) ? "clinic" : null) || prior;
  if (topic) state.lastTopic = topic;

  if (hasAny(q, ["weather", "hotel recommendation", "flight price", "tourist attraction", "visa requirement"])) {
    return { html: "I don’t know from the approved PlacidWay pages. This guide is limited to the supplied ITC treatment, clinic, video, and pricing content.", ids: [], unknown: true };
  }

  if (hasAny(q, ["book me", "book an appointment", "appointment tomorrow", "schedule me", "reserve"])) {
    return { html: `I can’t book an appointment. The ITC profile offers a consultation request; use the source link to contact PlacidWay or request a free quote.`, ids: ["clinic"] };
  }

  if (hasAny(q, ["safe for my", "is this safe", "my diabetes", "should i", "diagnose", "will it cure", "survival rate", "best treatment for me"])) {
    return { html: "The supplied pages do not establish whether a treatment is safe or appropriate for you, and I can’t provide a diagnosis. The profile says eligibility depends on cancer type, stage, organ function, prior treatment, medical history, and physical strength. Please discuss your records and risks with a qualified physician or oncologist.", ids: ["clinic"] };
  }

  if ((q.includes("$50") || q.includes("50 dollars") || q.includes("costs 50")) && hasAny(q, ["confirm", "right", "heard", "cost"])) {
    return { html: "I can’t confirm $50. The supplied ITC package pages list 3-week programs at <strong>$18,995 USD</strong> for out-patient care and <strong>$30,000 USD</strong> for in-patient care. The clinic price list also shows $18,995 USD for several cancer treatment entries.", ids: topic && ["adenocarcinoma", "adrenal", "anal"].includes(topic) ? [topic, "price-list"] : ["price-list", "clinic"] };
  }

  if (hasAny(q, ["recovery time", "how long to recover", "recover" ])) {
    const id = ["adenocarcinoma", "adrenal", "anal"].includes(topic) ? topic : "clinic";
    return { html: "The approved pages do not give a specific recovery-time estimate. The package pages describe a 3-week treatment program and one follow-up consultation three months after discharge, but that is not the same as a recovery duration. Please ask the treating team for an individualized estimate.", ids: [id] };
  }

  if (hasAny(q, ["include", "included", "package cover", "what do i get", "room and board"])) {
    const id = ["adenocarcinoma", "adrenal", "anal"].includes(topic) ? topic : "adrenal";
    const inpatient = hasAny(q, ["in patient", "inpatient", "30 000", "room"]);
    const html = inpatient
      ? "The <strong>$30,000 USD, 3-week in-patient program</strong> includes 24/7 medical supervision, private room and board, three meals daily, weekly diagnostics, one prescribed imaging study, program therapies, protocol medications, and a follow-up consultation after three months. Optional procedures and contingency services cost extra."
      : "The <strong>$18,995 USD, 3-week out-patient program</strong> includes weekly lab work, one prescribed X-ray, ultrasound, or CT scan, standard program therapies, two health-focused meals on treatment days, standard protocol medications, and one follow-up consultation after three months. It does not include an overnight stay.";
    return { html, ids: [id] };
  }

  if (hasAny(q, ["cheaper", "compare price", "compare cost"])) {
    return { html: "I can’t make that comparison from the approved pages. The supplied comparison page shows some individual clinic examples, but it does not provide like-for-like country averages for both places. Comparing unlike treatments or isolated clinic rows would be misleading.", ids: ["comparison"] };
  }

  if (hasAny(q, ["cost", "price", "how much", "cheaper", "compare"])) {
    const id = treatmentId(q);
    if (id) return { html: `The ${id === "anal" ? "anal cancer" : id} package page lists a <strong>3-week out-patient program at $18,995 USD</strong> and a <strong>3-week in-patient program at $30,000 USD</strong>. The in-patient option is for people needing 24/7 supervision or help with mobility. Optional procedures and contingency services can add cost.`, ids: [id] };
    if (hasAny(q, ["breast", "prostate", "lung", "pancreatic", "colon", "colorectal"])) return { html: "The ITC price list shows <strong>$18,995 USD</strong> for the named breast, prostate, lung, pancreatic, colorectal, and colon cancer treatment entries. The profile describes standard multi-week programs as starting at that amount; request a personalized quote for the final scope.", ids: ["price-list", "clinic"] };
    if (hasAny(q, ["alternative medicine", "abroad", "acupuncture", "ayurvedic", "ozone", "stem cell", "retreat"])) return { html: "The comparison page reports an average of <strong>$15,032 USD</strong> for alternative medicine abroad and a quoted range of <strong>$64–$30,000 USD</strong>, last verified June 3, 2026. These are broad estimates across different treatments and clinics, not an ITC package quote.", ids: ["comparison"] };
    return { html: "For ITC, the supplied sources list standard multi-week care starting at <strong>$18,995 USD</strong>. The three named package pages list $18,995 USD for 3-week out-patient care and $30,000 USD for 3-week in-patient care. Which treatment are you asking about?", ids: ["clinic", "price-list"] };
  }

  if (hasAny(q, ["approach", "how does", "process", "monitor", "evaluation", "eligib"])) {
    return { html: "ITC’s profile describes a six-part process: medical-record review, individualized planning, explanation of each therapy, daily clinical monitoring and periodic blood tests, post-treatment support, and coordination with the patient’s existing doctors. Acceptance follows a physician review of diagnosis, stage, organ function, prior treatment, history, and physical strength.", ids: ["clinic"] };
  }

  if (hasAny(q, ["where", "location", "airport", "travel", "transport", "shuttle"])) {
    return { html: "ITC is in <strong>Tijuana, Mexico</strong>, near the U.S. border. The clinic profile says it is near San Diego International Airport and that dedicated shuttle services help with border crossings and local transit to appointments and affiliated hotels.", ids: ["clinic"] };
  }

  if (hasAny(q, ["video", "watch", "media"])) {
    return { html: "PlacidWay has a dedicated ITC video page about alternative cancer treatment in Tijuana. Use the evidence link to view it directly.", ids: ["videos"] };
  }

  if (hasAny(q, ["who founded", "founder", "carlos bautista", "about itc", "tell me about itc"])) {
    return { html: "ITC Immunity Therapy Center is in Tijuana, Mexico and was founded by Dr. Carlos Bautista. Its profile emphasizes individualized care, immune-system support, medical monitoring, and coordination with the patient’s home doctors.", ids: ["clinic"] };
  }

  const terms = q.split(" ").filter(term => term.length > 3);
  const ranked = state.knowledge.sources.map(item => {
    const haystack = normalize([...item.topics, ...item.facts].join(" "));
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? (item.topics.some(t => normalize(t).includes(term)) ? 3 : 1) : 0), 0);
    return { item, score };
  }).sort((a, b) => b.score - a.score);
  if (ranked[0]?.score >= 2) {
    const best = ranked[0].item;
    return { html: `${best.facts.slice(0, 2).join(" ")}`, ids: [best.id] };
  }

  return { html: `I don’t know from the approved pages. Try asking about ITC, one of the three named cancer packages, program inclusions, prices, travel support, or the supplied alternative-medicine comparison. For an individual quote, contact PlacidWay through the ITC profile.`, ids: ["clinic"], unknown: true };
}

function addMessage(role, html, sources = []) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `<p>${html}</p>`;
  if (role === "assistant" && sources.length) {
    const links = document.createElement("div");
    links.className = "citations";
    sources.forEach((item, index) => {
      const a = document.createElement("a");
      a.href = item.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = `Source ${index + 1}`;
      links.append(a);
    });
    bubble.append(links);
  }
  if (role === "assistant") {
    const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = "G"; article.append(avatar);
  }
  article.append(bubble);
  el.messages.append(article);
  el.messages.scrollTop = el.messages.scrollHeight;
}

function showEvidence(items) {
  el.evidence.replaceChildren();
  el.empty.hidden = items.length > 0;
  el.count.textContent = `${items.length} source${items.length === 1 ? "" : "s"} used`;
  items.forEach(item => {
    const a = document.createElement("a");
    a.className = "source-card"; a.href = item.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    const domain = new URL(item.url).pathname;
    a.innerHTML = `<small>${item.type}</small><strong>${item.title}</strong><span>${domain}</span>`;
    el.evidence.append(a);
  });
}

async function loadKnowledge(cacheBust = false) {
  el.refresh.classList.add("loading"); el.refresh.disabled = true;
  const response = await fetch(`${KNOWLEDGE_URL}${cacheBust ? `?v=${Date.now()}` : ""}`);
  if (!response.ok) throw new Error("Knowledge snapshot could not be loaded");
  state.knowledge = await response.json();
  const date = new Date(state.knowledge.generatedAt);
  el.status.textContent = `Knowledge snapshot · ${date.toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"})}`;
  el.refresh.classList.remove("loading"); el.refresh.disabled = false;
}

el.form.addEventListener("submit", event => {
  event.preventDefault();
  const question = el.input.value.trim();
  if (!question || !state.knowledge) return;
  addMessage("user", question.replace(/[&<>]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[char])));
  const answer = groundedAnswer(question);
  const sources = citations(answer.ids);
  addMessage("assistant", answer.html, sources);
  showEvidence(sources);
  if (answer.unknown) {
    state.unanswered.push({ question, at: new Date().toISOString() });
    state.unanswered = state.unanswered.slice(-100);
    localStorage.setItem("unansweredQuestions", JSON.stringify(state.unanswered));
  }
  el.input.value = ""; el.input.style.height = "auto"; el.input.focus();
});

document.querySelectorAll(".suggestions button").forEach(button => button.addEventListener("click", () => {
  el.input.value = button.textContent; el.form.requestSubmit();
}));

el.input.addEventListener("input", () => { el.input.style.height = "auto"; el.input.style.height = `${Math.min(el.input.scrollHeight, 110)}px`; });
el.input.addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); el.form.requestSubmit(); } });
el.refresh.addEventListener("click", async () => {
  try { await loadKnowledge(true); addMessage("assistant", "The deployed knowledge snapshot has been reloaded. Repository maintainers can run the ingestion script and redeploy when the source pages change."); }
  catch { el.refresh.classList.remove("loading"); el.refresh.disabled = false; addMessage("assistant", "The knowledge snapshot could not be refreshed. Please try again."); }
});

document.querySelector("#download-log").addEventListener("click", () => {
  const body = state.unanswered.length ? state.unanswered.map(x => `${x.at}\t${x.question}`).join("\n") : "No unanswered questions logged in this browser.";
  const url = URL.createObjectURL(new Blob([body], {type:"text/plain"}));
  const a = document.createElement("a"); a.href = url; a.download = "unanswered-questions.txt"; a.click(); URL.revokeObjectURL(url);
});

loadKnowledge().catch(() => addMessage("assistant", "The knowledge snapshot is unavailable, so I can’t answer safely right now."));
