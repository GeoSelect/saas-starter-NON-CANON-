import { useState, useCallback } from 'react';

interface UseSharePdfGateReturn {
  isOpen: boolean;
  reportName: string;
  openShareDialog: (name: string) => void;
  closeShareDialog: () => void;
  handleShare: (callback: () => void | Promise<void>) => Promise<void>;
}

export function useSharePdfGate(): UseSharePdfGateReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [reportName, setReportName] = useState('');

  const openShareDialog = useCallback((name: string) => {
    setReportName(name);
    setIsOpen(true);
  }, []);

  const closeShareDialog = useCallback(() => {
    setIsOpen(false);
    setReportName('');
  }, []);

  const handleShare = useCallback(
    async (callback: () => void | Promise<void>) => {
      try {
        await callback();
        closeShareDialog();
      } catch (error) {
        console.error('Share failed:', error);
        throw error;
      }
    },
    [closeShareDialog]
  );

  return {
    isOpen,
    reportName,
    openShareDialog,
    closeShareDialog,
    handleShare,
  };
}
