var BYTE_PER_RGBA = 4;

var canvas;
var box_canvas;  //canvas on top of WebGL canvas for selection box 
var gl; // WebGL contexts
var textureParams;

//Size of heat map components
var summaryHeightPercentage = .82; // this is the amount of vertical space the col dendro and the map should take up on the summary chm div (taken from the css)
var summaryWidthPercentage = .78; // this is the amount of horizontal space the row dendro and the map should take up on the summary chm div (taken from the css)
var dendroPaddingHeight = 2;
var rowDendroHeight;      // this is the height of the row dendro in canvas coords (this value may be adjusted eventually by the user)
var columnDendroHeight;   // this is the height of the col dendro in canvas coords (this value may be adjusted eventually by the user)
var rowDendroBaseHeight = 100;
var columnDendroBaseHeight = 100;
var normDendroMatrixHeight = 500; // this is the height of the dendro matrices created in buildDendroMatrix
var rowClassPadding = 2;          // space between classification bars
var colClassPadding = 2;          // space between classification bars
var rowClassBarWidth;
var colClassBarHeight;
var rowClassScale = 1;
var colClassScale = 1;
var summaryMatrixWidth;
var summaryMatrixHeight;
var summaryTotalHeight;
var summaryTotalWidth;
var max_values = 9999999999.99;
var avg_value = 0;

var summaryColumnDendro;
var summaryRowDendro;
var rowDendroBars;
var colDendroBars;
var colDendroMatrix;
var rowDendroMatrix;
var chosenBar = {axis: null, index: null};

var TexPixels;

var chmInitialized = 0;
var dragSelect=false;	  // Indicates if user has made a drag selection on the summary panel
var clickStartRow=null;   // End row of current selected position
var clickStartCol=null;   // Left column of the current selected position
var mouseEventActive = false;

var texProgram;

var eventTimer = 0; // Used to delay draw updates

//Main function that draws the summary heat map. chmFile is only used in file mode.
function initSummaryDisplay() {
	canvas = document.getElementById('summary_canvas');
	box_canvas = document.getElementById('summary_box_canvas');
	
	//Add necessary event listeners for canvas
	canvas.addEventListener("touchstart", onMouseDownCanvas);
	canvas.addEventListener("touchend", onMouseUpCanvas);
	canvas.onmousedown = onMouseDownCanvas;
	canvas.onmouseup = onMouseUpCanvas;
	canvas.onmousemove = onMouseMoveCanvas;
	canvas.onmouseout = onMouseOut;
	
	// set the position to (1,1) so that the detail pane loads at the top left corner of the summary.
	currentRow = 1;
	currentCol = 1;
	if (getURLParameter("row") !== "" && !isNaN(Number(getURLParameter("row")))){
		currentRow = Number(getURLParameter("row"))
	}
	if (getURLParameter("column") !== "" && !isNaN(Number(getURLParameter("column")))){
		currentCol = Number(getURLParameter("column"))
	}
};

// Callback that is notified every time there is an update to the heat map 
// initialize, new data, etc.  This callback draws the summary heat map.
function processSummaryMapUpdate (event, level) {   

	if (event == MatrixManager.Event_INITIALIZED) {
		heatMap.configureButtonBar();
		heatMap.configureFlick();
		summaryInit();
	} else if (event == MatrixManager.Event_NEWDATA && level == MatrixManager.SUMMARY_LEVEL){
		//Summary tile - wait a bit to see if we get another tile quickly, then draw
		if (eventTimer != 0) {
			//New tile arrived - reset timer
			clearTimeout(eventTimer);
		}
		eventTimer = setTimeout(buildSummaryTexture, 200);
	} 
	//Ignore updates to other tile types.
}

// Perform all initialization functions for Summary heat map
function summaryInit() {
	if (!summaryColumnDendro){
		summaryColumnDendro = new SummaryColumnDendrogram();
	}
	if (!summaryRowDendro){
		summaryRowDendro = new SummaryRowDendrogram();
	}
	
	summaryMatrixWidth = heatMap.getNumColumns(MatrixManager.SUMMARY_LEVEL);
	summaryMatrixHeight = heatMap.getNumRows(MatrixManager.SUMMARY_LEVEL);
	
	//Classificaton bars get stretched on small maps, scale down the bars and padding.
	rowClassScale = Math.min(summaryMatrixWidth / 500, 1);
	rowClassPadding = Math.ceil(rowClassPadding * rowClassScale);
	colClassScale = Math.min(summaryMatrixHeight / 500, 1);
	colClassPadding = Math.ceil(colClassPadding * colClassScale);
	rowClassBarWidth = calculateSummaryTotalClassBarHeight("row");
	colClassBarHeight = calculateSummaryTotalClassBarHeight("column");

	calcTotalSize();
	//Resize summary area for small or skewed maps.
	initSummarySize();
	summaryRowDendro.resize();
	summaryRowDendro.draw();
	summaryColumnDendro.resize();
	summaryColumnDendro.draw();
	canvas.width =  summaryTotalWidth;
	canvas.height = summaryTotalHeight;
	
	var nameDiv = document.getElementById("mapName");
	nameDiv.innerHTML = "<b>Map Name:</b>&nbsp;&nbsp;"+heatMap.getMapInformation().name;
	setupGl();
	initGl();
	buildSummaryTexture();
	drawLeftCanvasBox();
	clearSelectionMarks();
	drawRowSelectionMarks();
	drawColSelectionMarks();
}

