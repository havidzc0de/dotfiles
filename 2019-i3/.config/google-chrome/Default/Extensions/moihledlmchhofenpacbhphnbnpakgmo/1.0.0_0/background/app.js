define(1, function (require, exports, module) {
var VMDB = require(2);
var requests = require(3);
var cache = require(4);
var tabsUtils = require(9);
var scriptUtils = require(7);
var clipboard = require(5);
var _ = require(12);

var vmdb = exports.vmdb = new VMDB;
var VM_VER = chrome.app.getDetails().version;

var autoUpdate = function () {
  function check() {
    checking = true;
    return new Promise(function (resolve, reject) {
      if (!_.options.get('autoUpdate')) return reject();
      if (Date.now() - _.options.get('lastUpdate') >= 864e5)
        resolve(commands.CheckUpdateAll());
    }).then(function () {
      setTimeout(check, 36e5);
    }, function () {
      checking = false;
    });
  }
  var checking;
  return function () {
    checking || check();
  };
}();
var injectOnRun = function () {
  chrome.tabs.query({
    active: true
  }, function (tabs) {
    tabs.forEach(function (tab) {
      chrome.tabs.executeScript(tab.id, {file: 'injected.js'});
    });
  });
};
var commands = {
  NewScript: function (_data, _src) {
    return scriptUtils.newScript();
  },
  RemoveScript: function (id, _src) {
    return vmdb.removeScript(id)
    .then(function () {
      _.messenger.post({
        cmd: 'del',
        data: id,
      });
    });
  },
  GetData: function (_data, _src) {
    return vmdb.getData().then(function (data) {
      data.version = VM_VER;
      return data;
    });
  },
  GetInjected: function (url, src) {
    var data = {
      isApplied: _.options.get('isApplied'),
      injectMode: _.options.get('injectMode'),
      version: VM_VER,
    };
    if (src.url == src.tab.url)
      chrome.tabs.sendMessage(src.tab.id, {cmd: 'GetBadge'});
    return data.isApplied
      ? vmdb.getScriptsByURL(url).then(function (res) {
        return Object.assign(data, res);
      }) : data;
  },
  UpdateScriptInfo: function (data, _src) {
    return vmdb.updateScriptInfo(data.id, data, {
      modified: Date.now(),
    })
    .then(function (script) {
      _.messenger.post({
        cmd: 'update',
        data: script,
      });
    });
  },
  SetValue: function (data, _src) {
    return vmdb.setValue(data.uri, data.values)
    .then(function () {
      tabsUtils.broadcast({
        cmd: 'UpdateValues',
        data: {
          uri: data.uri,
          values: data.values,
        },
      });
    });
  },
  ExportZip: function (data, _src) {
    return vmdb.getExportData(data.ids, data.values);
  },
  GetScript: function (id, _src) {
    return vmdb.getScriptData(id);
  },
  GetMetas: function (ids, _src) {
    return vmdb.getScriptInfos(ids);
  },
  Move: function (data, _src) {
    return vmdb.moveScript(data.id, data.offset);
  },
  ParseScript: function (data, _src) {
    return vmdb.parseScript(data).then(function (res) {
      var meta = res.data.meta;
      if (!meta.grant.length && !_.options.get('ignoreGrant'))
        notify({
          id: 'VM-NoGrantWarning',
          title: _.i18n('Warning'),
          body: _.i18n('msgWarnGrant', [meta.name||_.i18n('labelNoName')]),
          isClickable: true,
        });
      _.messenger.post(res);
      return res.data;
    });
  },
  CheckUpdate: function (id, _src) {
    vmdb.getScript(id).then(vmdb.checkUpdate);
    return false;
  },
  CheckUpdateAll: function (_data, _src) {
    _.options.set('lastUpdate', Date.now());
    vmdb.getScriptsByIndex('update', 1).then(function (scripts) {
      return Promise.all(scripts.map(vmdb.checkUpdate));
    });
    return false;
  },
  ParseMeta: function (code, _src) {
    return scriptUtils.parseMeta(code);
  },
  AutoUpdate: autoUpdate,
  GetRequestId: function (_data, _src) {
    return requests.getRequestId();
  },
  HttpRequest: function (details, src) {
    requests.httpRequest(details, function (res) {
      _.messenger.send(src.tab.id, {
        cmd: 'HttpRequested',
        data: res,
      });
    });
    return false;
  },
  AbortRequest: function (id, _src) {
    return requests.abortRequest(id);
  },
  SetBadge: function (num, src) {
    setBadge(num, src);
    return false;
  },
  GetFromCache: function (data, _src) {
    return cache.get(data) || null;
  },
  Download: function (data) {
      var details = {
          url: data.url
      };
      if (data.name) {
          details.filename = data.name;
      }
      if (typeof data.saveAs === 'boolean') {
          details.saveAs = data.saveAs;
      }
      if (data.headers) {
          var headers = details.headers = [];
          Object.keys(data.headers).forEach(function (key) {
              var value = String(data.headers[key]);
              headers.push({name: key, value: value});
          });
      }
      if (data.saveAs === undefined) {
          data.saveAs = true;
      }
      chrome.downloads.download(details);
      return true;
  },
  Notification: function (data, _src) {
    return new Promise(function (resolve) {
      chrome.notifications.create({
        type: 'basic',
        title: data.title || _.i18n('extName'),
        message: data.text,
        iconUrl: data.image || _.defaultImage,
      }, function (id) {
        resolve(id);
      });
    });
  },
  SetClipboard: function (data, _src) {
    clipboard.set(data);
  },
  OpenTab: function (data, _src) {
    chrome.tabs.create({
      url: data.url,
      active: data.active,
    });
  },
};

vmdb.initialized.then(function () {
  chrome.runtime.onMessage.addListener(function (req, src, callback) {
    var func = commands[req.cmd];
    if (func) {
      var res = func(req.data, src);
      if (res === false) return;
      var finish = function (data) {
        try {
          callback(data);
        } catch (e) {
          // callback fails if not given in content page
        }
      };
      Promise.resolve(res).then(function (data) {
        finish({
          data: data,
          error: null,
        });
      }, function (data) {
        finish({
          error: data,
        });
      });
      return true;
    }
  });
  setTimeout(injectOnRun, 0);
  setTimeout(autoUpdate, 2e4);
});

// Common functions

function notify(options) {
  chrome.notifications.create(options.id || 'MeddleMonkey', {
    type: 'basic',
    iconUrl: _.defaultImage,
    title: options.title + ' - ' + _.i18n('extName'),
    message: options.body,
    isClickable: options.isClickable,
  });
}

var setBadge = function () {
  var badges = {};
  return function (num, src) {
    var o = badges[src.id];
    if (!o) o = badges[src.id] = {num: 0};
    o.num += num;
    chrome.browserAction.setBadgeText({
      text: (o.num || '').toString(),
      tabId: src.tab.id,
    });
    if (o.timer) clearTimeout(o.timer);
    o.timer = setTimeout(function () {
      delete badges[src.id];
    }, 300);
  };
}();

_.messenger = function () {
  var port;
  chrome.runtime.onConnect.addListener(function (_port) {
    port = _port;
    _port.onDisconnect.addListener(function () {
      if (port === _port) port = null;
    });
  });

  return {
    post: function (data) {
      try {
        port && port.postMessage(data);
      } catch (e) {
        port = null;
      }
    },
    send: function (tabId, data) {
      chrome.tabs.sendMessage(tabId, data);
    },
  };
}();

!function (isApplied) {
  chrome.browserAction.setIcon({
    path: {
      19: '/images/icon19' + (isApplied ? '' : 'w') + '.png',
      38: '/images/icon38' + (isApplied ? '' : 'w') + '.png'
    },
  });
}(_.options.get('isApplied'));

chrome.notifications.onClicked.addListener(function (id) {
  if (id == 'VM-NoGrantWarning') {
    tabsUtils.create('http://wiki.greasespot.net/@grant');
  } else {
    tabsUtils.broadcast({
      cmd: 'NotificationClick',
      data: id,
    });
  }
});

chrome.notifications.onClosed.addListener(function (id) {
  tabsUtils.broadcast({
    cmd: 'NotificationClose',
    data: id,
  });
});

});

