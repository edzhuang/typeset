import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState<PDFLib | null>(null);

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

  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdf || !canvasRef.current) return;

      try {
        setRendering(true);
        const page = await pdf.getPage(pageNum);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not get canvas context");
        }

        const viewport = page.getViewport({ scale: zoom });

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Page rendering error:", err);
        setError("Failed to render page");
      } finally {
        setRendering(false);
      }
    },
    [pdf, zoom]
  );

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage(currentPage);
    }
  }, [pdf, currentPage, zoom, renderPage]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1.0);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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
    <div className={`${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Page Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Download Button */}
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* PDF Canvas */}
      <div className="relative overflow-auto h-full">
        <div className="flex justify-center p-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border shadow-lg max-w-full"
              style={{
                height: "auto",
              }}
            />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-opacity-75 rounded">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Rendering...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
