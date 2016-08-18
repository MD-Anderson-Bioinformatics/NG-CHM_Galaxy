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
    	var matrixValue = heatMap.getValue(MatrixManager.DETAIL_LEVEL,row,col);
    	if (matrixValue >= max_values) {
    		matrixValue = "Missing Value";
    	} else {
    		matrixValue = matrixValue.toFixed(5);
    	}
    	setTableRow(helpContents,["&nbsp;Value:", matrixValue]);
    	setTableRow(helpContents,[ "&nbsp;Row:", rowLabels[row-1]]);
    	setTableRow(helpContents,["&nbsp;Column:", colLabels[col-1]]);
    	helpContents.insertRow().innerHTML = formatBlankRow();
    	var writeFirstCol = true;
    	var pos = col;
		var classBars = heatMap.getRowClassificationData(); 
   	    var classLen = Object.keys(classBars).length;
    	if (classLen > 0) {
			setTableRow(helpContents, ["&nbsp;<u>"+"Row Classifications"+"</u>", "&nbsp;"], 2);
	    	for (var key in classBars){
				var displayName = key;
				if (key.length > 20){
					displayName = key.substring(0,20) + "...";
				}
	    		setTableRow(helpContents,["&nbsp;&nbsp;&nbsp;"+displayName+":"+"</u>", classBars[key].values[pos-1]]);	    		
	    	}
    	}
    	helpContents.insertRow().innerHTML = formatBlankRow();
		var classBars = heatMap.getColClassificationData(); 
   	    var classLen = Object.keys(classBars).length;
    	if (classLen > 0) {
			setTableRow(helpContents, ["&nbsp;<u>"+"Column Classifications"+"</u>", "&nbsp;"], 2);
	    	for (var key in classBars){
				var displayName = key;
				if (key.length > 20){
					displayName = key.substring(0,20) + "...";
				}
	    		setTableRow(helpContents,["&nbsp;&nbsp;&nbsp;"+displayName+":"+"</u>", classBars[key].values[pos-1]]);	    		
	    	}
    	}
        helptext.style.display="inherit";
    	helptext.appendChild(helpContents);
    	locateHelpBox(e, helptext);
    } else if (isOnObject(e,"rowClass") || isOnObject(e,"colClass")) {
    	var pos, value, label;
    	var hoveredBar, hoveredBarColorScheme;                                                     //coveredWidth = 0, coveredHeight = 0;
    	if (isOnObject(e,"colClass")) {
        	var col = Math.floor(currentCol + (mapLocX/rowElementSize)*getSamplingRatio('col'));
        	var colLabels = heatMap.getColLabels().labels;
        	label = colLabels[col-1];
    		var coveredHeight = detCanvas.clientHeight*detailDendroHeight/detCanvas.height
    		pos = Math.floor(currentCol + (mapLocX/rowElementSize));
    		var classBarsConfig = heatMap.getColClassificationConfig(); 
    		var classBarsConfigOrder = heatMap.getColClassificationOrder();
			for (var i = 0; i <  classBarsConfigOrder.length; i++) {
				var key = classBarsConfigOrder[i];
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
    		var row = Math.floor(currentRow + (mapLocY/colElementSize)*getSamplingRatio('row'));
        	var rowLabels = heatMap.getRowLabels().labels;
        	label = rowLabels[row-1];
    		var coveredWidth = detCanvas.clientWidth*detailDendroWidth/detCanvas.width
    		pos = Math.floor(currentRow + (mapLocY/colElementSize));
    		var classBarsConfig = heatMap.getRowClassificationConfig(); 
    		var classBarsConfigOrder = heatMap.getRowClassificationOrder();
			for (var i = 0; i <  classBarsConfigOrder.length; i++) {
				var key = classBarsConfigOrder[i];
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
		var displayName = hoveredBar;
		if (hoveredBar.length > 20){
			displayName = displayName.substring(0,20) + "...";
		}
		setTableRow(helpContents, ["Label: ", "&nbsp;"+label]);
    	setTableRow(helpContents, ["Covariate: ", "&nbsp;"+displayName]);
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
		if (helptext.clientHeight > e.pageY) {
			boxTop = e.pageY - (helptext.clientHeight/2);
		} else {
			boxTop = e.pageY - helptext.clientHeight;
		}
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
	    // Unless close to the bottom, set help text below cursor
	    // Else, set to right of cursor.
    	if (e.offsetTop !== 0) {
    		if (e.offsetTop > 500) {
    			helptext.style.top = e.offsetTop - 25;
	    	} else {
	    		helptext.style.top = e.offsetTop + 15;
	    	}
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
	tr.className = "show";
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
 * FUNCTION - addBlankRow: The purpose of this function is to return the html
 * text for a blank row.
 **********************************************************************************/
function addBlankRow(addDiv, rowCnt) {
	addDiv.insertRow().innerHTML = formatBlankRow();
	if (typeof rowCnt !== 'undefined') {
		for (var i=1;i<rowCnt;i++) {
			addDiv.insertRow().innerHTML = formatBlankRow();
		}
	}
	return;
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
 * FUNCTION - saveHeatMapChanges: This function handles all of the tasks necessary 
 * display a modal window whenever the user requests to save heat map changes.  
 **********************************************************************************/
function saveHeatMapChanges() {
	initMessageBox();
	setMessageBoxHeader("Save Heat Map");
	//Have changes been made?
	if (heatMap.getUnAppliedChanges()) {
		if ((heatMap.isFileMode()) || (staticPath !== "")) {
			if (staticPath !== "") {
				text = "<br>Changes to the heatmap cannot be saved in the Galaxy history.  Your modifications to the heatmap may be written to a downloaded NG-CHM file.";
			} else {
				text = "<br>You have elected to save changes made to this NG-CHM heat map file.<br><br>You may save them to a new NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
			}
			setMessageBoxText(text);
			setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "heatMap.saveHeatMapToNgchm");
			setMessageBoxButton(4, "images/closeButton.png", "Cancel Save", "messageBoxCancel");
		} else {
			// If so, is read only?
			if (heatMap.isReadOnly()) {
				text = "<br>You have elected to save changes made to this READ-ONLY heat map file. READ-ONLY files cannot be updated.<br><br>However, you may save these changes to an NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
				setMessageBoxText(text);
				setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "heatMap.saveHeatMapToNgchm");
				setMessageBoxButton(4, "images/closeButton.png", "Cancel Save", "messageBoxCancel");
			} else {
				text = "<br>You have elected to save changes made to this heat map.<br><br>You have the option to save these changes to the original map OR to save them to an NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
				setMessageBoxText(text);
				setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "heatMap.saveHeatMapToNgchm");
				setMessageBoxButton(2, "images/saveOriginal.png", "Save Original Heat Map", "heatMap.saveHeatMapToServer");
				setMessageBoxButton(3, "images/closeButton.png", "Cancel Save", "messageBoxCancel");
			}
		}
	} else {
		if ((heatMap.isFileMode()) || (staticPath !== "")) {
			if (staticPath !== "") {
				text = "<br>There are no changes to save to this Galaxy heat map file at this time.<br><br>";
			} else {
				text = "<br>There are no changes to save to this NG-CHM heat map file at this time.<br><br>";
			}
			setMessageBoxText(text);
			setMessageBoxButton(4, "images/closeButton.png", "OK", "messageBoxCancel");
		} else {
			text = "<br>There are no changes to save to this heat map at this time.<br><br>However, you may save the map as an NG-CHM file that may be opened using the NG-CHM File Viewer application.<br><br>";
			setMessageBoxText(text);
			setMessageBoxButton(1, "images/saveNgchm.png", "Save To NG-CHM File", "heatMap.saveHeatMapToNgchm");
			setMessageBoxButton(4, "images/closeButton.png", "Cancel Save", "messageBoxCancel");
		}
	}
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - zipSaveNotification: This function handles all of the tasks necessary 
 * display a modal window whenever a zip file is being saved. The textId passed in
 * instructs the code to display either the startup save OR preferences save message.  
 **********************************************************************************/
function zipSaveNotification(autoSave) {
	var text;
	initMessageBox();
	setMessageBoxHeader("NG-CHM File Save");
	if (autoSave) {
		text = "<br>The NG-CHM archive file that you have just opened contains out dated heat map configuration information and is being updated.<br><br>In order to avoid the need for this update in the future, you will want to replace the NG-CHM file that you opened with the new file.";
	} else {
		text = "<br>You have just saved a heat map as a NG-CHM file.<br><br>In order to see your saved changes, you will want to open this new file using the NG-CHM File Viewer application."
		setMessageBoxButton(1, "images/getZipViewer.png", "Download NG-CHM Viewer App", "zipRequestAppDownload");
	}
	setMessageBoxText(text);
	setMessageBoxButton(3, "images/closeButton.png", "", "messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - zipRequestAppDownload: This function handles all of the tasks necessary 
 * display a modal window whenever an NG-CHM File Viewer Application download is 
 * requested.  
 **********************************************************************************/
function zipRequestAppDownload(){
	var text;
	initMessageBox();
	setMessageBoxHeader("Download NG-CHM File Viewer Application");
	setMessageBoxText("<br>The NG-CHM File Viewer application may be used to open NG-CHM files. Press the Download button to get the NG-CHM File Viewer application.<br><br>When the download completes, extract the contents to a location of your choice and click on the extracted chm.html file to begin viewing NG-CHM heatmap file downloads.<br><br>");
	setMessageBoxButton(1, "images/downloadButton.png", "Download App", "zipAppDownload");
	setMessageBoxButton(3, "images/closeButton.png", "", "messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

function zipAppDownload(){
	var dlButton = document.getElementById('msgBoxBtnImg_1');
	dlButton.style.display = 'none';
	heatMap.downloadFileApplication();
}

/**********************************************************************************
 * FUNCTION - unappliedChangeNotification: This function handles all of the tasks necessary 
 * display a modal window whenever an unapplied change notification is required when
 * attempting to split screens after preferences have been applied.  
 **********************************************************************************/
function unappliedChangeNotification() {
	var text;
	initMessageBox();
	setMessageBoxHeader("Split Screen Preference Conflict");
	if (heatMap.isReadOnly()) {
		text = "<br>There are un-applied preference changes that prevent the split-screen process from completing.<br><br>Since this is a READ-ONLY heatmap, you will need to reload the map without preference changes to access split screen mode.";
	} else {
		text = "<br>There are un-applied preference changes that prevent the split-screen process from completing.<br><br>You will need to either save them or cancel the process before the screen may be split.";
		setMessageBoxButton(1, "images/prefSave.png", "Save Unapplied Changes", "unappliedChangeSave");
	} 
	setMessageBoxText(text);
	setMessageBoxButton(3, "images/prefCancel.png", "", "messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}

/**********************************************************************************
 * FUNCTION - unappliedChangeSave: This function performs a heatmap preferences 
 * save when the user chooses to save unapplied changes when performing a split
 * screen operation.  
 **********************************************************************************/
function unappliedChangeSave() {
	var success = heatMap.saveHeatMapToServer();
	if (success === "true") {
		heatMap.setUnAppliedChanges(false);
		detailSplit();
	}
	initMessageBox();
}

/**********************************************************************************
 * FUNCTIONS - MESSAGE BOX FUNCTIONS
 * 
 * We use a generic message box for most of the modal request windows in the 
 * application.  The following functions support this message box:
 * 1. initMessageBox - Initializes and hides the message box panel
 * 2. setMessageBoxHeader - Places text in the message box header bar.
 * 3. setMessageBoxText - Places text in the message box body.
 * 4. setMessageBoxButton - Configures and places a button on the message box.
 * 5. messageBoxCancel - Closes the message box when a Cancel is requested.  
 **********************************************************************************/
function initMessageBox() {
	document.getElementById('msgBox').style.display = 'none';
	document.getElementById('msgBoxBtnImg_1').style.display = 'none';
	document.getElementById('msgBoxBtnImg_2').style.display = 'none';
	document.getElementById('msgBoxBtnImg_3').style.display = 'none';
	document.getElementById('msgBoxBtnImg_4').style.display = 'none';
	document.getElementById('msgBoxBtnImg_1')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_2')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_3')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_4')['onclick'] = null;
}
function setMessageBoxHeader(headerText) {
	var msgBoxHdr = document.getElementById('msgBoxHdr');
	msgBoxHdr.innerHTML = headerText;
}
function setMessageBoxText(text) {
	var msgBoxTxt = document.getElementById('msgBoxTxt');
	msgBoxTxt.innerHTML = text;
}
function setMessageBoxButton(buttonId, imageSrc, altText, onClick) {
	var buttonImg = document.getElementById('msgBoxBtnImg_'+buttonId);
	buttonImg.style.display = '';
	buttonImg.src = staticPath + imageSrc;
	buttonImg.alt = altText;
	var fn = eval("(function() {"+onClick+"();})");
	buttonImg.onclick=fn;
}

function messageBoxCancel(){
	initMessageBox();
}

