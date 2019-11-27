define(13, function (require, exports, module) {
function initMain() {
  store.loading = true;
  _.sendMessage({cmd: 'GetData'})
  .then(function (data) {
    [
      'cache',
      'scripts',
      'sync',
    ].forEach(function (key) {
      Vue.set(store, key, data[key]);
    });
    store.loading = false;
    // utils.features.reset(data.version);
    utils.features.reset('sync');
  });
  var port = chrome.runtime.connect({name: 'Options'});
  var handlers = {
    sync: function (data) {
      store.sync = data;
    },
    add: function (data) {
      data.message = '';
      store.scripts.push(data);
    },
    update: function (data) {
      if (!data) return;
      var script = store.scripts.find(function (script) {
        return script.id === data.id;
      });
      script && Object.keys(data).forEach(function (key) {
        Vue.set(script, key, data[key]);
      });
    },
    del: function (data) {
      var i = store.scripts.findIndex(function (script) {
        return script.id === data;
      });
      if (~i) {
        store.scripts.splice(i, 1);
        var scripts = store.scripts.slice(0);
        store.scripts = [];
        setTimeout(function () {
          store.scripts = scripts;
        });
      }
    },
  };
  port.onMessage.addListener(function (res) {
    var handle = handlers[res.cmd];
    handle && handle(res.data);
  });
}
function loadHash() {
  var hash = location.hash.slice(1);
  Object.keys(routes).find(function (key) {
    var test = routes[key];
    var params = test(hash);
    if (params) {
      hashData.type = key;
      hashData.params = params;
      if (init[key]) {
        init[key]();
        init[key] = null;
      }
      return true;
    }
  });
}

var _ = require(12);
var utils = require(16);
var Main = require(21);
var Confirm = require(18);

var store = Object.assign(utils.store, {
  loading: false,
  cache: {},
  scripts: [],
  sync: [],
});
var init = {
  Main: initMain,
};
var routes = {
  Main: utils.routeTester([
    '',
    'main/:tab',
  ]),
  Confirm: utils.routeTester([
    'confirm/:url',
    'confirm/:url/:referer',
  ]),
};
var hashData = {
  type: null,
  params: null,
};
window.addEventListener('hashchange', loadHash, false);
loadHash();
zip.workerScriptsPath = '/lib/zip.js/';
document.title = _.i18n('extName');

new Vue({
  el: '#app',
  template: '<component :is=type :params=params></component>',
  components: {
    Main: Main,
    Confirm: Confirm,
  },
  data: hashData,
});

});

define(14, function (require, exports, module) {
Vue.directive('dropdown', {
  bind: function (el) {
    function onClose(e) {
      if (e && el.contains(e.target)) return;
      isOpen = false;
      el.classList.remove('open');
      document.removeEventListener('mousedown', onClose, false);
    }
    function onOpen(_e) {
      isOpen = true;
      el.classList.add('open');
      document.addEventListener('mousedown', onClose, false);
    }
    function onToggle(_e) {
      isOpen ? onClose() : onOpen();
    }
    var toggle = el.querySelector('[dropdown-toggle]');
    var isOpen = false;
    toggle.addEventListener('click', onToggle, false);
    el.classList.add('dropdown');
  },
});

});

define(15, function (require, exports, module) {
var _ = require(12);

var key = 'features';
var features = _.options.get(key);
if (!features || !features.data) features = {
  data: {},
};

exports.reset = function (version) {
  if (features.version !== version) {
    _.options.set(key, features = {
      version: version,
      data: {},
    });
  }
};

Vue.directive('feature', {
  bind: function (el, binding) {
    function onFeatureClick(_e) {
      features.data[value] = 1;
      _.options.set(key, features);
      el.classList.remove('feature');
      el.removeEventListener('click', onFeatureClick, false);
    }
    var value = binding.value;
    if (features.data[value]) return;
    el.classList.add('feature');
    el.addEventListener('click', onFeatureClick, false);
  },
});

});

