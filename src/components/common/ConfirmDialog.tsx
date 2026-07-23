import { Button } from "../ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "삭제",
  cancelLabel = "취소",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
