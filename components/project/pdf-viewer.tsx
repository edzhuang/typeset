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
  const scrollAreaViewportRef = useRef<HTMLDivElement | null>(null);

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
    const viewport = scrollAreaViewportRef.current;
    if (!viewport) return;
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
        root: viewport,
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
      <div className="grow overflow-hidden">
        <div className="size-full overflow-auto" ref={scrollAreaViewportRef}>
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
                    className="z-0 border"
                  />
                </div>
              ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
