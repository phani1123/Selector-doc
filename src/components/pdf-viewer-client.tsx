'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Plus,
  RotateCcw
} from 'lucide-react';
import { Annotation, PdfPageInfo, AnnotationFormData } from '@/types/annotation';
import { PDF_CONFIG } from '@/lib/pdf-config';

// Dynamic imports to prevent SSR issues
/* eslint-disable @typescript-eslint/no-explicit-any */
let Document: any = null;
let Page: any = null;
let pdfjs: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface PdfViewerClientProps {
  file: File;
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  onAnnotationCreate: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationSelect: (annotation: Annotation | null) => void;
  onAnnotationUpdate: (id: string, data: AnnotationFormData) => void;
  onAnnotationDelete: (id: string) => void;
  isCreatingAnnotation: boolean;
  onCreatingAnnotationChange: (creating: boolean) => void;
}

export function PdfViewerClient({
  file,
  annotations,
  selectedAnnotation,
  onAnnotationCreate,
  onAnnotationSelect,
  onAnnotationUpdate: _onAnnotationUpdate,
  onAnnotationDelete: _onAnnotationDelete,
  isCreatingAnnotation,
  onCreatingAnnotationChange,
}: PdfViewerClientProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(PDF_CONFIG.scale);
  const [pageInfo, setPageInfo] = useState<PdfPageInfo | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [creatingRect, setCreatingRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Load react-pdf dynamically
  useEffect(() => {
    const loadPdfLibrary = async () => {
      try {
        // Dynamic import of react-pdf
        const reactPdf = await import('react-pdf');
        Document = reactPdf.Document;
        Page = reactPdf.Page;
        pdfjs = reactPdf.pdfjs;

        // Configure worker with cache-busting
        if (pdfjs && typeof window !== 'undefined') {
          const timestamp = Date.now();
          pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js?v=${timestamp}`;
        }

        // Note: CSS imports removed to fix build issues
        // React-pdf styles will be loaded automatically by the library

        setIsLibraryLoaded(true);
      } catch (error) {
        console.error('Failed to load PDF library:', error);
      }
    };

    loadPdfLibrary();
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: { width: number; height: number }) => {
    const { width, height } = page;
    setPageInfo({
      pageNumber,
      width: width * scale,
      height: height * scale,
      scale,
    });
  }, [pageNumber, scale]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + PDF_CONFIG.scaleStep, PDF_CONFIG.maxScale));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - PDF_CONFIG.scaleStep, PDF_CONFIG.minScale));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(PDF_CONFIG.scale);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }, [numPages]);

  const getRelativeCoordinates = useCallback((e: React.MouseEvent) => {
    if (!pageRef.current) return null;
    
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    return { x, y };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isCreatingAnnotation || !pageInfo) return;
    
    const coords = getRelativeCoordinates(e);
    if (!coords) return;
    
    setCreatingRect({
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    });
  }, [isCreatingAnnotation, pageInfo, getRelativeCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!creatingRect) return;
    
    const coords = getRelativeCoordinates(e);
    if (!coords) return;
    
    setCreatingRect(prev => prev ? {
      ...prev,
      currentX: coords.x,
      currentY: coords.y,
    } : null);
  }, [creatingRect, getRelativeCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!creatingRect || !pageInfo) return;
    
    const width = Math.abs(creatingRect.currentX - creatingRect.startX);
    const height = Math.abs(creatingRect.currentY - creatingRect.startY);
    
    // Minimum size for annotation
    if (width < 20 || height < 20) {
      setCreatingRect(null);
      return;
    }
    
    const x = Math.min(creatingRect.startX, creatingRect.currentX);
    const y = Math.min(creatingRect.startY, creatingRect.currentY);
    
    const newAnnotation = {
      x: x / pageInfo.width,
      y: y / pageInfo.height,
      width: width / pageInfo.width,
      height: height / pageInfo.height,
      pageNumber,
      componentLabel: '',
      cssSelector: '',
    };
    
    onAnnotationCreate(newAnnotation);
    setCreatingRect(null);
    onCreatingAnnotationChange(false);
  }, [creatingRect, pageInfo, pageNumber, onAnnotationCreate, onCreatingAnnotationChange]);

  const currentPageAnnotations = annotations.filter(ann => ann.pageNumber === pageNumber);

  const handleAnnotationClick = useCallback((annotation: Annotation, e: React.MouseEvent) => {
    e.stopPropagation();
    onAnnotationSelect(annotation);
  }, [onAnnotationSelect]);

  if (!isLibraryLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading PDF library...</span>
        </div>
      </div>
    );
  }

  if (!Document || !Page) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load PDF viewer</p>
          <p className="text-sm text-muted-foreground">Please refresh the page and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Badge variant="secondary">
            Page {pageNumber} of {numPages}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= PDF_CONFIG.minScale}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Badge variant="outline">
            {Math.round(scale * 100)}%
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= PDF_CONFIG.maxScale}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={isCreatingAnnotation ? "default" : "outline"}
            size="sm"
            onClick={() => onCreatingAnnotationChange(!isCreatingAnnotation)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Annotation
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* PDF Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
      >
        <Card className="inline-block bg-white shadow-lg">
          <div 
            ref={pageRef}
            className="relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ 
              cursor: isCreatingAnnotation ? 'crosshair' : 'default',
              userSelect: 'none',
            }}
          >
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* Annotation Overlay */}
            {pageInfo && currentPageAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className={`
                  absolute border-2 cursor-pointer transition-all
                  ${selectedAnnotation?.id === annotation.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
                  }
                `}
                style={{
                  left: `${annotation.x * pageInfo.width}px`,
                  top: `${annotation.y * pageInfo.height}px`,
                  width: `${annotation.width * pageInfo.width}px`,
                  height: `${annotation.height * pageInfo.height}px`,
                }}
                onClick={(e) => handleAnnotationClick(annotation, e)}
              >
                {annotation.componentLabel && (
                  <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                    {annotation.componentLabel}
                  </div>
                )}
              </div>
            ))}

            {/* Creating Annotation Rectangle */}
            {creatingRect && pageInfo && (
              <div
                className="absolute border-2 border-dashed border-primary bg-primary/10"
                style={{
                  left: `${Math.min(creatingRect.startX, creatingRect.currentX)}px`,
                  top: `${Math.min(creatingRect.startY, creatingRect.currentY)}px`,
                  width: `${Math.abs(creatingRect.currentX - creatingRect.startX)}px`,
                  height: `${Math.abs(creatingRect.currentY - creatingRect.startY)}px`,
                }}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}