var detCanvas;
var detBoxCanvas;  //canvas on top of WebGL canvas for selection box 
var det_gl; // WebGL contexts
var detTextureParams;
var labelElement; 
var old_mouse_pos = [0, 0];

var detCanvasScaleArray = new Float32Array([1.0, 1.0]);
var detCanvasTranslateArray = new Float32Array([0, 0]);

var detTexPixels;
var detTexPixelsCache;
var detUScale;
var detUTranslate;

var detEventTimer = 0; // Used to delay draw updates

var saveRow;
var saveCol;
var dataBoxHeight;
var dataBoxWidth;

var paddingHeight = 2;          // space between classification bars
var detailDendroHeight = 105;
var detailDendroWidth = 105;
var normDetailDendroMatrixHeight = 200;
var rowDetailDendroMatrix,colDetailDendroMatrix;
var DETAIL_SIZE_NORMAL_MODE = 506;
var detailDataViewHeight = 506;
var detailDataViewWidth = 506;
var detailDataViewBorder = 2;
var zoomBoxSizes = [1,2,3,4,6,7,8,9,12,14,18,21,24,28,36,42,56,63,72,84,126,168,252,504];
var minLabelSize = 8;
var currentSearchItem = {};
var labelLastClicked = {};

var mouseDown = false;
var dragOffsetX;
var dragOffsetY;
var detailPoint;

var mode = 'NORMAL';
var isDrawn = false;

//Call once to hook up detail drawing routines to a heat map and initialize the webGl 
function initDetailDisplay() {
	detCanvas = document.getElementById('detail_canvas');
	detBoxCanvas = document.getElementById('detail_box_canvas');
	labelElement = document.getElementById('labelDiv');

	if (isSub) {
 		document.getElementById('summary_chm').style.display = 'none';
 		document.getElementById('divider').style.display = 'none';
 		document.getElementById('detail_chm').style.width = '100%';
 		document.getElementById('flicks').style.display = '';
 		document.getElementById('detail_buttons').style.display = '';
 		document.getElementById('split_btn').src= staticPath + "images/join.png";
 		document.getElementById('gear_btn').src= staticPath + "images/gearDis.png";
 		document.getElementById('pdf_btn').style.display = 'none';
	}
	if (heatMap.isInitialized() > 0) {
 		document.getElementById('flicks').style.display = '';
		document.getElementById('detail_buttons').style.display = '';
		detCanvas.width =  (detailDataViewWidth + calculateTotalClassBarHeight("row") + detailDendroWidth);
		detCanvas.height = (detailDataViewHeight + calculateTotalClassBarHeight("column") + detailDendroHeight);
		detSetupGl();
		detInitGl();
		createLabelMenus();
		updateSelection();
	}
	
	detCanvas.oncontextmenu = matrixRightClick;
	detCanvas.onmousedown = clickStart;
	detCanvas.onmouseup = clickEnd;
	detCanvas.onmousemove = handleMouseMove;
	detCanvas.onmouseleave = userHelpClose;
	detCanvas.onmouseout = handleMouseOut;

	document.addEventListener("touchmove", function(e){
		e.preventDefault();
		if (e.touches){
	    	if (e.touches.length > 1){
	    		return false;
	    	}
	    }
	})
	detCanvas.addEventListener("touchstart", function(e){
		userHelpClose();
		clickStart(e);
	}, false);
	detCanvas.addEventListener("touchmove", function(e){
		e.stopPropagation();
		e.preventDefault();
		handleMouseMove(e);
	}, false);
	detCanvas.addEventListener("touchend", function(e){clickEnd(e)}, false);
	
	detCanvas.addEventListener("gestureend",function(e){
		if (e.scale > 1){
			detailDataZoomIn();
		} else if (e.scale < 1){
			detailDataZoomOut();
		}
	},false)
	
	
	document.onkeydown = keyNavigate;
}

/*********************************************************************************************
 * FUNCTION:  clickStart
 * 
 * The purpose of this function is to handle a user mouse down event.  
 *********************************************************************************************/
function clickStart(e){
	e.preventDefault();
	mouseEventActive = true;
	var clickType = getClickType(e);
	userHelpClose();
	if (clickType === 0) { 
		detCanvas = document.getElementById('detail_canvas');
		dragOffsetX = e.touches ? e.layerX : e.layerX;  //canvas X coordinate 
		dragOffsetY = e.touches ? e.layerY : e.layerY;
	    mouseDown = true;
		// client space
		var divW = e.target.clientWidth;
		var divH = e.target.clientHeight;
		// texture space
		var rowTotalW = detailDataViewWidth + calculateTotalClassBarHeight("row") + detailDendroWidth;
		var colTotalH = detailDataViewHeight + calculateTotalClassBarHeight("column") + detailDendroHeight;
		// proportion space
		var rowDendroW = detailDendroWidth/rowTotalW;
		var colDendroH = detailDendroHeight/colTotalH;
		var rowClassW = calculateTotalClassBarHeight("row")/rowTotalW;
		var colClassH = calculateTotalClassBarHeight("column")/colTotalH;
		var mapW = detailDataViewWidth/rowTotalW;
		var mapH = detailDataViewHeight/colTotalH;
		var clickX = e.layerX/divW;
		var clickY = e.layerY/divH;
		
		if (clickX > rowDendroW + rowClassW && clickY < colDendroH){ // col dendro clicked
			var heightRatio = heatMap.getNumColumns(MatrixManager.DETAIL_LEVEL)/dataPerRow;
			var X = (currentCol + (dataPerRow*(clickX-rowDendroW-rowClassW)/mapW));
			var Y = (colDendroH-clickY)/colDendroH/heightRatio;
			var matrixX = Math.round(X*3-1);
			var matrixY = Math.round(Y*500);
			var leftRight = summaryColumnDendro.findExtremes(matrixY,matrixX);
			var left = (leftRight[0]+2)/3;
			var right =(leftRight[1]+2)/3;
			colDetailDendroMatrix = buildDetailDendroMatrix('col', currentCol, currentCol+dataPerRow, heatMap.getNumColumns(MatrixManager.DETAIL_LEVEL)/dataPerRow, {"left":leftRight[0],"right":leftRight[1],"height":Y});
			summaryColumnDendro.addSelectedBar(leftRight[0],leftRight[1],matrixY,e.shiftKey);
			detailDrawColDendrogram(detTexPixels);
			updateSelection();
			drawColSelectionMarks();
			drawRowSelectionMarks();
		} else if (clickX < rowDendroW && clickY > colDendroH + colClassH){ // row dendro clicked
			var heightRatio = heatMap.getNumRows(MatrixManager.DETAIL_LEVEL)/dataPerCol;
			var X = (currentRow + Math.floor(dataPerCol*(clickY-colDendroH-colClassH)/mapH));
			var Y = (rowDendroW-clickX)/rowDendroW/heightRatio; // this is a percentage of how high up on the entire dendro matrix (not just the detail view) the click occured
			var matrixX = X*3-1;
			var matrixY = Math.round(Y*500);
			var leftRight = summaryRowDendro.findExtremes(matrixY,matrixX);
			var left = (leftRight[0]+2)/3;
			var right =(leftRight[1]+2)/3;
			rowDetailDendroMatrix = buildDetailDendroMatrix('row', currentRow, currentRow+dataPerCol, heatMap.getNumRows(MatrixManager.DETAIL_LEVEL)/dataPerCol, {"left":leftRight[0],"right":leftRight[1],"height":Y});
			summaryRowDendro.addSelectedBar(leftRight[0],leftRight[1],matrixY,e.shiftKey);
			detailDrawRowDendrogram(detTexPixels);
			updateSelection();
			drawColSelectionMarks();
			drawRowSelectionMarks();
		}
	    
	    if (isOnObject(e,"map")) {
			//Set cursor for drag move or drag select
			if (e.shiftKey) {
				detCanvas.style.cursor="crosshair";
		    }
		    else {
				detCanvas.style.cursor="move";
		    }
	    }
	}
}

/*********************************************************************************************
 * FUNCTION:  clickEnd
 * 
 * The purpose of this function is to handle a user mouse up event.  If the mouse has not 
 * moved out of a given detail row/col between clickStart and clickEnd, user help is opened
 * for that cell.
 *********************************************************************************************/
function clickEnd(e){
	if (mouseEventActive) {
		var clickType = getClickType(e);
		if (clickType === 0) {
			mouseDown = false;
			var dragEndX = e.changedTouches ? e.changedTouches[0].pageX : e.layerX;  //etouches is for tablets = number of fingers touches on screen
			var dragEndY = e.changedTouches ? e.changedTouches[0].pageY : e.layerY;
			var rowElementSize = dataBoxWidth * detCanvas.clientWidth/detCanvas.width;
		    var colElementSize = dataBoxHeight * detCanvas.clientHeight/detCanvas.height;
		    //If cursor did not move from the column/row between click start/end, display User Help
			if (Math.abs(dragEndX - dragOffsetX) < colElementSize/10 && Math.abs(dragEndY - dragOffsetY) < rowElementSize/10){
				userHelpOpen(e);
			}
			//Set cursor back to default
			detCanvas.style.cursor="default";
		}
		mouseEventActive = false;
	}
}

/*********************************************************************************************
 * FUNCTION:  handleMouseOut
 * 
 * The purpose of this function is to handle the situation where the user clicks on and drags
 * off the detail canvas without letting up the mouse button.  In these cases, we cancel 
 * the mouse event that we are tracking, reset mouseDown, and reset the cursor to default.
 *********************************************************************************************/
function handleMouseOut(evt) {
	detCanvas.style.cursor="default";
    mouseDown = false;
	mouseEventActive = false;
}

/*********************************************************************************************
 * FUNCTION:  getClickType
 * 
 * The purpose of this function returns an integer. 0 for left click; 1 for right.  It could
 * be expanded further for wheel clicks, browser back, and browser forward 
 *********************************************************************************************/
function getClickType(e) {
	 var clickType = 0;
	 e = e || window.event;
	 if ( !e.which && (typeof e.button !== 'undefined') ) {
	    e.which = ( e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) ) );
	 }
	 switch (e.which) {
	    case 3: clickType = 1;
	    break; 
	}
	 return clickType;
}

/*********************************************************************************************
 * FUNCTION:  handleMouseMove
 * 
 * The purpose of this function is to handle a user drag event.  The type of move (drag-move or
 * drag-select is determined, based upon keys pressed and the appropriate function is called
 * to perform the function.
 *********************************************************************************************/
function handleMouseMove(e) {
    // Do not clear help if the mouse position did not change. Repeated firing of the mousemove event can happen on random 
    // machines in all browsers but FireFox. There are varying reasons for this so we check and exit if need be.
	var eX = e.touches ? e.touches[0].clientX : e.clientX;
	var eY = e.touches ? e.touches[0].clientY : e.clientY;
	if(old_mouse_pos[0] != eX || old_mouse_pos[1] != eY) {
		userHelpClose();
		old_mouse_pos = [eX, eY];
	} 
	if (mouseDown && mouseEventActive){
		//If mouse is down and shift key is pressed, perform a drag selection
		//Else perform a drag move
		if (e.shiftKey) {
			clearSearch(e);
			handleSelectDrag(e);
	    }
	    else {
    		handleMoveDrag(e);
	    }
	} 
}

/*********************************************************************************************
 * FUNCTION:  handleMoveDrag
 * 
 * The purpose of this function is to handle a user "move drag" event.  This is when the user
 * clicks and drags across the detail heat map viewport. When this happens, the current position
 * of the heatmap viewport is changed and the detail heat map is redrawn 
 *********************************************************************************************/
function handleMoveDrag(e) { 
    if(!mouseDown) return;
    var rowElementSize = dataBoxWidth * detCanvas.clientWidth/detCanvas.width;
    var colElementSize = dataBoxHeight * detCanvas.clientHeight/detCanvas.height;
    if (e.touches){  //If more than 2 fingers on, don't do anything
    	if (e.touches.length > 1){
    		return false;
    	}
    } 
    var xDrag = e.touches ? e.layerX - dragOffsetX : e.layerX - dragOffsetX;
    var yDrag = e.touches ? e.layerY - dragOffsetY : e.layerY - dragOffsetY;
    if ((Math.abs(xDrag/rowElementSize) > 1) || (Math.abs(yDrag/colElementSize) > 1)) {
    	currentRow = Math.floor(currentRow - (yDrag/colElementSize));
    	currentCol = Math.floor(currentCol - (xDrag/rowElementSize));
    	dragOffsetX = e.touches ? e.layerX : e.layerX;
	    dragOffsetY = e.touches ? e.layerY : e.layerY;
	    checkRow();
	    checkColumn();
	    updateSelection();
    } 
}	

/*********************************************************************************************
 * FUNCTION:  handleSelectDrag
 * 
 * The purpose of this function is to handle a user "select drag" event.  This is when the user
 * clicks, holds down the SHIFT key, and drags across the detail heat map viewport. Starting
 * and ending row/col positions are calculated and the row/col search items arrays are populated
 * with those positions (representing selected items on each axis).  Finally, selection marks
 * on the Summary heatmap are drawn and the detail heat map is re-drawn 
 *********************************************************************************************/