// Sets summary and detail chm to the config height and width.
function initSummarySize() {
	var summary = document.getElementById('summary_chm');
	var divider = document.getElementById('divider');
	var detail = document.getElementById('detail_chm');
	summary.style.width = parseFloat(heatMap.getMapInformation().summary_width)*.96 + "%";
	
	summary.style.height = container.clientHeight*parseFloat(heatMap.getMapInformation().summary_height)/100 + "px";
	
	detail.style.width = parseFloat(heatMap.getMapInformation().detail_width)*.96 + "%";
	detail.style.height = container.clientHeight*parseFloat(heatMap.getMapInformation().detail_height)/100 + "px";
	divider.style.height = detCanvas.clientHeight;
	
	setSummarySize();
}

// Sets summary and detail chm to newly adjusted size.
function setSummarySize() {
	var left = summaryRowDendro.getDivWidth()*summaryWidthPercentage + dendroPaddingHeight;
	var top = summaryColumnDendro.getDivHeight() + dendroPaddingHeight;
	var width = document.getElementById("summary_chm").clientWidth - summaryRowDendro.getDivWidth();
	var height = document.getElementById("summary_chm").clientHeight*summaryHeightPercentage - summaryColumnDendro.getDivHeight();

	canvas.style.left=left;
	canvas.style.top=top;
	canvas.style.width=width;
	canvas.style.height=height;
	
	//The selection box canvas is on top of the webGL canvas but
	//is always resized to the actual on screen size to draw boxes clearly.
	box_canvas.style.left=left;
	box_canvas.style.top=canvas.style.top;
	box_canvas.width = width+1;
	box_canvas.height = height+1;
	setDetCanvasBoxSize();
}

//Set the variables for the total size of the summary heat map - used to set canvas, WebGL texture, and viewport size.
function calcTotalSize() {
	summaryTotalHeight = summaryMatrixHeight + colClassBarHeight;
	summaryTotalWidth = summaryMatrixWidth + rowClassBarWidth;
}

function buildSummaryTexture() {
	eventTimer = 0;

	var colorMap = heatMap.getColorMapManager().getColorMap("data",currentDl);
	var colors = colorMap.getColors();
	var missing = colorMap.getMissingColor();
	
	var pos = 0;
	
	//Setup texture to draw on canvas.
	//Needs to go backward because WebGL draws bottom up.
	avg_value = 0;
	for (var i = heatMap.getNumRows(MatrixManager.SUMMARY_LEVEL); i > 0; i--) {
		pos += (rowClassBarWidth)*BYTE_PER_RGBA; // SKIP SPACE RESERVED FOR ROW CLASSBARS + ROW DENDRO
		for (var j = 1; j <= heatMap.getNumColumns(MatrixManager.SUMMARY_LEVEL); j++) { // draw the heatmap
			var val = heatMap.getValue(MatrixManager.SUMMARY_LEVEL, i, j);
			if (val < max_values) {
				avg_value += val;
			}
			var color = colorMap.getColor(val);

			TexPixels[pos] = color['r'];
			TexPixels[pos + 1] = color['g'];
			TexPixels[pos + 2] = color['b'];
			TexPixels[pos + 3] = color['a'];
			pos+=BYTE_PER_RGBA;
		}
	}
	avg_value = (avg_value / (heatMap.getNumRows(MatrixManager.SUMMARY_LEVEL) * heatMap.getNumColumns(MatrixManager.SUMMARY_LEVEL)));
	// draw column classifications after the map
	drawColClassBars(TexPixels);
	
	// draw row classifications after that
	drawRowClassBars(TexPixels);
	
	drawSummaryHeatMap();
}
	
