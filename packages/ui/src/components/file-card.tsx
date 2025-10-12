import type { FileMetadata, FileWithPath } from '@ai-cleanup/types';
import { Card, CardContent, CardFooter } from './card';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import { ImageIcon, FileTextIcon, FileIcon as DefaultFileIcon } from 'lucide-react';
import { cn, formatBytes, getFileTypeFromMime } from '../lib/utils';

export interface FileCardProps {
  file: FileMetadata | FileWithPath;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  showCheckbox?: boolean;
  className?: string;
}

function getFileIcon(mimeType: string) {
  const type = getFileTypeFromMime(mimeType);
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'pdf':
      return FileTextIcon;
    case 'text':
      return FileTextIcon;
    default:
      return DefaultFileIcon;
  }
}

export function FileCard({ file, selected = false, onSelectChange, showCheckbox = true, className }: FileCardProps) {
  const Icon = getFileIcon(file.mimeType);
  const fileType = getFileTypeFromMime(file.mimeType);

  return (
    <Card className={cn('relative hover:shadow-md transition-shadow', selected && 'ring-2 ring-primary', className)}>
      {showCheckbox && (
        <div className="absolute top-3 right-3 z-10">
          <Checkbox checked={selected} onCheckedChange={(checked) => onSelectChange?.(checked as boolean)} />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate" title={file.fileName}>
              {file.fileName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
              <Badge variant="outline" className="text-xs">
                {fileType}
              </Badge>
            </div>
          </div>
        </div>

        {file.sha256 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground font-mono truncate" title={file.sha256}>
              {file.sha256.substring(0, 16)}...
            </p>
          </div>
        )}
      </CardContent>

      {'path' in file && file.path && (
        <CardFooter className="px-4 pb-4 pt-0">
          <p className="text-xs text-muted-foreground truncate w-full" title={file.path}>
            {file.path}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

