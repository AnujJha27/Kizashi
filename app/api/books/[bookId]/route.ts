import { readFile } from "node:fs/promises";
import path from "node:path";

import { getAllowedUser } from "@/lib/auth/guard";
import { getStudyBook } from "@/lib/books";
import { getBookStoragePartPath, getBookStoragePath } from "@/lib/supabase/book-storage-core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const STORAGE_BUCKET = process.env.SUPABASE_BOOKS_BUCKET ?? "books";
const SIGNED_URL_SECONDS = 60 * 60;

async function remoteBookResponse(book: NonNullable<ReturnType<typeof getStudyBook>>) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return new Response("Book storage is not configured.", { status: 503 });

  const paths = book.storagePartCount
    ? Array.from({ length: book.storagePartCount }, (_, index) => getBookStoragePartPath(book, index))
    : [getBookStoragePath(book)];
  if (paths.some((storagePath) => !storagePath)) return new Response("Book storage path is invalid.", { status: 500 });

  const signedUrls: string[] = [];
  for (const storagePath of paths) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(storagePath!, SIGNED_URL_SECONDS);
    if (error || !data?.signedUrl) return new Response("Book file is unavailable.", { status: 404 });
    signedUrls.push(data.signedUrl);
  }

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
  if (!user.isDemo && isSupabaseConfigured() && hasStorageKey) return remoteBookResponse(book);

  try {
    const file = await readFile(path.join(process.cwd(), book.filePath));
    return new Response(new Uint8Array(file), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${book.id}.pdf"`, "Content-Length": String(file.byteLength), "Cache-Control": "private, max-age=300" } });
  } catch {
    return new Response("Book file is unavailable.", { status: 404 });
  }
}
