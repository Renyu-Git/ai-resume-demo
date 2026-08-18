const MAX_REPORT_LENGTH = 100_000;

function parseBody(request) {
  if (typeof request.body === "string") {
    return Object.fromEntries(new URLSearchParams(request.body));
  }
  return request.body ?? {};
}

function safeFilename(value) {
  const name = String(value || "体验诊断报告.md")
    .replace(/[\\/:*?"<>|\r\n]+/g, "-")
    .trim()
    .slice(0, 100);
  return name.endsWith(".md") ? name : `${name || "体验诊断报告"}.md`;
}

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).send("仅支持 POST 请求");
  }

  const body = parseBody(request);
  const content = String(body.content || "");
  if (!content || content.length > MAX_REPORT_LENGTH) {
    return response.status(400).send("报告内容无效");
  }

  const filename = safeFilename(body.filename);
  response.setHeader("Content-Type", "text/markdown; charset=utf-8");
  response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).send(content);
}