function handleSelectDrag(e) {
    if(!mouseDown) return;
    var rowElementSize = dataBoxWidth * detCanvas.clientWidth/detCanvas.width;
    var colElementSize = dataBoxHeight * detCanvas.clientHeight/detCanvas.height;
    if (e.touches){  //If more than 2 fingers on, don't do anything
    	if (e.touches.length > 1){
    		return false;
    	}
    }
    var xDrag = e.touches ? e.touches[0].layerX - dragOffsetX : e.layerX - dragOffsetX;
    var yDrag = e.touches ? e.touches[0].layerY - dragOffsetY : e.layerY - dragOffsetY;
    
    if ((Math.abs(xDrag/rowElementSize) > 1) || (Math.abs(yDrag/colElementSize) > 1)) {
    	//Retrieve drag corners but set to max/min values in case user is dragging
    	//bottom->up or left->right.
    	var endRow = Math.max(getRowFromLayerY(e.layerY),getRowFromLayerY(dragOffsetY));
    	var endCol = Math.max(getColFromLayerX(e.layerX),getColFromLayerX(dragOffsetX));
		var startRow = Math.min(getRowFromLayerY(e.layerY),getRowFromLayerY(dragOffsetY));
		var startCol = Math.min(getColFromLayerX(e.layerX),getColFromLayerX(dragOffsetX));
    	clearSearchItems("Column");
    	clearSearchItems("Row");
    	for (var i = startRow; i <= endRow; i++){
    		searchItems["Row"][i] = 1;
    	}
    	for (var i = startCol; i <= endCol; i++){
    		searchItems["Column"][i] = 1;
    	}
    	if (isSub){
    		localStorage.setItem('selected', JSON.stringify(searchItems));
    	} else {
    		drawRowSelectionMarks();
    		drawColSelectionMarks();
    	}
	   	 clearLabels();
		 drawSelections();
		 drawRowAndColLabels();
		 detailDrawColClassBarLabels();
		 detailDrawRowClassBarLabels();

    }
}	

/*********************************************************************************************
 * FUNCTIONS:  getRowFromLayerY AND getColFromLayerX
 * 
 * The purpose of this function is to retrieve the row/col in the data matrix that matched a given
 * mouse location.  They utilize event.layerY/X for the mouse position.
 *********************************************************************************************/
function getRowFromLayerY(layerY) {
    var rowElementSize = dataBoxWidth * detCanvas.clientWidth/detCanvas.width; // px/Glpoint
    var colElementSize = dataBoxHeight * detCanvas.clientHeight/detCanvas.height;
	var colClassHeightPx = getColClassPixelHeight();
	var colDendroHeightPx = getColDendroPixelHeight();
	var mapLocY = layerY - colClassHeightPx - colDendroHeightPx;
	return Math.floor(currentRow + (mapLocY/colElementSize)*getSamplingRatio('row'));
}

function getColFromLayerX(layerX) {
    var rowElementSize = dataBoxWidth * detCanvas.clientWidth/detCanvas.width; // px/Glpoint
    var colElementSize = dataBoxHeight * detCanvas.clientHeight/detCanvas.height;
	var rowClassWidthPx = getRowClassPixelWidth();
	var rowDendroWidthPx =  getRowDendroPixelWidth();
	var mapLocX = layerX - rowClassWidthPx - rowDendroWidthPx;
	return Math.floor(currentCol + (mapLocX/rowElementSize)*getSamplingRatio('col'));
}

/*********************************************************************************************
 * FUNCTIONS:  getDetCanvasYFromRow AND getDetCanvasXFromCol
 * 
 * Given a detail matrix row, these function return the canvas Y (vertical) OR canvas x 
 * (or horizontal) position. 
 *********************************************************************************************/
function getDetCanvasYFromRow(row){
	return ((row*(detailDataViewHeight/getCurrentDetDataPerCol())) + getDetColMapOffset());
}

function getDetCanvasXFromCol(col){
	return ((col*(detailDataViewWidth/getCurrentDetDataPerRow())) + getDetRowMapOffset());
}

/*********************************************************************************************
 * FUNCTIONS:  getDetRowMapOffset AND getDetColMapOffset
 * 
 * These functions return the col/row offset of position 0,0 on the heatmap from the top of 
 * the detail canvas.  The position includes the dendro, classbar, and border
 *********************************************************************************************/
function getDetColMapOffset() {
	return (calculateTotalClassBarHeight("column") + detailDendroHeight);
}

function getDetRowMapOffset() {
	return (calculateTotalClassBarHeight("row") + detailDendroWidth);
}

/*********************************************************************************************
 * FUNCTION:  drawSelections
 * 
 * This function calls a function that will generate 2 arrays containing the contiguous search 
 * ranges (row/col).  It then iterates thru those arrays that users have selected and calls the 
 * function that will draw line OR boxes on the heatMap detail box canvas.  If either of the 
 * 2 arrays is empty, lines will be drawn otherwise boxes.  
 *********************************************************************************************/
function drawSelections() {
	var ctx=detBoxCanvas.getContext("2d");
	ctx.clearRect(0, 0, detBoxCanvas.width, detBoxCanvas.height);
	//Retrieve contiguous row and column search arrays
	var searchRows = getSearchRows();
	var rowRanges = getContigSearchRanges(searchRows);
	var searchCols = getSearchCols();
	var colRanges = getContigSearchRanges(searchCols);
	if (rowRanges.length > 0 || colRanges.length > 0) {
    	showSrchBtns();
		if (rowRanges.length === 0) {
			//Draw horizontal lines across entire heatMap
			for (var i=0;i<colRanges.length;i++) {
				var range = colRanges[i];
				var colStart = range[0];
				var colEnd = range[1];
				drawSearchBox(0,heatMap.getNumRows('d'),colStart,colEnd);
			}
		} else if (colRanges.length === 0) {
			//Draw vertical lines across entire heatMap
			for (var i=0;i<rowRanges.length;i++) {
				var range = rowRanges[i];
				var rowStart = range[0];
				var rowEnd = range[1];
				drawSearchBox(rowStart,rowEnd,0,heatMap.getNumColumns('d'));
			}
		} else {
			for (var i=0;i<rowRanges.length;i++) {
				//Draw discrete selection boxes on heatMap
				var rowRange = rowRanges[i];
				var rowStart = rowRange[0];
				var rowEnd = rowRange[1];
				for (var j=0;j<colRanges.length;j++) {
					var colRange = colRanges[j];
					var colStart = colRange[0];
					var colEnd = colRange[1];
					drawSearchBox(rowStart,rowEnd,colStart,colEnd);
				}				
			}
		}
	}
}

/*********************************************************************************************
 * FUNCTION:  getContigSearchRanges
 * 
 * This function iterates thru a searchArray (searchRows or searchCols) and writes an array 
 * containing entries for each contiguous range selected in the /searchArray.  This array will 
 * contain sub-arrays that have 2 entries (one for starting position and the other for ending)
 *********************************************************************************************/
function getContigSearchRanges(searchArr) {
	var ranges = [];
	var prevVal=searchArr[0];
	var startVal = searchArr[0];
	if (searchArr.length >  0) {
		for (var i=0;i<searchArr.length;i++) {
			var currVal = searchArr[i];
			//If a contiguous range has been found, write array entry
			if (currVal - prevVal > 1) {
				ranges.push([startVal,prevVal]);
				startVal = currVal;
				//If this is ALSO the last entry, write one more array for
				//for the current single row/col selection
				if (i === searchArr.length -1) {
					ranges.push([currVal,currVal]);
				}
			} else {
				//If last entry, write array entry
				if (i === searchArr.length -1) {
					ranges.push([startVal,currVal]);
				}
			}
			prevVal = currVal;
		}
	}
	return ranges;
}

/*********************************************************************************************
 * FUNCTION:  drawSearchBox
 * 
 * This function draws lines on the heatMap detail box canvas for each contiguous search 
 * range that the user has specified (by click dragging, label selecting, or dendro clicking).
 *********************************************************************************************/
function drawSearchBox(csRowStart, csRowEnd, csColStart, csColEnd) {

	//top-left corner of visible area
	var topX = (((getDetRowMapOffset()) / detCanvas.width) * detBoxCanvas.width);
	var topY = ((getDetColMapOffset() / detCanvas.height) * detBoxCanvas.height);
	
	//height/width of heat map rectangle in pixels
	var mapXWidth = detBoxCanvas.width - topX;
	var mapYHeight = detBoxCanvas.height - topY;
	//height/width of a data cell in pixels
	var cellWidth = mapXWidth/getCurrentDetDataPerRow();
	var cellHeight = mapYHeight/getCurrentDetDataPerCol();
	//bottom-right corner of visible area
	var bottomX = topX + (getCurrentDetDataPerCol()*cellWidth);
	var bottomY = topY + (getCurrentDetDataPerRow()*cellHeight);
	
	//how much to move row/col offset from currentRow in pixels
	var adjustedRowStart = (csRowStart - currentRow)*cellHeight;
	var adjustedColStart = (csColStart - currentCol)*cellWidth;
	var adjustedRowEnd = ((csRowEnd - csRowStart)+1)*cellHeight;
	var adjustedColEnd = ((csColEnd - csColStart)+1)*cellWidth;
	
	//adjusted row/col start position (without regard to visibility in the viewport)
	var boxX = topX+adjustedColStart;
	var boxY = topY+adjustedRowStart;
	var boxX2 = boxX+adjustedColEnd;
	var boxY2 = boxY+adjustedRowEnd; 
	
	//Retrieve selection color for coloring search box
	var ctx=detBoxCanvas.getContext("2d");
	var dataLayers = heatMap.getDataLayers();
	var dataLayer = dataLayers[currentDl];
	ctx.lineWidth=3;
	ctx.strokeStyle=dataLayer.selection_color;

	// draw top horizontal line
	if (isHorizLineVisible(topY, boxY)) {
		drawHorizLine(topX,boxX, boxX2, boxY);
	}
	// draw left side line
	if (isVertLineVisible(topX, boxX)) {
		drawVertLine(topY, boxY, boxY2, boxX);
	}
	// draw bottom line
	if (isHorizLineVisible(topY, boxY2)) {
		drawHorizLine(topX,boxX, boxX2, boxY2);
	}
	// draw right side line
	if (isVertLineVisible(topX, boxX2)) {
		drawVertLine(topY, boxY, boxY2, boxX2);
	}
}

/*********************************************************************************************
 * FUNCTIONS:  isHorizLineVisible AND isVertLineVisible
 * 
 * These functions check the position of a horizontal/vertical line to see if it is currently 
 * visible in the detail viewport.
 *********************************************************************************************/
function isHorizLineVisible(topY, boxY) {
	return (boxY >= topY);
}

function isVertLineVisible(topX, boxX) {
	return (boxX >= topX);
}

/*********************************************************************************************
 * FUNCTIONS:  drawHorizLine AND drawVertLine
 * 
 * These functions call the logic necessary to draw a horizontal/vertical line on the detail 
 * viewport.   If only a portion of the line is visible on the top or left border, the length 
 * of the line will be amended to stop at the border.
 *********************************************************************************************/
function drawHorizLine(topX, boxX, boxX2, boxY) {
	var lineStart = boxX >= topX ? boxX : topX;
	var lineEnd = boxX2 >= topX ? boxX2 : topX;
	if (lineStart !== lineEnd) {
		strokeLine(lineStart,boxY,lineEnd, boxY);
	}
}

function drawVertLine(topY, boxY, boxY2, boxX) {
	var lineStart = boxY >= topY ? boxY : topY;
	var lineEnd = boxY2 >= topY ? boxY2 : topY;
	if (lineStart !== lineEnd) {
		strokeLine(boxX,lineStart,boxX, lineEnd);
	}
}

/*********************************************************************************************
 * FUNCTION:  strokeLine
 * 
 * This function draws lines on the heatMap detail box canvas for each contiguous search 
 * range that the user has specified (by click dragging, label selecting, or dendro clicking).
 *********************************************************************************************/
function strokeLine(fromX, fromY, toX,toY) {
	var ctx=detBoxCanvas.getContext("2d");
	ctx.beginPath();
	ctx.moveTo(fromX,fromY);
	ctx.lineTo(toX, toY); 
	ctx.stroke(); 
}

function getColClassPixelHeight() {
	var classbarHeight = calculateTotalClassBarHeight("column");
	return detCanvas.clientHeight*(classbarHeight/detCanvas.height);
}

function getRowClassPixelWidth() {
	var classbarWidth = calculateTotalClassBarHeight("row");
	return detCanvas.clientWidth*(classbarWidth/detCanvas.width);
}

function getColDendroPixelHeight() {
	return detCanvas.clientHeight*(detailDendroHeight/detCanvas.height);
}

function getRowDendroPixelWidth() {
	return detCanvas.clientWidth*(detailDendroWidth/detCanvas.width);
}

function isOnObject(e,type) {
    var rowClassWidthPx =  getRowClassPixelWidth();
    var colClassHeightPx = getColClassPixelHeight();
    var rowDendroWidthPx =  getRowDendroPixelWidth();
    var colDendroHeightPx = getColDendroPixelHeight();
    if (e.layerY > colClassHeightPx + colDendroHeightPx) { 
    	if  ((type == "map") && e.layerX > rowClassWidthPx + rowDendroWidthPx) {
    		return true;
    	}
    	if  ((type == "rowClass") && e.layerX < rowClassWidthPx + rowDendroWidthPx && e.layerX > rowDendroWidthPx) {
    		return true;
    	}
    } else if (e.layerY > colDendroHeightPx) {
    	if  ((type == "colClass") && e.layerX > rowClassWidthPx + rowDendroWidthPx) {
    		return true;
    	}
    }
    return false;
}	

