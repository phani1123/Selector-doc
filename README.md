# Selectio - PDF UI Component Annotator

A minimal web application built with Next.js that allows users to upload Figma-exported PDFs and annotate UI components with CSS/DOM selectors for developers and QA teams.

## 🚀 Features

- **PDF Upload & Viewing**: Drag-and-drop or browse to upload Figma-exported PDF files
- **Interactive Annotation**: Click and drag to create annotations on UI components
- **Component Documentation**: Add component labels, CSS selectors, and descriptions
- **Multi-page Support**: Navigate through multi-page PDFs with annotations
- **Export Options**: Export annotations as JSON, CSV, or annotated PDF
- **Responsive Design**: Clean, minimal interface optimized for practical use

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **react-pdf** - PDF rendering and interaction
- **jsPDF** - PDF generation for exports
- **html2canvas** - Canvas rendering for PDF export

## 📦 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd selectio
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### 1. Upload PDF
- Drag and drop a Figma-exported PDF file into the upload area
- Or click "Select PDF File" to browse for a file
- Supports PDF files up to 50MB

### 2. Create Annotations
- Click the "Add Annotation" button to enter annotation mode
- Click and drag on the PDF to create rectangular annotations around UI components
- The annotation will be highlighted with a border and label

### 3. Edit Component Properties
- Click on any annotation to select it
- In the right sidebar, edit:
  - **Component Label**: Descriptive name (e.g., "Login Button")
  - **CSS Selector**: DOM selector (e.g., `#login-btn`, `.primary-btn`, `[data-testid="login"]`)
  - **Description**: Optional notes for developers/QA

### 4. Manage Annotations
- View all annotations in the right sidebar, organized by page
- Click any annotation in the list to select and view it on the PDF
- Copy CSS selectors to clipboard with one click
- Delete annotations using the trash icon

### 5. Export Documentation
- Click "Export" in the header to access export options:
  - **JSON**: Machine-readable format for automation
  - **CSV**: Spreadsheet format for documentation
  - **Annotated PDF**: Visual PDF with annotations and metadata

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main page component
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── pdf-uploader.tsx   # File upload component
│   ├── pdf-viewer-client.tsx # PDF rendering and annotation (client-side only)
│   ├── annotation-editor.tsx # Annotation form editor
│   ├── annotation-list.tsx   # Annotation management
│   ├── client-only.tsx    # SSR prevention wrapper
│   └── pdf-annotation-app.tsx # Main application
├── hooks/                 # Custom React hooks
│   └── use-annotations.ts # Annotation state management
├── lib/                   # Utility libraries
│   ├── pdf-config.ts      # PDF.js configuration
│   ├── pdf-export.ts      # Export functionality
│   └── utils.ts           # shadcn/ui utilities
└── types/                 # TypeScript type definitions
    └── annotation.ts      # Annotation interfaces
```

## 🎨 CSS Selector Examples

The application supports various CSS selector formats:

- **ID Selector**: `#login-button`
- **Class Selector**: `.btn-primary`
- **Attribute Selector**: `[data-testid="submit-btn"]`
- **Type Selector**: `button`
- **Descendant Selector**: `.form .submit-button`
- **Child Selector**: `.navbar > .menu-item`

## 🔧 Configuration

### PDF.js Worker
The application automatically configures PDF.js worker for optimal performance. The worker file is copied to the `public` directory during setup.

### Export Settings
Default export settings can be modified in `src/lib/pdf-export.ts`:
- File size limits
- Export formats
- Metadata inclusion

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Use Cases

### For QA Teams
- Document UI element selectors for automated testing
- Create test data with precise component locations
- Export CSV files for test planning and documentation

### For Developers
- Get precise CSS selectors for component implementation
- Understand UI component hierarchy and relationships
- Import JSON data for automated UI testing setup

### For Design-to-Development Handoff
- Bridge the gap between Figma designs and code implementation
- Provide clear component specifications and selectors
- Ensure consistent naming between design and development

## 📝 Export Formats

### JSON Export
```json
{
  "metadata": {
    "exportDate": "2024-01-20T10:30:00Z",
    "totalAnnotations": 15,
    "completed": 15,
    "pages": 3
  },
  "annotations": [
    {
      "id": "annotation-1",
      "componentLabel": "Login Button",
      "cssSelector": "#login-btn",
      "description": "Primary action button",
      "page": 1,
      "position": { "x": 45, "y": 60, "width": 10, "height": 8 }
    }
  ]
}
```

### CSV Export
Includes columns for component label, CSS selector, description, page, position, and timestamps.

## 🐛 Troubleshooting

### PDF Not Loading
- Ensure the file is a valid PDF (not an image or other format)
- Check file size is under 50MB
- Try refreshing the page and re-uploading

### Annotations Not Saving
- Make sure to fill in both Component Label and CSS Selector fields
- Check browser console for any JavaScript errors

### Export Issues
- Ensure you have created at least one annotation
- Check browser's download permissions
- Try a different export format

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

---

Built with ❤️ using Next.js, TypeScript, and shadcn/ui