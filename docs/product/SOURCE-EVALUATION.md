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
