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
//   "address": "123 Test St, Yuma, AZ 85364",
//   "apn": null,                              // omit or null if none given
//   "introText": "the deck addition at the above reference address",
//   "scopeItems": [
//     { "label": "Structural Plans and Calculations for deck addition", "fee": "$2,000.00" }
//   ],
//   "exclusionsExtra": "",                    // scope-specific exclusions beyond the baseline, or ""
//   "totalWords": "two thousand"              // fee spelled out, WITHOUT the trailing word "dollars"
// }
//
// Requires the `docx` npm package. If `require("docx")` fails, run
// `npm install docx` in this script's working directory first (see the
// docx skill for details) — it is not committed to this repo.

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

const FONT = "Times New Roman";
const PAGE_WIDTH = 12240, PAGE_HEIGHT = 15840, MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LOGO_PATH = path.join(__dirname, "..", "assets", "innovr-logo.jpg");

const body = (text) => new Paragraph({
  spacing: { after: 200 },
  children: [new TextRun({ text, font: FONT, size: 22 })],
});

const dotLine = (left, right) => new Paragraph({
  spacing: { after: 100 },
  children: [
    new TextRun({
      font: FONT, size: 22,
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

const logoImage = fs.existsSync(LOGO_PATH)
  ? new ImageRun({ type: "jpg", data: fs.readFileSync(LOGO_PATH), transformation: { width: 90, height: 90 } })
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
            ...(logoImage ? [new Paragraph({ alignment: AlignmentType.RIGHT, children: [logoImage] })] : []),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
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
  new Paragraph({
    spacing: { after: 0 },
    indent: { left: 720 },
    children: [new TextRun({ text: data.address, bold: true, font: FONT, size: 22 })],
  }),
  ...(data.apn ? [new Paragraph({
    spacing: { after: 200 },
    indent: { left: 720 },
    children: [new TextRun({ text: `APN ${data.apn}`, bold: true, font: FONT, size: 22 })],
  })] : [new Paragraph({ spacing: { after: 200 }, children: [] })]),
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const scopeParas = [
  body("Greetings,"),
  body(`It is our pleasure to provide you with this proposal for ${data.introText}. The extent of our scope is as follows:`),
  ...data.scopeItems.map((item, i) => dotLine(`${ROMAN[i]}.  ${item.label} `, ` ${item.fee}`)),
  new Paragraph({ spacing: { after: 200 }, children: [] }),
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: "Exceptions:", bold: true, underline: {}, font: FONT, size: 22 })],
  }),
  body(
    "This proposal does not include permit or review fees or attendance at County meetings" +
    (data.exclusionsExtra ? `, ${data.exclusionsExtra}` : "") + "."
  ),
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: "Note:", bold: true, underline: {}, font: FONT, size: 22 })],
  }),
  body("- This proposal valid for 30 days from the date of issuance."),
  body(
    `The professional fee for this work shall be a stipulated sum of ${data.totalWords} dollars. A ` +
    `$1,000.00 down payment is required to initiate work, remaining balances will be billed as work ` +
    `progresses and fully due at completion of work. Other design services not specifically included ` +
    `in this proposal may be provided upon request by the Client at fees negotiated for those services.`
  ),
  body(
    "Should you have any questions regarding this fee proposal, please do not hesitate to give me a " +
    "call. I personally look forward to working with you on this project and remain available to " +
    "continue our work."
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
            new Paragraph({ children: [new TextRun({ text: "Arturo J. Garcia, PE", bold: true, font: FONT, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Project Manager/Designer", font: FONT, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "INNOV-R", bold: true, font: FONT, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Architecture+Engineering+Construction", font: FONT, size: 18 })] }),
            new Paragraph({ children: [new TextRun({ text: "(919) 213-7623", font: FONT, size: 18 })] }),
            new Paragraph({ children: [new TextRun({ text: "Arturo@innovr.us", font: FONT, size: 18 })] }),
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
  console.log(`Wrote ${outputPath}`);
});
