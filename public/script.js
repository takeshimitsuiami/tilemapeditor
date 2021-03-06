function $(q) { return document.querySelector(q); }
function $$(q) { return document.querySelectorAll(q); }
function ce(q) { return document.createElement(q); }

var canvas = $("#canvas");
var ctx = canvas.getContext("2d");
var toolpanel = $("#toolpanel");
var addtooldialog = $("#addtooldialog");
var addtool = $("#addtool");
var addtoolbutton = $("#addtoolbutton");
var canceltoolbutton = $("#canceltoolbutton");
var selectimagebutton = $("#selectimagebutton");
var toolimagefile = $("#toolimagefile");
var toolimage = $("#toolimage");
var toolbox = $("#toolbox");
var savejsonbutton = $("#savejsonbutton");
var loadjsonbutton = $("#loadjsonbutton");
var savedialog = $("#savedialog");
var savemapbutton = $("#savemapbutton");
var cancelmapdialogbutton = $("#cancelmapdialogbutton");
var savemapdialogbutton = $("#savemapdialogbutton");
var mapname = $("#mapname");
var panelheaders = Array.prototype.slice.apply($$(".panel-header"));
var createpanel = $("#createpanel");
var createmapbutton = $("#createmapbutton");
var createmapwidth = $("#createmapwidth");
var createmapheight = $("#createmapheight");
var createmapname = $("#createmapname");
var addtoolimage = $("#addtoolimage");
var savemapimage = $("#savemapimage");
var savejsonimage = $("#savejsonimage");
var loadjsonimage = $("#loadjsonimage");
var layers = $("#layers");
var addlayerbutton = $("#addlayerbutton");
var addlayerimage = $("#addlayerimage");

var name;
var toolname;
var paneldrag = null;
var offset = {x: 64, y: 64};
var zoom = 1;
var tile = {w: 32, h: 32};
var map = {w: 10, h: 10, layers: [] };
var mouse = {x: 0, y: 0};
var tools = [];
var temp;

window.addEventListener("resize", function(e) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}, false);

savejsonbutton.addEventListener("click", savejson, false);
loadjsonbutton.addEventListener("click", loadjson, false);
savemapbutton.addEventListener("click", showsavedialog, false);
createmapbutton.addEventListener("click", createmap, false);
addlayerbutton.addEventListener("click", addlayer, false);

canvas.addEventListener("mousewheel", function(e) {
	var dz = e.deltaY/1000;
	zoom -= dz;
	var dx = canvas.width/4 - e.clientX;
	var dy = canvas.height/4 - e.clientY;
	offset.x -= dx * dz;
	offset.y -= dy * dz;
}, false);

canceltoolbutton.addEventListener("click", canceladdtooldialog, false);
addtool.addEventListener("click", function(e) {
	addtooldialog.style.display = "block";
	selectimagebutton.addEventListener("click", selectimage, false);
	toolimagefile.addEventListener("change", uploadfile, false);
}, false);

panelheaders.forEach(function(h) {
	h.addEventListener("mousedown", panelhead, false);
});

function panelhead(e) {
	paneldrag = this.parentNode;
	window.addEventListener("mousemove", dragpanel, false);
	window.addEventListener("mouseup", droppanel, false);
}

function dragpanel(e) {
	paneldrag.style.top = paneldrag.getBoundingClientRect().top + e.movementY + "px";
	paneldrag.style.left = paneldrag.getBoundingClientRect().left + e.movementX + "px";
}

function droppanel(e) {
	window.removeEventListener("mousemove", dragpanel);
	window.removeEventListener("mouseup", droppanel);
}

canvas.addEventListener("mousemove", mousemove, false);
canvas.addEventListener("mousedown", mousedown, false);
canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); return false; }, false);

function mousemove(e) {
	mouse.x = e.clientX / zoom;
	mouse.y = e.clientY / zoom;
	mouse.tx = Math.floor((mouse.x - offset.x) / 32);
	mouse.ty = Math.floor((mouse.y - offset.y) / 32);
}

