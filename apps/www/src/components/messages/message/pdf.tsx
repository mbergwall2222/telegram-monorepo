"use client";
import { pdfjs, Document, Page } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// import type { PDFDocumentProxy } from "pdfjs-dist";
import { useState } from "react";
import useResizeObserver from "use-resize-observer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
};

export const PDF = ({ fileUrl }: { fileUrl: string }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const { ref, width = 300 } = useResizeObserver<HTMLDivElement>();

  function onDocumentLoadSuccess({ numPages: nextNumPages }: any): void {
    setNumPages(nextNumPages);
  }

  return (
    <div ref={ref} className="w-full relative">
      <div className="absolute text-center top-1/2 left-0 right-0 m-auto -translate-y-1/2 z-20 opacity-75">
        <div className="flex gap-2 justify-center">
          <Button
            size="icon"
            variant="outline"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(pageNumber - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(pageNumber + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-center select-none">
        Page {pageNumber || (numPages ? 1 : "--")} of {numPages || "--"}
      </p>
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        options={options}
      >
        <Page pageNumber={pageNumber} width={width} />
      </Document>
    </div>
  );
};
