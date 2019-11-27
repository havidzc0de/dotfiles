var $=function(id){return document.getElementById(id);}
chrome.runtime.onInstalled.addListener(function() {
	console.log("Installed.");
	var context ='page';
	//测试增加一个菜单

	
	
	
});
function genericOnClick(){
	
	 chrome.tabs.query({active: true, currentWindow: true}, function(cur_tab) {
			chrome.tabs.insertCSS(cur_tab[0].id,{file:"css/qr.css"});
			chrome.tabs.executeScript(cur_tab[0].id,{file:'js/qr.js'});
	 });	

}
chrome.runtime.onSuspend.addListener(function() {
  // 做一些简单的清理任务。
});

chrome.runtime.onStartup.addListener(function() {
//	console.log('Starting browser... updating icon.');
	
	
});
chrome.runtime.onMessage.addListener(function(request) {
  if (request == 'popjs') {
		chrome.tabs.query({active: true, currentWindow: true}, function(cur_tab) {
			chrome.tabs.insertCSS(cur_tab[0].id,{file:"css/pop.css"});
			chrome.tabs.executeScript(cur_tab[0].id,{file:'js/pop.js'});
		});			
   }
   
});
