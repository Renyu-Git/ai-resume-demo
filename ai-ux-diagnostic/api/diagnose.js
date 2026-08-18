const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestBuckets = globalThis.__uxDiagnosisBuckets ?? new Map();
globalThis.__uxDiagnosisBuckets = requestBuckets;

const diagnosisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["issues"],
  properties: {
    issues: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "severity",
          "location",
          "description",
          "suggestion",
          "confidence",
          "reason",
          "theory",
          "evidence",
        ],
        properties: {
          title: { type: "string", minLength: 4, maxLength: 48 },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          location: { type: "string", minLength: 4, maxLength: 100 },
          description: { type: "string", minLength: 12, maxLength: 220 },
          suggestion: { type: "string", minLength: 12, maxLength: 220 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reason: { type: "string", minLength: 12, maxLength: 220 },
          theory: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: { type: "string", minLength: 2, maxLength: 40 },
          },
          evidence: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y", "width", "height"],
            properties: {
              x: { type: "number", minimum: 0, maximum: 1 },
              y: { type: "number", minimum: 0, maximum: 1 },
              width: { type: "number", minimum: 0.05, maximum: 1 },
              height: { type: "number", minimum: 0.05, maximum: 1 },
            },
          },
        },
      },
    },
  },
};

function json(response, status, payload) {
  response.status(status);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.send(JSON.stringify(payload));
}

function getClientKey(request) {
  const forwarded = request.headers["x-vercel-forwarded-for"] || request.headers["x-forwarded-for"];
  return String(forwarded || "anonymous").split(",")[0].trim();
}

function isRateLimited(clientKey) {
  const now = Date.now();
  const current = requestBuckets.get(clientKey);
  if (!current || now - current.startedAt > WINDOW_MS) {
    requestBuckets.set(clientKey, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function parseBody(request) {
  if (typeof request.body === "string") return JSON.parse(request.body);
  return request.body ?? {};
}

function validateInput(body) {
  const pageName = String(body.pageName || "").trim().slice(0, 80);
  const task = String(body.task || "").trim().slice(0, 300);
  const image = String(body.image || "");
  if (!pageName) throw new Error("请填写页面名称");
  if (!/^data:image\/(png|jpeg|webp);base64,/i.test(image)) {
    throw new Error("仅支持 PNG、JPEG 或 WebP 图片");
  }
  if (image.length > 5.6 * 1024 * 1024) {
    throw new Error("图片不能超过 4 MB");
  }
  return { pageName, task, image };
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
      if (content.type === "refusal") throw new Error("模型无法分析这张图片，请更换无敏感内容的产品截图");
    }
  }
  return "";
}

function normalizeResult(result) {
  const issues = Array.isArray(result.issues) ? result.issues : [];
  return issues.slice(0, 5).map((issue) => {
    const evidence = issue.evidence || {};
    const x = Math.min(0.95, Math.max(0, Number(evidence.x) || 0));
    const y = Math.min(0.95, Math.max(0, Number(evidence.y) || 0));
    return {
      ...issue,
      confidence: Math.min(1, Math.max(0, Number(issue.confidence) || 0)),
      evidence: {
        x,
        y,
        width: Math.min(1 - x, Math.max(0.05, Number(evidence.width) || 0.2)),
        height: Math.min(1 - y, Math.max(0.05, Number(evidence.height) || 0.12)),
      },
    };
  });
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    return json(response, 200, {
      status: process.env.OPENAI_API_KEY ? "ready" : "configuration_required",
    });
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return json(response, 405, { message: "仅支持 POST 请求" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(response, 503, {
      code: "MODEL_NOT_CONFIGURED",
      message: "真实 AI 尚未配置，请先在 Vercel 添加 OPENAI_API_KEY",
    });
  }

  if (isRateLimited(getClientKey(request))) {
    return json(response, 429, { message: "诊断请求过于频繁，请 10 分钟后再试" });
  }

  let input;
  try {
    input = validateInput(parseBody(request));
  } catch (error) {
    return json(response, 400, { message: error.message || "请求内容无效" });
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `你是一名严格、克制的高级用户体验评估专家。请诊断这张“${input.pageName}”截图。\n用户核心任务：${input.task || "未提供，请从页面主要信息谨慎推断"}\n\n要求：\n1. 只报告截图中有明确视觉证据的问题，优先输出 1–5 个高价值问题，不要为了凑数重复表达。\n2. location 必须说明证据所在的具体页面区域；evidence 使用相对整张截图的 0–1 归一化坐标，x/y 为左上角，框选范围尽量紧贴证据。\n3. severity：high 表示阻碍核心任务或有明显误操作风险；medium 表示显著增加理解/操作成本；low 表示局部改进。\n4. suggestion 必须具体、可执行，并对应问题原因。\n5. theory 仅引用真正适用的 UX 原则；confidence 反映你对视觉证据的把握。\n6. 使用简体中文，避免空泛表述，不分析图片水印或截图工具本身。`,
              },
              { type: "input_image", image_url: input.image, detail: "high" },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ux_diagnosis",
            strict: true,
            schema: diagnosisSchema,
          },
        },
        max_output_tokens: 5000,
      }),
      signal: controller.signal,
    });

    const payload = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      const upstreamMessage = payload.error?.message || "OpenAI 请求失败";
      if (apiResponse.status === 401) return json(response, 503, { message: "OpenAI API Key 无效或已失效" });
      if (apiResponse.status === 429) return json(response, 429, { message: "OpenAI 当前额度不足或请求过于频繁" });
      return json(response, 502, { message: upstreamMessage.slice(0, 180) });
    }

    const outputText = extractOutputText(payload);
    if (!outputText) throw new Error("模型未返回结构化诊断结果");
    const result = JSON.parse(outputText);
    const issues = normalizeResult(result);
    if (issues.length === 0) throw new Error("模型未发现可验证的体验问题");
    return json(response, 200, { model, issues });
  } catch (error) {
    const message = error.name === "AbortError" ? "模型分析超时，请稍后重试" : error.message;
    return json(response, 502, { message: message || "真实诊断暂不可用" });
  } finally {
    clearTimeout(timeout);
  }
}

