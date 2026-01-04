import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function toast({ title, description, variant }: ToastProps) {
  if (variant === 'destructive') {
    sonnerToast.error(title || 'Error', {
      description,
    });
  } else {
    sonnerToast.success(title || 'Success', {
      description,
    });
  }
}

export function useToast() {
  return { toast };
}