function detailDataZoomIn() {
	userHelpClose();	
	if (mode == 'NORMAL') {
		var current = zoomBoxSizes.indexOf(dataBoxWidth);
		if (current < zoomBoxSizes.length - 1) {
			setDetailDataSize (zoomBoxSizes[current+1]);
			updateSelection();
		}
	} else if ((mode == 'RIBBONH') || (mode == 'RIBBONH_DETAIL')) {
		var current = zoomBoxSizes.indexOf(dataBoxHeight);
		if (current < zoomBoxSizes.length - 1) {
			setDetailDataHeight (zoomBoxSizes[current+1]);
			updateSelection();
		}
	} else if ((mode == 'RIBBONV') || (mode == 'RIBBONV_DETAIL')) {
		var current = zoomBoxSizes.indexOf(dataBoxWidth);
		if (current < zoomBoxSizes.length - 1) {
			setDetailDataWidth(zoomBoxSizes[current+1]);
			updateSelection();
		}
	}
}	

function detailDataZoomOut() {
	userHelpClose();	
	if (mode == 'NORMAL') {
		var current = zoomBoxSizes.indexOf(dataBoxWidth);
		if ((current > 0) &&
		    (Math.floor((detailDataViewHeight-detailDataViewBorder)/zoomBoxSizes[current-1]) <= heatMap.getNumRows(MatrixManager.DETAIL_LEVEL)) &&
		    (Math.floor((detailDataViewWidth-detailDataViewBorder)/zoomBoxSizes[current-1]) <= heatMap.getNumColumns(MatrixManager.DETAIL_LEVEL))){
			setDetailDataSize (zoomBoxSizes[current-1]);
			updateSelection();
		}	
	} else if ((mode == 'RIBBONH') || (mode == 'RIBBONH_DETAIL')) {
		var current = zoomBoxSizes.indexOf(dataBoxHeight);
		if ((current > 0) &&
		    (Math.floor((detailDataViewHeight-detailDataViewBorder)/zoomBoxSizes[current-1]) <= heatMap.getNumRows(MatrixManager.DETAIL_LEVEL))) {
			setDetailDataHeight (zoomBoxSizes[current-1]);
			updateSelection();
		}	
	} else if ((mode == 'RIBBONV') || (mode == 'RIBBONV_DETAIL')){
		var current = zoomBoxSizes.indexOf(dataBoxWidth);
		if ((current > 0) &&
		    (Math.floor((detailDataViewWidth-detailDataViewBorder)/zoomBoxSizes[current-1]) <= heatMap.getNumColumns(MatrixManager.DETAIL_LEVEL))){
			setDetailDataWidth (zoomBoxSizes[current-1]);
			updateSelection();
		}	
	}
}

//How big each data point should be in the detail pane.  
function setDetailDataSize(size) {
	setDetailDataWidth (size);
	setDetailDataHeight(size);
}
 
//How big each data point should be in the detail pane.  
function setDetailDataWidth(size) {
	var prevDataPerRow = dataPerRow;
	dataBoxWidth = size;
	setDataPerRowFromDet(Math.floor((detailDataViewWidth-detailDataViewBorder)/dataBoxWidth));

	//Adjust the current column based on zoom but don't go outside or the heat map matrix dimensions.
	if (prevDataPerRow != null) {
		if (prevDataPerRow > dataPerRow) {
			currentCol += Math.floor((prevDataPerRow - dataPerRow) / 2);
		} else {
			currentCol -= Math.floor((dataPerRow - prevDataPerRow) / 2);
		}
		checkColumn();
	}
}

//How big each data point should be in the detail pane.  
function setDetailDataHeight(size) {
	var prevDataPerCol = dataPerCol;
	dataBoxHeight = size;
	setDataPerColFromDet(Math.floor((detailDataViewHeight-detailDataViewBorder)/dataBoxHeight));
	
	//Adjust the current row but don't go outside of the current heat map dimensions
	if (prevDataPerCol != null) {
		if (prevDataPerCol > dataPerCol)
			currentRow += Math.floor((prevDataPerCol - dataPerCol) / 2);
		else
			currentRow -= Math.floor((dataPerCol - prevDataPerCol) / 2);
		checkRow();
	}
}

//How much data are we showing per row - determined by dataBoxWidth and detailDataViewWidth
function getDetailDataPerRow() {
	return dataPerRow;
}

//How much data are we showing per row - determined by dataBoxWidth and detailDataViewWidth
function getDetailDataPerCol () {
	return dataPerCol;
}

function detailHRibbonButton () {
	clearDendroSelection();
	detailHRibbon();
}

function detailVRibbonButton () {
	clearDendroSelection();
	detailVRibbon();
}

//Change to horizontal ribbon view.  Note there is a standard full ribbon view and also a sub-selection
//ribbon view if the user clicks on the dendrogram.  If a dendrogram selection is in effect, then
//selectedStart and selectedStop will be set.
function detailHRibbon () {
	userHelpClose();	
	var previousMode = mode;
	var prevWidth = dataBoxWidth;
	saveCol = currentCol;
	
		
	mode='RIBBONH';
	setButtons();
	
	// If normal (full) ribbon, set the width of the detail display to the size of the horizontal ribbon view
	// and data size to 1.
	if (selectedStart == null || selectedStart == 0) {
		detailDataViewWidth = heatMap.getNumColumns(MatrixManager.RIBBON_HOR_LEVEL) + detailDataViewBorder;
		var ddw = 1;
		while(2*detailDataViewWidth < 500){ // make the width wider to prevent blurry/big dendros for smaller maps
			ddw *=2;
			detailDataViewWidth = ddw*heatMap.getNumColumns(MatrixManager.RIBBON_HOR_LEVEL) + detailDataViewBorder;
		}
		setDetailDataWidth(ddw);
		currentCol = 1;
	} else {
		var selectionSize = selectedStop - selectedStart + 1;
		if (selectionSize < 500) {
			mode='RIBBONH_DETAIL'
		} else {
			var rvRate = heatMap.getColSummaryRatio(MatrixManager.RIBBON_HOR_LEVEL);
			selectionSize = Math.floor(selectionSize/rvRate);
		}
		var width = Math.max(1, Math.floor(500/selectionSize));
		detailDataViewWidth = (selectionSize * width) + detailDataViewBorder;
		setDetailDataWidth(width);	
		currentCol = selectedStart;
	}
	
	detailDataViewHeight = DETAIL_SIZE_NORMAL_MODE;
	if ((previousMode=='RIBBONV') || (previousMode == 'RIBBONV_DETAIL')) {
		setDetailDataHeight(prevWidth);
		currentRow=saveRow;
	}	

	//On some maps, one view (e.g. ribbon view) can show bigger data areas than will fit for other view modes.  If so, zoom back out to find a workable zoom level.
	while (Math.floor((detailDataViewHeight-detailDataViewBorder)/zoomBoxSizes[zoomBoxSizes.indexOf(dataBoxHeight)]) > heatMap.getNumRows(MatrixManager.DETAIL_LEVEL)) {
		setDetailDataHeight(zoomBoxSizes[zoomBoxSizes.indexOf(dataBoxHeight)+1]);
	}	
	
	detCanvas.width =  (detailDataViewWidth + calculateTotalClassBarHeight("row") + detailDendroWidth);
	detCanvas.height = (detailDataViewHeight + calculateTotalClassBarHeight("column") + detailDendroHeight);
	detSetupGl();
	detInitGl();
	updateSelection();
	document.getElementById("viewport").setAttribute("content", "height=device-height");
    document.getElementById("viewport").setAttribute("content", "");
}

function detailVRibbon () {
	userHelpClose();	
	var previousMode = mode;
	var prevHeight = dataBoxHeight;
	saveRow = currentRow;
	
	mode='RIBBONV';
	setButtons();

	// If normal (full) ribbon, set the width of the detail display to the size of the horizontal ribbon view
	// and data size to 1.
	if (selectedStart == null || selectedStart == 0) {
		detailDataViewHeight = heatMap.getNumRows(MatrixManager.RIBBON_VERT_LEVEL) + detailDataViewBorder;
		var ddh = 1;
		while(2*detailDataViewHeight < 500){ // make the height taller to prevent blurry/big dendros for smaller maps
			ddh *=2;
			detailDataViewHeight = ddh*heatMap.getNumRows(MatrixManager.RIBBON_VERT_LEVEL) + detailDataViewBorder;
		}
		setDetailDataHeight(ddh);
		currentRow = 1;
	} else {
		var selectionSize = selectedStop - selectedStart + 1;
		if (selectionSize < 500) {
			mode = 'RIBBONV_DETAIL';
		} else {
			var rvRate = heatMap.getRowSummaryRatio(MatrixManager.RIBBON_VERT_LEVEL);
			selectionSize = Math.floor(selectionSize / rvRate);			
		}
		var height = Math.max(1, Math.floor(500/selectionSize));
    	detailDataViewHeight = (selectionSize * height) + detailDataViewBorder;
		setDetailDataHeight(height);
		currentRow = selectedStart;
	}
	
	detailDataViewWidth = DETAIL_SIZE_NORMAL_MODE;
	if ((previousMode=='RIBBONH') || (previousMode=='RIBBONH_DETAIL')) {
		setDetailDataWidth(prevHeight);
		currentCol = saveCol;
	}
	
	//On some maps, one view (e.g. ribbon view) can show bigger data areas than will fit for other view modes.  If so, zoom back out to find a workable zoom level.
	while (Math.floor((detailDataViewWidth-detailDataViewBorder)/zoomBoxSizes[zoomBoxSizes.indexOf(dataBoxWidth)]) > heatMap.getNumColumns(MatrixManager.DETAIL_LEVEL)) {
		setDetailDataWidth(zoomBoxSizes[zoomBoxSizes.indexOf(dataBoxWidth)+1]);
	}	
		
	detCanvas.width =  (detailDataViewWidth + calculateTotalClassBarHeight("row") + detailDendroWidth);
	detCanvas.height = (detailDataViewHeight + calculateTotalClassBarHeight("column") + detailDendroHeight);
	detSetupGl();
	detInitGl();
	updateSelection();
	document.getElementById("viewport").setAttribute("content", "height=device-height");
    document.getElementById("viewport").setAttribute("content", "");
}

function detailNormal () {
	userHelpClose();	
	var previousMode = mode;
	mode = 'NORMAL';
	setButtons();
	detailDataViewHeight = DETAIL_SIZE_NORMAL_MODE;
	detailDataViewWidth = DETAIL_SIZE_NORMAL_MODE;
	if ((previousMode=='RIBBONV') || (previousMode=='RIBBONV_DETAIL')) {
		setDetailDataSize(dataBoxWidth);
		currentRow = saveRow;
	} else if ((previousMode=='RIBBONH') || (previousMode=='RIBBONH_DETAIL')) {
		setDetailDataSize(dataBoxHeight);
		currentCol = saveCol;
	} else {
		
	}	

	//On some maps, one view (e.g. ribbon view) can show bigger data areas than will fit for other view modes.  If so, zoom back out to find a workable zoom level.
	while ((Math.floor((detailDataViewHeight-detailDataViewBorder)/zoomBoxSizes[zoomBoxSizes.indexOf(dataBoxHeight)]) > heatMap.getNumRows(MatrixManager.DETAIL_LEVEL)) ||
           (Math.floor((detailDataViewWidth-detailDataViewBorder)/zoomBoxSizes[zoomBoxSizes.indexOf(dataBoxWidth)]) > heatMap.getNumColumns(MatrixManager.DETAIL_LEVEL))) {
		setDetailDataSize(zoomBoxSizes[zoomBoxSizes.indexOf(dataBoxWidth)+1]);
	}	
	
	checkRow();
	checkColumn();
	detCanvas.width =  (detailDataViewWidth + calculateTotalClassBarHeight("row") + detailDendroWidth);
	detCanvas.height = (detailDataViewHeight + calculateTotalClassBarHeight("column") + detailDendroHeight);
	 
	detSetupGl();
	detInitGl();
	clearDendroSelection();
	updateSelection();
	document.getElementById("viewport").setAttribute("content", "height=device-height");
    document.getElementById("viewport").setAttribute("content", "");
}

function setButtons() {
	var full = document.getElementById('full_btn');
	var ribbonH = document.getElementById('ribbonH_btn');
	var ribbonV = document.getElementById('ribbonV_btn');
	full.src= staticPath+ "images/full.png";
	ribbonH.src= staticPath + "images/ribbonH.png";
	ribbonV.src= staticPath + "images/ribbonV.png";
	if (mode=='RIBBONV')
		ribbonV.src= staticPath + "images/ribbonV_selected.png";
	else if (mode == "RIBBONH")
		ribbonH.src= staticPath + "images/ribbonH_selected.png";
	else
		full.src= staticPath + "images/full_selected.png";	
}

function setDetCanvasBoxSize() {
	detBoxCanvas.width =  detCanvas.clientWidth;
	detBoxCanvas.height = detCanvas.clientHeight;
	detBoxCanvas.style.left=detCanvas.style.left;
	detBoxCanvas.style.top=detCanvas.style.top;
}

//Called when split/join button is pressed
function detailSplit(){
	if (!heatMap.getUnAppliedChanges()) {
		userHelpClose();
		heatMap.setFlickInitialized(false);
		// If the summary and detail are in a single browser window, this is a split action.  
		if (!isSub) {
			//Write current selection settings to the local storage
			hasSub=true;
			clearLabels();
			clearSelectionMarks();
			updateSelection();
			//Create a new detail browser window
			detWindow = window.open(window.location.href + '&sub=true', '_blank', 'modal=yes, width=' + (window.screen.availWidth / 2) + ', height='+ window.screen.availHeight + ',top=0, left=' + (window.screen.availWidth / 2));
			detWindow.moveTo(window.screen.availWidth / 2, 0);
			detWindow.onbeforeunload = function(){rejoinNotice(),hasSub=false,detailJoin();} // when you close the subwindow, it will return to the original window
			var detailDiv = document.getElementById('detail_chm');
			detailDiv.style.display = 'none';
			var dividerDiv = document.getElementById('divider');
			dividerDiv.style.display = 'none';
			//In summary window, hide the action buttons and expand the summary to 100% of the window.
			var detailButtonDiv = document.getElementById('bottom_buttons');
			var detailFlickDiv = document.getElementById('flicks');
			detailButtonDiv.style.display = 'none';
			detailFlickDiv.style.display = 'none';
			var summaryDiv = document.getElementById('summary_chm');
			summaryDiv.style.width = '100%';
			setSummarySize();
			summaryRowDendro.draw();
			summaryColumnDendro.draw();
			drawRowSelectionMarks();
			drawColSelectionMarks();
	 		document.getElementById('pdf_gear').style.display = 'none';
		} else {
			updateSelection();
			rejoinNotice();
			window.close();
		}
	} else {
		unappliedChangeNotification();
	}
}

