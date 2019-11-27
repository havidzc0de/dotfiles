 var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-119188510-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
var $=function(id){return document.getElementById(id);}
function screendiv3(){
	var node = document.createElement('div');
	node.className = "full3";  
	//滚动的距离
	if(document.documentElement.scrollTop){
        var scrollY=document.documentElement.scrollTop; 
    }else{
        var scrollY=document.body.scrollTop; 
    }
	node.style.height=document.body.clientHeight+scrollY+"px"; 
	node.style.width=document.body.clientWidth+scrollY+"px";
	document.body.insertBefore(node, document.body.firstChild);
}
function middlediv3(id,wid,hei){
	var node = document.createElement('div');
	node.id = id; 
	node.className = "centeron"; 
	node.style.height=hei+"px";
	node.style.width=wid+"px";
	node.style.marginLeft=-wid/2+"px";
	node.style.marginTop=-hei/2+"px";
	var url = window.location.href ;
	var stradd="<span  id='close_id_qr' class='cloesd'></span>";
    stradd+="<div class='tip_title'>Scan to open on  your Phone</div>";
    stradd+="<div class='tip_box'><img src='https://chart.googleapis.com/chart?cht=qr&chs=275x275&choe=UTF-8&chld=L|0&chl="+encodeURIComponent(url) +"' /></div>";
	node.innerHTML =stradd;
	document.body.insertBefore(node, document.body.firstChild);  
	$('close_id_qr').addEventListener('click',function(){
					removepop3();
	},false);
}
function operate_scroller3(){ 
	if(navigator.appName=="Microsoft Internet Explorer" && navigator.appVersion.split(";")[1].replace(/\s*/g,"")=="MSIE6.0"){ 
		if(document.getElementsByTagName('html')[0].style.overflow !== 'hidden'){
			document.getElementsByTagName('html')[0].style.overflow = 'hidden';
		}else{
			document.getElementsByTagName('html')[0].style.overflow = '';
		}
	}else{
		if(document.getElementsByTagName('body')[0].style.overflow !== 'hidden'){
			document.getElementsByTagName('body')[0].style.overflow = 'hidden';
		}else{
			document.getElementsByTagName('body')[0].style.overflow = '';
		}
	}
}
function removepop3(){
	//操作滚动条
	operate_scroller3();	
	document.body.removeChild(document.body.firstChild.nextSibling);
	document.body.removeChild(document.body.firstChild);
}
function pop(){
	screendiv3();
	middlediv3("dyg",400,420);
	//操作滚动条
	operate_scroller3();
	
}
pop();