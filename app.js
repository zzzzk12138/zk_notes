const STORAGE_KEY = "clear-notes-app-v1";
const THEME_STORAGE_KEY = "clear-notes-theme";

const defaultNotes = [
  {
    id: crypto.randomUUID(),
    title: "欢迎使用马克笔记",
    content: "左侧管理笔记，右侧编辑内容。你的笔记会自动保存在当前浏览器里。",
    updatedAt: Date.now() - 1000 * 60 * 8,
  },
  {
    id: crypto.randomUUID(),
    title: "今日想法",
    content: "把零散灵感先放进来，之后再整理成清晰的计划。",
    updatedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
];

const els = {
  noteList: document.getElementById("noteList"),
  newNoteBtn: document.getElementById("newNoteBtn"),
  deleteNoteBtn: document.getElementById("deleteNoteBtn"),
  searchInput: document.getElementById("searchInput"),
  titleInput: document.getElementById("titleInput"),
  contentInput: document.getElementById("contentInput"),
  noteMeta: document.getElementById("noteMeta"),
  saveState: document.getElementById("saveState"),
  noteItemTemplate: document.getElementById("noteItemTemplate"),
  themeToggle: document.getElementById("themeToggle"),
};

const isAppShellPresent =
  !!els.noteList &&
  !!els.newNoteBtn &&
  !!els.deleteNoteBtn &&
  !!els.searchInput &&
  !!els.titleInput &&
  !!els.contentInput &&
  !!els.noteMeta &&
  !!els.saveState &&
  !!els.noteItemTemplate &&
  !!els.themeToggle;

const state = {
  notes: loadNotes(),
  activeId: null,
  searchTerm: "",
  isDirty: false,
};

if (location.hash === "#reset-storage") {
  localStorage.removeItem(STORAGE_KEY);
  state.notes = [];
}

if (!state.notes.length) {
  state.notes = [...defaultNotes];
}

state.activeId = state.notes[0]?.id ?? null;

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function createNote(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    title: overrides.title ?? "新笔记",
    content: overrides.content ?? "",
    updatedAt: Date.now(),
  };
}

function getActiveNote() {
  return state.notes.find((note) => note.id === state.activeId) ?? null;
}

function getFilteredNotes() {
  const term = state.searchTerm.trim().toLowerCase();
  if (!term) return state.notes;
  return state.notes.filter((note) => {
    return (
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term)
    );
  });
}

function syncEditor(note) {
  if (!note) {
    els.titleInput.value = "";
    els.contentInput.value = "";
    els.noteMeta.textContent = "暂无内容";
    els.deleteNoteBtn.disabled = true;
    return;
  }

  els.titleInput.value = note.title;
  els.contentInput.value = note.content;
  els.noteMeta.textContent = `最后更新于 ${formatDate(note.updatedAt)}`;
  els.deleteNoteBtn.disabled = false;
}

function renderNotes() {
  const notes = getFilteredNotes();
  els.noteList.innerHTML = "";

  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "note-card__preview";
    empty.textContent = "没有匹配的笔记。";
    els.noteList.append(empty);
    return;
  }

  for (const note of notes) {
    const fragment = els.noteItemTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".note-card");
    const title = fragment.querySelector(".note-card__title");
    const preview = fragment.querySelector(".note-card__preview");

    title.textContent = note.title || "未命名笔记";
    preview.textContent = note.content.trim() || "暂无内容";
    button.classList.toggle("is-active", note.id === state.activeId);
    button.addEventListener("click", () => selectNote(note.id));

    els.noteList.append(fragment);
  }
}

function persistAndRefresh() {
  saveNotes(state.notes);
  state.isDirty = false;
  els.saveState.textContent = "已自动保存";
  renderNotes();
}

function selectNote(id) {
  state.activeId = id;
  renderNotes();
  syncEditor(getActiveNote());
}

function addNote() {
  const note = createNote();
  state.notes.unshift(note);
  state.activeId = note.id;
  persistAndRefresh();
  syncEditor(getActiveNote());
  els.titleInput.focus();
}

function deleteActiveNote() {
  if (!state.activeId) return;

  const index = state.notes.findIndex((note) => note.id === state.activeId);
  if (index === -1) return;

  state.notes.splice(index, 1);
  state.activeId = state.notes[0]?.id ?? null;
  persistAndRefresh();
  syncEditor(getActiveNote());
}

function updateActiveNote(patch) {
  const note = getActiveNote();
  if (!note) return;

  Object.assign(note, patch, { updatedAt: Date.now() });
  state.isDirty = true;
  els.saveState.textContent = "正在保存...";
  persistAndRefresh();
  els.noteMeta.textContent = `最后更新于 ${formatDate(note.updatedAt)}`;
}

function bindEvents() {
  els.newNoteBtn.addEventListener("click", addNote);
  els.deleteNoteBtn.addEventListener("click", deleteActiveNote);
  els.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    renderNotes();
  });
  els.titleInput.addEventListener("input", (event) => {
    updateActiveNote({ title: event.target.value || "未命名笔记" });
  });
  els.contentInput.addEventListener("input", (event) => {
    updateActiveNote({ content: event.target.value });
  });
  els.themeToggle.addEventListener("click", toggleTheme);
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", theme);
  els.themeToggle.querySelector(".theme-toggle__icon").textContent = isDark ? "☀️" : "🌙";
  els.themeToggle.querySelector(".theme-toggle__label").textContent = isDark ? "浅色模式" : "深色模式";
  els.themeToggle.title = isDark ? "切换到浅色模式" : "切换到深色模式";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* storage unavailable */
  }
}

function init() {
  if (!isAppShellPresent) return;
  if (!state.notes.length) {
    state.notes = [...defaultNotes];
  }
  saveNotes(state.notes);
  applyTheme(getSavedTheme());
  bindEvents();
  renderNotes();
  syncEditor(getActiveNote());
}

window.MarkNote = {
  STORAGE_KEY,
  createNote,
  defaultNotes,
  formatDate,
  getActiveNote,
  getFilteredNotes,
  loadNotes,
  saveNotes,
  state,
  addNote,
  deleteActiveNote,
  selectNote,
  updateActiveNote,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
