(function () {
  const {
    STORAGE_KEY,
    createNote,
    defaultNotes,
    formatDate,
    loadNotes,
    saveNotes,
  } = window.MarkNote;

  const results = document.getElementById("results");
  const testLog = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function test(name, fn) {
  try {
    await fn();
    testLog.push(`PASS: ${name}`);
    addResult("pass", `✓ ${name}`);
  } catch (error) {
    testLog.push(`FAIL: ${name} -> ${error.message}`);
    addResult("fail", `✗ ${name}: ${error.message}`);
  }
}

function addResult(className, text) {
  const line = document.createElement("div");
  line.className = className;
  line.textContent = text;
  results.append(line);
}

function inputText(element, value) {
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

async function runTests() {
  localStorage.removeItem(STORAGE_KEY);

  await test("createNote 生成结构完整的笔记", () => {
    const note = createNote({ title: "A", content: "B" });
    assert(typeof note.id === "string" && note.id.length > 0, "id 应为字符串");
    assert(note.title === "A", "title 应保持传入值");
    assert(note.content === "B", "content 应保持传入值");
    assert(typeof note.updatedAt === "number", "updatedAt 应为数字");
  });

  await test("defaultNotes 提供马克笔记初始内容", () => {
    assert(defaultNotes.length >= 2, "默认笔记数量不足");
    assert(defaultNotes[0].title === "欢迎使用马克笔记", "默认标题不符合需求");
  });

  await test("saveNotes 与 loadNotes 能正确持久化", () => {
    const sample = [createNote({ title: "保存测试", content: "hello" })];
    saveNotes(sample);
    const loaded = loadNotes();
    assert(loaded.length === 1, "加载后的笔记数量不正确");
    assert(loaded[0].title === "保存测试", "加载后的标题不正确");
  });

  await test("formatDate 返回可读日期", () => {
    const text = formatDate(new Date("2024-01-01T08:30:00Z").getTime());
    assert(typeof text === "string" && text.length > 0, "格式化结果不能为空");
  });

  await test("主界面分为左侧列表和右侧内容", async () => {
    const shellStyle = window.getComputedStyle(document.querySelector(".app-shell"));

    assert(document.querySelector(".note-sidebar"), "缺少左侧笔记列表区域");
    assert(document.querySelector(".note-workspace"), "缺少右侧笔记内容区域");
    assert(shellStyle.gridTemplateColumns.split(" ").length >= 2, "桌面布局应为两列");
    assert(document.querySelectorAll(".note-card").length >= 2, "默认笔记没有渲染");
  });

  await test("可以新增、编辑、搜索和删除笔记", async () => {
    document.getElementById("newNoteBtn").click();
    inputText(document.getElementById("titleInput"), "测试笔记");
    inputText(document.getElementById("contentInput"), "这是右侧内容区的测试内容");
    inputText(document.getElementById("searchInput"), "测试笔记");

    assert(document.querySelectorAll(".note-card").length === 1, "搜索后应只剩一个匹配项");
    assert(document.querySelector(".note-card__title").textContent === "测试笔记", "列表标题未同步更新");
    assert(localStorage.getItem(STORAGE_KEY).includes("右侧内容区"), "编辑内容未保存");

    document.getElementById("deleteNoteBtn").click();
    assert(!localStorage.getItem(STORAGE_KEY).includes("测试笔记"), "删除后笔记仍存在");
  });

  await test("localStorage 中不存在数据时 loadNotes 返回空数组", () => {
    localStorage.removeItem(STORAGE_KEY);
    const loaded = loadNotes();
    assert(Array.isArray(loaded), "结果应为数组");
    assert(loaded.length === 0, "空存储应返回空数组");
  });

  const summary = document.createElement("pre");
  summary.textContent = testLog.join("\n");
  results.append(summary);
}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runTests, { once: true });
  } else {
    runTests();
  }
})();
