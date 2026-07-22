import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell" style={{ padding: "4rem 0", textAlign: "center" }}>
      <p className="display" style={{ fontSize: "3rem", margin: 0 }}>
        Ward
      </p>
      <h1 style={{ marginTop: "1rem" }}>Page not found</h1>
      <Link href="/" className="btn btn-primary">
        Go home
      </Link>
    </main>
  );
}