//Called when a separate detail window is joined back into the main window.
function detailJoin() {
	var detailDiv = document.getElementById('detail_chm');
	detailDiv.style.display = '';
	var detailButtonDiv = document.getElementById('bottom_buttons');
	detailButtonDiv.style.display = '';
	var dividerDiv = document.getElementById('divider');
	dividerDiv.style.display = '';
	initSummarySize();
	summaryRowDendro.draw();
	summaryColumnDendro.draw();
	initFromLocalStorage();
	clearSelectionMarks();
	drawRowSelectionMarks();
	drawColSelectionMarks();
	heatMap.configureFlick();
	flickToggleOff();
	document.getElementById('pdf_gear').style.display = '';
	if (flickExists()){
		document.getElementById('pdf_gear').style.minWidth = '340px';
	} else {
		document.getElementById('pdf_gear').style.minWidth = '140px';
	}
}


// Callback that is notified every time there is an update to the heat map 
// initialize, new data, etc.  This callback draws the summary heat map.
function processDetailMapUpdate (event, level) {

	if (event == MatrixManager.Event_INITIALIZED) {
		detailInit();
		heatMap.configureButtonBar();
	} else {
		//Data tile update - wait a bit to see if we get another new tile quickly, then draw
		if (detEventTimer != 0) {
			//New tile arrived - reset timer
			clearTimeout(detEventTimer);
		}
		detEventTimer = setTimeout(drawDetailHeatMap, 200);
	} 
}

function setDendroShow() {
	var rowDendroConfig = heatMap.getRowDendroConfig();
	var colDendroConfig = heatMap.getColDendroConfig();
	if (!heatMap.showRowDendrogram("DETAIL")) {
		detailDendroWidth = 15;
	} else {
		detailDendroWidth = Math.floor(parseInt(rowDendroConfig.height) * heatMap.getRowDendroConfig().height/100+5);
	}
	if (!heatMap.showColDendrogram("DETAIL")) {
		detailDendroHeight = 15;
	} else {
		detailDendroHeight = Math.floor(parseInt(colDendroConfig.height) * heatMap.getColDendroConfig().height/100+5);
	}
}
 
//Perform all initialization functions for Detail heat map
function detailInit() {
	setDendroShow();
	document.getElementById('detail_buttons').style.display = '';
	detCanvas.width =  (detailDataViewWidth + calculateTotalClassBarHeight("row") + detailDendroWidth);
	detCanvas.height = (detailDataViewHeight + calculateTotalClassBarHeight("column") + detailDendroHeight);
	createLabelMenus();
	createEmptySearchItems();
	if (getURLParameter("selected") !== ""){
		var selected = getURLParameter("selected").split(",");
		for (var i = 0; i < selected.length; i++){
			var item = selected[i];
			var axis = "Row";
			var index = findRowLabel(item);
			if (index < 0){
				axis = "Column";
				index = findColLabel(item);
			}
			if (!searchItems[axis])searchItems[axis] = {};
			searchItems[axis][index+1] = 1;
		}
		drawRowSelectionMarks();
		drawColSelectionMarks();
	}
	if (typeof dataBoxWidth === 'undefined') {
		setDetailDataSize(12);
	}
	detSetupGl();
	detInitGl();
	if (isSub)  {
		initFromLocalStorage();
	} else {
		updateSelection();
	}
}

function drawDetailHeatMap() {
 	
	setDetCanvasBoxSize();
	if ((currentRow == null) || (currentRow == 0)) {
		return;
	}
	setDendroShow();
	var colorMap = heatMap.getColorMapManager().getColorMap("data",currentDl);
	var dataLayers = heatMap.getDataLayers();
	var dataLayer = dataLayers[currentDl];
	var showGrid = false;
	if (dataLayer.grid_show === 'Y') {
		showGrid = true;
	}
	var rowClassBarWidth = calculateTotalClassBarHeight("row");
	var searchRows = getSearchRows();
	var searchCols = getSearchCols();
	var searchGridColor = [0,0,0];
	var dataGridColor = colorMap.getHexToRgba(dataLayer.grid_color);
	var dataSelectionColorRGB = colorMap.getHexToRgba(dataLayer.selection_color);
	var dataSelectionColor = [dataSelectionColorRGB.r/255, dataSelectionColorRGB.g/255, dataSelectionColorRGB.b/255, 1];
	var regularGridColor = [dataGridColor.r, dataGridColor.g, dataGridColor.b];
	var detDataPerRow = getCurrentDetDataPerRow();
	var detDataPerCol = getCurrentDetDataPerCol();
 
	//Build a horizontal grid line for use between data lines. Tricky because some dots will be selected color if a column is in search results.
	var gridLine = new Uint8Array(new ArrayBuffer((detailDendroWidth + rowClassBarWidth + detailDataViewWidth) * BYTE_PER_RGBA));
	if (showGrid == true) {
		var linePos = (detailDendroWidth+rowClassBarWidth)*BYTE_PER_RGBA;
		gridLine[linePos]=0; gridLine[linePos+1]=0;gridLine[linePos+2]=0;gridLine[linePos+3]=255;linePos+=BYTE_PER_RGBA;
		for (var j = 0; j < detDataPerRow; j++) {
			var gridColor = ((searchCols.indexOf(currentCol+j) > -1) || (searchCols.indexOf(currentCol+j+1) > -1)) ? searchGridColor : regularGridColor;
			for (var k = 0; k < dataBoxWidth; k++) {
				if (k==dataBoxWidth-1 && showGrid == true && dataBoxWidth > minLabelSize ){ // should the grid line be drawn?
					gridLine[linePos] = gridColor[0]; gridLine[linePos+1] = gridColor[1]; gridLine[linePos+2] = gridColor[2];	gridLine[linePos+3] = 255;
				} else {
					gridLine[linePos]=regularGridColor[0]; gridLine[linePos + 1]=regularGridColor[1]; gridLine[linePos + 2]=regularGridColor[2]; gridLine[linePos + 3]=255;
				}
				linePos += BYTE_PER_RGBA;
			}
		}
		gridLine[linePos]=0; gridLine[linePos+1]=0;gridLine[linePos+2]=0;gridLine[linePos+3]=255;linePos+=BYTE_PER_RGBA;
	}
	
	//Setup texture to draw on canvas.
	
	//Draw black border line
	var pos = (rowClassBarWidth+detailDendroWidth)*BYTE_PER_RGBA;
	for (var i = 0; i < detailDataViewWidth; i++) {
		detTexPixels[pos]=0;
		detTexPixels[pos+1]=0;
		detTexPixels[pos+2]=0;
		detTexPixels[pos+3]=255;
		pos+=BYTE_PER_RGBA;
	}
		
	//Needs to go backward because WebGL draws bottom up.
	var line = new Uint8Array(new ArrayBuffer((rowClassBarWidth + detailDendroWidth + detailDataViewWidth) * BYTE_PER_RGBA));
	for (var i = detDataPerCol-1; i >= 0; i--) {
		var linePos = (rowClassBarWidth + detailDendroWidth)*BYTE_PER_RGBA;
		//Add black boarder
		line[linePos]=0; line[linePos+1]=0;line[linePos+2]=0;line[linePos+3]=255;linePos+=BYTE_PER_RGBA;
		for (var j = 0; j < detDataPerRow; j++) { // for every data point...
			var val = heatMap.getValue(getLevelFromMode(MatrixManager.DETAIL_LEVEL), getCurrentDetRow()+i, getCurrentDetCol()+j);
			var color = colorMap.getColor(val);
			var gridColor = ((searchCols.indexOf(currentCol+j) > -1) || (searchCols.indexOf(currentCol+j+1) > -1)) ? searchGridColor : regularGridColor;

			//For each data point, write it several times to get correct data point width.
			for (var k = 0; k < dataBoxWidth; k++) {
				if (k==dataBoxWidth-1 && showGrid == true && dataBoxWidth > minLabelSize ){ // should the grid line be drawn?
					line[linePos] = gridColor[0]; line[linePos+1] = gridColor[1]; line[linePos+2] = gridColor[2];	line[linePos+3] = 255;
				} else {
					line[linePos] = color['r'];	line[linePos + 1] = color['g'];	line[linePos + 2] = color['b'];	line[linePos + 3] = color['a'];
				}
				linePos += BYTE_PER_RGBA;
			}
		}
		line[linePos]=0; line[linePos+1]=0;line[linePos+2]=0;line[linePos+3]=255;linePos+=BYTE_PER_RGBA;


		//Write each line several times to get correct data point height.
		for (dup = 0; dup < dataBoxHeight; dup++) {
			if (dup == dataBoxHeight-1 && showGrid == true && dataBoxHeight > minLabelSize){ // do we draw gridlines?
				if ((searchRows.indexOf(currentRow+i) > -1) || (searchRows.indexOf(currentRow+i-1) > -1)) {
					pos += (rowClassBarWidth + detailDendroWidth)*BYTE_PER_RGBA;
					for (var k = 0; k < detailDataViewWidth; k++) {
						detTexPixels[pos]=searchGridColor[0];detTexPixels[pos+1]=searchGridColor[1];detTexPixels[pos+2]=searchGridColor[2];detTexPixels[pos+3]=255;pos+=BYTE_PER_RGBA;
					}					
				} else {
					for (k = 0; k < line.length; k++) {
						detTexPixels[pos]=gridLine[k];
						pos++;
					}
				}	
			} else {
				for (k = 0; k < line.length; k++) {
					detTexPixels[pos]=line[k];
					pos++;
				}
			}
		}
	}

	//Draw black border line
	pos += (rowClassBarWidth + detailDendroWidth)*BYTE_PER_RGBA;
	for (var i = 0; i < detailDataViewWidth; i++) {
		detTexPixels[pos]=0;detTexPixels[pos+1]=0;detTexPixels[pos+2]=0;detTexPixels[pos+3]=255;pos+=BYTE_PER_RGBA;
	}
	clearDetailDendrograms();
	if (heatMap.showRowDendrogram("DETAIL")) {
		rowDetailDendroMatrix = buildDetailDendroMatrix('row', currentRow, currentRow+dataPerCol, heatMap.getNumRows(MatrixManager.DETAIL_LEVEL)/dataPerCol);
		detailDrawRowDendrogram(detTexPixels);
	}
	if (heatMap.showColDendrogram("DETAIL")) {
		colDetailDendroMatrix = buildDetailDendroMatrix('col', currentCol, currentCol+dataPerRow, heatMap.getNumColumns(MatrixManager.DETAIL_LEVEL)/dataPerRow);
		detailDrawColDendrogram(detTexPixels);
	}
	//Draw column classification bars.
	detailDrawColClassBars();
	detailDrawRowClassBars();
	
	//Draw any selection boxes defined by SearchRows/SearchCols
	drawSelections();
	
	//WebGL code to draw the summary heat map.
	det_gl.activeTexture(det_gl.TEXTURE0);
	det_gl.texImage2D(
			det_gl.TEXTURE_2D, 
			0, 
			det_gl.RGBA, 
			detTextureParams['width'], 
			detTextureParams['height'], 
			0, 
			det_gl.RGBA,
			det_gl.UNSIGNED_BYTE, 
			detTexPixels);
	det_gl.uniform2fv(detUScale, detCanvasScaleArray);
	det_gl.uniform2fv(detUTranslate, detCanvasTranslateArray);
	det_gl.drawArrays(det_gl.TRIANGLE_STRIP, 0, det_gl.buffer.numItems);

	clearLabels();
	drawRowAndColLabels();
	detailDrawColClassBarLabels();
	detailDrawRowClassBarLabels();
}

function detailResize() {
	 clearLabels();
	 drawSelections();
	 drawRowAndColLabels();
	 detailDrawColClassBarLabels();
	 detailDrawRowClassBarLabels();
}

/***********************************************************
 * Search Functions Section
 ***********************************************************/

