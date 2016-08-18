/**********************************************************************************
 * USER PREFERENCE FUNCTIONS:  The following functions handle the processing 
 * for user preference editing. 
 **********************************************************************************/

//Global variables for preference processing
var bkpColorMaps = null;
var filterVal;
var searchPerformed = false;

/*===================================================================================
 *  COMMON PREFERENCE PROCESSING FUNCTIONS
 *  
 *  The following functions are utilized to present the entire heat map preferences
 *  dialog and, therefore, sit above those functions designed specifically for processing
 *  individual data layer and covariate classification bar preferences:
 *  	- editPreferences
 *  	- setPrefsDivSizing
 *  	- showLayerPrefs
 *      - showClassPrefs
 *      - showRowsColsPrefs
 *      - prefsCancel
 *      - prefsApply
 *      - prefsValidate
 *      - prefsValidateBreakPoints
 *      - prefsValidateBreakColors
 *      - prefsApplyBreaks
 *      - getNewBreakColors
 *      - getNewBreakThresholds  
 *      - prefsSave
 =================================================================================*/

/**********************************************************************************
 * FUNCTION - editPreferences: This is the MAIN driver function for edit 
 * preferences processing.  It is called under two conditions (1) The Edit 
 * preferences "gear" button is pressed on the main application screen 
 * (2) User preferences have been applied BUT errors have occurred.
 * 
 * Processing for this function is documented in detail in the body of the function.
 **********************************************************************************/
function editPreferences(e,errorMsg){
	userHelpClose();

	// If helpPrefs element already exists, the user is pressing the gear button
	// when preferences are already open. Disregard.
	var helpExists = document.getElementById('rowsColsprefs');
	if ((isSub) || (helpExists !== null)) {
		return;
	}

	//If first time thru, save the dataLayer colorMap
	//This is done because the colorMap must be edited to add/delete breakpoints while retaining their state
	if (bkpColorMaps === null) {
		bkpColorMaps = new Array();
		var dataLayers = heatMap.getDataLayers();
		for (var key in dataLayers){
			bkpColorMaps.push(heatMap.getColorMapManager().getColorMap("data",key));
		}
	} 
	var prefspanel = document.getElementById("prefsPanel");
	var prefprefs = document.getElementById("prefPrefs");

	if (errorMsg !== null) {
		var prefBtnsDiv = document.getElementById('prefActions');
		prefBtnsDiv.innerHTML=errorMsg[2]+"<br/><br/><img id='prefApply_btn' src='" + staticPath + "images/applyChangesButton.png' alt='Apply changes' onclick='prefsApplyButton();' align='top'/>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<img id='prefCancel_btn' src='" + staticPath + "images/cancelChangesButton.png' alt='Cancel changes' onclick='prefsCancelButton();' align='top'/>";
	} else {
		//Create and populate row & col preferences DIV and add to parent DIV
		var rowcolprefs = setupRowColPrefs(e, prefprefs);
		prefprefs.appendChild(rowcolprefs);

		//Create and populate classifications preferences DIV and add to parent DIV
		var classprefs = setupClassPrefs(e, prefprefs);
		prefprefs.appendChild(classprefs);
		
		//Create and populate breakpoint preferences DIV and add to parent DIV
		var layerprefs = setupLayerPrefs(e, prefprefs);
		prefprefs.appendChild(layerprefs);

		// Set DIV containing both class and break DIVs to visible and append to prefspanel table
		prefprefs.style.display="block";
		prefspanel.appendChild(prefprefs);
		
		var prefBtnsDiv = document.createElement('div');
		prefBtnsDiv.id='prefActions';
		prefBtnsDiv.innerHTML="<img id='prefApply_btn' src='" + staticPath + "images/applyChangesButton.png' alt='Apply changes' onclick='prefsApplyButton();' align='top'/>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<img id='prefCancel_btn' src='" + staticPath + "images/cancelChangesButton.png' alt='Cancel changes' onclick='prefsCancelButton();' align='top'/>";
		prefspanel.appendChild(prefBtnsDiv);
	}
	prefspanel.style.display= '';
	prefsResize();

	//If errors exist and they are NOT on the currently visible DIV (dataLayer1),
	//hide the dataLayers DIV, set the tab to "Covariates", and open the appropriate
	//covariate bar DIV.
	addClassPrefOptions();
	showDendroSelections();
	setShowAll();
	if ((errorMsg != null) && (errorMsg[1] === "classPrefs")) {
		showClassBreak(errorMsg[0]);
		showClassPrefs();
	} else if ((errorMsg != null) && (errorMsg[1] === "layerPrefs")){ 
		showLayerBreak(errorMsg[0]);
		showLayerPrefs();
	} else if (searchPerformed){ 
		searchPerformed = false;
		showClassPrefs();
	} else {
		showLayerBreak(currentDl);
		showRowsColsPrefs();
	}
	errorMsg = null;

}

/**********************************************************************************
 * FUNCTION - prefsResize: The purpose of this function is to handle the resizing
 * of the preferences panel when the window is resized.
 **********************************************************************************/
function prefsResize() {
	var prefprefs = document.getElementById('prefPrefs');
	if (window.innerHeight > 730) {
		prefprefs.style.height = "88%";
	} else if (window.innerHeight > 500) {
		prefprefs.style.height = "80%";
	} else {
		prefprefs.style.height = "70%";
	}
}

/**********************************************************************************
 * FUNCTION - showLayerPrefs: The purpose of this function is to perform the 
 * processing for the preferences tab when the user selects the "Data Layers" tab.
 **********************************************************************************/
function showRowsColsPrefs() {
	//Turn off all tabs
	hideAllPrefs();
	//Turn on layer prefs tab
	var rowsColsBtn = document.getElementById("prefRowsCols_btn");
	rowsColsBtn.setAttribute('src', staticPath + 'images/rowsColsOn.png');
	var rowsColsDiv = document.getElementById("rowsColsPrefs");
	rowsColsDiv.style.display="block";
}


/**********************************************************************************
 * FUNCTION - showLayerPrefs: The purpose of this function is to perform the 
 * processing for the preferences tab when the user selects the "Data Layers" tab.
 **********************************************************************************/
function showLayerPrefs() {
	//Turn off all tabs
	hideAllPrefs();
	//Turn on layer prefs tab
	var layerBtn = document.getElementById("prefLayer_btn");
	layerBtn.setAttribute('src', staticPath + 'images/dataLayersOn.png');
	var layerDiv = document.getElementById("layerPrefs");
	layerDiv.style.display="block";
	showLayerBreak();
}

/**********************************************************************************
 * FUNCTION - showClassPrefs: The purpose of this function is to perform the 
 * processing for the preferences tab when the user selects the "Covariates" tab.
 **********************************************************************************/
function showClassPrefs() {
	//Turn off all tabs
	hideAllPrefs();
	//Turn on classification prefs tab
	var classBtn = document.getElementById("prefClass_btn");
	classBtn.setAttribute('src', staticPath + 'images/covariateBarsOn.png');
	var classDiv = document.getElementById("classPrefs");
	classDiv.style.display="block";
}

/**********************************************************************************
 * FUNCTION - hideAllPrefs: The purpose of this function is to set all tabs off. It 
 * is called whenever a tab is clicked.  All tabs are set to hidden with their
 * image set to the "off" image.
 **********************************************************************************/
function hideAllPrefs() {
	var classBtn = document.getElementById("prefClass_btn");
	classBtn.setAttribute('src', staticPath + 'images/covariateBarsOff.png');
	var classDiv = document.getElementById("classPrefs");
	classDiv.style.display="none";
	var layerBtn = document.getElementById("prefLayer_btn");
	layerBtn.setAttribute('src', staticPath + 'images/dataLayersOff.png');
	var layerDiv = document.getElementById("layerPrefs");
	layerDiv.style.display="none";
	var rowsColsBtn = document.getElementById("prefRowsCols_btn");
	rowsColsBtn.setAttribute('src', staticPath + 'images/rowsColsOff.png');
	var rowsColsDiv = document.getElementById("rowsColsPrefs");
	rowsColsDiv.style.display="none";
}

