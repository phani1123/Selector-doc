'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Download, 
  FileText, 
  BarChart3,
  Settings,
  HelpCircle,
  Package,
} from 'lucide-react';
import { PdfUploader } from './pdf-uploader';
import { AnnotationEditor } from './annotation-editor';
import { AnnotationList } from './annotation-list';
import { ClientOnly } from './client-only';
import { useAnnotations } from '@/hooks/use-annotations';
import { createPdfExporter, ExportOptions } from '@/lib/pdf-export';
import { PdfViewerState } from '@/types/annotation';

// Dynamically import PDF viewer to prevent SSR issues
const PdfViewer = dynamic(() => import('./pdf-viewer-client').then(mod => ({ default: mod.PdfViewerClient })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading PDF viewer...</span>
      </div>
    </div>
  ),
});

export function PdfAnnotationApp() {
  const [pdfState, setPdfState] = useState<PdfViewerState>({
    pdfFile: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.5,
    isLoading: false,
    error: null,
  });

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const {
    annotations,
    selectedAnnotation,
    editingAnnotation,
    isCreating,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    setEditingAnnotation,
    setIsCreating,
    clearAnnotations,
    getAnnotationStats,
  } = useAnnotations();

  const handleFileSelect = (file: File) => {
    setPdfState(prev => ({ 
      ...prev, 
      pdfFile: file, 
      isLoading: true, 
      error: null 
    }));
    clearAnnotations();
  };

  const handlePageChange = (page: number) => {
    setPdfState(prev => ({ ...prev, currentPage: page }));
  };

  const handleExport = async (format: ExportOptions['format'] = 'json') => {
    if (annotations.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      const exporter = createPdfExporter(annotations);
      
      if (format === 'pdf' && pdfContainerRef.current) {
        await exporter.exportAnnotatedPdf(pdfContainerRef.current, {
          includeAnnotations: true,
          includeMetadata: true,
          format: 'pdf',
          filename: 'annotated-ui-components',
        });
      } else {
        await exporter.exportAnnotatedPdf(document.body, {
          includeAnnotations: true,
          includeMetadata: true,
          format,
          filename: 'ui-component-selectors',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  const stats = getAnnotationStats();

  if (!pdfState.pdfFile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Package className="w-6 h-6 text-primary" />
                  <h1 className="text-xl font-bold">Selectio</h1>
                </div>
                <Badge variant="secondary" className="text-xs">
                  PDF UI Component Annotator
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Document UI Components
              </h2>
            </div>

            <PdfUploader 
              onFileSelect={handleFileSelect}
              isLoading={pdfState.isLoading}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-bold">Selectio</h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {stats.completed}/{stats.total} Components
                </Badge>
                <Badge variant="secondary">
                  {stats.pages} {stats.pages === 1 ? 'Page' : 'Pages'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={annotations.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Annotations</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        onClick={() => handleExport('json')}
                        disabled={isExporting}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export as JSON
                      </Button>
                      <Button 
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button 
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Annotated PDF
                      </Button>
                    </div>
                    {isExporting && (
                      <div className="text-center text-sm text-muted-foreground">
                        Generating export...
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setPdfState(prev => ({ 
                    ...prev, 
                    pdfFile: null 
                  }));
                  clearAnnotations();
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                New PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col" ref={pdfContainerRef}>
          <ClientOnly
            fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Initializing PDF viewer...</span>
                </div>
              </div>
            }
          >
            <PdfViewer
              file={pdfState.pdfFile}
              annotations={annotations}
              selectedAnnotation={selectedAnnotation}
              onAnnotationCreate={createAnnotation}
              onAnnotationSelect={selectAnnotation}
              onAnnotationUpdate={updateAnnotation}
              onAnnotationDelete={deleteAnnotation}
              isCreatingAnnotation={isCreating}
              onCreatingAnnotationChange={setIsCreating}
            />
          </ClientOnly>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l bg-background flex flex-col">
          {/* Annotation List */}
          <div className="flex-1 overflow-hidden">
                          <AnnotationList
                annotations={annotations}
                selectedAnnotation={selectedAnnotation}
                onAnnotationSelect={selectAnnotation}
                onAnnotationEdit={setEditingAnnotation}
                currentPage={pdfState.currentPage}
                onPageChange={handlePageChange}
                onExportAnnotatedPdf={() => handleExport('pdf')}
              />
          </div>

          {/* Annotation Editor */}
          {(selectedAnnotation || editingAnnotation) && (
            <div className="border-t p-4">
              <AnnotationEditor
                annotation={editingAnnotation || selectedAnnotation}
                onUpdate={updateAnnotation}
                onDelete={deleteAnnotation}
                onClose={() => {
                  setEditingAnnotation(null);
                  selectAnnotation(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}