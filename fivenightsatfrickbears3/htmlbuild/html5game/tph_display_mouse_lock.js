// --- FIX FOR GAMEMAKER HTML5 BLOB URLS ---
// GameMaker's sprite_add automatically prepends `_savedata/` to any URL that doesn't start with http:// or https://.
// This breaks blob: URLs. We intercept the Image src setter to strip this prefix.
(function() {
    // 1. Intercept Image src
    var originalImgSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (originalImgSrc && originalImgSrc.set) {
        Object.defineProperty(HTMLImageElement.prototype, 'src', {
            set: function(val) {
                if (typeof val === 'string') {
                    if (val.indexOf('_savedata/blob:') !== -1) {
                        val = val.replace('_savedata/blob:', 'blob:');
                    } else if (val.indexOf('http://_BLOB_') !== -1) {
                        val = val.replace('http://_BLOB_', '');
                    }
                }
                originalImgSrc.set.call(this, val);
            },
            get: function() {
                return originalImgSrc.get.call(this);
            }
        });
    }

    // 2. Intercept Audio/Video src
    var originalMediaSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (originalMediaSrc && originalMediaSrc.set) {
        Object.defineProperty(HTMLMediaElement.prototype, 'src', {
            set: function(val) {
                if (typeof val === 'string') {
                    if (val.indexOf('_savedata/blob:') !== -1) {
                        val = val.replace('_savedata/blob:', 'blob:');
                    } else if (val.indexOf('http://_BLOB_') !== -1) {
                        val = val.replace('http://_BLOB_', '');
                    }
                }
                originalMediaSrc.set.call(this, val);
            },
            get: function() {
                return originalMediaSrc.get.call(this);
            }
        });
    }

    // 3. Intercept XMLHttpRequest.open (used by GM's audio_create_stream and other loaders)
    var originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string') {
            if (url.indexOf('_savedata/blob:') !== -1) {
                url = url.replace('_savedata/blob:', 'blob:');
            } else if (url.indexOf('http://_BLOB_') !== -1) {
                url = url.replace('http://_BLOB_', '');
            }
        }
        var args = Array.prototype.slice.call(arguments);
        args[1] = url;
        return originalXhrOpen.apply(this, args);
    };
})();

function display_mouse_lock(x, y, w, h) {
    return 0;
}

function display_mouse_unlock() {
    return 0;
}

function display_mouse_lock_init_raw(handle) {
    return 0;
}

function display_mouse_bounds_raw(address) {
    return 0;
}

function web_storage_set(key, value) {
    localStorage.setItem(key, value);
    return 1;
}

function web_storage_get(key) {
    var val = localStorage.getItem(key);
    return val === null ? "" : val;
}

function web_storage_exists(key) {
    return localStorage.getItem(key) !== null ? 1 : 0;
}

var _import_status = 0;
var _import_content = "";

function web_storage_export(filename, content) {
    var blob = new Blob([content], {type: 'text/plain'});
    var elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;        
    document.body.appendChild(elem);
    elem.click();        
    document.body.removeChild(elem);
    return 1;
}

function web_storage_import_start() {
    _import_status = 0;
    _import_content = "";
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => { 
        var file = e.target.files[0]; 
        var reader = new FileReader();
        reader.readAsText(file,'UTF-8');
        reader.onload = readerEvent => {
            _import_content = readerEvent.target.result;
            _import_status = 1;
        }
        reader.onerror = () => {
            _import_status = -1;
        }
    }
    input.click();
    return 1;
}

function web_storage_import_get_status() {
    return _import_status;
}

function web_storage_import_get_content() {
    return _import_content;
}


// --- MOD LOADER SYSTEM (IndexedDB) ---

var _mod_upload_status = 0;
var _mod_upload_name = "";
var _mod_upload_error = "";
var _mod_blob_urls = {};
var _mod_db = null;
var _mod_preload_status = 0;

function _mod_db_init() {
    return new Promise((resolve, reject) => {
        if (_mod_db) return resolve(_mod_db);
        var request = indexedDB.open("FrickbearsModDB", 1);
        request.onupgradeneeded = e => {
            var db = e.target.result;
            if (!db.objectStoreNames.contains("assets")) {
                db.createObjectStore("assets");
            }
        };
        request.onsuccess = e => {
            _mod_db = e.target.result;
            resolve(_mod_db);
        };
        request.onerror = e => reject(e);
    });
}

function _mod_db_save(key, data) {
    return _mod_db_init().then(db => {
        return new Promise((resolve, reject) => {
            var tx = db.transaction("assets", "readwrite");
            var store = tx.objectStore("assets");
            store.put(data, key);
            tx.oncomplete = () => resolve();
            tx.onerror = e => reject(e);
        });
    });
}

function _mod_db_load(key) {
    return _mod_db_init().then(db => {
        return new Promise((resolve, reject) => {
            var tx = db.transaction("assets", "readonly");
            var store = tx.objectStore("assets");
            var request = store.get(key);
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e);
        });
    });
}