define(16, function (require, exports, module) {
function routeTester(paths) {
  var routes = paths.map(function (path) {
    var names = [];
    path = path.replace(/:(\w+)/g, function (_param, name) {
      names.push(name);
      return '([^/]+)';
    });
    return {
      re: new RegExp('^' + path + '$'),
      names: names,
    };
  });
  return function (url) {
    var length = routes.length;
    for (var i = 0; i < length; i ++) {
      var route = routes[i];
      var matches = url.match(route.re);
      if (matches) {
        return route.names.reduce(function (params, name, i) {
          params[name] = decodeURIComponent(matches[i + 1]);
          return params;
        }, {});
      }
    }
  };
}

exports.routeTester = routeTester;
exports.store = {};
exports.features = require(15);

require(14);
require(17);

});

define(17, function (require, exports, module) {
var _ = require(12);

var hooks = {};
_.options.hook(function (value, key) {
  var list = hooks[key];
  list && list.forEach(function (el) {
    el.checked = value;
  });
});

function onSettingChange(e) {
  var target = e.target;
  _.options.set(target.dataset.setting, target.checked);
}

Vue.directive('setting', {
  bind: function (el, binding) {
    var value = binding.value;
    el.dataset.setting = value;
    el.addEventListener('change', onSettingChange, false);
    var list = hooks[value] = hooks[value] || [];
    list.push(el);
    el.checked = _.options.get(value);
  },
  unbind: function (el, binding) {
    var value = binding.value;
    el.removeEventListener('change', onSettingChange, false);
    var list = hooks[value] || [];
    var i = list.indexOf(el);
    ~i && list.splice(i, 1);
  },
});

});

define(18, function (require, exports, module) {
var Editor = require(20);
var cache = require(11);
var _ = require(12);

module.exports = {
  props: ['params'],
  components: {
    Editor: Editor,
  },
  template: cache.get(1),
  data: function () {
    return {
      installable: false,
      dependencyOK: false,
      message: '',
      code: '',
      require: {},
      resources: {},
      closeAfterInstall: _.options.get('closeAfterInstall'),
    };
  },
  computed: {
    isLocal: function () {
      return /^file:\/\/\//.test(this.params.url);
    },
  },
  mounted: function () {
    var _this = this;
    _this.message = _.i18n('msgLoadingData');
    _this.loadData().then(function () {
      _this.parseMeta();
    });
    _this.revoke = _.options.hook('closeAfterInstall', function (value) {
      _this.closeAfterInstall = value;
    });
  },
  beforeDestroy: function () {
    this.revoke();
  },
  methods: {
    loadData: function (changedOnly) {
      var _this = this;
      _this.installable = false;
      var oldCode = _this.code;
      return _this.getScript(_this.params.url)
      .then(function (code) {
        if (changedOnly && oldCode === code) return Promise.reject();
        _this.code = code;
      });
    },
    parseMeta: function () {
      var _this = this;
      return _.sendMessage({
        cmd: 'ParseMeta',
        data: _this.code,
      })
      .then(function (script) {
        var urls = Object.keys(script.resources).map(function (key) {
          return script.resources[key];
        });
        var length = script.require.length + urls.length;
        if (!length) return;
        var finished = 0;
        var error = [];
        var updateStatus = function () {
          _this.message = _.i18n('msgLoadingDependency', [finished, length]);
        };
        updateStatus();
        var promises = script.require.map(function (url) {
          return _this.getFile(url).then(function (res) {
            _this.require[url] = res;
          });
        });
        promises = promises.concat(urls.map(function (url) {
          return _this.getFile(url, true).then(function (res) {
            _this.resources[url] = res;
          });
        }));
        promises = promises.map(function (promise) {
          return promise.then(function () {
            finished += 1;
            updateStatus();
          }, function (url) {
            error.push(url);
          });
        });
        return Promise.all(promises).then(function () {
          if (error.length) return Promise.reject(error.join('\n'));
          _this.dependencyOK = true;
        });
      })
      .then(function () {
        _this.message = _.i18n('msgLoadedData');
        _this.installable = true;
      }, function (err) {
        _this.message = _.i18n('msgErrorLoadingDependency', [err]);
        return Promise.reject();
      });
    },
    close: function () {
      window.close();
    },
    getFile: function (url, isBlob) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest;
        xhr.open('GET', url, true);
        if (isBlob) xhr.responseType = 'blob';
        xhr.onloadend = function () {
          if (xhr.status > 300) return reject(url);
          if (isBlob) {
            var reader = new FileReader;
            reader.onload = function () {
              resolve(window.btoa(this.result));
            };
            reader.readAsBinaryString(xhr.response);
          } else {
            resolve(xhr.responseText);
          }
        };
        xhr.send();
      });
    },
    getScript: function (url) {
      var _this = this;
      return _.sendMessage({
        cmd: 'GetFromCache',
        data: url,
      })
      .then(function (text) {
        return text || Promise.reject();
      })
      .catch(function () {
        return _this.getFile(url);
      })
      .catch(function (url) {
        _this.message = _.i18n('msgErrorLoadingData');
        throw url;
      });
    },
    getTimeString: function () {
      var now = new Date;
      return _.zfill(now.getHours(), 2) + ':' +
        _.zfill(now.getMinutes(), 2) + ':' +
        _.zfill(now.getSeconds(), 2);
    },
    installScript: function () {
      var _this = this;
      _this.installable = false;
      _.sendMessage({
        cmd:'ParseScript',
        data:{
          url: _this.params.url,
          from: _this.params.referer,
          code: _this.code,
          require: _this.require,
          resources: _this.resources,
        },
      })
      .then(function (res) {
        _this.message = res.message + '[' + _this.getTimeString() + ']';
        if (res.code < 0) return;
        if (_.options.get('closeAfterInstall')) _this.close();
        else if (_this.isLocal && _.options.get('trackLocalFile')) _this.trackLocalFile();
      });
    },
    trackLocalFile: function () {
      var _this = this;
      new Promise(function (resolve) {
        setTimeout(resolve, 2000);
      })
      .then(function () {
        return _this.loadData(true).then(function () {
          return _this.parseMeta();
        });
      })
      .then(function () {
        var track = _.options.get('trackLocalFile');
        track && _this.installScript();
      }, function () {
        _this.trackLocalFile();
      });
    },
    checkClose: function (e) {
      e.target.checked && _.options.set('trackLocalFile', false);
    },
  },
};

});