function mousedown(e) {
	canvas.addEventListener("mousemove", mousedownmove, false);
	canvas.addEventListener("mouseup", mouseup, false);
	if (e.button == 0) {
		console.log("drawing " + getselectedtool() + " on layer " + layers.value + " at " + mouse.tx + ":" + mouse.ty);
		var tt = tools.indexOf(tools.find(function(t) { return t.name === getselectedtool(); }));
		if (mouse.tx >= 0 && mouse.tx < map.w && mouse.ty >= 0 && mouse.ty < map.h) map.layers[parseInt(layers.value)][mouse.ty][mouse.tx] = tt;
	} else if (e.button == 1) {
	} else if (e.button == 2) {
	}
}

function mousedownmove(e) {
	if (e.button == 0) {
		console.log("drawing " + getselectedtool() + " on layer " + layers.value + " at " + mouse.tx + ":" + mouse.ty);
		var tt = tools.indexOf(tools.find(function(t) { return t.name === getselectedtool(); }));
		if (mouse.tx >= 0 && mouse.tx < map.w && mouse.ty >= 0 && mouse.ty < map.h) map.layers[parseInt(layers.value)][mouse.ty][mouse.tx] = tt;
	} else if (e.button == 1) {
		offset.x += e.movementX;
		offset.y += e.movementY;
	} else if (e.button == 2) {
	}
}

function mouseup(e) {
	canvas.removeEventListener("mousemove", mousedownmove);
	canvas.removeEventListener("mouseup", mouseup);
}

function addlayer(index) {
	index = parseInt(index) || layers.length;
	var option = ce("option");
	option.value = index;
	option.innerText = "layer #" + index;
	layers.appendChild(option);
	layers.value = index;
	map.layers.splice(index, 0, []);
	for (var y = 0; y < map.h; y++) {
		map.layers[index][y] = [];
		for (var x = 0; x < map.w; x++) {
			map.layers[index][y].push(-1);
		}
	}
}

function addlayertolist(index) {
	index = parseInt(index) || layers.length;
	var option = ce("option");
	option.value = index;
	option.innerText = "layer #" + index;
	layers.appendChild(option);
	layers.value = index;
}

function createmap() {
	map.w = parseInt(createmapwidth.value);
	map.h = parseInt(createmapheight.value);

	addlayer(0);
	name = createmapname.value;
	createpanel.style.display = "none";
	toolpanel.style.display = "block";
	draw();
}

function loadjson() {
	var fileinput = ce("input");
	fileinput.type = "file";
	fileinput.style.display = "none";
	document.body.appendChild(fileinput);
	fileinput.addEventListener("change", function(e) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var data = reader.result;
			parsejson(data);
		};
		reader.readAsBinaryString(fileinput.files[0]);
	});
	fileinput.click();
}

function parsejson(string) {
	var data = JSON.parse(string);
	console.log(data);
	map = data.map;
	while (toolbox.childNodes.length > 1) toolbox.removeChild(toolbox.lastChild);
	inittools();
	name = data.name;
	console.log(map.layers.length);
	map.layers.forEach(function(l) {
		console.log(l);
		addlayertolist();
	});
	data.tools.forEach(function(t) {
		var i = new Image();
		i.src = t.image;
		tools.push({name: t.name, image: i});
		var tl = ce("label");
		var ti = ce("input");
		var ts = ce("span");
		var tim = ce("img");
		tl.className = "toolbutton";
		ti.name = "toolbox";
		ti.type = "radio";
		ti.checked = true;
		ti.id = t.name;
		tim.src = t.image;
		ts.appendChild(tim);
		tl.appendChild(ti);
		tl.appendChild(ts);
		toolbox.appendChild(tl);
	});
}

function showsavedialog(e) {
	mapname.value = name;
	savedialog.style.display = "block";
	savemapdialogbutton.addEventListener("click", savemap, false);
	cancelmapdialogbutton.addEventListener("click", function(e) {
		savedialog.style.display = "none";
		mapname.value = "";
	}, false);
}

