---
name: proposal
description: Generate an INNOV-R fee proposal (client, project, scope of work, fees) as a .docx and .pdf, following the firm's standard fee-proposal template. Use when asked to draft, create, or generate a fee proposal for a client.
---

# Fee proposal generator

Produces an INNOV-R Architecture+Engineering+Construction fee proposal matching the firm's standard
template, delivered as both a `.docx` and a `.pdf`. Generation goes through
`scripts/generate-proposal.js` rather than being hand-authored fresh each time — that's what keeps
the layout, fonts, logo placement, and math (totals, down payment, spelled-out amounts) identical and
correct across every proposal. Never compute or spell out totals by hand — the script does it.

Note: fixed dollar amounts below are backslash-escaped (`\$1,000.00`, not a plain `$` directly
followed by a digit) because a `$` immediately followed by a digit in this file is misinterpreted as
a shell-style positional parameter (`\$1`, `\$2`, ...) and silently replaced with a word from the
skill invocation's `args` string when present — confirmed by testing. Keep the backslash on fixed
amounts here; the actual generated document should still use a plain, unescaped `$`.

## Golden rule: ask, don't guess

If you don't know something — a client detail, which section a deliverable belongs in, a price with
no clear precedent, whether ADEQ/FAA exclusions apply, a down payment percentage that isn't the
default — ask the user. Never fill in a plausible guess for a fee proposal; a wrong number or scope
item in a real client document is a real cost.

## Required inputs — ask if any are missing, do not guess

- Client name (for `ATTN:`)
- Project name (for `RE:`), and site address and/or APN — at least one of the two; some proposals are
  identified only by APN with no separate address line
- Scope of work, broken into sections (see "Scope sections" below), each with its own deliverables
  and fee
- Any scope-specific exclusions beyond the standard ones listed below
- Whether ADEQ/FAA exclusions apply (see "Exclusions" below)
- Date of issuance (default: today)
- A one-sentence, natural-language description of the project for the intro paragraph — don't just
  reuse the `RE:` line verbatim/lowercased, write it as a sentence (see `introText` in the script's
  data-file docstring)
- Down payment percentage, if the project calls for something other than the 30% default (e.g. one
  past proposal used 50% — ask rather than assuming which applies)

## Scope sections

