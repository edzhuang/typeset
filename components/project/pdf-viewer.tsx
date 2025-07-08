import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function PdfViewer({ file }: { file: string | File }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [zoom, setZoom] = useState<number>(1);
  const [pagesRendered, setPagesRendered] = useState<number>(0);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number>(0);

  const navigateToPage = (page: number) => {
    if (isNaN(page) || page < 1 || page > numPages) {
      setPageInput(currentPage.toString());
      return;
    }
    setCurrentPage(page);
    setPageInput(page.toString());

    const element = pagesRef.current[page - 1];
    if (element) {
      element.scrollIntoView({ behavior: "instant" });
    }
  };

  useEffect(() => {
    setPagesRendered(0);
  }, [file]);

  /**
   * Automatically update `currentPage` while scrolling so that it always reflects
   * the page that is most prominently visible in the viewport.
   */
  useEffect(() => {
    if (pagesRendered < numPages) return;

    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const container: HTMLElement = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;

    const handleScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const viewportCenter = containerRect.top + containerRect.height / 2;

        let closestPage = 1;
        let minDistance = Infinity;

        pagesRef.current.forEach((el, idx) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();

          if (
            rect.bottom < containerRect.top ||
            rect.top > containerRect.bottom
          )
            return;

          const pageCenter = rect.top + rect.height / 2;
          const distance = Math.abs(pageCenter - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestPage = idx + 1;
          }
        });

        setCurrentPage(closestPage);
        setPageInput(closestPage.toString());
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [pagesRendered, numPages]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageRenderSuccess = () => {
    setPagesRendered((prev) => {
      const newCount = prev + 1;
      if (newCount === numPages) {
        const page = Math.min(currentPage, numPages);
        navigateToPage(page);
      }
      return newCount;
    });
  };

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.25, 5));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.25, 0.25));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex justify-between p-2 border-b gap-2">
        {/* Page selector */}
        <div className="flex items-center gap-2">
          <Input
            className="w-9 p-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={(e) => {
              navigateToPage(parseInt(e.target.value));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigateToPage(parseInt(e.currentTarget.value));
                e.currentTarget.blur();
              }
            }}
          />
          <div>/</div>
          <div>{numPages}</div>
        </div>

        {/* Zoom controls */}
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="icon" onClick={zoomOut}>
            <ZoomOut />
          </Button>
          <div className="w-10 text-center">{Math.round(zoom * 100)}%</div>
          <Button variant="ghost" size="icon" onClick={zoomIn}>
            <ZoomIn />
          </Button>
        </div>

        {/* Download button */}
        <div>
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={typeof file === "string" ? file : URL.createObjectURL(file)}
              download={typeof file === "string" ? "output" : file.name}
            >
              <Download />
            </Link>
          </Button>
        </div>
      </div>

      {/* Scrollable PDF content */}
      <ScrollArea className="min-h-0" ref={scrollAreaRef}>
        <Document
          className="flex flex-col items-center"
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {numPages &&
            Array.from({ length: numPages }, (_, index) => (
              <div
                key={`page_${index + 1}`}
                ref={(el) => {
                  pagesRef.current[index] = el;
                }}
                className="w-min p-2"
              >
                <Page
                  pageNumber={index + 1}
                  width={816}
                  scale={zoom}
                  onRenderSuccess={onPageRenderSuccess}
                />
              </div>
            ))}
        </Document>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
