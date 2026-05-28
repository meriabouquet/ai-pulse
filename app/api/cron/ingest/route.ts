import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestNews } from "@/lib/ingest";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (secret && token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ingestNews();
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    result
  });
}
