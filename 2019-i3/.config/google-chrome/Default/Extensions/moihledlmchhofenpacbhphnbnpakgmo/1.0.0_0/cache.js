define(11, function (require, exports, module) {
function Cache(allowOverride) {
  this.data = {};
  this.allowOverride = allowOverride;
}
Cache.prototype.put = function (key, fn) {
  if (key in this.data && !this.allowOverride)
    throw 'Key {' + key + '} already exists!';
  this.data[key] = fn;
};
Cache.prototype.get = function (key) {
  var data = this.data;
  if (key in data) return data[key];
  throw 'Cache not found: ' + key;
};

var _ = require(12);
Vue.prototype.i18n = _.i18n;

!function () {
  var xhr = new XMLHttpRequest;
  xhr.open('GET', '/images/sprite.svg', true);
  xhr.onload = function () {
    var div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = xhr.responseText;
    document.body.insertBefore(div, document.body.firstChild);
  };
  xhr.send();
}();

/* eslint-disable no-unused-vars */
var cache = module.exports = new Cache();



/* Templates cached with love :) */
cache.put(1, "<div> <div class=frame-header> <div class=buttons> <div v-dropdown> <button dropdown-toggle v-text=\"i18n('buttonInstallOptions')\"></button> <div class=\"dropdown-menu options-panel\" @mousedown.stop> <label> <input type=checkbox v-setting=\"'closeAfterInstall'\" @change=checkClose> <span v-text=\"i18n('installOptionClose')\"></span> </label> <label> <input type=checkbox v-setting=\"'trackLocalFile'\" :disabled=closeAfterInstall> <span v-text=\"i18n('installOptionTrack')\"></span> </label> </div> </div> <button v-text=\"i18n('buttonConfirmInstallation')\" :disabled=!installable @click=installScript></button> <button v-text=\"i18n('buttonClose')\" @click=close></button> </div> <h1><span v-text=\"i18n('labelInstall')\"></span> - <span v-text=\"i18n('extName')\"></span></h1> <div class=\"ellipsis confirm-url\" :title=params.url>{{params.url}}</div> <div class=\"ellipsis confirm-msg\">{{message}}</div> </div> <div class=frame-body> <editor readonly=readonly :on-exit=close :content=code></editor> </div> </div> ");
cache.put(2, "<div class=\"frame edit\"> <div class=frame-header> <div class=buttons> <div v-dropdown> <button dropdown-toggle v-text=\"i18n('buttonCustomMeta')\"></button> <div class=dropdown-menu> <table> <tr> <td title=@name v-text=\"i18n('labelName')\"></td> <td class=expand> <input type=text v-model=custom.name :placeholder=placeholders.name> </td> <td title=@run-at v-text=\"i18n('labelRunAt')\"></td> <td> <select v-model=\"custom['run-at']\"> <option value=\"\" v-text=\"i18n('labelRunAtDefault')\"></option> <option value=start>document-start</option> <option value=idle>document-idle</option> <option value=end>document-end</option> </select> </td> </tr> <tr title=@homepageURL> <td v-text=\"i18n('labelHomepageURL')\"></td> <td colspan=3 class=expand> <input type=text v-model=custom.homepageURL :placeholder=placeholders.homepageURL> </td> </tr> </table> <table> <tr title=@updateURL> <td v-text=\"i18n('labelUpdateURL')\"></td> <td class=expand> <input type=text v-model=custom.updateURL :placeholder=placeholders.updateURL> </td> </tr> <tr title=@downloadURL> <td v-text=\"i18n('labelDownloadURL')\"></td> <td class=expand> <input type=text v-model=custom.downloadURL :placeholder=placeholders.downloadURL> </td> </tr> </table> <fieldset title=@include> <legend> <span v-text=\"i18n('labelInclude')\"></span> <label> <input type=checkbox v-model=custom.keepInclude> <span v-text=\"i18n('labelKeepInclude')\"></span> </label> </legend> <div v-html=\"i18n('labelCustomInclude')\"></div> <textarea v-model=custom.include></textarea> </fieldset> <fieldset title=@match> <legend> <span v-text=\"i18n('labelMatch')\"></span> <label> <input type=checkbox v-model=custom.keepMatch> <span v-text=\"i18n('labelKeepMatch')\"></span> </label> </legend> <div v-html=\"i18n('labelCustomMatch')\"></div> <textarea v-model=custom.match></textarea> </fieldset> <fieldset title=@exclude> <legend> <span v-text=\"i18n('labelExclude')\"></span> <label> <input type=checkbox v-model=custom.keepExclude> <span v-text=\"i18n('labelKeepExclude')\"></span> </label> </legend> <div v-html=\"i18n('labelCustomExclude')\"></div> <textarea v-model=custom.exclude></textarea> </fieldset> </div> </div> </div> <h2 v-text=\"i18n('labelScriptEditor')\"></h2> </div> <div class=frame-footer> <div class=pull-right> <button v-text=\"i18n('buttonSave')\" @click=save :disabled=!canSave></button> <button v-text=\"i18n('buttonSaveClose')\" @click=saveClose :disabled=!canSave></button> <button v-text=\"i18n('buttonClose')\" @click=close></button> </div> <label> <input type=checkbox v-model=update> <span v-text=\"i18n('labelAllowUpdate')\"></span> </label> </div> <div class=frame-body> <editor :on-save=save :on-exit=close :on-change=contentChange :content=code></editor> </div> </div> ");
cache.put(3, "<div class=editor-code></div> ");
cache.put(4, "<div class=main> <aside> <img src=/images/icon128.png> <h1 v-text=\"i18n('extName')\"></h1> <hr> <div class=sidemenu> <a href=#main/Installed :class=\"{active:tab==='Main'}\" v-text=\"i18n('sideMenuInstalled')\"></a> <a href=#main/Settings :class=\"{active:tab==='Settings'}\" v-feature=\"'settings'\"> <span v-text=\"i18n('sideMenuSettings')\" class=feature-text></span> </a> <a href=#main/About :class=\"{active:tab==='About'}\" v-text=\"i18n('sideMenuAbout')\"></a> </div> </aside> <component :is=tab></component> </div> ");
cache.put(5, "<transition-group tag=div name=message> <div v-for=\"message in messages\" class=message :key=message v-text=message.text></div>  </transition-group>");
cache.put(6, "<div class=script :class={disabled:!script.enabled} draggable=true> <img class=script-icon :src=safeIcon> <div class=\"script-version pull-right\" v-text=\"script.meta.version?'v'+script.meta.version:''\"></div> <div class=\"script-author ellipsis pull-right\" :title=script.meta.author v-if=author> <span v-text=\"i18n('labelAuthor')\"></span> <a href=mailto:{{author.email}} v-if=author.email v-text=author.name></a> <span v-if=!author.email v-text=author.name> </span></div> <div class=script-info> <a class=\"script-name ellipsis\" target=_blank :href=homepageURL v-text=\"script.custom.name||getLocaleString('name')\"></a> <a class=script-support v-show=script.meta.supportURL target=_blank :href=script.meta.supportURL> <svg class=icon><use xlink:href=#question /></svg> </a> </div> <p class=\"script-desc ellipsis\" v-text=\"script.custom.description||getLocaleString('description')\"></p> <div class=buttons> <button v-text=\"i18n('buttonEdit')\" @click=onEdit></button> <button @click=onEnable v-text=labelEnable></button> <button v-text=\"i18n('buttonRemove')\" @click=onRemove></button> <button v-if=canUpdate :disabled=script.checking v-text=\"i18n('buttonUpdate')\" @click=onUpdate></button> <span v-text=script.message></span> </div> </div> ");
cache.put(7, "<div class=content> <h1> <span v-text=\"i18n('labelAbout')\"></span> <small>v{{version}}</small> </h1> <div class=line v-text=\"i18n('extDescription')\"></div> <div class=line v-text=\"i18n('extForkDescription')\"></div> </div> ");
cache.put(8, "<div class=\"content no-pad\"> <header> <button v-text=\"i18n('buttonNew')\" @click=newScript></button> <button v-text=\"i18n('buttonUpdateAll')\" @click=updateAll></button> <button v-text=\"i18n('buttonInstallFromURL')\" @click=installFromURL></button> </header> <div class=backdrop :class={mask:store.loading} v-show=message> <div v-html=message></div> </div> <div class=scripts> <script-item v-for=\"script in store.scripts\" :script=script @edit=editScript @move=moveScript></script-item> </div> <edit v-if=script :script=script @close=endEditScript></edit> </div> ");
cache.put(9, "<div class=content> <h1 v-text=\"i18n('labelSettings')\"></h1> <label class=line> <input type=checkbox v-setting=\"'autoUpdate'\" @change=updateAutoUpdate> <span v-text=\"i18n('labelAutoUpdate')\"></span> </label> <label class=line> <input type=checkbox v-setting=\"'ignoreGrant'\"> <span v-text=\"i18n('labelIgnoreGrant')\"></span> </label> <label class=line> <input type=checkbox v-setting=\"'autoReload'\"> <span v-text=\"i18n('labelAutoReloadCurrentTab')\"></span> </label> <fieldset class=title> <legend v-text=\"i18n('labelDataImport')\"></legend> <button v-text=\"i18n('buttonImportData')\" @click=importFile></button> </fieldset> <fieldset class=title> <legend v-text=\"i18n('labelDataExport')\"></legend> <b v-text=\"i18n('labelScriptsToExport')\"></b> <label> <input type=checkbox v-setting=\"'exportValues'\"> <span v-text=\"i18n('labelExportScriptData')\"></span> </label> <select class=export-list multiple=multiple v-model=selectedIds> <option class=ellipsis v-for=\"script in store.scripts\" :value=script.id v-text=script.custom.name||script.meta.name></option> </select> <button v-text=\"i18n('buttonAllNone')\" @click=updateSelection()></button> <button v-text=\"i18n('buttonExportData')\" @click=exportData :disabled=exporting></button> </fieldset> </div> ");
cache.put(10, "<div class=menu-item :class=[data.className,{disabled:data.disabled}] :title=data.title||data.name> <div class=menu-item-detail v-if=data.detailClick @click=detailClick>...</div> <div class=menu-item-label @click=onClick> <svg class=icon><use :xlink:href=\"'#'+data.symbol\"/></svg> {{data.name}} </div> </div> ");
cache.put(11, "<div> <div class=menu> <menu-item v-for=\"item in top\" v-show=isVisible(item) :options=item></menu-item> </div> <hr v-if=bot.length> <div class=\"menu placeholder\" ref=placeholder></div> <div class=menu ref=bot> <menu-item v-for=\"item in bot\" :options=item></menu-item> </div> </div> ");
});
