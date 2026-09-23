"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
import { FeedbackDialog } from "./FeedbackDialog";

type ConfirmRequest = Omit<
  ConfirmDialogProps,
  "open" | "onOpenChange" | "onConfirm" | "loading"
> & {
  onConfirm: () => void | Promise<void>;
};

/**
 * Hook para abrir confirm/feedback do sistema sem window.confirm/alert.
 */
export function useSystemDialogs() {
  const [confirmState, setConfirmState] = useState<ConfirmRequest | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    title?: string;
    description: string;
  } | null>(null);

  const showAlert = useCallback((description: string, title = "Aviso") => {
    setFeedback({ title, description });
  }, []);

  const showConfirm = useCallback((request: ConfirmRequest) => {
    setConfirmState(request);
  }, []);

  const dialogs = (
    <>
      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(open) => {
          if (!open && !confirmLoading) setConfirmState(null);
        }}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        confirmVariant={confirmState?.confirmVariant}
        loading={confirmLoading}
        onConfirm={async () => {
          if (!confirmState) return;
          setConfirmLoading(true);
          try {
            await confirmState.onConfirm();
            setConfirmState(null);
          } finally {
            setConfirmLoading(false);
          }
        }}
      />
      <FeedbackDialog
        open={!!feedback}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
        title={feedback?.title}
        description={feedback?.description ?? ""}
      />
    </>
  );

  return { showAlert, showConfirm, dialogs };
}
