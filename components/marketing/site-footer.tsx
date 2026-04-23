import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="flex-0 border-t border-border/60 bg-transparent">
      <div className="max-w-[1248px] mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Image src="/typeset.svg" width={18} height={18} alt="Typeset logo" />
            <span className="text-sm font-medium">Typeset</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