define(2, function (require, exports, module) {
var scriptUtils = require(7);
var tester = require(10);
var _ = require(12);

function VMDB() {
  var _this = this;
  _this.storage = {
    values: {},
    scripts: {},
    cache: {},
    require: {}
  };
  _this.initialized = _this.initCache();
  _this.checkUpdate = _this.checkUpdate.bind(_this);
}

VMDB.prototype.initCache = function () {
  var _this = this;
  return _this.get(_this.storage).then(function (storage) {
    for (var key in storage) {
      _this.storage[key] = storage[key];
    }
  });
};

VMDB.prototype._saveValues = function () {
  var _this = this;
  return _this.set({
    values: _this.storage.values
  });
};

VMDB.prototype._saveScripts = function () {
  var _this = this;
  return _this.set({
    scripts: _this.storage.scripts
  });
};

VMDB.prototype._saveCache = function () {
  var _this = this;
  return _this.set({
    scripts: _this.storage.scripts
  });
};

VMDB.prototype._saveRequire = function () {
  var _this = this;
  return _this.set({
    scripts: _this.storage.scripts
  });
};

VMDB.prototype.get = function (data) {
  return new Promise(function (resolve) {
    chrome.storage.local.get(data, resolve);
  });
};

VMDB.prototype.set = function (data) {
  return new Promise(function (resolve) {
    chrome.storage.local.set(data, resolve);
  });
};

VMDB.prototype.getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

VMDB.prototype.getScripts = function () {
  var _this = this;
  return Promise.resolve(_this.storage.scripts);
};

VMDB.prototype.getScriptArray = function (ids) {
  var _this = this;
  var scripts = _this.storage.scripts;
  var list = [];
  ids.forEach(function (id) {
    if (scripts.hasOwnProperty(id)) {
      list.push(scripts[id]);
    }
  });
  return Promise.resolve(list);
};

VMDB.prototype.getScript = function (id) {
  var _this = this;
  return Promise.resolve(_this.storage.scripts[id]);
};

VMDB.prototype.queryScript = function (id, meta) {
  var _this = this;
  var scripts = _this.storage.scripts;
  var result;
  if (id) {
    result = scripts[id];
  } else {
    var uri = scriptUtils.getNameURI({meta: meta});
    for (var id in scripts) {
      if (scripts[id].uri === uri) {
        result = scripts[id];
        break;
      }
    }
  }
  return Promise.resolve(result);
};

VMDB.prototype.getScriptData = function (id) {
  var _this = this;
  var script = _this.storage.scripts[id];
  if (!script) {
      return Promise.reject(new Error("Script is empty!"));
  }
  var data = scriptUtils.getScriptInfo(script);
  data.code = script.code;
  return Promise.resolve(data);
};

VMDB.prototype.getScriptInfos = function (ids) {
  var _this = this;
  return _this.getScriptArray(ids).then(function (scripts) {
      return scripts.map(scriptUtils.getScriptInfo);
  });
};

VMDB.prototype.getValues = function (uris) {
  var _this = this;
  var values = _this.storage.values;
  var result = {};
  uris.forEach(function (uri) {
    if (values.hasOwnProperty(uri)) {
      result[uri] = values[uri];
    }
  });
  return Promise.resolve(result);
};

VMDB.prototype.getScriptsByURL = function (url) {
  var _this = this;
  function getScripts() {
    return _this.getScriptsByIndex('position', null).then(function (scripts) {
      var data = {
        uris: [],
      };
      var require = {};
      var cache = {};
      data.scripts = scripts.filter(function (script) {
        if (tester.testURL(url, script)) {
          data.uris.push(script.uri);
          script.meta.require.forEach(function (key) {
            require[key] = 1;
          });
          Object.keys(script.meta.resources).forEach(function (key) {
            cache[script.meta.resources[key]] = 1;
          });
          return true;
        }
      });
      data.require = Object.keys(require);
      data.cache = Object.keys(cache);
      return data;
    });
  }
  function getRequire(uris) {
    var require = _this.storage.require;
    var result = {};
    uris.forEach(function (uri) {
      if (require.hasOwnProperty(uri)) {
        result[uri] = require[uri];
      }
    });
    return result;
  }
  return getScripts().then(function (data) {
    return Promise.all([
      getRequire(data.require),
      _this.getValues(data.uris),
      _this.getCacheB64(data.cache),
    ]).then(function (res) {
      return {
        scripts: data.scripts,
        require: res[0],
        values: res[1],
        cache: res[2],
      };
    });
  });
};

VMDB.prototype.getData = function () {
  function getScripts() {
    return _this.getScriptsByIndex('position', null).then(function (scripts) {
      var data = {};
      var cache = {};
      data.scripts = scripts.map(function (script) {
        var icon = script.meta.icon64 || script.meta.icon;
        if (scriptUtils.isRemote(icon)) cache[icon] = 1;
        return scriptUtils.getScriptInfo(script);
      });
      data.cache = Object.keys(cache);
      return data;
    });
  }
  function getCache(uris) {
    return _this.getCacheB64(uris).then(function (cache) {
      Object.keys(cache).forEach(function (key) {
        cache[key] = 'data:image/png;base64,' + cache[key];
      });
      return cache;
    });
  }
  var _this = this;
  return getScripts().then(function (data) {
    return getCache(data.cache).then(function (cache) {
      return {
        scripts: data.scripts,
        cache: cache,
      };
    });
  });
};

VMDB.prototype.removeScript = function (id) {
  var _this = this;
  var scripts = _this.storage.scripts;
  var values = _this.storage.values;

  if (scripts.hasOwnProperty(id)) {
    var uri = scripts[id].uri;
    delete values[uri];
  }

  delete scripts[id];

  return _this._saveValues().then(function () {
    return _this._saveScripts();
  });
};

VMDB.prototype.moveScript = function (id, offset) {
  var _this = this;
  return _this.getScriptsByIndex('position', null).then(function (scriptArray) {
    var script = null;
    scriptArray.some(function (item) {
      if (item.id === id) {
        script = item;
        return true;
      }
    });
    if (!script) {
      return Promise.reject(new Error("Script is not found!"));
    }
    var pos = scriptArray.indexOf(script);
    var newPos = pos + offset;
    scriptArray.splice(pos, 1);
    scriptArray.splice(newPos, 0, script);
    var scripts = {};
    scriptArray.forEach(function (item, index) {
      item.position = index;
      scripts[item.id] = item;
    });
    return _this._saveScripts();
  });
};

VMDB.prototype.getCacheB64 = function (urls) {
  var _this = this;
  var cache = _this.storage.cache;
  var result = {};
  urls.forEach(function (url) {
    if (cache.hasOwnProperty(url)) {
      result[url] = cache[url];
    }
  });
  return Promise.resolve(result);
};

VMDB.prototype.saveCache = function (url, data) {
  var _this = this;
  _this.storage.cache[url] = data;
  return _this._saveCache();
};

VMDB.prototype.saveRequire = function (url, data) {
  var _this = this;
  _this.storage.require[url] = data;
  return _this._saveRequire();
};

VMDB.prototype.saveScript = function (script) {
  var _this = this;
  script.enabled = script.enabled ? 1 : 0;
  script.update = script.update ? 1 : 0;

  var scripts = _this.storage.scripts;

  if (script.position === undefined) {
    script.position = Object.keys(scripts).length;
  }

  if (!script.id) {
    do {
      script.id = _this.getRandomInt(1, 1000000);
    } while (scripts.hasOwnProperty(script.id));
  }

  scripts[script.id] = script;
  return _this._saveScripts().then(function () {
    return script;
  });
};

VMDB.prototype.fetchCache = function () {
  var requests = {};
  return function (url, check) {
    var _this = this;
    return requests[url]
      || (requests[url] = scriptUtils.fetch(url, 'blob').then(function (res) {
        return (check ? check(res.response) : Promise.resolve()).then(function () {
          return res.response;
        });
      }).then(function (data) {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader;
          reader.onload = function (_e) {
            _this.saveCache(url, window.btoa(this.result)).then(function () {
              delete requests[url];
              resolve();
            });
          };
          reader.onerror = function (e) {
            reject(e);
          };
          reader.readAsBinaryString(data);
        });
      }));
  };
}();

