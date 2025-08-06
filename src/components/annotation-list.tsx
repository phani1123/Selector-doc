'use client';

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  Edit, 
  Copy, 
  FileText,
  ChevronRight,
  Package,
  Hash,
} from 'lucide-react';
import { Annotation } from '@/types/annotation';

interface AnnotationListProps {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  onAnnotationSelect: (annotation: Annotation) => void;
  onAnnotationEdit: (annotation: Annotation) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  onExportAnnotatedPdf: () => void;
}

export function AnnotationList({
  annotations,
  selectedAnnotation,
  onAnnotationSelect,
  onAnnotationEdit,
  currentPage,
  onPageChange,
  onExportAnnotatedPdf,
}: AnnotationListProps) {
  const groupedAnnotations = annotations.reduce((acc, annotation) => {
    const page = annotation.pageNumber;
    if (!acc[page]) {
      acc[page] = [];
    }
    acc[page].push(annotation);
    return acc;
  }, {} as Record<number, Annotation[]>);

  const sortedPages = Object.keys(groupedAnnotations)
    .map(Number)
    .sort((a, b) => a - b);

  const copySelector = async (selector: string) => {
    try {
      await navigator.clipboard.writeText(selector);
    } catch (error) {
      console.error('Failed to copy selector:', error);
    }
  };



  if (annotations.length === 0) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Component Annotations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No annotations yet</p>
          <p className="text-xs mt-1">
            Click &quot;Add Annotation&quot; to start documenting components
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Annotations ({annotations.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportAnnotatedPdf}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4">
          <div className="space-y-4 pb-4">
            {sortedPages.map((pageNumber) => (
              <div key={pageNumber} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center">
                    <Hash className="w-3 h-3 mr-1" />
                    Page {pageNumber}
                  </h4>
                  {pageNumber !== currentPage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {groupedAnnotations[pageNumber].map((annotation) => (
                    <div
                      key={annotation.id}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all
                        ${selectedAnnotation?.id === annotation.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card hover:bg-muted/50 border-border'
                        }
                      `}
                      onClick={() => onAnnotationSelect(annotation)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium truncate">
                              {annotation.componentLabel || 'Unnamed Component'}
                            </h5>
                            {annotation.cssSelector && (
                              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono block mt-1 truncate">
                                {annotation.cssSelector}
                              </code>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>

                        {annotation.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {annotation.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(annotation.x * 100)}%,{' '}
                              {Math.round(annotation.y * 100)}%
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {annotation.cssSelector && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copySelector(annotation.cssSelector);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAnnotationEdit(annotation);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}