Real projects usually span more than one discipline. Break the scope into sections rather than one
flat list — each section gets its own Roman numeral, fee, and a lettered list of deliverables (a
section can have zero deliverables listed, e.g. a lump-sum "Landscaping" line). Common sections and
their typical deliverables (not exhaustive — ask if a deliverable doesn't fit cleanly):

- **Survey** — orthophoto, topography survey, boundary survey
- **Civil Engineering** (also seen titled just **Civil Plan**) — grading plan, site plan, drainage
  plan, paving and grading plan, water plan, sewer plan, utilities plan
- **Structural Engineering** — structural plans, structural calculations
- **Landscaping** — often a lump-sum line with no itemized deliverables

Only include the sections that actually apply to the project — don't pad a simple structural-only job
with empty Survey/Civil sections.

## Exclusions

Exclusions are a numbered list (see "Document structure" below), always starting with:

1. Services not specifically listed above
2. Application, review, or agency fees (County or City fees)

Add ADEQ (Arizona Dept. of Environmental Quality) and FAA items ONLY for grading, drainage,
environmental, or airport-proximity work — set `includeAdeqFaaExclusions: true` in the data file,
which changes item 2 to also name ADEQ fees and adds item 3, "ADEQ or FAA documentation". A pure
structural or architectural job (no earthwork, no airport-adjacent site) should leave this `false`. If
it's unclear whether a project's scope touches grading/drainage/environmental/airport work, ask.

Append any further scope-specific exclusions as additional numbered items via `exclusionsExtra`.

## Pricing — check history before asking, then record the result

`data/pricing-history.json` is a running log of past proposals (client, project, sections,
deliverables, fee, total, down payment). Before asking the client's price for a section:

1. Look for past entries with the same or similar section title/deliverables.
2. If a clear precedent exists, propose a figure based on it (cite which past project it's from) and
   let the user confirm or adjust — don't just re-ask from scratch as if no history existed.
3. If there's no precedent, or the scope is different enough that history doesn't clearly apply, ask.

After a proposal is finalized and generated, append a new entry to `data/pricing-history.json` with
its date, client, project, sections (title/deliverables/fee), total fee, and down payment — so the
next proposal has one more data point to recommend from.

## Fixed content — always use these, never ask about them

- Letterhead: INNOV-R logo (`assets/innovr-logo.jpg`, top-right — pre-trimmed to its visible content,
  ~5.1:1 aspect ratio, do not re-add padding), 670 E. 32nd St., Ste. 11, Yuma, AZ 85365
- Signature block: Arturo J. Garcia, P.E. — Principal Engineer, INNOV-R,
  Cell: (919) 213-7623, Email: Arturo@innovr.us
- Proposal validity: 30 days from the date of issuance (stated in Additional Notes, item 3)
- Down payment: 30% of the total proposal fee by default (the script computes this — pass
  `downPaymentPercent` only to override it for a specific proposal; confirm any override with the
  user rather than assuming)
- Additional Notes (always include, in this order): (1) additional services beyond scope available
  under a separate proposal upon request, (2) the listed fee is a packaged amount and removing items
  requires a revised proposal, (3) 30-day validity
- Closing paragraph: "Should you have any questions regarding this fee proposal, please do not
  hesitate to give me a call. I personally look forward to working with you on this project and
  remain available to continue our work."

## Document structure (what the script produces)

```
Fee Proposal                                                     [INNOV-R LOGO]
                                                 670 E. 32nd St., Ste. 11, Yuma, AZ 85365

[Date]

ATTN: [Client name]
RE:   [Project name]
      [Address — omitted if not given]
      [APN: ... — omitted if not given]

Greetings,

It is our pleasure to provide you with this proposal for [introText]. The extent of our scope is as
follows:

I.  [Section title] ……………………………………………………………………… $[section fee]
    a. [Deliverable]
    b. [Deliverable]
II. [Section title] ……………………………………………………………………… $[section fee]
(repeat per section; a section may have zero lettered deliverables)
────────────────────────────────────────────────────────────────
Total …………………………………………………………………………………………… $[sum of section fees]

Exclusions:
This proposal does not include the following:
1. Services not specifically listed above
2. Application, review, or agency fees (County or City fees[, or ADEQ fees if applicable])
3. [ADEQ or FAA documentation — only if applicable]
[4+. any exclusionsExtra items]

Additional Notes:
1. Additional services beyond those listed may be provided under a separate proposal upon client's
   request.
2. The listed fee is a packaged amount. Removal of individual items from the scope will require a
   revised proposal.
3. This proposal is valid for 30 days from the date above.

Fee and Payment Terms
The professional fee for the services described herein shall be a stipulated sum of [total in words]
dollars ($[total]). A [N]% down payment ($[down payment]) is required to initiate work, with
remaining balances billed as work progresses. Final payment is due upon completion of services.

[Standard closing paragraph]

Sincerely,                                    Accepted by:


Arturo J. Garcia, P.E.                        _______________________________________
Principal Engineer                            Signature                          Date
INNOV-R
Architecture+Engineering+Construction         _______________________________________
Cell: (919) 213-7623                          Print Name                         Date
Email: Arturo@innovr.us
```

## Steps

1. Gather the required inputs above; ask for anything missing rather than guessing (see "Golden
   rule"). Group the scope into sections per "Scope sections" above, and decide
   `includeAdeqFaaExclusions` per "Exclusions" above.
2. Check `data/pricing-history.json` for pricing precedent before asking the client's fee for each
   section (see "Pricing" above).
3. Write a data JSON file matching the shape documented at the top of
   `scripts/generate-proposal.js` — sections with plain-number fees, no `$` and no manually-computed
   totals or word-spellings; the script computes all of that.
4. Run the generator: `node scripts/generate-proposal.js data.json output.docx`. If it fails with
   `Cannot find module 'docx'`, install it to a fixed location and point Node at it rather than
   installing next to the script (avoids committing `node_modules` to the repo):
   `npm install --prefix /tmp/docx-deps docx && NODE_PATH=/tmp/docx-deps/node_modules node scripts/generate-proposal.js data.json output.docx`
5. Convert to PDF: `python <path-to-docx-skill>/scripts/office/soffice.py --headless --convert-to pdf output.docx`.
   If LibreOffice fails with "source file could not be loaded", the `libreoffice-writer` package is
   likely missing (only `libreoffice-core` installed) — `apt-get update && apt-get install -y
   libreoffice-writer poppler-utils` fixes it (confirmed by testing in this sandbox).
6. Before delivering, render the PDF to an image (`pdftoppm -jpeg -r 120 output.pdf page`) and look at
   it — check the fee amounts, section math, and that nothing reads awkwardly.
7. Deliver both files to the user. Never send or share the proposal with the client directly — that's
   the user's decision.
8. Append the finalized proposal to `data/pricing-history.json` (see "Pricing" above).
