import { redirect } from "next/navigation";

/** The Topics screen is now the Topics view of the Students tab. */
export default function TopicsRedirect() {
  redirect("/instructor/students?view=topics");
}
