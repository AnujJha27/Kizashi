import { NextResponse } from "next/server";

import { getAllowedUser } from "@/lib/auth/guard";
import { getStudyBook } from "@/lib/books";
import { getBookStoragePartPaths, getBookStoragePath } from "@/lib/supabase/book-storage-core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const STORAGE_BUCKET = process.env.SUPABASE_BOOKS_BUCKET ?? "books";
const SIGNED_URL_SECONDS = 60 * 60;

export async function GET(_request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = getStudyBook(bookId);
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const user = await getAllowedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (user.isDemo || !isSupabaseConfigured() || !(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)) return NextResponse.json({ error: "Remote book storage is not configured." }, { status: 503 });

  const supabase = createSupabaseAdminClient();
  const pathSets = [getBookStoragePartPaths(book), [getBookStoragePath(book)].filter((value): value is string => Boolean(value))];
  if (!supabase || !pathSets.some((paths) => paths.length)) return NextResponse.json({ error: "Book storage path is invalid." }, { status: 500 });

  let parts: string[] = [];
  for (const paths of pathSets) {
    if (!paths.length) continue;
    const next: string[] = [];
    let failed = false;
    for (const path of paths) {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
      if (error || !data?.signedUrl) { failed = true; break; }
      next.push(data.signedUrl);
    }
    if (!failed) { parts = next; break; }
  }
  if (!parts.length) return NextResponse.json({ error: "Book file is unavailable." }, { status: 404 });

  return NextResponse.json({ parts }, { headers: { "Cache-Control": "private, max-age=300" } });
}