define(19, function (require, exports, module) {
function fromList(list) {
  return (list || []).join('\n');
}
function toList(text) {
  return text.split('\n')
  .map(function (line) {
    return line.trim();
  })
  .filter(function (item) {
    return item;
  });
}

var Message = require(22);
var Editor = require(20);
var cache = require(11);
var _ = require(12);

module.exports = {
  props: ['script'],
  template: cache.get(2),
  components: {
    Editor: Editor,
  },
  data: function () {
    return {
      canSave: false,
      update: false,
      code: '',
      custom: {},
    };
  },
  computed: {
    placeholders: function () {
      var script = this.script;
      return {
        name: script.meta.name,
        homepageURL: script.meta.homepageURL,
        updateURL: script.meta.updateURL || _.i18n('hintUseDownloadURL'),
        downloadURL: script.meta.downloadURL || script.lastInstallURL,
      };
    },
  },
  watch: {
    custom: {
      deep: true,
      handler: function () {
        this.canSave = true;
      },
    },
  },
  mounted: function () {
    var _this = this;
    (_this.script.id ? _.sendMessage({
      cmd: 'GetScript',
      data: _this.script.id,
    }) : Promise.resolve(_this.script))
    .then(function (script) {
      _this.update = script.update;
      _this.code = script.code;
      var custom = script.custom;
      _this.custom = [
        'name',
        'homepageURL',
        'updateURL',
        'downloadURL',
      ].reduce(function (value, key) {
        value[key] = custom[key];
        return value;
      }, {
        keepInclude: custom._include !== false,
        keepMatch: custom._match !== false,
        keepExclude: custom._exclude !== false,
        include: fromList(custom.include),
        match: fromList(custom.match),
        exclude: fromList(custom.exclude),
        'run-at': custom['run-at'] || '',
      });
      _this.$nextTick(function () {
        _this.canSave = false;
      });
    });
  },
  methods: {
    save: function () {
      var _this = this;
      var custom = _this.custom;
      var value = [
        'name',
        'run-at',
        'homepageURL',
        'updateURL',
        'downloadURL',
      ].reduce(function (value, key) {
        value[key] = custom[key];
        return value;
      }, {
        _include: custom.keepInclude,
        _match: custom.keepMatch,
        _exclude: custom.keepExclude,
        include: toList(custom.include),
        match: toList(custom.match),
        exclude: toList(custom.exclude),
      });
      return _.sendMessage({
        cmd: 'ParseScript',
        data: {
          id: _this.script.id,
          code: _this.code,
          // User created scripts MUST be marked `isNew` so that
          // the backend is able to check namespace conflicts
          isNew: !_this.script.id,
          message: '',
          more: {
            custom: value,
            update: _this.update,
          },
        },
      })
      .then(function (script) {
        _this.script = script;
        _this.canSave = false;
      }, function (err) {
        Message.open({text: err});
      });
    },
    close: function () {
      var _this = this;
      if (!_this.canSave || confirm(_.i18n('confirmNotSaved'))) {
        _this.$emit('close');
      }
    },
    saveClose: function () {
      var _this = this;
      _this.save().then(function () {
        _this.close();
      });
    },
    contentChange: function (code) {
      var _this = this;
      _this.code = code;
      _this.canSave = true;
    },
  },
};

});

