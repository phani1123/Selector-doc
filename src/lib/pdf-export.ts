'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Annotation } from '@/types/annotation';

export interface ExportOptions {
  includeAnnotations: boolean;
  includeMetadata: boolean;
  format: 'pdf' | 'json' | 'csv';
  filename?: string;
}

export class PdfExporter {
  private annotations: Annotation[];

  constructor(annotations: Annotation[]) {
    this.annotations = annotations;
  }

  async exportAnnotatedPdf(
    pdfContainer: HTMLElement,
    options: ExportOptions = {
      includeAnnotations: true,
      includeMetadata: true,
      format: 'pdf',
    }
  ): Promise<void> {
    const filename = options.filename || `annotated-pdf-${Date.now()}`;

    switch (options.format) {
      case 'json':
        this.exportAsJson(filename);
        break;
      case 'csv':
        this.exportAsCsv(filename);
        break;
      case 'pdf':
      default:
        await this.exportAsPdf(pdfContainer, filename, options);
        break;
    }
  }

  private async exportAsPdf(
    container: HTMLElement,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    // Store original stylesheets for restoration
    const originalStylesheets: { element: HTMLElement; href?: string; content?: string }[] = [];
    const tempStylesheet = document.createElement('style');
    
    try {
      // NUCLEAR OPTION: Replace ALL stylesheets temporarily
      await this.replaceAllStylesheets(originalStylesheets, tempStylesheet);
      
      // Wait for styles to be applied
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      
      // Create a completely isolated container
      const cleanContainer = container.cloneNode(true) as HTMLElement;
      cleanContainer.style.position = 'absolute';
      cleanContainer.style.left = '-99999px';
      cleanContainer.style.top = '0';
      cleanContainer.style.zIndex = '-9999';
      cleanContainer.style.visibility = 'hidden';
      
      // Add to DOM temporarily
      document.body.appendChild(cleanContainer);
      
      // Force style recalculation
      void cleanContainer.offsetHeight;
      
      // Export using html2canvas
      const canvas = await html2canvas(cleanContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Inject safe stylesheet into cloned document
          this.injectSafeStylesheet(clonedDoc);
        },
      });

      // Clean up the temporary container
      if (cleanContainer.parentNode) {
        cleanContainer.parentNode.removeChild(cleanContainer);
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      if (options.includeMetadata) {
        this.addMetadataPage(pdf);
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export PDF');
    } finally {
      // Restore original stylesheets
      await this.restoreOriginalStylesheets(originalStylesheets, tempStylesheet);
    }
  }

  private async replaceAllStylesheets(
    originalStylesheets: { element: HTMLElement; href?: string; content?: string }[],
    tempStylesheet: HTMLStyleElement
  ): Promise<void> {
    // Find and disable all existing stylesheets
    const existingStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
    
    existingStyles.forEach(element => {
      if (element instanceof HTMLElement) {
        originalStylesheets.push({
          element,
          href: element instanceof HTMLLinkElement ? element.href : undefined,
          content: element instanceof HTMLStyleElement ? element.textContent || '' : undefined
        });
        
        // Disable the stylesheet
        if (element instanceof HTMLLinkElement) {
          element.disabled = true;
        } else if (element instanceof HTMLStyleElement) {
          element.textContent = '';
        }
      }
    });
    
    // Inject our safe stylesheet
    tempStylesheet.textContent = this.getSafeCompleteStylesheet();
    document.head.appendChild(tempStylesheet);
  }

