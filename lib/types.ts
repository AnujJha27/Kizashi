export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1" | null;

export type LearningCategory =
  | "vocabulary"
  | "kanji"
  | "grammar"
  | "reading"
  | "listening";

export type ItemType = LearningCategory;

export type PracticeMode = "quick" | "vocabulary" | "kanji" | "grammar" | "reading" | "listening" | "mixed" | "mock" | "mini" | "section" | "full" | "pass" | "weak";

export type CurriculumBand = "core" | "extended" | "bridge";
export type CurriculumConfidence = "high" | "medium" | "low";
export type ContentReviewStatus = "pending" | "approved" | "rejected";
export type ExamReadinessStatus = "untested" | "weak" | "developing" | "exam-ready" | "strong";

export interface CurriculumClassification {
  itemType: ItemType;
  itemId: string;
  level: Exclude<JLPTLevel, null>;
  band: CurriculumBand;
  confidence: CurriculumConfidence;
  evidenceSources: string[];
  inclusionReason: string;
  reviewedAt: string;
  sourceLevels?: Record<string, Exclude<JLPTLevel, null>>;
  conflictingLevels?: Exclude<JLPTLevel, null>[];
  conflict?: boolean;
}

export interface ExamSkillMastery {
  level: Exclude<JLPTLevel, null>;
  skillType: LearningCategory;
  coverage: number;
  recentAccuracy: number;
  timedAccuracy: number | null;
  retention: number;
  sampleSize: number;
  status: ExamReadinessStatus;
}

export interface JLPTSpecification {
  level: Exclude<JLPTLevel, null>;
  section: string;
  questionType: string;
  testedSkill: LearningCategory;
  approximateFormat: string;
  source: string;
}

export interface ContentSource {
  id: string;
  name: string;
  type: "official" | "dictionary" | "curriculum" | "frequency" | "examples" | "generated" | "user";
  url?: string;
  license?: string;
  retrievedAt?: string;
  notes?: string;
  sha256?: string;
  localFilename?: string;
}

export type ExerciseValidationStatus = "generated" | "validated" | "rejected";
export type AnswerConfidence = "guess" | "unsure" | "confident";
export type PracticeAnswerMode = "choice" | "text";
export type GeneratedContentReviewStatus = "draft" | "approved" | "rejected";

