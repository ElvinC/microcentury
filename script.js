// TODO: clean up file.

// exponent number constructor function
function ExponentialNumber(coefficient, exponent = 0) {
	// normalize units

	if (coefficient == 0) {
		this.coefficient = 0;
		this.exponent = 0;
	}
	else if (coefficient < 1 || coefficient >= 10) {
		var powChange = Math.floor(Math.log10(coefficient));
		this.coefficient = coefficient / Math.pow(10, powChange);
		this.exponent = exponent + powChange;

	}
	else {
		this.coefficient = coefficient;
		this.exponent = exponent;
	}
}


function expMultiply(A, B) {
	// multiply two ExponentialNumber objects. Probably a terrible implementation...
	var coeProduct = A.coefficient * B.coefficient;
	var newExp = (A.exponent + B.exponent + (coeProduct >= 10));
	var newCoe = coeProduct >= 10 ? coeProduct/10 : coeProduct;
	return new ExponentialNumber(newCoe, newExp);
}

function expDivision(A, B) {
	// multiply two ExponentialNumber objects. Probably a terrible implementation...
	var coeResult = A.coefficient / B.coefficient;
	var newExp = (A.exponent - B.exponent - (coeResult < 1));
	var newCoe = coeResult < 1 ? coeResult * 10 : coeResult;
	return new ExponentialNumber(newCoe, newExp);
}

function formatExp(num) {
	return num.coefficient + " · 10^" + num.exponent;
}



// global variables, TODO: find better way.
var powers = []; // exponent markers.
var currentzoom = -0.8; // current viewport zoom (log)
var displayListParsed = [];
var currentInnerWidth = window.innerWidth * 1.5; // window width
var secondCounter = {
	line: null,
	seconds: new ExponentialNumber(0, 0)
}; // keep track of seconds
var mouseMarker = {};

$(document).ready(function() {
	
	$.get('units.csv', function(data) {
		// console.log(data)
		var displayListRaw = $.csv.toObjects(data, {'separator':';'});
		init(displayListRaw);
	});
});




function init(displayListRaw) {
	// initiate all objects
	updateScaleDisplay();
	var s = Snap("#svg");

	secondCounter.line = s.rect(0, 0, 1, "100%");
	secondCounter.line.attr({
	    fill: "#00f"
	});

	
	mouseMarker.line =	 s.rect(0, 0, 1, "100%");
	mouseMarker.line.attr({
	    fill: "#e0f",
	    opacity: 0.5
	});

	mouseMarker.text = s.text(5, 200, 123);
	mouseMarker.text.attr({
		"fill": "#fff",
		"font-family": "Sans-serif",
		"display": "none",
		"cursor": "default",
		"opacity": 0.5
	});

	$("#wrapper").mousemove(function(e) {
		var mousePos = new ExponentialNumber(Math.pow(10, Math.log10(e.clientX) - currentzoom), 0);
		mouseMarker.line.attr("x", e.clientX);
		mouseMarker.text.attr({
			"display": "block",
			"x": e.clientX + 5,
			"y": e.clientY - 100,
			"text": [mousePos.coefficient.toFixed(2) + " · 10", mousePos.exponent, " s"]
		})
		.selectAll("tspan")[1].attr({
			"baseline-shift": "super"
		});
	});

	$("#wrapper").mouseleave(function(e) {
		mouseMarker.line.attr("x", 0);
		mouseMarker.text.attr({
			"display": "none",
			"x": 0
		});
	});

	// sort displayListRaw
	var compExponentObject = function(a, b) {
		// if exponent same: compare coefficient, else compare exponent
		return a.exponent == b.exponent ? a.coefficient - b.coefficient : a.exponent - b.exponent;
	};

	var displayListSorted = displayListRaw.sort(compExponentObject);
	var thisValue = 0;

	// init display and parse displayListRaw
	for(var i = 0; i < displayListSorted.length; i++) {

		// get item from raw list
		thisitem = displayListSorted[i];
		thisValue = new ExponentialNumber(parseFloat(thisitem.coefficient), parseFloat(thisitem.exponent));
		var thisName = thisitem.name;
		var thisDescription = thisitem.description;

		// calculate x coordinate
		xstart = choosePosition(thisValue, currentzoom);

		// create svg rectangle
		itemline = s.rect(xstart, 0, 2, "100%");
		itemline.attr({
			fill: "#f55"
		});


		// create text label with superscripts
		itemtext = s.text(xstart + 5, ((i * 30) % 250) + 40, [thisName + ": " + thisValue.coefficient + " · 10", thisValue.exponent, " s"]);
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
		itemtext.click(displayDescription);

		// save to parsed item list.
		displayListParsed[i] = {
			line: itemline,
			text: itemtext,
			value: thisValue,
			name: thisName,
			description: thisDescription
		};

	}


	// init power of ten markers
	for(var j = -45; j <= 39; j++) {

		thisValue = new ExponentialNumber(1, j);
		// xstart are values for the exponent markers.
		xstart = choosePosition(thisValue, currentzoom);

		zoomline = s.rect(xstart, 0, 1, "100%");
		zoomline.attr({
		    fill: "#eee",
		    opacity: 0.6
		});

		zoomtext = s.text(xstart + 5, 20, ["10", j, " s"]);
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

		powers.push({
			line: zoomline,
			text: zoomtext,
			value: thisValue
		});
	}
}

