// Generates an INNOV-R fee proposal .docx from a JSON data file.
//
// Usage:
//   node generate-proposal.js <data.json> <output.docx>
//
// data.json shape:
// {
//   "date": "August 30, 2026",
//   "clientName": "Jane Doe",
//   "reTitle": "Test Residence – Deck Addition",
//   "address": "123 Test St, Yuma, AZ 85364",  // "" if the project is only identified by APN
//   "apn": null,                              // omit or null if none given
//   "introText": "the deck addition at the above reference address",
//   "sections": [                             // one or more scope-of-work sections
//     {
//       "title": "Structural Engineering",
//       "deliverables": ["Structural Plans", "Structural Calculations"], // [] is fine (e.g. Landscaping)
//       "fee": 3500                           // plain number, no "$" — this section's fee
//     }
//   ],
//   "exclusionsExtra": [],                    // extra numbered exclusion items beyond baseline, or []
//   "includeAdeqFaaExclusions": false,        // true for grading/drainage/environmental/airport-adjacent work
//   "downPaymentPercent": 30                  // omit to use the 30% default; some projects run 50% — ask
// }
//
// Total fee, its down payment, and the amount spelled out in words are all computed here —
// never hand-type totals or word-spellings into the data file.
//
// Requires the `docx` npm package. If `require("docx")` fails, run
// `npm install --prefix /tmp/docx-deps docx` and re-run this script with
// `NODE_PATH=/tmp/docx-deps/node_modules` set — see SKILL.md. Do not commit node_modules.

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, PositionalTab, PositionalTabAlignment,
  PositionalTabLeader, PositionalTabRelativeTo, VerticalAlign,
} = require("docx");

const [, , dataPath, outputPath] = process.argv;
if (!dataPath || !outputPath) {
  console.error("Usage: node generate-proposal.js <data.json> <output.docx>");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const downPaymentPercent = data.downPaymentPercent ?? 30;

// ---- number -> words (whole dollars only; these proposals never quote cents) ----
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function threeDigitsToWords(n) {
  let s = "";
  if (n >= 100) { s += `${ONES[Math.floor(n / 100)]} hundred`; n %= 100; if (n) s += " "; }
  if (n >= 20) { s += TENS[Math.floor(n / 10)]; if (n % 10) s += `-${ONES[n % 10]}`; }
  else if (n > 0) { s += ONES[n]; }
  return s;
}
function numberToWords(num) {
  num = Math.round(num);
  if (num === 0) return "zero";
  const parts = [];
  const groups = [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"], [1, ""]];
  let rest = num;
  for (const [size, name] of groups) {
    const count = Math.floor(rest / size);
    if (count > 0) {
      parts.push(name ? `${threeDigitsToWords(count)} ${name}` : threeDigitsToWords(count));
      rest %= size;
    }
  }
  return parts.join(" ");
}
const money = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const totalFee = data.sections.reduce((sum, s) => sum + s.fee, 0);
const downPayment = Math.round(totalFee * downPaymentPercent / 100);

const FONT = "Times New Roman";
const PAGE_WIDTH = 12240, PAGE_HEIGHT = 15840, MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LOGO_PATH = path.join(__dirname, "..", "assets", "innovr-logo.jpg");

const body = (text) => new Paragraph({
  spacing: { after: 200 },
  children: [new TextRun({ text, font: FONT, size: 22 })],
});

const dotLine = (left, right, bold = false) => new Paragraph({
  spacing: { after: 60 },
  children: [
    new TextRun({
      font: FONT, size: 22, bold,
      children: [
        left,
        new PositionalTab({
          alignment: PositionalTabAlignment.RIGHT,
          relativeTo: PositionalTabRelativeTo.MARGIN,
          leader: PositionalTabLeader.DOT,
        }),
        right,
      ],
    }),
  ],
});

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// Logo is pre-trimmed to its visible content (no baked-in whitespace border) — see assets/innovr-logo.jpg.
// Its native aspect ratio is ~5.1:1; keep width:height at that ratio if resizing.
const logoImage = fs.existsSync(LOGO_PATH)
  ? new ImageRun({ type: "jpg", data: fs.readFileSync(LOGO_PATH), transformation: { width: 170, height: 33 } })
  : null;

const header = new Table({
  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
  columnWidths: [CONTENT_WIDTH * 0.5, CONTENT_WIDTH * 0.5],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [new Paragraph({
            children: [new TextRun({ text: "Fee Proposal", bold: true, font: FONT, size: 28 })],
          })],
        }),
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.TOP,
          children: [
            ...(logoImage ? [new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40 },
              children: [logoImage],
            })] : []),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 0 },
              children: [new TextRun({ text: "670 E. 32nd St., Ste. 11, Yuma, AZ 85365", font: FONT, size: 18 })],
            }),
          ],
        }),
      ],
    }),
  ],
});