  private async restoreOriginalStylesheets(
    originalStylesheets: { element: HTMLElement; href?: string; content?: string }[],
    tempStylesheet: HTMLStyleElement
  ): Promise<void> {
    // Remove our temporary stylesheet
    if (tempStylesheet.parentNode) {
      tempStylesheet.parentNode.removeChild(tempStylesheet);
    }
    
    // Restore original stylesheets
    originalStylesheets.forEach(({ element, content }) => {
      if (element instanceof HTMLLinkElement) {
        element.disabled = false;
      } else if (element instanceof HTMLStyleElement && content !== undefined) {
        element.textContent = content;
      }
    });
    
    // Wait for styles to be restored
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  private getSafeCompleteStylesheet(): string {
    return `
      /* Complete safe stylesheet - NO OKLCH */
      *, *::before, *::after {
        box-sizing: border-box;
        color: #0f172a !important;
        border-color: #e2e8f0 !important;
      }
      
      :root, html, body {
        --radius: 0.625rem !important;
        --background: #ffffff !important;
        --foreground: #0f172a !important;
        --card: #ffffff !important;
        --card-foreground: #0f172a !important;
        --popover: #ffffff !important;
        --popover-foreground: #0f172a !important;
        --primary: #1e293b !important;
        --primary-foreground: #f8fafc !important;
        --secondary: #f1f5f9 !important;
        --secondary-foreground: #1e293b !important;
        --muted: #f1f5f9 !important;
        --muted-foreground: #64748b !important;
        --accent: #f1f5f9 !important;
        --accent-foreground: #1e293b !important;
        --destructive: #dc2626 !important;
        --border: #e2e8f0 !important;
        --input: #e2e8f0 !important;
        --ring: #64748b !important;
        --chart-1: #f59e0b !important;
        --chart-2: #10b981 !important;
        --chart-3: #3b82f6 !important;
        --chart-4: #8b5cf6 !important;
        --chart-5: #f97316 !important;
      }
      
      body {
        font-family: system-ui, -apple-system, sans-serif !important;
        background-color: #ffffff !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .bg-background { background-color: #ffffff !important; }
      .text-foreground { color: #0f172a !important; }
      .bg-card { background-color: #ffffff !important; }
      .text-card-foreground { color: #0f172a !important; }
      .bg-primary { background-color: #1e293b !important; }
      .text-primary-foreground { color: #f8fafc !important; }
      .bg-secondary { background-color: #f1f5f9 !important; }
      .text-secondary-foreground { color: #1e293b !important; }
      .bg-muted { background-color: #f1f5f9 !important; }
      .text-muted-foreground { color: #64748b !important; }
      .border { border-color: #e2e8f0 !important; }
      .border-border { border-color: #e2e8f0 !important; }
      .rounded { border-radius: 0.375rem !important; }
      .rounded-lg { border-radius: 0.5rem !important; }
      .rounded-xl { border-radius: 0.75rem !important; }
      .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
      .p-2 { padding: 0.5rem !important; }
      .p-3 { padding: 0.75rem !important; }
      .p-4 { padding: 1rem !important; }
      .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
      .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
      .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
      .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
      .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
      .m-2 { margin: 0.5rem !important; }
      .mb-2 { margin-bottom: 0.5rem !important; }
      .mt-2 { margin-top: 0.5rem !important; }
      .flex { display: flex !important; }
      .inline-flex { display: inline-flex !important; }
      .items-center { align-items: center !important; }
      .justify-center { justify-content: center !important; }
      .justify-between { justify-content: space-between !important; }
      .space-x-2 > * + * { margin-left: 0.5rem !important; }
      .space-y-2 > * + * { margin-top: 0.5rem !important; }
      .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
      .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
      .font-medium { font-weight: 500 !important; }
      .font-bold { font-weight: 700 !important; }
      .w-4 { width: 1rem !important; }
      .h-4 { height: 1rem !important; }
      .w-6 { width: 1.5rem !important; }
      .h-6 { height: 1.5rem !important; }
      .relative { position: relative !important; }
      .absolute { position: absolute !important; }
      .top-0 { top: 0 !important; }
      .left-0 { left: 0 !important; }
      .z-10 { z-index: 10 !important; }
    `;
  }

  private injectSafeStylesheet(doc: Document): void {
    // Remove all existing stylesheets from cloned document
    const existingStyles = doc.querySelectorAll('style, link[rel="stylesheet"]');
    existingStyles.forEach(style => style.remove());
    
    // Inject our safe stylesheet
    const safeStyle = doc.createElement('style');
    safeStyle.textContent = this.getSafeCompleteStylesheet();
    
    if (doc.head) {
      doc.head.appendChild(safeStyle);
    } else {
      doc.documentElement.appendChild(safeStyle);
    }
  }

  private eliminateOklchFromDOM(container: HTMLElement, originalStyles: Map<Element, string>): void {
    // Get all elements including the container itself
    const allElements = [container, ...Array.from(container.querySelectorAll('*'))];
    
    allElements.forEach(element => {
      if (element instanceof HTMLElement) {
        // Store original style for restoration
        originalStyles.set(element, element.getAttribute('style') || '');
        
        // Get computed styles and force override any OKLCH values
        const computedStyle = window.getComputedStyle(element);
        const importantProps = [
          'color', 'backgroundColor', 'borderColor', 'borderTopColor', 
          'borderRightColor', 'borderBottomColor', 'borderLeftColor',
          'fill', 'stroke', 'outlineColor', 'boxShadow', 'textShadow'
        ];
        
        importantProps.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && (value.includes('oklch') || value.includes('var(--'))) {
            // Force override with safe color
            const safeColor = this.getSafeColorForProperty(prop);
            element.style.setProperty(prop, safeColor, 'important');
          }
        });
        
        // Force override CSS variables at element level
        this.overrideCSSVariables(element);
      }
    });
  }

  private async createCleanContainer(originalContainer: HTMLElement): Promise<HTMLElement> {
    // Create a completely isolated container
    const cleanContainer = originalContainer.cloneNode(true) as HTMLElement;
    
    // Position off-screen
    cleanContainer.style.position = 'absolute';
    cleanContainer.style.left = '-99999px';
    cleanContainer.style.top = '0';
    cleanContainer.style.zIndex = '-9999';
    cleanContainer.style.visibility = 'hidden';
    
    // Inject aggressive OKLCH override styles
    const cleanupStyle = document.createElement('style');
    cleanupStyle.textContent = this.getAggressiveOklchOverrides();
    cleanContainer.insertBefore(cleanupStyle, cleanContainer.firstChild);
    
    // Add to DOM temporarily to ensure styles are computed
    document.body.appendChild(cleanContainer);
    
    // Wait for styles to be applied
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Force recompute styles on all elements
    this.forceStyleRecomputation(cleanContainer);
    
    return cleanContainer;
  }

  private forceCleanOklchFromDocument(doc: Document): void {
    // Override the document's CSS with completely safe values
    const globalOverride = doc.createElement('style');
    globalOverride.textContent = `
      *, *::before, *::after {
        color: #0f172a !important;
        background-color: transparent !important;
        border-color: #e2e8f0 !important;
        fill: currentColor !important;
        stroke: currentColor !important;
      }
      
      /* Force override any CSS variables */
      :root, html, body {
        --background: #ffffff !important;
        --foreground: #0f172a !important;
        --card: #ffffff !important;
        --card-foreground: #0f172a !important;
        --primary: #1e293b !important;
        --primary-foreground: #f8fafc !important;
        --secondary: #f1f5f9 !important;
        --secondary-foreground: #1e293b !important;
        --muted: #f1f5f9 !important;
        --muted-foreground: #64748b !important;
        --border: #e2e8f0 !important;
        --input: #e2e8f0 !important;
        --destructive: #dc2626 !important;
        --ring: #64748b !important;
      }
    `;
    
    if (doc.head) {
      doc.head.appendChild(globalOverride);
    } else {
      doc.documentElement.insertBefore(globalOverride, doc.documentElement.firstChild);
    }
    
    // Remove any existing style elements that might contain OKLCH
    const existingStyles = doc.querySelectorAll('style, link[rel="stylesheet"]');
    existingStyles.forEach(style => {
      if (style.textContent && style.textContent.includes('oklch')) {
        style.textContent = style.textContent.replace(/oklch\([^)]+\)/g, '#ffffff');
      }
    });
  }

  private getSafeColorForProperty(property: string): string {
    const colorMap: Record<string, string> = {
      'color': '#0f172a',
      'backgroundColor': '#ffffff', 
      'borderColor': '#e2e8f0',
      'borderTopColor': '#e2e8f0',
      'borderRightColor': '#e2e8f0', 
      'borderBottomColor': '#e2e8f0',
      'borderLeftColor': '#e2e8f0',
      'fill': 'currentColor',
      'stroke': 'currentColor',
      'outlineColor': '#64748b',
      'boxShadow': 'none',
      'textShadow': 'none'
    };
    return colorMap[property] || '#ffffff';
  }

  private overrideCSSVariables(element: HTMLElement): void {
    const cssVars = {
      '--background': '#ffffff',
      '--foreground': '#0f172a', 
      '--card': '#ffffff',
      '--card-foreground': '#0f172a',
      '--primary': '#1e293b',
      '--primary-foreground': '#f8fafc',
      '--secondary': '#f1f5f9',
      '--secondary-foreground': '#1e293b',
      '--muted': '#f1f5f9',
      '--muted-foreground': '#64748b',
      '--border': '#e2e8f0',
      '--input': '#e2e8f0',
      '--destructive': '#dc2626',
      '--ring': '#64748b'
    };
    
    Object.entries(cssVars).forEach(([prop, value]) => {
      element.style.setProperty(prop, value, 'important');
    });
  }

  private getAggressiveOklchOverrides(): string {
    return `
      /* Aggressive OKLCH elimination */
      *, *::before, *::after {
        color: #0f172a !important;
        background-color: inherit !important;
        border-color: #e2e8f0 !important;
      }
      
      :root, html, body, * {
        --background: #ffffff !important;
        --foreground: #0f172a !important;
        --card: #ffffff !important;
        --card-foreground: #0f172a !important;
        --popover: #ffffff !important;
        --popover-foreground: #0f172a !important;
        --primary: #1e293b !important;
        --primary-foreground: #f8fafc !important;
        --secondary: #f1f5f9 !important;
        --secondary-foreground: #1e293b !important;
        --muted: #f1f5f9 !important;
        --muted-foreground: #64748b !important;
        --accent: #f1f5f9 !important;
        --accent-foreground: #1e293b !important;
        --destructive: #dc2626 !important;
        --border: #e2e8f0 !important;
        --input: #e2e8f0 !important;
        --ring: #64748b !important;
      }
      
      /* Override specific component styles */
      .bg-background { background-color: #ffffff !important; }
      .text-foreground { color: #0f172a !important; }
      .bg-card { background-color: #ffffff !important; }
      .text-card-foreground { color: #0f172a !important; }
      .bg-primary { background-color: #1e293b !important; }
      .text-primary-foreground { color: #f8fafc !important; }
      .border { border-color: #e2e8f0 !important; }
      .border-border { border-color: #e2e8f0 !important; }
    `;
  }

  private forceStyleRecomputation(container: HTMLElement): void {
    const allElements = container.querySelectorAll('*');
    allElements.forEach(element => {
      if (element instanceof HTMLElement) {
        // Force style recomputation by accessing offsetHeight
        void element.offsetHeight;
      }
    });
  }

  private restoreOriginalStyles(originalStyles: Map<Element, string>): void {
    originalStyles.forEach((originalStyle, element) => {
      if (element instanceof HTMLElement) {
        if (originalStyle) {
          element.setAttribute('style', originalStyle);
        } else {
          element.removeAttribute('style');
        }
      }
    });
  }



  private addMetadataPage(pdf: jsPDF): void {
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UI Component Documentation', margin, yPosition);
    yPosition += 30;

    // Summary
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const stats = this.getAnnotationStats();
    pdf.text(`Total Components: ${stats.total}`, margin, yPosition);
    yPosition += 15;
    pdf.text(`Completed Annotations: ${stats.completed}`, margin, yPosition);
    yPosition += 15;
    pdf.text(`Pages Annotated: ${stats.pages}`, margin, yPosition);
    yPosition += 15;
    pdf.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 30;

    // Annotations list
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Component List:', margin, yPosition);
    yPosition += 20;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    this.annotations
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .forEach((annotation, index) => {
        if (yPosition > pdf.internal.pageSize.getHeight() - 40) {
          pdf.addPage();
          yPosition = margin;
        }

        const componentText = `${index + 1}. ${annotation.componentLabel || 'Unnamed Component'}`;
        const selectorText = `   Selector: ${annotation.cssSelector || 'Not specified'}`;
        const pageText = `   Page: ${annotation.pageNumber}`;

        pdf.text(componentText, margin, yPosition);
        yPosition += 12;
        pdf.text(selectorText, margin, yPosition);
        yPosition += 12;
        pdf.text(pageText, margin, yPosition);
        yPosition += 12;

        if (annotation.description) {
          const descriptionText = `   Description: ${annotation.description}`;
          const lines = pdf.splitTextToSize(descriptionText, pageWidth - margin * 2);
          pdf.text(lines, margin, yPosition);
          yPosition += lines.length * 12;
        }

        yPosition += 8; // Extra spacing between annotations
      });
  }

  private exportAsJson(filename: string): void {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalAnnotations: this.annotations.length,
        ...this.getAnnotationStats(),
      },
      annotations: this.annotations.map(annotation => ({
        id: annotation.id,
        componentLabel: annotation.componentLabel,
        cssSelector: annotation.cssSelector,
        description: annotation.description,
        page: annotation.pageNumber,
        position: {
          x: Math.round(annotation.x * 100),
          y: Math.round(annotation.y * 100),
          width: Math.round(annotation.width * 100),
          height: Math.round(annotation.height * 100),
        },
        createdAt: annotation.createdAt,
        updatedAt: annotation.updatedAt,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    this.downloadBlob(blob, `${filename}.json`);
  }

  private exportAsCsv(filename: string): void {
    const headers = [
      'Component Label',
      'CSS Selector',
      'Description',
      'Page',
      'X Position (%)',
      'Y Position (%)',
      'Width (%)',
      'Height (%)',
      'Created Date',
      'Updated Date',
    ];

    const rows = this.annotations.map(annotation => [
      annotation.componentLabel || '',
      annotation.cssSelector || '',
      annotation.description || '',
      annotation.pageNumber.toString(),
      Math.round(annotation.x * 100).toString(),
      Math.round(annotation.y * 100).toString(),
      Math.round(annotation.width * 100).toString(),
      Math.round(annotation.height * 100).toString(),
      new Date(annotation.createdAt).toLocaleString(),
      new Date(annotation.updatedAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private getAnnotationStats() {
    const total = this.annotations.length;
    const completed = this.annotations.filter(
      annotation => annotation.componentLabel && annotation.cssSelector
    ).length;
    const pages = new Set(this.annotations.map(annotation => annotation.pageNumber)).size;

    return { total, completed, incomplete: total - completed, pages };
  }
}

export function createPdfExporter(annotations: Annotation[]): PdfExporter {
  return new PdfExporter(annotations);
}