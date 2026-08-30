import Link from "next/link";
import { notFound } from "next/navigation";

import { BookReader } from "@/components/books/book-reader";
import { getStudyBook } from "@/lib/books";

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  return { title: getStudyBook(bookId)?.title ?? "Book" };
}

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = getStudyBook(bookId);
  if (!book) notFound();

  return <div className="mx-auto max-w-7xl"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><Link href="/books" className="text-sm text-[#e5b85c] hover:text-[#f1cf7c]">← Back to bookshelf</Link><p className="eyebrow mt-6">{book.level} · reference</p><h1 className="mt-2 text-3xl font-medium text-[#f5f5f2]">{book.title}</h1><p className="mt-1 jp-serif text-lg text-[#e5b85c]">{book.subtitle}</p></div><a href={`/api/books/${book.id}`} target="_blank" rel="noreferrer" className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">Open in new tab ↗</a></div><BookReader book={book} /></div>;
}
