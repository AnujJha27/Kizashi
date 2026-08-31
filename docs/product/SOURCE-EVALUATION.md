# External source evaluation

Evaluated 2026-08-31. These sources remain analysis inputs, not learner-content
or audio imports, until Kizashi has a written license that covers the actual
deployment and redistribution model.

| Source | Finding | Kizashi decision |
| --- | --- | --- |
| [CEJC frequency list](https://repository.ninjal.ac.jp/records/2000167) | The 2024.03 frequency list permits free research/education use but prohibits redistribution and sends commercial use to consultation. The full CEJC audio, transcripts, and annotations have separate access terms. | Keep as an optional spoken-frequency analysis input. Do not ship CEJC data, audio, transcripts, or derived learner assets. |
| [CEJC corpus access](https://www2.ninjal.ac.jp/conversation/cejc.html) | Online search is available by application; downloadable audio/video and annotations are in the paid, contracted edition. | Use only after confirming the intended product use and license in writing. |
| [CSJ](https://clrd.ninjal.ac.jp/csj/en/) | Online and paid editions exist; commercial use is reviewed individually and the paid corpus is supplied under an agreement. | Keep frequency/listening realism evaluation-only until a matching license is executed. |
| [I-JAS terms](https://chunagon.ninjal.ac.jp/static/I-JAS_TermsOfService.pdf) | The online service is limited to the declared research purpose, prohibits third-party copying/distribution, and requires separate consultation for commercial results. | Permit only aggregate, privacy-safe research internally; do not import learner records or publish learner-derived drills. |
| WaniKani | No compatible source license or API permission has been established for Kizashi. | Do not integrate it; keep canonical facts in JMdict/KANJIDIC2 and treat any future use as an optional, user-provided cross-reference. |

The source cache exposes CEJC/CSJ through `--source spoken-evaluation` and I-JAS
terms through `--source learner-evaluation`. These commands cache provenance and
terms only; they do not publish or place external corpus data in the learner
path.

The intended product roles are deliberately narrow: CEJC is a naturalness
signal for spoken-frequency ranking, conversation patterns, collocations, and
original dialogue prompts; I-JAS is a difficulty/error signal for reviewed
learner-trap warnings and adaptive drill priorities. Neither corpus is the
curriculum backbone or a grammar authority. Counts identify patterns worth
checking; explanations must come from reliable grammar sources, and only
approved aggregates may enter the private review workflow.

## Private external-source framing

Single-user access lowers the practical exposure and redistribution risk, but
"private" is not a blanket license and does not transfer ownership of a source
to Kizashi. The safe product boundary is a source launcher: store the original
URL and provenance, then let the provider's page, login, cookies, and delivery
remain responsible for the content.

Kizashi must not download, proxy, cache, mirror, re-host, or upload third-party
audio/video/data to Supabase merely to make the source convenient. A private
iframe is only appropriate when the provider permits embedding in this exact
authenticated/product context and the browser allows it (for example, the
provider may block framing with security headers). The normal fallback is a
new-tab link to the original page. A launcher also must not be presented as a
license grant or as permission to share the source with other users.

For CEJC, the official access description says that the free online service can
be used to listen to searched audio but does not allow audio/video download;
the paid edition supplies corpus assets under a contract. Therefore Kizashi
should link to or open the authorized CEJC session, not capture or re-serve the
raw corpus. Erin's Challenge exposes Japan Foundation learning materials on
its own site; linking to the original material is the default until the exact
embedding/download terms are confirmed. Every other source (Common Voice,
Tatoeba, JSUT, VOICEVOX, Open JTalk, JapanesePod101) remains subject to its
own current terms and speaker/contributor attribution requirements.