VMDB.prototype.fetchRequire = function () {
  var requests = {};
  return function (url) {
    var _this = this;
    var promise = requests[url];
    if (!promise) {
      promise = requests[url] = scriptUtils.fetch(url)
      .then(function (res) {
        return _this.saveRequire(url, res.responseText);
      })
      .catch(function () {
        console.error('Error fetching required script: ' + url);
      })
      .then(function () {
        delete requests[url];
      });
    }
    return promise;
  };
}();

VMDB.prototype.setValue = function (uri, values) {
  var _this = this;
  _this.storage.values[uri] = values;
  return _this._saveValues();
};

VMDB.prototype.updateScriptInfo = function (id, data, custom) {
  var _this = this;
  var script = _this.storage.scripts[id];
  if (!script) {
    return Promise.reject(new Error("Script is not found!"));
  }
  Object.keys(data).forEach(function (key) {
    if (key in script) {
      script[key] = data[key];
    }
  });
  Object.assign(script.custom, custom);
  return _this._saveScripts().then(function () {
    return scriptUtils.getScriptInfo(script);
  });
};

VMDB.prototype.getExportData = function (ids, withValues) {
  var _this = this;
  function getScripts(ids) {
    var scripts = _this.storage.scripts;
    var result = [];
    ids.forEach(function (id) {
      if (scripts.hasOwnProperty(id)) {
        result.push(scripts[id]);
      }
    });
    return Promise.resolve(result);
  }
  return getScripts(ids).then(function (scripts) {
    var res = {
      scripts: scripts,
    };
    var result;
    if (!withValues) {
      result = res;
    } else {
      result = _this.getValues(scripts.map(function (script) {
        return script.uri;
      })).then(function (values) {
        res.values = values;
        return res;
      });
    }
    return result;
  });
};

