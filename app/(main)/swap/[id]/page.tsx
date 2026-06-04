import { auth } from "@/lib/auth";
import SwapDetail from "./SwapDetail";

export default async function SwapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  return <SwapDetail swapId={id} currentUserId={session?.user?.id ?? null} />;
}
