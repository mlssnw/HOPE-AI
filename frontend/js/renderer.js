import { tokenizeInline, safeUrl } from "./renderer-core.js";

function appendInline(parent, text) {
  for (const token of tokenizeInline(text)) {
    if (token.type === "text") parent.append(document.createTextNode(token.value));
    else if (token.type === "link") {
      const link = document.createElement("a");
      link.textContent = token.value;
      link.href = token.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      parent.append(link);
    } else {
      const tag = token.type === "strong" ? "strong" : token.type === "em" ? "em" : "code";
      const element = document.createElement(tag);
      element.textContent = token.value;
      parent.append(element);
    }
  }
}

export function renderMarkdown(container, source) {
  const fragment = document.createDocumentFragment();
  const lines = String(source || "").replaceAll("\u0000", "").split("\n");
  let list = null;
  let code = null;

  const closeList = () => { list = null; };
  const paragraph = (text, tag = "p") => {
    closeList();
    const element = document.createElement(tag);
    appendInline(element, text);
    fragment.append(element);
  };

  for (const raw of lines) {
    if (raw.startsWith("```")) {
      closeList();
      if (code) {
        const pre = document.createElement("pre");
        const element = document.createElement("code");
        element.textContent = code.join("\n");
        pre.append(element);
        fragment.append(pre);
        code = null;
      } else code = [];
      continue;
    }
    if (code) { code.push(raw); continue; }
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { paragraph(heading[2], `h${heading[1].length}`); continue; }
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      if (!list) { list = document.createElement("ul"); fragment.append(list); }
      const li = document.createElement("li"); appendInline(li, item[1]); list.append(li); continue;
    }
    if (line.startsWith("> ")) { paragraph(line.slice(2), "blockquote"); continue; }
    paragraph(line);
  }
  if (code) {
    const pre = document.createElement("pre"); const element = document.createElement("code");
    element.textContent = code.join("\n"); pre.append(element); fragment.append(pre);
  }
  container.replaceChildren(fragment);
}

export function renderPlainText(container, source) {
  container.textContent = String(source || "");
}

export function renderSources(panel, list, sources) {
  list.replaceChildren();
  for (const source of sources || []) {
    const item = document.createElement("li");
    const url = safeUrl(source.reference);
    if (url) {
      const link = document.createElement("a");
      link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = source.title; item.append(link);
    } else item.textContent = source.title;
    list.append(item);
  }
  panel.hidden = !list.children.length;
}
