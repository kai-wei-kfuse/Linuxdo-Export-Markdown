// ==UserScript==
// @name         Linux.do Topic Markdown Exporter
// @namespace    https://linux.do/
// @version      1.0.0
// @description  Export Linux.do topics to Markdown with automatic flat/nest/post mode support.
// @author       Codex
// @match        https://linux.do/t/topic/*
// @match        https://linux.do/n/topic/*
// @match        https://www.linux.do/t/topic/*
// @match        https://www.linux.do/n/topic/*
// @grant        GM_download
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const BUTTON_ID = "linuxdo-md-export-button";
  const DIALOG_ID = "linuxdo-md-export-dialog";
  const POST_ONLY_ALIASES = new Set(["post", "main", "主帖"]);

  function parseTopicLocation(urlText = location.href) {
    const url = new URL(urlText, location.origin);
    const parts = url.pathname.split("/").filter(Boolean);
    const viewToken = parts[0];
    let idToken = null;

    if (parts[1] === "topic" && /^\d+$/.test(parts[2] || "")) {
      idToken = parts[2];
    } else {
      idToken = parts.slice(1).find((part) => /^\d+$/.test(part));
    }

    if (!idToken || !["t", "n"].includes(viewToken)) {
      return null;
    }

    return {
      id: Number(idToken),
      viewToken,
      detectedMode: viewToken === "n" ? "nest" : "flat",
      canonicalJsonUrl: `${url.origin}/t/topic/${idToken}.json`,
      originalUrl: url.href.replace(/#.*$/, ""),
      origin: url.origin,
    };
  }

  function injectButton() {
    const topic = parseTopicLocation();
    if (!topic) return;

    const existing = document.getElementById(BUTTON_ID);
    if (existing) return;

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "导出 MD";
    button.title = "导出当前 Linux.do 帖子为 Markdown";
    button.style.cssText = [
      "position:fixed",
      "right:18px",
      "bottom:82px",
      "z-index:99999",
      "border:1px solid #0f766e",
      "border-radius:8px",
      "background:#0d9488",
      "color:#fff",
      "font-size:14px",
      "font-weight:600",
      "line-height:1",
      "padding:10px 12px",
      "box-shadow:0 6px 18px rgba(15,23,42,.18)",
      "cursor:pointer",
    ].join(";");

    button.addEventListener("click", () => {
      exportCurrentTopic(button).catch((error) => {
        console.error("[linuxdo-md-export]", error);
        alert(`导出失败：${error.message || error}`);
      });
    });

    document.body.appendChild(button);
  }

  async function exportCurrentTopic(button) {
    const topicInfo = parseTopicLocation();
    if (!topicInfo) {
      throw new Error("当前页面不是可识别的 linux.do 帖子链接。");
    }

    const rangeInput = await showRangeDialog();

    if (rangeInput === null) return;

    const range = parseRange(rangeInput);
    const exportMode = range.kind === "post" ? "post" : topicInfo.detectedMode;

    setBusy(button, true);
    try {
      const topic = await fetchCompleteTopic(topicInfo);
      const selectedPosts = selectPosts(topic.posts, range);

      if (!selectedPosts.length) {
        throw new Error("所选范围内没有可导出的楼层。");
      }

      const markdown = buildMarkdown({
        topic,
        topicInfo,
        posts: selectedPosts,
        exportMode,
        range,
      });

      const filename = makeFilename(topicInfo.id, exportMode, topic.title);
      downloadText(filename, markdown);
    } finally {
      setBusy(button, false);
    }
  }

  function setBusy(button, busy) {
    button.disabled = busy;
    button.textContent = busy ? "导出中..." : "导出 MD";
    button.style.opacity = busy ? "0.72" : "1";
    button.style.cursor = busy ? "wait" : "pointer";
  }

  function showRangeDialog() {
    return new Promise((resolve) => {
      const existing = document.getElementById(DIALOG_ID);
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = DIALOG_ID;
      overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:100000",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "background:rgba(15,23,42,.38)",
        "font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      ].join(";");

      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "linuxdo-md-export-title");
      dialog.style.cssText = [
        "width:min(420px,calc(100vw - 32px))",
        "box-sizing:border-box",
        "border:1px solid rgba(15,23,42,.12)",
        "border-radius:8px",
        "background:#fff",
        "color:#0f172a",
        "box-shadow:0 18px 52px rgba(15,23,42,.28)",
        "padding:18px",
      ].join(";");

      const title = document.createElement("h2");
      title.id = "linuxdo-md-export-title";
      title.textContent = "选择导出范围";
      title.style.cssText = [
        "margin:0 0 14px",
        "font-size:18px",
        "font-weight:700",
        "line-height:1.3",
        "letter-spacing:0",
      ].join(";");

      const label = document.createElement("label");
      label.textContent = "范围";
      label.style.cssText = [
        "display:block",
        "margin:0 0 6px",
        "font-size:13px",
        "font-weight:600",
        "color:#334155",
      ].join(";");

      const select = document.createElement("select");
      select.style.cssText = [
        "width:100%",
        "box-sizing:border-box",
        "border:1px solid #cbd5e1",
        "border-radius:6px",
        "background:#fff",
        "color:#0f172a",
        "font-size:14px",
        "line-height:1.4",
        "padding:9px 10px",
        "outline:none",
      ].join(";");

      const options = [
        ["all", "全部回复"],
        ["post", "只导出主帖"],
        ["custom", "自定义楼层"],
      ];

      for (const [value, text] of options) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
      }

      const customWrap = document.createElement("div");
      customWrap.style.cssText = "display:none;margin-top:12px;";

      const customLabel = document.createElement("label");
      customLabel.textContent = "自定义楼层";
      customLabel.style.cssText = [
        "display:block",
        "margin:0 0 6px",
        "font-size:13px",
        "font-weight:600",
        "color:#334155",
      ].join(";");

      const customInput = document.createElement("input");
      customInput.type = "text";
      customInput.placeholder = "例如：1-50 或 1,3,8-12";
      customInput.style.cssText = [
        "width:100%",
        "box-sizing:border-box",
        "border:1px solid #cbd5e1",
        "border-radius:6px",
        "background:#fff",
        "color:#0f172a",
        "font-size:14px",
        "line-height:1.4",
        "padding:9px 10px",
        "outline:none",
      ].join(";");

      const error = document.createElement("div");
      error.setAttribute("aria-live", "polite");
      error.style.cssText = [
        "min-height:18px",
        "margin-top:10px",
        "font-size:13px",
        "line-height:1.4",
        "color:#b91c1c",
      ].join(";");

      const actions = document.createElement("div");
      actions.style.cssText = [
        "display:flex",
        "justify-content:flex-end",
        "gap:8px",
        "margin-top:16px",
      ].join(";");

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.textContent = "取消";
      cancelButton.style.cssText = dialogButtonStyle("#fff", "#334155", "#cbd5e1");

      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.textContent = "导出";
      confirmButton.style.cssText = dialogButtonStyle("#0d9488", "#fff", "#0f766e");

      function close(value) {
        overlay.remove();
        document.removeEventListener("keydown", onKeydown);
        resolve(value);
      }

      function selectedRangeInput() {
        if (select.value === "custom") return customInput.value.trim();
        return select.value;
      }

      function syncCustomVisibility() {
        const show = select.value === "custom";
        customWrap.style.display = show ? "block" : "none";
        error.textContent = "";
        if (show) {
          setTimeout(() => customInput.focus(), 0);
        }
      }

      function confirm() {
        const value = selectedRangeInput();

        try {
          parseRange(value);
          close(value);
        } catch (parseError) {
          error.textContent = parseError.message || "范围格式无效。";
          customInput.focus();
        }
      }

      function onKeydown(event) {
        if (event.key === "Escape") {
          close(null);
        } else if (event.key === "Enter") {
          event.preventDefault();
          confirm();
        }
      }

      select.addEventListener("change", syncCustomVisibility);
      customInput.addEventListener("input", () => {
        error.textContent = "";
      });
      cancelButton.addEventListener("click", () => close(null));
      confirmButton.addEventListener("click", confirm);
      document.addEventListener("keydown", onKeydown);

      customWrap.appendChild(customLabel);
      customWrap.appendChild(customInput);
      actions.appendChild(cancelButton);
      actions.appendChild(confirmButton);
      dialog.appendChild(title);
      dialog.appendChild(label);
      dialog.appendChild(select);
      dialog.appendChild(customWrap);
      dialog.appendChild(error);
      dialog.appendChild(actions);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      select.focus();
    });
  }

  function dialogButtonStyle(background, color, borderColor) {
    return [
      `background:${background}`,
      `color:${color}`,
      `border:1px solid ${borderColor}`,
      "border-radius:6px",
      "font-size:14px",
      "font-weight:600",
      "line-height:1",
      "padding:9px 12px",
      "cursor:pointer",
    ].join(";");
  }

  function parseRange(input) {
    const raw = String(input || "").trim();
    const normalized = raw.toLowerCase();

    if (!raw || normalized === "all" || raw === "全部") {
      return { kind: "all", label: raw || "all", postNumbers: null };
    }

    if (POST_ONLY_ALIASES.has(normalized) || POST_ONLY_ALIASES.has(raw)) {
      return { kind: "post", label: raw, postNumbers: new Set([1]) };
    }

    const postNumbers = new Set();
    const segments = raw.split(",").map((part) => part.trim()).filter(Boolean);
    if (!segments.length) {
      throw new Error("范围格式为空。");
    }

    for (const segment of segments) {
      const rangeMatch = segment.match(/^(\d+)\s*-\s*(\d+)$/);
      const numberMatch = segment.match(/^\d+$/);

      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        if (start < 1 || end < 1 || start > end) {
          throw new Error(`范围无效：${segment}`);
        }
        for (let value = start; value <= end; value += 1) {
          postNumbers.add(value);
        }
      } else if (numberMatch) {
        const value = Number(segment);
        if (value < 1) throw new Error(`楼层无效：${segment}`);
        postNumbers.add(value);
      } else {
        throw new Error(`无法识别范围：${segment}`);
      }
    }

    return { kind: "range", label: raw, postNumbers };
  }

  async function fetchCompleteTopic(topicInfo) {
    const first = await fetchJson(topicInfo.canonicalJsonUrl);
    const postsById = new Map();
    const postsByNumber = new Map();

    for (const post of first?.post_stream?.posts || []) {
      if (post && post.id) postsById.set(post.id, post);
      if (post && post.post_number) postsByNumber.set(post.post_number, post);
    }

    const streamIds = Array.isArray(first?.post_stream?.stream) ? first.post_stream.stream : [];
    const missingIds = streamIds.filter((id) => !postsById.has(id));

    for (const chunk of chunkArray(missingIds, 50)) {
      const extraPosts = await fetchPostsByIds(topicInfo.id, chunk);
      for (const post of extraPosts) {
        if (post && post.id) postsById.set(post.id, post);
        if (post && post.post_number) postsByNumber.set(post.post_number, post);
      }
    }

    return {
      id: topicInfo.id,
      title: first?.title || document.title.replace(/\s*-\s*LINUX DO\s*$/i, "").trim() || `topic-${topicInfo.id}`,
      category: first?.category_id,
      tags: Array.isArray(first?.tags) ? first.tags : [],
      posts: [...postsByNumber.values()].sort((a, b) => a.post_number - b.post_number),
      raw: first,
    };
  }

  async function fetchPostsByIds(topicId, ids) {
    if (!ids.length) return [];

    const params = new URLSearchParams();
    for (const id of ids) params.append("post_ids[]", String(id));

    const url = `${location.origin}/t/${topicId}/posts.json?${params.toString()}`;
    const data = await fetchJson(url);
    return data?.post_stream?.posts || data?.posts || [];
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`请求失败 ${response.status}：${url}`);
    }

    return response.json();
  }

  function selectPosts(posts, range) {
    const selected = posts.filter((post) => {
      if (!post || !post.post_number) return false;
      if (!range.postNumbers) return true;
      return range.postNumbers.has(post.post_number);
    });

    return selected.sort((a, b) => a.post_number - b.post_number);
  }

  function buildMarkdown({ topic, topicInfo, posts, exportMode, range }) {
    const skipped = [];
    const visiblePosts = [];

    for (const post of posts) {
      const body = htmlToMarkdown(post.cooked || "").trim();
      if (!body) {
        skipped.push(post.post_number);
      } else {
        visiblePosts.push({ post, body });
      }
    }

    const lines = [
      `# ${escapeMarkdownLine(topic.title)}`,
      "",
      `- 原始链接: ${topicInfo.originalUrl}`,
      `- 导出模式: ${exportMode}`,
      `- 导出时间: ${new Date().toLocaleString()}`,
      `- 楼层范围: ${range.label || "all"}`,
      "",
      "---",
      "",
    ];

    if (exportMode === "nest") {
      lines.push(renderNestedPosts(visiblePosts, topicInfo));
    } else {
      lines.push(renderFlatPosts(visiblePosts, topicInfo));
    }

    if (skipped.length) {
      lines.push("", "---", "", `跳过空白/不可见楼层: ${skipped.join(", ")}`, "");
    }

    return normalizeMarkdown(lines.join("\n"));
  }

  function renderFlatPosts(items, topicInfo) {
    return items.map(({ post, body }) => {
      return [
        `## #${post.post_number} ${formatAuthor(post)}`,
        "",
        renderPostMeta(post, topicInfo),
        "",
        body,
        "",
      ].join("\n");
    }).join("\n");
  }

  function renderNestedPosts(items, topicInfo) {
    const byNumber = new Map(items.map((item) => [item.post.post_number, { ...item, children: [] }]));
    const roots = [];
    const outOfRangeParents = [];

    const mainPostNode = byNumber.get(1);

    for (const node of byNumber.values()) {
      const parentNumber = Number(node.post.reply_to_post_number || 0);
      if (parentNumber && byNumber.has(parentNumber)) {
        byNumber.get(parentNumber).children.push(node);
      } else if (parentNumber && !byNumber.has(parentNumber)) {
        outOfRangeParents.push(node);
      } else if (mainPostNode && node.post.post_number !== 1) {
        mainPostNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    for (const node of byNumber.values()) {
      node.children.sort((a, b) => a.post.post_number - b.post.post_number);
    }

    roots.sort((a, b) => a.post.post_number - b.post.post_number);
    outOfRangeParents.sort((a, b) => a.post.post_number - b.post.post_number);

    const lines = [];
    for (const root of roots) {
      renderNestedNode(root, topicInfo, 2, lines);
    }

    if (outOfRangeParents.length) {
      lines.push("## 范围外父级回复", "");
      for (const node of outOfRangeParents) {
        renderNestedNode(node, topicInfo, 3, lines);
      }
    }

    return lines.join("\n");
  }

  function renderNestedNode(node, topicInfo, depth, lines) {
    const level = Math.min(depth, 6);
    lines.push(`${"#".repeat(level)} #${node.post.post_number} ${formatAuthor(node.post)}`);
    lines.push("");
    lines.push(renderPostMeta(node.post, topicInfo));
    lines.push("");
    lines.push(node.body);
    lines.push("");

    for (const child of node.children) {
      renderNestedNode(child, topicInfo, depth + 1, lines);
    }
  }

  function renderPostMeta(post, topicInfo) {
    const parts = [
      `作者: ${formatAuthor(post)}`,
      `时间: ${formatDate(post.created_at)}`,
      `链接: ${makePostUrl(topicInfo, post.post_number)}`,
    ];

    if (post.reply_to_post_number) {
      parts.push(`回复: #${post.reply_to_post_number}`);
    }

    return parts.map((part) => `- ${part}`).join("\n");
  }

  function formatAuthor(post) {
    const display = post.display_username || post.name || post.username || "unknown";
    return post.username && post.username !== display ? `${display} (@${post.username})` : display;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function makePostUrl(topicInfo, postNumber) {
    return `${topicInfo.origin}/${topicInfo.viewToken}/topic/${topicInfo.id}/${postNumber}`;
  }

  function htmlToMarkdown(html) {
    const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    return normalizeMarkdown(renderChildren(root, { listDepth: 0 }).trim());
  }

  function renderChildren(node, context) {
    return [...node.childNodes].map((child) => renderNode(child, context)).join("");
  }

  function renderNode(node, context) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue.replace(/\s+/g, " ");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const text = () => renderChildren(node, context).trim();
    const block = (content) => `\n\n${content.trim()}\n\n`;

    switch (tag) {
      case "br":
        return "\n";
      case "p":
        return block(text());
      case "strong":
      case "b":
        return `**${text()}**`;
      case "em":
      case "i":
        return `*${text()}*`;
      case "code":
        if (node.closest("pre")) return node.textContent || "";
        return `\`${(node.textContent || "").replace(/`/g, "\\`")}\``;
      case "pre": {
        const code = node.textContent.replace(/\n+$/, "");
        return `\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
      }
      case "blockquote": {
        const content = normalizeMarkdown(text());
        return block(content.split("\n").map((line) => `> ${line}`.trimEnd()).join("\n"));
      }
      case "a": {
        const href = node.getAttribute("href");
        const label = text() || href || "";
        if (!href) return label;
        return `[${escapeMarkdownLinkText(label)}](${absoluteUrl(href)})`;
      }
      case "img": {
        const src = node.getAttribute("src");
        if (!src) return "";
        const alt = node.getAttribute("alt") || node.getAttribute("title") || "image";
        return `![${escapeMarkdownLinkText(alt)}](${absoluteUrl(src)})`;
      }
      case "ul":
      case "ol":
        return renderList(node, context, tag === "ol");
      case "li":
        return text();
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const level = Number(tag.slice(1)) + 1;
        return block(`${"#".repeat(Math.min(level, 6))} ${text()}`);
      }
      case "div":
      case "section":
      case "article":
      case "aside":
        return block(text());
      case "span":
        return text();
      default:
        return text();
    }
  }

  function renderList(node, context, ordered) {
    const depth = context.listDepth || 0;
    const lines = [];
    let index = 1;

    for (const child of [...node.children].filter((element) => element.tagName.toLowerCase() === "li")) {
      const marker = ordered ? `${index}.` : "-";
      const prefix = "  ".repeat(depth) + marker + " ";
      const rendered = renderChildren(child, { ...context, listDepth: depth + 1 }).trim();
      const [firstLine, ...restLines] = rendered.split("\n");
      lines.push(prefix + firstLine);
      for (const line of restLines) {
        lines.push("  ".repeat(depth + 1) + line);
      }
      index += 1;
    }

    return `\n${lines.join("\n")}\n`;
  }

  function absoluteUrl(value) {
    try {
      return new URL(value, location.origin).href;
    } catch {
      return value;
    }
  }

  function escapeMarkdownLine(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function escapeMarkdownLinkText(value) {
    return String(value || "").replace(/]/g, "\\]").replace(/\s+/g, " ").trim();
  }

  function normalizeMarkdown(markdown) {
    return markdown
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim()
      + "\n";
  }

  function makeFilename(topicId, mode, title) {
    const safeTitle = String(title || "topic")
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "topic";

    return `linuxdo-${topicId}-${mode}-${safeTitle}.md`;
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    if (typeof GM_download === "function") {
      GM_download({
        url,
        name: filename,
        saveAs: true,
        ontimeout: () => fallbackDownload(url, filename),
        onerror: () => fallbackDownload(url, filename),
        onload: () => setTimeout(() => URL.revokeObjectURL(url), 3000),
      });
      return;
    }

    fallbackDownload(url, filename);
  }

  function fallbackDownload(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function chunkArray(values, size) {
    const chunks = [];
    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size));
    }
    return chunks;
  }

  injectButton();

  let previousUrl = location.href;
  setInterval(() => {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      const existing = document.getElementById(BUTTON_ID);
      if (existing) existing.remove();
      injectButton();
    }
  }, 1000);
})();
