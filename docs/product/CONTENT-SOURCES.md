# Kizashi content-source register

Updated: 2026-09-01

This is the single inventory of sources used, evaluated, or intentionally kept
outside Kizashi. It describes product handling; current provider terms still
control any future copy, embedding, or redistribution. The detailed term
decisions are in [SOURCE-EVALUATION.md](./SOURCE-EVALUATION.md).

## Current delivery boundary

- The hosted project has 313 approved seeded `learning_items` across
  vocabulary, kanji, grammar, reading, and listening. The 47 approved staged
  package IDs match hosted rows.
- The tracked source-review package contains 8,442 records: 47 approved
  source-review records, 50 authored/curated records, 8,345 pending records,
  and no rejected records. The
  authenticated private learner route can expose non-rejected pending records
  with `humanReviewed: false`; SQL export and admin publication still require
  explicit approval.
- No third-party corpus audio, transcripts, annotations, or datasets are in
  GitHub or Supabase Storage. The supplied personal book files are kept in the
  private `books` bucket and are served only through the authenticated reader.
- Routine pronunciation uses the browser Speech API. Audio metadata and
  approved external URLs may be persisted; generated pronunciation blobs are
  not stored by default.

## Curriculum and canonical fact sources

| Source ID | Source | Role in Kizashi | Current handling |
| --- | --- | --- | --- |
| `jlpt-official-blueprint` | [Official JLPT N5 item purposes](https://www.jlpt.jp/e/guideline/pdf/n5_e_revised.pdf) | Exam format and timing calibration | Reference only; no bulk copying of exam content. |
| `jmdict` | [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) | Vocabulary spellings, readings, meanings, parts of speech, and senses | Canonical dictionary enrichment with EDRDG attribution/license metadata. |
| `jmdict-examples` | [JMdict linked examples](https://ftp.edrdg.org/pub/Nihongo/00INDEX.html) | Example-sentence candidates | Staged with provenance and reviewed before learner publication. |
| `kanjidic2` | [KANJIDIC2](https://www.edrdg.org/wiki/KANJIDIC_Project.html) | Kanji readings, meanings, grades, strokes, and metadata | Canonical kanji enrichment under CC BY-SA 4.0 handling. |
| `openjlpt` | [OpenJLPT](https://github.com/evanclan/OpenJLPT) | Unofficial JLPT level spine | Staging evidence only; classifications remain review-required. |
| `bccwj` | [NINJAL BCCWJ frequency list](https://clrd.ninjal.ac.jp/bccwj/freq-list.html) | Written-frequency and register signal | Frequency enrichment, distinct from curriculum truth. |
| `irodori` | [Japan Foundation Irodori](https://www.irodori.jpf.go.jp/en/resources.html) | Communicative vocabulary, sentence patterns, and kanji progression | Review-only derived candidates with source and retrieval metadata. |
| `marugoto` | [Japan Foundation Marugoto](https://marugoto.jpf.go.jp/en/download/) | Vocabulary, phrase progression, and can-do reference | Review-only derived candidates; source terms remain attached. |
| `tatoeba` | [Tatoeba](https://tatoeba.org/en/downloads) | Japanese-English example candidates and possible short human audio | Per-sentence attribution and per-recording license checks are required. No bulk audio mirror. |
| `michi-curated-n5-seed` | Kizashi-authored N5 seed | Learner curriculum, explanations, examples, and targets | Original content in the learner package and Supabase seed. |
| `michi-question-factory` | Kizashi deterministic question factory | Original drills derived from reviewed item facts | Structural validation and semantic review metadata are required. |
| `user-draft` | Local Content Studio draft | Owner-authored additions | Local/unpublished until explicitly reviewed. |

## Lookup and corpus-analysis sources

| Source | Intended signal | Current handling |
| --- | --- | --- |
| [JMnedict](https://www.edrdg.org/enamdict/enamdict_doc.html) | Proper-name lookup | Staged separately from JLPT vocabulary; never treated as curriculum truth. |
| [SudachiDict](https://github.com/WorksApplications/SudachiDict) / UniDic metadata | Tokenization, lemmas, conjugation, and sentence linking | Optional local lookup metadata only; no learner publication. |
| [CEJC frequency list](https://repository.ninjal.ac.jp/records/2000167) | Spoken frequency, conversational patterns, collocations, and naturalness | Aggregate/review input only. CEJC audio, transcripts, annotations, and raw rows stay out of Kizashi. |
| [CEJC corpus access](https://www2.ninjal.ac.jp/conversation/cejc.html) | Authorized conversation listening/research | Source launcher or authorized session only; no capture, proxy, or re-serving. |
| [CSJ](https://clrd.ninjal.ac.jp/csj/en/) and [CSJ frequency list](https://repository.ninjal.ac.jp/records/3276) | Broad spoken-frequency and listening-realism signal | Local review-only aggregate. The current no-redistribution/ND terms block automatic learner-bundle publication. |
| [I-JAS terms](https://chunagon.ninjal.ac.jp/static/I-JAS_TermsOfService.pdf) | Aggregate learner-error/difficulty signal | Privacy-safe aggregates only. Learner IDs, transcripts, audio, and raw learner records are rejected. |
| WaniKani | Optional cross-reference | Not integrated; no compatible permission has been established. |

The product interpretation is deliberately narrow:

```text
CEJC  = naturalness / spoken-frequency signal
I-JAS = learner-difficulty / error signal
CSJ   = broader spoken-frequency / realism signal
```

Corpus evidence identifies patterns worth checking. It does not become a
grammar rule or replace a reliable explanation source.

## Listening and audio sources

| Source | Best use | Kizashi delivery |
| --- | --- | --- |
| Browser Speech API | Vocabulary, kanji readings, grammar examples, and ordinary sentences | Default `BrowserSpeechProvider`; prefers voices whose language starts with `ja`; no blob storage. |
| [Erin's Challenge](https://www.erin.jpf.go.jp/en/) | Beginner situational dialogue, scripts, and shadowing | Six N5-targeted launchers stream the provider-hosted MP4 directly in the native browser player; scripts, subtitles, and source controls remain on the Japan Foundation page. No blob is stored or proxied. |
| [Common Voice Japanese](https://mozilladatacollective.com/datasets/cmqim4lxy00tunr07cjkcupeg) | Human-speaker variation | Source-linked browsing only; no dataset upload, mirroring, or speaker identification. |
| [Tatoeba audio](https://tatoeba.org/en/audio/index/jpn) | Short sentence recordings | The browse page is link-only because it sends `X-Frame-Options: Deny`; an individual external audio URL may be used only after its contributor license and attribution are recorded. |
| [JSUT](https://sites.google.com/site/shinnosuketakamichi/publication/jsut) | Clean speech research/exposure | No full-corpus upload; any future subset needs a documented preservation reason and terms. |
| [VOICEVOX](https://voicevox.hiroshiba.jp/) | Future consistent mock-JLPT dialogue | Reserved `ServerTTSProvider`; selected voice-library terms and credits must be recorded first. |
| Open JTalk | Future local pronunciation fallback | Not currently wired as a separate delivery source; terms and packaging must be checked first. |
| [JapanesePod101](https://www.japanesepod101.com/begin/) | Polished learner listening | Original-provider shelf only until the exact free-material terms are verified. |
| Remote human audio | A specifically cleared recording | `RemoteAudioProvider` streams the approved external URL and preserves provenance metadata. |

The UI exposes play, replay, slow playback, and the existing optional autoplay
preference. `ServerTTSProvider` exists as an unavailable future path; it does
not generate or persist audio today. Erin's six selected videos use a native
browser player pointed at the provider-hosted MP4; the six other listening
sources expose a frame attempt and fall back to a new-tab link when framing
fails. A device-local Chromium helper in
`browser/kizashi-private-frame-unlocker/` can retry the allowlisted frames by
removing only their frame-blocking response headers. Kizashi does not
download, proxy, cache, mirror, re-host, or upload these sources.

## Learner-facing source integrations

The external-resource registry in `lib/external-resources.ts` is the single
learner-facing catalog. Source maps hold only small, reviewed relationships;
they do not replace the curriculum or create a second content database.

| Source | Pedagogical role and learner entry point | Delivery and storage behavior | Failure behavior |
| --- | --- | --- | --- |
| [Tae Kim](https://www.guidetojapanese.org/start.html) | Alternative structural explanation under `別の見方` on mapped grammar details, such as は/が and particle patterns. | Specific deep links from `data/source-maps/tae-kim.json`; no copied prose. CC BY-NC-SA 3.0 attribution remains in source info. | The Kizashi explanation, examples, and practice remain usable if the link is unavailable. |
| [Wikibooks Japanese](https://en.wikibooks.org/wiki/Japanese_Grammar) | Supplementary particle, counter, conjugation, and pronunciation reference beside relevant grammar. | The MediaWiki API returns a small sanitized section on request; metadata is cached briefly in memory and no fetched text is persisted. CC BY-SA 4.0/GFDL attribution remains available. | The mapped source link remains available and the normal Kizashi grammar page is unaffected by API failure or a missing section. |
| [Wikimedia Commons / Lingua Libre](https://commons.wikimedia.org/wiki/Category:Japanese_pronunciation) | On-demand human pronunciation for vocabulary and kanji when a compatible exact Japanese recording exists. | `/api/audio/commons` returns remote metadata and the existing `RemoteAudioProvider` streams the original URL. Each file's license, file page, creator/voice metadata, and attribution are retained; no audio blob is stored. | A miss, ambiguous result, incompatible license, API failure, or remote playback error falls back to Japanese Browser Speech. |
| [Aozora Bunko](https://www.aozora.gr.jp/) | Native reading for later immersion, surfaced in `読む · 青空文庫`, with known-item coverage and an explicitly estimated difficulty. | The catalog is cache-only metadata. A qualifying public-domain work is fetched on Read, normalized conservatively, and rendered in the existing Japanese text surface; the catalog and text are not committed or mirrored. | Saved metadata and the original card link remain available; protected works are rejected before text fetch and upstream failures show retry/open-source controls. |
| [Free Tadoku Books](https://tadoku.org/japanese/en/free-books-en/) | Beginner graded extensive reading in `読む · 多読`, with level, genre, audio availability, and opened progress. | Original provider-hosted pages/audio through `ExternalSourceViewer` and `RemoteAudioProvider`; entries are marked non-transformable and only local progress metadata is stored. | If framing is blocked, the original Tadoku page opens directly; no copied pages, translations, questions, or illustrations are created. |
| [Irodori](https://www.irodori.jpf.go.jp/en/) | Practical Can-do reinforcement on overlapping Learn lessons, beginning with Starter Lesson 6 restaurant ordering. | The existing three Irodori item ingestors remain the staging path. The learner card stores official lesson/Can-do/resource metadata and opens provider-hosted lesson/audio pages; no media mirror is created. | The Kizashi lesson remains functional and the official source link remains available if Irodori media or framing fails. |

The registry uses `resourceType`, `deliveryMode`, target item/skill IDs, source
role, and rights behavior to place resources by intent: `聞く` for listening,
`読む` for Tadoku/Aozora, `実際の日本語` for Irodori, and `参考` for grammar
references. Erin remains one family card with a lesson selector rather than six
publisher cards. Content Studio computes coverage from these mappings and
shows readable source relationships alongside existing `sourceIds` and
`fieldSourceIds`.

### Resolved provenance shape

External integrations preserve the existing provenance model. Content fields
continue to use `sourceIds`/`fieldSourceIds`; resource records preserve the
source URL, source-specific page URL, attribution, license, retrieval date, and
rights behavior. Commons audio additionally exposes its file page, actual
per-file license/license URL, creator or source-provided speaker metadata, and
remote URL. Aozora entries preserve work/person IDs and rights status. Irodori
entries preserve course, lesson, Can-do, available resource types, official
terms URL, and target item IDs. These relationships are evidence or references,
not JLPT classifications or replacements for Kizashi-authored explanations.

## Private user-provided material

| Source | Use | Boundary |
| --- | --- | --- |
| Genki I supplied PDF | Personal book reading and local page notes | Private `books` bucket, short-lived signed parts, browser-side assembly. Extracted facts remain review-only. |
| Goukaku Dekiru N4.5 supplied PDF | Personal book reading | Same private-reader boundary; not in GitHub or the public bundle. |
| Nihongo Challenge Kanji N4–N5 supplied PDF | Personal book reading | Same private-reader boundary; not in GitHub or the public bundle. |
| Personal CSV/JSON vocabulary lists | Local Quick Add and canonical matching | Stored as personal state; unmatched entries remain local and are not published. |
| Local notes and page screenshots | Personal study context | Local-first and included only in the bounded opt-in backup/sync snapshot. |

## Provenance contract

Curriculum records carry `sourceIds` and field-level `fieldSourceIds`. Source
manifests preserve the source ID, name, type, URL, license, retrieval date,
checksum, local filename, and notes when available. Audio records preserve
source type, optional URL, speaker metadata, license/provenance,
`isSynthetic`, and preferred playback rate. Review status remains separate from
source ownership:

- `pending` means the source-review record is not approved for SQL export.
- `approved` means it passed the explicit admin/QA publication gate.
- private automatic learner release is marked `humanReviewed: false` and does
  not change the source-review status.

For current term findings and links, see
[SOURCE-EVALUATION.md](./SOURCE-EVALUATION.md). For implementation and hosted
verification, see [HANDOFF.md](../../HANDOFF.md) and [TODO.md](../../TODO.md).
