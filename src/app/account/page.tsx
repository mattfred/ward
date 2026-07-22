import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "@/components/AccountForm";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <main className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 640 }}>
      <Link href="/dashboard" className="display" style={{ fontSize: "1.8rem" }}>
        Ward
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Account</h1>
      <AccountForm name={user.name || ""} email={user.email} plan={user.plan} />
    </main>
  );
}
