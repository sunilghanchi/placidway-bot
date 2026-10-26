const state = { history: [], sources: [], unanswered: JSON.parse(localStorage.getItem("unansweredQuestions") || "[]") };
const el = {
  form: document.querySelector("#chat-form"), input: document.querySelector("#question"),
  messages: document.querySelector("#messages"), evidence: document.querySelector("#evidence-list"),
  empty: document.querySelector("#evidence-empty"), count: document.querySelector("#source-count"),
  dialog: document.querySelector("#source-dialog"), dialogTitle: document.querySelector("#source-dialog-title"),
  dialogType: document.querySelector("#source-dialog-type"), dialogExcerpt: document.querySelector("#source-dialog-excerpt"),
  dialogLink: document.querySelector("#source-dialog-link"), dialogClose: document.querySelector("#source-dialog-close"),
  dialogDone: document.querySelector("#source-dialog-done")
};

const escapeHtml = text => text.replace(/[&<>]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[char]));

function addMessage(role, text, sources = [], meta = "") {
  const article = document.createElement("article"); article.className = `message ${role}`;
  if (role === "assistant") { const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = "P"; article.append(avatar); }
  const bubble = document.createElement("div"); bubble.className = "bubble";
  const body = document.createElement("p"); body.textContent = text; bubble.append(body);
  if (sources.length) {
    const links = document.createElement("div"); links.className = "citations";
    sources.forEach((item, index) => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = `Source ${index + 1}`;
      button.addEventListener("click", () => openSource(item)); links.append(button);
    });
    bubble.append(links);
  }
  if (meta) { const note = document.createElement("p"); note.className = "note"; note.textContent = meta; bubble.append(note); }
  article.append(bubble); el.messages.append(article); el.messages.scrollTop = el.messages.scrollHeight;
}

function showEvidence(items) {
  state.sources = items;
  el.evidence.replaceChildren(); el.empty.hidden = items.length > 0;
  el.count.textContent = `${items.length} source${items.length === 1 ? "" : "s"} used`;
  items.forEach(item => {
    const button = document.createElement("button"); button.type = "button"; button.className = "source-card";
    button.innerHTML = `<small>${escapeHtml(item.source_type)}</small><strong>${escapeHtml(item.title)}</strong><span>View supporting excerpt</span>`;
    button.addEventListener("click", () => openSource(item)); el.evidence.append(button);
  });
}

function openSource(item) {
  el.dialogType.textContent = item.source_type;
  el.dialogTitle.textContent = item.title;
  el.dialogExcerpt.textContent = item.excerpt;
  el.dialogLink.href = item.url;
  el.dialog.showModal();
  el.dialogClose.focus();
}

function closeSource() { el.dialog.close(); }

async function ask(question) {
  addMessage("user", question);
  el.messages.setAttribute("aria-busy", "true");
  const submitButton = el.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  const pending = document.createElement("article"); pending.className = "message assistant thinking-message";
  pending.setAttribute("role", "status");
  pending.innerHTML = '<div class="avatar">P</div><div class="bubble thinking"><span class="thinking-label">Searching verified sources</span><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>';
  el.messages.append(pending); el.messages.scrollTop = el.messages.scrollHeight;
  try {
    const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, history: state.history.slice(-8) }) });
    const data = await response.json(); pending.remove();
    if (!response.ok) throw new Error(data.detail || "PlacidWay Bot is temporarily unavailable.");
    addMessage("assistant", data.answer, data.citations);
    showEvidence(data.citations);
    state.history.push({ role: "user", content: question }, { role: "assistant", content: data.answer }); state.history = state.history.slice(-8);
    if (!data.grounded) { state.unanswered.push({ question, at: new Date().toISOString() }); state.unanswered = state.unanswered.slice(-100); localStorage.setItem("unansweredQuestions", JSON.stringify(state.unanswered)); }
  } catch (error) { pending.remove(); addMessage("assistant", error.message, [], "No unsupported answer was generated"); showEvidence([]); }
  finally { el.messages.setAttribute("aria-busy", "false"); submitButton.disabled = false; }
}

el.form.addEventListener("submit", event => { event.preventDefault(); const question = el.input.value.trim(); if (!question) return; el.input.value = ""; el.input.style.height = "auto"; ask(question); el.input.focus(); });
document.querySelectorAll(".suggestions button").forEach(button => button.addEventListener("click", () => ask(button.textContent)));
el.input.addEventListener("input", () => { el.input.style.height = "auto"; el.input.style.height = `${Math.min(el.input.scrollHeight, 110)}px`; });
el.input.addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); el.form.requestSubmit(); } });
el.dialogClose.addEventListener("click", closeSource);
el.dialogDone.addEventListener("click", closeSource);
el.dialog.addEventListener("click", event => { if (event.target === el.dialog) closeSource(); });
