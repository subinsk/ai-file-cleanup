import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { DedupeGroup } from '@ai-cleanup/types';
import { cn, formatBytes } from '../lib/utils';
import { FileCard } from './file-card';
import { SimilarityBadge } from './similarity-badge';
import { Badge } from './badge';

export interface GroupAccordionProps {
  groups: DedupeGroup[];
  selectedFiles?: Set<string>;
  onFileSelect?: (fileId: string, selected: boolean) => void;
  className?: string;
}

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('border-b', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export function GroupAccordion({ groups, selectedFiles = new Set(), onFileSelect, className }: GroupAccordionProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No duplicate groups found</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className={cn('w-full', className)}>
      {groups.map((group) => {
        const allFiles = [group.keepFile, ...group.duplicates.map((d) => d.file)];
        const totalSize = allFiles.reduce((sum, file) => sum + file.sizeBytes, 0);
        const avgSimilarity =
          group.duplicates.length > 0
            ? group.duplicates.reduce((sum, d) => sum + d.similarity, 0) / group.duplicates.length
            : 1;

        return (
          <AccordionItem key={group.id} value={group.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-3 flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{allFiles.length} files</Badge>
                  <SimilarityBadge similarity={avgSimilarity} />
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>Total: {formatBytes(totalSize)}</span>
                  <span className="mx-2">•</span>
                  <span className="text-destructive">Can save: {formatBytes(group.totalSizeSaved)}</span>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="text-green-600">✓</span> Keep this file
                  </h4>
                  <FileCard file={group.keepFile} showCheckbox={false} className="bg-green-50 dark:bg-green-950/20" />
                </div>

                {group.duplicates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span className="text-destructive">×</span> Duplicates ({group.duplicates.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.duplicates.map((duplicate) => (
                        <FileCard
                          key={duplicate.file.id}
                          file={duplicate.file}
                          selected={selectedFiles.has(duplicate.file.id)}
                          onSelectChange={(selected) => onFileSelect?.(duplicate.file.id, selected)}
                          className="bg-destructive/5"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Reason:</strong> {group.reason}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

