export default function MdxLayout({ children }: { children: React.ReactNode }) {
  // Create any shared layout or styles here
  return (
    <div className="flex flex-1 flex-col items-center my-16 px-6">
      <div className="prose dark:prose-invert">{children}</div>
    </div>
  );
}