// display description on click
function displayDescription() {
	var id = this.attr("data-id");
	var item = displayListParsed[this.attr("data-id")];
	var wikibox = $("#wiki");
	wikibox.removeClass('wikion');
	wikibox.addClass('wikioff');

	// display short description
	var desc = $("#description");
	desc.html("");
	var shortDesc = $("<div></div>");
	shortDesc.html( item.name + ": " + (item.description == ""? "No description": item.description));
	desc.append(shortDesc);

	// wiki toggle button
	var wikiToggle = $('<div id="wikitoggle">Toggle wikipedia article (uses search API, may return unexpected results!)</div>"');
	wikiToggle.click(function() {
		wikibox.toggleClass('wikion wikioff');
	});

	// Search wikipedia
	$.getJSON('//en.wikipedia.org/w/api.php?action=query&list=search&format=json&callback=?&srsearch=' + encodeURI(item.name), function(data, textStatus) {
			//var markup = data.parse.text["*"];
			//var blurb = $('<div></div>').html(markup);
			//$("#wiki").html(blurb)

			if(data.query.search.length >= 1) {
				$("#wikiframe").attr("src", "//en.wikipedia.org/wiki/" + data.query.search[0].title);
				desc.append(wikiToggle);
			}
			else {
				$("#wikiframe").attr("src", "");
			}
	});

	// display conversion.

	// create input field
	var convertInput = $('<input class="typeahead" type="text" placeholder="Convert to...">');
	var convertContainer = $("#convert");
	convertContainer.html("");
	convertContainer.append(convertInput);

	// function for finding matches
	var findMatches = function(q, cb) {

		// array of search matches
		var matches = [];

		q = q.toLowerCase();

		// regex for finding substring
		var substringRegex = new RegExp(q, 'i');

		// go through each item, push to list if item matches query.
		$.each(displayListParsed, function(i, lstItem) {
			if (substringRegex.test(lstItem.name)) {
				matches.push(lstItem);
			}
		});

		matches = matches.sort(function(a, b) {
			return a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q);
		});


		cb(matches);
	};

	convertInput.typeahead({
		hint: true,
		highlight: true,
		minLength: 1
	},
	{
		nme: 'name',
		source: findMatches,
		displayKey: 'name'
	});

	convertInput.bind("typeahead:select" , function(event, compareItem) {
		var result = expDivision(item.value, compareItem.value);
		// display conversion.
		$("#convert").append('<div>1 "' + item.name + '" = ' + Math.round(result.coefficient * 10000) / 10000 + " · 10" + '<sup>' + result.exponent + '</sup> "' + compareItem.name + '"</div>');
	});

}

