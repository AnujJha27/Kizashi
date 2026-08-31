# External source evaluation

Evaluated 2026-08-31. These sources remain analysis inputs, learner-content
candidates, or source launchers according to the decision recorded for each
source below. Do not infer permission to copy or redistribute an asset from a
general dataset label; check the current source terms and the exact delivery
path.

| Source | Finding | Kizashi decision |
| --- | --- | --- |
| [CEJC frequency list](https://repository.ninjal.ac.jp/records/2000167) | The 2024.03 frequency list permits free research/education use but prohibits redistribution and sends commercial use to consultation. The full CEJC audio, transcripts, and annotations have separate access terms. | Keep as an optional spoken-frequency analysis input. Do not ship CEJC data, audio, transcripts, or derived learner assets. |
| [CEJC corpus access](https://www2.ninjal.ac.jp/conversation/cejc.html) | Online search is available by application; downloadable audio/video and annotations are in the paid, contracted edition. | Use only after confirming the intended product use and license in writing. |
| [CSJ](https://clrd.ninjal.ac.jp/csj/en/) and its [published frequency list](https://repository.ninjal.ac.jp/records/3276) | CSJ is a broad spoken corpus, not an everyday-conversation-only corpus. NINJAL publishes the 2018.03.1 short-unit vocabulary table for research/education use, but the repository labels the download CC BY-NC-ND 3.0: no redistribution and commercial use by consultation. The corpus itself has separate online/paid access terms. | Keep the frequency table as a local, review-only aggregate input. Do not redistribute the table, copy CSJ audio/transcripts, or publish derived learner values until the exact downstream permission is confirmed. |
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
rows, audio, transcripts, or annotations, and its output is not included in the
tracked learner package. The no-redistribution/ND term still means this parser
does not grant permission to publish the derived values; obtain a matching
written permission before deploying them outside private review.

## Private external-source framing

Single-user access lowers the practical exposure and redistribution risk, but
"private" is not a blanket license and does not transfer ownership of a source
to Kizashi. The safe product boundary is a source launcher: store the original
URL and provenance, then let the provider's page, login, cookies, and delivery
remain responsible for the content.

Kizashi must not download, proxy, cache, mirror, re-host, or upload third-party
audio/video/data to Supabase merely to make the source convenient. The private
immersion shelf may attempt a direct browser iframe for the original provider
page; the provider remains in control through framing headers, login, cookies,
and its own terms. A blocked frame falls back to a new-tab link. The frame is
not a license grant or permission to share the source with other users, and a
source should be removed from the frame shelf if its terms expressly prohibit
embedding.

For CEJC, the official access description says that the free online service can
be used to listen to searched audio but does not allow audio/video download;
the paid edition supplies corpus assets under a contract. Therefore Kizashi
should link to or open the authorized CEJC session, not capture or re-serve the
raw corpus. Erin's Challenge has now been checked as well: personal learning
and linking are allowed by its policy, but video downloading is prohibited, so
the original-page launcher remains the default. Common Voice, Tatoeba, JSUT,
and VOICEVOX now have the source-specific decisions above; Open JTalk and
JapanesePod101 still require their own current-term review before use.