/**********************************************************************************
 * FUNCTION - prefsCancelButton: The purpose of this function is to perform all processing
 * necessary to exit the user preferences dialog WITHOUT applying or saving any 
 * changes made by the user when the Cancel button is pressed on the ColorMap 
 * preferences dialog.  Since the dataLayer colormap must be edited to add/delete
 * breakpoints, the backup colormap (saved when preferences are first opened) is re-
 * applied to the colorMapManager.  Then the preferences DIV is retrieved and removed.
 **********************************************************************************/
function prefsCancelButton() {
	if (bkpColorMaps !== null) {
		var colorMapMgr = heatMap.getColorMapManager();
		var dataLayers = heatMap.getDataLayers();
		var i = 0;
		for (var key in dataLayers){
			colorMapMgr.setColorMap(key, bkpColorMaps[i], "data");		
			i++;
		}
	}
	removeSettingsPanels();
	//Hide the preferences panel
	document.getElementById('prefsPanel').style.display= 'none';
	searchPerformed = false;
}

function removeSettingsPanels() {
	
	//Remove all panels that are content specific before closing
	var pActions = document.getElementById("prefActions");
	pActions.parentNode.removeChild(pActions);
	
	var rcPrefs = document.getElementById("rowsColsPrefs");
	rcPrefs.parentNode.removeChild(rcPrefs);
	
	var lPrefs = document.getElementById("layerPrefs");
	lPrefs.parentNode.removeChild(lPrefs);
	
	var cPrefs = document.getElementById("classPrefs");
	cPrefs.parentNode.removeChild(cPrefs);

}

/**********************************************************************************
 * FUNCTION - prefsApplyButton: The purpose of this function is to perform all processing
 * necessary to reconfigure the "current" presentation of the heat map in the 
 * viewer when the Apply button is pressed on the ColorMap Preferences Dialog.  
 * First validations are performed.  If errors are found, preference 
 * changes are NOT applied and the user is re-presented with the preferences dialog
 * and the error found.  If no errors are found, all changes are applied to the heatmap 
 * and the summary panel, detail panel, and covariate bars are redrawn.  However, 
 * these changes are not yet permanently  saved to the JSON files that are used to 
 * configure heat map presentation.
 **********************************************************************************/
function prefsApplyButton() {
	//Perform validations of all user-entered data layer and covariate bar
	//preference changes.
	var errorMsg = prefsValidate();
	if (errorMsg !== null) {
		prefsError(errorMsg);
	} else { 
		prefsApply();
		heatMap.setUnAppliedChanges(true);
		prefsSuccess();
	}
}

/**********************************************************************************
 * FUNCTION - prefsSuccess: The purpose of this function perform the functions
 * necessary when preferences are determined to be valid. It is shared by the
 * Apply and Save buttons.
 **********************************************************************************/
function prefsSuccess() {
	filterVal = null;
	//Remove the backup color map (used to reinstate colors if user cancels)
	//and formally apply all changes to the heat map, re-draw, and exit preferences.
	bkpColorMaps = null;
	summaryInit();
	//detailInit();
	drawDetailHeatMap();
	changeMode('NORMAL');
	prefsCancelButton();
}

/**********************************************************************************
 * FUNCTION - prefsError: The purpose of this function perform the functions
 * necessary when preferences are determined to be invalid. It is shared by the
 * Apply and Save buttons.
 **********************************************************************************/
function prefsError(errorMsg) {
	//If a validation error exists, re-present the user preferences
	//dialog with the error message displayed in red. 
	filterVal = null;
	editPreferences(document.getElementById('gear_btn'),errorMsg);
}

/**********************************************************************************
 * FUNCTION - prefsSuccess: The purpose of this function is to apply all user
 * ColorMap preferences settings.  It is shared by the Apply and Save buttons.
 **********************************************************************************/
function prefsApply() {
	// Apply Row & Column Preferences
	var rowDendroConfig = heatMap.getRowDendroConfig();   
	var rowOrganization = heatMap.getRowOrganization();
	var rowOrder = rowOrganization['order_method'];
	if (rowOrder === "Hierarchical") {
		var rowDendroShowVal = document.getElementById("rowDendroShowPref").value;
		rowDendroConfig.show = rowDendroShowVal;
		rowDendroConfig.height = document.getElementById("rowDendroHeightPref").value;
	}	
	var colDendroConfig = heatMap.getColDendroConfig();
	var colOrganization = heatMap.getColOrganization();
	var colOrder = colOrganization['order_method'];
	if (colOrder === "Hierarchical") {
		var colDendroShowVal = document.getElementById("colDendroShowPref").value;
		colDendroConfig.show = colDendroShowVal;
		colDendroConfig.height = document.getElementById("colDendroHeightPref").value;
	}	
	// Apply Covariate Bar Preferences
	var rowClassBars = heatMap.getRowClassificationConfig();
	for (var key in rowClassBars){
		var keyrow = key+"_row";
		var showElement = document.getElementById(keyrow+"_showPref");
		var heightElement = document.getElementById(keyrow+"_heightPref");
		heatMap.setClassificationPrefs(key,"row",showElement.checked,heightElement.value);
		prefsApplyBreaks(key,"row");
	}
	var colClassBars = heatMap.getColClassificationConfig();
	for (var key in colClassBars){
		var keycol = key+"_col";
		var showElement = document.getElementById(keycol+"_showPref");
		var heightElement = document.getElementById(keycol+"_heightPref");
		heatMap.setClassificationPrefs(key,"col",showElement.checked,heightElement.value);
		prefsApplyBreaks(key,"col");
	}
	// Apply Sizing Preferences
	var sumSize = document.getElementById("summaryWidthPref").value;
	var detSize = document.getElementById("detailWidthPref").value;
	var heightSize = document.getElementById("mapHeightPref").value;
	heatMap.getMapInformation().summary_width = sumSize;
	heatMap.getMapInformation().detail_width = detSize;
	heatMap.getMapInformation().summary_height = heightSize;
	heatMap.getMapInformation().detail_height = heightSize;
	// Apply Data Layer Preferences
	var dataLayers = heatMap.getDataLayers();
	for (var key in dataLayers){
		var showGrid = document.getElementById(key+'_gridPref');
		var gridColor = document.getElementById(key+'_gridColorPref');
		var selectionColor = document.getElementById(key+'_selectionColorPref');
		heatMap.setLayerGridPrefs(key, showGrid.checked,gridColor.value,selectionColor.value)
		prefsApplyBreaks(key,"data");
	}
}

/**********************************************************************************
 * FUNCTION - prefsValidate: The purpose of this function is to validate all user
 * changes to the heatmap properties. When the very first error is found, an error 
 * message (string array containing error information) is created and returned to 
 * the prefsApply function. 
 **********************************************************************************/
function prefsValidate() {
	var errorMsg = null;
	//Validate all breakpoints and colors for the main data layer
	if (errorMsg === null) {
		var dataLayers = heatMap.getDataLayers();
		for (var key in dataLayers){
			errorMsg = prefsValidateBreakPoints(key,"layerPrefs");
			if (errorMsg != null) break;
		}
	}
	
	return errorMsg;
}

/**********************************************************************************
 * FUNCTION - prefsValidateBreakPoints: The purpose of this function is to validate 
 * all user breakpoint and color changes to heatmap data layer properties. When the  
 * first error is found, an error  message (string array containing error information) 
 * is created and returned to the prefsApply function. 
 **********************************************************************************/
function prefsValidateBreakPoints(colorMapName,prefPanel) {
	var colorMap = heatMap.getColorMapManager().getColorMap("data",colorMapName);
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	var dupeBreak = false;
	var breakOrder = false;
	var prevBreakValue = -99999;
	var errorMsg = null;
	//Loop thru colormap thresholds and validate for order and duplicates
	for (var i = 0; i < thresholds.length; i++) {
		var breakElement = document.getElementById(colorMapName+"_breakPt"+i+"_breakPref");
		//If current breakpoint is not greater than previous, throw order error
		if (parseInt(breakElement.value) < prevBreakValue) {
			breakOrder = true;
			break;
		}
		//Loop thru thresholds, skipping current element, searching for a match to the 
		//current selection.  If found, throw duplicate error
		for (var j = 0; j < thresholds.length; j++) {
			var be = document.getElementById(colorMapName+"_breakPt"+j+"_breakPref");
			if (i != j) {
				if (breakElement.value === be.value) {
					dupeBreak = true;
					break;
				}
			}
		}
	}
	if (breakOrder) {
		errorMsg =  [colorMapName, prefPanel, "ERROR: Data layer breakpoints must be in order"];
	}
	if (dupeBreak) {
		errorMsg =  [colorMapName, prefPanel, "ERROR: Duplicate data layer breakpoint found above"];
	}
	
	return errorMsg;
}

