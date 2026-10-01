/** A small colored label for a booking's status or a consultation's outcome. */
const TONES: Record<string, string> = {
  scheduled: "teal",
  pending_payment: "brass",
  completed: "muted",
  cancelled: "muted",
  cancelled_by_client: "muted",
  cancelled_by_tutor: "muted",
  no_show: "muted",
  pending: "brass",
  good_fit: "teal",
  not_a_fit: "muted",
};

export default function StatusPill({ value, prefix }: { value: string; prefix?: string }) {
  return (
    <span className={`status-pill ${TONES[value] ?? "muted"}`}>
      {prefix ? `${prefix} ` : ""}
      {value.replaceAll("_", " ")}
    </span>
  );
}