define(20, function (require, exports, module) {
function addScripts(data) {
  function add(data) {
    var s = document.createElement('script');
    if (data.innerHTML) s.innerHTML = data.innerHTML;
    else if (data.src) s.src = data.src;
    return new Promise(function (resolve, reject) {
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject();
      };
      document.body.appendChild(s);
    });
  }
  if (!data.map) data = [data];
  return Promise.all(data.map(add));
}

function addCSS(data) {
  function add(data) {
    var s;
    if (data.html) {
      s = document.createElement('style');
      s.innerHTML = data.html;
    } else if (data.href) {
      s = document.createElement('link');
      s.rel = 'stylesheet';
      s.href = data.href;
    }
    if (s) document.body.appendChild(s);
  }
  if (!data.forEach) data = [data];
  data.forEach(add);
}

function initCodeMirror() {
  addCSS([
    {href: '/lib/CodeMirror/lib/codemirror.css'},
    {href: '/mylib/CodeMirror/fold.css'},
    {href: '/mylib/CodeMirror/search.css'},
  ]);
  return addScripts(
    {src: '/lib/CodeMirror/lib/codemirror.js'}
  ).then(function () {
    return addScripts([
      {src: '/lib/CodeMirror/mode/javascript/javascript.js'},
      {src: '/lib/CodeMirror/addon/comment/continuecomment.js'},
      {src: '/lib/CodeMirror/addon/edit/matchbrackets.js'},
      {src: '/lib/CodeMirror/addon/edit/closebrackets.js'},
      {src: '/lib/CodeMirror/addon/fold/foldcode.js'},
      {src: '/lib/CodeMirror/addon/fold/foldgutter.js'},
      {src: '/lib/CodeMirror/addon/fold/brace-fold.js'},
      {src: '/lib/CodeMirror/addon/fold/comment-fold.js'},
      {src: '/lib/CodeMirror/addon/search/match-highlighter.js'},
      {src: '/lib/CodeMirror/addon/search/searchcursor.js'},
      {src: '/lib/CodeMirror/addon/selection/active-line.js'},
      {src: '/mylib/CodeMirror/search.js'},
    ]);
  });
}

var cache = require(11);
var readyCodeMirror = initCodeMirror();

module.exports = {
  props: [
    'readonly',
    'onExit',
    'onSave',
    'onChange',
    'content',
  ],
  template: cache.get(3),
  mounted: function () {
    var _this = this;
    readyCodeMirror.then(function () {
      var editor = _this.editor = CodeMirror(_this.$el, {
        continueComments: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        highlightSelectionMatches: true,
        lineNumbers: true,
        mode: 'javascript',
        lineWrapping: true,
        styleActiveLine: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      });
      _this.readonly && editor.setOption('readOnly', _this.readonly);
      editor.on('change', function () {
        _this.cachedContent = editor.getValue();
        _this.onChange && _this.onChange(_this.cachedContent);
      });
      editor.on('drop', function () {
        editor.setValue('');
      });
      var extraKeys = {};
      if (_this.onExit) {
        extraKeys.Esc = _this.onExit;
      }
      if (_this.onSave) {
        extraKeys['Ctrl-S'] = extraKeys['Cmd-S'] = _this.onSave;
      }
      editor.setOption('extraKeys', extraKeys);
      _this.update();
    });
  },
  watch: {
    content: function (content) {
      var _this = this;
      if (content !== _this.cachedContent) {
        _this.cachedContent = content;
        _this.update();
      }
    },
  },
  methods: {
    update: function () {
      var _this = this;
      if (!_this.editor || _this.cachedContent == null) return;
      _this.editor.setValue(_this.cachedContent);
      _this.editor.getDoc().clearHistory();
      _this.editor.focus();
    },
  },
};

});

