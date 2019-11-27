(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * 
 */

/* global chrome */
const {
  renderPopup,
  setEndPointHost,
  setWindowPosition
} = chrome.extension.getBackgroundPage().facebook.pixelHelper;
const subscription = renderPopup(document);

const resizeEventHandler = ev => {
  const {
    innerWidth,
    innerHeight,
    screenX,
    screenY
  } = ev.currentTarget; // We only care about the size of the window when in a popup not a popout.
  // We set the window position from the resize handler in order to
  // get an accurate size of the popup window. This use to work
  // correctly at the time of load, but it appears chrome broke the
  // functionality at somepoint.

  setWindowPosition({
    width: innerWidth,
    // Add 22 px to compensate for browser chrome
    height: innerHeight + 22,
    left: screenX - innerWidth,
    top: screenY
  });
};

window.addEventListener('resize', resizeEventHandler);
window.addEventListener('unload', _ => {
  window.removeEventListener('resize', resizeEventHandler);
  subscription.unsubscribe();
});
const facebook = window.facebook || {};
facebook.pixelHelper = {
  setEndPointHost
};
window.facebook = facebook;

},{}]},{},[1]);
