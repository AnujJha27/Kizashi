import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";

import { getAllowedUser } from "@/lib/auth/guard";
import { getStudyBook } from "@/lib/books";
import { getBookStoragePartPaths, getBookStoragePath } from "@/lib/supabase/book-storage-core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const STORAGE_BUCKET = process.env.SUPABASE_BOOKS_BUCKET ?? "books";
const SIGNED_URL_SECONDS = 60 * 60;

async function driveBookResponse(book: NonNullable<ReturnType<typeof getStudyBook>>) {
  const token = (await cookies()).get("kizashi_drive_token")?.value;
  if (!token) return null;
  const name = book.filePath.split("/").at(-1);
  if (!name) return null;
  const escapedName = name.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  const params = new URLSearchParams({
    q: `name = '${escapedName}' and mimeType = 'application/pdf' and trashed = false`,
    fields: "files(id,name,mimeType)",
    orderBy: "modifiedTime desc",
    pageSize: "1",
  });
  let listing: Response;
  try {
    listing = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!listing.ok) return null;
  const payload = await listing.json() as { files?: Array<{ id?: string }> };
  const fileId = payload.files?.[0]?.id;
  if (!fileId) return null;
  let file: Response;
  try {
    file = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!file.ok || !file.body) return null;
  return new Response(file.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${book.id}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

async function remoteBookResponse(book: NonNullable<ReturnType<typeof getStudyBook>>) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return new Response("Book storage is not configured.", { status: 503 });

  const pathSets = [getBookStoragePartPaths(book), [getBookStoragePath(book)].filter((value): value is string => Boolean(value))];
  let signedUrls: string[] = [];
  for (const paths of pathSets) {
    if (!paths.length) continue;
    const next: string[] = [];
    let failed = false;
    for (const storagePath of paths) {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(storagePath, SIGNED_URL_SECONDS);
      if (error || !data?.signedUrl) { failed = true; break; }
      next.push(data.signedUrl);
    }
    if (!failed) { signedUrls = next; break; }
  }
  if (!signedUrls.length) return new Response("Book file is unavailable.", { status: 404 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const signedUrl of signedUrls) {
          const response = await fetch(signedUrl);
          if (!response.ok || !response.body) throw new Error("Book part unavailable");
          const reader = response.body.getReader();
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            controller.enqueue(chunk.value);
          }
        }
        controller.close();
      } catch {
        controller.error(new Error("Book file is unavailable."));
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${book.id}.pdf"`, "Cache-Control": "private, max-age=300" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = getStudyBook(bookId);
  if (!book) return new Response("Book not found.", { status: 404 });

  const user = await getAllowedUser();
  if (!user) return new Response("Unauthorized.", { status: 401 });
  const hasStorageKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!user.isDemo && isSupabaseConfigured() && hasStorageKey) {
    try {
      const remote = await remoteBookResponse(book);
      if (remote.ok) return remote;
    } catch {
      // Try the authenticated Drive fallback below.
    }
  }

  const drive = await driveBookResponse(book);
  if (drive) return drive;

  try {
    const file = await readFile(path.join(process.cwd(), book.filePath));
    return new Response(new Uint8Array(file), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${book.id}.pdf"`, "Content-Length": String(file.byteLength), "Cache-Control": "private, max-age=300" } });
  } catch {
    return new Response("Book file is unavailable.", { status: 404 });
  }
}