function _mod_db_delete_prefix(prefix) {
    return _mod_db_init().then(db => {
        return new Promise((resolve, reject) => {
            var tx = db.transaction("assets", "readwrite");
            var store = tx.objectStore("assets");
            var request = store.openKeyCursor(IDBKeyRange.bound(prefix, prefix + "\uffff"));
            request.onsuccess = e => {
                var cursor = e.target.result;
                if (cursor) {
                    store.delete(cursor.key);
                    cursor.continue();
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = e => reject(e);
        });
    });
}

function _zip_read_uint16(data, offset) {
    return data[offset] | (data[offset + 1] << 8);
}

function _zip_read_uint32(data, offset) {
    return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
}

function _zip_inflate(compressed) {
    try {
        var ds = new DecompressionStream("deflate-raw");
        var blob = new Blob([compressed]);
        var stream = blob.stream().pipeThrough(ds);
        return new Response(stream).arrayBuffer().then(buf => new Uint8Array(buf));
    } catch(e) {
        return Promise.reject(e);
    }
}

function _zip_extract(arrayBuffer) {
    return new Promise((resolve, reject) => {
        var data = new Uint8Array(arrayBuffer);
        var files = {};
        var eocdOffset = -1;
        for (var i = data.length - 22; i >= 0; i--) {
            if (_zip_read_uint32(data, i) === 0x06054b50) {
                eocdOffset = i;
                break;
            }
        }
        if (eocdOffset < 0) return reject("Not a valid ZIP file");
        
        var cdOffset = _zip_read_uint32(data, eocdOffset + 16);
        var cdEntries = _zip_read_uint16(data, eocdOffset + 10);
        var entries = [];
        var pos = cdOffset;
        for (var e = 0; e < cdEntries; e++) {
            if (_zip_read_uint32(data, pos) !== 0x02014b50) break;
            var comprMethod = _zip_read_uint16(data, pos + 10);
            var compSize = _zip_read_uint32(data, pos + 20);
            var uncompSize = _zip_read_uint32(data, pos + 24);
            var fnLen = _zip_read_uint16(data, pos + 28);
            var extraLen = _zip_read_uint16(data, pos + 30);
            var commentLen = _zip_read_uint16(data, pos + 32);
            var localOffset = _zip_read_uint32(data, pos + 42);
            var fnBytes = data.slice(pos + 46, pos + 46 + fnLen);
            var fileName = new TextDecoder().decode(fnBytes);
            entries.push({
                fileName: fileName,
                comprMethod: comprMethod,
                compSize: compSize,
                uncompSize: uncompSize,
                localOffset: localOffset
            });
            pos += 46 + fnLen + extraLen + commentLen;
        }
        
        var promises = entries.filter(e => !e.fileName.endsWith("/")).map(entry => {
            var lh = entry.localOffset;
            if (_zip_read_uint32(data, lh) !== 0x04034b50) return Promise.resolve();
            var lhFnLen = _zip_read_uint16(data, lh + 26);
            var lhExtraLen = _zip_read_uint16(data, lh + 28);
            var dataStart = lh + 30 + lhFnLen + lhExtraLen;
            var rawData = data.slice(dataStart, dataStart + entry.compSize);
            
            if (entry.comprMethod === 0) {
                files[entry.fileName] = rawData;
                return Promise.resolve();
            } else if (entry.comprMethod === 8) {
                return _zip_inflate(rawData).then(inflated => {
                    files[entry.fileName] = inflated;
                });
            }
            return Promise.resolve();
        });
        
        Promise.all(promises).then(() => resolve(files)).catch(reject);
    });
}

function _detect_inner_folder(files) {
    var keys = Object.keys(files);
    for (var k = 0; k < keys.length; k++) {
        var path = keys[k];
        if (path.endsWith("portrait.png") || path.endsWith("selection.png") || path.endsWith("extras_info.txt")) {
            var slashIdx = path.lastIndexOf("/");
            return slashIdx >= 0 ? path.substring(0, slashIdx) : "";
        }
    }
    return "";
}

function _get_mime_type(filename) {
    var lower = filename.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".ogg")) return "audio/ogg";
    if (lower.endsWith(".wav")) return "audio/wav";
    if (lower.endsWith(".mp3")) return "audio/mpeg";
    if (lower.endsWith(".txt") || lower.endsWith(".json")) return "text/plain";
    return "application/octet-stream";
}

