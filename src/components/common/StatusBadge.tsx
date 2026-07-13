type BadgeTone = "green" | "gray" | "yellow" | "red";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-green-100 text-green-700",
  gray: "bg-slate-100 text-slate-600",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
};

const MEMBER_STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "활성", tone: "green" },
  INACTIVE: { label: "비활성", tone: "gray" },
};

const PAYMENT_STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "대기", tone: "yellow" },
  SUCCESS: { label: "성공", tone: "green" },
  FAILED: { label: "실패", tone: "red" },
  CANCELLED: { label: "취소", tone: "gray" },
};

interface StatusBadgeProps {
  status: string;
  kind: "member" | "payment";
}

export function StatusBadge({ status, kind }: StatusBadgeProps) {
  const map = kind === "member" ? MEMBER_STATUS_LABEL : PAYMENT_STATUS_LABEL;
  const entry = map[status] ?? { label: status, tone: "gray" as BadgeTone };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[entry.tone]}`}
    >
      {entry.label}
    </span>
  );
}
