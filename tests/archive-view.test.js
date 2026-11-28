"use strict";
// archive-view.js: نموذج عرض الأرشيف (بحث، ترتيب، تجميع بالأيام، تسميات) كدالة صافية؛ التواريخ والترجمة معاملات فنختبرها في Node.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const load = name => import(pathToFileURL(path.join(__dirname, "..", name)).href);
const NOW = new Date(2026, 9, 25, 15, 30);
const at = (daysAgo, h = 9) => new Date(2026, 9, 25 - daysAgo, h, 0).getTime();

const strings = {
  noArchive: "NO",
  noArchiveResults: "NORES",
  restore: "R",
  delete: "D",
  archiveGroupToday: "TODAY",
  archiveGroupYesterday: "YEST",
  archiveGroupOlder: "OLD"
};
const t = key => strings[key] ?? key;
const tf = (key, params) => `${key}:${params.time}`;

async function build(archive, query = "", language = "ar") {
  const dates = await load("date-format.js");
  const view = await load("archive-view.js");
  const realDates = {
    archiveDayGroup: ts => dates.archiveDayGroup(ts, NOW),
    formatOlderDate: dates.formatOlderDate,
    formatArchivedTime: dates.formatArchivedTime
  };
  return view.buildArchiveView({ archive, query, language, t, tf, dates: realDates, now: () => NOW.getTime() });
}

test("empty archive and a search with no hits give different messages", async () => {
  assert.deepEqual(await build([]), { kind: "empty", message: "NO" });
  assert.deepEqual(await build([{ id: "a", text: "اشرب ماء", archivedAt: at(0) }], "xyz"), {
    kind: "empty",
    message: "NORES"
  });
});

test("groups by calendar day, newest first, empty groups omitted, labels from t()", async () => {
  const view = await build([
    { id: "old", text: "قديم", archivedAt: at(5) },
    { id: "t1", text: "أول", archivedAt: at(0, 8) },
    { id: "t2", text: "ثاني", archivedAt: at(0, 12) }
  ]);
  assert.equal(view.kind, "groups");
  assert.equal(view.restoreLabel, "R");
  assert.equal(view.deleteLabel, "D");
  assert.deepEqual(
    view.groups.map(g => [g.key, g.label, g.items.map(i => i.id)]),
    [
      ["today", "TODAY", ["t2", "t1"]],
      ["older", "OLD", ["old"]]
    ]
  );
});

test("search is case-insensitive, trimmed and matches Arabic text", async () => {
  const archive = [
    { id: "1", text: "Walk Daily", archivedAt: at(0) },
    { id: "2", text: "اقرأ كتاب", archivedAt: at(1) },
    { id: "3", text: undefined, archivedAt: at(2) }
  ];
  assert.deepEqual(
    (await build(archive, "  WALK ")).groups[0].items.map(i => i.id),
    ["1"]
  );
  assert.deepEqual(
    (await build(archive, "كتاب")).groups[0].items.map(i => i.id),
    ["2"]
  );
});

test("date text: time for recent groups, full date for older, in both languages", async () => {
  const archive = [
    { id: "a", text: "x", archivedAt: at(0, 9) },
    { id: "b", text: "y", archivedAt: at(5, 9) }
  ];
  const ar = await build(archive, "", "ar");
  const en = await build(archive, "", "en");
  const dates = await load("date-format.js");
  assert.equal(ar.groups[0].items[0].dateText, `archiveArchivedAt:${dates.formatArchivedTime(at(0, 9), "ar")}`);
  assert.equal(ar.groups[1].items[0].dateText, `archiveArchivedAt:${dates.formatOlderDate(at(5, 9), "ar")}`);
  assert.equal(en.groups[1].items[0].dateText, `archiveArchivedAt:${dates.formatOlderDate(at(5, 9), "en")}`);
});

test("items without archivedAt fall back to updatedAt, then to now; the input is not mutated", async () => {
  const archive = [
    { id: "u", text: "a", updatedAt: at(5) },
    { id: "n", text: "b" }
  ];
  const copy = JSON.parse(JSON.stringify(archive));
  const view = await build(archive);
  assert.deepEqual(
    view.groups.map(g => [g.key, g.items.map(i => i.id)]),
    [
      ["today", ["n"]],
      ["older", ["u"]]
    ]
  );
  assert.deepEqual(archive, copy);
});

test("the NawyArchiveView bridge exposes buildArchiveView for the classic scripts", async () => {
  const view = await load("archive-view.js");
  assert.equal(globalThis.NawyArchiveView.buildArchiveView, view.buildArchiveView);
});