function updatezoom(refresh=false) {
	updateScaleDisplay();

	// update second counter
	$.Velocity(secondCounter.line.node, {x:choosePosition(secondCounter.seconds, currentzoom)}, {duration: 300, queue: false});
	var newpos = 0;
	for(var i = 0; i < powers.length; i++) {

		newpos = choosePosition(powers[i].value, currentzoom);
		
		// stop loop if current and new pos is outside screen
		if (parseInt(powers[i].line.attr("x"), 10) > currentInnerWidth * 1.1 && newpos > currentInnerWidth * 1.1 && !refresh) {
			break;
		}

		// if ouside bounds, don't animate - faster render.
		if (newpos != 0) {

			$.Velocity(powers[i].line.node, {x:newpos}, {duration: 300, queue: false, easing: "ease-out"});
			$.Velocity(powers[i].text.node, 
				{
					x: newpos + 5,
					"opacity": Math.min((newpos-5)/50, 1)
				}, 
				{
					duration: 300,
					queue: false,
					easing: "ease-out"
				}
			);
		}
	}


	for(var j = 0; j < displayListParsed.length; j++) {
		newpos = choosePosition(displayListParsed[j].value, currentzoom);

		// stop loop of outside screen bounds
		if (parseInt(displayListParsed[j].line.attr("x"), 10) > currentInnerWidth * 1.1 && newpos > currentInnerWidth * 1.1 && !refresh) {
			break;
		}

		// performance optimization, don't animate outside bounds.
		if (newpos != 0) {
			$.Velocity(displayListParsed[j].line.node, {x:newpos}, {duration: 300, queue: false, easing: "ease-out"});

			$.Velocity(displayListParsed[j].text.node, 
				{
					x: newpos + 5,
					"opacity": Math.min((newpos-5)/50, 1),
				}, 
				{
					duration: 300,
					queue: false,
					easing: "ease-out"
				}
			);

			displayListParsed[j].text.attr({
				"cursor": newpos > 10 ? "pointer": "default",
				"display": newpos > 3 ? "block": "none"
			});
		}

	}
}


// line.animate({x:300}, 10000)

// mouse zoom
$(window).bind("mousewheel", function(e) {
	//console.log(e.originalEvent.wheelDelta)
	changeAmount = e.originalEvent.wheelDelta / 1000;
	currentzoom = currentzoom + changeAmount ;
	updatezoom();
});


// keyboard zoom

// limit speed
var repeat = false;

$(window).keydown(function(e) {
	var changeAmount = 0.1;
	if (!repeat) {
		if(e.which === 37) {
			keyTimeout();
			currentzoom = currentzoom + changeAmount;
			updatezoom();
		}

		else if (e.which === 39) {
			keyTimeout();
			currentzoom = currentzoom - changeAmount;
			updatezoom();
		}
	}
});

function keyTimeout() {
	// set timeout for key repeat
	repeat = true;
	setTimeout(function() {
		repeat = false;
	}, 50);
}

$(window).keyup(function(e) {
	repeat = false;
});

// second counter
setInterval(function() {
	secondCounter.seconds.coefficient += Math.pow(10, -secondCounter.seconds.exponent);
	//console.log(secondCounter.seconds);
	if (secondCounter.seconds.coefficient >= 10) {
		// if coefficient is over 10, change exponent
		secondCounter.seconds = new ExponentialNumber(secondCounter.seconds.coefficient, secondCounter.seconds.exponent);
	}
	var newpos = choosePosition(secondCounter.seconds, currentzoom);

	if (newpos != 0 || newpos < currentInnerWidth * 1.25) {
		$.Velocity(secondCounter.line.node, {x: newpos}, {duration: 100, queue: false});
	}
	
}, 1000);

$(window).resize(function() {
	// update zoom with full refresh
	updatezoom(true);
});

function updateScaleDisplay() {
	// Math.log10(window.innerWidth/10**currentzoom)
	// log_n(a/b) = log_n(a) - log_n(b)
	currentInnerWidth = window.innerWidth;
	$("#screenwidthPower").html(Math.round((Math.log10(currentInnerWidth) - currentzoom)*100)/100);
}

function choosePosition(value, zoomexp) {
	// choose position based on screen bounds.

	// if xstart is less than 10^-3
	if (value.exponent + zoomexp < -3) {
		// too small value
		return 0;
	}
	// if xstart is larger than screen * 1.3
	else if (value.exponent + zoomexp > Math.log10(currentInnerWidth * 1.3)) {
		// too large value
		return currentInnerWidth * 1.3;
	}
	else {
		// return real position value
		return value.coefficient * Math.pow(10, (value.exponent + zoomexp));
	}
}


