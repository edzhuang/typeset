import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="flex-0 bg-transparent">
      <div className="px-4 xl:px-6">
        <div className="flex h-24 items-center justify-between">
          <div className="text-muted-foreground w-full px-1 text-center text-xs leading-loose sm:text-sm space-x-4">
            <Link
              href="/terms"
              className="font-medium underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="font-medium underline underline-offset-4"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