//Called when search string is entered.
function detailSearch() {
	var searchElement = document.getElementById('search_text');
	var searchString = searchElement.value;
	if (searchString == "" || searchString == null){
		return;
	}
	createEmptySearchItems();
	clearSelectionMarks();
	var tmpSearchItems = searchString.split(/[;, ]+/);
	itemsFound = [];
	
	//Put labels into the global search item list if they match a user search string.
	//Regular expression is built for partial matches if the search string contains '*'.
	//toUpperCase is used to make the search case insensitive.
	var labels = heatMap.getRowLabels()["labels"];
	for (var j = 0; j < tmpSearchItems.length; j++) {
		var reg;
		var searchItem = tmpSearchItems[j];
		if (searchItem.charAt(0) == "\"" && searchItem.slice(-1) == "\""){ // is it wrapped in ""?
			reg = new RegExp("^" + searchItem.toUpperCase().slice(1,-1) + "$");
		} else {
			reg = new RegExp(searchItem.toUpperCase());
		}
		for (var i = 0; i < labels.length; i++) {
			var label = labels[i].toUpperCase();
			if (label.indexOf('|') > -1)
				label = label.substring(0,label.indexOf('|'));
			
			if  (reg.test(label)) {
				searchItems["Row"][i+1] = 1;
				if (itemsFound.indexOf(searchItem) == -1)
					itemsFound.push(searchItem);
			} 
		}	
	}

	labels = heatMap.getColLabels()["labels"];
	for (var j = 0; j < tmpSearchItems.length; j++) {
		var reg;
		var searchItem = tmpSearchItems[j];
		if (searchItem.charAt(0) == "\"" && searchItem.slice(-1) == "\""){ // is it wrapped in ""?
			reg = new RegExp("^" + searchItem.toUpperCase().slice(1,-1) + "$");
		} else {
			reg = new RegExp(searchItem.toUpperCase());
		}
		for (var i = 0; i < labels.length; i++) {
			var label = labels[i].toUpperCase();
			if (label.indexOf('|') > -1)
				label = label.substring(0,label.indexOf('|'));
			
			if  (reg.test(label)) {
				searchItems["Column"][i+1] = 1;
				if (itemsFound.indexOf(searchItem) == -1)
					itemsFound.push(searchItem);
			} 
		}	
	}

	//Jump to the first match
	if (searchString == null || searchString == ""){
		return;
	}
	searchNext();
	if (!isSub){
		drawRowSelectionMarks();
		drawColSelectionMarks();
	}
	if (currentSearchItem.index && currentSearchItem.axis){
		if (itemsFound.length != tmpSearchItems.length && itemsFound.length > 0) {
			searchElement.style.backgroundColor = "rgba(255,255,0,0.3)";
		} else if (itemsFound.length == 0){
			searchElement.style.backgroundColor = "rgba(255,0,0,0.3)";
		}
	} else {
		if (searchString != null && searchString.length> 0) {
			searchElement.style.backgroundColor = "rgba(255,0,0,0.3)";
		}	
		//Clear previous matches when search is empty.
		updateSelection();
	}
}

function goToCurrentSearchItem() {
	if (currentSearchItem.axis == "Row") {
		currentRow = currentSearchItem.index;
		if ((mode == 'RIBBONV') && selectedStart!= 0 && (currentRow < selectedStart-1 || selectedStop-1 < currentRow)){
			showSearchError(1);
		} else if (mode == 'RIBBONV' && selectedStart == 0){
			showSearchError(2);
		} 
		checkRow();
	} else if (currentSearchItem.axis == "Column"){
		currentCol = currentSearchItem.index;
		if ((mode == 'RIBBONH') && selectedStart!= 0 && (currentCol < selectedStart-1 || selectedStop-1 < currentCol )){
			showSearchError(1)
		} else if (mode == 'RIBBONH' && selectedStart == 0){
			showSearchError(2);
		} 
		checkColumn();
	}
	showSrchBtns();
	updateSelection();
}

//Search the row and column labels - return position if found or -1 if not found.
function findRowLabel(name){
	var labels = heatMap.getRowLabels()["labels"];
	for (var i = 0; i < labels.length; i++) {
		if (labels[i].toUpperCase() == name.toUpperCase())
			return i;
	}
	return -1;
}	
	
function findColLabel(name) {	
	var labels = heatMap.getColLabels()["labels"];
	for (var i = 0; i < labels.length; i++) {
		if (labels[i].toUpperCase() == name.toUpperCase())
			return i;
	}
	return -1;
}

function findNextSearchItem(index, axis){
	var axisLength = axis == "Row" ? heatMap.getRowLabels().labels.length : heatMap.getColLabels().labels.length;
	var otherAxis = axis == "Row" ? "Column" : "Row";
	var otherAxisLength = axis == "Column" ? heatMap.getRowLabels().labels.length : heatMap.getColLabels().labels.length;
	var curr = index;
	while( !searchItems[axis][++curr] && curr <  axisLength); // find first searchItem in row
	if (curr >= axisLength){ // if no searchItems exist in first axis, move to other axis
		curr = -1;
		while( !searchItems[otherAxis][++curr] && curr <  otherAxisLength);
		if (curr >=otherAxisLength){ // if no matches in the other axis, check the earlier indices of the first axis (loop back)
			curr = -1;
			while( !searchItems[axis][++curr] && curr <  index);
			if (curr < index && index != -1){
				currentSearchItem["axis"] = axis;
				currentSearchItem["index"] = curr;
			}
		} else {
			currentSearchItem["axis"] = otherAxis;
			currentSearchItem["index"] = curr;
		}
	} else {
		currentSearchItem["axis"] = axis;
		currentSearchItem["index"] = curr;
	}
}

function findPrevSearchItem(index, axis){
	var axisLength = axis == "Row" ? heatMap.getRowLabels().labels.length : heatMap.getColLabels().labels.length;
	var otherAxis = axis == "Row" ? "Column" : "Row";
	var otherAxisLength = axis == "Column" ? heatMap.getRowLabels().labels.length : heatMap.getColLabels().labels.length;
	var curr = index;
	while( !searchItems[axis][--curr] && curr > -1 ); // find first searchItem in row
	if (curr < 0){ // if no searchItems exist in first axis, move to other axis
		curr = otherAxisLength;
		while( !searchItems[otherAxis][--curr] && curr > -1);
		if (curr > 0){
			currentSearchItem["axis"] = otherAxis;
			currentSearchItem["index"] = curr;
		} else {
			curr = axisLength;
			while( !searchItems[axis][--curr] && curr > index );
			if (curr > index){
				currentSearchItem["axis"] = axis;
				currentSearchItem["index"] = curr;
			}
		}
	} else {
		currentSearchItem["axis"] = axis;
		currentSearchItem["index"] = curr;
	}
}

//Go to next search item
function searchNext() {
	if (!currentSearchItem["index"] || !currentSearchItem["axis"]){ // if currentSeachItem isnt set (first time search)
		findNextSearchItem(-1,"Row");
	} else {
		findNextSearchItem(currentSearchItem["index"],currentSearchItem["axis"]);
	}
	goToCurrentSearchItem();
}

//Go back to previous search item.
function searchPrev() {
	findPrevSearchItem(currentSearchItem["index"],currentSearchItem["axis"]);
	goToCurrentSearchItem();
}

//Called when red 'X' is clicked.
function clearSearch(event){
	var searchElement = document.getElementById('search_text');
	searchElement.value = "";
	currentSearchItem = {};
	labelLastClicked = {};
	createEmptySearchItems();
	summaryRowDendro.clearSelectedBars();
	summaryColumnDendro.clearSelectedBars();
	if (isSub){
		localStorage.setItem('selected', JSON.stringify(searchItems));
		updateSelection();
	} else {
		clearSelectionMarks();
	}
	clearSrchBtns(event);
	detailResize();
	drawDetailHeatMap();  //DO WE NEED THIS???
//	detailSearch();
}

function clearSrchBtns(event) {
	if ((event != null) && (event.keyCode == 13))
		return;
	
	document.getElementById('prev_btn').style.display='none';
	document.getElementById('next_btn').style.display='none';	
	document.getElementById('cancel_btn').style.display='none';	
	var srchText = document.getElementById('search_text');
	srchText.style.backgroundColor = "white";
}

function showSrchBtns(){
	document.getElementById('prev_btn').style.display='';
	document.getElementById('next_btn').style.display='';
	document.getElementById('cancel_btn').style.display='';
}

function findCurrentSelection() {
	if (currentSearchItem === undefined){
		return 0;
	}
	for (var i = 0; i < searchItems[currentSearchItem["axis"]].length; i++) {
		if (currentSearchItem.label == searchItems[i].label && currentSearchItem.axis == searchItems[i].axis)
			return i;
	}
	return 0;
}

//Return the column number of any columns meeting the current user search.
function getSearchCols() {
	var selected = [];
	for (var i in searchItems["Column"]) {
		selected.push(i);
	}
	return selected;	
}

//Return row numbers of any rows meeting current user search.
function getSearchRows() {
	var selected = [];
	for (var i in searchItems["Row"]) {
		selected.push(i);
	}
	return selected;
}

/***********************************************************
 * End - Search Functions
 ***********************************************************/

function clearLabels() {
	var oldLabels = document.getElementsByClassName("DynamicLabel");
	while (oldLabels.length > 0) {
		labelElement.removeChild(oldLabels[0]);
	}

}

function drawRowAndColLabels(){
	var headerSize = 0;
	var colHeight = calculateTotalClassBarHeight("column") + detailDendroHeight;
	if (colHeight > 0) {
		headerSize = detCanvas.clientHeight * (colHeight / (detailDataViewHeight + colHeight));
	}
	var skip = (detCanvas.clientHeight - headerSize) / dataPerCol;
	var rowFontSize = Math.max(Math.min(skip - 2, 11),minLabelSize);	
	
	headerSize = 0;
	var rowHeight = calculateTotalClassBarHeight("row") + detailDendroWidth;
	if (rowHeight > 0) {
		headerSize = detCanvas.clientWidth * (rowHeight / (detailDataViewWidth + rowHeight));
	}
	skip = (detCanvas.clientWidth - headerSize) / dataPerRow;
	var colFontSize = Math.max(Math.min(skip - 2, 11),minLabelSize);
	var fontSize = Math.min(colFontSize,rowFontSize);	
	drawRowLabels(fontSize);
	drawColLabels(fontSize);
}

function drawRowLabels(fontSize) {
	var headerSize = 0;
	var colHeight = calculateTotalClassBarHeight("column") + detailDendroHeight;
	if (colHeight > 0) {
		headerSize = detCanvas.clientHeight * (colHeight / (detailDataViewHeight + colHeight));
	}
	var skip = (detCanvas.clientHeight - headerSize) / dataPerCol;
	var start = Math.max((skip - fontSize)/2, 0) + headerSize-2;
	var labels = heatMap.getRowLabels()["labels"];
	
	
	if (skip > minLabelSize) {
		var xPos = detCanvas.clientWidth + 3;
		for (var i = currentRow; i < currentRow + dataPerCol; i++) {
			var yPos = start + ((i-currentRow) * skip);
			if (labels[i-1] == undefined){ // an occasional problem in subdendro view
				continue;
			}
			var shownLabel = labels[i-1].split("|")[0];
			addLabelDiv(labelElement, 'detail_row' + i, 'DynamicLabel', shownLabel, xPos, yPos, fontSize, 'F',i,"Row");
		}
	}
}


function drawColLabels(fontSize) {
	var headerSize = 0;
	var rowHeight = calculateTotalClassBarHeight("row") + detailDendroWidth;
	if (rowHeight > 0) {
		headerSize = detCanvas.clientWidth * (rowHeight / (detailDataViewWidth + rowHeight));
	}
	var skip = (detCanvas.clientWidth - headerSize) / dataPerRow;
	var start = headerSize + fontSize + Math.max((skip - fontSize)/2, 0) + 3;
	var labels = heatMap.getColLabels()["labels"];
	var labelLen = getMaxLength(labels);
		
	if (skip > minLabelSize) {
		var yPos = detCanvas.clientHeight + 3;
		for (var i = currentCol; i < currentCol + dataPerRow; i++) {
			var xPos = start + ((i-currentCol) * skip);
			if (labels[i-1] == undefined){ // an occasional problem in subdendro view
				continue;
			}
			var shownLabel = labels[i-1].split("|")[0];
			addLabelDiv(labelElement, 'detail_col' + i, 'DynamicLabel', shownLabel, xPos, yPos, fontSize, 'T',i,"Column");
		}
	}
}

function addLabelDiv(parent, id, className, text, left, top, fontSize, rotate, index,axis) {
	var colorMap = heatMap.getColorMapManager().getColorMap("data",currentDl);
	var dataLayer = heatMap.getDataLayers()[currentDl];
	var selectionRgba = colorMap.getHexToRgba(dataLayer.selection_color);
	var div = document.createElement('div');
	var divFontColor = "#FFFFFF";
	var selColor = colorMap.getHexToRgba(dataLayer.selection_color);
	if (colorMap.isColorDark(selColor)) {
		divFontColor = "#000000";
	}
	div.id = id;
	div.className = className;
	div.setAttribute("index",index)
	if (div.classList.contains('ClassBar')){
		div.setAttribute('axis','ColumnCovar');
	} else {
		div.setAttribute('axis', 'Row');
	}
	if (labelIndexInSearch(index,axis)) {
		div.style.backgroundColor = dataLayer.selection_color;
		div.style.color = divFontColor;
	}
	if (text == "<") {
	//	div.style.backgroundColor = "rgba(3,255,3,0.2)";
		div.style.color = divFontColor;
		div.style.backgroundColor = "rgba("+selectionRgba.r+","+selectionRgba.g+","+selectionRgba.b+",0.2)";
	}
	if (rotate == 'T') {
		div.style.transformOrigin = 'left top';
		div.style.transform = 'rotate(90deg)';
		div.style.webkitTransformOrigin = "left top";
		div.style.webkitTransform = "rotate(90deg)";
		if (div.classList.contains('ClassBar')){
			div.setAttribute('axis','RowCovar');
		} else {
			div.setAttribute('axis','Column');
		}
	}
	
	div.style.position = "absolute";
	div.style.left = left;
	div.style.top = top;
	div.style.fontSize = fontSize.toString() +'pt';
	div.style.fontFamily = 'sans-serif';
	div.style.fontWeight = 'bold';
	div.innerHTML = text;
	
	parent.appendChild(div);
	if (text !== "<" && text !== "..."){
		div.addEventListener('click',labelClick,false);
		div.addEventListener('contextmenu',labelRightClick,false);
		var rect = div.getBoundingClientRect;
		if (rect.right > window.innerWidth-15){
			div.style.width =  window.innerWidth - rect.left - 15;
			div.onmouseover = function(){detailDataToolHelp(this,text);}
			div.onmouseleave = userHelpClose;
		} else if (rect.bottom > window.innerHeight-15){
			div.style.width =  window.innerHeight - rect.top - 15;
			div.onmouseover = function(){detailDataToolHelp(this,text);}
			div.onmouseleave = userHelpClose;
		}
	} else if (text == "..."){
		div.addEventListener('mouseover', (function() {
		    return function(e) {detailDataToolHelp(this, "Some covariate bars are hidden"); };
		}) (this), false);
	}
}


