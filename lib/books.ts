export type StudyBookChapter = { id: string; title: string; page: number };

export type StudyBook = {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  filePath: string;
  storagePath?: string;
  storagePartCount?: number;
  description: string;
  chapters?: StudyBookChapter[];
};

export const studyBooks: StudyBook[] = [
  {
    id: "genki-i",
    title: "Genki I",
    subtitle: "An Integrated Course in Elementary Japanese · 2nd edition",
    level: "N5 · beginner",
    filePath: "N5-books/Study Material N5/Genki - An Integrated Course in Elementary Japanese I [Second Edition] (2011), WITH PDF BOOKMARKS!.pdf",
    storagePath: "books/genki-i.pdf",
    storagePartCount: 3,
    description: "A structured beginner reference for grammar, conversations, and guided practice.",
    chapters: [
      { id: "genki-1", title: "1 · New Friends", page: 38 },
      { id: "genki-2", title: "2 · Shopping", page: 58 },
      { id: "genki-3", title: "3 · Making a Date", page: 84 },
      { id: "genki-4", title: "4 · The First Date", page: 102 },
      { id: "genki-5", title: "5 · A Trip to Okinawa", page: 128 },
      { id: "genki-6", title: "6 · A Day in Robert's Life", page: 146 },
      { id: "genki-7", title: "7 · Family Picture", page: 166 },
      { id: "genki-8", title: "8 · Barbecue", page: 186 },
      { id: "genki-9", title: "9 · Kabuki", page: 208 },
      { id: "genki-10", title: "10 · Winter Vacation Plans", page: 228 },
      { id: "genki-11", title: "11 · After the Vacation", page: 250 },
      { id: "genki-12", title: "12 · Feeling III", page: 266 },
    ],
  },
  {
    id: "goukaku-dekiru",
    title: "Goukaku Dekiru N4.5",
    subtitle: "Grammar and vocabulary reference",
    level: "N5 → N4",
    filePath: "N5-books/Study Material N5/Goukaku_Dekiru_N4.5.pdf",
    storagePath: "books/goukaku-dekiru.pdf",
    storagePartCount: 5,
    description: "A preparation reference for extending the beginner path toward N4.",
  },
  {
    id: "nihongo-challenge-kanji",
    title: "Nihongo Challenge Kanji",
    subtitle: "N4–N5 character practice",
    level: "N5 · kanji",
    filePath: "N5-books/Study Material N5/Nihongo_Challenge_Kanji_N4-N5.pdf",
    storagePath: "books/nihongo-challenge-kanji.pdf",
    storagePartCount: 5,
    description: "A kanji-focused reference to use beside Kizashi recall drills.",
  },
];

export function getStudyBook(id: string) {
  return studyBooks.find((book) => book.id === id) ?? null;
}