function savemap(e) {
	var data = {name: mapname.value, map: map, tools: []};
	tools.forEach(function(t) {
		data.tools.push({name: t.name, image: t.image.src});
	}); 
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/map/save", true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			console.log(xhr.responseText);
			savedialog.style.display = "none";
		}
	};
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.send(JSON.stringify(data));
}

function savejson() {
	var data = {
		map: map, tools: []
	};
	tools.forEach(function(t) {
		data.tools.push({name: t.name, image: t.image.src});
	});
	console.log(data);
	var a = ce("a");
	a.href = "data:text/json;charset=UTF-8," + JSON.stringify(data);
	a.download = "map.json";
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
}

function getselectedtool() { 
	var t = $("#toolbox input[name=toolbox]:checked");
	if (t) return t.id;
	return -1;
}

function selectimage(e) { toolimagefile.click(); }

function canceladdtooldialog() {
	addtooldialog.style.display = "none";
	toolimage.src = "";
	selectimagebutton.removeEventListener("click", selectimage);
	addtoolbutton.removeEventListener("click", createtool);
}

function uploadfile(e) {
	selectimagebutton.innerHTML = "uploading...";
	var reader = new FileReader();
	reader.onload = function(e) {
		toolimage.src = reader.result;
		toolname = toolimagefile.files[0].name.replace(/^(.*)\..{3,4}$/, "$1");
		selectimagebutton.innerHTML = toolname;
		addtoolbutton.addEventListener("click", createtool, false);
	};
	reader.readAsDataURL(toolimagefile.files[0]);
}

function inittools() {
	tools = [];
	tools[-1] = {name: "delete", image: null};
	var tl = ce("label");
	var ti = ce("input");
	var ts = ce("span");
	var tim = ce("img");
	tim.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABT9JREFUeNrEl3tsU1Ucx7+3tz29bdd24NwYEGAwMMQYjJoQIhrUIKwFDDFG0fmAQBw++E90PP7xD9TEbTw2qlNj1D/ABMXgYCQIfxC3MGBPpOtAXsrAsXUd7Qa9a2+vv3PaymPrOtjAm/xy29tzz+d7fq9zKum6jv/zkkZ5Pvm7NVs9Rklexb9EY9qXb25b8y591O7HYuRv3inb5W8+o+uRqLBr7V36zrVfcRezew1nP7xfrkeuq3rX7hr9b0+VfvGLKr2d7rrar1d/viulCGmU4OqyT1bg6m9N6PeHAIMhPnOMuFENOa/OQ7WnCu4PXjLT0/7RFMC+5/CP30Lo8Amo3b2QZMOtI7gITUPWi3Oxv7IKi9a+fIuIkQhgVZ/tVAtWuRH8vRWRAK38dvgtImIYu2Q29n+9F4s+fOU/EXcrgP366Q514YoC9FQ3xsGGNFORAB6OTNfj2P9tNRZ/tEyIkO8GvmfTDrXgjQUIHTwBySQLt0uSlNqEFwDHglkI1ZxE9qx8zJ0xJ/fHAz/vM9wpvLzSo7oKn0fvYS8g4GSUdCmNBHB4xvxHEKxphRaMIMtug96nraT5LMY7gXs8HnWpeym6an2wykbE0snnXVbTYXn2YQHX+yJgFkZFIkOH6MDKcAWw7du3q0tcL6DRexLSGAmPhaywxEiElKKV88exGJR5DyFYG4ebFDNMTEFHdw8C6tXdw01CVlFRoS4scOHchb/AParz1wj86FUbFE0iEYPAKenMc6fRyr0Ejwo4UywI90dQXVt3pbD0vfk06qyUNubl5QLefulSPJ5JRqLRzAxaYY/EReg3wU1P5g2ER6LYV3MMr5eunsPhZP6hBLBtW7eqC9wudF7pSunlqEFHftCMrLAc33HI7cbZUwh+cgC8muCFpaufolHnyK6QRVIJYFu2bFELXG4EAj1D5xlfMInICzA80EclN3siemqpQgjOEvDrN+BP3wRP2YjY5s2b1YUE7+3ti2dyumTnntA1PJE/E8GDLdB6w5TtCswWKy52daPuDx8KSwbCBxPAysrKxMrDqorhHlY06nB5Uybj9PnzmNwtw9rVC2azod0fIHgbXispGhR+uwBWWlKiuhYtpr1Do1DG0pNJYJQSbtKkiTj95xnhLMVpw1QS4fdeRp23DctK304J51eyD7ASghe4F4PXGe9gssGQ1u0KY8jMdOD0mbPigS3DBrstAxcu+7HHX4sNpeuGhCcFyBs3bqiY98xzcNjt6LvWB4Mspw06Mxlhd9jR0NgCe4ZdwPn7gVOXsffoAWwoXp8WnhRgYSa2MndCLmLkellOvz+ZmAkZlGANzc0CarVZxb3N58Px+mNYP0x4UoDCXW6k/hylxiIbhxZgMjIoCkN9E8EzbsBP+dpQX38c64rXDRvOLxHozs7On8hok5AIIMMoD24WRRHwhsamAXC+8uLi4juCi5MsF1FXV9cyYfz41Xl5eXA4MkVxSJKBBN0ws5lReAwE5253jAo8KYB3UP3QoUO/5I4bt2LqtKlwOp1i0+Ee4XDKEVFyDU0JeCLhfL5W4fa7hScF8IqK8GbGReTk5CzPnz6dyiszHnOTSfSFhuYWgjpFtjsdDkq4VjTU148InhSAhBfCXIgQkZ29PBQKYfqMGWIHbGo5gbGZY+Fw2oU3jh45glavd8TwQVsxWTbZ5KKiouIHs7LcFqs1cbbjp+sY1HAY/3R07KusrNxE4y6MBJ5yMyIbQ5ZDxuNguu13Hi6+RXaQBUYCH+pExENj4T0iWao3n/IT4bp+v/503tPrXwEGAMSFWogmvzxrAAAAAElFTkSuQmCC";
	tl.className = "toolbutton";
	ti.name = "toolbox";
	ti.type = "radio";
	ti.checked = true;
	ti.id = "delete";
	ts.appendChild(tim);
	tl.appendChild(ti);
	tl.appendChild(ts);
	toolbox.appendChild(tl);
}

