import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut, Download, Loader2 } from "lucide-react";

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
  getTextContent: () => Promise<TextContent>;
  pageIndex: number;
}

interface PDFViewport {
  width: number;
  height: number;
}

interface TextContent {
  items: TextItem[];
  styles: { [key: string]: object };
}

interface TextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
}

declare global {
  interface Window {
    pdfjsLib: PDFLib;
    pdfjsViewer: {
      renderTextLayer: (options: {
        textContentSource: TextContent;
        container: HTMLDivElement;
        viewport: PDFViewport;
        textDivs: HTMLElement[];
      }) => { promise: Promise<void> };
    };
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
  const textLayerRefs = useRef<(HTMLDivElement | null)[]>([]);
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

          // Also load the viewer script for text layer rendering
          const viewerScript = document.createElement("script");
          viewerScript.src =
            "https://unpkg.com/pdfjs-dist@3.11.174/web/pdf_viewer.js";
          viewerScript.onload = () => {
            // Save the lib; useEffect below will load the PDF once.
            setPdfjsLib(pdfjsLib);
          };
          viewerScript.onerror = () => {
            setError("Failed to load PDF.js viewer library");
            setLoading(false);
          };
          document.head.appendChild(viewerScript);
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
        textLayerRefs.current = new Array(pdfDoc.numPages).fill(null);
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

        // Render text layer
        const textLayerDiv = textLayerRefs.current[pageNum - 1];
        if (textLayerDiv && window.pdfjsViewer?.renderTextLayer) {
          textLayerDiv.innerHTML = ""; // Clear previous content

          // Set text layer size
          textLayerDiv.style.width = actualViewport.width + "px";
          textLayerDiv.style.height = actualViewport.height + "px";

          const textContent = await page.getTextContent();

          const renderTask = window.pdfjsViewer.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: actualViewport,
            textDivs: [],
          });
          await renderTask.promise;
        }
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

    const handleScroll = () => {
      // Clear any pending updates
      clearTimeout(timeoutId);

      // Debounce the page change to prevent flickering
      timeoutId = setTimeout(() => {
        if (!containerRef.current || isScrollingProgrammatically.current)
          return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const containerMiddle = containerRect.top + containerRect.height / 2;

        let newCurrentPage = currentPage;

        // Check each page to see if its top or bottom edge crosses the middle
        for (let i = 0; i < totalPages; i++) {
          const pageElement = container.querySelector(
            `[data-page-number="${i + 1}"]`
          ) as HTMLElement;
          if (!pageElement) continue;

          const pageRect = pageElement.getBoundingClientRect();
          const pageTop = pageRect.top;
          const pageBottom = pageRect.bottom;

          // A page is considered current if the container middle line is between its top and bottom
          if (pageTop <= containerMiddle && containerMiddle <= pageBottom) {
            newCurrentPage = i + 1;
            break;
          }
        }

        // Update current page if it's different
        if (newCurrentPage !== currentPage) {
          setCurrentPage(newCurrentPage);
        }
      }, 100); // 100ms debounce delay
    };

    const container = containerRef.current;
    container.addEventListener("scroll", handleScroll);

    // Initial check
    handleScroll();

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("scroll", handleScroll);
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
        <div className="flex items-center gap-2">
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
        </div>{" "}
        {/* Page Controls */}
        <div className="flex items-center gap-2">
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
              <div
                ref={(el) => {
                  if (el) {
                    textLayerRefs.current[index] = el;
                  }
                }}
                className="textLayer"
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
