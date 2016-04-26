/**********************************************************************************
 * USER HELP FUNCTIONS:  The following functions handle the processing 
 * for user help popup windows for the detail canvas and the detail canvas buttons.
 **********************************************************************************/

/**********************************************************************************
 * FUNCTION - userHelpOpen: This function handles all of the tasks necessary to 
 * generate help pop-up panels for the detail heat map and the detail heat map 
 * classification bars.  
 **********************************************************************************/
function userHelpOpen(e){ 
    userHelpClose();
    clearTimeout(detailPoint);
    var orgW = window.innerWidth+window.pageXOffset;
    var orgH = window.innerHeight+window.pageYOffset;
    var helptext = getDivElement("helptext");    
    helptext.style.position = "absolute";
    document.getElementsByTagName('body')[0].appendChild(helptext);
    var rowElementSize = dataBoxWidth * detCanvas.clientWidth/detCanvas.width; // px/Glpoint
    var colElementSize = dataBoxHeight * detCanvas.clientHeight/detCanvas.height;

    // pixels
    var rowClassWidthPx = getRowClassPixelWidth();
    var colClassHeightPx = getColClassPixelHeight();
    var rowDendroWidthPx =  getRowDendroPixelWidth();
    var colDendroHeightPx = getColDendroPixelHeight();
	var mapLocY = e.layerY - colClassHeightPx - colDendroHeightPx;
	var mapLocX = e.layerX - rowClassWidthPx - rowDendroWidthPx;
	
    if (isOnObject(e,"map")) {
    	var row = Math.floor(currentRow + (mapLocY/colElementSize)*getSamplingRatio('row'));
    	var col = Math.floor(currentCol + (mapLocX/rowElementSize)*getSamplingRatio('col'));
    	var rowLabels = heatMap.getRowLabels().labels;
    	var colLabels = heatMap.getColLabels().labels;
    	var helpContents = document.createElement("TABLE");
    	setTableRow(helpContents, ["<u>"+"Data Details"+"</u>", "&nbsp;"], 2);
    	setTableRow(helpContents,["&nbsp;Value:", heatMap.getValue(MatrixManager.DETAIL_LEVEL,row,col).toFixed(5)]);
    	setTableRow(helpContents,[ "&nbsp;Row:", rowLabels[row-1]]);
    	setTableRow(helpContents,["&nbsp;Column:", colLabels[col-1]]);
    	helpContents.insertRow().innerHTML = formatBlankRow();
    	var rowCtr = 8;
    	var writeFirstCol = true;
    	var pos = col;
		var classBars = heatMap.getRowClassificationData(); 
   	    var classLen = Object.keys(classBars).length;
    	if (classLen > 0) {
			setTableRow(helpContents, ["&nbsp;<u>"+"Row Classifications"+"</u>", "&nbsp;"], 2);
	    	for (var key in classBars){
	    		setTableRow(helpContents,["&nbsp;&nbsp;&nbsp;"+key+":"+"</u>", classBars[key].values[pos-1]]);	    		
	    		rowCtr++;
	    	}
    	}
    	helpContents.insertRow().innerHTML = formatBlankRow();
		var classBars = heatMap.getColClassificationData(); 
   	    var classLen = Object.keys(classBars).length;
    	if (classLen > 0) {
			setTableRow(helpContents, ["&nbsp;<u>"+"Column Classifications"+"</u>", "&nbsp;"], 2);
	    	for (var key in classBars){
	    		setTableRow(helpContents,["&nbsp;&nbsp;&nbsp;"+key+":"+"</u>", classBars[key].values[pos-1]]);	    		
	    		rowCtr++;
	    	}
    	}
        helptext.style.display="inherit";
    	helptext.appendChild(helpContents);
    	locateHelpBox(e, helptext);
    } else if (isOnObject(e,"rowClass") || isOnObject(e,"colClass")) {
    	var pos, value;
    	var hoveredBar, hoveredBarColorScheme;                                                     //coveredWidth = 0, coveredHeight = 0;
    	if (isOnObject(e,"colClass")) {
    		var coveredHeight = detCanvas.clientHeight*detailDendroHeight/detCanvas.height
    		pos = Math.floor(currentCol + (mapLocX/rowElementSize));
    		var classBarsConfig = heatMap.getColClassificationConfig(); 
			var keys = Object.keys(classBarsConfig);
			for (var i = keys.length-1; i >= 0; i--) {
				var key = keys[i];
    			var currentBar = classBarsConfig[key];
    			if (currentBar.show === 'Y') {
	        		coveredHeight += detCanvas.clientHeight*currentBar.height/detCanvas.height;
	        		if (coveredHeight >= e.layerY) {
	        			hoveredBar = key;
	        			hoveredBarValues = heatMap.getColClassificationData()[key].values;
	        			break;
	        		}
    			}
    		}
        	var colorMap = heatMap.getColorMapManager().getColorMap("col",hoveredBar);
    	} else {
    		var coveredWidth = detCanvas.clientHeight*detailDendroWidth/detCanvas.height
    		pos = Math.floor(currentRow + (mapLocY/colElementSize));
    		var classBarsConfig = heatMap.getRowClassificationConfig(); 
    		for (var key in classBarsConfig){
    			var currentBar = classBarsConfig[key];
    			if (currentBar.show === 'Y') {
	        		coveredWidth += detCanvas.clientWidth*currentBar.height/detCanvas.width;
	        		if (coveredWidth >= e.layerX){
	        			hoveredBar = key;
	        			hoveredBarValues = heatMap.getRowClassificationData()[key].values;
	        			break;
	        		}
    			}
    		}
    		var colorMap = heatMap.getColorMapManager().getColorMap("row",hoveredBar);
    	}
    	var value = hoveredBarValues[pos-1];
    	var colors = colorMap.getColors();
    	var classType = colorMap.getType();
    	if (value == 'null') {
        	value = "Missing Value";
    	}
    	var thresholds = colorMap.getThresholds();
    	var thresholdSize = 0;
    	// For Continuous Classifications: 
    	// 1. Retrieve continuous threshold array from colorMapManager
    	// 2. Retrieve threshold range size divided by 2 (1/2 range size)
    	// 3. If remainder of half range > .75 set threshold value up to next value, Else use floor value.
    	if (classType == 'continuous') {
    		thresholds = colorMap.getContinuousThresholdKeys();
    		var threshSize = colorMap.getContinuousThresholdKeySize()/2;
    		if ((threshSize%1) > .5) {
    			// Used to calculate modified threshold size for all but first and last threshold
    			// This modified value will be used for color and display later.
    			thresholdSize = Math.floor(threshSize)+1;
    		} else {
    			thresholdSize = Math.floor(threshSize);
    		}
    	}
    	
    	// Build TABLE HTML for contents of help box
    	var helpContents = document.createElement("TABLE");
    	setTableRow(helpContents, ["Class: ", "&nbsp;"+hoveredBar]);
    	setTableRow(helpContents, ["Value: ", "&nbsp;"+value]);
    	helpContents.insertRow().innerHTML = formatBlankRow();
    	var rowCtr = 3 + thresholds.length;
    	var prevThresh = currThresh;
    	for (var i = 0; i < thresholds.length; i++){ // generate the color scheme diagram
        	var color = colors[i];
        	var valSelected = 0;
        	var valTotal = hoveredBarValues.length;
        	var currThresh = thresholds[i];
        	var modThresh = currThresh;
        	if (classType == 'continuous') {
        		// IF threshold not first or last, the modified threshold is set to the threshold value 
        		// less 1/2 of the threshold range ELSE the modified threshold is set to the threshold value.
        		if ((i != 0) &&  (i != thresholds.length - 1)) {
        			modThresh = currThresh - thresholdSize;
        		}
				color = colorMap.getRgbToHex(colorMap.getClassificationColor(modThresh));
        	}
        	
        	//Count classification value occurrences within each breakpoint.
        	for (var j = 0; j < valTotal; j++) {
        		classBarVal = hoveredBarValues[j];
        		if (classType == 'continuous') {
            		// Count based upon location in threshold array
            		// 1. For first threshhold, count those values <= threshold.
            		// 2. For second threshold, count those values >= threshold.
            		// 3. For penultimate threshhold, count those values > previous threshold AND values < final threshold.
            		// 3. For all others, count those values > previous threshold AND values <= final threshold.
        			if (i == 0) {
						if (classBarVal <= currThresh) {
       						valSelected++;
						}
        			} else if (i == thresholds.length - 1) {
        				if (classBarVal >= currThresh) {
        					valSelected++;
        				}
        			} else if (i == thresholds.length - 2) {
		        		if ((classBarVal > prevThresh) && (classBarVal < currThresh)) {
		        			valSelected++;
		        		}
        			} else {
		        		if ((classBarVal > prevThresh) && (classBarVal <= currThresh)) {
		        			valSelected++;
		        		}
        			}
        		} else {
                	var value = thresholds[i];
	        		if (classBarVal == value) {
	        			valSelected++;
	        		}
        		}
        	}
        	var selPct = Math.round(((valSelected / valTotal) * 100) * 100) / 100;  //new line
        	setTableRow(helpContents, ["<div class='input-color'><div class='color-box' style='background-color: " + color + ";'></div></div>", modThresh + " (n = " + valSelected + ", " + selPct+ "%)"]);
        	prevThresh = currThresh;
    	}
    	var valSelected = 0;  
    	var valTotal = hoveredBarValues.length; 
    	for (var j = 0; j < valTotal; j++) { 
    		if (hoveredBarValues[j] == "null") { 
    			valSelected++;  
    		} 
    	} 
    	var selPct = Math.round(((valSelected / valTotal) * 100) * 100) / 100;  //new line
    	setTableRow(helpContents, ["<div class='input-color'><div class='color-box' style='background-color: " +  colorMap.getMissingColor() + ";'></div></div>", "Missing Color (n = " + valSelected + ", " + selPct+ "%)"]);
        helptext.style.display="inherit";
    	helptext.appendChild(helpContents);
    	locateHelpBox(e, helptext);
    } else {  // on the blank area in the top left corner
    }
    
}
	