VMDB.prototype.getScriptsByIndex = function (index, value) {
  var _this = this;
  var scripts = _this.storage.scripts;
  var result = [];
  var script;
  for (var id in scripts) {
    script = scripts[id];
    if (value === null || script[index] === value) {
      result.push(script);
    }
  }
  result.sort(function (a, b) {
    var aa = a[index];
    var bb = b[index];
    return aa === bb ? 0 : aa < bb ? -1 : 1;
  });
  return Promise.resolve(result);
};

VMDB.prototype.parseScript = function (data) {
  var meta = scriptUtils.parseMeta(data.code);
  if (!meta.name) return Promise.reject(_.i18n('msgInvalidScript'));
  var res = {
    cmd: 'update',
    data: {
      message: data.message == null ? _.i18n('msgUpdated') : data.message || '',
    },
  };
  var _this = this;
  // @require
  meta.require.forEach(function (url) {
    var cache = data.require && data.require[url];
    cache ? _this.saveRequire(url, cache) : _this.fetchRequire(url);
  });
  // @resource
  Object.keys(meta.resources).forEach(function (k) {
    var url = meta.resources[k];
    var cache = data.resources && data.resources[url];
    cache ? _this.saveCache(url, cache) : _this.fetchCache(url);
  });
  // @icon
  var icon = meta.icon64 || meta.icon;
  if (scriptUtils.isRemote(icon))
    _this.fetchCache(icon, function (blob) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(blob);
        var image = new Image;
        var free = function () {
          URL.revokeObjectURL(url);
        };
        image.onload = function () {
          free();
          resolve(blob);
        };
        image.onerror = function () {
          free();
          reject();
        };
        image.src = url;
      });
    });
  return _this.queryScript(data.id, meta).then(function (script) {
    if (script) {
      if (data.isNew) throw _.i18n('msgNamespaceConflict');
    } else {
      script = scriptUtils.newScript();
      res.cmd = 'add';
      res.data.message = _.i18n('msgInstalled');
    }
    data.more && Object.keys(data.more).forEach(function (key) {
      if (key in script) script[key] = data.more[key];
    });
    script.meta = meta;
    script.code = data.code;
    script.uri = scriptUtils.getNameURI(script);
    // use referer page as default homepage
    if (!meta.homepageURL && !script.custom.homepageURL && scriptUtils.isRemote(data.from))
      script.custom.homepageURL = data.from;
    if (scriptUtils.isRemote(data.url))
      script.custom.lastInstallURL = data.url;
    script.custom.modified = data.modified || Date.now();
    return _this.saveScript(script);
  }).then(function (script) {
    Object.assign(res.data, scriptUtils.getScriptInfo(script));
    return res;
  });
};