function createtool(e) {
	addtoolbutton.removeEventListener("click", createtool);
	addtooldialog.style.display = "none";
	selectimagebutton.innerHTML = "select image";
	var img = new Image();
	img.src = toolimage.src;
	var tool = {name: toolname, image: img};
	tools.push(tool);
	var tl = ce("label");
	var ti = ce("input");
	var ts = ce("span");
	var tim = ce("img");
	tl.className = "toolbutton";
	ti.name = "toolbox";
	ti.type = "radio";
	ti.checked = true;
	ti.id = tool.name;
	tim.src = toolimage.src;
	ts.appendChild(tim);
	tl.appendChild(ti);
	tl.appendChild(ts);
	toolbox.appendChild(tl);
	selectimagebutton.removeEventListener("click", selectimage);
	toolimage.src = "";
}

function isdrawgrid() { return $("#drawgrid").checked; }

function draw() {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgba(200, 200, 200, 1.0)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.scale(zoom, zoom);
	ctx.translate(offset.x, offset.y);

	ctx.strokeStyle = "black";
	ctx.strokeRect(0, 0, map.w * tile.w, map.h * tile.h);
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, map.w * tile.w, map.h * tile.h);

	map.layers.forEach(function(l, i) {
		l.forEach(function(a, y) {
			a.forEach(function(b, x) {
				if (b >= 0) {
					ctx.drawImage(tools[b].image, x * tile.w, y * tile.h);
				}
			});
		});
	});
	if (isdrawgrid()) drawgrid();
	drawcursor();
	ctx.restore();
	window.requestAnimationFrame(draw);
}

function drawcursor() {
	ctx.save();
	ctx.beginPath();
	ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
	ctx.fillRect(mouse.tx * tile.w, mouse.ty * tile.h, tile.w, tile.h);
	ctx.closePath();
	ctx.restore();
}

