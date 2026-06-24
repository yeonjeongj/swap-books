import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BookDetail from "./BookDetail";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { data: book } = await supabase
    .from("user_books")
    .select("id, title, author, cover_image")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!book) notFound();

  return (
    <div className="w-full">
      <div style={{ borderBottom: "1px solid #E0E0E0", backgroundColor: "#ffffff" }}>
        <div className="max-w-3xl mx-auto px-5 py-4">
          <Link
            href="/my"
            style={{ fontSize: "0.75rem", color: "#888888", textDecoration: "none" }}
            className="hover:text-[#030505] transition-colors"
          >
            ← 마이페이지
          </Link>
        </div>
      </div>
      <BookDetail book={book} currentUserId={session.user.id} />
    </div>
  );
}
