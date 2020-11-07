/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { Application } from './app.js';

function fitCanvasToWindow() {
	const canvas = document.getElementById("glCanvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}
function fullscreen() {
	const canvas = document.getElementById("glCanvas");
	if (canvas.webkitRequestFullScreen) {
		canvas.webkitRequestFullScreen();
	} else {
		canvas.requestFullscreen();
	} 
}
/**
 * Main function
 */
var requestID = null;
var app = null;
function main(options) {
	const canvas = document.getElementById("glCanvas");
	fitCanvasToWindow();
	// Initialize the GL context
	const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	// Only continue if WebGL is available and working
	if (!gl) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}

	// Create application instance
	app = new Application(gl, options);
	app.load();

	// Render cycle
	var then = 0;
	function render(now) {
		now *= 0.001;  // convert to seconds
		const seconds = now - then;
		then = now;

		app.update(seconds);
		app.render();

		requestID = requestAnimationFrame(render);
	}
	requestID = requestAnimationFrame(render);
}
function onUnload() {
	if (app) {
		cancelAnimationFrame(requestID);
		app.unload();
		app = null;
	}
}
function onResize() {
	if (app) {
		fitCanvasToWindow();
		const canvas = document.getElementById("glCanvas");
		app.onResize(canvas.clientWidth, canvas.clientHeight);
	}
}
function onSimpleButtonClick() {
	// Hide variant selection menu
	document.getElementById("variantSelection").style.display = 'none';
	// Start main routine
	main({
		useQuadTree: false
	});
}
function onComplicatedButtonClick() {
	// Hide variant selection menu
	document.getElementById("variantSelection").style.display = 'none';
	// Start main routine
	main({
		useQuadTree: true
	});
}
function chooseVariant() {
	document.getElementById("simpleButton").onclick = onSimpleButtonClick;
	document.getElementById("complicatedButton").onclick = onComplicatedButtonClick;
}

window.onload = chooseVariant;
window.onbeforeunload = onUnload;
window.onresize = onResize;