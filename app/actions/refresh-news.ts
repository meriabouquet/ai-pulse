"use server";

import { revalidatePath } from "next/cache";
import { ingestNews } from "@/lib/ingest";

export async function refreshNews() {
  await ingestNews();
  revalidatePath("/");
}
