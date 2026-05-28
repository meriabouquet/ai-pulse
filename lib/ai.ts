import OpenAI from "openai";
import { z } from "zod";
import { stripHtml } from "./utils";

const summarySchema = z.object({
  summary: z.array(z.string()).length(3),
  tags: z.array(z.string()).min(2).max(6),
  category: z.string().min(2).max(40),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  importance: z.number().int().min(1).max(100)
});

export type SummaryResult = z.infer<typeof summarySchema>;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function summarizeArticle(input: {
  title: string;
  source: string;
  url: string;
  content?: string | null;
}): Promise<SummaryResult> {
  if (!openai) {
    return fallbackSummary(input);
  }

  const content = stripHtml(input.content ?? "").slice(0, 5000);
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize AI news for Japanese SaaS readers. Return valid JSON only."
        },
        {
          role: "user",
          content: [
            "次の記事を日本語で整理してください。",
            "JSON形式: {\"summary\":[\"3行の要約1\",\"要約2\",\"要約3\"],\"tags\":[\"tag\"],\"category\":\"category\",\"difficulty\":\"BEGINNER|INTERMEDIATE|ADVANCED\",\"importance\":1-100}",
            `Title: ${input.title}`,
            `Source: ${input.source}`,
            `URL: ${input.url}`,
            `Content: ${content}`
          ].join("\n")
        }
      ]
    });

    const raw = completion.choices[0]?.message.content;
    const parsed = summarySchema.safeParse(JSON.parse(raw ?? "{}"));
    if (!parsed.success) {
      return fallbackSummary(input);
    }

    return {
      ...parsed.data,
      tags: parsed.data.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 6)
    };
  } catch (error) {
    console.error("OpenAI summary failed", error);
    return fallbackSummary(input);
  }
}

function fallbackSummary(input: {
  title: string;
  source: string;
  content?: string | null;
}): SummaryResult {
  const text = stripHtml(input.content ?? input.title);
  const firstSentence = text.split(/[.!?。！？]/).find(Boolean)?.trim() ?? input.title;

  return {
    summary: [
      `${input.source} が公開したAI関連ニュースです。`,
      firstSentence.slice(0, 120),
      "詳細は元記事で確認してください。"
    ],
    tags: inferTags(`${input.title} ${text}`),
    category: "AI News",
    difficulty: "INTERMEDIATE",
    importance: 50
  };
}

function inferTags(value: string) {
  const lower = value.toLowerCase();
  const tags = [
    ["OpenAI", "openai"],
    ["Anthropic", "anthropic"],
    ["Google", "google"],
    ["Meta", "meta"],
    ["LLM", "llm"],
    ["Agent", "agent"],
    ["Research", "research"],
    ["Product", "launch"],
    ["Policy", "regulation"]
  ]
    .filter(([, needle]) => lower.includes(needle))
    .map(([tag]) => tag);

  return tags.length > 0 ? tags.slice(0, 6) : ["AI", "News"];
}
