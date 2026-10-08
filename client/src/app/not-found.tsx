import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const suggestions = [
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main
        id="main"
        className="container-page flex flex-1 flex-col items-start justify-center gap-6 py-24"
      >
        <p className="font-mono text-sm text-muted-foreground">
          <span className="text-brand-text">404</span> · page not found
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          This route doesn&apos;t exist.
        </h1>
        <p className="max-w-lg text-muted-foreground">
          The page may have moved, or the link is wrong. Try one of these instead:
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={cn(buttonVariants(), "h-10 px-4")}>
            Back home
          </Link>
          {suggestions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