//WebGL code to draw the summary heat map.
function drawSummaryHeatMap() {
	gl.useProgram(texProgram);
	var buffer = gl.createBuffer();
	gl.buffer = buffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	var vertices = [ -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, 1 ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	var byte_per_vertex = Float32Array.BYTES_PER_ELEMENT;
	var component_per_vertex = 2;
	buffer.numItems = vertices.length / component_per_vertex;
	var stride = component_per_vertex * byte_per_vertex;
	//var program = gl.program;
	var position = gl.getAttribLocation(texProgram, 'position');	
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, stride, 0);
	gl.activeTexture(gl.TEXTURE0);
	gl.texImage2D(
			gl.TEXTURE_2D, 
			0, 
			gl.RGBA, 
			textureParams['width'], 
			textureParams['height'], 
			0, 
			gl.RGBA,
			gl.UNSIGNED_BYTE, 
			TexPixels);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.buffer.numItems);
}

function onMouseDownCanvas (evt) {
	mouseEventActive = true;
	evt.preventDefault();
	evt.stopPropagation();	
	sumCanvas = document.getElementById('summary_canvas');
	sumCanvas.style.cursor="crosshair";
	var sumOffsetX = evt.touches ? evt.touches[0].offsetX : evt.offsetX;
	var sumOffsetY = evt.touches ? evt.touches[0].offsetY : evt.offsetY;
	var sumRow = canvasToMatrixRow(getCanvasY(sumOffsetY));
	var sumCol = canvasToMatrixCol(getCanvasX(sumOffsetX));
	clickStartRow = (sumRow*heatMap.getRowSummaryRatio(MatrixManager.SUMMARY_LEVEL));
	clickStartCol = (sumCol*heatMap.getColSummaryRatio(MatrixManager.SUMMARY_LEVEL));
}

function onMouseOut(evt) {
	mouseEventActive = false;
	canvas.style.cursor="default";
}

function onMouseMoveCanvas(evt) {
	if (mouseEventActive) {
		if ((mode === 'NORMAL') && (evt.which==1)) {
			if (evt.shiftKey) {
				dragSelection(evt);
			} else {
				dragMove(evt);
			}
		}
	}
}

//Translate click into row column position and then draw select box.
function onMouseUpCanvas (evt) {
	if (mouseEventActive) {
		evt.preventDefault();
		evt.stopPropagation();	
		sumCanvas = document.getElementById('summary_canvas');
		var clickSection = 'Matrix';
		//Drag selection has already navigated so only move selection box if simple click has occurred.
		if (!dragSelect) {
			var sumOffsetX = evt.touches ? evt.layerX : evt.offsetX;
			var sumOffsetY = evt.touches ? evt.layerY : evt.offsetY;
			var xPos = getCanvasX(sumOffsetX);
			var yPos = getCanvasY(sumOffsetY);
			clickSelection(xPos, yPos);
			clickStartRow = null;
			clickStartCol = null;
		} 
		dragSelect = false;
		sumCanvas.style.cursor="default";
	
		//Make sure the selected row/column are within the bounds of the matrix.
		checkRow();
		checkColumn();
		mouseEventActive = false;
	}
}

function clickSelection(xPos, yPos) {
	var sumRow = canvasToMatrixRow(yPos) - Math.floor(getCurrentSumDataPerCol()/2);
	var sumCol = canvasToMatrixCol(xPos) - Math.floor(getCurrentSumDataPerRow()/2);
	setCurrentRowFromSum(sumRow);
	setCurrentColFromSum(sumCol); 
	updateSelection();
}

function dragMove(evt) {
	var sumOffsetX = evt.touches ? evt.layerX : evt.offsetX;
	var sumOffsetY = evt.touches ? evt.layerY : evt.offsetY;
	var xPos = getCanvasX(sumOffsetX);
	var yPos = getCanvasY(sumOffsetY);
	var sumRow = canvasToMatrixRow(yPos) - Math.floor(getCurrentSumDataPerCol()/2);
	var sumCol = canvasToMatrixCol(xPos) - Math.floor(getCurrentSumDataPerRow()/2);
	setCurrentRowFromSum(sumRow);
	setCurrentColFromSum(sumCol); 
	updateSelection();
}