VMDB.prototype.checkUpdate = function () {
  function check(script) {
    var res = {
      cmd: 'update',
      data: {
        id: script.id,
        checking: true,
      },
    };
    var downloadURL = script.custom.downloadURL || script.meta.downloadURL || script.custom.lastInstallURL;
    var updateURL = script.custom.updateURL || script.meta.updateURL || downloadURL;
    var okHandler = function (xhr) {
      var meta = scriptUtils.parseMeta(xhr.responseText);
      if (scriptUtils.compareVersion(script.meta.version, meta.version) < 0)
        return Promise.resolve();
      res.data.checking = false;
      res.data.message = _.i18n('msgNoUpdate');
      _.messenger.post(res);
      return Promise.reject();
    };
    var errHandler = function (_xhr) {
      res.data.checking = false;
      res.data.message = _.i18n('msgErrorFetchingUpdateInfo');
      _.messenger.post(res);
      return Promise.reject();
    };
    var update = function () {
      if (!downloadURL) {
        res.data.message = '<span class="new">' + _.i18n('msgNewVersion') + '</span>';
        _.messenger.post(res);
        return Promise.reject();
      }
      res.data.message = _.i18n('msgUpdating');
      _.messenger.post(res);
      return scriptUtils.fetch(downloadURL).then(function (xhr) {
        return xhr.responseText;
      }, function (_xhr) {
        res.data.checking = false;
        res.data.message = _.i18n('msgErrorFetchingScript');
        _.messenger.post(res);
        return Promise.reject();
      });
    };
    if (!updateURL) return Promise.reject();
    res.data.message = _.i18n('msgCheckingForUpdate');
    _.messenger.post(res);
    return scriptUtils.fetch(updateURL, null, {
      Accept: 'text/x-userscript-meta',
    }).then(okHandler, errHandler).then(update);
  }

  var processes = {};
  return function (script) {
    var _this = this;
    var promise = processes[script.id];
    if (!promise)
      promise = processes[script.id] = check(script).then(function (code) {
        delete processes[script.id];
        return _this.parseScript({
          id: script.id,
          code: code,
        }).then(function (res) {
          res.data.checking = false;
          _.messenger.post(res);
        });
      }, function () {
        delete processes[script.id];
        //return Promise.reject();
      });
    return promise;
  };
}();

module.exports = VMDB;

});