function drawgrid() {
	ctx.save();
	ctx.beginPath();
	ctx.strokeStyle = "rgba(100, 180, 225, 0.85)";
	for (var y = 1; y < map.h; y++) {
		ctx.moveTo(0, y*tile.h);
		ctx.lineTo(map.w*tile.w, y*tile.h);
	}
	for (var x = 1; x < map.w; x++) {
		ctx.moveTo(x*tile.w, 0);
		ctx.lineTo(x*tile.w, map.h*tile.h);
	}
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

(function init() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	addtoolimage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAXFJREFUeNpi/P//P8NAAhZSFIcffNIHpFLwKJkDxEWEzFlpL0OeAxj+M6RIq8jw4pJ+eudJiq2OTBHNQgAUW/hiDCxPyygAWfDvH375v/9o6YB/BELg3/APAUb8DgDJ/6dxFPz7i1+e5mkAfwjQ2gH/CYQAgTSCDTCCimK/TU8JlXBwIKwgjbMgevvg6Wci7Z2zyU+6CB4CwKBLEZLHbTAywBcCgrLEmfHu4dMUWJENdsA/YOr9+5d+FRDIPpQ0QChxURv8/4eWCP8DfU/PEPj/F80BIN/TNwoYsETB34GMAqCAqCBxml+8wS0nIUKcGZ8fYTiAcc7d88+JKgc4pCRxZjWgGUSWA4xzUAoiYoHT/Oef8Dngx7Pnn+X0JfkImbPAaChXRn8JVUbDuzoeDG1CQu0B2raI/hNokgHlaZ4GGAiEwH9apwEBKdzy718C0wAtm+XARv+c9+de4O0bAuUJm2MrwUBWSUgLwMQwwAAgwAAU5t/2cb/ymwAAAABJRU5ErkJggg==";
	savemapimage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAABH9JREFUWIXllV2IVGUYx3/P+573zMzOzqrTrrqmIiFFUV4pQhBSbGldeNGFFZTZdywFBhlFWCmxGSLdGISihCVUhBdSUREZBC1REUhBKKHGIJtbu7S77pzvt4tzZudr2YHdvQh64HzMOe+c///9P//neeD/HtL4Y/32g0NxHO2xFgfgVPmlRQO6d+yNGmCklD7w+ycv7AVSoFrEcbznrZfvd0pdLmP/XOWm0XMQeQtHd/IMhgMUu3JMXPWdIye/ehFoJ2CtdZYUcxz/8hyjV/7m7q6PkWBywfjWLXH6ygClJSW2blpLTeE2AgCI8O2ZYVavWcXYs2fp7i4tmMDU1CTVV76icukPtm5c2/ROteEDu5/cTpwk6QKlFnwA2CThkQcGSFrw2hQQEc5eHJ9x5zO7n2PnQ/fNe/cn3vuQof2vIQg/nRtly4ZVcxNAQClBMgbvHD48b3CAWzffxtjYXyCCUoLFzk1AEJQItQrVWi+IwMx3JVXXNuPPlgIQJUgmwRODg+x8cMe8gU+8/xFD+15FIFOgqfXMkgJS49VS8O7Ro/MGB7hjy51cvlzJUqCwtlMKpJaCGplFTkHL8zYCluYU7Hzs0UVKQc2EnQhYUFKvghPHjs8bHGDg9m1UKpfS6hLBtjSCtkZkrUWpehUsVogIogQrHUyY2HSx1im3SuXS4hBQqbc6piDJXLp8ZS8PH/wOm7XkunntzH2jo212sumpvjaFp6+3nLblTn0gyRb09/fR399XB7ApYA3AWpsdteezPGu4byQ+N4GkedXE+W+YvDCMbXXPHCFKE5c3MF28EaUErRTFUjeFQh7bYq1ZqqCZwOTFYZ7fs5ulS8sYx+A4BsdxMI5Ba4c4iYnjmCSOiaIIP/C5OjXF0IE3WX/LXYiyWJswMjKOKhY6t+IWAbBJQrncy2/nf+GzT79mYnwcgGt6VzD49OP4QYAfeOnV9wHL2tXrSOKIxFpsZOkuuBhjMhN2rIL2RGmt0dphdGSE5OanEGu5/OsR/DDAD3z8ICDwfcIwIJ8v1FVUAhZco9GO7mhCN01BGz5aaXJuDoBiIb1WgSgMiaKQKAwJoxBjXIxjZv5X23HO6Jkh1+CBEjBZIyBAD0DcmgPSeeBmBAqFHIKlCoRRRBiFhFGEUgrXGIxxkUxmpdLxmzMKlfWBBgVKQFjrhC6QSxWwLOkyNIbWmpybB6Cr4FLIVEh3HxHHEcZxMcbFNWamiYooRATXaESlJBoskAfcplashNGTp4fDG1b10NNAQilFzs1R7u3jzzOHGDlziO6eHsJG6Y3JDhfPq2YEmNm5am/FAnUPBIA/8v2xbT+z64PEsm7HPZtNYi2VLwAL165cw+v79uN5Hp7vpSXne4RhkPZ5UWil8TyfanUagP5leRIL3XmH5UsLFAo5pr0AJRIBHhA01kQOWFZcfv2KlZt2nYqtXAewqfQjStfVaHKItdTGZuOHLGDjkB8mN9IaIhITV9++8Pm+vcBE68gzQBepJzSzTMsFRgyEwDSpAnPOXNXh/XwJ/LfiXzXd0Z6Hu0QbAAAAAElFTkSuQmCC";
	savejsonimage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADD0lEQVR4nMWXTUhUURTHf/fNqDOiM6mJRVGI1sYWteiDKBAigj7IRR8kUrbKoMBVrYqgXYs2bdy0cFVUINEqkCBo2aKIIMyopoKsbHQEm/dx72kxI+rMm5n3XgP94cHlnvvO+b3DOffeB/9ZKuwLW57nVMxSV4DBEtM8cPLd/taZMP7iYQFEUI4nQ8A2H3MXEArACgsw3Z8yjhbjaMHvCavQGQCwvfCB6gbQ/CRr2bpi5hrC+qtZhI2PsxYwhmJ38QUL2Ao0+iz/KLBQHDsIp5zjbR+r+a+ZAQHxtMwAfUCsxvLuFeNPCvK1/Adrw0e/GjByC7gcAAIgAxzlVOeb+gAA3J8JClEIPriuZvDAAH0vFhSQ/DFnN2TnnRueNpUgMomm2EDPhpYpwH27r9X5J4CNk/OqKa52xixuKNgCOI4no5kvucO6HCLT1pY43dmRvKRgD7CoDQ8Ebn/oTy1GAuh8OrfdgkmgY8X0rOuZM9nvucOyDJFJpJOnU2uSowpOsrzBGYF7fzwZXjjS5oUCsCZ+t8YtngM7fMyz2jNn9M+5Qxg5oFqSF+Pp5tLgS/JEGHQH2h8GBxj/atEYvwZc93G4pCza3MTIKxpiV4GDVdZ+QWQvg+u/BgO4+7kXxUsgXcFheAnjuO55RnpX7eO+G1HCEg0MtKYTNas4qBbm82vyRuKAWxVg87OcSsQ5CwwR4b5QSe1rm38b4fV7+FYVwNGSdDVDQG+9ghfVI7ALmKgKkMsbReHLZ1GcEyEbJZpSnEU4geIccAzhAj6nZRnAoq2XhmmBO4CJBACpJR8KWiqtKwOQvLPS1l1qD6oVpd5d7fpS3gW2a2PMDNATNXgFeSj1vXTSv8rHprsQuuoPwBQjvau2ZL82pMkC1Op+rYM0gpoqmfRrQ8vVpIhwY64hi8LBVX0jytlGAJuI1V9DZT7L2zCvKQK4KJVDqWh3cGOagARK5RBpBJpZ1RwVAIptmKeQrhgS8R+gAG4X/QjwhyAZwPMEV9vUvwYgSAYY3gRj0zba1O0gAsCyBFUO8N/1Fx6gK9zz/XXfAAAAAElFTkSuQmCC";
	loadjsonimage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQdSURBVFiFzZfNixxFGIef6un52pnZ3cnmA+LBRfJHiIccvOSUoyAK3t2LAU85LREJBFRySATvQv6AEEWjJ1HJRTAHDSawuOaTndnp+dj+qnrr9ZD0MJuZ3WyyK+sLL910dfXvqV+9RVUbVeUwIzhU9f8DQAhw4cKFMM/zH0XkrRd1MMY47/3Hly5d+vIgAIyqcv78+VO1Wu33s2fPziVJQlEX3nsAJutEVbl582a2tbX1+uXLl5/sFyAEyPM8q9fr+vDhQzqdDqo6MwGMMZw4ccKtra29D3xxIADW2jTLMnPkSBsRwXu/TXjSCWMM9Xq9sb6+/sm5c+dWi+ezQlWt9/6DK1eufLMrAJBlWVbqdLp0Op0xQHEtRCaFlpeXG81mk1arhTEGYwwAQRCM7weDAbdu3VoFdgdYWlpKe71eqd1exFo7BTBrKoqI4xhgDDGZcRwjInM7iY8BVldX85WVlWBzc3PsADATpHBjMooRT4oHQVAA1F4IACAivtWaD9I0w3u/qwuTELPEiyyXyzjnqnsCUFXb7XbDbrc7BTDpxiwHdgLI8xwR2RuAiNhms1EvauD53K0OnnehKMRnAJU9A/R6EYUDuVO+Wz9K5oIdR71TFEBQQxpnFt788Fp/sr0UmBs/X333vW0AqprValUWFxcREfqJ4k3Ipytv71l4Jx5gHkCBTpTw+de/nikaxwDOuXwwGBJFEapKLzE06wsYE3D772i/EABUywGN0FAqmcdTACKSVSrlsQOJgYYtk+QO8fs/M6hCJYTuIAE161MA3vtsOBwVa5coLlMpn2QQO6zbH4CqkuaeWrnERi/BitydAhCRNAxDFhYWEBEeZQH1uSqDxJI72Yc4pFYQrzgpsxFtWa+6NgXgvU9GoxHOOUSEB/02rx1vMEocmfWvLJ5YwT+bQiuebj9OFe7PAkiNMbTbbZxz9B/PcapeYZg6cnk5AO8hF4912/tZUbr92KvXf6YARCSO4y2staTW00+a1GsV+nG+pyL0Hpz3iChuxvthYOhv5QxHab2qlb9mORDDUwd+uw/HluaJM0+SbR+FV0W8ogriFa+K98oLEcsBD570CQJz55ev3tmcBZAkSUKvF3H7yXGW35hncxCTO4+VYmSeVz3FiwvY2Oil3vtr25wZvyCSANwdHaVULlMJFWdz1HtCICxBtfRq4gDOWaJoqKNHf3w/BWCMMadPn5Z7UYM1W6LWDOn1RwSBmf21lwxVJYrSLO13bvx5/WLPmItzqhqPAYDSYDD44d7oyEdawgyjhGGUHIg4gILPogc/3fn2s6tAebLNTBwsWq2jJ0+GJjymaBCYwB6EuBOReCuquXSUAiPgsaqOi9BMbrPGmACo8tQZdxAAz6IKpECuqtuWlXmZff6/iEP/Nzx0gH8BEAAaGj6CEdwAAAAASUVORK5CYII=";
	addlayerimage.src = "data:image/png;base64,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";
	createpanel.style.top = "40%";
	createpanel.style.left = "40%";
	savedialog.style.top = "40%";
	savedialog.style.left = "40%";
	addtooldialog.style.left = "40%";
	addtooldialog.style.top = "40%";
	addtooldialog.style.minHeight = "100px";
	toolpanel.style.top = "32px";
	toolpanel.style.right = "32px";
	if (newmap) {
		createpanel.style.display = "block";
	} else {
		toolpanel.style.display = "block";
	}
	inittools();
})();

