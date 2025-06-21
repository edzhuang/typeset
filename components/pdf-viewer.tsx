import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export function PdfViewer({ file }: { file: string | File }) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  return (
    <div>
      <div className="flex justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Input className="w-9 p-0 text-center" />
          <div>/ {numPages}</div>
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
      <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
        <div className="flex flex-col">
          <Page pageNumber={pageNumber} scale={zoom} />
        </div>
      </Document>
    </div>
  );
}
