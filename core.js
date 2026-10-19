(function(root) {
  "use strict";
  const FORMAT = "unischedule-backup";
  const VERSION = 1;
  const REQUIRED_ARRAYS = ["departments", "programs", "classes", "faculty", "rooms", "courses", "schedule"];

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function validateState(data) {
    if (!isObject(data)) return { ok: false, error: "Backup data must be a JSON object." };
    const missing = REQUIRED_ARRAYS.filter(function(key) { return !Array.isArray(data[key]); });
    if (missing.length) return { ok: false, error: "Backup is missing valid lists: " + missing.join(", ") + "." };
    if (!isObject(data.settings) || !isObject(data.organization)) {
      return { ok: false, error: "Backup must include organization and settings objects." };
    }
    return { ok: true };
  }
  function createBackup(data, exportedAt) {
    const check = validateState(data);
    if (!check.ok) throw new Error(check.error);
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: typeof exportedAt === "string" ? exportedAt : new Date().toISOString(),
      data: clone(data)
    };
  }
  function parseBackup(input) {
    let payload;
    try {
      payload = typeof input === "string" ? JSON.parse(input) : input;
    } catch (error) {
      return { ok: false, error: "The selected file is not valid JSON." };
    }
    let data;
    let metadata;
    if (isObject(payload) && Object.prototype.hasOwnProperty.call(payload, "format")) {
      if (payload.format !== FORMAT) return { ok: false, error: "This file is not a UniSchedule backup." };
      if (payload.version !== VERSION) return { ok: false, error: "Unsupported backup version: " + String(payload.version) + "." };
      data = payload.data;
      metadata = { format: FORMAT, version: VERSION, exportedAt: payload.exportedAt || null, legacy: false };
    } else {
      data = payload;
      metadata = { format: FORMAT, version: 0, exportedAt: null, legacy: true };
    }
    const check = validateState(data);
    if (!check.ok) return check;
    return { ok: true, data: clone(data), metadata: metadata };
  }
  function csvCell(value) {
    let text = String(value == null ? "" : value);
    if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = "'" + text;
    if (/[",\r\n]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
    return text;
  }
  function safeStorageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return { ok: true };
    } catch (error) {
      const quotaExceeded = error && (
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        error.code === 22 ||
        error.code === 1014
      );
      return {
        ok: false,
        error: quotaExceeded
          ? "Browser storage is full. Download a backup and free some site storage before retrying."
          : "Browser storage is blocked or unavailable. Check your browser privacy settings."
      };
    }
  }
  const api = {
    createBackup: createBackup,
    parseBackup: parseBackup,
    validateState: validateState,
    csvCell: csvCell,
    safeStorageSet: safeStorageSet
  };
  root.USCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