define(3, function (require, exports, module) {
var tabsUtils = require(9);
var cache = require(4);
var _ = require(12);

var requests = {};
var verify = {};
var special_headers = [
  'user-agent',
  'referer',
  'origin',
  'host',
];
// var tasks = {};

function getRequestId() {
  var id = _.getUniqId();
  requests[id] = {
    id: id,
    xhr: new XMLHttpRequest,
  };
  return id;
}

function xhrCallbackWrapper(req) {
  var lastPromise = Promise.resolve();
  var xhr = req.xhr;
  return function (evt) {
    var res = {
      id: req.id,
      type: evt.type,
      resType: xhr.responseType,
    };
    var data = res.data = {
      finalUrl: req.finalUrl,
      readyState: xhr.readyState,
      responseHeaders: xhr.getAllResponseHeaders(),
      status: xhr.status,
      statusText: xhr.statusText,
    };
    try {
      data.responseText = xhr.responseText;
    } catch (e) {
      // ignore if responseText is unreachable
    }
    if (evt.type === 'loadend') clearRequest(req);
    lastPromise = lastPromise.then(function () {
      return new Promise(function (resolve, _reject) {
        if (xhr.response && xhr.responseType === 'blob') {
          var reader = new FileReader;
          reader.onload = function (_e) {
            data.response = this.result;
            resolve();
          };
          reader.readAsDataURL(xhr.response);
        } else {
          // default `null` for blob and '' for text
          data.response = xhr.response;
          resolve();
        }
      });
    }).then(function () {
      req.cb && req.cb(res);
    });
  };
}

function httpRequest(details, cb) {
  var req = requests[details.id];
  if (!req || req.cb) return;
  req.cb = cb;
  var xhr = req.xhr;
  try {
    xhr.open(details.method, details.url, true, details.user, details.password);
    xhr.setRequestHeader('VM-Verify', details.id);
    details.headers && Object.keys(details.headers).forEach(function (key) {
      xhr.setRequestHeader(
        ~special_headers.indexOf(key.toLowerCase()) ? 'VM-' + key : key,
        details.headers[key]
      );
    });
    if (details.responseType) xhr.responseType = 'blob';
    if (details.overrideMimeType) xhr.overrideMimeType(details.overrideMimeType);
    var callback = xhrCallbackWrapper(req);
    [
      'abort',
      'error',
      'load',
      'loadend',
      'progress',
      'readystatechange',
      'timeout',
    ].forEach(function (evt) {
      xhr['on' + evt] = callback;
    });
    req.finalUrl = details.url;
    xhr.send(details.data);
  } catch (e) {
    console.warn(e);
  }
}

function clearRequest(req) {
  if (req.coreId) delete verify[req.coreId];
  delete requests[req.id];
}

function abortRequest(id) {
  var req = requests[id];
  if (req) {
    req.xhr.abort();
    clearRequest(req);
  }
}

// Watch URL redirects
chrome.webRequest.onBeforeRedirect.addListener(function (details) {
  var reqId = verify[details.requestId];
  if (reqId) {
    var req = requests[reqId];
    if (req) req.finalUrl = details.redirectUrl;
  }
}, {
  urls: ['<all_urls>'],
  types: ['xmlhttprequest'],
});

// Modifications on headers
chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
  var headers = details.requestHeaders;
  var newHeaders = [];
  var vmHeaders = {};
  headers.forEach(function (header) {
    // if (header.name === 'VM-Task') {
    //   tasks[details.requestId] = header.value;
    // } else
    if (header.name.slice(0, 3) === 'VM-') {
      vmHeaders[header.name.slice(3)] = header.value;
    } else {
      newHeaders.push(header);
    }
  });
  var reqId = vmHeaders['Verify'];
  if (reqId) {
    var req = requests[reqId];
    if (req) {
      delete vmHeaders['Verify'];
      verify[details.requestId] = reqId;
      req.coreId = details.requestId;
      Object.keys(vmHeaders).forEach(function (key) {
        ~special_headers.indexOf(key.toLowerCase())
        && newHeaders.push({name: key, value: vmHeaders[key]});
      });
    }
  }
  return {requestHeaders: newHeaders};
}, {
  urls: ['<all_urls>'],
  types: ['xmlhttprequest'],
}, ['blocking', 'requestHeaders']);

// tasks are not necessary now, turned off
// Stop redirects
// chrome.webRequest.onHeadersReceived.addListener(function (details) {
//   var task = tasks[details.requestId];
//   if (task) {
//     delete tasks[details.requestId];
//     if (task === 'Get-Location' && _.includes([301, 302, 303], details.statusCode)) {
//       var locationHeader = details.responseHeaders.find(function (header) {
//         return header.name.toLowerCase() === 'location';
//       });
//       return {
//         redirectUrl: 'data:text/plain;charset=utf-8,' + (locationHeader && locationHeader.value || ''),
//       };
//     }
//   }
// }, {
//   urls: ['<all_urls>'],
//   types: ['xmlhttprequest'],
// }, ['blocking', 'responseHeaders']);
// chrome.webRequest.onCompleted.addListener(function (details) {
//   delete tasks[details.requestId];
// }, {
//   urls: ['<all_urls>'],
//   types: ['xmlhttprequest'],
// });
// chrome.webRequest.onErrorOccurred.addListener(function (details) {
//   delete tasks[details.requestId];
// }, {
//   urls: ['<all_urls>'],
//   types: ['xmlhttprequest'],
// });