define(21, function (require, exports, module) {
var MainTab = require(25);
var SettingsTab = require(26);
var AboutTab = require(24);
var cache = require(11);

var components = {
  Main: MainTab,
  Settings: SettingsTab,
  About: AboutTab,
};

module.exports = {
  props: ['params'],
  template: cache.get(4),
  components: components,
  computed: {
    tab: function () {
      var tab = this.params.tab;
      if (!components[tab]) tab = 'Main';
      return tab;
    },
  },
};

});

define(22, function (require, exports, module) {
var cache = require(11);

function init() {
  if (div) return;
  div = document.createElement('div');
  document.body.appendChild(div);
  new Vue({
    el: div,
    template: cache.get(5),
    data: {
      messages: messages,
    },
  });
}

var div;
var messages = [];

exports.open = function (options) {
  init();
  messages.push(options);
  setTimeout(function () {
    var i = messages.indexOf(options);
    ~i && messages.splice(i, 1);
  }, 2000);
};

});

define(23, function (require, exports, module) {
var utils = require(16);
var cache = require(11);
var _ = require(12);
var store = utils.store;

var DEFAULT_ICON = '/images/icon48.png';

module.exports = {
  props: ['script'],
  template: cache.get(6),
  data: function () {
    return {
      safeIcon: DEFAULT_ICON,
    };
  },
  computed: {
    canUpdate: function () {
      var script = this.script;
      return script.update && (
        script.custom.updateURL ||
        script.meta.updateURL ||
        script.custom.downloadURL ||
        script.meta.downloadURL ||
        script.custom.lastInstallURL
      );
    },
    homepageURL: function () {
      var script = this.script;
      return script.custom.homepageURL || script.meta.homepageURL || script.meta.homepage;
    },
    author: function () {
      var text = this.script.meta.author;
      if (!text) return;
      var matches = text.match(/^(.*?)\s<(\S*?@\S*?)>$/);
      return {
        email: matches && matches[2],
        name: matches ? matches[1] : text,
      };
    },
    labelEnable: function () {
      return this.script.enabled ? _.i18n('buttonDisable') : _.i18n('buttonEnable');
    },
  },
  mounted: function () {
    var _this = this;
    _this.$el.addEventListener('dragstart', _this.onDragStart.bind(_this), false);
    var icon = _this.script.meta.icon64 || _this.script.meta.icon;
    if (icon && icon !== _this.safeIcon) {
      _this.loadImage(icon)
      .then(function (url) {
        _this.safeIcon = url;
      }, function () {
        _this.safeIcon = DEFAULT_ICON;
      });
    }
  },
  methods: {
    getLocaleString: function (key) {
      return _.getLocaleString(this.script.meta, key);
    },
    loadImage: function () {
      var images = {};
      return function (url) {
        if (!url) return Promise.reject();
        var promise = images[url];
        if (!promise) {
          var cache = store.cache[url];
          promise = cache ? Promise.resolve(cache)
            : new Promise(function (resolve, reject) {
              var img = new Image;
              img.onload = function () {
                resolve(url);
              };
              img.onerror = function () {
                reject(url);
              };
              img.src = url;
            });
          images[url] = promise;
        }
        return promise;
      };
    }(),
    onEdit: function () {
      var _this = this;
      _this.$emit('edit', _this.script.id);
    },
    onRemove: function () {
      var _this = this;
      _.sendMessage({
        cmd: 'RemoveScript',
        data: _this.script.id,
      });
    },
    onEnable: function () {
      var _this = this;
      _.sendMessage({
        cmd: 'UpdateScriptInfo',
        data: {
          id: _this.script.id,
          enabled: _this.script.enabled ? 0 : 1,
        },
      });
    },
    onUpdate: function () {
      _.sendMessage({
        cmd: 'CheckUpdate',
        data: this.script.id,
      });
    },
    onDragStart: function (e) {
      var _this = this;
      new DND(e, function (data) {
        _this.$emit('move', data);
      });
    },
  },
};

function DND(e, cb) {
  var _this = this;
  _this.mousemove = _this.mousemove.bind(_this);
  _this.mouseup = _this.mouseup.bind(_this);
  if (e) {
    e.preventDefault();
    _this.start(e);
  }
  _this.onDrop = cb;
}
DND.prototype.start = function (e) {
  var _this = this;
  var dragging = _this.dragging = {};
  var el = dragging.el = e.currentTarget;
  var parent = el.parentNode;
  var rect = el.getBoundingClientRect();
  dragging.offset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  var next = el.nextElementSibling;
  dragging.delta = (next ? next.getBoundingClientRect().top : parent.offsetHeight) - rect.top;
  dragging.lastIndex = dragging.index = [].indexOf.call(parent.children, el);
  dragging.elements = [].filter.call(parent.children, function (el) {
    return el !== dragging.el;
  });
  var dragged = dragging.dragged = el.cloneNode(true);
  dragged.classList.add('dragging');
  dragged.style.left = rect.left + 'px';
  dragged.style.top = rect.top + 'px';
  dragged.style.width = rect.width + 'px';
  parent.appendChild(dragged);
  el.classList.add('dragging-placeholder');
  document.addEventListener('mousemove', _this.mousemove, false);
  document.addEventListener('mouseup', _this.mouseup, false);
};
DND.prototype.mousemove = function (e) {
  var _this = this;
  var dragging = _this.dragging;
  var dragged = dragging.dragged;
  dragged.style.left = e.clientX - dragging.offset.x + 'px';
  dragged.style.top = e.clientY - dragging.offset.y + 'px';
  var hoveredIndex = dragging.elements.findIndex(function (el) {
    if (!el) return;
    if (el.classList.contains('dragging-moving')) return;
    var rect = el.getBoundingClientRect();
    var pad = 10;
    return (
      e.clientX >= rect.left + pad
      && e.clientX <= rect.left + rect.width - pad
      && e.clientY >= rect.top + pad
      && e.clientY <= rect.top + rect.height - pad
    );
  });
  if (~hoveredIndex) {
    var hoveredEl = dragging.elements[hoveredIndex];
    var lastIndex = dragging.lastIndex;
    var isDown = hoveredIndex >= lastIndex;
    var el = dragging.el;
    var delta = dragging.delta;
    if (isDown) {
      hoveredIndex ++;
      hoveredEl.parentNode.insertBefore(el, hoveredEl.nextElementSibling);
    } else {
      delta = -delta;
      hoveredEl.parentNode.insertBefore(el, hoveredEl);
    }
    dragging.lastIndex = hoveredIndex;
    _this.animate(dragging.elements.slice(
      isDown ? lastIndex : hoveredIndex,
      isDown ? hoveredIndex : lastIndex
    ), delta);
  }
  _this.checkScroll(e.clientY);
};
DND.prototype.animate = function (elements, delta) {
  function endAnimation(e) {
    e.target.classList.remove('dragging-moving');
    e.target.removeEventListener('transitionend', endAnimation, false);
  }
  elements.forEach(function (el) {
    if (!el) return;
    el.classList.add('dragging-moving');
    el.style.transition = 'none';
    el.style.transform = 'translateY(' + delta + 'px)';
    el.addEventListener('transitionend', endAnimation, false);
    setTimeout(function () {
      el.style.transition = '';
      el.style.transform = '';
    });
  });
};
DND.prototype.mouseup = function () {
  var _this = this;
  document.removeEventListener('mousemove', _this.mousemove, false);
  document.removeEventListener('mouseup', _this.mouseup, false);
  var dragging = _this.dragging;
  dragging.dragged.remove();
  dragging.el.classList.remove('dragging-placeholder');
  _this.dragging = null;
  _this.onDrop && _this.onDrop({
    from: dragging.index,
    to: dragging.lastIndex,
  });
};
DND.prototype.checkScroll = function (y) {
  var dragging = this.dragging;
  var scrollThreshold = 10;
  dragging.scroll = 0;
  var offset = dragging.el.parentNode.getBoundingClientRect();
  var delta = (y - (offset.bottom - scrollThreshold)) / scrollThreshold;
  if (delta > 0) {
    dragging.scroll = 1 + Math.min(~~ (delta * 5), 10);
  } else {
    delta = (offset.top + scrollThreshold - y) / scrollThreshold;
    if (delta > 0) dragging.scroll = -1 - Math.min(~~ (delta * 5), 10);
  }
  if (dragging.scroll) this.scrollParent();
};
DND.prototype.scrollParent = function () {
  function scroll() {
    var dragging = _this.dragging;
    if (dragging) {
      if (dragging.scroll) {
        dragging.el.parentNode.scrollTop += dragging.scroll;
        setTimeout(scroll, 32);
      } else dragging.scrolling = false;
    }
  }
  var _this = this;
  if (!_this.dragging.scrolling) {
    _this.dragging.scrolling = true;
    scroll();
  }
};

});

