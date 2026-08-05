import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ApplyPageContent from "./ApplyPageContent";

export default async function ApplyPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  return (
    <main className="container" style={{ paddingTop: 0 }}>
      <ApplyPageContent isLoggedIn={isLoggedIn} userName={session?.user?.name || session?.user?.email} />
    </main>
  );
}
