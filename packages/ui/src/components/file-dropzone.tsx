import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { Upload, FileIcon } from 'lucide-react';
import { cn, formatBytes } from '../lib/utils';

export interface FileDropzoneProps extends Omit<DropzoneOptions, 'onDrop'> {
  onFilesSelected: (files: File[]) => void;
  className?: string;
  'data-testid'?: string;
}

export function FileDropzone({
  onFilesSelected,
  className,
  'data-testid': testId,
  ...dropzoneOptions
}: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    ...dropzoneOptions,
    onDrop: (acceptedFiles) => {
      onFilesSelected(acceptedFiles);
    },
  });

  const hasFiles = acceptedFiles.length > 0;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        className
      )}
      data-testid={testId}
    >
      <input {...getInputProps()} data-testid={testId ? `${testId}-input` : undefined} />

      <div className="flex flex-col items-center justify-center text-center gap-4">
        {isDragActive ? (
          <>
            <Upload className="w-12 h-12 text-primary animate-bounce" />
            <div>
              <p className="text-lg font-medium">Drop files here</p>
              <p className="text-sm text-muted-foreground">Release to upload</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">
                Drag & drop files here, or <span className="text-primary">browse</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports images, PDFs, and text files
              </p>
            </div>
          </>
        )}

        {hasFiles && (
          <div className="mt-4 p-4 bg-muted rounded-md w-full max-w-md">
            <p className="text-sm font-medium mb-2">{acceptedFiles.length} file(s) selected</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {acceptedFiles.slice(0, 3).map((file, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="ml-2">{formatBytes(file.size)}</span>
                </li>
              ))}
              {acceptedFiles.length > 3 && (
                <li className="text-center pt-1">and {acceptedFiles.length - 3} more...</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
