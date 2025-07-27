import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="flex-0 bg-transparent">
      <div className="px-4 xl:px-6">
        <div className="flex h-24 items-center justify-between">
          <div className="text-muted-foreground w-full px-1 text-center text-xs leading-loose sm:text-sm space-x-2">
            <Link
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Terms of service
            </Link>
            <Link
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
