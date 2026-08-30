---
name: proposal
description: Generate an INNOV-R fee proposal (client, project, scope of work, fees) as a .docx and .pdf, following the firm's standard fee-proposal template. Use when asked to draft, create, or generate a fee proposal for a client.
---

# Fee proposal generator

Produces an INNOV-R Architecture+Engineering+Construction fee proposal matching the firm's standard
template, delivered as both a `.docx` and a `.pdf`. Built from two prior proposals on file
(structural plans/calculations jobs); the structure below is copied from them exactly.

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

## Fixed content — always use these, never ask about them

- Letterhead: INNOV-R / Architecture+Engineering+Construction, 670 E. 32nd St., Ste. 11, Yuma, AZ 85365,
  (919) 213-7623
- Signature block: Arturo J. Garcia, Project Manager/Designer, INNOV-R
- Proposal validity: 30 days from the date of issuance
- Payment terms: a \$1,000.00 down payment required to initiate work; remaining balance billed as work
  progresses and fully due at completion; other design services not listed may be provided on request
  at separately negotiated fees
- Baseline exclusions (always include, then append any scope-specific ones): permit or review fees,
  attendance at County meetings
- Standard closing paragraph: "Should you have any questions regarding this fee proposal, please do
  not hesitate to give me a call. I personally look forward to working with you on this project and
  remain available to continue our work."

## Document structure (follow exactly)

```
Fee Proposal

[Date]

ATTN: [Client name]
RE:   [Project name] – [one-line scope description]
      [Address]
      [APN — omit this line if none given]

Greetings,

[One paragraph introducing the proposal and scope, in the firm's voice — see prior examples for tone.]
The extent of our scope is as follows:

I.  [Scope item] ……………………………………………………………………… $[fee]
    a. [sub-item, if any]
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


Arturo J. Garcia                              _______________________________________
Project Manager/Designer                      Signature                          Date
INNOV-R
Architecture+Engineering+Construction         _______________________________________
(919) 213-7623                                Print Name                         Date
```

## Steps

1. Gather the required inputs above; ask for anything missing rather than guessing.
2. Spell out the total fee in words for the payment paragraph (e.g. \$3,500.00 → "three thousand five
   hundred dollars").
3. Load the `docx` skill and build the `.docx` following the structure exactly.
4. Convert it to `.pdf` (via the `pdf` skill, or the docx skill's own export path) so both files exist.
5. Deliver both files to the user. Never send or share the proposal with the client directly — that's
   the user's decision.
