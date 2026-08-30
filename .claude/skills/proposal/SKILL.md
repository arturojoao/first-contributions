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
no clear precedent, a formatting choice not covered here — ask the user. Never fill in a plausible
guess for a fee proposal; a wrong number or scope item in a real client document is a real cost.

## Required inputs — ask if any are missing, do not guess

- Client name (for `ATTN:`)
- Project name and site address (for `RE:`), and APN if the client gave one
- Scope of work, broken into sections (see "Scope sections" below), each with its own deliverables
  and fee
- Any scope-specific exclusions beyond the standard ones listed below
- Date of issuance (default: today)
- A one-sentence, natural-language description of the project for the intro paragraph — don't just
  reuse the `RE:` line verbatim/lowercased, write it as a sentence (see `introText` in the script's
  data-file docstring)
- Down payment percentage, if the client/project calls for something other than the 30% default

## Scope sections

Real projects usually span more than one discipline. Break the scope into sections rather than one
flat list — each section gets its own Roman numeral, fee, and a lettered list of deliverables. Common
sections and their typical deliverables (not exhaustive — ask if a deliverable doesn't fit cleanly):

- **Survey** — orthophoto, topography survey, boundary survey
- **Civil Engineering** — grading plan, site plan, drainage plan, paving and grading plan, water
  plan, sewer plan, utilities plan
- **Structural Engineering** — structural plans, structural calculations

Only include the sections that actually apply to the project — don't pad a simple structural-only job
with empty Survey/Civil sections.

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
- Signature block: Arturo J. Garcia, PE — Principal Engineer, INNOV-R, (919) 213-7623,
  Arturo@innovr.us
- Proposal validity: 30 days from the date of issuance
- Down payment: 30% of the total proposal fee by default (the script computes this — pass
  `downPaymentPercent` only to override it for a specific proposal)
- Baseline exclusions (always include, then append any scope-specific ones): permit or review fees,
  attendance at Yuma County or City of Yuma meetings
- Standard closing paragraph: "Should you have any questions regarding this fee proposal, please do
  not hesitate to give me a call. I personally look forward to working with you on this project and
  remain available to continue our work."

## Document structure (what the script produces)

```
Fee Proposal                                                     [INNOV-R LOGO]
                                                 670 E. 32nd St., Ste. 11, Yuma, AZ 85365

[Date]

ATTN: [Client name]
RE:   [Project name] – [one-line scope description]
      [Address]
      [APN — omitted if none given]

Greetings,

It is our pleasure to provide you with this proposal for [introText]. The extent of our scope is as
follows:

I.  [Section title] ……………………………………………………………………… $[section fee]
    a. [Deliverable]
    b. [Deliverable]
II. [Section title] ……………………………………………………………………… $[section fee]
    a. [Deliverable]
(repeat per section)
────────────────────────────────────────────────────────────────
Total …………………………………………………………………………………………… $[sum of section fees]

Exceptions:
[Baseline + scope-specific exclusions as one paragraph.]

Note:
- This proposal valid for 30 days from the date of issuance.

The professional fee for this work shall be a stipulated sum of [total in words] dollars ($[total]). A
down payment of $[30% of total] (30% of the total fee) is required to initiate work, remaining
balances will be billed as work progresses and fully due at completion of work. Other design services
not specifically included in this proposal may be provided upon request by the Client at fees
negotiated for those services.

[Standard closing paragraph]

Sincerely,                                    Accepted by:


Arturo J. Garcia, PE                          _______________________________________
Principal Engineer                            Signature                          Date
INNOV-R
Architecture+Engineering+Construction         _______________________________________
(919) 213-7623                                Print Name                         Date
Arturo@innovr.us
```

## Steps

1. Gather the required inputs above; ask for anything missing rather than guessing (see "Golden
   rule"). Group the scope into sections per "Scope sections" above.
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
