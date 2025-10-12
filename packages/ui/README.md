# @ai-cleanup/ui

Shared React component library for AI File Cleanup System using shadcn/ui and Tailwind CSS.

## Features

- 🎨 Beautiful, modern UI components built with Radix UI primitives
- 🎨 Tailwind CSS for styling with dark mode support
- 📦 Tree-shakeable exports
- 🔷 TypeScript support with full type definitions
- ♿ Accessible components following WAI-ARIA standards

## Components

### Base Components (shadcn/ui)
- **Button** - Versatile button with multiple variants
- **Card** - Container for grouping content
- **Badge** - Status and category indicators
- **Checkbox** - Checkbox input with label support
- **Progress** - Progress indicator
- **Tooltip** - Contextual information on hover
- **Loading Spinner** - Animated loading indicator

### Custom Components
- **FileCard** - Display file information with preview
- **FileDropzone** - Drag-and-drop file upload area
- **SimilarityBadge** - Visual similarity score indicator
- **GroupAccordion** - Collapsible duplicate file groups

## Utilities

- `cn()` - Merge Tailwind CSS classes
- `formatBytes()` - Format bytes to human-readable string
- `formatPercentage()` - Format decimal to percentage
- `getFileExtension()` - Extract file extension
- `getFileTypeFromMime()` - Determine file category from MIME type

## Hooks

- `useDebounce` - Debounce value changes
- `useFileUpload` - Handle file upload with progress tracking

## Usage

```tsx
import { Button, FileCard, FileDropzone, useFileUpload } from '@ai-cleanup/ui';
import '@ai-cleanup/ui/styles.css';

function MyComponent() {
  const { uploadFiles, isUploading, progress } = useFileUpload({
    onSuccess: (data) => console.log('Upload complete:', data),
    onError: (error) => console.error('Upload failed:', error),
  });

  return (
    <div>
      <FileDropzone
        onFilesSelected={(files) => uploadFiles(files, '/api/upload')}
        accept={{ 'image/*': [], 'application/pdf': [] }}
        maxSize={10 * 1024 * 1024} // 10MB
      />
      {isUploading && <Progress value={progress} />}
      <Button onClick={() => console.log('Clicked!')}>
        Process Files
      </Button>
    </div>
  );
}
```

## Styling

This package uses Tailwind CSS with CSS variables for theming. Import the stylesheet in your app:

```tsx
import '@ai-cleanup/ui/styles.css';
```

### Dark Mode

Dark mode is supported out of the box. Add the `dark` class to a parent element:

```tsx
<div className="dark">
  {/* Your components */}
</div>
```

## Development

```bash
# Build the package
pnpm build

# Watch for changes
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Dependencies

### Peer Dependencies
- `react` ^18.2.0
- `react-dom` ^18.2.0

### Key Dependencies
- `@radix-ui/*` - Accessible component primitives
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` - Icon library
- `react-dropzone` - File drag-and-drop
- `class-variance-authority` - Component variants
- `tailwind-merge` - Merge Tailwind classes

## License

Private - Part of AI File Cleanup System