/**********************************************************************************
 * FUNCTION - locateHelpBox: The purpose of this function is to set the location 
 * for the display of a pop-up help panel based upon the cursor location and the
 * size of the panel.
 **********************************************************************************/
function locateHelpBox(e, helptext) {
    var rowClassWidthPx = getRowClassPixelWidth();
    var colClassHeightPx = getColClassPixelHeight();
	var mapLocY = e.layerY - colClassHeightPx;
	var mapLocX = e.layerX - rowClassWidthPx;
	var mapH = e.target.clientHeight - colClassHeightPx;
	var mapW = e.target.clientWidth - rowClassWidthPx;
	var boxLeft = e.pageX;
	if (mapLocX > (mapW / 2)) {
		boxLeft = e.pageX - helptext.clientWidth - 10;
	}
	helptext.style.left = boxLeft;
	var boxTop = e.pageY;
	if ((boxTop+helptext.clientHeight) > e.target.clientHeight + 90) {
		boxTop = e.pageY - helptext.clientHeight;
	}
	helptext.style.top = boxTop;
}

/**********************************************************************************
 * FUNCTION - detailDataToolHelp: The purpose of this function is to generate a 
 * pop-up help panel for the tool buttons at the top of the detail pane. It receives
 * text from chm.html. If the screen has been split, it changes the test for the 
 * split screen button
 **********************************************************************************/