function dragSelection(evt) {
	var sumOffsetX = evt.touches ? evt.touches[0].offsetX : evt.offsetX;
	var sumOffsetY = evt.touches ? evt.touches[0].offsetY : evt.offsetY;
	var xPos = getCanvasX(sumOffsetX);
	var yPos = getCanvasY(sumOffsetY);
	var sumRow = canvasToMatrixRow(yPos);
	var sumCol = canvasToMatrixCol(xPos);
	var clickEndRow = (sumRow*heatMap.getRowSummaryRatio(MatrixManager.SUMMARY_LEVEL));
	var clickEndCol = (sumCol*heatMap.getColSummaryRatio(MatrixManager.SUMMARY_LEVEL));
	//If movement less than 5 rows and cols, disregard drag selection
	if ((Math.abs(clickStartRow - clickEndRow) < 5) && (Math.abs(clickStartCol - clickEndCol) < 5)) {
		dragSelect = false;
		return;
	} else {
		dragSelect = true;
	}
	var startRow = Math.min(clickStartRow,clickEndRow);
	var startCol = Math.min(clickStartCol,clickEndCol);
	var endRow = Math.max(clickStartRow,clickEndRow);
	var endCol = Math.max(clickStartCol,clickEndCol);
	//Size the selected box and assign the larger dimension as a 
	//value to be used in selecting zoom level to apply.
	var colVal = (endRow - startRow);
	var rowVal = (endCol - startCol);
	
	var zoomCalcVal = Math.max(colVal,rowVal);
	var boxSize = 0;
	//Loop zoomBoxSizes to pick the one that will be large enough
	//to encompass user-selected area
	for (var i=zoomBoxSizes.length-1; i>=0;i--) {
		boxSize = zoomBoxSizes[i];
		boxCalcVal = (detailDataViewWidth-detailDataViewBorder)/boxSize;
		if (boxCalcVal > zoomCalcVal) {
			//Down size box if greater than map dimensions.
			if (boxCalcVal >= Math.min(heatMap.getTotalRows(),heatMap.getTotalCols())) {
				boxSize = zoomBoxSizes[i+1];
			}
			break;
		}
	}
	boxCalcVal = (detailDataViewWidth-detailDataViewBorder)/boxSize;
	if (boxCalcVal < Math.min(heatMap.getTotalRows(),heatMap.getTotalCols())) {
		setDetailDataSize(boxSize); 
		currentRow = startRow;
		currentCol = startCol;
	    checkRow();
	    checkColumn();
		updateSelection();
	}
}

//Browsers resizes the canvas.  This function translates from a click position
//back to the original (non-scaled) canvas position. 
function getCanvasX(offsetX) {
	return (Math.floor((offsetX/canvas.clientWidth) * canvas.width));
}

function getCanvasY(offsetY) {
	return (Math.floor((offsetY/canvas.clientHeight) * canvas.height));
}

//Return the summary row given an y position on the canvas
function canvasToMatrixRow(y) {
	return (y - colClassBarHeight  );
} 

function canvasToMatrixCol(x) {
	return (x - rowClassBarWidth );
}


//Given a matrix row, return the canvas position
function getCanvasYFromRow(row){
	return (row + colClassBarHeight);
}

function getCanvasXFromCol(col){
	return (col + rowClassBarWidth);
}

/**********************************************************************************
 * FUNCTION - drawLeftCanvasBox: This function draws the view box on the summary
 * pane whenever the position in the detail pane has changed. (e.g. on load, on click,
 * on drag, etc...). A conversion is done from detail to summary coordinates, the 
 * new box position is calculated, and the summary pane is re-drawn.  It also draws
 * the black border around the summary heat map and gray panels that bracket sub-
 * dendro selections when in sub-dendro mode.
 **********************************************************************************/
