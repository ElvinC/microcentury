
// exponent markers.
var powers = {};

// current viewport zoom (log)
currentzoom = -0.8;

// raw
displayListRaw = []

$(document).ready(function() {
	
	$.get('units.csv', function(data) {
		// console.log(data)
		displayListRaw = $.csv.toObjects(data, {'separator':';'});
		init();
	});
});

var displayListParsed = [];

var secondCounter = null;
var secondSinceLoad = {
	coefficient: 0,
	exponent: 0
};


function init() {
	// initiate all objects
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


	// init display and parse displayListRaw
	for(var i = 0; i < displayListRaw.length; i++) {

		// get item from raw list
		thisitem = displayListRaw[i];
		var thisCoefficient = parseFloat(thisitem.coefficient);
		var thisExponent = parseFloat(thisitem.exponent);
		var thisName = thisitem.name;
		var thisDescription = thisitem.description;

		// calculate x coordinate
		xstart = chooseposition(thisExponent, currentzoom, thisCoefficient);

		// create svg rectangle
		itemline = s.rect(xstart, 0, 2, "100%")
		itemline.attr({
			fill: "#f55"
		});

		// create text label with superscripts
		itemtext = s.text(xstart + 5, ((i * 30) % 250) + 40, [thisName + ": " + thisCoefficient + " * 10", thisExponent, " s"]);
		itemtext.attr({
			"fill": "#fff",
			"font-family": "Sans-serif",
			"opacity": Math.min((xstart-5)/50, 1),
			"cursor": xstart > 10 ? "pointer": "default",
			"data-id": i,
			"display": xstart > 3 ? "block": "none"
		})
		.selectAll("tspan")[1].attr({
			"baseline-shift": "super"
		});

		// click handler, display information
		itemtext.click(displayDescription)

		// save to parsed item list.
		displayListParsed[i] = {
			line: itemline,
			text: itemtext,
			coefficient: thisCoefficient,
			exponent: thisExponent,
			name: thisName,
			description: thisDescription
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
			"font-size": "10px",
			"cursor": "default"
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

// display description on click
function displayDescription() {
	var id = this.attr("data-id");
	var item = displayListParsed[this.attr("data-id")];
	var wikibox = $("#wiki")
	wikibox.removeClass('wikion');
	wikibox.addClass('wikioff')

	// display short description
	var desc = $("#description")
	desc.html("")
	var shortDesc = $("<div></div>")
	shortDesc.html( item.name + ": " + (item.description == ""? "No description": item.description))
	desc.append(shortDesc);

	// wiki toggle button
	var wikiToggle = $('<div id="wikitoggle">Toggle wikipedia article (uses search API, may return unexpected results!)</div>"')
	wikiToggle.click(function() {
		wikibox.toggleClass('wikion wikioff');
	})

	// Search wikipedia
	$.getJSON('//en.wikipedia.org/w/api.php?action=query&list=search&format=json&callback=?&srsearch=' + encodeURI(item.name), function(data, textStatus) {
			//var markup = data.parse.text["*"];
			//var blurb = $('<div></div>').html(markup);
			//$("#wiki").html(blurb)

			if(data.query.search.length >= 1) {
				$("#wikiframe").attr("src", "//en.wikipedia.org/wiki/" + data.query.search[0].title);
				desc.append(wikiToggle)
			}
			else {
				$("#wikiframe").attr("src", "")
			}
	});

}


function updatezoom() {
	updateScaleDisplay();
	//testpos = testnum.first * chooseposition(testnum.exponent, currentzoom);
	//testline.animate({x: testpos}, 0, mina.easeinout);

	// update second counter
	$.Velocity(secondCounter.node, {x:chooseposition(secondSinceLoad.exponent, currentzoom, secondSinceLoad.coefficient)}, {duration: 300, queue: false})

	for(var key in powers) {
		var newpos = chooseposition(parseInt(key, 10), currentzoom)
		
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
	}


	for(var i = 0; i < displayListParsed.length; i++) {
		var newpos = chooseposition(displayListParsed[i].exponent, currentzoom, displayListParsed[i].coefficient);

		$.Velocity(displayListParsed[i].line.node, {x:newpos}, {duration: 300, queue: false, easing: "ease-out"});

		$.Velocity(displayListParsed[i].text.node, 
			{
				x: newpos + 5,
				"opacity": Math.min((newpos-5)/50, 1),
			}, 
			{
				duration: 300,
				queue: false,
				easing: "ease-out"
			}
		)

		displayListParsed[i].text.attr({
			"cursor": newpos > 10 ? "pointer": "default",
			"display": newpos > 3 ? "block": "none"
		});

	}
}


// line.animate({x:300}, 10000)

// mouse zoom
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


// keyboard zoom

// prevent repeat. TODO: Smoother keyboard zoom
var repeat = false;

$(window).keydown(function(e) {
	var changeAmount = 0.5;
	if (!repeat) {
		repeat = true
		if(e.which === 37) {
			currentzoom = currentzoom + changeAmount ;
			updatezoom();
		}

		else if (e.which === 39) {
			currentzoom = currentzoom - changeAmount;
			updatezoom();
		}
	}
})

$(window).keyup(function(e) {
	repeat = false;
});

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

// https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=Jimi%20Hendrix&callback=?
// https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=Richard%20Feynman