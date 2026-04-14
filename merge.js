(function () {
  "use strict";

  const defaultConfig = {
    files: [],
    basePath: "",
    debug: true,
  };

  const config = Object.assign(
    {},
    defaultConfig,
    window.fileMergerConfig || {},
  );
  window.mergedFiles = window.mergedFiles || {};

  const mergeStatus   = {};
  const mergeProgress = {};
  const mergeBytes    = {}; // { [filename]: { loaded: number, total: number } }
  const mergeErrors   = {}; // { [filename]: string[] }

  let loadingDiv;
  let loadingContent;
  const detailsOpen = {}; // track open/closed state across re-renders

  function initializeUI() {
    loadingDiv = document.createElement("div");
    loadingDiv.id = "file-merger-loading";
    loadingDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 30px 40px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 16px;
      z-index: 10000;
      min-width: 340px;
      max-width: 520px;
      text-align: center;
    `;

    loadingContent = document.createElement("div");
    loadingContent.id = "file-merger-content";
    loadingDiv.appendChild(loadingContent);
    document.body.appendChild(loadingDiv);
  }

  function formatMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  function getGlobalProgress() {
    let totalLoaded = 0;
    let totalSize   = 0;
    for (const file of config.files) {
      const b = mergeBytes[file.name];
      if (b) {
        totalLoaded += b.loaded;
        totalSize   += b.total;
      }
    }
    return { totalLoaded, totalSize };
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateLoadingDisplay() {
    if (!loadingContent) return;

    const { totalLoaded, totalSize } = getGlobalProgress();
    const pct      = totalSize > 0 ? Math.min(100, (totalLoaded / totalSize) * 100) : 0;
    const anyFailed = config.files.some((f) => mergeStatus[f.name] === "failed");

    const lines = [
      `<div style="font-size:18px;margin-bottom:10px;">${anyFailed ? "⚠ merge failed" : "loading..."}</div>`,

      // ── Credits ──────────────────────────────────────────────────────────
      `<div style="font-size:13px;color:#aaa;margin-bottom:12px;">
        Originally made by&nbsp;
        <a href="https://www.gn-math.dev/" style="color:#d42222;text-decoration:underline;">gn-math</a>
        &nbsp;and the&nbsp;
        <a href="https://docs.google.com/document/d/1_FmH3BlSBQI7FGgAQL59-ZPe8eCxs35wel6JUyVaG8Q/" style="color:#14b4f3;text-decoration:underline;">ugs</a>
        &nbsp;— edited for&nbsp;
        <a href="https://usesienna.vercel.app" style="color:#f0f345;text-decoration:underline;">sienna.</a>
      </div>`,

      // ── Progress bar — plain white fill ──────────────────────────────────
      `<div style="margin-bottom:6px;font-size:13px;color:#ccc;">
        ${formatMB(totalLoaded)} / ${formatMB(totalSize)} MB &nbsp;(${pct.toFixed(1)}%)
      </div>`,
      `<div style="background:#333;border-radius:4px;overflow:hidden;height:10px;margin-bottom:16px;width:100%;">
        <div style="background:#ffffff;width:${pct}%;height:100%;transition:width 0.2s ease;"></div>
      </div>`,
    ];

    // ── Per-file rows ─────────────────────────────────────────────────────
    config.files.forEach((file) => {
      const status   = mergeStatus[file.name]   || "waiting";
      const progress = mergeProgress[file.name] || { current: 0, total: file.parts };
      const errors   = mergeErrors[file.name]   || [];

      let statusText, color;
      if (status === "merging") {
        statusText = `part ${progress.current}/${progress.total}`;
        color = "#ffa500";
      } else if (status === "ready") {
        statusText = "done";
        color = "#00ff00";
      } else if (status === "failed") {
        statusText = "failed";
        color = "#ff0000";
      } else {
        statusText = "waiting...";
        color = "#888";
      }

      lines.push(
        `<div style="margin:6px 0;color:${color};font-size:14px;">${file.name} &nbsp;${statusText}</div>`,
      );

      // "see details" dropdown — only on failure with messages
      if (status === "failed" && errors.length > 0) {
        const safeId = file.name.replace(/[^a-zA-Z0-9]/g, "_");
        const isOpen = detailsOpen[file.name] || false;
        const errorLines = errors
          .map((e) => `<div style="margin:4px 0;word-break:break-word;">${escapeHtml(e)}</div>`)
          .join("");

        lines.push(`
          <div style="margin:4px 0 10px 0;text-align:left;">
            <button
              id="fm-toggle-${safeId}"
              style="
                background:none;border:1px solid #ff0000;color:#ff6666;
                font-family:monospace;font-size:12px;cursor:pointer;
                padding:2px 8px;border-radius:4px;margin-bottom:4px;
              "
            >${isOpen ? "▲ hide details" : "▼ see details"}</button>
            <div
              id="fm-details-${safeId}"
              style="
                display:${isOpen ? "block" : "none"};
                background:#1a0000;border:1px solid #660000;
                border-radius:4px;padding:8px 10px;
                font-size:12px;color:#ff9999;
                text-align:left;line-height:1.5;
              "
            >${errorLines}</div>
          </div>
        `);
      }
    });

    loadingContent.innerHTML = lines.join("");

    // Re-attach toggle listeners after innerHTML wipe
    config.files.forEach((file) => {
      if (mergeStatus[file.name] !== "failed") return;
      const safeId = file.name.replace(/[^a-zA-Z0-9]/g, "_");
      const btn     = document.getElementById(`fm-toggle-${safeId}`);
      const details = document.getElementById(`fm-details-${safeId}`);
      if (!btn || !details) return;

      btn.addEventListener("click", () => {
        detailsOpen[file.name] = !detailsOpen[file.name];
        const open = detailsOpen[file.name];
        details.style.display = open ? "block" : "none";
        btn.textContent       = open ? "▲ hide details" : "▼ see details";
      });
    });

    // Auto-dismiss only when everything succeeded — stay open on any failure
    const allDone = config.files.every(
      (f) => mergeStatus[f.name] === "ready" || mergeStatus[f.name] === "failed",
    );

    if (allDone && !anyFailed) {
      setTimeout(() => {
        loadingDiv.style.opacity = "0";
        loadingDiv.style.transition = "opacity 0.5s";
        setTimeout(() => loadingDiv.remove(), 500);
      }, 1000);
    }
  }

  function log(...args) {
    if (config.debug) console.log("[FileMerger]", ...args);
  }

  function recordError(filename, msg) {
    if (!mergeErrors[filename]) mergeErrors[filename] = [];
    mergeErrors[filename].push(msg);
    console.error("[FileMerger]", msg);
  }

  function normalizeUrl(url) {
    try {
      return decodeURIComponent(url.toString().split("?")[0]);
    } catch (e) {
      return url;
    }
  }

  function urlsMatch(url1, url2) {
    const norm1 = normalizeUrl(url1);
    const norm2 = normalizeUrl(url2);
    if (norm1 === norm2) return true;
    if (norm1.endsWith(norm2) || norm2.endsWith(norm1)) return true;
    return norm1.split("/").pop() === norm2.split("/").pop();
  }

  async function mergeSplitFiles(filePath, numParts) {
    const fileName = filePath.split("/").pop();
    mergeProgress[fileName] = { current: 0, total: numParts };
    mergeBytes[fileName]    = { loaded: 0, total: 0 };
    mergeErrors[fileName]   = [];
    updateLoadingDisplay();

    const parts = [];
    for (let i = 1; i <= numParts; i++) parts.push(`${filePath}.part${i}`);

    log(`Merging "${fileName}" from ${numParts} parts...`);

    const buffers = [];
    for (let i = 0; i < parts.length; i++) {
      const partUrl = parts[i];
      let response;

      try {
        response = await window.originalFetch(partUrl);
      } catch (fetchErr) {
        const msg = `Part ${i + 1}/${numParts}: could not reach "${partUrl}" — network error or URL not found. (${fetchErr.message})`;
        recordError(fileName, msg);
        throw new Error(msg);
      }

      if (!response.ok) {
        let reason;
        if (response.status === 404) {
          reason = `file not found (404) — "${partUrl}" doesn't exist at that path`;
        } else if (response.status === 403) {
          reason = `access denied (403) for "${partUrl}" — check hosting permissions`;
        } else {
          reason = `unexpected HTTP ${response.status} from "${partUrl}"`;
        }
        const msg = `Part ${i + 1}/${numParts} of "${fileName}" failed — ${reason}`;
        recordError(fileName, msg);
        throw new Error(msg);
      }

      let buffer;
      try {
        buffer = await response.arrayBuffer();
      } catch (readErr) {
        const msg = `Part ${i + 1}/${numParts}: could not read "${partUrl}" — file may be corrupted or connection dropped. (${readErr.message})`;
        recordError(fileName, msg);
        throw new Error(msg);
      }

      buffers.push(buffer);
      mergeBytes[fileName].loaded += buffer.byteLength;

      // After the first part arrives, estimate total size as firstPartSize × numParts.
      // This gives the bar something real to work with from the start.
      // It gets corrected to the exact value once all parts are assembled.
      if (i === 0) {
        mergeBytes[fileName].total = buffer.byteLength * numParts;
      }

      mergeProgress[fileName].current = i + 1;
      updateLoadingDisplay();
    }

    const totalSize = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    mergeBytes[fileName].loaded = totalSize;
    mergeBytes[fileName].total  = totalSize;

    const mergedArray = new Uint8Array(totalSize);
    let offset = 0;
    for (const buffer of buffers) {
      mergedArray.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    log(`"${fileName}" merge complete: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    return mergedArray.buffer;
  }

  function shouldInterceptFile(url) {
    const urlStr = normalizeUrl(url);
    if (urlStr.includes(".part")) return null;

    for (const file of config.files) {
      const fileName = file.name;
      const fullPath = config.basePath ? `${config.basePath}${fileName}` : fileName;

      if (
        urlsMatch(urlStr, fileName)         ||
        urlsMatch(urlStr, fullPath)         ||
        urlsMatch(urlStr, fileName + ".br") ||
        urlsMatch(urlStr, fullPath + ".br")
      ) {
        return fileName;
      }
    }
    return null;
  }

  function getMergedFile(filename) {
    if (window.mergedFiles[filename]) return window.mergedFiles[filename];
    for (const [key, value] of Object.entries(window.mergedFiles)) {
      if (urlsMatch(key, filename)) return value;
    }
    return null;
  }

  if (!window.originalFetch) window.originalFetch = window.fetch;

  window.fetch = function (url, ...args) {
    const filename = shouldInterceptFile(url);
    if (filename) {
      log("Intercepting fetch for:", filename);
      return new Promise((resolve, reject) => {
        const maxWait   = 60000;
        const startTime = Date.now();

        const check = setInterval(() => {
          const buffer = getMergedFile(filename);
          if (buffer) {
            clearInterval(check);
            const contentType = filename.endsWith(".wasm")
              ? "application/wasm"
              : "application/octet-stream";
            resolve(new Response(buffer, {
              status: 200,
              statusText: "OK",
              headers: {
                "Content-Type":   contentType,
                "Content-Length": buffer.byteLength.toString(),
              },
            }));
          } else if (mergeStatus[filename] === "failed") {
            clearInterval(check);
            const msg = `Fetch interceptor: "${filename}" failed to merge — check the loader for details.`;
            recordError(filename, msg);
            reject(new Error(msg));
          } else if (Date.now() - startTime > maxWait) {
            clearInterval(check);
            const msg = `Timed out waiting for "${filename}" to finish merging after ${maxWait / 1000}s.`;
            recordError(filename, msg);
            reject(new Error(msg));
          }
        }, 100);
      });
    }
    return window.originalFetch.call(this, url, ...args);
  };

  if (!window.OriginalXMLHttpRequest)
    window.OriginalXMLHttpRequest = window.XMLHttpRequest;

  window.XMLHttpRequest = function (options) {
    const xhr = new window.OriginalXMLHttpRequest(options);
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    let requestUrl = "";

    xhr.open = function (method, url, ...args) {
      requestUrl = url;
      return originalOpen.call(this, method, url, ...args);
    };

    xhr.send = function (...args) {
      const filename = shouldInterceptFile(requestUrl);
      if (filename) {
        log("Intercepting XHR for:", filename);
        const waitForMerge = () => {
          const buffer = getMergedFile(filename);
          if (buffer) {
            Object.defineProperties(xhr, {
              status:       { value: 200 },
              statusText:   { value: "OK" },
              response:     { value: buffer },
              responseType: { value: "arraybuffer" },
              readyState:   { value: 4 },
            });
            setTimeout(() => {
              if (xhr.onreadystatechange) xhr.onreadystatechange();
              if (xhr.onload) xhr.onload({ type: "load", target: xhr });
            }, 1);
          } else if (mergeStatus[filename] === "failed") {
            const msg = `XHR interceptor: "${filename}" failed to merge — check the loader for details.`;
            recordError(filename, msg);
            if (xhr.onerror) xhr.onerror(new Error(msg));
          } else {
            setTimeout(waitForMerge, 100);
          }
        };
        waitForMerge();
        return;
      }
      return originalSend.call(this, ...args);
    };

    return xhr;
  };

  async function autoMergeFiles() {
    if (!config.files.length) return;

    for (const file of config.files) {
      mergeBytes[file.name]  = { loaded: 0, total: 0 };
      mergeErrors[file.name] = [];
    }

    updateLoadingDisplay();

    try {
      const promises = config.files.map((file) => {
        const fullPath = config.basePath
          ? `${config.basePath}${file.name}`
          : file.name;

        mergeStatus[file.name] = "merging";
        updateLoadingDisplay();

        return mergeSplitFiles(fullPath, file.parts)
          .then((buffer) => {
            window.mergedFiles[file.name] = buffer;
            window.mergedFiles[fullPath]  = buffer;
            mergeStatus[file.name] = "ready";
            updateLoadingDisplay();
          })
          .catch(() => {
            mergeStatus[file.name] = "failed";
            updateLoadingDisplay();
          });
      });

      await Promise.all(promises);
    } catch (e) {
      console.error("[FileMerger] Unexpected top-level error:", e.message || e);
    }
  }

  function init() {
    if (document.body) {
      initializeUI();
      autoMergeFiles();
    } else if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        initializeUI();
        autoMergeFiles();
      });
    } else {
      setTimeout(init, 10);
    }
  }

  init();
})();