/**********************************************************************************
 * FUNCTION - prefsValidateBreakColors: The purpose of this function is to validate 
 * all user color changes to heatmap classification and data layer properties. When the  
 * first error is found, an error  message (string array containing error information) 
 * is created and returned to the prefsApply function. 
 **********************************************************************************/
function prefsValidateBreakColors(colorMapName,type, prefPanel) {
	var colorMap = heatMap.getColorMapManager().getColorMap(type,colorMapName);
	var key = colorMapName;
	if (type !== "data") {
		key = key+"_"+type;
	}
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	var dupeColor = false;
	for (var i = 0; i < colors.length; i++) {
		var colorElement = document.getElementById(key+"_color"+i+"_colorPref");
		for (var j = 0; j < thresholds.length; j++) {
			var ce = document.getElementById(key+"_color"+j+"_colorPref"); 
			if (i != j) {
				if (colorElement.value === ce.value) {
					dupeColor = true;
					break;
				}
			}
		}
	}
	if (dupeColor) {
		return [key, prefPanel, "ERROR: Duplicate color setting found above"];
	}
	
	return null;
}

/**********************************************************************************
 * FUNCTION - prefsApplyBreaks: The purpose of this function is to apply all 
 * user entered changes to colors and breakpoints. 
 **********************************************************************************/
function prefsApplyBreaks(colorMapName, type) {
	var colorMap = heatMap.getColorMapManager().getColorMap(type,colorMapName);
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	var newColors = getNewBreakColors(colorMapName, type);
	colorMap.setColors(newColors);
	var key = colorMapName;
	if (type === "data") {
		var newThresholds = getNewBreakThresholds(colorMapName);
		colorMap.setThresholds(newThresholds);
	} else {
		key = key+"_"+type;
	}
	var missingElement = document.getElementById(key+"_missing_colorPref");
	colorMap.setMissingColor(missingElement.value);
	var colorMapMgr = heatMap.getColorMapManager();
	colorMapMgr.setColorMap(colorMapName, colorMap, type);
}

/**********************************************************************************
 * FUNCTION - getNewBreakColors: The purpose of this function is to grab all user
 * color entries for a given colormap and place them on a string array.  It will 
 * iterate thru the screen elements, pulling the current color entry for each 
 * element, placing it in a new array, and returning that array. This function is 
 * called by the prefsApplyBreaks function.  It is ALSO called from the data layer
 * addLayerBreak and deleteLayerBreak functions with parameters passed in for 
 * the position to add/delete and the action to be performed (add/delete).
 **********************************************************************************/
function getNewBreakColors(colorMapName, type, pos, action) {
	var colorMap = heatMap.getColorMapManager().getColorMap(type,colorMapName);
	var thresholds = colorMap.getThresholds();
	var newColors = [];
	var key = colorMapName;
	if (type !== "data") {
		key = key+"_"+type;
	}
	for (var j = 0; j < thresholds.length; j++) {
		var colorElement = document.getElementById(key+"_color"+j+"_colorPref");
		//If being called from addLayerBreak or deleteLayerBreak
		if (typeof pos !== 'undefined') {
			if (action === "add") {
				newColors.push(colorElement.value);
				if (j === pos) {
					newColors.push(colorElement.value);
				}
			} else {
				if (j !== pos) {
					newColors.push(colorElement.value);
				}
			}
		} else {
			newColors.push(colorElement.value);
		}
	}
	
	return newColors;
}

/**********************************************************************************
 * FUNCTION - getNewBreakThresholds: The purpose of this function is to grab all user
 * data layer breakpoint entries for a given colormap and place them on a string array.  
 * It will  iterate thru the screen elements, pulling the current breakpoint entry for each 
 * element, placing it in a new array, and returning that array. This function is 
 * called by the prefsApplyBreaks function (only for data layers).  It is ALSO called 
 * from the data layer addLayerBreak and deleteLayerBreak functions with parameters 
 * passed in for the position to add/delete and the action to be performed (add/delete).
 **********************************************************************************/
function getNewBreakThresholds(colorMapName, pos, action) {
	var colorMap = heatMap.getColorMapManager().getColorMap("data",colorMapName);
	var thresholds = colorMap.getThresholds();
	var newThresholds = [];
	for (var j = 0; j < thresholds.length; j++) {
		var breakElement = document.getElementById(colorMapName+"_breakPt"+j+"_breakPref");
		if (typeof pos !== 'undefined') {
			if (action === "add") {
				newThresholds.push(breakElement.value);
				if (j === pos) {
					newThresholds.push(breakElement.value);
				}
			} else {
				if (j !== pos) {
					newThresholds.push(breakElement.value);
				}
			}
		} else {
			newThresholds.push(breakElement.value);
		}
	}
	
	return newThresholds;
}

/*===================================================================================
  *  DATA LAYER PREFERENCE PROCESSING FUNCTIONS
  *  
  *  The following functions are utilized to present heat map data layer 
  *  configuration options:
  *  	- setupLayerPrefs
  *  	- setupLayerBreaks
  *  	- setupLayerPrefs
  *     - addLayerBreak
  *     - deleteLayerBreak
  *     - reloadLayerBreaksColorMap
  =================================================================================*/

/**********************************************************************************
 * FUNCTION - setupLayerPrefs: The purpose of this function is to construct a DIV 
 * panel containing all data layer preferences.  A dropdown list containing all 
 * data layers is presented and individual DIVs for each data layer, containing 
 * breakpoints/colors, are added.
 **********************************************************************************/
function setupLayerPrefs(e, prefprefs){
	var layerprefs = getDivElement("layerPrefs");
	var prefContents = document.createElement("TABLE");
	var dataLayers = heatMap.getDataLayers();
	var colorMapName = "dl1";
	addBlankRow(prefContents);
	var dlSelect = "<select name='dlPref_list' id='dlPref_list' onchange='showLayerBreak();'>"
	// Re-order options in datalayer order (which is lost on JSON save)
	var dls = new Array(Object.keys(dataLayers).length);
	var orderedKeys = new Array(Object.keys(dataLayers).length);
	var dlOptions = "";
	for (var key in dataLayers){
		var dlNext = key.substring(2, key.length);
		orderedKeys[dlNext-1] = key;
		var displayName = dataLayers[key].name;
		if (displayName.length > 20){
			displayName = displayName.substring(0,20) + "...";
		}
		dls[dlNext-1] = '<option value="'+key+'">'+displayName+'</option>';
	}
	for(var i=0;i<dls.length;i++) {
		dlOptions += dls[i];
	}
	dlSelect += dlOptions+"</select>";  
	setTableRow(prefContents,["&nbsp;Data Layer: ", dlSelect]);
	addBlankRow(prefContents, 2)
	layerprefs.appendChild(prefContents);
	addBlankRow(prefContents)
	// Loop data layers, setting up a panel div for each layer
	for (var key in dataLayers){
		var breakprefs = setupLayerBreaks(e, key);
		breakprefs.style.display="none";
		layerprefs.appendChild(breakprefs);
	}

	return layerprefs;
}

/**********************************************************************************
 * FUNCTION - setupLayerBreaks: The purpose of this function is to construct a DIV 
 * containing a list of breakpoints/colors for a given matrix data layer.
 **********************************************************************************/
