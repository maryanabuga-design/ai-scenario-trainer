import { JoinView } from "@/components/JoinView/JoinView";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JoinView code={decodeURIComponent(code)} />;
}