// Get max label length
function getMaxLength(list) {
	var len = 0;
	for (var i = 0; i < list.length; i++){
		if (list[i].length > len)
			len = list[i].length;
	}
	return len;
}

function labelClick(e){
	if (e.shiftKey){ // shift + click
		var selection = window.getSelection();
		selection.removeAllRanges();
		var focusNode = this;
		var focusIndex = Number(this.getAttribute('index'));
		var axis = focusNode.getAttribute("axis");
		if (labelLastClicked[axis]){ // if label in the same axis was clicked last, highlight all
			var anchorIndex = Number(labelLastClicked[axis]);
			var startIndex = Math.min(focusIndex,anchorIndex), endIndex = Math.max(focusIndex,anchorIndex);
			for (var i = startIndex; i <= endIndex; i++){
				if (!labelIndexInSearch(i, axis)){
					searchItems[axis][i] = 1;
				}
			}
		} else { // otherwise, treat as normal click
			clearSearchItems(this.getAttribute('axis'));
			var searchIndex = labelIndexInSearch(focusIndex,axis);
			if (searchIndex ){
				delete searchItems[axis][index];
			} else {
				searchItems[axis][focusIndex] = 1;
			}
		}
		labelLastClicked[axis] = focusIndex;
	} else if (e.ctrlKey || e.metaKey){ // ctrl or Mac key + click
		var axis = this.getAttribute("axis");
		var index = this.getAttribute("index");
		var searchIndex = labelIndexInSearch(index, axis);
		if (searchIndex){ // if already searched, remove from search items
			delete searchItems[axis][index];
		} else {
			searchItems[axis][index] = 1;
		}
		labelLastClicked[axis] = index;
	} else { // standard click
		var axis = this.getAttribute("axis");
		var index = this.getAttribute("index");
		clearSearchItems(axis);
		searchItems[axis][index] = 1;
		labelLastClicked[axis] = index;
	}
	var searchElement = document.getElementById('search_text');
	searchElement.value = "";
	document.getElementById('prev_btn').style.display='';
	document.getElementById('next_btn').style.display='';
	document.getElementById('cancel_btn').style.display='';
	clearLabels();
	clearSelectionMarks();
	detailDrawRowClassBarLabels();
	detailDrawColClassBarLabels();
	drawRowAndColLabels();
	updateSelection();
	if (isSub){
		localStorage.setItem('selected', JSON.stringify(searchItems));
	}
	if (!isSub){
		drawRowSelectionMarks();
		drawColSelectionMarks();
	}
}

function clearSearchItems(clickAxis){ // clears the search items on a particular axis
	var length = searchItems[clickAxis].length;
//	searchItems[clickAxis] = new Array(length);
	searchItems[clickAxis] = {};
	if (clickAxis == "Row"){
		summaryRowDendro.clearSelectedBars();
	} else if (clickAxis == "Column"){
		summaryColumnDendro.clearSelectedBars();
	}
	var markLabels = document.getElementsByClassName('MarkLabel');
	while (markLabels.length>0){ // clear tick marks
		markLabels[0].remove();
	}
}


function highlightColLabelsRange(){
	//var selectionSize = start - stop + 1;
	var labels = document.getElementsByClassName("DynamicLabel");
	for (var i = 0; i < labels.length; i++){
		var label = labels[i];
		if (label.getAttribute('axis') == 'Column' && !label.classList.contains('ClassBar')){
			searchItems["Column"][label.getAttribute('index')] = 1;
			label.classList.add('searchItem');
		}
	}
	drawRowSelectionMarks();
	drawColSelectionMarks();
}



function highlightAllColLabels(){
	var selectionSize = selectedStop - selectedStart + 1;
	if ((mode == "RIBBONH" || mode === "RIBBONH_DETAIL") && selectionSize > 1){
//		clearSearchItems("Column");
		var labels = document.getElementsByClassName("DynamicLabel");
		for (var i = 0; i < labels.length; i++){
			var label = labels[i];
			if (label.getAttribute('axis') == 'Column' && !label.classList.contains('ClassBar')){
				searchItems["Column"][label.getAttribute('index')] = 1;
				label.classList.add('searchItem');
			}
		}
	}
	if (!isSub){
		drawRowSelectionMarks();
		drawColSelectionMarks();
	}
}

function highlightAllRowLabels(){
	var selectionSize = selectedStop - selectedStart + 1;
	if ((mode == "RIBBONV" || mode === "RIBBONV_DETAIL") && selectionSize > 1){
//		clearSearchItems("Row");
		var labels = document.getElementsByClassName("DynamicLabel");
		for (var i = 0; i < labels.length; i++){
			var label = labels[i];
			if (label.getAttribute('axis') == 'Row' && !label.classList.contains('ClassBar')){
				searchItems["Row"][label.getAttribute('index')] = 1;
				label.classList.add('searchItem');
			}
		}
	}
	if (!isSub){
		drawRowSelectionMarks();
		drawColSelectionMarks();	
	}
}

function labelRightClick(e) {
    e.preventDefault();
    var axis = e.target.getAttribute('axis');
    var labels = searchItems;
    labelHelpClose(axis);
    labelHelpOpen(axis,e);
    var selection = window.getSelection();
    selection.removeAllRanges();
    return false;
}

function matrixRightClick(e){
	e.preventDefault();
	labelHelpClose("Matrix");
    labelHelpOpen("Matrix",e);
    var selection = window.getSelection();
    selection.removeAllRanges();
    return false;
}

function labelIndexInSearch(index,axis){ // basically a Array.contains function, but for searchItems
	if (index == null || axis == null){
		return false;
	}
	if (searchItems[axis][index] == 1){
		return true;
	}else{
		return false;
	}
}


function getSearchLabelsByAxis(axis, labelType){
	var searchLabels;
	var keys = Object.keys(heatMap.getColClassificationConfig());
	var labels = axis == 'Row' ? heatMap.getRowLabels()["labels"] : axis == "Column" ? heatMap.getColLabels()['labels'] : 
		axis == "ColumnCovar" ? Object.keys(heatMap.getColClassificationConfig()) : axis == "ColumnCovar" ? Object.keys(heatMap.getRowClassificationConfig()) : 
			[heatMap.getRowLabels()["labels"], heatMap.getColLabels()['labels'] ];
	if (axis !== "Matrix"){
		searchLabels = [];
		for (var i in searchItems[axis]){
			if (axis.includes("Covar")){
				if (labelType == linkouts.VISIBLE_LABELS){
					searchLabels.push(labels[i].split("|")[0])
				}else if (labelType == linkouts.HIDDEN_LABELS){
					searchLabels.push(labels[i].split("|")[1])
				} else {
					searchLabels.push(labels[i])
				}
			} else {
				if (labelType == linkouts.VISIBLE_LABELS){
					searchLabels.push(labels[i-1].split("|")[0])
				}else if (labelType == linkouts.HIDDEN_LABELS){
					searchLabels.push(labels[i-1].split("|")[1])
				} else {
					searchLabels.push(labels[i-1])
				}
			}
		}
	} else {
		searchLabels = {"Row" : [], "Column" : []};
		for (var i in searchItems["Row"]){
			if (labelType == linkouts.VISIBLE_LABELS){
				searchLabels["Row"].push(labels[0][i-1].split("|")[0])
			}else if (labelType == linkouts.HIDDEN_LABELS){
				searchLabels["Row"].push(labels[0][i-1].split("|")[1])
			} else {
				searchLabels["Row"].push(labels[0][i-1])
			}
		}
		for (var i in searchItems["Column"]){
			if (labelType == linkouts.VISIBLE_LABELS){
				searchLabels["Column"].push(labels[1][i-1].split("|")[0])
			}else if (labelType == linkouts.HIDDEN_LABELS){
				searchLabels["Column"].push(labels[1][i-1].split("|")[1])
			} else {
				searchLabels["Column"].push(labels[1][i-1])
			}
		}
	}
	return searchLabels;
}

function detailDrawColClassBars(){
	var colClassBarConfig = heatMap.getColClassificationConfig();
	var colClassBarConfigOrder = heatMap.getColClassificationOrder();
	var colClassBarData = heatMap.getColClassificationData();
	var rowClassBarWidth = calculateTotalClassBarHeight("row");
	var fullWidth = detailDataViewWidth + rowClassBarWidth + detailDendroWidth;
	var mapHeight = detailDataViewHeight;
	var pos = fullWidth*mapHeight*BYTE_PER_RGBA;
	var colorMapMgr = heatMap.getColorMapManager();
	
	for (var i=colClassBarConfigOrder.length-1; i>= 0;i--) {
		var key = colClassBarConfigOrder[i];
		if (!colClassBarConfig.hasOwnProperty(key)) {
		    continue;
		  }
		var currentClassBar = colClassBarConfig[key];
		if (currentClassBar.show === 'Y') {
			var colorMap = colorMapMgr.getColorMap("col",key); // assign the proper color scheme...
			var classBarValues = colClassBarData[key].values;
			var classBarLength = getCurrentDetDataPerRow() * dataBoxWidth;
			pos += fullWidth*paddingHeight*BYTE_PER_RGBA; // draw padding between class bars
			var line = new Uint8Array(new ArrayBuffer(classBarLength * BYTE_PER_RGBA)); // save a copy of the class bar
			var loc = 0;
			for (var k = currentCol; k <= currentCol + getCurrentDetDataPerRow() -1; k++) { 
				var val = classBarValues[k-1];
				var color = colorMap.getClassificationColor(val);
				for (var j = 0; j < dataBoxWidth; j++) {
					line[loc] = color['r'];
					line[loc + 1] = color['g'];
					line[loc + 2] = color['b'];
					line[loc + 3] = color['a'];
					loc += BYTE_PER_RGBA;
				}
			}
			for (var j = 0; j < currentClassBar.height-paddingHeight; j++){ // draw the class bar into the dataBuffer
				pos += (rowClassBarWidth + detailDendroWidth + 1)*BYTE_PER_RGBA;
				for (var k = 0; k < line.length; k++) { 
					detTexPixels[pos] = line[k];
					pos++;
				}
				pos+=BYTE_PER_RGBA;
			}
		  }

	}

}

function detailDrawColClassBarLabels() {
	if (document.getElementById("missingDetColClassBars"))document.getElementById("missingDetColClassBars").remove();
	var scale =  detCanvas.clientHeight / (detailDataViewHeight + calculateTotalClassBarHeight("column")+detailDendroHeight);
	var colClassBarConfig = heatMap.getColClassificationConfig();
	var colClassBarConfigOrder = heatMap.getColClassificationOrder();
	var colClassLength = Object.keys(colClassBarConfig).length;
	if (colClassBarConfig != null && colClassLength > 0) {
		var fontSize = getLabelFontSize(colClassBarConfig,scale);
		if (fontSize > 7) {
			var xPos = detCanvas.clientWidth + 3;
			var startingPoint = detailDendroHeight*scale-2;
			var yPos = detailDendroHeight*scale;
			for (var i=0;i< colClassBarConfigOrder.length;i++) {
				var key = colClassBarConfigOrder[i];
				var currentClassBar = colClassBarConfig[key];
				if (currentClassBar.show === 'Y') {
					var currFont = Math.min((currentClassBar.height - paddingHeight) * scale, 11);
					if (currFont >= fontSize) {
						var yOffset = yPos - 1;
						//Reposition label to center of large-height bars
						if (currentClassBar.height >= 20) {
							yOffset += ((((currentClassBar.height/2) - (fontSize/2)) - 3) * scale);
						}
						addLabelDiv(labelElement, 'detail_col_class' + i, 'DynamicLabel ClassBar', key, xPos, yOffset, fontSize, 'F', i, "ColumnCovar");
					}
					yPos += (currentClassBar.height * scale);
				} else {
					if (!document.getElementById("missingDetColClassBars")){
						var x =  detCanvas.clientWidth+2;
						var y = detailDendroHeight*scale-13;
						addLabelDiv(labelElement, "missingDetColClassBars", "ClassBar MarkLabel", "...", x, y, 10, "F", null,"Column")
					}
					if (!document.getElementById("missingColClassBars")){
						var x =  detCanvas.clientWidth + 2;
						var y = columnDendroHeight*detCanvas.clientHeight/summaryTotalHeight - 10;
						addLabelDiv(document.getElementById('sumlabelDiv'), "missingColClassBars", "ClassBar MarkLabel", "...", x, y, 10, "F", null,"Column")
					}	
				}
			}	
		}
	}
}

/*********************************************************************************************
 * FUNCTION:  getLabelFontSize
 * 
 * This function searches for the minimum font size for all classification bars in a set 
 * (row/col) that have a size greater than 7.  Those <= 7 are ignored as they will have "..."
 * placed next to them as labels.
 *********************************************************************************************/
function getLabelFontSize(classBarConfig,scale) {
	var minFont = 999;
	for (key in classBarConfig) {
		var classBar = classBarConfig[key];
		var fontSize = Math.min(((classBar.height - paddingHeight) * scale) - 2, 10);
		if ((fontSize > 7) && (fontSize < minFont)) {
			minFont = fontSize
		}
	}
	return minFont;
}

