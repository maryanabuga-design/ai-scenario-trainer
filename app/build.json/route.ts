/** The commit this build was made from, as JSON: a deployment can be told apart from the one before it. */
export function GET() {
  return Response.json({ build: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev" });
}
