// vendored from code-kit@0.76.0, src/ts/pure/run-exclusive.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
/** Runs jobs one after another per key: the next job starts when the previous one is done, even if it failed.
 *
 *  Origin: file-private in obsidian-kit `share-export.ts` (per export folder), lifted out when the chat history
 *  (`chat-archive-store`) needed the same promise: writes to one folder must not overtake each other, or the older state
 *  wins. Moved here from obsidian-kit `src/obsidian/run-exclusive.ts` (wave 33) because it imports nothing and assumes
 *  nothing about a vault; obsidian-kit vendors it back.
 *
 *  The queue is per process and per key, not across two Obsidian windows or two devices. */
const running = new Map<string, Promise<unknown>>();

export function runExclusive<T>(key: string, job: () => Promise<T>): Promise<T> {
  const prev = running.get(key) ?? Promise.resolve();
  const next = prev.then(job, job);
  const tail = next.catch(() => undefined);
  running.set(key, tail);
  void tail.then(() => { if (running.get(key) === tail) running.delete(key); });
  return next;
}