define(24, function (require, exports, module) {
var cache = require(11);
var data = {
  version: chrome.app.getDetails().version,
  language: navigator.language,
};

module.exports = {
  template: cache.get(7),
  data: function () {
    return data;
  },
};

});

define(25, function (require, exports, module) {
var ScriptItem = require(23);
var Edit = require(19);
var cache = require(11);
var _ = require(12);
var utils = require(16);
var store = utils.store;

module.exports = {
  template: cache.get(8),
  components: {
    ScriptItem: ScriptItem,
    Edit: Edit,
  },
  data: function () {
    return {
      script: null,
      store: store,
    };
  },
  computed: {
    message: function () {
      var _this = this;
      if (_this.store.loading) {
        return _.i18n('msgLoading');
      }
      if (!_this.store.scripts.length) {
        return _.i18n('labelNoScripts');
      }
    },
  },
  methods: {
    newScript: function () {
      var _this = this;
      _.sendMessage({cmd: 'NewScript'})
      .then(function (script) {
        _this.script = script;
      });
    },
    updateAll: function () {
      _.sendMessage({cmd: 'CheckUpdateAll'});
    },
    installFromURL: function () {
      var url = prompt(_.i18n('hintInputURL'));
      if (url && ~url.indexOf('://')) {
        chrome.tabs.create({
          url: chrome.extension.getURL('/options/index.html') + '#confirm/' + encodeURIComponent(url),
        });
      }
    },
    editScript: function (id) {
      var _this = this;
      _this.script = _this.store.scripts.find(function (script) {
        return script.id === id;
      });
    },
    endEditScript: function () {
      this.script = null;
    },
    moveScript: function (data) {
      var _this = this;
      if (data.from === data.to) return;
      _.sendMessage({
        cmd: 'Move',
        data: {
          id: _this.store.scripts[data.from].id,
          offset: data.to - data.from,
        },
      })
      .then(function () {
        var scripts = _this.store.scripts;
        var i = Math.min(data.from, data.to);
        var j = Math.max(data.from, data.to);
        var seq = [
          scripts.slice(0, i),
          scripts.slice(i, j + 1),
          scripts.slice(j + 1),
        ];
        i === data.to
          ? seq[1].unshift(seq[1].pop())
          : seq[1].push(seq[1].shift());
        _this.store.scripts = [];
        setTimeout(function () {
          _this.store.scripts = seq.concat.apply([], seq);
        });
      });
    },
  },
};

});

