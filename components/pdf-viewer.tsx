import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export function PdfViewer({ file }: { file: string | File }) {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const [zoom, setZoom] = useState<number>(1);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);

  const navigateToPage = (page: number) => {
    if (!numPages || isNaN(page) || page < 1 || page > numPages) {
      setPageInput(currentPage.toString());
      return;
    }
    setCurrentPage(page);
    setPageInput(page.toString());

    const element = pagesRef.current[page - 1];
    if (element) {
      element.scrollIntoView();
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.25, 5));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.25, 0.25));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between p-2 border-b">
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
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="icon" onClick={zoomOut}>
            <ZoomOut />
          </Button>
          {Math.round(zoom * 100)}%
          <Button variant="ghost" size="icon" onClick={zoomIn}>
            <ZoomIn />
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="icon">
            <Download />
          </Button>
        </div>
      </div>
      <ScrollArea className="min-h-0">
        <Document
          className="flex flex-col items-center"
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {numPages &&
            Array.from(new Array(numPages), (_el, index) => (
              <div
                key={`page_${index + 1}`}
                ref={(el) => {
                  pagesRef.current[index] = el;
                }}
                className="w-min py-2"
              >
                <Page pageNumber={index + 1} width={816} scale={zoom} />
              </div>
            ))}
        </Document>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
