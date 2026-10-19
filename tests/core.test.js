const test = require("node:test");
const assert = require("node:assert/strict");
const USCore = require("../core.js");

function sampleState() {
  return {
    organization: { name: "Example University", code: "EX001" },
    settings: { year: "2026-27", semester: "Semester V" },
    departments: [], programs: [], classes: [], faculty: [], rooms: [], courses: [], schedule: [],
    versions: [], shareLinks: [], activityLog: [], branding: {}
  };
}

test("versioned backups round-trip without mutating the source", () => {
  const state = sampleState();
  const payload = USCore.createBackup(state, "2026-10-19T00:00:00.000Z");
  state.classes.push({ id: "later" });
  const parsed = USCore.parseBackup(JSON.stringify(payload));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.metadata.legacy, false);
  assert.equal(parsed.metadata.version, 1);
  assert.deepEqual(parsed.data.classes, []);
  assert.equal(payload.exportedAt, "2026-10-19T00:00:00.000Z");
});

test("legacy raw JSON backups remain importable", () => {
  const state = sampleState();
  const parsed = USCore.parseBackup(JSON.stringify(state));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.metadata.legacy, true);
  assert.deepEqual(parsed.data, state);
});

test("malformed, foreign, unsupported, and incomplete backups are rejected", () => {
  assert.equal(USCore.parseBackup("{").ok, false);
  assert.equal(USCore.parseBackup({ format: "other", version: 1, data: sampleState() }).ok, false);
  assert.equal(USCore.parseBackup({ format: "unischedule-backup", version: 99, data: sampleState() }).ok, false);
  assert.equal(USCore.parseBackup({ organization: {}, settings: {}, courses: [] }).ok, false);
  assert.throws(() => USCore.createBackup({}), /Backup data must be a JSON object/);
});

test("CSV cells quote delimiters and neutralize spreadsheet formulas", () => {
  assert.equal(USCore.csvCell("a,b"), '"a,b"');
  assert.equal(USCore.csvCell('a"b'), '"a""b"');
  assert.equal(USCore.csvCell("=1+1"), "'=1+1");
  assert.equal(USCore.csvCell("@SUM(A1:A2)"), "'@SUM(A1:A2)");
  assert.equal(USCore.csvCell("\t=1+1"), "'\t=1+1");
});

test("storage failures are returned as actionable errors instead of throwing", () => {
  assert.deepEqual(USCore.safeStorageSet({ setItem() {} }, "key", "value"), { ok: true });
  const failed = USCore.safeStorageSet({
    setItem() {
      const error = new Error("full");
      error.name = "QuotaExceededError";
      throw error;
    }
  }, "key", "value");
  assert.equal(failed.ok, false);
  assert.match(failed.error, /storage is full/i);
});