chrome.webRequest.onBeforeRequest.addListener(function (req) {
  // onBeforeRequest is fired for local files too
  if (/\.user\.js([\?#]|$)/.test(req.url)) {
    // {cancel: true} will redirect to a blocked view
    var noredirect = {redirectUrl: 'javascript:history.back()'};
    var x = new XMLHttpRequest();
    x.open('GET', req.url, false);
    try {
      x.send();
    } catch (e) {
      // Request is redirected
      return;
    }
    if ((!x.status || x.status == 200) && !/^\s*</.test(x.responseText)) {
      cache.set(req.url, x.responseText);
      var url = chrome.extension.getURL('/options/index.html') + '#confirm/' + encodeURIComponent(req.url);
      if (req.tabId < 0) tabsUtils.create(url);
      else tabsUtils.get(req.tabId).then(function (t) {
        tabsUtils.create(url + '/' + encodeURIComponent(t.url));
      });
      return noredirect;
    }
  }
}, {
  urls: ['<all_urls>'],
  types: ['main_frame'],
}, ['blocking', 'requestBody']);

module.exports = {
  getRequestId: getRequestId,
  abortRequest: abortRequest,
  httpRequest: httpRequest,
};

});

define(4, function (require, exports, module) {
function get(key) {
  var obj = cache[key];
  return obj && obj.value;
}
function set(key, value) {
  if (value) {
    var obj = cache[key];
    if (!obj) obj = cache[key] = {
      key: key,
    };
    obj.value = value;
    if (obj.timer) clearTimeout(obj.timer);
    obj.timer = setTimeout(set, 3000, key);
  } else {
    delete cache[key];
  }
}
var cache = {};
module.exports = {
  get: get,
  set: set,
};

});

define(5, function (require, exports, module) {
var textarea = document.createElement('textarea');
document.body.appendChild(textarea);

var clipboardData = {};
function oncopy(e) {
  e.preventDefault();
  e.clipboardData.setData(clipboardData.type || 'text/plain', clipboardData.data);
}
document.addEventListener('copy', oncopy, false);

exports.set = function (data) {
  clipboardData.type = data.type;
  clipboardData.data = data.data;
  textarea.focus();
  document.execCommand('copy', false, null);
};

});

define(6, function (require, exports, module) {
function getEventEmitter() {
  var events = {};
  return {
    on: on,
    off: off,
    fire: fire,
  };
  function on(type, func) {
    var list = events[type];
    if (!list) list = events[type] = [];
    list.push(func);
  }
  function off(type, func) {
    var list = events[type];
    if (list) {
      var i = list.indexOf(func);
      if (~i) list.splice(i, 1);
    }
  }
  function fire(type, data) {
    var list = events[type];
    list && list.forEach(function (func) {
      func(data, type);
    });
  }
}

exports.getEventEmitter = getEventEmitter;

});

define(7, function (require, exports, module) {
module.exports = {
  isRemote: function (url) {
    return url && !(/^(file|data):/.test(url));
  },
  fetch: function (url, type, headers) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest;
      xhr.open('GET', url, true);
      if (type) xhr.responseType = type;
      headers && Object.keys(headers).forEach(function (key) {
        xhr.setRequestHeader(key, headers[key]);
      });
      xhr.onloadend = function () {
        (xhr.status > 300 ? reject : resolve)(xhr);
      };
      xhr.send();
    });
  },
  parseMeta: function (code) {
    // initialize meta, specify those with multiple values allowed
    var meta = {
      include: [],
      exclude: [],
      match: [],
      require: [],
      resource: [],
      grant: [],
    };
    var flag = -1;
    code.replace(/(?:^|\n)\/\/\s*([@=]\S+)(.*)/g, function (_match, group1, group2) {
      if (flag < 0 && group1 == '==UserScript==') {
        // start meta
        flag = 1;
      } else if (flag > 0 && group1 == '==/UserScript==') {
        // end meta
        flag = 0;
      }
      if (flag == 1 && group1[0] == '@') {
        var key = group1.slice(1);
        var val = group2.replace(/^\s+|\s+$/g, '');
        var value = meta[key];
        // multiple values allowed
        if (value && value.push) value.push(val);
        // only first value will be stored
        else if (!(key in meta)) meta[key] = val;
      }
    });
    meta.resources = {};
    meta.resource.forEach(function (line) {
      var pair = line.match(/^(\w\S*)\s+(.*)/);
      if (pair) meta.resources[pair[1]] = pair[2];
    });
    delete meta.resource;
    // @homepageURL: compatible with @homepage
    if (!meta.homepageURL && meta.homepage) meta.homepageURL = meta.homepage;
    return meta;
  },
  newScript: function () {
    var script = {
      custom: {},
      enabled: 1,
      update: 1,
      code: '// ==UserScript==\n// @name New Script\n// @namespace MeddleMonkey Scripts\n// @grant none\n// ==/UserScript==\n',
    };
    script.meta = module.exports.parseMeta(script.code);
    return script;
  },
  getScriptInfo: function (script) {
    return {
      id: script.id,
      custom: script.custom,
      meta: script.meta,
      enabled: script.enabled,
      update: script.update,
    };
  },
  getNameURI: function (script) {
    var ns = script.meta.namespace || '';
    var name = script.meta.name || '';
    var nameURI = escape(ns) + ':' + escape(name) + ':';
    if (!ns && !name) nameURI += script.id || '';
    return nameURI;
  },
  compareVersion: function (ver1, ver2) {
    ver1 = (ver1 || '').split('.');
    ver2 = (ver2 || '').split('.');
    var len1 = ver1.length, len2 = ver2.length;
    for (var i = 0; i < len1 || i < len2; i ++) {
      var delta = (parseInt(ver1[i], 10) || 0) - (parseInt(ver2[i], 10) || 0);
      if (delta) return delta < 0 ? -1 : 1;
    }
    return 0;
  },
};

});

