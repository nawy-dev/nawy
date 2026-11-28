// نموذج عرض شاشة الأرشيف: البحث والترتيب والتجميع بالأيام وتسميات الأزرار ونص التاريخ.
// ES module (نمط القرارات 113 و117): دالة صافية بتاخد الأرشيف والبحث واللغة ودوال الترجمة والتواريخ كمعاملات بدل ما تقرا globals من app.js،
// فتتختبر في Node مباشرة. archive-stats.js (classic) بينادي NawyArchiveView.buildArchiveView وقت العرض، والرسم نفسه (React أو الاحتياطي) ما اتغيّرش.
const GROUP_ORDER = /** @type {const} */ ([
  ["today", "archiveGroupToday"],
  ["yesterday", "archiveGroupYesterday"],
  ["older", "archiveGroupOlder"]
]);

/**
 * @param {{
 *   archive: any[],
 *   query: string,
 *   language: string,
 *   t: (key: string) => string,
 *   tf: (key: string, params: Record<string, any>) => string,
 *   dates: { archiveDayGroup: (ts: number) => string, formatOlderDate: (ts: number, language: string) => string, formatArchivedTime: (ts: number, language: string) => string },
 *   now?: () => number
 * }} input
 */
export function buildArchiveView({ archive, query, language, t, tf, dates, now = Date.now }) {
  const total = archive.length;
  if (total === 0) return { kind: "empty", message: t("noArchive") };

  const needle = String(query || "")
    .trim()
    .toLowerCase();
  const filtered = needle
    ? archive.filter(task =>
        String(task.text || "")
          .toLowerCase()
          .includes(needle)
      )
    : archive;

  if (filtered.length === 0) return { kind: "empty", message: t("noArchiveResults") };

  /** @type {Record<string, any[]>} */
  const groups = { today: [], yesterday: [], older: [] };
  filtered
    .slice()
    .sort((a, b) => (Number(b.archivedAt) || 0) - (Number(a.archivedAt) || 0))
    .forEach(task => {
      const key = dates.archiveDayGroup(task.archivedAt || task.updatedAt || now());
      groups[key].push(task);
    });

  return {
    kind: "groups",
    restoreLabel: t("restore"),
    deleteLabel: t("delete"),
    groups: GROUP_ORDER.filter(([key]) => groups[key].length > 0).map(([key, labelKey]) => ({
      key,
      label: t(labelKey),
      items: groups[key].map(task => {
        const ts = task.archivedAt || task.updatedAt || now();
        const time = key === "older" ? dates.formatOlderDate(ts, language) : dates.formatArchivedTime(ts, language);
        return { id: task.id, text: task.text, dateText: tf("archiveArchivedAt", { time }) };
      })
    }))
  };
}

/** @type {any} */ (globalThis).NawyArchiveView = { buildArchiveView };
