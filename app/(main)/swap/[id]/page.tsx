import SwapDetail from "./SwapDetail";

export default async function SwapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return <SwapDetail />;
}
