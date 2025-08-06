// Configure PDF.js worker only on client side
export const configurePdfWorker = () => {
  if (typeof window !== 'undefined') {
    // Dynamic import to avoid SSR issues - use react-pdf's pdfjs
    import('react-pdf').then(({ pdfjs }) => {
      if (pdfjs && pdfjs.GlobalWorkerOptions) {
        const timestamp = Date.now();
        pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js?v=${timestamp}`;
      }
    }).catch(() => {
      // Fallback: try direct import if react-pdf approach fails
      console.warn('Could not configure PDF worker via react-pdf, trying direct approach');
    });
  }
};

export const PDF_CONFIG = {
  scale: 1.5,
  maxScale: 3.0,
  minScale: 0.5,
  scaleStep: 0.25,
} as const;