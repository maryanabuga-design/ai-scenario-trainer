import { InvitationScreen } from "@/components/InvitationView/InvitationScreen";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <InvitationScreen code={decodeURIComponent(code)} />;
}
