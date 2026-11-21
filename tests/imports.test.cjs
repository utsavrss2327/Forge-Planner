/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { load } = require("./helpers.cjs"),
  ExcelJS = require("exceljs"),
  JSZip = require("jszip");
const { extractRoadmapFile, validateImport } = load(
  "src/lib/imports/roadmap.ts",
  {
    "server-only": {},
    exceljs: { default: ExcelJS },
    "@/lib/ai/client": {
      aiConfiguration: () => ({ provider: "gemini", apiKey: undefined }),
    },
  },
);
test("text and real multi-sheet XLSX extraction preserve worksheet/row evidence without evaluating formulas", async () => {
  const text = await extractRoadmapFile(
    "plan.txt",
    Buffer.from("DBMS | Transactions | 60"),
  );
  assert.equal(text.text, "DBMS | Transactions | 60");
  const book = new ExcelJS.Workbook();
  book.addWorksheet("DBMS").addRow(["Transactions", 60]);
  book.addWorksheet("Networks").addRow(["TCP", 45]);
  const result = await extractRoadmapFile(
    "plan.xlsx",
    Buffer.from(await book.xlsx.writeBuffer()),
  );
  assert.match(result.text, /DBMS \/ row 1/);
  assert.match(result.text, /Networks \/ row 1/);
});
test("DOCX extracts text without rendering untrusted markup", async () => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Networks | TCP | 60</w:t></w:r></w:p></w:body></w:document>',
  );
  const r = await extractRoadmapFile(
    "plan.docx",
    await zip.generateAsync({ type: "nodebuffer" }),
  );
  assert.match(r.text, /Networks \| TCP \| 60/);
});
test("imports reject oversized, spoofed and unsupported files; missing vision key is honest", async () => {
  assert.throws(() => validateImport("attack.exe", Buffer.from("text")));
  assert.throws(() => validateImport("fake.pdf", Buffer.from("not pdf")));
  assert.throws(() => validateImport("big.txt", Buffer.alloc(1500001)));
  assert.throws(() => validateImport("fake.xlsx", Buffer.from("no zip")));
  await assert.rejects(
    extractRoadmapFile("plan.pdf", Buffer.from("%PDF-1.7 test")),
    /Gemini API key/,
  );
});

test("Office import bounds actual inflation when archive metadata lies about expanded size", async () => {
  const zip = new JSZip();
  zip.file("oversized.xml", "A".repeat(21000000));
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  for (let i = 0; i + 46 < bytes.length; i++)
    if (bytes.readUInt32LE(i) === 0x02014b50) {
      bytes.writeUInt32LE(1, i + 24);
      break;
    }
  assert.throws(() => validateImport("bomb.docx", bytes));
});
