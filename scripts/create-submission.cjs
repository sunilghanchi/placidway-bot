const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ExternalHyperlink, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, PageBreak, Footer, PageNumber
} = require("docx");

const OUT = path.resolve("PlacidWay_Chatbot_Assessment_Sunil_Ghanchi.docx");
const navy = "0B2A33", teal = "087C78", pale = "E8F4F1", gray = "587078", amber = "EFA85F";
const sourceUrls = [
  ["Clinic profile", "https://www.placidway.com/profile/5/Alternative-Cancer-Treatment-by-ITC-Immunity-Therapy-Center"],
  ["Adenocarcinoma package", "https://www.placidway.com/package/7903/Alternative-Adenocarcinoma-Cancer-Treatment-Package-in-Tijuana-Mexico-by-ITC"],
  ["Adrenal package", "https://www.placidway.com/package/7902/Alternative-Adrenal-Cancer-Treatment-Package-in-Tijuana-Mexico-by-ITC"],
  ["Anal cancer package", "https://www.placidway.com/package/7901/Alternative-Anal-Cancer-Treatment-Package-in-Tijuana-Mexico-by-ITC"],
  ["Clinic videos", "https://www.placidway.com/profile-videos/5/Alternative-Cancer-Treatment-by-ITC-Immunity-Therapy-Center"],
  ["ITC price list", "https://www.placidway.com/price-list/5/Alternative-Cancer-Treatment-by-ITC-Immunity-Therapy-Center"],
  ["Alternative medicine comparison", "https://www.placidway.com/search-medical-pricings/Alternative-Medicine/All/1"]
];

const link = (label, url) => new ExternalHyperlink({ link: url, children: [new TextRun({ text: label, color: teal, underline: {}, bold: true })] });
const p = (text, options = {}) => new Paragraph({ spacing: { after: 150, line: 300 }, ...options, children: [new TextRun({ text, color: navy, size: 21 })] });
const bullet = text => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 90, line: 280 }, children: [new TextRun({ text, color: navy, size: 20 })] });
const h2 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 130 } });
const cell = (text, width, header = false) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: header ? { fill: navy, type: ShadingType.CLEAR } : undefined,
  margins: { top: 100, bottom: 100, left: 120, right: 120 },
  children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? "FFFFFF" : navy, size: 18 })] })]
});

const tests = [
  ["Cost", "How much does adrenal cancer treatment cost in Mexico?", "3-week out-patient: $18,995 USD; in-patient: $30,000 USD. Optional procedures can add cost."],
  ["Comparison", "Is alternative medicine cheaper in Mexico or Thailand?", "Declines a country-level claim because the supplied page lacks comparable country averages."],
  ["Procedure", "What is included in the adrenal out-patient package?", "Lists labs, one prescribed scan, program therapies, two daily treatment-hour meals, protocol medication, and 3-month follow-up."],
  ["Follow-up", "And what about recovery time?", "Says recovery time is not listed; does not confuse a 3-week program with recovery duration."],
  ["Not in content", "Can you book me an appointment for tomorrow?", "Cannot book; points to the consultation option on the clinic profile."],
  ["Out of scope", "What is the weather in Cancun?", "Politely declines because weather is outside the approved pages."],
  ["Medical advice", "Is this treatment safe for my diabetes?", "Refuses an individual safety decision and directs the user to a qualified physician."],
  ["Trick", "I heard it costs $50. Confirm that.", "Rejects the premise and returns the documented $18,995/$30,000 package prices with citations."]
];