function detailDataToolHelp(e,text,width) {
	userHelpClose();
	detailPoint = setTimeout(function(){
		if (typeof width === "undefined") {
			width=50;
		}
		if ((isSub) && (text == "Split Into Two Windows")) {
			text = "Join Screens";
		}
	    var helptext = getDivElement("helptext");
	    helptext.style.position = "absolute";
	    e.parentElement.appendChild(helptext);
//	    document.getElementsByTagName('body')[0].appendChild(helptext);
//	    if ((text === "Modify Map Preferences") || (text === "Save as PDF")){
	    if (2*width + e.getBoundingClientRect().right > document.body.offsetWidth-50){ // 2*width and -50 from window width to force elements close to right edge to move
	    	helptext.style.left = e.offsetLeft - 125;
	    } else {
	    	if (e.offsetLeft !== 0) {
	    		helptext.style.left = e.offsetLeft ;
	    	} else {
	    		var pdfButt = document.getElementById('pdf_btn')
	    		helptext.style.left = pdfButt.offsetLeft - 150;
	    		helptext.style.top = pdfButt.offsetTop + (pdfButt.offsetHeight);
	    	}
	    }
    	if (e.offsetTop !== 0) {
    		helptext.style.top = e.offsetTop + 15;
    	}
	    helptext.style.width = width;
		var htmlclose = "</font></b>";
		helptext.innerHTML = "<b><font size='2' color='#0843c1'>"+text+"</font></b>";
		helptext.style.display="inherit";
	},1000);
}

