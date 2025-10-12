import { Badge, type BadgeProps } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn, formatPercentage } from '../lib/utils';

export interface SimilarityBadgeProps extends Omit<BadgeProps, 'children'> {
  similarity: number;
  showTooltip?: boolean;
}

function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.95) return 'bg-red-500 text-white border-red-500';
  if (similarity >= 0.85) return 'bg-orange-500 text-white border-orange-500';
  if (similarity >= 0.75) return 'bg-yellow-500 text-white border-yellow-500';
  return 'bg-blue-500 text-white border-blue-500';
}

function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.95) return 'Exact';
  if (similarity >= 0.85) return 'Very High';
  if (similarity >= 0.75) return 'High';
  return 'Similar';
}

export function SimilarityBadge({ similarity, showTooltip = true, className, ...props }: SimilarityBadgeProps) {
  const colorClass = getSimilarityColor(similarity);
  const label = getSimilarityLabel(similarity);
  const percentage = formatPercentage(similarity);

  const badge = (
    <Badge {...props} className={cn('border-transparent', colorClass, className)}>
      {label} ({percentage})
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>Similarity Score: {percentage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