export interface GeneratedContentReview {
  status: GeneratedContentReviewStatus;
  generatedBy: string;
  model: string;
  generatedAt: string;
  targetItemIds: string[];
  validationIssues: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface QuestionStats {
  questionId: string;
  attempts: number;
  correct: number;
  ambiguityReports: number;
  qualityScore: number;
  lastResponseMs?: number | null;
  lastConfidence?: AnswerConfidence | null;
  slowCount?: number;
}

export interface PracticeQuestion {
  id: string;
  itemId: string;
  category: LearningCategory;
  questionType: string;
  jlptLevel: JLPTLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answerMode?: PracticeAnswerMode;
  acceptedAnswers?: string[];
  answerPlaceholder?: string;
  tokens?: string[];
  correctOrder?: number[];
  validationStatus?: ExerciseValidationStatus;
  generatedBy?: string;
  review?: GeneratedContentReview;
  audioUrl?: string | null;
  audioText?: string;
}

export type JourneyNodeStatus = "locked" | "available" | "current" | "learned" | "mastered";

export interface CurriculumMetadata {
  jlptLevel: JLPTLevel;
  category: LearningCategory;
  reviewStatus?: ContentReviewStatus;
  subcategory?: string;
  difficulty: number;
  prerequisiteIds: string[];
  tags: string[];
}

export interface LearningItem extends CurriculumMetadata {
  id: string;
  slug: string;
  title: string;
  sourceIds?: string[];
  fieldSourceIds?: Record<string, string[]>;
  classification?: CurriculumClassification;
}

export interface VocabularyItem extends LearningItem {
  category: "vocabulary";
  writtenForm: string;
  reading: string;
  meanings: string[];
  partOfSpeech: string;
  commonness?: number;
  frequency?: number;
  frequencyMetadata?: Record<string, unknown>;
  spokenFrequency?: number;
  spokenFrequencyMetadata?: Record<string, unknown>;
  exampleSentences: ExampleSentence[];
  collocations: string[];
  relatedWords: string[];
  antonyms: string[];
  notes?: string;
  audioUrl?: string | null;
}

export interface KanjiItem extends LearningItem {
  category: "kanji";
  character: string;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  strokeCount?: number;
  grade?: number;
  radical?: string;
  nanori?: string[];
  components?: string[];
  mnemonic?: string;
  strokeOrder?: string;
  usefulWords: { word: string; reading: string; meaning: string }[];
}

export interface ExampleSentence {
  japanese: string;
  translation: string;
  note?: string;
  sourceId?: string;
  sentenceId?: string;
  translationId?: string;
  license?: string;
}

export interface GrammarItem extends LearningItem {
  category: "grammar";
  pattern: string;
  meaning: string;
  formation: string;
  intuition: string;
  usageConditions: string[];
  examples: ExampleSentence[];
  commonMistakes: string[];
  contrastIds: string[];
  practiceQuestionIds: string[];
}

export interface GrammarContrast {
  id: string;
  title: string;
  grammarPointIds: string[];
  explanation: string;
  examples: ExampleSentence[];
  exercises: string[];
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  itemIds: string[];
}

export interface Chapter {
  id: string;
  slug: string;
  title: string;
  description: string;
  region: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  jlptLevel: JLPTLevel;
  chapters: Chapter[];
}

export interface ReadingItem extends LearningItem {
  category: "reading";
  title: string;
  passage: string;
  translation: string;
  vocabularyIds: string[];
  grammarIds: string[];
  kanjiIds: string[];
  estimatedDifficulty: number;
  questions?: ReadingQuestion[];
}

export interface ReadingQuestion {
  prompt: string;
  options: string[];
  correctAnswer: number;
  questionType?: string;
  explanation?: string;
}

export interface ListeningItem extends LearningItem {
  category: "listening";
  title: string;
  situation: string;
  audioUrl?: string | null;
  voice: string;
  speed: number;
  sourceType: "recorded" | "tts" | "imported";
  transcript: string;
  questions: ListeningQuestion[];
}

export interface ListeningQuestion {
  prompt: string;
  answers: string[];
  correctAnswer: number;
  questionType?: string;
  explanation?: string;
}

export interface N5Module {
  course: Course;
  vocabulary: VocabularyItem[];
  kanji: KanjiItem[];
  grammar: GrammarItem[];
  grammarContrasts: GrammarContrast[];
  readings: ReadingItem[];
  listening: ListeningItem[];
  practiceQuestions?: PracticeQuestion[];
  sourceManifest?: ContentSource[];
}

export interface JourneyNode {
  id: string;
  label: string;
  detail: string;
  kind: "course" | "chapter" | "lesson";
  status: JourneyNodeStatus;
  href?: string;
  itemIds?: string[];
  prerequisiteIds?: string[];
}

export interface CurrentLessonState {
  lessonId: string;
  position: number;
  status: "not_started" | "in_progress" | "complete";
}

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      courses: {
        Row: { id: string; slug: string; title: string; description: string | null; jlpt_level: JLPTLevel };
        Insert: Omit<Database["public"]["Tables"]["courses"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Relationships: [];
      };
      chapters: {
        Row: { id: string; course_id: string; slug: string; title: string; description: string | null; region: string; sort_order: number };
        Insert: Omit<Database["public"]["Tables"]["chapters"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["chapters"]["Row"]>;
        Relationships: [];
      };
      lessons: {
        Row: { id: string; chapter_id: string; slug: string; title: string; subtitle: string; description: string | null; estimated_minutes: number; sort_order: number };
        Insert: Omit<Database["public"]["Tables"]["lessons"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
        Relationships: [];
      };
      learning_items: {
        Row: { id: string; slug: string; item_type: ItemType; jlpt_level: JLPTLevel; subcategory: string | null; difficulty: number; prerequisite_ids: string[]; tags: string[]; review_status: ContentReviewStatus; field_source_ids: unknown };
        Insert: Omit<Database["public"]["Tables"]["learning_items"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["learning_items"]["Row"]>;
        Relationships: [];
      };
      vocabulary: {
        Row: { item_id: string; written_form: string; reading: string; meanings: string[]; part_of_speech: string; commonness: number | null; frequency: number | null; frequency_metadata: unknown; spoken_frequency: number | null; spoken_frequency_metadata: unknown; example_sentences: unknown; collocations: string[]; related_words: string[]; antonyms: string[]; notes: string | null; audio_url: string | null };
        Insert: Omit<Database["public"]["Tables"]["vocabulary"]["Row"], "item_id"> & { item_id: string };
        Update: Partial<Database["public"]["Tables"]["vocabulary"]["Row"]>;
        Relationships: [];
      };
      kanji: {
        Row: { item_id: string; character: string; meanings: string[]; onyomi: string[]; kunyomi: string[]; stroke_count: number | null; grade: number | null; radical: string | null; nanori: string[]; components: string[]; mnemonic: string | null; stroke_order: string | null; useful_words: unknown };
        Insert: Omit<Database["public"]["Tables"]["kanji"]["Row"], "item_id"> & { item_id: string };
        Update: Partial<Database["public"]["Tables"]["kanji"]["Row"]>;
        Relationships: [];
      };
      grammar_points: {
        Row: { item_id: string; pattern: string; meaning: string; formation: string; intuition: string; usage_conditions: string[]; examples: unknown; common_mistakes: string[]; contrast_ids: string[]; practice_question_ids: string[] };
        Insert: Omit<Database["public"]["Tables"]["grammar_points"]["Row"], "item_id"> & { item_id: string };
        Update: Partial<Database["public"]["Tables"]["grammar_points"]["Row"]>;
        Relationships: [];
      };
      grammar_contrasts: {
        Row: { id: string; title: string; grammar_point_ids: string[]; explanation: string; examples: unknown; exercises: string[] };
        Insert: Omit<Database["public"]["Tables"]["grammar_contrasts"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["grammar_contrasts"]["Row"]>;
        Relationships: [];
      };
      readings: {
        Row: { item_id: string; title: string; passage: string; translation: string; vocabulary_ids: string[]; grammar_ids: string[]; kanji_ids: string[]; estimated_difficulty: number };
        Insert: Omit<Database["public"]["Tables"]["readings"]["Row"], "item_id"> & { item_id: string };
        Update: Partial<Database["public"]["Tables"]["readings"]["Row"]>;
        Relationships: [];
      };
      listening_exercises: {
        Row: { item_id: string; title: string; situation: string; audio_url: string | null; voice: string | null; speed: number; source_type: "recorded" | "tts" | "imported"; transcript: string | null; questions: unknown };
        Insert: Omit<Database["public"]["Tables"]["listening_exercises"]["Row"], "item_id"> & { item_id: string };
        Update: Partial<Database["public"]["Tables"]["listening_exercises"]["Row"]>;
        Relationships: [];
      };
      lesson_learning_items: {
        Row: { lesson_id: string; item_id: string; sort_order: number };
        Insert: Database["public"]["Tables"]["lesson_learning_items"]["Row"];
        Update: Partial<Database["public"]["Tables"]["lesson_learning_items"]["Row"]>;
        Relationships: [];
      };
      user_item_progress: {
        Row: { id: string; user_id: string; item_type: ItemType | "lesson"; item_id: string; status: string; mastery_score: number; first_seen_at: string | null; last_seen_at: string | null };
        Insert: Omit<Database["public"]["Tables"]["user_item_progress"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["user_item_progress"]["Row"]>;
        Relationships: [];
      };
      study_sessions: {
        Row: { id: string; user_id: string; lesson_id: string | null; item_ids: string[]; position: number; status: string; started_at: string; completed_at: string | null };
        Insert: Omit<Database["public"]["Tables"]["study_sessions"]["Row"], "id" | "started_at"> & { id?: string; started_at?: string };
        Update: Partial<Database["public"]["Tables"]["study_sessions"]["Row"]>;
        Relationships: [];
      };
      content_sources: {
        Row: { id: string; name: string; source_type: ContentSource["type"]; url: string | null; license: string | null; retrieved_at: string | null; notes: string | null; sha256: string | null; local_filename: string | null };
        Insert: Omit<Database["public"]["Tables"]["content_sources"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["content_sources"]["Row"]>;
        Relationships: [];
      };
      learning_item_sources: {
        Row: { item_id: string; source_id: string };
        Insert: Database["public"]["Tables"]["learning_item_sources"]["Row"];
        Update: Partial<Database["public"]["Tables"]["learning_item_sources"]["Row"]>;
        Relationships: [];
      };
      curriculum_classifications: {
        Row: { item_type: ItemType; item_id: string; level: Exclude<JLPTLevel, null>; band: CurriculumBand; confidence: CurriculumConfidence; evidence_sources: string[]; inclusion_reason: string; reviewed_at: string };
        Insert: Omit<Database["public"]["Tables"]["curriculum_classifications"]["Row"], "reviewed_at"> & { reviewed_at?: string };
        Update: Partial<Database["public"]["Tables"]["curriculum_classifications"]["Row"]>;
        Relationships: [];
      };
      practice_questions: {
        Row: { id: string; item_id: string; category: ItemType; question_type: string; jlpt_level: JLPTLevel; prompt: string; options: unknown; correct_index: number; explanation: string; answer_mode: PracticeAnswerMode; accepted_answers: unknown; tokens: unknown | null; correct_order: unknown | null; audio_url: string | null; audio_text: string | null; validation_status: ExerciseValidationStatus; generated_by: string | null; review_metadata: unknown; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["practice_questions"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["practice_questions"]["Row"]>;
        Relationships: [];
      };
      question_stats: {
        Row: { user_id: string; question_id: string; attempts: number; correct: number; ambiguity_reports: number; quality_score: number; last_response_ms: number | null; last_confidence: AnswerConfidence | null; slow_count: number; updated_at: string };
        Insert: Omit<Database["public"]["Tables"]["question_stats"]["Row"], "updated_at"> & { updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["question_stats"]["Row"]>;
        Relationships: [];
      };
      study_later: {
        Row: { user_id: string; item_type: ItemType; item_id: string; added_at: string };
        Insert: Omit<Database["public"]["Tables"]["study_later"]["Row"], "added_at"> & { added_at?: string };
        Update: Partial<Database["public"]["Tables"]["study_later"]["Row"]>;
        Relationships: [];
      };
      content_drafts: {
        Row: { id: string; user_id: string; name: string; payload: unknown; status: "draft" | "validated" | "published" | "rejected"; created_at: string; updated_at: string };
        Insert: Omit<Database["public"]["Tables"]["content_drafts"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["content_drafts"]["Row"]>;
        Relationships: [];
      };
      sync_snapshots: {
        Row: { user_id: string; version: number; payload: unknown; updated_at: string };
        Insert: Omit<Database["public"]["Tables"]["sync_snapshots"]["Row"], "updated_at"> & { updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["sync_snapshots"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
