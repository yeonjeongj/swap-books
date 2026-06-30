import { Client } from "@notionhq/client";
import type {
  BlockObjectRequest,
  RichTextItemRequest,
} from "@notionhq/client/build/src/api-endpoints";
import type { ExportData, BookSection, NoteWithComments } from "./buildExportData";

function h1(text: string): BlockObjectRequest {
  return {
    type: "heading_1",
    heading_1: { rich_text: [{ type: "text", text: { content: text } }] },
  };
}

function h2(text: string): BlockObjectRequest {
  return {
    type: "heading_2",
    heading_2: { rich_text: [{ type: "text", text: { content: text } }] },
  };
}

function paragraph(richText: RichTextItemRequest[]): BlockObjectRequest {
  return { type: "paragraph", paragraph: { rich_text: richText } };
}

function plainParagraph(text: string): BlockObjectRequest {
  return paragraph([{ type: "text", text: { content: text } }]);
}

function quote(text: string): BlockObjectRequest {
  return {
    type: "quote",
    quote: { rich_text: [{ type: "text", text: { content: text } }] },
  };
}

function divider(): BlockObjectRequest {
  return { type: "divider", divider: {} };
}

function noteBlocks(note: NoteWithComments): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  blocks.push(
    paragraph([{ type: "text", text: { content: `${note.page}p` }, annotations: { bold: true } }])
  );

  if (note.quote) {
    blocks.push(quote(note.quote));
  }

  if (note.image_url) {
    blocks.push(plainParagraph(`이미지: ${note.image_url}`));
  }

  const levelOne = note.reading_note_comments.filter((c) => !c.parent_id);
  const levelTwo = note.reading_note_comments.filter((c) => c.parent_id);

  for (const c of [...levelOne, ...levelTwo]) {
    const indent = c.parent_id ? "    " : "  ";
    blocks.push(
      paragraph([
        { type: "text", text: { content: `${indent}${c.author?.nickname ?? "독자"}: ` }, annotations: { bold: true } },
        { type: "text", text: { content: c.text } },
      ])
    );
  }

  return blocks;
}

function sectionBlocks(section: BookSection, sectionLabel?: string): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  const headingText = sectionLabel
    ? `${sectionLabel} — ${section.book.title}`
    : section.book.title;

  blocks.push(h1(headingText));

  const metaParts: RichTextItemRequest[] = [
    { type: "text", text: { content: "저자: " }, annotations: { bold: true } },
    { type: "text", text: { content: section.book.author } },
  ];
  if (section.book.publisher) {
    metaParts.push({ type: "text", text: { content: "  |  출판사: " }, annotations: { bold: true } });
    metaParts.push({ type: "text", text: { content: section.book.publisher } });
  }
  blocks.push(paragraph(metaParts));

  blocks.push(
    paragraph([
      { type: "text", text: { content: "기록자: " }, annotations: { bold: true } },
      { type: "text", text: { content: section.recorderNickname } },
    ])
  );

  if (section.book.cover_image) {
    blocks.push(
      paragraph([
        { type: "text", text: { content: "표지: " }, annotations: { bold: true } },
        { type: "text", text: { content: section.book.cover_image, link: { url: section.book.cover_image } } },
      ])
    );
  }

  if (section.notes.length === 0) {
    blocks.push(plainParagraph("(기록된 문구 없음)"));
    return blocks;
  }

  blocks.push(h2("문구 목록"));

  for (const note of section.notes) {
    blocks.push(...noteBlocks(note));
  }

  return blocks;
}

export function buildNotionBlocks(data: ExportData, appUrl: string): { title: string; blocks: BlockObjectRequest[] } {
  const blocks: BlockObjectRequest[] = [];
  let title: string;

  if (data.kind === "solo") {
    title = data.section.book.title;
    blocks.push(...sectionBlocks(data.section));
  } else {
    title = `${data.requesterSection.book.title} / ${data.receiverSection.book.title} 스왑 기록`;

    blocks.push(
      h1("스왑 개요"),
      paragraph([
        { type: "text", text: { content: "참여자: " }, annotations: { bold: true } },
        { type: "text", text: { content: `${data.requesterNickname} ↔ ${data.receiverNickname}` } },
      ]),
      paragraph([
        { type: "text", text: { content: "시작일: " }, annotations: { bold: true } },
        { type: "text", text: { content: data.swapCreatedAt.slice(0, 10) } },
      ]),
      paragraph([
        { type: "text", text: { content: "책 목록: " }, annotations: { bold: true } },
        { type: "text", text: { content: `${data.requesterSection.book.title} / ${data.receiverSection.book.title}` } },
      ]),
      divider(),
      ...sectionBlocks(data.requesterSection, `${data.requesterNickname}가 기록한 책`),
      divider(),
      ...sectionBlocks(data.receiverSection, `${data.receiverNickname}가 기록한 책`)
    );
  }

  blocks.push(
    divider(),
    paragraph([
      { type: "text", text: { content: "전체 기록은 스왑북스에서 확인하세요 → " } },
      { type: "text", text: { content: appUrl, link: { url: appUrl } } },
    ])
  );

  return { title, blocks };
}

const NOTION_BLOCK_LIMIT = 100;

export async function createNotionPage(
  accessToken: string,
  data: ExportData,
  appUrl: string
): Promise<string> {
  const notion = new Client({ auth: accessToken });
  const { title, blocks } = buildNotionBlocks(data, appUrl);

  // Public Integration은 workspace root 접근 불가 — OAuth로 공유된 첫 번째 페이지를 parent로 사용
  const searchResponse = await notion.search({
    filter: { property: "object", value: "page" },
    page_size: 1,
  });

  const parentPage = searchResponse.results[0];
  if (!parentPage) {
    throw new Error(
      "노션에서 공유된 페이지를 찾을 수 없습니다. 노션 설정에서 페이지 접근 권한을 허용해주세요."
    );
  }

  const firstBatch = blocks.slice(0, NOTION_BLOCK_LIMIT - 2);
  const remaining = blocks.slice(NOTION_BLOCK_LIMIT - 2);

  const response = await notion.pages.create({
    parent: { page_id: parentPage.id },
    properties: {
      title: { title: [{ type: "text", text: { content: title } }] },
    },
    children: firstBatch,
  });

  if (remaining.length > 0) {
    for (let i = 0; i < remaining.length; i += NOTION_BLOCK_LIMIT) {
      await notion.blocks.children.append({
        block_id: response.id,
        children: remaining.slice(i, i + NOTION_BLOCK_LIMIT),
      });
    }
  }

  return `https://notion.so/${response.id.replace(/-/g, "")}`;
}