define(8, function (require, exports, module) {
module.exports = {
  load: function (string) {
    return string.split('&').reduce(function (data, piece) {
      var parts = piece.split('=');
      data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      return data;
    }, {});
  },
  dump: function (dict) {
    return Object.keys(dict).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(dict[key]);
    }).join('&');
  },
};

});

define(9, function (require, exports, module) {
module.exports = {
  create: function (url) {
    chrome.tabs.create({url: url});
  },
  update: function (cb) {
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, _tab) {
      cb({
        id: tabId,
        url: changeInfo.url,
      });
    });
  },
  remove: function (id) {
    chrome.tabs.remove(id);
  },
  get: function (id) {
    return new Promise(function (resolve, _reject) {
      chrome.tabs.get(id, function (tab) {
        resolve(tab);
      });
    });
  },
  broadcast: function (data) {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(tab.id, data);
      });
    });
  },
};

});

define(10, function (require, exports, module) {
function testURL(url, script) {
  var custom = script.custom;
  var meta = script.meta;
  var inc = [], exc = [], mat = [];
  if (custom._match !== false && meta.match) mat = mat.concat(meta.match);
  if (custom.match) mat = mat.concat(custom.match);
  if (custom._include !== false && meta.include) inc = inc.concat(meta.include);
  if (custom.include) inc = inc.concat(custom.include);
  if (custom._exclude !== false && meta.exclude) exc = exc.concat(meta.exclude);
  if (custom.exclude) exc = exc.concat(custom.exclude);
  var ok = !mat.length && !inc.length;
  // @match
  ok = ok || mat.length && function (test) {
    return mat.some(test);
  }(matchTester(url));
  // @include
  ok = ok || inc.some(function (str) {
    return autoReg(str).test(url);
  });
  // exclude
  ok = ok && !exc.some(function (str) {
    return autoReg(str).test(url);
  });
  return ok;
}

function str2RE(str) {
  return RegExp('^' + str.replace(/([.?\/])/g, '\\$1').replace(/\*/g, '.*?') + '$');
}

function autoReg(str) {
  if (/^\/.*\/$/.test(str))
    return RegExp(str.slice(1, -1));  // Regular-expression
  else
    return str2RE(str); // String with wildcards
}

function matchTester(url) {
  function matchScheme(rule, data) {
    // exact match
    if (rule == data) return 1;
    // * = http | https
    if (rule == '*' && /^https?$/i.test(data)) return 1;
    return 0;
  }
  function matchHost(rule, data) {
    // * matches all
    if (rule == '*') return 1;
    // exact match
    if (rule == data) return 1;
    // *.example.com
    if (/^\*\.[^*]*$/.test(rule)) {
      // matches the specified domain
      if (rule.slice(2) == data) return 1;
      // matches subdomains
      if (str2RE(rule).test(data)) return 1;
    }
    return 0;
  }
  function matchPath(rule, data) {
    return str2RE(rule).test(data);
  }
  var RE = /(.*?):\/\/([^\/]*)\/(.*)/;
  var urlParts = url.match(RE);
  return function (str) {
    if (str == '<all_urls>') return true;
    var parts = str.match(RE);
    return !!parts
      && matchScheme(parts[1], urlParts[1])
      && matchHost(parts[2], urlParts[2])
      && matchPath(parts[3], urlParts[3]);
  };
}

exports.testURL = testURL;

});

define.use([1]);