function drawLeftCanvasBox() {
	var ctx=box_canvas.getContext("2d");
	ctx.clearRect(0, 0, box_canvas.width, box_canvas.height);
	
	// Draw the heat map border in black
	var boxX = (rowClassBarWidth / summaryTotalWidth) * box_canvas.width;
	var boxY = (colClassBarHeight / summaryTotalHeight) * box_canvas.height;
	var boxW = box_canvas.width-boxX;
	var boxH = box_canvas.height-boxY;
	ctx.lineWidth=1;
	ctx.strokeStyle="#000000";
	ctx.strokeRect(boxX,boxY,boxW,boxH);
	
	//If in sub-dendro mode, draw rectangles outside of selected range.
	//Furthermore, if the average color is dark make those rectangles
	//lighter than the heatmap, otherwise, darker.
	if (mode.startsWith('RIBBON')) {
		var colorMap = heatMap.getColorMapManager().getColorMap("data",currentDl);
		var color = colorMap.getColor(avg_value);
		if (colorMap.isColorDark(color)) {
			ctx.fillStyle="rgba(10, 10, 10, 0.25)"; 
		} else {
			ctx.fillStyle="rgba(255, 255, 255, 0.25)"; 
		}
	}
	//Draw sub-dendro box
	if (mode.startsWith('RIBBONH') && (selectedStart > 0)) {
		var summaryRatio = heatMap.getColSummaryRatio(MatrixManager.SUMMARY_LEVEL);
		var adjustedStart = selectedStart / summaryRatio;
		var adjustedStop = selectedStop / summaryRatio;
		boxX = (((rowClassBarWidth - 1) / canvas.width) * box_canvas.width) + 1;
		boxY = ((colClassBarHeight)/canvas.height * box_canvas.height);
		boxW = ((adjustedStart+1) / canvas.width) * box_canvas.width;
		boxH = box_canvas.height-boxY;
		ctx.fillRect(boxX,boxY,boxW,boxH); 
		boxX = (((rowClassBarWidth+adjustedStop - 1) / canvas.width) * box_canvas.width) + 1;
		boxW = (((canvas.width-adjustedStop)+1) / canvas.width) * box_canvas.width;
		ctx.fillRect(boxX,boxY,boxW,boxH); 
	} else if (mode.startsWith('RIBBONV')  && selectedStart > 0) {
		var summaryRatio = heatMap.getRowSummaryRatio(MatrixManager.SUMMARY_LEVEL);
		var adjustedStart = selectedStart / summaryRatio;
		var adjustedStop = selectedStop / summaryRatio;
		boxX = ((rowClassBarWidth / canvas.width) * box_canvas.width);
		boxY = ((colClassBarHeight)/canvas.height * box_canvas.height);
		var boxW = box_canvas.width-boxX;
		var boxH = ((adjustedStart+1) / canvas.height) * box_canvas.height;
		ctx.fillRect(boxX,boxY,boxW,boxH); 
		var boxY = ((colClassBarHeight+adjustedStop)/canvas.height * box_canvas.height);
		var boxH = (((canvas.height-adjustedStop)+1) / canvas.height) * box_canvas.height;
		ctx.fillRect(boxX,boxY,boxW,boxH); 
	}

	// Draw the View Box using user-defined defined selection color 
	boxX = (((getCurrentSumCol() + rowClassBarWidth - 1) / canvas.width) * box_canvas.width) + 2;
	boxY = (((getCurrentSumRow() + colClassBarHeight - 1) / canvas.height) * box_canvas.height) + 1;
	boxW = (getCurrentSumDataPerRow() / canvas.width) * box_canvas.width - 2;
	boxH = (getCurrentSumDataPerCol() / canvas.height) * box_canvas.height - 2;
	var dataLayers = heatMap.getDataLayers();
	var dataLayer = dataLayers[currentDl];
	ctx.strokeStyle=dataLayer.selection_color;
	ctx.lineWidth=3;
	ctx.strokeRect(boxX,boxY,boxW,boxH);
}

//WebGL stuff

function setupGl() {
	gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
	// If standard webgl context cannot be found use experimental-webgl
	if (!gl) {
		gl = canvas.getContext('experimental-webgl');
	}
	
	gl.viewportWidth = summaryTotalWidth;
	gl.viewportHeight = summaryTotalHeight;
	gl.clearColor(1, 1, 1, 1);

	//Texture shaders
	texProgram = gl.createProgram();
	var vertexShader = getVertexShader(gl);
	var fragmentShader = getFragmentShader(gl);
	gl.program = texProgram;
	gl.attachShader(texProgram, vertexShader);
	gl.attachShader(texProgram, fragmentShader);
	gl.linkProgram(texProgram);
}


function getVertexShader(gl) {
	var source = 'attribute vec2 position;    ' +
		         'varying vec2 v_texPosition; ' +
		         'void main () {              ' +
		         '  gl_Position = vec4(position, 0, 1);           ' +
		         '  v_texPosition = position * 0.5 + 0.5;                   ' +
		         '}';


	var shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	return shader;
}


function getFragmentShader(gl) {
	var source = 'precision mediump float;        ' +
    'varying vec2 v_texPosition;     ' +
    'varying float v_boxFlag;        ' +
    'uniform sampler2D u_texture;    ' +
    'void main () {                  ' +
    '   gl_FragColor = texture2D(u_texture, v_texPosition); ' +
    '}';


	var shader = gl.createShader(gl.FRAGMENT_SHADER);;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	return shader;
}


function initGl () {
	gl.useProgram(texProgram);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Vertices
	var buffer = gl.createBuffer();
	gl.buffer = buffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	var vertices = [ -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, 1 ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	var byte_per_vertex = Float32Array.BYTES_PER_ELEMENT;
	var component_per_vertex = 2;
	buffer.numItems = vertices.length / component_per_vertex;
	var stride = component_per_vertex * byte_per_vertex;
	var position = gl.getAttribLocation(texProgram, 'position');
	
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, stride, 0);

	// Texture
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(
			gl.TEXTURE_2D, 
			gl.TEXTURE_WRAP_S, 
			gl.CLAMP_TO_EDGE);
	gl.texParameteri(
			gl.TEXTURE_2D, 
			gl.TEXTURE_WRAP_T, 
			gl.CLAMP_TO_EDGE);
	gl.texParameteri(
			gl.TEXTURE_2D, 
			gl.TEXTURE_MIN_FILTER,
			gl.NEAREST);
	gl.texParameteri(
			gl.TEXTURE_2D, 
			gl.TEXTURE_MAG_FILTER, 
			gl.NEAREST);
	
	textureParams = {};
	var texWidth = null, texHeight = null, texData;
	texWidth = summaryTotalWidth;
	texHeight = summaryTotalHeight;
	texData = new ArrayBuffer(texWidth * texHeight * BYTE_PER_RGBA);
	TexPixels = new Uint8Array(texData);
	textureParams['width'] = texWidth;
	textureParams['height'] = texHeight;
}

