export function groupSlotsByDay(slots: string[], timezone: string): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const iso of slots) {
    const date = new Date(iso);
    const key = date.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(iso);
  }
  return Array.from(groups.entries());
}
