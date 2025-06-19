import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";

// PDF.js types
interface PDFDocumentConfig {
  data: Uint8Array;
  cMapUrl?: string;
  cMapPacked?: boolean;
}

interface PDFLib {
  getDocument: (config: PDFDocumentConfig) => { promise: Promise<PDFDocument> };
  GlobalWorkerOptions: { workerSrc: string };
}

interface PDFDocument {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPage>;
}

interface PDFPage {
  getViewport: (config: { scale: number }) => PDFViewport;
  render: (context: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFViewport;
  }) => { promise: Promise<void> };
}

interface PDFViewport {
  width: number;
  height: number;
}

declare global {
  interface Window {
    pdfjsLib: PDFLib;
  }
}

interface PDFViewerProps {
  pdfData: ArrayBuffer;
  fileName?: string;
  className?: string;
}

export function PDFViewer({
  pdfData,
  fileName,
  className = "",
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState<PDFLib | null>(null);
  const [pageInput, setPageInput] = useState("1");
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load PDF.js from unpkg CDN with proper worker setup
        const script = document.createElement("script");
        script.src = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
        script.onload = () => {
          const pdfjsLib = window.pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

          // Save the lib; useEffect below will load the PDF once.
          setPdfjsLib(pdfjsLib);
        };

        script.onerror = () => {
          setError("Failed to load PDF.js library");
          setLoading(false);
        };

        document.head.appendChild(script);

        // Cleanup function
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch {
        setError("Failed to initialize PDF viewer");
        setLoading(false);
      }
    };

    loadPDFJS();
  }, []);
  // Load PDF when pdfjsLib is available or pdfData changes
  useEffect(() => {
    if (pdfjsLib && pdfData) {
      loadPDF(pdfjsLib);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfjsLib, pdfData]);

  const loadPDF = useCallback(
    async (lib: PDFLib) => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = lib.getDocument({
          // Clone to a fresh Uint8Array to avoid “already detached” issues
          data: new Uint8Array(pdfData),
          cMapUrl: "https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });
        const pdfDoc = await loadingTask.promise;

        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1);
        setPageInput("1");

        // Initialize canvas refs array
        canvasRefs.current = new Array(pdfDoc.numPages).fill(null);
      } catch (err) {
        setError(
          "Failed to load PDF document. Please check if the file is a valid PDF."
        );
        console.error("PDF loading error:", err);
      } finally {
        setLoading(false);
      }
    },
    [pdfData]
  );
  const renderAllPages = useCallback(async () => {
    if (!pdf || !canvasRefs.current.length) return;

    try {
      setRendering(true);

      // Render all pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) continue;

        const page = await pdf.getPage(pageNum);
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not get canvas context");
        }

        // Calculate scale for actual print size (96 DPI is standard web DPI, 72 DPI is PDF default)
        const printScale = (96 / 72) * zoom;
        const actualViewport = page.getViewport({ scale: printScale });

        // Set canvas dimensions for crisp rendering on high-DPI displays
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.height = actualViewport.height * devicePixelRatio;
        canvas.width = actualViewport.width * devicePixelRatio;

        // Scale canvas back down via CSS for proper display size
        canvas.style.height = actualViewport.height + "px";
        canvas.style.width = actualViewport.width + "px";

        // Scale the context to match device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);

        // Clear canvas
        context.clearRect(0, 0, actualViewport.width, actualViewport.height);

        const renderContext = {
          canvasContext: context,
          viewport: actualViewport,
        };

        await page.render(renderContext).promise;
      }
    } catch (err) {
      console.error("Page rendering error:", err);
      setError("Failed to render pages");
    } finally {
      setRendering(false);
    }
  }, [pdf, zoom, totalPages]);
  useEffect(() => {
    if (pdf && totalPages > 0) {
      renderAllPages();
    }
  }, [pdf, totalPages, zoom, renderAllPages]);
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };
  const handlePrevPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    setCurrentPage(newPage);
    scrollToPage(newPage);
  };

  const handleNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    scrollToPage(newPage);
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageInput(value);
  };
  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      scrollToPage(pageNum);
    }
  };
  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePageInputSubmit(e as React.FormEvent);
    }
  };
  const scrollToPage = useCallback((pageNum: number) => {
    if (containerRef.current && canvasRefs.current[pageNum - 1]) {
      isScrollingProgrammatically.current = true;
      const pageElement = canvasRefs.current[pageNum - 1]?.parentElement;
      if (pageElement) {
        pageElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        // Reset the flag after scrolling is likely done
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 1000);
      }
    }
  }, []);

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]); // Track which page is currently visible while scrolling
  useEffect(() => {
    if (!containerRef.current || totalPages === 0) return;

    let timeoutId: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        // Clear any pending updates
        clearTimeout(timeoutId);

        // Debounce the page change to prevent flickering
        timeoutId = setTimeout(() => {
          // Find the page that's most visible
          let mostVisiblePage = currentPage; // Default to current page
          let maxIntersectionRatio = 0;

          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              entry.intersectionRatio > maxIntersectionRatio
            ) {
              const pageElement = entry.target as HTMLElement;
              const pageNumber = parseInt(
                pageElement.getAttribute("data-page-number") || "1",
                10
              );
              mostVisiblePage = pageNumber;
              maxIntersectionRatio = entry.intersectionRatio;
            }
          });

          // Update current page if it's different, has significant visibility, and we're not navigating
          if (
            mostVisiblePage !== currentPage &&
            maxIntersectionRatio > 0.6 && // Higher threshold for more stability
            !isScrollingProgrammatically.current
          ) {
            setCurrentPage(mostVisiblePage);
          }
        }, 150); // 150ms debounce delay
      },
      {
        root: containerRef.current,
        rootMargin: "-20% 0px -20% 0px", // Larger margins for more stable detection
        threshold: 0.6, // Single threshold for cleaner detection
      }
    ); // Observe all page containers
    const pageElements =
      containerRef.current.querySelectorAll("[data-page-number]");
    pageElements.forEach((element) => observer.observe(element));

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [totalPages, currentPage]);

  const handleDownload = () => {
    try {
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading PDF...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              if (pdfjsLib) {
                loadPDF(pdfjsLib);
              }
            }}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b sticky top-0 z-10">
        {/* Zoom Controls */}
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut />
          </Button>
          <span className="text-sm font-medium text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3.0}
          >
            <ZoomIn />
          </Button>
        </div>

        {/* Page Controls */}
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft />
          </Button>
          <div className="flex items-center gap-2">
            {" "}
            <Input
              type="number"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              className="w-9 px-0 text-center text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              min={1}
              max={totalPages}
            />
            <span className="text-sm font-medium">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight />
          </Button>
        </div>

        {/* Download Button */}
        <Button variant="outline" size="icon" onClick={handleDownload}>
          <Download />
        </Button>
      </div>

      {/* PDF Pages Container */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="flex flex-col items-center p-4 gap-4">
          {Array.from({ length: totalPages }, (_, index) => (
            <div key={index} className="relative" data-page-number={index + 1}>
              <canvas
                ref={(el) => {
                  if (el) {
                    canvasRefs.current[index] = el;
                  }
                }}
                className="border shadow-lg"
                style={{
                  height: "auto",
                }}
              />
              {rendering && index === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-opacity-75 rounded">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Rendering pages...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