function detailDrawRowClassBars(){
	var rowClassBarConfig = heatMap.getRowClassificationConfig();
	var rowClassBarConfigOrder = heatMap.getRowClassificationOrder();
	var rowClassBarData = heatMap.getRowClassificationData();
	var rowClassBarWidth = calculateTotalClassBarHeight("row");
	var detailTotalWidth = detailDendroWidth + calculateTotalClassBarHeight("row") + detailDataViewWidth;
	var offset = ((detailTotalWidth*detailDataViewBorder/2)+detailDendroWidth) * BYTE_PER_RGBA; // start position of very bottom dendro
	var mapWidth = detailDendroWidth + calculateTotalClassBarHeight("row") + detailDataViewWidth;
	var mapHeight = detailDataViewHeight;
	var colorMapMgr = heatMap.getColorMapManager();
	for (var i=0;i< rowClassBarConfigOrder.length;i++) {
		var key = rowClassBarConfigOrder[i];
		if (!rowClassBarConfig.hasOwnProperty(key)) {
		    continue;
		  }
		var currentClassBar = rowClassBarConfig[key];
		if (currentClassBar.show === 'Y') {
			var pos = offset; // move past the dendro and the other class bars...
			var colorMap = colorMapMgr.getColorMap("row",key); // assign the proper color scheme...
			var classBarValues = rowClassBarData[key].values;
			var classBarLength = classBarValues.length;
			for (var j = currentRow + getCurrentDetDataPerCol() - 1; j >= currentRow; j--){ // for each row shown in the detail panel
				var val = classBarValues[j-1];
				var color = colorMap.getClassificationColor(val);
				for (var boxRows = 0; boxRows < dataBoxHeight; boxRows++) { // draw this color to the proper height
					for (var k = 0; k < currentClassBar.height-paddingHeight; k++){ // draw this however thick it needs to be
						detTexPixels[pos] = color['r'];
						detTexPixels[pos + 1] = color['g'];
						detTexPixels[pos + 2] = color['b'];
						detTexPixels[pos + 3] = color['a'];
						pos+=BYTE_PER_RGBA;	// 4 bytes per color
					}
	
					// padding between class bars
					pos+=paddingHeight*BYTE_PER_RGBA;
					pos+=(mapWidth - currentClassBar.height)*BYTE_PER_RGBA;
				}
			}
			offset+= currentClassBar.height*BYTE_PER_RGBA;
		}
	}	
}

function detailDrawRowClassBarLabels() {
	var rowClassBarConfigOrder = heatMap.getRowClassificationOrder();
	if (document.getElementById("missingDetRowClassBars"))document.getElementById("missingDetRowClassBars").remove();
	var scale =  detCanvas.clientWidth / (detailDataViewWidth + calculateTotalClassBarHeight("row")+detailDendroWidth);
	var rowClassBarConfig = heatMap.getRowClassificationConfig();
	var rowClassLength = Object.keys(rowClassBarConfig).length;
	if (rowClassBarConfig != null && rowClassLength > 0) {
		var fontSize = getLabelFontSize(rowClassBarConfig,scale);
		var startingPoint = (detailDendroWidth*scale)+fontSize + 5;
		if (fontSize > 7) {
			for (var i=0;i< rowClassBarConfigOrder.length;i++) {
				var key = rowClassBarConfigOrder[i];
				var currentClassBar = rowClassBarConfig[rowClassBarConfigOrder[i]];
				var textLoc = (currentClassBar.height/2) - Math.floor(fontSize/2);
				var xPos = startingPoint+(textLoc*scale);
				var yPos = detCanvas.clientHeight + 4;
				if (currentClassBar.show === 'Y') {
					var currFont = Math.min((currentClassBar.height - paddingHeight) * scale, 11);
					if (currFont >= fontSize) {
						addLabelDiv(labelElement, 'detail_row_class' + i, 'DynamicLabel ClassBar', key, xPos, yPos, fontSize, 'T', i, "RowCovar");
					}
					yPos += (currentClassBar.height * scale);
				} else {
					if (!document.getElementById("missingDetRowClassBars")){
						var x = detailDendroWidth*scale + 10;
						var y = detCanvas.clientHeight+2;
						addLabelDiv(labelElement, "missingDetRowClassBars", "ClassBar MarkLabel", "...", x, y, 10, 'T', i, "Row");
					}
					if (!document.getElementById("missingRowClassBars")){
						var x = rowDendroHeight*detCanvas.clientWidth/summaryTotalWidth + 10;
						var y = detCanvas.clientHeight + 2;
						addLabelDiv(document.getElementById('sumlabelDiv'), "missingRowClassBars", "ClassBar MarkLabel", "...", x, y, 10, "T", null,"Row");
					}
				}
				startingPoint += (currentClassBar.height*scale);
			} 
		}	
	}
}

function calculateTotalClassBarHeight(axis){
	var totalHeight = 0;
	if (axis === "row") {
		var classBars = heatMap.getRowClassificationConfig();
	} else {
		var classBars = heatMap.getColClassificationConfig();
	}
	for (var key in classBars){
		if (classBars[key].show === 'Y') {
		   totalHeight += parseInt(classBars[key].height);
		}
	}
	return totalHeight;
}


/******************************************************
 *****  DETAIL DENDROGRAM FUNCTIONS START HERE!!! *****
 ******************************************************/

//Note: stop position passed in is actually one past the last row/column to be displayed.

function buildDetailDendroMatrix(axis, start, stop, heightRatio){
	var start3NIndex = convertMapIndexTo3NSpace(start);
	var stop3NIndex = convertMapIndexTo3NSpace(stop);
	var boxLength, currentIndex, matrixWidth, dendroBars, dendroInfo;
	
	var selectedBars;
	
	if (axis =='col'){ // assign proper axis-specific variables
		dendroInfo = heatMap.getColDendroData(); // dendro JSON object
		boxLength = dataBoxWidth;
		matrixWidth = detailDataViewWidth;
		dendroBars = summaryColumnDendro.getBars(); // array of the dendro bars
		selectedBars = summaryColumnDendro.getSelectedBars(); 
	} else {
		dendroInfo = heatMap.getRowDendroData(); // dendro JSON object
		boxLength = dataBoxHeight;
		matrixWidth = detailDataViewHeight;
		dendroBars = summaryRowDendro.getBars();
		selectedBars = summaryRowDendro.getSelectedBars();
	}
	var numNodes = dendroInfo.length;
	var lastRow = dendroInfo[numNodes-1];
	var matrix = new Array(normDetailDendroMatrixHeight+1);
	for (var i = 0; i < normDetailDendroMatrixHeight+1; i++){
		matrix[i] = new Array(matrixWidth-1);
	}
	var topLineArray = new Array(matrixWidth-1); // this array is made to keep track of which bars have vertical lines that extend outside the matrix
	var maxHeight = Number(lastRow.split(",")[2])/(heightRatio); // this assumes the heightData is ordered from lowest height to highest
	
	// check the left and right endpoints of each bar, and see if they are within the bounds.
	// then check if the bar is in the desired height. 
	// if it is, draw it in its entirety, otherwise, see if the bar has a vertical connection with any of the bars in view
	for (var i = 0; i < numNodes; i++){
		var bar = dendroInfo[i];
		var tokes = bar.split(",");
		var leftJsonIndex = Number(tokes[0]);
		var rightJsonIndex = Number(tokes[1]);
		var height = Number(tokes[2]);
		var left3NIndex = convertJsonIndexTo3NSpace(leftJsonIndex); // location in dendroBars space
		var right3NIndex = convertJsonIndexTo3NSpace(rightJsonIndex);
		if (right3NIndex < start3NIndex || stop3NIndex < left3NIndex){continue} //if the bar exists outside of the viewport, skip it
		
		var leftLoc = convertJsonIndexToDataViewSpace(leftJsonIndex); // Loc is the location in the dendro matrix
		var rightLoc = convertJsonIndexToDataViewSpace(rightJsonIndex);
		var normHeight = Math.round(normDetailDendroMatrixHeight*height/maxHeight); // height in matrix
		var leftEnd = Math.max(leftLoc, 0);
		var rightEnd = Math.min(rightLoc, matrixWidth-1);
		
		//  determine if the bar is within selection??
		var value = 1;
		if (selectedBars){
			for (var k = 0; k < selectedBars.length; k++){
				var selectedBar = selectedBars[k];
				if ((selectedBar.left <= left3NIndex && right3NIndex <= selectedBar.right) && height <= selectedBar.height)
				value = 2;
			}
		}
		if (height > maxHeight){ // if this line is beyond the viewport max height
			if (start3NIndex < right3NIndex &&  right3NIndex< stop3NIndex && topLineArray[rightLoc] != 1){ // check to see if it will be connecting vertically to a line in the matrix 
				var drawHeight = normDetailDendroMatrixHeight;
				while (drawHeight > 0 && !matrix[drawHeight][rightLoc]){ // these are the lines that will be connected to the highest level dendro leaves
					matrix[drawHeight][rightLoc] = value;
					drawHeight--;
				}
			}
			if (start3NIndex < left3NIndex &&  left3NIndex< stop3NIndex && topLineArray[leftLoc] != 1){// these are the lines that will be connected to the highest level dendro leaves
				var drawHeight = normDetailDendroMatrixHeight;
				while (drawHeight > 0 && !matrix[drawHeight][leftLoc]){
					matrix[drawHeight][leftLoc] = value;
					drawHeight--;
				}
			}
			for (var loc = leftEnd; loc < rightEnd; loc++){
				topLineArray[loc] = 1; // mark that the area covered by this bar can no longer be drawn in  by another, higher level bar
			}
		} else {
			for (var j = leftEnd; j < rightEnd; j++){ // draw horizontal lines
				matrix[normHeight][j] = value;
			}
			var drawHeight = normHeight-1;
			while (drawHeight > 0 && !matrix[drawHeight][leftLoc] && leftLoc > 0){	// draw left vertical line
				matrix[drawHeight][leftLoc] = value;
				drawHeight--;
			}
			drawHeight = normHeight;
			while (!matrix[drawHeight][rightLoc] && drawHeight > 0 && rightLoc < matrixWidth-1){ // draw right vertical line
				matrix[drawHeight][rightLoc] = value;
				drawHeight--;
			}
		}
	}
	
	// fill in any missing leaves but only if the viewport is zoomed in far enough to tell.
	if (stop - start < 100){
		var numLeafsDrawn = 0;
		for (var j in matrix[1]){numLeafsDrawn++}
		var pos = Math.round(boxLength/2);
		if (numLeafsDrawn < stop-start){ // have enough lines been drawn?
			for (var i = 0; i < stop-start; i++){
				var height = 1;
				if (matrix[height][pos] != 1){
					while (height < normDetailDendroMatrixHeight+1){
						matrix[height][pos] = 1;
						height++;
					}
				}
				pos += boxLength;
			}
		}
	}
	
	return matrix;
	
	// HELPER FUNCTIONS
	function convertMapIndexTo3NSpace(index){
		return index*pointsPerLeaf - 2;
	}
	function convertJsonIndexTo3NSpace(index){
		if (index < 0){
			index = 0-index; // make index a positive number to find the leaf
			return index*pointsPerLeaf - 2;
		} else {
			index--; // dendroBars is stored in 3N, so we convert back
			return Math.round((dendroBars[index].left + dendroBars[index].right)/2); // gets the middle point of the bar
		}
	}
	function convertJsonIndexToDataViewSpace(index){
		if (index < 0){
			index = 0-index; // make index a positive number to find the leaf
			return (index - start)*boxLength+ Math.round(boxLength/2)
		} else {
			index--; // dendroBars is stored in 3N, so we convert back
			var normDistance = (Math.round((dendroBars[index].left+ dendroBars[index].right)/2)-start3NIndex) / (stop3NIndex-start3NIndex); // gets the middle point of the bar
			return Math.round(normDistance*matrixWidth);
		}
	}
}

function colDendroMatrixCoordToDetailTexturePos(matrixRow,matrixCol){ // convert the matrix coord to the data buffer position (start of the RGBA block)
	var mapx = matrixCol*getSamplingRatio('row');
	var mapy = Math.round(matrixRow/normDetailDendroMatrixHeight * (detailDendroHeight-1));
	var detailTotalWidth = detailDendroWidth + calculateTotalClassBarHeight("row") + detailDataViewWidth;
	var pos = (detailTotalWidth*(calculateTotalClassBarHeight("column") + detailDataViewHeight))*BYTE_PER_RGBA;
	pos += (detailDendroWidth + calculateTotalClassBarHeight("row")-1)*BYTE_PER_RGBA;
	pos += ((mapy)*detailTotalWidth)*BYTE_PER_RGBA + matrixCol*BYTE_PER_RGBA;
	return pos;
}

function rowDendroMatrixCoordToDetailTexturePos(matrixRow,matrixCol){ // convert matrix coord to data buffer position (leftmost column of matrix corresponds to the top row of the map)
	var mapx = detailDataViewHeight - matrixCol-detailDataViewBorder/2;
	var mapy = detailDendroWidth - Math.round(matrixRow/normDetailDendroMatrixHeight * detailDendroWidth); // bottom most row of matrix is at the far-right of the map dendrogram 
	var detailTotalWidth = detailDendroWidth + calculateTotalClassBarHeight("row") + detailDataViewWidth;
	var pos = (mapx*detailTotalWidth)*BYTE_PER_RGBA + (mapy)*BYTE_PER_RGBA; // pass the empty space (if any) and the border width, to get to the height on the map
	return pos;
}

