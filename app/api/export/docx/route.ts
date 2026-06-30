import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildExportData } from "@/lib/export/buildExportData";
import { generateDocx } from "@/lib/export/docxGenerator";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const swapId = req.nextUrl.searchParams.get("swapId");
  const userBookId = req.nextUrl.searchParams.get("userBookId");

  if (!swapId && !userBookId) {
    return NextResponse.json({ error: "swapId 또는 userBookId가 필요합니다" }, { status: 400 });
  }

  try {
    const data = await buildExportData(
      session.user.id,
      swapId ? { swapId } : { userBookId: userBookId! }
    );

    const buffer = await generateDocx(data);

    const filename = swapId
      ? `swap-${swapId.slice(0, 8)}.docx`
      : `book-${userBookId!.slice(0, 8)}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