const attnRe = [
  body(data.date),
  new Paragraph({ spacing: { after: 200 }, children: [] }),
  new Paragraph({
    spacing: { after: 0 },
    children: [
      new TextRun({ text: "ATTN: ", bold: true, font: FONT, size: 22 }),
      new TextRun({ text: data.clientName, bold: true, font: FONT, size: 22 }),
    ],
  }),
  new Paragraph({
    spacing: { after: 0 },
    children: [
      new TextRun({ text: "RE:   ", bold: true, font: FONT, size: 22 }),
      new TextRun({ text: data.reTitle, bold: true, font: FONT, size: 22 }),
    ],
  }),
  ...(data.address ? [new Paragraph({
    spacing: { after: 0 },
    indent: { left: 720 },
    children: [new TextRun({ text: data.address, bold: true, font: FONT, size: 22 })],
  })] : []),
  ...(data.apn ? [new Paragraph({
    spacing: { after: 0 },
    indent: { left: 720 },
    children: [new TextRun({ text: `APN: ${data.apn}`, bold: true, font: FONT, size: 22 })],
  })] : []),
  new Paragraph({ spacing: { after: 200 }, children: [] }),
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const ALPHA = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

const sectionParas = data.sections.flatMap((section, i) => [
  dotLine(`${ROMAN[i]}.  ${section.title} `, ` ${money(section.fee)}`, true),
  ...section.deliverables.map((d, j) => new Paragraph({
    spacing: { after: 40 },
    indent: { left: 720 },
    children: [new TextRun({ text: `${ALPHA[j]}. ${d}`, font: FONT, size: 22 })],
  })),
]);

const numberedItem = (n, text) => new Paragraph({
  spacing: { after: 60 },
  indent: { left: 360 },
  children: [new TextRun({ text: `${n}. ${text}`, font: FONT, size: 22 })],
});

const exclusionItems = [
  "Services not specifically listed above",
  data.includeAdeqFaaExclusions
    ? "Application, review, or agency fees (County, City or ADEQ fees)"
    : "Application, review, or agency fees (County or City fees)",
  ...(data.includeAdeqFaaExclusions ? ["ADEQ or FAA documentation"] : []),
  ...(data.exclusionsExtra || []),
];

const additionalNotes = [
  "Additional services beyond those listed may be provided under a separate proposal upon client's request.",
  "The listed fee is a packaged amount. Removal of individual items from the scope will require a revised proposal.",
  "This proposal is valid for 30 days from the date above.",
];

const scopeParas = [
  body("Greetings,"),
  body(`It is our pleasure to provide you with this proposal for ${data.introText}. The extent of our scope is as follows:`),
  ...sectionParas,
  new Paragraph({ spacing: { before: 100, after: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000" } }, children: [] }),
  dotLine("Total ", ` ${money(totalFee)}`, true),
  new Paragraph({ spacing: { after: 200 }, children: [] }),
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: "Exclusions:", bold: true, font: FONT, size: 22 })],
  }),
  body("This proposal does not include the following:"),
  ...exclusionItems.map((text, i) => numberedItem(i + 1, text)),
  new Paragraph({ spacing: { after: 140 }, children: [] }),
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: "Additional Notes:", bold: true, font: FONT, size: 22 })],
  }),
  ...additionalNotes.map((text, i) => numberedItem(i + 1, text)),
  new Paragraph({ spacing: { after: 140 }, children: [] }),
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: "Fee and Payment Terms", bold: true, font: FONT, size: 22 })],
  }),
  body(
    `The professional fee for the services described herein shall be a stipulated sum of ` +
    `${numberToWords(totalFee)} dollars (${money(totalFee)}). A ${downPaymentPercent}% down payment ` +
    `(${money(downPayment)}) is required to initiate work, with remaining balances billed as work ` +
    `progresses. Final payment is due upon completion of services.`
  ),
  body(
    "Please feel free to contact me with any questions or if additional clarification is needed. I " +
    "look forward to working with you on this project."
  ),
];

const sigTable = new Table({
  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
  columnWidths: [CONTENT_WIDTH * 0.5, CONTENT_WIDTH * 0.5],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA }, borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: "Sincerely,", font: FONT, size: 22 })] })],
        }),
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA }, borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: "Accepted by:", font: FONT, size: 22 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA }, borders: cellBorders,
          children: [new Paragraph({ spacing: { before: 400 }, children: [] })],
        }),
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA }, borders: cellBorders,
          children: [new Paragraph({
            spacing: { before: 400 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
            children: [new TextRun({ text: " ", font: FONT, size: 22 })],
          })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA }, borders: cellBorders,
          children: [
            new Paragraph({ children: [new TextRun({ text: "Arturo J. Garcia, P.E.", bold: true, font: FONT, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Principal Engineer", font: FONT, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "INNOV-R", bold: true, font: FONT, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Architecture+Engineering+Construction", font: FONT, size: 18 })] }),
            new Paragraph({ children: [new TextRun({ text: "Cell: (919) 213-7623", font: FONT, size: 18 })] }),
            new Paragraph({ children: [new TextRun({ text: "Email: Arturo@innovr.us", font: FONT, size: 18 })] }),
          ],
        }),
        new TableCell({
          width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA }, borders: cellBorders,
          children: [
            new Paragraph({ children: [new TextRun({ text: "Signature", italics: true, font: FONT, size: 18 })] }),
            new Paragraph({
              spacing: { before: 400 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
              children: [new TextRun({ text: " ", font: FONT, size: 22 })],
            }),
            new Paragraph({ children: [new TextRun({ text: "Print Name", italics: true, font: FONT, size: 18 })] }),
          ],
        }),
      ],
    }),
  ],
});

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      },
    },
    children: [
      header,
      new Paragraph({ spacing: { after: 200 }, children: [] }),
      ...attnRe,
      ...scopeParas,
      new Paragraph({ spacing: { after: 300 }, children: [] }),
      sigTable,
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outputPath, buf);
  console.log(`Wrote ${outputPath} — total ${money(totalFee)}, down payment ${money(downPayment)} (${downPaymentPercent}%)`);
});