//=====================//
// 	CLASSBAR FUNCTIONS //
//=====================//

function getScaledHeight(height, axis){
	var scaledHeight;
	if (axis === "row") {
		scaledHeight = Math.max(Math.round(height * rowClassScale), 1 + rowClassPadding);
    } else {
    	scaledHeight = Math.max(Math.round(height * colClassScale), 1 + colClassPadding);
    }   
    return scaledHeight;
}

// returns all the classifications bars for a given axis and their corresponding color schemes in an array.
function getClassBarsToDraw(axis){
	var classBars = axis.toLowerCase() == "row" ? heatMap.getRowClassificationConfig() : heatMap.getColClassificationConfig();
	var barsAndColors = {"bars":[], "colors":[]};
	for (var key in classBars){
		if (classBars[key].show == "Y"){
			barsAndColors["bars"].push(key);
			barsAndColors["colors"].push(classBars[key].color_map);
		}
	}
	return barsAndColors;
}

// draws row classification bars into the texture array ("dataBuffer"). "names"/"colorSchemes" should be array of strings.
function drawColClassBars(dataBuffer){
	if (document.getElementById("missingColClassBars"))document.getElementById("missingColClassBars").remove();
	var classBarsConfig = heatMap.getColClassificationConfig(); 
	var classBarConfigOrder = heatMap.getColClassificationOrder();
	var classBarsData = heatMap.getColClassificationData(); 
	var colorMapMgr = heatMap.getColorMapManager();
	var pos = summaryTotalWidth * summaryMatrixHeight * BYTE_PER_RGBA;
	
	//We reverse the order of the classBars before drawing because we draw from bottom up
	for (var i = classBarConfigOrder.length -1; i >= 0; i--) {
		var key = classBarConfigOrder[i];
		var currentClassBar = classBarsConfig[key];
		if (currentClassBar.show === 'Y') {
			var height = getScaledHeight(currentClassBar.height, "col"); 
			var colorMap = colorMapMgr.getColorMap("col",key); // assign the proper color scheme...
			var classBarValues = classBarsData[key].values;
			var classBarLength = classBarValues.length;
			if (typeof classBarsData[key].svalues != 'undefined') {
				classBarValues = classBarsData[key].svalues;
				classBarLength = classBarValues.length;
			}
			pos += (summaryTotalWidth)*colClassPadding*BYTE_PER_RGBA; // draw padding between class bars
			var line = new Uint8Array(new ArrayBuffer(classBarLength * BYTE_PER_RGBA)); // save a copy of the class bar
			var loc = 0;
			for (var k = 0; k < classBarLength; k++) { 
				var val = classBarValues[k];
				var color = colorMap.getClassificationColor(val);
				if (val == "null") {
					color = colorMap.getHexToRgba(colorMap.getMissingColor());
				}
				line[loc] = color['r'];
				line[loc + 1] = color['g'];
				line[loc + 2] = color['b'];
				line[loc + 3] = color['a'];
				loc += BYTE_PER_RGBA;
			}
			loc = 0;
			for (var j = 0; j < height-colClassPadding; j++){ // draw the class bar into the dataBuffer
				pos += rowClassBarWidth*BYTE_PER_RGBA;
				for (var k = 0; k < line.length; k++) { 
					dataBuffer[pos] = line[k];
					pos++;
				}
			}		
		} else {
			if (!document.getElementById("missingColClassBars")){
				var x = canvas.offsetLeft + canvas.offsetWidth + 2;
				var y = canvas.offsetTop + canvas.clientHeight/summaryTotalHeight - 10;
				addLabelDiv(document.getElementById('sumlabelDiv'), "missingColClassBars", "ClassBar MarkLabel", "...", x, y, 10, "F", null,"Column")
			}		
		}
	}
}

