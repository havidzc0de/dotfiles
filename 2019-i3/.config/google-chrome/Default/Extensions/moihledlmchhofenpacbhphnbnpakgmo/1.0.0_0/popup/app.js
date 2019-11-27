define(27, function (require, exports, module) {
var Menu = require(31);
var Commands = require(29);
var utils = require(28);
var _ = require(12);

var app = new Vue({
  el: '#app',
  template: '<component :is=type></component>',
  components: {
    Menu: Menu,
    Commands: Commands
  },
  data: {
    type: 'Menu',
  },
  methods: {
    navigate: function (type) {
      this.type = type || 'Menu';
    },
  },
});

exports.navigate = app.navigate.bind(app);

!function () {
  function init() {
    var currentTab = utils.store.currentTab;
    chrome.tabs.sendMessage(currentTab.id, {cmd: 'GetPopup'});
    if (currentTab && /^https?:\/\//i.test(currentTab.url)) {
      var matches = currentTab.url.match(/:\/\/(?:www\.)?([^\/]*)/);
      var domain = matches[1];
      var domains = domain.split('.').reduceRight(function (res, part) {
        var last = res[0];
        if (last) part += '.' + last;
        res.unshift(part);
        return res;
      }, []);
      domains.length > 1 && domains.pop();
      utils.store.domains = domains;
    }
  }

  var commands = {
    SetPopup: function (data, src, _callback) {
      if (utils.store.currentTab.id !== src.tab.id) return;
      utils.store.commands = data.menus;
      _.sendMessage({
        cmd: 'GetMetas',
        data: data.ids,
      }).then(function (scripts) {
        utils.store.scripts = scripts;
      });
    },
  };
  chrome.runtime.onMessage.addListener(function (req, src, callback) {
    var func = commands[req.cmd];
    if (func) func(req.data, src, callback);
  });

  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    utils.store.currentTab = {
      id: tabs[0].id,
      url: tabs[0].url,
    };
    init();
  });
}();

});

define(28, function (require, exports, module) {
exports.store = {
  scripts: [],
  commands: [],
  domains: [],
};

});

define(29, function (require, exports, module) {
var app = require(27);
var MixIn = require(32);
var _ = require(12);

module.exports = {
  mixins: [MixIn],
  data: function () {
    return {
      top: [{
        name: _.i18n('menuBack'),
        symbol: 'arrow-left',
        onClick: function () {
          app.navigate();
        },
      }],
    };
  },
  computed: {
    bot: function () {
      var _this = this;
      return _this.store.commands.map(function (item) {
        return {
          name: item[0],
          symbol: 'right-hand',
          className: 'ellipsis',
          onClick: function (options) {
            chrome.tabs.sendMessage(_this.store.currentTab.id, {
              cmd: 'Command',
              data: options.name,
            });
          },
        };
      });
    },
  },
  watch: {
    'store.commands': 'fixStyles',
  },
};

});

define(30, function (require, exports, module) {
function wrapHandler(name) {
  return function () {
    var _this = this;
    var options = _this.options;
    var handler = options[name];
    handler && handler.call(_this, options);
  };
}

var cache = require(11);

module.exports = {
  props: ['options'],
  template: cache.get(10),
  data: function () {
    return {
      data: {},
    };
  },
  watch: {
    options: 'update',
  },
  methods: {
    update: function () {
      this.data = this.options;
      this.init();
    },
    init: wrapHandler('init'),
    onClick: wrapHandler('onClick'),
    detailClick: wrapHandler('detailClick'),
  },
  mounted: function () {
    this.update();
  },
};

});

define(31, function (require, exports, module) {
var app = require(27);
var MixIn = require(32);
var _ = require(12);

module.exports = {
  mixins: [MixIn],
  data: function () {
    var _this = this;
    return {
      top: [{
        name: _.i18n('menuManageScripts'),
        symbol: 'cog',
        onClick: function () {
          var url = chrome.extension.getURL(chrome.app.getDetails().options_page);
          chrome.tabs.query({
            currentWindow: true,
            url: url,
          }, function (tabs) {
            var tab = tabs.find(function (tab) {
              var hash = tab.url.match(/#(\w+)/);
              return !hash || hash[1] !== 'confirm';
            });
            if (tab) chrome.tabs.update(tab.id, {active: true});
            else chrome.tabs.create({url: url});
          });
        },
      }, {
        name: _.i18n('menuCommands'),
        symbol: 'arrow-right',
        hide: function () {
          var commands = _this.store.commands;
          return !commands || !commands.length;
        },
        onClick: function () {
          app.navigate('Commands');
        },
      }, {
        name: null,
        symbol: null,
        disabled: null,
        init: function (options) {
          options.disabled = !_.options.get('isApplied');
          options.name = options.disabled ? _.i18n('menuScriptDisabled') : _.i18n('menuScriptEnabled');
          options.symbol = options.disabled ? 'remove' : 'check';
        },
        onClick: function (options) {
          _.options.set('isApplied', options.disabled);
          options.init.call(this, options);
          chrome.browserAction.setIcon({
            path: {
              19: '/images/icon19' + (options.disabled ? 'w' : '') + '.png',
              38: '/images/icon38' + (options.disabled ? 'w' : '') + '.png',
            },
          });
        },
      }],
    };
  },
  computed: {
    bot: function () {
      var _this = this;
      return _this.store.scripts.map(function (script) {
        return {
          name: script.custom.name || _.getLocaleString(script.meta, 'name'),
          className: 'ellipsis',
          symbol: null,
          disabled: null,
          init: function (options) {
            options.disabled = !script.enabled;
            options.symbol = options.disabled ? 'remove' : 'check';
          },
          onClick: function (options) {
            var vm = this;
            _.sendMessage({
              cmd: 'UpdateScriptInfo',
              data: {
                id: script.id,
                enabled: !script.enabled,
              },
            }).then(function () {
              script.enabled = !script.enabled;
              options.init.call(vm, options);
              _.options.get('autoReload') && chrome.tabs.reload(_this.store.currentTab.id);
            });
          },
        };
      });
    },
  },
  watch: {
    'store.scripts': 'fixStyles',
    'store.commands': 'fixStyles',
    'store.domains': 'fixStyles',
  },
};

});

define(32, function (require, exports, module) {
var MenuItem = require(30);
var cache = require(11);
var utils = require(28);

module.exports = {
  template: cache.get(11),
  data: function () {
    return {
      store: utils.store,
    };
  },
  components: {
    MenuItem: MenuItem,
  },
  mounted: function () {
    this.fixStyles();
  },
  methods: {
    fixStyles: function () {
      var _this = this;
      _this.$nextTick(function () {
        var placeholder = _this.$refs.placeholder;
        var bot = _this.$refs.bot;
        placeholder.innerHTML = bot.innerHTML;
        var pad = bot.offsetWidth - bot.clientWidth + 2;
        placeholder.style.paddingRight = pad + 'px';
      });
    },
    isVisible: function (item) {
      var hide = item.hide;
      if (typeof hide === 'function') hide = hide.call(this);
      return !hide;
    },
  },
};

});

define.use([27]);