define(26, function (require, exports, module) {
function importData(file) {
  function forEach(obj, cb) {
    obj && Object.keys(obj).forEach(function (key) {
      var value = obj[key];
      cb(value, key);
    });
  }
  function getVMConfig(text) {
    var vm;
    try {
      vm = JSON.parse(text);
    } catch (e) {
      console.warn('Error parsing MeddleMonkey configuration.');
    }
    vm = vm || {};
    forEach(vm.values, function (value, key) {
      value && _.sendMessage({
        cmd: 'SetValue',
        data: {
          uri: key,
          values: value,
        }
      });
    });
    forEach(vm.settings, function (value, key) {
      _.options.set(key, value);
    });
    return vm;
  }
  function getVMFile(entry, vm) {
    if (!entry.filename.endsWith('.user.js')) return;
    vm = vm || {};
    return new Promise(function (resolve, _reject) {
      var writer = new zip.TextWriter;
      entry.getData(writer, function (text) {
        var script = {code: text};
        if (vm.scripts) {
          var more = vm.scripts[entry.filename.slice(0, -8)];
          if (more) {
            delete more.id;
            script.more = more;
          }
        }
        _.sendMessage({
          cmd: 'ParseScript',
          data: script,
        }).then(function () {
          resolve(true);
        });
      });
    });
  }
  function getVMFiles(entries) {
    var i = entries.findIndex(function (entry) {
      return entry.filename === 'ViolentMonkey';
    });
    if (~i) return new Promise(function (resolve, _reject) {
      var writer = new zip.TextWriter;
      entries[i].getData(writer, function (text) {
        entries.splice(i, 1);
        resolve({
          vm: getVMConfig(text),
          entries: entries,
        });
      });
    });
    return {
      entries: entries,
    };
  }
  function readZip(file) {
    return new Promise(function (resolve, reject) {
      zip.createReader(new zip.BlobReader(file), function (res) {
        res.getEntries(function (entries) {
          resolve(entries);
        });
      }, function (err) {reject(err);});
    });
  }
  readZip(file).then(getVMFiles).then(function (data) {
    var vm = data.vm;
    var entries = data.entries;
    return Promise.all(entries.map(function (entry) {
      return getVMFile(entry, vm);
    })).then(function (res) {
      return res.filter(function (item) {return item;}).length;
    });
  }).then(function (count) {
    Message.open({text: _.i18n('msgImported', [count])});
  });
}
function exportData(selectedIds) {
  function getWriter() {
    return new Promise(function (resolve, _reject) {
      zip.createWriter(new zip.BlobWriter, function (writer) {
        resolve(writer);
      });
    });
  }
  function addFile(writer, file) {
    return new Promise(function (resolve, _reject) {
      writer.add(file.name, new zip.TextReader(file.content), function () {
        resolve(writer);
      });
    });
  }
  function download(writer) {
    return new Promise(function (resolve, _reject) {
      writer.close(function (blob) {
        resolve(blob);
      });
    }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'scripts.zip';
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      });
    });
  }
  if (!selectedIds.length) return;
  var withValues = _.options.get('exportValues');
  return _.sendMessage({
    cmd: 'ExportZip',
    data: {
      values: withValues,
      ids: selectedIds,
    }
  })
  .then(function (data) {
    var names = {};
    var vm = {
      scripts: {},
      settings: _.options.getAll(),
    };
    if (withValues) vm.values = {};
    var files = data.scripts.map(function (script) {
      var name = script.custom.name || script.meta.name || 'Noname';
      if (names[name]) name += '_' + (++ names[name]);
      else names[name] = 1;
      vm.scripts[name] = ['id', 'custom', 'enabled', 'update'].reduce(function (res, key) {
        res[key] = script[key];
        return res;
      }, {});
      if (withValues) {
        var values = data.values[script.uri];
        if (values) vm.values[script.uri] = values;
      }
      return {
        name: name + '.user.js',
        content: script.code,
      };
    });
    files.push({
      name: 'ViolentMonkey',
      content: JSON.stringify(vm),
    });
    return files;
  })
  .then(function (files) {
    return files.reduce(function (result, file) {
      return result.then(function (writer) {
        return addFile(writer, file);
      });
    }, getWriter()).then(download);
  });
}

var Message = require(22);
var utils = require(16);
var store = utils.store;
var cache = require(11);
var _ = require(12);

module.exports = {
  template: cache.get(9),
  components: {},
  data: function () {
    return {
      store: store,
      selectedIds: [],
      exporting: false
    };
  },
  watch: {
    'store.scripts': function () {
      this.updateSelection(true);
    },
  },
  created: function () {
    this.updateSelection(true);
  },
  methods: {
    updateAutoUpdate: function () {
      _.sendMessage({cmd: 'AutoUpdate'});
    },
    updateSelection: function (select) {
      var _this = this;
      if (!store.scripts.length) return;
      if (select == null) select = _this.selectedIds.length < store.scripts.length;
      if (select) {
        _this.selectedIds = store.scripts.map(function (script) {
          return script.id;
        });
      } else {
        _this.selectedIds = [];
      }
    },
    importFile: function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip';
      input.onchange = function () {
        input.files && input.files.length && importData(input.files[0]);
      };
      input.click();
    },
    exportData: function () {
      var _this = this;
      _this.exporting = true;
      Promise.resolve(exportData(_this.selectedIds))
      .catch(_.noop)
      .then(function () {
        _this.exporting = false;
      });
    }
  },
};

});

define.use([13]);
