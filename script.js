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


// TODO: remove redundant code.
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
var powers = {}; // exponent markers.
var currentzoom = -0.8; // current viewport zoom (log)
var displayListRaw = []; // raw data for use later.
var displayListParsed = [];
var currentInnerWidth = window.innerWidth * 1.5; // window width
var secondCounter = null; // second counter object
var secondSinceLoad = new ExponentialNumber(0, 0); // keep track of seconds.

$(document).ready(function() {
	
	$.get('units.csv', function(data) {
		// console.log(data)
		displayListRaw = $.csv.toObjects(data, {'separator':';'});
		init();
	});
});




function init() {
	// initiate all objects
	updateScaleDisplay();
	var s = Snap("#svg");

	secondCounter = s.rect(0, 0, 1, "100%");
	secondCounter.attr({
	    fill: "#00f"
	});

	// sort displayListRaw
	var compExponentObject = function(a, b) {
		// if exponent same: compare coefficient, else compare exponent
		return a.exponent == b.exponent ? a.coefficient - b.coefficient : a.exponent - b.exponent;
	};

	displayListRaw = displayListRaw.sort(compExponentObject);


	// init display and parse displayListRaw
	for(var i = 0; i < displayListRaw.length; i++) {

		// get item from raw list
		thisitem = displayListRaw[i];
		var thisValue = new ExponentialNumber(parseFloat(thisitem.coefficient), parseFloat(thisitem.exponent));
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
	for(var i = -45; i <= 39; i++) {

		var thisValue = new ExponentialNumber(1, i);
		// xstart are values for the exponent markers.
		xstart = choosePosition(thisValue, currentzoom);

		zoomline = s.rect(xstart, 0, 1, "100%");
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
			text: zoomtext,
			value: thisValue
		};
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
	$("#convert").html("");
	$("#convert").append(convertInput);

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

function updatezoom() {
	updateScaleDisplay();
	//testpos = testnum.first * choosePosition(testnum.exponent, currentzoom);
	//testline.animate({x: testpos}, 0, mina.easeinout);

	// update second counter
	$.Velocity(secondCounter.node, {x:choosePosition(secondSinceLoad, currentzoom)}, {duration: 300, queue: false});

	for(var key in powers) {
		var newpos = choosePosition(powers[key].value, currentzoom);

		if (newpos > currentInnerWidth * 3) {
			break;
		}
		
		// update zoom

		// if ouside bounds, don't animate - faster render.
		if (newpos != 0) {

			$.Velocity(powers[key].line.node, {x:newpos}, {duration: 300, queue: false, easing: "ease-out"});
			

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
			);

		}
	}


	for(var i = 0; i < displayListParsed.length; i++) {
		var newpos = choosePosition(displayListParsed[i].value, currentzoom);

		// if outside frame a lot, exit loop
		if (newpos > currentInnerWidth * 3) {
			break;
		}

		// performance optimization, don't animate outside bounds.
		if (newpos != 0) {
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
			);

			displayListParsed[i].text.attr({
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

// prevent repeat. TODO: Smoother keyboard zoom
var repeat = false;

$(window).keydown(function(e) {
	var changeAmount = 0.3;
	if (!repeat) {
		repeat = true;
		if(e.which === 37) {
			currentzoom = currentzoom + changeAmount ;
			updatezoom();
		}

		else if (e.which === 39) {
			currentzoom = currentzoom - changeAmount;
			updatezoom();
		}
	}
});

$(window).keyup(function(e) {
	repeat = false;
});

setInterval(function() {
	secondSinceLoad.coefficient += Math.pow(10, -secondSinceLoad.exponent);
	//console.log(secondSinceLoad);
	if (secondSinceLoad.coefficient >= 10) {
		// if coefficient is over 10, change exponent
		secondSinceLoad = new ExponentialNumber(secondSinceLoad.coefficient, secondSinceLoad.exponent);
	}
	var newpos = choosePosition(secondSinceLoad, currentzoom);

	if (newpos != 0 || newpos < currentInnerWidth * 1.25) {
		$.Velocity(secondCounter.node, {x: newpos}, {duration: 100, queue: false});
	}
	
}, 1000);

$(window).resize(updateScaleDisplay);

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