function detailDrawColDendrogram(dataBuffer, shift){
	var detailTotalWidth = detailDendroWidth + calculateTotalClassBarHeight("row") + detailDataViewWidth;
	shift = !shift || isNaN(shift) ? 0 : shift;
	for (var i = 0; i < colDetailDendroMatrix.length; i++){
		var line = colDetailDendroMatrix[i]; // line = each row of the col dendro matrix
		for (var j in line){
			var pos = colDendroMatrixCoordToDetailTexturePos(i,Number(j));// + shift*BYTE_PER_RGBA;
			if (j > detailDataViewWidth){ // TODO: find out why some rows in the dendro matrix are longer than they should be
				continue;
			}else {
				if (colDetailDendroMatrix[i][j] == 1)
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
				else if (colDetailDendroMatrix[i][j] == 2) {
					var posB = pos-4;
					dataBuffer[posB] = 3,dataBuffer[posB+1] = 3,dataBuffer[posB+2] = 3,dataBuffer[posB+3] = 255;
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
					posB = pos+4;
					dataBuffer[posB] = 3,dataBuffer[posB+1] = 3,dataBuffer[posB+2] = 3,dataBuffer[posB+3] = 255;
				}
				//	dataBuffer[pos] = 3,dataBuffer[pos+1] = 255,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
				// if the dendro size has been changed in preferences, make sure the pixels above and below are filled in
				if (heatMap.getColDendroConfig().height/100 > 1.5 && colDetailDendroMatrix[i+1] && colDetailDendroMatrix[i+1][j] && colDetailDendroMatrix[i-1][j]){
					pos -= (detailDendroWidth + calculateTotalClassBarHeight("row") + detailDataViewWidth)*BYTE_PER_RGBA;
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
					pos += (detailDendroWidth + calculateTotalClassBarHeight("row") + detailDataViewWidth)*2*BYTE_PER_RGBA;
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
				}
			}
		}
	}
}

function drawDetMap(){ // draw the green dots *** is this a debug function? ***
	
	det_gl.activeTexture(det_gl.TEXTURE0);
	det_gl.texImage2D(
			det_gl.TEXTURE_2D, 
			0, 
			det_gl.RGBA, 
			detTextureParams['width'], 
			detTextureParams['height'], 
			0, 
			det_gl.RGBA,
			det_gl.UNSIGNED_BYTE, 
			detTexPixels);
	det_gl.uniform2fv(detUScale, detCanvasScaleArray);
	det_gl.uniform2fv(detUTranslate, detCanvasTranslateArray);
	det_gl.drawArrays(det_gl.TRIANGLE_STRIP, 0, det_gl.buffer.numItems);
}

function detailDrawRowDendrogram(dataBuffer){
	var selectionColor = "#000000";
	for (var i = 0; i <= rowDetailDendroMatrix.length+1; i++){
		var line = rowDetailDendroMatrix[i]; // line = each row of the col dendro matrix
		for (var j  in line){
			var pos = rowDendroMatrixCoordToDetailTexturePos(i,Number(j));
			if (j > detailDataViewHeight){ // TODO: find out why some rows in the dendro matrix are longer than they should be
				continue;
			} else {
				if (rowDetailDendroMatrix[i][j] == 1)
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
				else if (rowDetailDendroMatrix[i][j] == 2) {
					var posB = pos-4;
					dataBuffer[posB] = 3,dataBuffer[posB+1] = 3,dataBuffer[posB+2] = 3,dataBuffer[posB+3] = 255;
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
					posB = pos+4;
					dataBuffer[posB] = 3,dataBuffer[posB+1] = 3,dataBuffer[posB+2] = 3,dataBuffer[posB+3] = 255;
				}
//					dataBuffer[pos] = 3,dataBuffer[pos+1] = 255,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
				// this prevents gaps from appearing in the dendro when the user scales the dendro beyond 150%
				if (heatMap.getRowDendroConfig().height/100 > 1.5 && rowDetailDendroMatrix[i+1] && rowDetailDendroMatrix[i+1][j] && rowDetailDendroMatrix[i-1][j]){
					pos -= BYTE_PER_RGBA;
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
					pos += 2*BYTE_PER_RGBA;
					dataBuffer[pos] = 3,dataBuffer[pos+1] = 3,dataBuffer[pos+2] = 3,dataBuffer[pos+3] = 255;
				}
			}
		}
	}
}

function clearDetailDendrograms(){
	var rowClassWidth = calculateTotalClassBarHeight('row');
	var detailFullWidth = detailDendroWidth + rowClassWidth  + detailDataViewWidth;
	var pos = 0;
	// clear the row dendro pixels
	for (var i =0; i < detailDataViewHeight*BYTE_PER_RGBA; i++){
		for (var j = 0; j < detailDendroWidth*BYTE_PER_RGBA; j++){
			detTexPixels[pos] = 0;
			pos++;
		};
		pos += ( detailDataViewWidth + rowClassWidth)*BYTE_PER_RGBA;
	}
	//clear the column dendro pixels
	pos = (detailFullWidth) * (detailDataViewHeight + calculateTotalClassBarHeight("column")) * BYTE_PER_RGBA;
	for (var i =0; i < detailDendroHeight; i++){
		for (var j = 0; j < detailFullWidth*BYTE_PER_RGBA; j++){
			detTexPixels[pos] = 0;
			pos++;
		}
	}
}

function getSamplingRatio(axis){
	if (axis == 'row'){
		switch (mode){
			case 'RIBBONH': return heatMap.getRowSummaryRatio(MatrixManager.RIBBON_HOR_LEVEL);
			case 'RIBBONV': return heatMap.getRowSummaryRatio(MatrixManager.RIBBON_VERT_LEVEL);
			default:        return heatMap.getRowSummaryRatio(MatrixManager.DETAIL_LEVEL);
		}
	} else {
		switch (mode){
			case 'RIBBONH': return heatMap.getColSummaryRatio(MatrixManager.RIBBON_HOR_LEVEL);
			case 'RIBBONV': return heatMap.getColSummaryRatio(MatrixManager.RIBBON_VERT_LEVEL);
			default:        return  heatMap.getColSummaryRatio(MatrixManager.DETAIL_LEVEL);
		}
	}
}

/****************************************************
 *****  DETAIL DENDROGRAM FUNCTIONS END HERE!!! *****
 ****************************************************/


//WebGL stuff

function detSetupGl() {
	det_gl = detCanvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
	det_gl.viewportWidth = detailDataViewWidth+calculateTotalClassBarHeight("row")+detailDendroWidth;
	det_gl.viewportHeight = detailDataViewHeight+calculateTotalClassBarHeight("column")+detailDendroHeight;
	det_gl.clearColor(1, 1, 1, 1);

	var program = det_gl.createProgram();
	var vertexShader = getDetVertexShader(det_gl);
	var fragmentShader = getDetFragmentShader(det_gl);
	det_gl.program = program;
	det_gl.attachShader(program, vertexShader);
	det_gl.attachShader(program, fragmentShader);
	det_gl.linkProgram(program);
	det_gl.useProgram(program);
}


function getDetVertexShader(theGL) {
	var source = 'attribute vec2 position;    ' +
		         'varying vec2 v_texPosition; ' +
		         'uniform vec2 u_translate;   ' +
		         'uniform vec2 u_scale;       ' +
		         'void main () {              ' +
		         '  vec2 scaledPosition = position * u_scale;               ' +
		         '  vec2 translatedPosition = scaledPosition + u_translate; ' +
		         '  gl_Position = vec4(translatedPosition, 0, 1);           ' +
		         '  v_texPosition = position * 0.5 + 0.5;                   ' +
		         '}';


	var shader = theGL.createShader(theGL.VERTEX_SHADER);
	theGL.shaderSource(shader, source);
	theGL.compileShader(shader);
	if (!theGL.getShaderParameter(shader, theGL.COMPILE_STATUS)) {
        alert(theGL.getShaderInfoLog(shader));
    }

	return shader;
}


function getDetFragmentShader(theGL) {
	var source = 'precision mediump float;        ' +
		  		 'varying vec2 v_texPosition;     ' +
 		 		 'varying float v_boxFlag;        ' +
 		 		 'uniform sampler2D u_texture;    ' +
 		 		 'void main () {                  ' +
 		 		 '	  gl_FragColor = texture2D(u_texture, v_texPosition); ' +
 		 		 '}'; 


	var shader = theGL.createShader(theGL.FRAGMENT_SHADER);;
	theGL.shaderSource(shader, source);
	theGL.compileShader(shader);
	if (!theGL.getShaderParameter(shader, theGL.COMPILE_STATUS)) {
        alert(theGL.getShaderInfoLog(shader));
    }

	return shader;
}



function detInitGl () {
	det_gl.viewport(0, 0, det_gl.viewportWidth, det_gl.viewportHeight);
	det_gl.clear(det_gl.COLOR_BUFFER_BIT);

	// Vertices
	var buffer = det_gl.createBuffer();
	det_gl.buffer = buffer;
	det_gl.bindBuffer(det_gl.ARRAY_BUFFER, buffer);
	var vertices = [ -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, 1 ];
	det_gl.bufferData(det_gl.ARRAY_BUFFER, new Float32Array(vertices), det_gl.STATIC_DRAW);
	var byte_per_vertex = Float32Array.BYTES_PER_ELEMENT;
	var component_per_vertex = 2;
	buffer.numItems = vertices.length / component_per_vertex;
	var stride = component_per_vertex * byte_per_vertex;
	var program = det_gl.program;
	var position = det_gl.getAttribLocation(program, 'position');
	detUScale = det_gl.getUniformLocation(program, 'u_scale');
	detUTranslate = det_gl.getUniformLocation(program, 'u_translate');
	det_gl.enableVertexAttribArray(position);
	det_gl.vertexAttribPointer(position, 2, det_gl.FLOAT, false, stride, 0);

	// Texture
	var texture = det_gl.createTexture();
	det_gl.bindTexture(det_gl.TEXTURE_2D, texture);
	det_gl.texParameteri(
			det_gl.TEXTURE_2D, 
			det_gl.TEXTURE_WRAP_S, 
			det_gl.CLAMP_TO_EDGE);
	det_gl.texParameteri(
			det_gl.TEXTURE_2D, 
			det_gl.TEXTURE_WRAP_T, 
			det_gl.CLAMP_TO_EDGE);
	det_gl.texParameteri(
			det_gl.TEXTURE_2D, 
			det_gl.TEXTURE_MIN_FILTER,
			det_gl.NEAREST);
	det_gl.texParameteri(
			det_gl.TEXTURE_2D, 
			det_gl.TEXTURE_MAG_FILTER, 
			det_gl.NEAREST);
	
	detTextureParams = {};

	var texWidth = null, texHeight = null, texData;
	texWidth = detailDataViewWidth + calculateTotalClassBarHeight("row")+detailDendroWidth;
	texHeight = detailDataViewHeight + calculateTotalClassBarHeight("column")+detailDendroHeight;
	texData = new ArrayBuffer(texWidth * texHeight * 4);
	detTexPixels = new Uint8Array(texData);
	detTextureParams['width'] = texWidth;
	detTextureParams['height'] = texHeight; 
	
}
/*  Disabled until we decide to add a toggle button.
 *  when we do we will need to use the grid_show
 *  parameter on the DataLayer
function toggleGrid(){
	detailGrid = !detailGrid;
	drawDetailHeatMap();
}
*/

function detSizerStart(){
	userHelpClose();
	document.addEventListener('mousemove', detSizerMove);
	document.addEventListener('touchmove', detSizerMove);
	document.addEventListener('mouseup', detSizerEnd);
	document.addEventListener('touchend',detSizerEnd);
}
function detSizerMove(e){
	var summary = document.getElementById('summary_chm');
	var detail = document.getElementById('detail_chm');
	var divider = document.getElementById('divider');
	var detSizer = document.getElementById('detSizer');
	if (e.touches){
    	if (e.touches.length > 1){
    		return;
    	}
    }
	var Xmove = e.touches ? detSizer.getBoundingClientRect().right - e.touches[0].pageX : detSizer.getBoundingClientRect().right - e.pageX;
	var Ymove = e.touches ? detSizer.getBoundingClientRect().bottom - e.touches[0].pageY : detSizer.getBoundingClientRect().bottom - e.pageY;
	var detailX = detail.offsetWidth - Xmove;
	var detailY = detail.offsetHeight - Ymove;
	if (e.clientX > window.innerWidth || e.clientY > window.innerHeight){
		return;
	}
	if (!(detail.getBoundingClientRect().right > container.clientLeft+container.clientWidth && Xmove < 0)){
		detail.style.width=detailX+'px';
	}
	
	detail.style.height=detailY+'px';
//	if (!isSub){
//		summary.style.height=detailY+'px';
//		setSummarySize();
//		summaryColumnDendro.resize();
//		summaryRowDendro.resize();
//	}
	divider.style.height=Math.max(document.getElementById('detail_canvas').offsetHeight,document.getElementById('summary_canvas').offsetHeight + summaryColumnDendro.getDivHeight())+'px';
	clearLabels();
	clearSelectionMarks();
}
function detSizerEnd(){
	document.removeEventListener('mousemove', detSizerMove);
	document.removeEventListener('mouseup', detSizerEnd);
	document.removeEventListener('touchmove',detSizerMove);
	document.removeEventListener('touchend',detSizerEnd);
	// set summary and detail canvas sizes to percentages to avoid map getting pushed down on resize
	var container = document.getElementById('container');
	var summary = document.getElementById('summary_chm');
	var sumPercent = 100*summary.clientWidth / container.clientWidth;
	summary.style.width = sumPercent + "%";
	var detail = document.getElementById('detail_chm');
	var detPercent = 100*detail.clientWidth/container.clientWidth;
	detail.style.width = detPercent + "%";
	if (!isSub){
		summaryResize();
	}
	detailResize();
}

