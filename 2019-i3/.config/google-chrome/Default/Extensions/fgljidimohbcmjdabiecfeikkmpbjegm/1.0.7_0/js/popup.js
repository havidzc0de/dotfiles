 var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-119188510-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var $=function(id){return document.getElementById(id);}
var Softdown = {
		apk_downloader:function(){
			chrome.tabs.query({active: true, currentWindow: true}, function(cur_tab) {
				var myurl = cur_tab[0]['url'];
			});
			
			$('apk_downloader').addEventListener('click',function(){
				chrome.tabs.create({url:'apkdownload.html'},function(tab){
					//chrome.runtime.sendMessage('abx');
					//console.log(tab.id);
				});
			},false);
		},
		
		wish_list:function(){
			$('wish_list').addEventListener('click',function(){
				chrome.tabs.create({url:'wish.html'},function(tab){
					
				});
			},false);
		}
}

document.addEventListener('DOMContentLoaded', function () {
  Softdown.apk_downloader();
  Softdown.wish_list();

});