function drawRowClassBars(dataBuffer){
	var classBarsConfig = heatMap.getRowClassificationConfig(); 
	var classBarConfigOrder = heatMap.getRowClassificationOrder();
	var classBarsData = heatMap.getRowClassificationData(); 
	var colorMapMgr = heatMap.getColorMapManager();
	if (document.getElementById("missingRowClassBars"))document.getElementById("missingRowClassBars").remove();
	var offset = (summaryTotalWidth)*BYTE_PER_RGBA;

	for (var i = 0; i < classBarConfigOrder.length; i++) {
		var key = classBarConfigOrder[i];
		var pos = 0 + offset;
		var currentClassBar = classBarsConfig[key];
		var height = getScaledHeight(currentClassBar.height, "row"); 
		if (currentClassBar.show === 'Y') {
			var colorMap = colorMapMgr.getColorMap("row",key); // assign the proper color scheme...
			var classBarValues = classBarsData[key].values;
			var classBarLength = classBarValues.length;
			if (typeof classBarsData[key].svalues != 'undefined') {
				classBarValues = classBarsData[key].svalues;
				classBarLength = classBarValues.length;
			}
			for (var j = classBarLength; j > 0; j--){
				var val = classBarValues[j-1];
				var color = colorMap.getClassificationColor(val);
				if (val == "null") {
					color = colorMap.getHexToRgba(colorMap.getMissingColor());
				}
				for (var k = 0; k < height-rowClassPadding; k++){
					dataBuffer[pos] = color['r'];
					dataBuffer[pos + 1] = color['g'];
					dataBuffer[pos + 2] = color['b'];
					dataBuffer[pos + 3] = color['a'];
					pos+=BYTE_PER_RGBA;	// 4 bytes per color
				}
				// padding between class bars
				pos+=rowClassPadding*BYTE_PER_RGBA;
				// go total width of the summary canvas and back up the width of a single class bar to return to starting point for next row 
				pos+=(summaryTotalWidth - height)*BYTE_PER_RGBA; 
			}
			//offset starting point of one bar to the next by the width of one bar multiplied by BPR (e.g. 15 becomes 60)
			offset+= height*BYTE_PER_RGBA; 
		} else {
			if (!document.getElementById("missingRowClassBars")){
				var x = canvas.clientWidth/summaryTotalWidth + 10;
				var y = canvas.clientHeight + 2;
				addLabelDiv(document.getElementById('sumlabelDiv'), "missingRowClassBars", "ClassBar MarkLabel", "...", x, y, 10, "T", null,"Row");
			}
		}
	}
}

// increase the height/width of a classbar and resize the map texture as well. redraws when done.
function increaseClassBarHeight(name){
	var classBars = heatMap.getClassifications();
	if (classBars[name].height < paddingHeight){
		classBars[name].height = paddingHeight +1; // if class bar isn't visible, then make it 1 px taller than the padding height
	} else {
		classBars[name].height += 2;
	}
	classBarHeight = calculateSummaryTotalClassBarHeight("column");
	classBarWidth = calculateSummaryTotalClassBarHeight("row");
	calcTotalSize();
	var texWidth = null, texHeight = null, texData;
	texWidth = summaryTotalWidth;
	texHeight = summaryTotalHeight;
	texData = new ArrayBuffer(texWidth * texHeight * BYTE_PER_RGBA);
	TexPixels = new Uint8Array(texData);
	textureParams['width'] = texWidth;
	textureParams['height'] = texHeight;
	drawSummaryHeatMap();
}

// decrease the height/width of a classbar and resize the map texture as well. redraws when done.
function decreaseClassBarHeight(name){
	var classBars = heatMap.getClassifications();
	classBars[name].height -= 2;
	if (classBars[name].height < paddingHeight){
		classBars[name].height = 0; // if the class bar is going to be shorter than the padding height, make it invisible
	}
	classBarHeight = calculateSummaryTotalClassBarHeight("column");
	classBarWidth = calculateSummaryTotalClassBarHeight("row");
	calcTotalSize();
	var texWidth = null, texHeight = null, texData;
	texWidth = summaryTotalWidth;
	texHeight = summaryTotalHeight;
	texData = new ArrayBuffer(texWidth * texHeight * BYTE_PER_RGBA);
	TexPixels = new Uint8Array(texData);
	textureParams['width'] = texWidth;
	textureParams['height'] = texHeight;
	drawSummaryHeatMap();
}


function calculateSummaryTotalClassBarHeight(axis){
	var totalHeight = 0;
	if (axis === "row") {
		var classBars = heatMap.getRowClassificationConfig();
	} else {
		var classBars = heatMap.getColClassificationConfig();
	}
	for (var key in classBars){
		if (classBars[key].show === 'Y') {
		   totalHeight += getScaledHeight(parseInt(classBars[key].height), axis);
		}
	}
	return totalHeight;
}




