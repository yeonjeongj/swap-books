import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import type { ExportData, BookSection, NoteWithComments } from "./buildExportData";

function noteParagraphs(note: NoteWithComments): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: `${note.page}p`, bold: true, size: 22 })],
      spacing: { before: 240, after: 80 },
    })
  );

  if (note.quote) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `"${note.quote}"`, italics: true })],
        indent: { left: 720 },
        spacing: { after: 80 },
      })
    );
  }

  if (note.image_url) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `이미지: ${note.image_url}`, color: "888888", size: 18 })],
        indent: { left: 720 },
        spacing: { after: 80 },
      })
    );
  }

  const levelOne = note.reading_note_comments.filter((c) => !c.parent_id);
  const levelTwo = note.reading_note_comments.filter((c) => c.parent_id);

  for (const c of [...levelOne, ...levelTwo]) {
    const indent = c.parent_id ? 1440 : 720;
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${c.author?.nickname ?? "독자"}: `, bold: true, size: 18 }),
          new TextRun({ text: c.text, size: 18 }),
        ],
        indent: { left: indent },
        spacing: { after: 60 },
      })
    );
  }

  return paragraphs;
}

function sectionParagraphs(section: BookSection, sectionLabel?: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  const headingText = sectionLabel
    ? `${sectionLabel} — ${section.book.title}`
    : section.book.title;

  paragraphs.push(
    new Paragraph({
      text: headingText,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 480, after: 120 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: "저자: ", bold: true }),
        new TextRun(section.book.author),
        ...(section.book.publisher
          ? [new TextRun("  |  "), new TextRun({ text: "출판사: ", bold: true }), new TextRun(section.book.publisher)]
          : []),
      ],
      spacing: { after: 60 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: "기록자: ", bold: true }),
        new TextRun(section.recorderNickname),
      ],
      spacing: { after: 60 },
    })
  );

  if (section.book.cover_image) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `표지: ${section.book.cover_image}`, color: "888888", size: 18 })],
        spacing: { after: 120 },
      })
    );
  }

  if (section.notes.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: "(기록된 문구 없음)", color: "888888" })],
        spacing: { before: 120 },
      })
    );
    return paragraphs;
  }

  paragraphs.push(
    new Paragraph({
      text: "문구 목록",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    })
  );

  for (const note of section.notes) {
    paragraphs.push(...noteParagraphs(note));
  }

  return paragraphs;
}

export async function generateDocx(data: ExportData): Promise<Buffer> {
  let children: Paragraph[];

  if (data.kind === "solo") {
    children = sectionParagraphs(data.section);
  } else {
    const overview: Paragraph[] = [
      new Paragraph({
        text: "스왑 개요",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "참여자: ", bold: true }),
          new TextRun(`${data.requesterNickname} ↔ ${data.receiverNickname}`),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "시작일: ", bold: true }),
          new TextRun(data.swapCreatedAt.slice(0, 10)),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "책 목록: ", bold: true }),
          new TextRun(`${data.requesterSection.book.title} / ${data.receiverSection.book.title}`),
        ],
        spacing: { after: 120 },
      }),
    ];

    children = [
      ...overview,
      ...sectionParagraphs(data.requesterSection, `${data.requesterNickname}가 기록한 책`),
      ...sectionParagraphs(data.receiverSection, `${data.receiverNickname}가 기록한 책`),
    ];
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