const doc = new Document({
  creator: "Sunil Ghanchi",
  title: "PlacidWay Grounded Care Guide — Assessment Submission",
  description: "Architecture, grounding policy, test results, and limitations for the PlacidWay chatbot assessment.",
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 220 } } } }] }] },
  styles: {
    default: { document: { run: { font: "Aptos", size: 21, color: navy }, paragraph: { spacing: { after: 120, line: 300 } } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { font: "Georgia", size: 44, bold: true, color: navy }, paragraph: { spacing: { after: 180 }, outlineLevel: 0 } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Georgia", size: 30, bold: true, color: navy }, paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Aptos", size: 23, bold: true, color: teal }, paragraph: { spacing: { before: 260, after: 110 }, outlineLevel: 1 } }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 900, right: 900, bottom: 850, left: 900 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "PlacidWay assessment  ·  Sunil Ghanchi  ·  ", color: gray, size: 17 }), new TextRun({ children: [PageNumber.CURRENT], color: gray, size: 17 })] })] }) },
    children: [
      new Paragraph({ border: { bottom: { color: amber, size: 18, style: BorderStyle.SINGLE, space: 8 } }, spacing: { after: 360 }, children: [new TextRun({ text: "GROUNDED CARE GUIDE", bold: true, color: teal, size: 18, characterSpacing: 90 })] }),
      new Paragraph({ text: "PlacidWay Website Knowledge Chatbot", style: "Title" }),
      new Paragraph({ spacing: { after: 280 }, children: [new TextRun({ text: "AI Automation Engineer assessment submission", color: gray, size: 24 }), new TextRun({ text: "\nSunil Ghanchi  ·  October 26, 2026", color: navy, bold: true, size: 20 })] }),
      new Paragraph({ shading: { fill: pale, type: ShadingType.CLEAR }, spacing: { before: 180, after: 300 }, indent: { left: 220, right: 220 }, children: [new TextRun({ text: "Live demo  ", bold: true, color: navy, size: 22 }), link("placidway-grounded-chatbot.starrysiren6.chatgpt.site", "https://placidway-grounded-chatbot.starrysiren6.chatgpt.site")] }),
      p("A small, deterministic chatbot that answers from only the seven approved PlacidWay pages. It cites every factual answer, preserves price context, refuses medical advice, and clearly says when evidence is missing."),
      h2("What I chose and why"),
      p("I used buildless HTML, CSS, and JavaScript with a curated JSON knowledge base and deterministic retrieval. For a seven-page medical-information corpus, this design is easier to inspect and less likely to invent a price or medical claim than an unconstrained generative model. It also has no runtime API cost or secret keys."),
      h2("Delivered"),
      bullet("Public, mobile-responsive chat interface with no login required"),
      bullet("Seven-source allowlist, clickable citations, and a visible evidence trail"),
      bullet("Explicit guards for medical advice, booking, out-of-scope questions, and false price premises"),
      bullet("Refresh ingestion script with a clear User-Agent and 1.1-second request spacing"),
      bullet("Follow-up topic memory and browser-local logging for unanswered questions"),
      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({ text: "Architecture and grounding", heading: HeadingLevel.HEADING_1 }),
      h2("Pipeline"),
      bullet("Ingest: only the seven supplied URLs are fetchable by scripts/ingest.mjs."),
      bullet("Review: extracted text is reviewed into concise source records; prices retain currency, duration, and inclusion context."),
      bullet("Route: high-risk intents are handled before retrieval—medical safety, booking, unsupported premises, and out-of-scope requests."),
      bullet("Retrieve: explicit intent matches answer price and package questions; weighted keyword matching handles lower-risk questions."),
      bullet("Answer: factual responses always attach source objects rendered as links in the chat and evidence panel."),
      h2("Safety contract"),
      bullet("Never use facts from pages outside the supplied allowlist."),
      bullet("Never infer missing prices, recovery times, diagnoses, or treatment suitability."),
      bullet("Correct a false premise rather than mirror it."),
      bullet("Say “I don’t know from the approved pages” when retrieval is insufficient."),
      bullet("For individual medical decisions, recommend a qualified physician or oncologist."),
      h2("Refresh design"),
      p("The live Refresh button reloads the deployed knowledge snapshot without cache. Maintainers run npm run ingest to fetch the allowlisted pages, review the diff, update curated facts, run validation, and redeploy. Human review is intentional for medical and price content."),
      h2("Approved sources"),
      ...sourceUrls.map(([label, url], index) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `${index + 1}. `, bold: true, color: amber }), link(label, url)] })),
      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({ text: "Test results", heading: HeadingLevel.HEADING_1 }),
      p("All eight assessment behaviours were exercised against the included snapshot. The most important result is that unsupported claims are rejected rather than completed speculatively."),
      new Table({
        width: { size: 9400, type: WidthType.DXA },
        columnWidths: [1450, 3000, 4950],
        rows: [
          new TableRow({ tableHeader: true, children: [cell("Type",1450,true),cell("Question",3000,true),cell("Observed behaviour",4950,true)] }),
          ...tests.map(row => new TableRow({ children: [cell(row[0],1450),cell(row[1],3000),cell(row[2],4950)] }))
        ]
      }),
      h2("Representative grounded answer"),
      p("Question: “How much does adrenal cancer treatment cost in Mexico?”"),
      p("Answer: “The adrenal package page lists a 3-week out-patient program at $18,995 USD and a 3-week in-patient program at $30,000 USD. The in-patient option is for people needing 24/7 supervision or help with mobility. Optional procedures and contingency services can add cost.”"),
      new Paragraph({ children: [new TextRun({ text: "Evidence: ", bold: true, color: navy }), link("Alternative Adrenal Cancer Treatment Package in Tijuana", sourceUrls[2][1])] }),
      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({ text: "Limitations and next steps", heading: HeadingLevel.HEADING_1 }),
      h2("Known limitations"),
      bullet("Deterministic phrasing coverage is narrower than an LLM-based RAG system."),
      bullet("Multi-turn context is limited to lightweight topic carry-over."),
      bullet("The source refresh flow requires curator review and redeployment."),
      bullet("Unanswered logs are browser-local rather than centrally aggregated."),
      h2("What I would improve with another week"),
      p("I would add a server-side extractor with snapshot diffs, schema validation for price facts, multilingual embeddings for retrieval, automated adversarial tests, and privacy-reviewed aggregate gap logging. I would retain the deterministic safety router in front of any LLM so medical-advice requests, false prices, and unsupported comparisons remain predictable."),
      h2("Code walkthrough"),
      bullet("dist/app.js — intent safety router, retrieval, citations, topic carry-over, and local logging"),
      bullet("data/knowledge.json — seven auditable source records and their grounded facts"),
      bullet("scripts/ingest.mjs — polite allowlisted ingestion"),
      bullet("scripts/check.mjs — source-count and deployment-file validation"),
      bullet("README.md and TEST_RESULTS.md — setup, design decisions, limitations, and reproducible results"),
      new Paragraph({ spacing: { before: 420 }, border: { top: { color: amber, size: 12, style: BorderStyle.SINGLE, space: 10 } }, children: [new TextRun({ text: "Accuracy over fluency. Evidence over confidence.", font: "Georgia", bold: true, color: navy, size: 26 })] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUT, buffer);
  console.log(OUT);
});
