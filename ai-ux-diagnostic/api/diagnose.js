const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestBuckets = globalThis.__uxDiagnosisBuckets ?? new Map();
globalThis.__uxDiagnosisBuckets = requestBuckets;

const SYSTEM_PROMPT = `你是一名资深互联网产品体验分析专家，负责分析用户提供的产品截图，发现其中可能影响用户理解、操作和任务完成的体验问题。

你的定位是“辅助问题发现”，不是代替产品经理或体验专家做最终判断。分析结果必须有明确证据，能定位到具体页面元素，判断过程可解释，结论可由人工复核，不把猜测包装成事实。

分析依据：
1. 尼尔森十大可用性原则：系统状态可见、系统与现实世界匹配、用户控制与自由、一致性与标准、错误预防、识别优于回忆、灵活性与使用效率、简洁且美观、帮助用户识别诊断和恢复错误、帮助与文档。
2. 通用交互规范和输入材料中的可观察证据。
3. 当前未提供内部体验质量模型、体验红线或业务规则，不得自行编造内部规则或假设页面违反内部规范。

分析要求：
- 仅分析截图中能够直接观察的问题；不得根据单张截图推测完整流程、后台故障或尚未发生的风险。
- 不得将个人审美偏好直接判定为体验问题，不得编造按钮、文案、页面状态、用户行为或系统反馈。
- 只有同时存在可定位证据、可说明的原则或规范、以及对用户理解、操作效率、任务完成、错误风险或信任的具体影响时才输出问题。
- 一个问题只描述一个主要根因；合并重复问题；最多输出 5 个证据相对充分且对当前任务影响最大的问题。
- 不得为了保证有结果而强行生成问题；没有证据充分的问题时返回空数组。

严重程度只能为“高”“中”“低”：
- 高：阻断核心任务，或可能造成数据丢失、隐私安全、资金、不可逆操作等严重风险。
- 中：任务仍可完成，但需要明显绕行、额外理解或重复操作，或关键反馈、状态、信息表达不清。
- 低：不阻断任务，但存在可验证的局部文案、布局、层级或效率问题，不包括单纯审美偏好。

问题位置必须包含可供人工复核的客观证据。解决建议必须对应根因、具备可执行性，且不能在缺少业务背景时擅自改变产品策略。置信度使用 0 到 1 的数字，保留两位小数，表示当前材料支持该判断的程度，不代表严重程度。

只输出合法 JSON，不要输出 Markdown、分析过程、开场白、总结或其他解释。`;

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
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.find((item) => item?.type === "text" && typeof item.text === "string")?.text || "";
  }
  return "";
}

function cleanText(value, fallback, maxLength = 240) {
  const text = String(value || "").trim();
  return (text || fallback).slice(0, maxLength);
}

function normalizeSeverity(value) {
  const severity = String(value || "").trim().toLowerCase();
  if (["高", "high"].includes(severity)) return "high";
  if (["低", "low"].includes(severity)) return "low";
  return "medium";
}

function normalizeResult(result) {
  const source = Array.isArray(result) ? result : result?.issues;
  const issues = Array.isArray(source) ? source : [];
  return issues.slice(0, 5).filter((issue) => issue && typeof issue === "object").map((issue) => {
    const theoryValue = issue.theoretical_basis ?? issue.theory;
    const theory = Array.isArray(theoryValue)
      ? theoryValue.map((item) => cleanText(item, "", 80)).filter(Boolean).slice(0, 4)
      : [cleanText(theoryValue, "", 80)].filter(Boolean);
    return {
      title: cleanText(issue.problem_title ?? issue.title, "未命名体验问题", 48),
      severity: normalizeSeverity(issue.severity),
      location: cleanText(issue.problem_location ?? issue.location, "当前材料无法进一步定位", 180),
      description: cleanText(issue.problem_description ?? issue.description, "模型未返回完整问题描述", 300),
      suggestion: cleanText(issue.solution ?? issue.suggestion, "建议结合业务背景进行人工复核", 300),
      confidence: Math.min(1, Math.max(0, Number(issue.confidence) || 0)),
      reason: cleanText(issue.reasoning ?? issue.reason, "模型未返回完整判断理由", 300),
      theory,
    };
  });
}

function buildUserPrompt(input) {
  return `本次用户任务：${input.task || "未提供；仅分析截图中的可观察证据，不推测完整操作流程"}
页面名称：${input.pageName}
内部体验质量模型：未提供
体验红线与业务规则：未提供
补充业务背景：未提供

请输出一个 JSON 对象，结构为：
{"issues":[{"problem_title":"不超过20个汉字","problem_description":"客观现象及用户影响","severity":"高/中/低","problem_location":"具体页面区域、控件、可见文案和可复核证据","solution":"与问题根因对应的可执行建议","confidence":0.00,"reasoning":"从客观证据到问题结论的判断逻辑","theoretical_basis":["直接相关的尼尔森原则或通用交互规范"]}]}

问题位置仅使用清晰的文本描述，不输出坐标。描述中应包含页面区域、控件或可见文案等可供人工复核的证据。没有发现证据充分的问题时输出 {"issues":[]}。生成前检查证据、位置、用户影响、严重程度、建议、理论依据、重复问题和 JSON 合法性。`;
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    return json(response, 200, {
      status: process.env.DASHSCOPE_API_KEY ? "ready" : "configuration_required",
      provider: "qwen",
    });
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return json(response, 405, { message: "仅支持 POST 请求" });
  }

  if (!process.env.DASHSCOPE_API_KEY) {
    return json(response, 503, {
      code: "MODEL_NOT_CONFIGURED",
      message: "真实 AI 尚未配置，请先在 Vercel 添加 DASHSCOPE_API_KEY",
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

  const model = process.env.QWEN_MODEL || "qwen3-vl-flash";
  const baseUrl = (process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const apiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: input.image }, max_pixels: 2621440 },
              { type: "text", text: buildUserPrompt(input) },
            ],
          },
        ],
        response_format: { type: "json_object" },
        enable_thinking: false,
        max_tokens: 3500,
      }),
      signal: controller.signal,
    });

    const payload = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      const upstreamMessage = payload.error?.message || payload.message || "千问请求失败";
      if (apiResponse.status === 401) return json(response, 503, { message: "百炼 API Key 无效、地域不匹配或已失效" });
      if (apiResponse.status === 429) return json(response, 429, { message: "千问当前额度不足或请求过于频繁" });
      return json(response, 502, { message: upstreamMessage.slice(0, 180) });
    }

    const outputText = extractOutputText(payload);
    if (!outputText) throw new Error("模型未返回结构化诊断结果");
    const result = JSON.parse(outputText);
    return json(response, 200, { model, issues: normalizeResult(result) });
  } catch (error) {
    const message = error.name === "AbortError" ? "模型分析超时，请稍后重试" : error.message;
    return json(response, 502, { message: message || "真实诊断暂不可用" });
  } finally {
    clearTimeout(timeout);
  }
}
