$(document).ready(function() {
	init();
});
var powers = {};
currentzoom = 1;

var displayListRaw = [
	{
		name: "Planck Sekund",
		coefficient: 5.4,
		exponent: -44

	},
	{
		name: "yottasecond",
		coefficient: 1,
		exponent: 24
	},
	{
		name: "microcentury",
		coefficient: 3.156,
		exponent: 3
	},
	{
		name: "attosecond",
		coefficient: 1,
		exponent: -18
	},
	{
		name: "year",
		coefficient: 3.154,
		exponent: 7
	},
	{
		name: "semester",
		coefficient: 1.577,
		exponent: 7
	},
	{
		name: "olympiad",
		coefficient: 1.261,
		exponent: 8
	},
	{
		name: "galactic year",
		coefficient: 7.253,
		exponent: 15
	},
	{
		name: "aeon",
		coefficient: 3.154,
		exponent: 16
	},
	{
		name: "half life of Ca-40",
		coefficient: 9.5,
		exponent: 28
	},
	{
		name: "jiffy (physics)",
		coefficient: 3,
		exponent: -24
	},
	{
		name: "zeptosecond",
		coefficient: 1,
		exponent: -21
	},
	{
		name: "cesium-133 transition",
		coefficient: 1.0878,
		exponent: -10
	},
	{
		name: "Second",
		coefficient: 1,
		exponent: 0
	},
	{
		name: "Minute",
		coefficient: 6,
		exponent: 1
	},
	{
		name: "Hour",
		coefficient: 3.6,
		exponent: 3
	}
];

var displayListParsed = [];

var secondCounter = null;
var secondSinceLoad = {
	coefficient: 0,
	exponent: 0
};


function init() {
	updateScaleDisplay()
	var s = Snap("#svg");

	secondCounter = s.rect(0, 0, 1, "100%")
	secondCounter.attr({
	    fill: "#00f"
	});

	// sort displayListRaw
	var compExponentObject = function(a, b) {
		// if exponent same: compare coefficient, else compare exponent
		return a.exponent == b.exponent ? a.coefficient - b.coefficient : a.exponent - b.exponent;
	}
	displayListRaw = displayListRaw.sort(compExponentObject);

	// init displays

	for(var i = 0; i < displayListRaw.length; i++) {
		thisitem = displayListRaw[i];
		xstart = chooseposition(thisitem.exponent, currentzoom, thisitem.coefficient);

		itemline = s.rect(xstart, 0, 1, "100%")
		itemline.attr({
			fill: "#f00"
		});

		itemtext = s.text(xstart + 5, ((i * 30) % 250) + 20, [thisitem.name + ": " + thisitem.coefficient + " * 10", thisitem.exponent, " s"]);
		itemtext.attr({
			fill: "#fff",
			"font-family": "Sans-serif",
			"opacity": Math.min((xstart-5)/50, 1)
		})
		.selectAll("tspan")[1].attr({
			"baseline-shift": "super"
		});

		displayListParsed[i] = {
			line: itemline,
			text: itemtext,
			coefficient: thisitem.coefficient,
			exponent: thisitem.exponent
		}

	}


	// init power of ten markers
	for(var i = -45; i <= 30; i++) {
		// xstart are values for the exponent markers.
		xstart = chooseposition(i, currentzoom);

		zoomline = s.rect(xstart, 0, 1, "100%")
		zoomline.attr({
		    fill: "#eee",
		    opacity: 0.6
		});

		zoomtext = s.text(xstart + 5, 20, ["10", i, " s"]);
		zoomtext.attr({
			fill: "#fff",
			"font-family": "Sans-serif",
			"opacity": Math.min((xstart-5)/50, 1),
			"font-size": "10px"
		})
		.selectAll("tspan")[1].attr({
			"baseline-shift": "super"
		});

		powers[i] = {
			line: zoomline,
			text: zoomtext
		};
	}
}

function updatezoom() {
	updateScaleDisplay();
	//testpos = testnum.first * chooseposition(testnum.exponent, currentzoom);
	//testline.animate({x: testpos}, 0, mina.easeinout);

	// update second counter
	$.Velocity(secondCounter.node, {x:chooseposition(secondSinceLoad.exponent, currentzoom, secondSinceLoad.coefficient)}, {duration: 300, queue: false})

	for(var key in powers) {
		var newpos = chooseposition(parseInt(key), currentzoom)
		
		// update zoom
		// powers[key].line.animate({x: newpos}, 300, mina.easeinout);
		//powers[key].line.attr({x:newpos})
		
		$.Velocity(powers[key].line.node, {x:newpos}, {duration: 300, queue: false, easing: "ease-out"})
		//powers[key].text.animate({x: newpos + 5}, 300, mina.easeinout);
		
		//powers[key].text.attr({
		//	x: newpos + 5,
		//	"opacity": Math.min((newpos-5)/50, 1)}
		//)

		$.Velocity(powers[key].text.node, 
			{
				x: newpos + 5,
				"opacity": Math.min((newpos-5)/50, 1)
			}, 
			{
				duration: 300,
				queue: false,
				easing: "ease-out"
			}
		)
		
		// text fade out
		//powers[key].text.animate({"opacity": Math.min((newpos-5)/50, 1)}, 300, mina.easeinout)
	}


	for(var i = 0; i < displayListParsed.length; i++) {
		var newpos = chooseposition(displayListParsed[i].exponent, currentzoom, displayListParsed[i].coefficient);

		$.Velocity(displayListParsed[i].line.node, {x:newpos}, {duration: 300, queue: false, easing: "ease-out"});

		$.Velocity(displayListParsed[i].text.node, 
			{
				x: newpos + 5,
				"opacity": Math.min((newpos-5)/50, 1)
			}, 
			{
				duration: 300,
				queue: false,
				easing: "ease-out"
			}
		)

	}
}


// line.animate({x:300}, 10000)

$(window).bind("mousewheel", function(e) {
	//console.log(e.originalEvent.wheelDelta)
	changeAmount = Math.abs(e.originalEvent.wheelDelta / 1000);
	// console.log(changeAmount)
	if(e.originalEvent.wheelDelta > 0) {
		currentzoom = currentzoom + changeAmount ;
		updatezoom();
	} 
	else {
		currentzoom = currentzoom - changeAmount;
		updatezoom();
	}
})

setInterval(function() {
	secondSinceLoad.coefficient += 1/(10**secondSinceLoad.exponent)
	$.Velocity(secondCounter.node, {x:chooseposition(secondSinceLoad.exponent, currentzoom, secondSinceLoad.coefficient)}, {duration: 100, queue: false})
}, 1000)

$(window).resize(updateScaleDisplay)

function updateScaleDisplay() {
	// Math.log10(window.innerWidth/10**currentzoom)
	// log_n(a/b) = log_n(a) - log_n(b)
	$("#screenwidthPower").html(Math.round((Math.log10(window.innerWidth) - currentzoom)*100)/100)
}

function chooseposition(itemexp, zoomexp, coefficient=1) {
	// choose position based on screen bounds.

	// if xstart is less than 10^-3
	if (itemexp + zoomexp < -3) {
		// too small value
		return 0;
	}
	// if xstart is larger than screen * 1.3
	else if (itemexp + zoomexp > Math.log10(window.screen.width * 1.3)) {
		// too large value
		return window.screen.width * 1.3;
	}
	else {
		// return real position value
		return coefficient * 10**(itemexp + zoomexp);
	}
}