import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
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
  const scrollareaRef = useRef<HTMLDivElement | null>(null);

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
    const scrollarea = scrollareaRef.current;
    if (!scrollarea) return;
    let observer: IntersectionObserver | null = null;
    const visibleMap = new Map<number, number>();

    observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = pagesRef.current.findIndex((el) => el === entry.target);
          if (idx !== -1) {
            visibleMap.set(idx, entry.intersectionRatio);
          }
        });
        // Find the page with the highest intersection ratio
        let maxIdx = 0;
        let maxRatio = 0;
        visibleMap.forEach((ratio, idx) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            maxIdx = idx;
          }
        });
        const page = maxIdx + 1;
        setCurrentPage(page);
        setPageInput(page.toString());
      },
      {
        root: scrollarea,
        threshold: Array.from({ length: 11 }, (_, i) => i / 10),
      }
    );
    pagesRef.current.forEach((el) => {
      if (el) observer!.observe(el);
    });
    return () => {
      if (observer) observer.disconnect();
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
    <div className="@container flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex-0 grid grid-cols-[1fr_auto_1fr] p-2 border-b gap-2">
        {/* Page selector */}
        <div className="flex items-center gap-2">
          <Input
            className="w-9 p-0 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={(e) => {
              navigateToPage(parseInt(e.target.value));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
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
          <div className="w-10 text-center hidden @sm:block">
            {Math.round(zoom * 100)}%
          </div>
          <Button variant="ghost" size="icon" onClick={zoomIn}>
            <ZoomIn />
          </Button>
        </div>

        {/* Download button */}
        <div className="flex justify-end">
          <div>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={
                  typeof file === "string" ? file : URL.createObjectURL(file)
                }
                download={typeof file === "string" ? "output" : file.name}
              >
                <Download />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      {/* Scrollable PDF content */}
      <div ref={scrollareaRef} className="flex-1 overflow-auto z-10">
        <Document
          className="flex flex-col w-min mx-auto z-0"
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
                className="p-2"
              >
                <Page
                  pageNumber={index + 1}
                  width={816}
                  scale={zoom}
                  onRenderSuccess={onPageRenderSuccess}
                  className="border"
                />
              </div>
            ))}
        </Document>
      </div>
    </div>
  );
}