//***************************//
//Selection Label Functions *//
//***************************//
function summaryResize() {
	if(!isSub){
		setSummarySize();
		summaryColumnDendro.resize();
		summaryColumnDendro.draw();
		summaryRowDendro.resize();
		summaryRowDendro.draw();
		drawLeftCanvasBox();
		clearSelectionMarks();
		drawRowSelectionMarks();
		drawColSelectionMarks();
	}
}


function drawRowSelectionMarks() {
	var markElement = document.getElementById('sumlabelDiv');
	var headerSize = summaryTotalHeight - summaryMatrixHeight;

	var fontSize = 10;
	var selectedRows = getSearchRows();
	var rowSumRatio = heatMap.getRowSummaryRatio(MatrixManager.SUMMARY_LEVEL);
	var xPos = canvas.offsetWidth + canvas.offsetLeft;
	var posScaleFactor = canvas.clientHeight/summaryTotalHeight;
	var ymin = summaryColumnDendro.getDivHeight();
	
	for (var i = 0; i < selectedRows.length; i++) {
		var position = headerSize + (selectedRows[i]/rowSumRatio);
		var yPos = ymin + position*posScaleFactor - fontSize;
		addLabelDiv(markElement, 'sum_row' + i, 'MarkLabel', '<', xPos, yPos, fontSize, 'F', i, "Row");
	}
}

function drawColSelectionMarks() {
	var markElement = document.getElementById('sumlabelDiv');
	var headerSize = summaryTotalWidth - summaryMatrixWidth;

	var fontSize = 10;
	var selectedCols = getSearchCols();
	var colSumRatio = heatMap.getColSummaryRatio(MatrixManager.SUMMARY_LEVEL)
	var yPos = canvas.offsetHeight + canvas.offsetTop;
	var posScaleFactor = canvas.clientWidth/summaryTotalWidth;
	var xmin = canvas.offsetLeft;
	
	for (var i = 0; i < selectedCols.length; i++) {
		var position = headerSize + (selectedCols[i]/colSumRatio);
		var xPos = xmin + position*posScaleFactor + fontSize/2;
		addLabelDiv(markElement, 'sum_row' + i, 'MarkLabel', '<', xPos, yPos, fontSize, 'T', i, "Column");
	}
}

function clearSelectionMarks() {
//	var markElement = document.getElementById('sumlabelDiv');
	var oldMarks = document.getElementsByClassName("MarkLabel");
	while (oldMarks.length > 0) {
//		markElement.removeChild(oldMarks[0]);
		oldMarks[0].remove();
	}

}


function dividerStart(){
	userHelpClose();
	document.addEventListener('mousemove', dividerMove);
	document.addEventListener('touchmove', dividerMove);
	document.addEventListener('mouseup', dividerEnd);
	document.addEventListener('touchend',dividerEnd);
}
function dividerMove(e){
	var divider = document.getElementById('divider');
	if (e.touches){
    	if (e.touches.length > 1){
    		return false;
    	}
    }
	var Xmove = e.touches ? divider.offsetLeft - e.touches[0].pageX : divider.offsetLeft - e.pageX;
	var summary = document.getElementById('summary_chm');
	var summaryX = summary.offsetWidth - Xmove;
	summary.style.width=summaryX+'px';
	setSummarySize();
	summaryColumnDendro.resize();
	summaryRowDendro.resize();
	if (summary.style.width == summary.style.maxWidth){
		return
	}
	var sumScale = summaryX/summary.clientWidth;
	var container = document.getElementById("container");
	var originalW = Math.max(Math.max(Math.round(summaryMatrixWidth/250 * 48), 3))*container.clientWidth;
	var originalH = Math.max(Math.max(Math.round(summaryMatrixHeight/250 * 48), 3))*container.clientHeight;
	var originalAR = originalW/originalH;
	var detail = document.getElementById('detail_chm');
	var detailX = detail.offsetWidth + Xmove;
	detail.style.width=detailX+'px';
	clearLabels();
	clearSelectionMarks();
}
function dividerEnd(){
	document.removeEventListener('mousemove', dividerMove);
	document.removeEventListener('mouseup', dividerEnd);
	document.removeEventListener('touchmove',dividerMove);
	document.removeEventListener('touchend',dividerEnd);
	// set summary and detail canvas sizes to percentages to avoid map getting pushed down on resize
	var container = document.getElementById('container');
	var summary = document.getElementById('summary_chm');
	var sumPercent = 100*summary.clientWidth / container.clientWidth;
	summary.style.width = sumPercent + "%";
	var detail = document.getElementById('detail_chm');
	var detPercent = 100*detail.clientWidth/container.clientWidth;
	detail.style.width = detPercent + "%";
	summaryResize();
	detailResize();
}
