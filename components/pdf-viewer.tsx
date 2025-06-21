import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export function PdfViewer({ file }: { file: string | File }) {
  const [numPages, setNumPages] = useState<number>();
  const [zoom, setZoom] = useState<number>(1);

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
          <Input className="w-9 p-0 text-center" />
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
        <div className="flex flex-col items-center py-2">
          <Document
            className="w-min"
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <div className="flex flex-col gap-4">
              {numPages &&
                Array.from(new Array(numPages), (_el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={816}
                    scale={zoom}
                  />
                ))}
            </div>
          </Document>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