function mod_upload_start() {
    _mod_upload_status = 0;
    _mod_upload_name = "";
    _mod_upload_error = "";
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.onchange = e => {
        var file = e.target.files[0];
        if (!file) {
            _mod_upload_status = -1;
            _mod_upload_error = "No file selected";
            return;
        }
        var zipFileName = file.name.replace(/\.[^/.]+$/, "");
        var reader = new FileReader();
        reader.onload = ev => {
            _zip_extract(ev.target.result).then(files => {
                var innerFolder = _detect_inner_folder(files);
                var modName = innerFolder || zipFileName;
                
                var manifest = [];
                var savePromises = [];
                Object.keys(files).forEach(fullPath => {
                    var fileData = files[fullPath];
                    var isText = fullPath.endsWith(".txt") || fullPath.endsWith(".json");
                    var storageKey = "mod_" + modName + "_" + fullPath;
                    
                    if (isText) {
                        localStorage.setItem(storageKey, new TextDecoder().decode(fileData));
                    } else {
                        savePromises.push(_mod_db_save(storageKey, fileData));
                    }
                    manifest.push(fullPath);
                });
                
                Promise.all(savePromises).then(() => {
                    var manifestObj = {
                        name: modName,
                        innerFolder: innerFolder,
                        files: manifest
                    };
                    console.log("[DEBUG] Mod extracted successfully. Manifest:", manifestObj);
                    localStorage.setItem("mod_manifest_" + modName, JSON.stringify(manifestObj));
                    var customList = JSON.parse(localStorage.getItem("custom_mod_list") || "[]");
                    if (customList.indexOf(modName) < 0) customList.push(modName);
                    localStorage.setItem("custom_mod_list", JSON.stringify(customList));
                    
                    _mod_upload_name = modName;
                    _mod_upload_status = 1;
                }).catch(err => {
                    _mod_upload_status = -1;
                    _mod_upload_error = "IDB Error: " + err;
                });
            }).catch(err => {
                _mod_upload_status = -1;
                _mod_upload_error = String(err);
            });
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
    return 1;
}

function mod_upload_get_status() { return _mod_upload_status; }
function mod_upload_get_name() { return _mod_upload_name; }
function mod_upload_get_error() { return _mod_upload_error; }
function mod_custom_list() { return localStorage.getItem("custom_mod_list") || "[]"; }
function mod_custom_exists(modName) { return localStorage.getItem("mod_manifest_" + modName) ? 1 : 0; }

function mod_custom_remove(modName) {
    var manifestStr = localStorage.getItem("mod_manifest_" + modName);
    if (manifestStr) {
        var manifest = JSON.parse(manifestStr);
        (manifest.files || []).forEach(f => {
            localStorage.removeItem("mod_" + modName + "_" + f);
        });
        _mod_db_delete_prefix("mod_" + modName + "_");
        localStorage.removeItem("mod_manifest_" + modName);
    }
    var customList = JSON.parse(localStorage.getItem("custom_mod_list") || "[]");
    var idx = customList.indexOf(modName);
    if (idx >= 0) customList.splice(idx, 1);
    localStorage.setItem("custom_mod_list", JSON.stringify(customList));
    return 1;
}

function mod_custom_has_asset(modName, assetPath) {
    var cacheKey = modName + "/" + assetPath;
    if (_mod_blob_urls[cacheKey]) return 1;
    var key = "mod_" + modName + "_" + assetPath;
    return localStorage.getItem(key) !== null ? 1 : 0; // Checks manifest/text storage
}

function mod_custom_get_text(modName, assetPath) {
    return localStorage.getItem("mod_" + modName + "_" + assetPath) || "";
}

function mod_custom_get_inner_folder(modName) {
    var manifestStr = localStorage.getItem("mod_manifest_" + modName);
    if (!manifestStr) return "";
    try { return JSON.parse(manifestStr).innerFolder || ""; } catch(e) { return ""; }
}

function mod_custom_get_blob_url(modName, assetPath) {
    var cacheKey = modName + "/" + assetPath;
    var url = _mod_blob_urls[cacheKey] || "";
    if (url !== "") {
        return "http://_BLOB_" + url;
    }
    return "";
}

function mod_custom_get_manifest_json(modName) {
    return localStorage.getItem("mod_manifest_" + modName) || "";
}

function mod_preload_start(modName) {
    _mod_preload_status = 0;
    var manifestStr = localStorage.getItem("mod_manifest_" + modName);
    if (!manifestStr) { _mod_preload_status = 1; return 1; }
    
    var manifest = JSON.parse(manifestStr);
    var files = manifest.files || [];
    var promises = files.filter(f => !f.endsWith(".txt") && !f.endsWith(".json")).map(f => {
        var storageKey = "mod_" + modName + "_" + f;
        return _mod_db_load(storageKey).then(data => {
            if (data) {
                var mime = _get_mime_type(f);
                var url = URL.createObjectURL(new Blob([data], {type: mime}));
                _mod_blob_urls[modName + "/" + f] = url;
            }
        });
    });
    
    Promise.all(promises).then(() => { _mod_preload_status = 1; }).catch(() => { _mod_preload_status = -1; });
    return 1;
}

function mod_preload_get_status() {
    return _mod_preload_status;
}
