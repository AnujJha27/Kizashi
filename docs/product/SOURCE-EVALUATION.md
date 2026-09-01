# External source evaluation

Evaluated 2026-09-01; first-party term pages were checked 2026-08-31. These sources remain analysis inputs, learner-content
candidates, or source launchers according to the decision recorded for each
source below. Do not infer permission to copy or redistribute an asset from a
general dataset label; check the current source terms and the exact delivery
path.

The complete source inventory, including canonical curriculum inputs, audio
providers, private books, and provenance fields, is in
[CONTENT-SOURCES.md](./CONTENT-SOURCES.md). This file records the term-specific
decisions; it is not a list of assets Kizashi has downloaded.

| Source | Finding | Kizashi decision |
| --- | --- | --- |
| [CEJC frequency list](https://repository.ninjal.ac.jp/records/2000167) | The 2024.03 frequency list permits free research/education use but prohibits redistribution and sends commercial use to consultation. The full CEJC audio, transcripts, and annotations have separate access terms. | Keep as an optional spoken-frequency analysis input. Do not ship CEJC data, audio, transcripts, or derived learner assets. |
| [CEJC corpus access](https://www2.ninjal.ac.jp/conversation/cejc.html) | Online search is available by application; downloadable audio/video and annotations are in the paid, contracted edition. | Use only after confirming the intended product use and license in writing. |
| [CSJ](https://clrd.ninjal.ac.jp/csj/en/) and its [published frequency list](https://repository.ninjal.ac.jp/records/3276) | CSJ is a broad spoken corpus, not an everyday-conversation-only corpus. NINJAL publishes the 2018.03.1 short-unit vocabulary table for research/education use, but the repository labels the download CC BY-NC-ND 3.0: no redistribution and commercial use by consultation. The corpus itself has separate online/paid access terms. | The workspace owner authorized derived aggregate values for this private, allowlisted deployment on 2026-09-01. Use `apply_spoken_frequency.py --publish-private` before SQL export; raw CSJ tables, audio, transcripts, annotations, and public redistribution remain excluded. |
| [I-JAS terms](https://chunagon.ninjal.ac.jp/static/I-JAS_TermsOfService.pdf) | The online service is limited to the declared research purpose, prohibits third-party copying/distribution, and requires separate consultation for commercial results. | Permit only aggregate, privacy-safe research internally; do not import learner records or publish learner-derived drills. |
| WaniKani | No compatible source license or API permission has been established for Kizashi. | Do not integrate it; keep canonical facts in JMdict/KANJIDIC2 and treat any future use as an optional, user-provided cross-reference. |

## Audio and hosted-learning source terms

Audited 2026-08-31 against the providers' current first-party pages. These are
product-use decisions, not a substitute for reviewing a changed provider term
before a new asset is copied, embedded, or redistributed.

| Source | Current finding | Kizashi decision |
| --- | --- | --- |
| [Erin's Challenge site policy](https://www.erin.jpf.go.jp/en/policy/) and [FAQ](https://www.erin.jpf.go.jp/en/faq/) | The Japan Foundation says site text, images, audio, and video belong to it unless stated otherwise; its exception permits private or school/educational use, including personal learning. Linking is welcome, while video downloading is prohibited. | Use an original-page launcher for personal study. Do not download, copy, or re-host Erin video/audio by default; only frame or preserve an item after the exact current page terms permit that delivery. |
| [Common Voice Japanese 26.0](https://mozilladatacollective.com/datasets/cmqim4lxy00tunr07cjkcupeg) and the [current MDC re-hosting FAQ](https://community.mozilladatacollective.com/faq-why-cant-i-re-host-or-share-common-voice-datasets-that-i-download-from-mdc/) | The current Japanese dataset is `cv-corpus-26.0-2026-06-12` (released 2026-06-17), is CC0, and lists CALL as an intended use. The dataset page and current MDC FAQ prohibit re-hosting or re-sharing; speaker identification is prohibited. | Do not upload or bundle Common Voice in Supabase/GitHub. Keep a source/Mozilla Data Collective launcher or obtain separate permission for a different delivery path; never infer speaker identity. |
| [Tatoeba corpus guidance](https://en.www.en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus-for-your-own-projects), [FAQ](https://en.wiki.tatoeba.org/articles/show/faq), and [CC0 guidance](https://en.wiki.tatoeba.org/articles/show/cc0-contributions) | Sentence text is generally CC-BY with attribution, but audio has contributor-specific licenses and is not automatically CC0. Each recording's license and contributor must be checked. | Stage sentence candidates with attribution. Use an individual audio URL only after its file license is recorded; preserve attribution/provenance and do not bulk mirror audio. |
| [JSUT official corpus terms](https://sites.google.com/site/shinnosuketakamichi/publication/jsut) | Personal use and non-commercial research are allowed, but redistribution is not generally permitted; the page describes only a small website/blog exception and asks commercial users to contact the lab. | Do not upload the full corpus to Supabase/GitHub. A small, justified personal-study subset requires preserved citation/terms; public or commercial delivery requires lab permission. |
| [VOICEVOX software terms](https://voicevox.hiroshiba.jp/term/) and [Q&A](https://voicevox.hiroshiba.jp/qa/) | Commercial and non-commercial output use is generally allowed with VOICEVOX credit, but each voice library/character has separate terms and credit requirements. The engine itself has separate redistribution/source obligations. | Keep BrowserSpeechProvider as default. A future local/server TTS path must record the selected voice's character terms and required credits; do not ship the engine or an output archive now. |

## New source integration decisions

The following decisions are the implementation boundary for the six sources in
the milestone. The source page and terms remain authoritative if they change.

| Source | First-party finding checked | Exact Kizashi behavior |
| --- | --- | --- |
| [Tae Kim's Guide](https://www.guidetojapanese.org/start.html) | The guide identifies its material as CC BY-NC-SA 3.0. Adapted material therefore needs attribution and ShareAlike handling. | Kizashi uses reviewed, item-specific deep links as alternative explanations. It does not ingest or silently relabel Tae Kim prose as authored curriculum. |
| [Wikibooks copyrights](https://en.wikibooks.org/wiki/Wikibooks:Copyrights) | Wikibooks text is generally CC BY-SA 4.0/GFDL, with page history/footer and file-specific details still relevant. | Kizashi uses the MediaWiki API for small mapped sections, sanitizes the response, retains page URL/attribution/license, and does not persist bulk reference text. |
| [Commons/Lingua Libre API](https://commons.wikimedia.org/wiki/Help:Lingua_Libre/APIs) and [MediaWiki imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo/en) | Recordings are file-specific Commons assets; language, actual audio type, license, file page, and attribution must be read from metadata. | Kizashi resolves exact compatible Japanese files on demand and streams their remote URLs. It rejects non-audio, ambiguous, missing/incompatible-license results and falls back to Browser Speech. No Commons audio is uploaded or proxied. |
| [Aozora usage guide](https://www.aozora.gr.jp/guide/nyuumon.html) | Aozora publishes UTF-8 bibliographic metadata and distinguishes public-domain/expired-rights works from works whose rights continue. File and source handling instructions remain source-specific. | Kizashi catalogs metadata, filters rights status before fetching, and renders only a qualifying public/reusable work dynamically. Protected works stay card-link-only; no catalog or corpus mirror is committed. |
| [Free Tadoku Books terms](https://tadoku.org/japanese/en/free-books-en/note-en/) | The free books are CC BY-NC-ND 4.0 and the provider asks users to credit NPO多言語多読; unchanged linking/reading is the relevant boundary. | Kizashi keeps the work provider-hosted and non-transformable. It may frame when technically allowed, otherwise opens the original page, and stores only a local opened marker. No extraction, translation, annotation, questions, or altered illustrations. |
| [Irodori FAQ](https://www.irodori.jpf.go.jp/en/faq.html), [About Irodori](https://www.irodori.jpf.go.jp/en/about.html), and [Starter Lesson 6 audio](https://www.irodori.jpf.go.jp/en/starter/audio/lesson06.html) | The Foundation provides the material for independent/educational study while the site and media remain provider-owned; official lesson pages identify available scripts/audio and may constrain browser/device delivery. | Kizashi adds official lesson/Can-do metadata and source-hosted resource links to overlapping lessons. It keeps Irodori levels separate from JLPT fields, does not mirror media, and preserves the terms/source relation. |

These are engineering decisions, not blanket permission to copy a source. The
app's private single-user boundary reduces exposure but does not change source
ownership. The product therefore stores references and provenance while leaving
provider-hosted content, login, cookies, and delivery controls with the source.

The source cache exposes CEJC/CSJ through `--source spoken-evaluation` and I-JAS
terms through `--source learner-evaluation`. These commands cache provenance and
terms only; they do not publish or place external corpus data in the learner
path.

The intended product roles are deliberately narrow: CEJC is a naturalness
signal for spoken-frequency ranking, conversation patterns, collocations, and
original dialogue prompts; CSJ is a broader spoken-frequency/listening-realism
signal that includes multiple speech registers; I-JAS is a difficulty/error
signal for reviewed learner-trap warnings and adaptive drill priorities.
Neither corpus is the curriculum backbone or a grammar authority. Counts
identify patterns worth checking; explanations must come from reliable grammar
sources, and only approved aggregates may enter the private review workflow.

`scripts/ingest_csj_frequency.py` accepts NINJAL's published short-unit table
and emits only local, pending aggregates. It deliberately does not copy source
rows, audio, transcripts, or annotations. The workspace owner's private-use
authorization is recorded for this deployment; an operator must still pass
`--publish-private` to `scripts/apply_spoken_frequency.py`, after which the
SQL renderer accepts only the aggregate fields for the private allowlisted
package. No raw table or corpus asset is exported.

## Private external-source framing

Single-user access lowers the practical exposure and redistribution risk, but
"private" is not a blanket license and does not transfer ownership of a source
to Kizashi. The safe product boundary is a source launcher: store the original
URL and provenance, then let the provider's page, login, cookies, and delivery
remain responsible for the content.

Kizashi must not download, proxy, cache, mirror, re-host, or upload third-party
audio/video/data to Supabase merely to make the source convenient. The private
immersion shelf uses Erin's provider-hosted MP4 URLs in a native browser player
for the six selected lessons; other frameable sources may use a direct browser
iframe. The provider remains in control through framing headers, login,
cookies, and its own terms. A blocked frame falls back to a new-tab link. The
frame or native player is not a license grant or permission to share the source
with other users, and a source should be link-only if its terms or headers
prohibit embedding.

For CEJC, the official access description says that the free online service can
be used to listen to searched audio but does not allow audio/video download;
the paid edition supplies corpus assets under a contract. Therefore Kizashi
should link to or open the authorized CEJC session, not capture or re-serve the
raw corpus. The shelf now exposes a frame attempt for CEJC and CSJ, plus Common
Voice, Tatoeba, JSUT, and JapanesePod101, because the device-local Chromium
helper can remove allowlisted frame-blocking response headers for personal
testing. Provider DNS, login, cookies, page scripts, or explicit frame denial
may still make the original-source fallback necessary.
Erin's Challenge has now been checked as well:
personal learning
and linking are allowed by its policy, but video downloading is prohibited, so
the original-page launcher remains the default for scripts and source controls;
the six selected videos are streamed from Erin's own MP4 URLs without storage
or proxying. Tatoeba's browse page is link-only because it sends
`X-Frame-Options: Deny`; individual audio remains possible only when its
recording license and attribution are recorded. Common Voice, JSUT, and
VOICEVOX now have the source-specific decisions above; Open JTalk and
JapanesePod101 still require their own current-term review before use.
