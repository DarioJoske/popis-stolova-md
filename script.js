const TABLES = window.WEDDING_TABLES ?? [];

const tablesEl = document.querySelector("#tables");
const guestCountEl = document.querySelector("#guestCount");
const tableCountEl = document.querySelector("#tableCount");
const formEl = document.querySelector("#searchForm");
const inputEl = document.querySelector("#guestSearch");
const resultsEl = document.querySelector("#results");
const statusEl = document.querySelector("#searchStatus");
const backToTopEl = document.querySelector("#backToTop");

const normalize = (value) =>
  value
    .toLocaleLowerCase("hr-HR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const guestIndex = TABLES.flatMap((table, tableIndex) =>
  table.guests.map((guest, guestIndex) => ({
    guest,
    guestIndex,
    table,
    tableIndex,
    key: normalize(guest),
  }))
);

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);

function renderTables() {
  if (TABLES.length === 0) {
    tablesEl.innerHTML = `
      <div class="empty-state">
        <h3>Nema učitanih stolova</h3>
        <p>Pokrenite generator podataka iz foldera stolovipopis.</p>
      </div>
    `;
    statusEl.textContent = "Podaci o stolovima nisu učitani.";
    return;
  }

  tablesEl.innerHTML = TABLES.map((table, tableIndex) => `
    <article class="table-card" id="table-${tableIndex + 1}" data-table-index="${tableIndex}">
      <div class="table-head">
        <div>
          <h3>${escapeHtml(table.name)}</h3>
          <p>${escapeHtml(table.note)}</p>
        </div>
        <span class="seat-count">${table.guests.length} mjesta</span>
      </div>
      <ol class="guest-list">
        ${table.guests.map((guest, guestIndex) => `
          <li class="guest" id="guest-${tableIndex}-${guestIndex}" data-guest-key="${normalize(guest)}">
            <span class="seat-number">${guestIndex + 1}</span>
            <span class="guest-name">${escapeHtml(guest)}</span>
          </li>
        `).join("")}
      </ol>
    </article>
  `).join("");

  guestCountEl.textContent = String(guestIndex.length);
  tableCountEl.textContent = String(TABLES.length);
}

function clearHighlight() {
  document.querySelectorAll(".guest.highlight").forEach((el) => el.classList.remove("highlight"));
  document.querySelectorAll(".table-card.active-table").forEach((el) => el.classList.remove("active-table"));
}

function findMatches(query) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  return guestIndex
    .filter((entry) => entry.key.includes(normalizedQuery))
    .slice(0, 8);
}

function selectGuest(entry) {
  clearHighlight();
  resultsEl.hidden = true;

  const tableEl = document.querySelector(`[data-table-index="${entry.tableIndex}"]`);
  const guestEl = document.querySelector(`#guest-${entry.tableIndex}-${entry.guestIndex}`);

  tableEl.classList.add("active-table");
  guestEl.classList.add("highlight");
  guestEl.scrollIntoView({ behavior: "smooth", block: "center" });

  statusEl.textContent = `${entry.guest} sjedi za: ${entry.table.name}.`;
}

function renderResults(matches) {
  if (!inputEl.value.trim() || matches.length === 0) {
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    return;
  }

  resultsEl.hidden = false;
  resultsEl.innerHTML = matches.map((entry, index) => `
    <button class="result-button" type="button" data-result-index="${index}">
      <span>${escapeHtml(entry.guest)}</span>
      <small>${escapeHtml(entry.table.name)}</small>
    </button>
  `).join("");
}

inputEl.addEventListener("input", () => {
  const matches = findMatches(inputEl.value);
  renderResults(matches);
  statusEl.textContent = inputEl.value.trim() && matches.length === 0
    ? "Nema rezultata za uneseno ime."
    : "";
});

resultsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-result-index]");

  if (!button) {
    return;
  }

  const matches = findMatches(inputEl.value);
  const entry = matches[Number(button.dataset.resultIndex)];

  if (entry) {
    inputEl.value = entry.guest;
    selectGuest(entry);
  }
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();

  const matches = findMatches(inputEl.value);

  if (matches.length === 0) {
    clearHighlight();
    resultsEl.hidden = true;
    statusEl.textContent = inputEl.value.trim()
      ? "Nema rezultata za uneseno ime."
      : "Upišite ime ili prezime gosta.";
    return;
  }

  selectGuest(matches[0]);
});

document.addEventListener("click", (event) => {
  if (!formEl.contains(event.target)) {
    resultsEl.hidden = true;
  }
});

backToTopEl.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  inputEl.focus();
});

window.addEventListener("scroll", () => {
  backToTopEl.classList.toggle("visible", window.scrollY > 360);
});

renderTables();
