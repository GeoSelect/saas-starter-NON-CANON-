import { Button } from './button';
import { Share2 } from 'lucide-react';

export function ShareButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" className="gap-2" onClick={onClick}>
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