function setupLayerBreaks(e, mapName){
	var colorMap = heatMap.getColorMapManager().getColorMap("data",mapName);
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	var helpprefs = getDivElement("breakPrefs_"+mapName);
	var prefContents = document.createElement("TABLE"); 
	var dataLayers = heatMap.getDataLayers();
	var layer = dataLayers[mapName];
	var gridShow = "<input name='"+mapName+"_gridPref' id='"+mapName+"_gridPref' type='checkbox' ";
	if (layer.grid_show == 'Y') {
		gridShow = gridShow+"checked"
	}
	gridShow = gridShow+ " >";
	var gridColorInput = "<input class='spectrumColor' type='color' name='"+mapName+"_gridColorPref' id='"+mapName+"_gridColorPref' value='"+layer.grid_color+"'>"; 
	var selectionColorInput = "<input class='spectrumColor' type='color' name='"+mapName+"_selectionColorPref' id='"+mapName+"_selectionColorPref' value='"+layer.selection_color+"'>"; 
	addBlankRow(prefContents, 2)
	setTableRow(prefContents, ["&nbsp;<u>Breakpoint</u>", "<u><b>Color</b></u>","&nbsp;"]); 
	for (var j = 0; j < thresholds.length; j++) {
		var threshold = thresholds[j];    
		var color = colors[j];
		var threshId = mapName+"_breakPt"+j;
		var colorId = mapName+"_color"+j;
		var breakPtInput = "&nbsp;&nbsp;<input name='"+threshId+"_breakPref' id='"+threshId+"_breakPref' value='"+threshold+"' maxlength='4' size='4'>";
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"'>"; 
		var addButton = "<img id='"+threshId+"_breakAdd' src='" + staticPath + "images/plusButton.png' alt='Add Breakpoint' onclick='addLayerBreak("+j+",\""+mapName+"\");' align='top'/>"
		var delButton = "<img id='"+threshId+"_breakDel' src='" + staticPath + "images/minusButton.png' alt='Remove Breakpoint' onclick='deleteLayerBreak("+j+",\""+mapName+"\");' align='top'/>"
		if (j === 0) {
			setTableRow(prefContents, [breakPtInput, colorInput, addButton]);
		} else {
			setTableRow(prefContents, [breakPtInput,  colorInput, addButton+ delButton]);
		}
	} 
	addBlankRow(prefContents)
	setTableRow(prefContents, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='"+mapName+"_missing_colorPref' id='"+mapName+"_missing_colorPref' value='"+colorMap.getMissingColor()+"'>"]);
	addBlankRow(prefContents, 3)
	// predefined color schemes put here
	setTableRow(prefContents, ["&nbsp;<u>Choose a pre-defined color palette:</u>"],3);
	addBlankRow(prefContents);
	var rainbow = "<div style='display:flex'><div id='setROYGBV' class='presetPalette' style='background: linear-gradient(to right, red,orange,yellow,green,blue,violet);' onclick='setupLayerBreaksToPreset(event, \""+ mapName+ "\", [\"#FF0000\",\"#FF8000\",\"#FFFF00\",\"#00FF00\",\"#0000FF\",\"#FF00FF\"],\"#000000\")' > </div>" +
			"<div class='presetPaletteMissingColor' style='background:black'></div></div>";
	var redWhiteBlue = "<div style='display:flex'><div id='setRedWhiteBlue' class='presetPalette' style='background: linear-gradient(to right, blue,white,red);' onclick='setupLayerBreaksToPreset(event, \""+ mapName+ "\", [\"#0000FF\",\"#FFFFFF\",\"#ff0000\"],\"#000000\")'> </div>" +
			"<div class='presetPaletteMissingColor' style='background:black'></div></div>";
	var redBlackGreen = "<div style='display:flex'><div id='setRedBlackGreen' class='presetPalette' style='background: linear-gradient(to right, green,black,red);' onclick='setupLayerBreaksToPreset(event, \""+ mapName+ "\", [\"#00FF00\",\"#000000\",\"#FF0000\"],\"#ffffff\")'> </div>" +
			"<div class='presetPaletteMissingColor' style='background:white'></div></div>"
	setTableRow(prefContents, [ redWhiteBlue, rainbow, redBlackGreen ]);
	setTableRow(prefContents, ["&nbsp;Blue Red",  "&nbsp;<b>Rainbow</b>","&nbsp;<b>Green Red</b>"]);
	addBlankRow(prefContents, 3)
	setTableRow(prefContents, ["&nbsp;Grid Lines:", gridColorInput, "<b>Show:&nbsp;&nbsp;</b>"+gridShow]); 
	setTableRow(prefContents, ["&nbsp;Selection Color:", selectionColorInput]); 
	helpprefs.style.height = prefContents.rows.length;;
	helpprefs.appendChild(prefContents);
	
	return helpprefs;
}	


/**********************************************************************************
 * FUNCTION - setupLayerBreaksToPreset: This function will be executed when the user
 * selects a predefined color scheme. It will fill the first and last breakpoints with the 
 * predefined colors and interpolate the breakpoints in between.
 * "preset" is an array of the colors in HEX of the predefined color scheme
 **********************************************************************************/
function setupLayerBreaksToPreset(e, mapName, preset, missingColor,axis,type){
	var elemName = mapName;
	if (typeof axis != 'undefined') {
		elemName += "_"+axis;
	}
	var i = 0; // find number of breakpoints in the 
	while(document.getElementById(elemName+"_color"+ ++i+"_colorPref"));
	var lastShown = i-1;
	// create dummy colorScheme
	var thresh = [];
	if (document.getElementById(elemName+"_breakPt0_breakPref")){ // if the breakpoints are changeable (data layer)...
		var firstBP = document.getElementById(elemName+"_breakPt0_breakPref").value;
		var lastBP = document.getElementById(elemName+"_breakPt"+ lastShown +"_breakPref").value;
		var range = lastBP-firstBP;
		for (var j = 0; j < preset.length; j++){
			thresh[j] =Number(firstBP)+j*(range/(preset.length-1));
		}
		var colorScheme = {"missing": missingColor,"thresholds": thresh,"colors": preset,"type": "continuous"};
		var csTemp = new ColorMap(colorScheme);
		
		for (var j = 0; j < i; j++) {
			var threshId = mapName+"_breakPt"+j;
			var colorId = mapName+"_color"+j;
			var breakpoint = document.getElementById(threshId+"_breakPref").value;
			document.getElementById(colorId+"_colorPref").value = csTemp.getRgbToHex(csTemp.getColor(breakpoint)); 
		} 
		document.getElementById(mapName+"_missing_colorPref").value = csTemp.getRgbToHex(csTemp.getColor("Missing")); 
	} else { // if the breakpoints are not changeable (covariate bar)...
		if (type == "Discrete"){ // if colors can be mapped directly
			for (var j = 0; j < i; j++) {
				var colorId = elemName+"_color"+j;
				if (j > preset.length){ // in case there are more breakpoints than predef colors, we cycle back
					document.getElementById(colorId+"_colorPref").value = preset[j%preset.length];
				}else{
					document.getElementById(colorId+"_colorPref").value = preset[j];
				} 
			} 
			document.getElementById(elemName+"_missing_colorPref").value = missingColor; 
		} else { // if colors need to be blended
			var colorMap = heatMap.getColorMapManager().getColorMap(axis, mapName)
			var thresholds = colorMap.getThresholds();
			var range = thresholds[thresholds.length-1]-thresholds[0];
			for (var j = 0; j < preset.length; j++){
				thresh[j] = Number(thresholds[0])+j*(range/(preset.length-1));
			}
			var colorScheme = {"missing": missingColor,"thresholds": thresh,"colors": preset,"type": "continuous"};
			var csTemp = new ColorMap(colorScheme);
			for (var j = 0; j < thresholds.length; j++) {
				var colorId = elemName+"_color"+j;
				var breakpoint = thresholds[j];
				document.getElementById(colorId+"_colorPref").value = csTemp.getRgbToHex(csTemp.getColor(breakpoint)); 
			} 
			document.getElementById(elemName+"_missing_colorPref").value = csTemp.getRgbToHex(csTemp.getColor("Missing")); 
		}
	}
}	

/**********************************************************************************
 * FUNCTION - showLayerBreak: The purpose of this function is to show the 
 * appropriate data layer panel based upon the user selection of the 
 * data layer dropdown on the data layer tab of the preferences screen.  This 
 * function is also called when an error is trappped, opening the data layer DIV
 * that contains the erroneous data entry.
 **********************************************************************************/
function showLayerBreak(selLayer) {
	var layerBtn = document.getElementById('dlPref_list');
	if (typeof selLayer != 'undefined') {
		layerBtn.value = selLayer;
	} 
	for (var i=0; i<layerBtn.length; i++){
		var layerVal = layerBtn.options[i].value;
		var layerDiv = document.getElementById("breakPrefs_"+layerVal);
		var layerSel = layerBtn.options[i].selected;
		if (layerSel) {
			layerDiv.style.display="block";
		} else {
			layerDiv.style.display="none";
		}
	}
}

/**********************************************************************************
 * FUNCTION - addLayerBreak: The purpose of this function is to add a breakpoint
 * row to a data layer colormap. A new row is created using the preceding row as a 
 * template (i.e. breakpt value and color same as row clicked on).  
 **********************************************************************************/
function addLayerBreak(pos,colorMapName) {
	//Retrieve colormap for data layer
	var colorMap = heatMap.getColorMapManager().getColorMap("data",colorMapName);
	var newThresholds = getNewBreakThresholds(colorMapName, pos, "add");
	var newColors = getNewBreakColors(colorMapName, "data", pos, "add");
	colorMap.setThresholds(newThresholds);
	colorMap.setColors(newColors);
	reloadLayerBreaksColorMap(colorMapName, colorMap);
}

/**********************************************************************************
 * FUNCTION - deleteLayerBreak: The purpose of this function is to remove a breakpoint
 * row from a data layer colormap.   
 **********************************************************************************/
function deleteLayerBreak(pos,colorMapName) {
	var colorMap = heatMap.getColorMapManager().getColorMap("data",colorMapName);
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	var newThresholds = getNewBreakThresholds(colorMapName, pos, "delete");
	var newColors = getNewBreakColors(colorMapName, "data", pos, "delete");
	//Apply new arrays for thresholds and colors to the datalayer
	//and reload the colormap.
	colorMap.setThresholds(newThresholds);
	colorMap.setColors(newColors);
	reloadLayerBreaksColorMap(colorMapName, colorMap);
}

/**********************************************************************************
 * FUNCTION - reloadLayerBreaksColorMap: The purpose of this function is to reload
 * the colormap for a given data layer.  The add/deleteLayerBreak methods call
 * this common function.  The layerPrefs DIV is retrieved and the setupLayerBreaks
 * method is called, passing in the newly edited colormap. 
 **********************************************************************************/
function reloadLayerBreaksColorMap(colorMapName, colorMap) {
	var e = document.getElementById('gear_btn')
	var colorMapMgr = heatMap.getColorMapManager();
	colorMapMgr.setColorMap(colorMapName, colorMap, "data");
	var breakPrefs = document.getElementById('breakPrefs_'+colorMapName);
	if (breakPrefs){
		breakPrefs.remove();
	}
	var layerprefs = getDivElement("layerPrefs");
	var breakPrefs = setupLayerBreaks(e, colorMapName, colorMapName);
	breakPrefs.style.display="block";
	layerPrefs.appendChild(breakPrefs);
}

/*===================================================================================
 *  COVARIATE CLASSIFICATION PREFERENCE PROCESSING FUNCTIONS
 *  
 *  The following functions are utilized to present heat map covariate classfication
 *  bar configuration options:
 *  	- setupClassPrefs
 *  	- setupClassBreaks
 *  	- setupAllClassesPrefs
 *      - showAllBars
 *      - setShowAll
 =================================================================================*/

/**********************************************************************************
 * FUNCTION - setupClassPrefs: The purpose of this function is to construct a DIV 
 * panel containing all covariate bar preferences.  A dropdown list containing all 
 * covariate classification bars is presented and individual DIVs for each data layer, 
 * containing  breakpoints/colors, are added. Additionally, a "front panel" DIV is
 * created for "ALL" classification bars that contains preferences that are global
 * to all of the individual bars.
 **********************************************************************************/
function setupClassPrefs(e, prefprefs){
	var rowClassBars = heatMap.getRowClassificationConfig();
	var rowClassBarsOrder = heatMap.getRowClassificationOrder();
	var colClassBars = heatMap.getColClassificationConfig();
	var colClassBarsOrder = heatMap.getColClassificationOrder();
	var classprefs = getDivElement("classPrefs");
	var prefContents = document.createElement("TABLE");
	addBlankRow(prefContents);
	var filterInput = "<input name='all_searchPref' id='all_searchPref'>";
	var filterButton = "<img id='all_searchPref_btn' src='" + staticPath + "images/filterClassButton.png' alt='Filter Covariates' onclick='filterClassPrefs(true);' align='top'/>";
	var searchClasses = filterInput+"&nbsp;&nbsp;"+filterButton+"&emsp;&emsp;";
	setTableRow(prefContents,[searchClasses], 4, 'right');
	addBlankRow(prefContents,2);
	var classSelect = "<select name='classPref_list' id='classPref_list' onchange='showClassBreak();'></select>"
	setTableRow(prefContents,["&nbsp;Covariate Bar: ", classSelect]);
	addBlankRow(prefContents);
	classprefs.appendChild(prefContents);
	var i = 0;
	for (var i = 0; i < rowClassBarsOrder.length;i++){
		var key = rowClassBarsOrder[i];
		var currentClassBar = rowClassBars[key];
		if (filterShow(key)) {
			var breakprefs = setupClassBreaks(e, key, "row", currentClassBar);
			breakprefs.style.display="none";
			//breakprefs.style.width = 300;
			classprefs.appendChild(breakprefs);
		}
	}
	for (var i = 0; i < colClassBarsOrder.length;i++){
		var key = colClassBarsOrder[i];
		var currentClassBar = colClassBars[key];
		if (filterShow(key)) {
			var breakprefs = setupClassBreaks(e, key, "col", currentClassBar);
			breakprefs.style.display="none";
			//breakprefs.style.width = 300;
			classprefs.appendChild(breakprefs);
		}
	}
	// Append a DIV panel for all of the covariate class bars 
	var allPrefs = setupAllClassesPrefs(); 
	allPrefs.style.display="block";
	classprefs.appendChild(allPrefs);
	
	return classprefs;
}

/**********************************************************************************
 * FUNCTION - setupClassBreaks: The purpose of this function is to construct a DIV 
 * containing a list of all covariate bars with informational data and user preferences 
 * that are common to all bars (show/hide and size).  
 **********************************************************************************/
function setupAllClassesPrefs(){
	var allprefs = getDivElement("breakPrefs_ALL");
	allprefs.style.height="100px";
	var prefContents = document.createElement("TABLE");
	prefContents.id = "tableAllClasses";
	addBlankRow(prefContents);
	var colShowAll = "<input name='all_showPref' id='all_showPref' type='checkbox' onchange='showAllBars();'> ";
	setTableRow(prefContents,["&nbsp;<u>"+"Covariate"+"</u>", "<b><u>"+"Position"+"</u></b>", colShowAll+"<b><u>"+"Show"+"</u></b>", "<b><u>"+"Height"+"</u></b>"]);
	var checkState = true;
	var rowClassBars = heatMap.getRowClassificationConfig();
	var rowClassBarsOrder = heatMap.getRowClassificationOrder();
	for (var i = 0;  i < rowClassBarsOrder.length; i++){
		var key = rowClassBarsOrder[i];
		var currentClassBar = rowClassBars[key];
		var keyrow = key+"_row";
		if (filterShow(key)) {
			var colShow = "&emsp;&emsp;<input name='"+keyrow+"_showPref' id='"+keyrow+"_showPref' type='checkbox' onchange='setShowAll();'";
			if (currentClassBar.show == 'Y') {
				colShow = colShow+"checked"
			}
			colShow = colShow+ " >";
			var colHeight = "<input name='"+keyrow+"_heightPref' id='"+keyrow+"_heightPref' value='"+currentClassBar.height+"' maxlength='2' size='2'>&emsp;";
			var displayName = key;
			if (key.length > 20){
				displayName = key.substring(0,20) + "...";
			}
			setTableRow(prefContents,["&nbsp;&nbsp;"+displayName,"Row",colShow,colHeight]); 
		}
	}
	var colClassBars = heatMap.getColClassificationConfig();
	var colClassBarsOrder = heatMap.getColClassificationOrder();
	for (var i = 0; i < colClassBarsOrder.length; i++){
		var key = colClassBarsOrder[i];
		var currentClassBar = colClassBars[key];
		var keycol = key+"_col";
		if (filterShow(key)) {
			var colShow = "&emsp;&emsp;<input name='"+keycol+"_showPref' id='"+keycol+"_showPref' type='checkbox' onchange='setShowAll();'";
			if (currentClassBar.show == 'Y') {
				colShow = colShow+"checked"
			}
			colShow = colShow+ " >";
			var colHeight = "<input name='"+keycol+"_heightPref' id='"+keycol+"_heightPref' value='"+currentClassBar.height+"' maxlength='2' size='2'>&emsp;";
			var displayName = key;
			if (key.length > 20){
				displayName = key.substring(0,20) + "...";
			}
			setTableRow(prefContents,["&nbsp;&nbsp;"+displayName,"Col",colShow,colHeight]); 
		}
	}
	allprefs.appendChild(prefContents);

	return allprefs;
}	

/**********************************************************************************
 * FUNCTION - setupClassBreaks: The purpose of this function is to construct a DIV 
 * containing a set informational data and a list of categories/colors for a given
 * covariate classfication bar.  
 **********************************************************************************/
function setupClassBreaks(e, key, barType, classBar){
	//must add barType to key when adding objects to DOM
	var keyRC = key+"_"+barType;
	var colorMap = heatMap.getColorMapManager().getColorMap(barType, key);
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	var helpprefs = getDivElement("breakPrefs_"+keyRC);
	var prefContents = document.createElement("TABLE"); 
	addBlankRow(prefContents);
	var pos = toTitleCase(barType);
	var typ = toTitleCase(colorMap.getType());
	setTableRow(prefContents,["&nbsp;Bar Position: ","<b>"+pos+"</b>"]);
	setTableRow(prefContents,["&nbsp;Bar Type: ","<b>"+typ+"</b>"]);
	addBlankRow(prefContents, 3);
	setTableRow(prefContents, ["&nbsp;<u>Category</u>","<b><u>"+"Color"+"</b></u>"]); 
	for (var j = 0; j < thresholds.length; j++) {
		var threshold = thresholds[j];
		var color = colors[j];
		var threshId = keyRC+"_breakPt"+j;
		var colorId = keyRC+"_color"+j;
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"'>"; 
		setTableRow(prefContents, ["&nbsp;&nbsp;"+threshold, colorInput]);
	} 
	addBlankRow(prefContents);
	setTableRow(prefContents, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='"+keyRC+"_missing_colorPref' id='"+keyRC+"_missing_colorPref' value='"+colorMap.getMissingColor()+"'>"]);
	addBlankRow(prefContents, 3);
	setTableRow(prefContents, ["&nbsp;<u>Choose a pre-defined color palette:</u>"],3);
	addBlankRow(prefContents);
	if (typ == "Discrete"){
		var scheme1 = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, #1f77b4,#ff7f0e,#2ca02c,#d62728,#9467bd,#8c564b,#e377c2,#7f7f7f,#bcbd22,#17becf);' onclick='setupLayerBreaksToPreset(event, \""+ key+ "\", [\"#1f77b4\",\"#ff7f0e\",\"#2ca02c\", \"#d62728\", \"#9467bd\", \"#8c564b\", \"#e377c2\", \"#7f7f7f\", \"#bcbd22\", \"#17becf\"],\"#ffffff\",\""+barType+"\",\""+typ+"\")'> </div><div class='presetPaletteMissingColor' style='background:white'></div></div>";
		var scheme2 = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, #1f77b4,#aec7e8,#ff7f0e,#ffbb78,#2ca02c,#98df8a,#d62728,#ff9896,#9467bd,#c5b0d5,#8c564b,#c49c94,#e377c2,#f7b6d2,#7f7f7f,#c7c7c7,#bcbd22,#dbdb8d,#17becf,#9edae5);' onclick='setupLayerBreaksToPreset(event, \""+ key+ "\", [\"#1f77b4\",\"#aec7e8\",\"#ff7f0e\",\"#ffbb78\",\"#2ca02c\",\"#98df8a\",\"#d62728\",\"#ff9896\",\"#9467bd\",\"#c5b0d5\",\"#8c564b\",\"#c49c94\",\"#e377c2\",\"#f7b6d2\",\"#7f7f7f\",\"#c7c7c7\",\"#bcbd22\",\"#dbdb8d\",\"#17becf\",\"#9edae5\"],\"#ffffff\",\""+barType+"\",\""+typ+"\")'> </div><div class='presetPaletteMissingColor' style='background:white'></div></div>";
		var scheme3 = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right,#393b79, #637939, #8c6d31, #843c39, #7b4173, #5254a3, #8ca252, #bd9e39, #ad494a, #a55194, #6b6ecf, #b5cf6b, #e7ba52, #d6616b, #ce6dbd, #9c9ede, #cedb9c, #e7cb94, #e7969c, #de9ed6);' onclick='setupLayerBreaksToPreset(event, \""+ key+ "\", [\"#393b79\", \"#637939\", \"#8c6d31\", \"#843c39\", \"#7b4173\", \"#5254a3\", \"#8ca252\", \"#bd9e39\", \"#ad494a\", \"#a55194\", \"#6b6ecf\", \"#b5cf6b\", \"#e7ba52\", \"#d6616b\", \"#ce6dbd\", \"#9c9ede\", \"#cedb9c\", \"#e7cb94\", \"#e7969c\", \"#de9ed6\"],\"#ffffff\",\""+barType+"\",\""+typ+"\")'> </div><div class='presetPaletteMissingColor' style='background:white'></div></div>";
		setTableRow(prefContents, [scheme1,scheme2,scheme3]);
		setTableRow(prefContents, ["&nbsp;Palette1",  "&nbsp;<b>Palette2</b>","&nbsp;<b>Palette3</b>"]);
	} else {
		var rainbow = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, red,orange,yellow,green,blue,violet);' onclick='setupLayerBreaksToPreset(event, \""+ key+ "\", [\"#FF0000\",\"#FF8000\",\"#FFFF00\",\"#00FF00\",\"#0000FF\",\"#FF00FF\"],\"#000000\",\""+barType+"\",\""+typ+"\")' > </div><div class='presetPaletteMissingColor' style='background:black'></div></div>";
		var greyscale = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, white,black);' onclick='setupLayerBreaksToPreset(event, \""+ key+ "\", [\"#FFFFFF\",\"#000000\"],\"#FF0000\",\""+barType+"\",\""+typ+"\")' > </div><div class='presetPaletteMissingColor' style='background:red'></div></div>";
		var redBlackGreen = "<div style='display:flex'><div id='setRedBlackGreen' class='presetPalette' style='background: linear-gradient(to right, green,black,red);' onclick='setupLayerBreaksToPreset(event, \""+ key +"\", [\"#00FF00\",\"#000000\",\"#FF0000\"],\"#ffffff\",\""+barType+"\",\""+typ+"\")'> </div>" +
		"<div class='presetPaletteMissingColor' style='background:white'></div></div>"
		setTableRow(prefContents, [greyscale,rainbow,redBlackGreen]);
		setTableRow(prefContents, ["&nbsp;Greyscale",  "&nbsp;<b>Rainbow</b>","&nbsp;<b>Green Red</b>"]);
	}
	helpprefs.style.height = prefContents.rows.length;;
	helpprefs.appendChild(prefContents);

	return helpprefs;
}	

/**********************************************************************************
 * FUNCTION - showAllBars: The purpose of this function is to set the condition of
 * the "show" checkbox for all covariate bars on the covariate bars tab of the user 
 * preferences dialog. These checkboxes are located on the DIV that is visible when 
 * the ALL entry of the covariate dropdown is selected. Whenever a  user checks the 
 * show all box, all other boxes are checked.  
 **********************************************************************************/
function showAllBars(){
	var showAllBox = document.getElementById('all_showPref');
	var checkState = false;
	if (showAllBox.checked) {
		checkState = true;
	}
	var rowClassBars = heatMap.getRowClassificationConfig();
	for (var key in rowClassBars){
		if (filterShow(key)) {
			var colShow = document.getElementById(key+"_row"+'_showPref');
			colShow.checked = checkState;
		}
	}
	var colClassBars = heatMap.getColClassificationConfig();
	for (var key in colClassBars){
		if (filterShow(key)) {
			var colShow = document.getElementById(key+"_col"+'_showPref');
			colShow.checked = checkState;
		}
	}
	
	return;
}	

/**********************************************************************************
 * FUNCTION - setShowAll: The purpose of this function is to set the condition of
 * the "show all" checkbox on the covariate bars tab of the user preferences dialog.
 * This checkbox is located on the DIV that is visible when the ALL entry of the 
 * covariate dropdown is selected. If a user un-checks a single box in the list of 
 * covariate bars, the show all box is un-checked. Conversely, if a user checks a box 
 * resulting in all of the boxes being selected, the show all box will be checked.
 **********************************************************************************/
function setShowAll(){
	var checkState = true;
	var rowClassBars = heatMap.getRowClassificationConfig();
	for (var key in rowClassBars){
		var colShow = document.getElementById(key+"_row"+'_showPref');
		if (filterShow(key)) {
			if (!colShow.checked) {
				checkState = false;
				break;
			}
		}
	}
	var colClassBars = heatMap.getColClassificationConfig();
	for (var key in colClassBars){
		var colShow = document.getElementById(key+"_col"+'_showPref');
		if (filterShow(key)) {
			if (!colShow.checked) {
				checkState = false;
				break;
			}
		}
	}
	var showAllBox = document.getElementById('all_showPref');
	showAllBox.checked = checkState;
	
	return;
}	

/**********************************************************************************
 * FUNCTION - showClassBreak: The purpose of this function is to show the 
 * appropriate classification bar panel based upon the user selection of the 
 * covariate dropdown on the covariates tab of the preferences screen.  This 
 * function is also called when an error is trappped, opening the covariate DIV
 * that contains the erroneous data entry.
 **********************************************************************************/
function showClassBreak(selClass) {
	var classBtn = document.getElementById("classPref_list");
	if (typeof selClass != 'undefined') {
		classBtn.value = selClass;
	} 
	for (var i=0; i<classBtn.length; i++){
		var classVal = "breakPrefs_"+classBtn.options[i].value;
		var classDiv = document.getElementById(classVal);
		var classSel = classBtn.options[i].selected;
		if (classSel) {
			classDiv.style.display="block";
		} else {
			classDiv.style.display="none";
		}
	}
}

/**********************************************************************************
 * FUNCTION - filterClassPrefs: The purpose of this function is to initiate the 
 * process of filtering option choices for classifications. It is fired when either
 * the "Filter Covariates" or "Clear Filters" button is pressed on the covariates 
 * preferences dialog.  The global filter value variable is set when filtering and 
 * cleared when clearing and the editPreferences function is called to reload all
 * preferences.
 **********************************************************************************/
function filterClassPrefs(filterOn){
	searchPerformed = true;
	showClassBreak("ALL");
	var filterButton = document.getElementById('all_searchPref_btn');
	var searchPrefSelect = document.getElementById('all_searchPref');
	var searchPrefVal = searchPrefSelect.value;
	if (filterOn) {
		if (searchPrefVal != "") {
			filterVal = searchPrefVal;
			filterButton.src = staticPath + "images/removeFilterClassButton.png";
			filterButton.onclick=function (){filterClassPrefs(false);};
		}
	} else {
		filterButton.src = staticPath + "images/filterClassButton.png";
		filterButton.onclick=function (){filterClassPrefs(true);};
		searchPrefSelect.value = "";
		filterVal = null;
	}
	var allprefs = document.getElementById("breakPrefs_ALL");
	hiddenItems = addClassPrefOptions();
	filterAllClassesTable(hiddenItems);
	showClassBreak("ALL");
}

/**********************************************************************************
 * FUNCTION - filterAllClassesTable: The purpose of this function is to assign option
 * values to the Covariates dropdown control on the Covariates preferences tab.  All 
 * covariates will be loaded at startup.  The filter control, however, is used to 
 * limit the visible options in this dropdown.
 **********************************************************************************/
function filterAllClassesTable(hiddenItems) {    
    var table=document.getElementById('tableAllClasses');
    for(var i=0; i<table.rows.length;i++){
        var row  = table.rows[i];
        row.className = "show";
        var td = row.cells[0];
        var tdText = td.innerHTML.replace(/&nbsp;/g,'');
        for (var j=0;j<hiddenItems.length;j++) {
        	if (hiddenItems[j] === tdText) {
            	row.className = "hide";
        	}
        }
     }
}

/**********************************************************************************
 * FUNCTION - addClassPrefOptions: The purpose of this function is to assign option
 * values to the Covariates dropdown control on the Covariates preferences tab.  All 
 * covariates will be loaded at startup.  The filter control, however, is used to 
 * limit the visible options in this dropdown.  This function returns a string 
 * array containing a list of all options that are NOT being displayed.  This list
 * is used to hide rows on the ALL covariates panel.
 **********************************************************************************/
function addClassPrefOptions() {
	var rowClassBars = heatMap.getRowClassificationConfig();
	var colClassBars = heatMap.getColClassificationConfig();
	var rowClassBarsOrder = heatMap.getRowClassificationOrder();
	var colClassBarsOrder = heatMap.getColClassificationOrder();
	var classSelect = document.getElementById('classPref_list');
	var hiddenOpts = new Array();
	classSelect.options.length = 0;
	classSelect.options[classSelect.options.length] = new Option('ALL', 'ALL');
	for (var i=0; i < rowClassBarsOrder.length;i++){
		var key = rowClassBarsOrder[i];
		var keyrow = key+"_row";
		var displayName = key;
		if (key.length > 20){
			displayName = key.substring(0,20) + "...";
		}
		if (filterShow(key)) {
			classSelect.options[classSelect.options.length] = new Option(displayName, keyrow);
		} else {
			hiddenOpts.push(displayName);
		}
	}
	for (var i=0; i < colClassBarsOrder.length;i++){
		var key = colClassBarsOrder[i];
		var keycol = key+"_col";
		var displayName = key;
		if (key.length > 20){
			displayName = key.substring(0,20) + "...";
		}
		if (filterShow(key)) {
			classSelect.options[classSelect.options.length] = new Option(displayName, keycol);
		} else {
			hiddenOpts.push(displayName);
		}
	}
	
	return hiddenOpts;
}

/**********************************************************************************
 * FUNCTION - filterShow: The purpose of this function is to determine whether a 
 * given covariates bar is to be shown given the state of the covariates filter
 * search text box.
 **********************************************************************************/
function filterShow(key) {
	var filterShow = false;
	var lowerkey = key.toLowerCase();
	if (filterVal != null) {
		if (lowerkey.indexOf(filterVal.toLowerCase()) >= 0) {
			filterShow = true;
		}
	} else {
		filterShow = true;
	}
	
	return filterShow;
}

/*===================================================================================
 *  ROW COLUMN PREFERENCE PROCESSING FUNCTIONS
 *  
 *  The following functions are utilized to present heat map covariate classification
 *  bar configuration options:
 *  	- setupRowColPrefs
 *  	- showDendroSelections
 *      - dendroRowShowChange
 *      - dendroColShowChange
 =================================================================================*/

/**********************************************************************************
 * FUNCTION - setupRowColPrefs: The purpose of this function is to construct a DIV 
 * panel containing all row & col preferences.  Two sections are presented, one for
 * rows and the other for cols.  Informational data begins each section and 
 * properties for modifying the appearance of row/col dendograms appear at the end.
 **********************************************************************************/
function setupRowColPrefs(e, prefprefs){
	var rowcolprefs = getDivElement("rowsColsPrefs");
	var prefContents = document.createElement("TABLE");
	addBlankRow(prefContents);
	setTableRow(prefContents,["MAP INFORMATION:"], 2);
	addBlankRow(prefContents);
	setTableRow(prefContents,["&nbsp;&nbsp;Version Id:", heatMap.getMapInformation().version_id]);
	setTableRow(prefContents,["&nbsp;&nbsp;Read Only:", heatMap.getMapInformation().read_only]);
	addBlankRow(prefContents,2);
	setTableRow(prefContents,["ROW INFORMATION:"], 2);
	addBlankRow(prefContents);
	var rowLabels = heatMap.getRowLabels();
	var rowOrganization = heatMap.getRowOrganization();
	var rowOrder = rowOrganization['order_method'];
	setTableRow(prefContents,["&nbsp;&nbsp;Total Rows:",heatMap.getTotalRows()]);
	setTableRow(prefContents,["&nbsp;&nbsp;Labels Type:",rowLabels['label_type']]);
	setTableRow(prefContents,["&nbsp;&nbsp;Ordering Method:",rowOrder]);
	var dendroShowOptions = "<option value='ALL'>Summary and Detail</option><option value='SUMMARY'>Summary Only</option><option value='NONE'>Hide</option></select>";
	var dendroHeightOptions = "<option value='50'>50%</option><option value='75'>75%</option><option value='100'>100%</option><option value='125'>125%</option><option value='150'>150%</option><option value='200'>200%</option><option value='300'>300%</option></select>";
	if (rowOrder === "Hierarchical") {
		setTableRow(prefContents,["&nbsp;&nbsp;Agglomeration Method:",rowOrganization['agglomeration_method']]);
		setTableRow(prefContents,["&nbsp;&nbsp;Distance Metric:",rowOrganization['distance_metric']]);
		var rowDendroSelect = "<select name='rowDendroShowPref' id='rowDendroShowPref' onchange='dendroRowShowChange()'>"
		rowDendroSelect = rowDendroSelect+dendroShowOptions;
		setTableRow(prefContents,["&nbsp;&nbsp;Show Dendrogram:",rowDendroSelect]);  
		var rowDendroHeightSelect = "<select name='rowDendroHeightPref' id='rowDendroHeightPref'>"
		rowDendroHeightSelect = rowDendroHeightSelect+dendroHeightOptions;
		setTableRow(prefContents,["&nbsp;&nbsp;Dendrogram Height:",rowDendroHeightSelect]); 
	}  
	addBlankRow(prefContents,2);
	setTableRow(prefContents,["COLUMN INFORMATION:"], 2);
	addBlankRow(prefContents);
	
	var colLabels = heatMap.getColLabels();
	var colOrganization = heatMap.getColOrganization();
	var colOrder = colOrganization['order_method'];
	setTableRow(prefContents,["&nbsp;&nbsp;Total Columns:",heatMap.getTotalCols()]);
	setTableRow(prefContents,["&nbsp;&nbsp;Labels Type:",colLabels['label_type']]);
	setTableRow(prefContents,["&nbsp;&nbsp;Ordering Method:",colOrder]);
	if (colOrder === "Hierarchical") {
		setTableRow(prefContents,["&nbsp;&nbsp;Agglomeration Method:",colOrganization['agglomeration_method']]);
		setTableRow(prefContents,["&nbsp;&nbsp;Distance Metric:",colOrganization['distance_metric']]);
		var colDendroShowSelect = "<select name='colDendroShowPref' id='colDendroShowPref' onchange='dendroColShowChange()'>"
		colDendroShowSelect = colDendroShowSelect+dendroShowOptions;
		var colDendroHeightSelect = "<select name='colDendroHeightPref' id='colDendroHeightPref'>"
		colDendroHeightSelect = colDendroHeightSelect+dendroHeightOptions;
		setTableRow(prefContents,["&nbsp;&nbsp;Show Dendrogram:",colDendroShowSelect]);
		setTableRow(prefContents,["&nbsp;&nbsp;Dendrogram Height:",colDendroHeightSelect]);
	}
	addBlankRow(prefContents,2);
	setTableRow(prefContents,["MAP SIZING:"]);
	var sumWidth = Math.round(document.getElementById('summary_chm').offsetWidth/(.96*document.getElementById('container').offsetWidth)*100);
	var detWidth = Math.round(document.getElementById('detail_chm').offsetWidth/(.96*document.getElementById('container').offsetWidth)*100);
	var mapHeight = Math.round(document.getElementById('detail_chm').clientHeight/container.clientHeight*100);
	setTableRow(prefContents,["&nbsp;&nbsp;Summary Width:","<input type=\"text\" name=\"summaryWidthPref\" id=\"summaryWidthPref\" style=\"width:40px\" value=\"" + sumWidth+"\">%"]);
	setTableRow(prefContents,["&nbsp;&nbsp;Detail Width:","<input type=\"text\" name=\"detailWidthPref\" id=\"detailWidthPref\" style=\"width:40px\" value=\"" + detWidth + "\">%"]);
	setTableRow(prefContents,["&nbsp;&nbsp;Map Height:","<input type=\"text\" name=\"mapHeightPref\" id=\"mapHeightPref\" style=\"width:40px\" value=\"" + mapHeight + "\">%"]);
	
	rowcolprefs.appendChild(prefContents);

	return rowcolprefs;
}

/**********************************************************************************
 * FUNCTION - showDendroSelections: The purpose of this function is to set the 
 * states of the row/column dendrogram show and height preferences.
 **********************************************************************************/
function showDendroSelections() {
	var rowDendroConfig = heatMap.getRowDendroConfig();
	var rowOrganization = heatMap.getRowOrganization();
	var rowOrder = rowOrganization['order_method'];
	if (rowOrder === "Hierarchical") {
		var dendroShowVal = rowDendroConfig.show;
		document.getElementById("rowDendroShowPref").value = dendroShowVal;
		var rowHeightPref = document.getElementById("rowDendroHeightPref");
		if (dendroShowVal === 'NONE') {
			var opt = rowHeightPref.options[6];
			if (typeof opt != 'undefined') {
				rowHeightPref.options[6].remove();
			}
			var option = document.createElement("option");
			option.text = "NA";
			option.value = '10';
			rowHeightPref.add(option);
			rowHeightPref.disabled = true;
			rowHeightPref.value = option.value;
		} else {
			rowHeightPref.value = rowDendroConfig.height;
		}
	}
	var colOrganization = heatMap.getColOrganization();
	var colOrder = colOrganization['order_method'];
	var colDendroConfig = heatMap.getColDendroConfig();
	if (colOrder === "Hierarchical") {
		var dendroShowVal = colDendroConfig.show;
		document.getElementById("colDendroShowPref").value = dendroShowVal;
		var colHeightPref = document.getElementById("colDendroHeightPref");
		if (dendroShowVal === 'NONE') {
			var opt = colHeightPref.options[6];
			if (typeof opt != 'undefined') {
				colHeightPref.options[6].remove();
			}
			var option = document.createElement("option");
			option.text = "NA";
			option.value = '10';
			colHeightPref.add(option);
			colHeightPref.disabled = true;
			colHeightPref.value = option.value;
		} else {
			colHeightPref.value = colDendroConfig.height;
		}
	}
}

/**********************************************************************************
 * FUNCTION - dendroRowShowChange: The purpose of this function is to respond to
 * a change event on the show row dendrogram dropdown.  If the change is to Hide, 
 * the row dendro height is set to 10 and the dropdown disabled. If the change is to
 * one of the 2 Show options AND was previously Hide, set height to the default
 * value of 100 and enable the dropdown.
 **********************************************************************************/
function dendroRowShowChange() {
	var newValue = document.getElementById("rowDendroShowPref").value;
	var rowHeightPref = document.getElementById("rowDendroHeightPref");
	if (newValue === 'NONE') {
		var option = document.createElement("option");
		option.text = "NA";
		option.value = '10';
		rowHeightPref.add(option);
		rowHeightPref.value = '10';
		rowHeightPref.disabled = true;
	} else if (rowHeightPref.disabled) {
		var opt = rowHeightPref.options[6];
		if (typeof opt != 'undefined') {
			rowHeightPref.options[6].remove();
		}
		rowHeightPref.value = '100';
		rowHeightPref.disabled = false;
	}
}

/**********************************************************************************
 * FUNCTION - dendroRowShowChange: The purpose of this function is to respond to
 * a change event on the show row dendrogram dropdown.  If the change is to Hide, 
 * the row dendro height is set to 10 and the dropdown disabled. If the change is to
 * one of the 2 Show options AND was previously Hide, set height to the default
 * value of 100 and enable the dropdown.
 **********************************************************************************/
function dendroColShowChange() {
	var newValue = document.getElementById("colDendroShowPref").value;
	var colHeightPref = document.getElementById("colDendroHeightPref");
	if (newValue === 'NONE') {
		var option = document.createElement("option");
		option.text = "NA";
		option.value = '10';
		colHeightPref.add(option);
		colHeightPref.value = '10';
		colHeightPref.disabled = true;
	} else if (colHeightPref.disabled) {
		var opt = colHeightPref.options[6];
		if (typeof opt != 'undefined') {
			colHeightPref.options[6].remove();
		}
		colHeightPref.value = '100';
		colHeightPref.disabled = false;
	}
}



