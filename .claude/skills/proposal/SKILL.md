---
name: proposal
description: Generate an INNOV-R fee proposal (client, project, scope of work, fees) as a .docx and .pdf, following the firm's standard fee-proposal template. Use when asked to draft, create, or generate a fee proposal for a client.
---

# Fee proposal generator

Produces an INNOV-R Architecture+Engineering+Construction fee proposal matching the firm's standard
template, delivered as both a `.docx` and a `.pdf`. Built from two prior proposals on file
(structural plans/calculations jobs); the structure below is copied from them exactly. Generation
goes through `scripts/generate-proposal.js` rather than being hand-authored fresh each time — that's
what keeps the layout, fonts, and logo placement identical across every proposal.

Note: fixed dollar amounts below are backslash-escaped (`\$1,000.00`, not a plain `$` directly
followed by a digit) because a `$` immediately followed by a digit in this file is misinterpreted as
a shell-style positional parameter (`\$1`, `\$2`, ...) and silently replaced with a word from the
skill invocation's `args` string when present — confirmed by testing. Keep the backslash on fixed
amounts here; the actual generated document should still use a plain, unescaped `$`.

## Required inputs — ask if any are missing, do not guess

- Client name (for `ATTN:`)
- Project name and site address (for `RE:`), and APN if the client gave one
- Scope of work: one or more line items, each with a short description and a fee
- Any scope-specific exclusions beyond the standard ones listed below
- Date of issuance (default: today)
- A one-sentence, natural-language description of the project for the intro paragraph — don't just
  reuse the `RE:` line verbatim/lowercased, write it as a sentence (see `introText` below)

## Fixed content — always use these, never ask about them

- Letterhead: INNOV-R logo (`assets/innovr-logo.jpg`, top-right), 670 E. 32nd St., Ste. 11, Yuma, AZ
  85365
- Signature block: Arturo J. Garcia, PE — Project Manager/Designer, INNOV-R, (919) 213-7623,
  Arturo@innovr.us
- Proposal validity: 30 days from the date of issuance
- Payment terms: a \$1,000.00 down payment required to initiate work; remaining balance billed as work
  progresses and fully due at completion; other design services not listed may be provided on request
  at separately negotiated fees
- Baseline exclusions (always include, then append any scope-specific ones): permit or review fees,
  attendance at County meetings
- Standard closing paragraph: "Should you have any questions regarding this fee proposal, please do
  not hesitate to give me a call. I personally look forward to working with you on this project and
  remain available to continue our work."

## Document structure (what the script produces)

```
Fee Proposal                                                    [INNOV-R LOGO]
                                                670 E. 32nd St., Ste. 11, Yuma, AZ 85365

[Date]

ATTN: [Client name]
RE:   [Project name] – [one-line scope description]
      [Address]
      [APN — omitted if none given]

Greetings,

It is our pleasure to provide you with this proposal for [introText]. The extent of our scope is as
follows:

I.  [Scope item] ……………………………………………………………………… $[fee]
(repeat as II., III., ... for additional line items)

Exceptions:
[Baseline + scope-specific exclusions as one paragraph.]

Note:
- This proposal valid for 30 days from the date of issuance.

The professional fee for this work shall be a stipulated sum of [total amount in words] dollars. A
\$1,000.00 down payment is required to initiate work, remaining balances will be billed as work
progresses and fully due at completion of work. Other design services not specifically included in
this proposal may be provided upon request by the Client at fees negotiated for those services.

[Standard closing paragraph]

Sincerely,                                    Accepted by:


Arturo J. Garcia, PE                          _______________________________________
Project Manager/Designer                      Signature                          Date
INNOV-R
Architecture+Engineering+Construction         _______________________________________
(919) 213-7623                                Print Name                         Date
Arturo@innovr.us
```

## Steps

1. Gather the required inputs above; ask for anything missing rather than guessing. Never just
   lowercase the `RE:` title for the intro paragraph — write `introText` as a natural sentence
   fragment (e.g. `"the deck addition at the above reference address"`).
2. Spell out the total fee in words for `totalWords`, WITHOUT the trailing word "dollars" — the
   template already appends it (e.g. \$3,500.00 → `"three thousand five hundred"`, not
   `"three thousand five hundred dollars"`).
3. Write a data JSON file matching the shape documented at the top of
   `scripts/generate-proposal.js` (client, project, address, apn, introText, scopeItems,
   exclusionsExtra, totalWords, date).
4. Run the generator: `node scripts/generate-proposal.js data.json output.docx`. If it fails with
   `Cannot find module 'docx'`, install it to a fixed location and point Node at it rather than
   installing next to the script (avoids committing `node_modules` to the repo):
   `npm install --prefix /tmp/docx-deps docx && NODE_PATH=/tmp/docx-deps/node_modules node scripts/generate-proposal.js data.json output.docx`
5. Convert to PDF: `python <path-to-docx-skill>/scripts/office/soffice.py --headless --convert-to pdf output.docx`.
   If LibreOffice fails with "source file could not be loaded", the `libreoffice-writer` package is
   likely missing (only `libreoffice-core` installed) — `apt-get update && apt-get install -y
   libreoffice-writer poppler-utils` fixes it (confirmed by testing in this sandbox).
6. Before delivering, render the PDF to an image (`pdftoppm -jpeg -r 120 output.pdf page`) and look at
   it — check the fee amounts, client/project names, and that nothing reads awkwardly.
7. Deliver both files to the user. Never send or share the proposal with the client directly — that's
   the user's decision.