/**********************************************************************************
 * FUNCTION - getDivElement: The purpose of this function is to create and 
 * return a DIV html element that is configured for a help pop-up panel.
 **********************************************************************************/
function getDivElement(elemName) {
    var divElem = document.createElement('div');
    divElem.id = elemName;
    divElem.style.backgroundColor = 'CBDBF6'; 
    divElem.style.display="none";
    return divElem;
}

/**********************************************************************************
 * FUNCTION - setTableRow: The purpose of this function is to set a row into a help
 * or configuration html TABLE item for a given help pop-up panel. It receives text for 
 * the header column, detail column, and the number of columns to span as inputs.
 **********************************************************************************/
function setTableRow(tableObj, tdArray, colSpan, align) {
	var tr = tableObj.insertRow();
	for (var i = 0; i < tdArray.length; i++) {
		var td = tr.insertCell(i);
		if (typeof colSpan != 'undefined') {
			td.colSpan = colSpan;
		}
		if (i === 0) {
			td.style.fontWeight="bold";
		}
		td.innerHTML = tdArray[i];
		if (typeof align != 'undefined') {
			td.align = align;
		}
	}
}

/**********************************************************************************
 * FUNCTION - setTableRow: The purpose of this function is to set a row into a help
 * or configuration html TABLE item for a given help pop-up panel. It receives text for 
 * the header column, detail column, and the number of columns to span as inputs.
 **********************************************************************************/
function setErrorRow(tableObj, errorMsg) {
	var tr = tableObj.insertRow();
	var td = tr.insertCell(0);
	td.colSpan = 2;
	td.align="center";
	td.style.fontWeight="bold";
	td.style.color="red";
	td.innerHTML = errorMsg;
}



/**********************************************************************************
 * FUNCTION - formatBlankRow: The purpose of this function is to return the html
 * text for a blank row.
 **********************************************************************************/
function formatBlankRow() {
	return "<td style='line-height:4px;' colspan=2>&nbsp;</td>";
}

/**********************************************************************************
 * FUNCTION - userHelpClose: The purpose of this function is to close any open 
 * user help pop-ups and any active timeouts associated with those pop-up panels.
 **********************************************************************************/
function userHelpClose(){
	clearTimeout(detailPoint);
	var helptext = document.getElementById('helptext');
	if (helptext){
		helptext.remove();
	}
}

function showSearchError(type){
	var searchError = getDivElement('searchError');
	searchError.style.display = 'inherit';
	var searchBar = document.getElementById('search_text');
	searchError.style.top = searchBar.offsetTop + searchBar.offsetHeight;
	searchError.style.left = searchBar.offsetLeft + searchBar.offsetWidth;
	switch (type){
		case 0: searchError.innerHTML = "No matching labels found"; break;
		case 1: searchError.innerHTML = "Exit dendrogram selection to go to " + currentSearchItem.label;break;
		case 2: searchError.innerHTML = "All " + currentSearchItem.axis +  " items are visible. Change the view mode to see " + currentSearchItem.label;break;
	}
	document.body.appendChild(searchError);
	setTimeout(function(){
		searchError.remove();
	}, 2000);
	
}

/**********************************************************************************
 * FUNCTION - zipSaveNotification: This function handles all of the tasks necessary 
 * display a modal window whenever a zip file is being saved. The textId passed in
 * instructs the code to display either the startup save OR preferences save message.  
 **********************************************************************************/
function zipSaveNotification(textId) {
	var zipopentext = document.getElementById('zipSaveOpen');
	var zippreftext = document.getElementById('zipSavePref');
	if (textId === 1) {
		zipopentext.style.display = '';
		zippreftext.style.display = 'none';
	} else {
		zipopentext.style.display = 'none';
		zippreftext.style.display = '';
	}
	var zippanel = document.getElementById('zipFileSavePanel');
	zippanel.style.top = 150;
	zippanel.style.left = 500;
	zippanel.style.display = 'block';
}
function zipCancelButton(){
	var zippanel = document.getElementById('zipFileSavePanel');
	zippanel.style.display = 'none';
}