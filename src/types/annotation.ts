export interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  componentLabel: string;
  cssSelector: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

export interface AnnotationFormData {
  componentLabel: string;
  cssSelector: string;
  description?: string;
}

export interface PdfViewerState {
  pdfFile: File | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
}

export interface AnnotationState {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  isCreating: boolean;
  editingAnnotation: Annotation | null;
}