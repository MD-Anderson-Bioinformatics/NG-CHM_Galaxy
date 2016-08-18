/******************************
 *  SUMMARY COLUMN DENDROGRAM *
 ******************************/
function SummaryColumnDendrogram(){
	var normDendroMatrixHeight = 500; // this is the height of the dendro matrices created in buildDendroMatrix
	var pointsPerLeaf = 3; // each leaf will get 3 points in the dendrogram array. This is to avoid lines being right next to each other
	
	var bars = [];
	var chosenBar = {}; // this is the bar that is clicked on the summary side (Subdendro selection)
	var dendroCanvas = document.getElementById('column_dendro_canvas');
	var dendroConfig = heatMap.getColDendroConfig();
	var dendroData = heatMap.getColDendroData();
	var maxHeight = Number(dendroData[dendroData.length-1].split(",")[2]); // this assumes the heightData is ordered from lowest height to highest
	
	var dendroMatrix = buildMatrix();
	var originalDendroMatrix = dendroMatrix;
	var selectedBars = []; // these are the bars/areas that are selected from the detail side
	
	var sumChm = document.getElementById("summary_chm");
	
	dendroCanvas.addEventListener('click',subDendroClick);
	
	this.getDivWidth = function(){
		return parseInt(dendroCanvas.clientWidth);
	}
	this.getDivHeight = function(){
		return parseInt(dendroConfig.height)/500*sumChm.clientHeight*summaryHeightPercentage;
	}
	this.getBars = function(){
		return bars;
	}
	
	this.addSelectedBar = function(left,right, matrixY, shift){
		var height = matrixY/dendroMatrix.length*maxHeight;
		var addBar = true;
		var selectedBar = {"left":left,"right":right,"height":height};
		for (var i in selectedBars){
			var bar = selectedBars[i];
			if (bar.left >= selectedBar.left && bar.right <= selectedBar.right && bar.height <= selectedBar.height){
				selectedBars.splice(i,1);
				var selectLeft = Math.round((left+2)/3);
				var selectRight =Math.round((right+2)/3);
				for (var j = selectLeft; j < selectRight+1;j++){
					delete searchItems["Column"][j];
				}
				clearSelectionMarks();
				drawColSelectionMarks();
				drawRowSelectionMarks();
				if (bar.left == selectedBar.left && bar.right == selectedBar.right && bar.height == selectedBar.height){
					addBar = false;
				}
			}
		}
		
		var selectLeft = Math.round((left+2)/3);
		var selectRight = Math.round((right+2)/3);
		if (addBar){
			if (shift){
				for (var i = selectLeft; i < selectRight+1;i++){
					searchItems["Column"][i] = 1;
				}
				
				selectedBars.push(selectedBar);
			} else {
				clearSearchItems("Column");
				for (var i = selectLeft; i < selectRight+1;i++){
					searchItems["Column"][i] = 1;
				}
				
				selectedBars = [selectedBar];
			}
		}
	}
	
	this.getSelectedBars = function(){
		return selectedBars;
	}
	
	this.clearSelectedBars = function(){
		selectedBars = [];
	}
	
	this.rebuildMatrix = function(){
		dendroMatrix = buildMatrix();
	}
	
	this.findExtremes = function(i,j){
		return findExtremes(i,j,dendroMatrix);
	}
	
	this.resize = function(){
		resize();
	}

	this.draw = function(){
		resize();
		dendroCanvas.width = canvas.clientWidth*summaryMatrixWidth/summaryTotalWidth;
		dendroCanvas.height = parseInt(dendroConfig.height)/500 * sumChm.clientHeight*summaryHeightPercentage;
		draw();
	}
	this.clearSelection = function(){
		clearSelection();
	}
	
	function subDendroClick(event){
		var clickX = event.offsetX, clickY = this.height-event.offsetY;
		var matrixX = Math.round(clickX/(this.width/dendroMatrix[0].length)), matrixY = Math.round(clickY/(this.height/dendroMatrix.length));
		summaryRowDendro.clearSelection();
		summaryColumnDendro.clearSelection();
		dendroMatrix = buildMatrix();
		highlightMatrix(matrixY,matrixX);
		summaryRowDendro.draw();
		summaryColumnDendro.draw();
	}
	
	function clearSelection(){
		chosenBar = {};
		selectedStart = 0;
		selectedStop = 0;
		if (!isSub) {
			dendroBoxLeftTopArray = new Float32Array([0, 0]);
			dendroBoxRightBottomArray = new Float32Array([0, 0]);
			if (heatMap.showColDendrogram("summary")) {
				dendroMatrix = buildMatrix();
			}
		}
	}
	function resize(){
		dendroCanvas.style.width = canvas.clientWidth*summaryMatrixWidth/summaryTotalWidth;
		dendroCanvas.style.left = canvas.offsetLeft + (1-summaryMatrixWidth/summaryTotalWidth)*canvas.offsetWidth;
		if (dendroConfig.show !== "NONE"){
			dendroCanvas.style.height = parseInt(dendroConfig.height)/500*sumChm.clientHeight*summaryHeightPercentage; // the dendro should take 1/5 of the height at 100% dendro height
		}else{
			dendroCanvas.style.height = 0;
		}
	}
	
	function draw(){
		var xRatio = dendroCanvas.width/dendroMatrix[0].length;
		var yRatio = dendroCanvas.height/dendroMatrix.length;
		var colgl = dendroCanvas.getContext("2d");
		for (var i=0; i<dendroMatrix.length; i++){
			// draw the non-highlighted regions
			colgl.fillStyle = "black";
			for (var j in dendroMatrix[i]){
				j = parseInt(j);
				// x,y,w,h
				var x = Math.floor(j*xRatio), y = Math.floor((dendroMatrix.length-i)*yRatio);
				if (dendroMatrix[i][j] == 1){colgl.fillRect(x,y,1,1);}
				if (xRatio >= 1 && dendroMatrix[i][j+1] == 1){ // this is to fill the spaces between each point on the horizontal bars
					var fill = 1;
					while(fill<xRatio){colgl.fillRect(x+fill,y,1,1),fill++;}
				}
			}
			// draw the highlighted area
			//colgl.fillStyle = "rgba(3,255,3,1)";
			for (var j in dendroMatrix[i]){
				j = parseInt(j);
				// x,y,w,h
				var x = Math.floor(j*xRatio), y = Math.floor((dendroMatrix.length-i)*yRatio);
				if (dendroMatrix[i][j] == 2){colgl.fillRect(x,y,2,2);} 
				if (xRatio >= 1 && dendroMatrix[i][j+1] == 2){
					var fill = 1;
					while(fill<xRatio){colgl.fillRect(x+fill,y,2,2),fill++;}
				}
			}
		}
	}
	
	
	function buildMatrix(){
		bars = []; // clear out the bars array otherwise it will add more and more bars and slow everything down!
		var numNodes = dendroData.length;
		var matrix = new Array(normDendroMatrixHeight+1);
		for (var i = 0; i < normDendroMatrixHeight+1; i++){ // 500rows * (3xWidth)cols matrix
			matrix[i] = new Array(pointsPerLeaf*heatMap.getNumColumns('d'));
		}
		for (var i = 0; i < numNodes; i++){
			var tokes = dendroData[i].split(",");
			var leftIndex = Number(tokes[0]); // index is the location of the bar in the clustered data
			var rightIndex = Number(tokes[1]);
			var height = Number(tokes[2]);
			var leftLoc = findLocationFromIndex(leftIndex); // this is the position it occupies in the dendroMatrix space
			var rightLoc = findLocationFromIndex(rightIndex);
			var normHeight = Math.round(normDendroMatrixHeight*height/maxHeight);
			bars.push({"left":leftLoc, "right":rightLoc, "height":normHeight});
			for (var j = leftLoc; j < rightLoc; j++){
				matrix[normHeight][j] = 1;
			}
			var drawHeight = normHeight-1;
			while (drawHeight > 0 && matrix[drawHeight][leftLoc] != 1){	// this fills in any spaces 		
				matrix[drawHeight][leftLoc] = 1;
				drawHeight--;
			}
			drawHeight = normHeight;
			while (matrix[drawHeight][rightLoc] != 1 && drawHeight > 0){			
				matrix[drawHeight][rightLoc] = 1;
				drawHeight--;
			}
		}
		return matrix;
		
		// returns the position in terms of the 3N space
		function findLocationFromIndex(index){
			if (index < 0){
				index = 0-index; // make index a positive number to find the leaf
				return pointsPerLeaf*index-2; // all leafs should occupy the middle space of the 3 points available
			} else {
				index--;
				return Math.round((bars[index].left + bars[index].right)/2); // gets the middle point of the bar
			}
		}
	}
	
	function highlightMatrix(i,j){
		var leftExtreme, rightExtreme;
		var ip = i, id = i;
		while (dendroMatrix[id][j]==undefined && dendroMatrix[ip][j]==undefined){ id--,ip++;}
		if (dendroMatrix[id][j]!=undefined){
			i = id;
		} else {
			i = ip;
		}
		var leftAndRightExtremes = exploreToEndOfBar(i,j,dendroMatrix); // find the endpoints of the highest level node
		var thisBar = {height:i, left: leftAndRightExtremes[0], right: leftAndRightExtremes[1]};
		var sameBarClicked = true;
		for (var key in thisBar){ 
			if (thisBar[key] != chosenBar[key]){
				sameBarClicked = false;
			}
		}
		leftExtreme = leftAndRightExtremes[0], rightExtreme = leftAndRightExtremes[1];
		if (!sameBarClicked){ // new bar clicked
			chosenBar = {height:i, left: leftExtreme, right: rightExtreme};
			leftExtreme = findLeftEnd(i,leftExtreme,dendroMatrix);
			rightExtreme = findRightEnd(i,rightExtreme,dendroMatrix); // L and R extreme values are in dendro matrix coords right now
			highlightAllBranchesInRange(i,leftExtreme,rightExtreme,dendroMatrix);
			leftExtreme = getTranslatedLocation(leftExtreme); // L and R extreme values gets converted to heatmap locations
			rightExtreme = getTranslatedLocation(rightExtreme);
									
			
			// Set start and stop coordinates
			var rhRatio = heatMap.getColSummaryRatio(MatrixManager.RIBBON_HOR_LEVEL);
			var summaryRatio = heatMap.getRowSummaryRatio(MatrixManager.SUMMARY_LEVEL);
			selectedStart = Math.round(leftExtreme*summaryRatio) +1;
			selectedStop = Math.round(rightExtreme*summaryRatio) +1;
			clearSearchItems("Column");
			drawColSelectionMarks();
			changeMode('RIBBONH');
		} else { // same bar clicked
			chosenBar = {};
			clearSelectionMarks();
			clearSearchItems("Column");
			drawColSelectionMarks();
			if (getSearchLabelsByAxis("Column").length == 0){
				clearSearch();
			}
			selectedStart = 0;
			selectedStop = 0;
			changeMode('NORMAL');
		}
	}
}




/***************************
 *  SUMMARY ROW DENDROGRAM *
 ***************************/
function SummaryRowDendrogram(){
	// internal variables
	var normDendroMatrixHeight = 500; // this is the height of the dendro matrices created in buildMatrix
	var pointsPerLeaf = 3; // each leaf will get 3 points in the dendrogram array. This is to avoid lines being right next to each other
	
	var bars = [];
	var chosenBar = {};
	var dendroCanvas = document.getElementById('row_dendro_canvas');
	var dendroConfig = heatMap.getRowDendroConfig();
	var dendroData = heatMap.getRowDendroData();
	var maxHeight = Number(dendroData[dendroData.length-1].split(",")[2]); // this assumes the heightData is ordered from lowest height to highest
	
	var dendroMatrix = buildMatrix();
	var originalDendroMatrix = dendroMatrix;
	var selectedBars;
	var sumChm = document.getElementById("summary_chm");
	
	// event listeners
	dendroCanvas.addEventListener('click',subDendroClick);
	
	
	// public functions
	this.getDivWidth = function(){
		// the dendrogram will take up 1/5 of the summary side by default (100% = 1/5 of summary_chm).
		return parseInt(dendroConfig.height)/500*sumChm.clientWidth;
	}
	this.getDivHeight = function(){
		return parseInt(dendroCanvas.clientHeight);
	}
	this.getBars = function(){
		return bars;
	}
	
	this.addSelectedBar = function(left,right, matrixY, shift){		
		var height = matrixY/dendroMatrix.length*maxHeight;
		var addBar = true;
		var selectedBar = {"left":left,"right":right,"height":height};
		for (var i in selectedBars){
			var bar = selectedBars[i];
			if (bar.left >= selectedBar.left && bar.right <= selectedBar.right && bar.height <= selectedBar.height){
				selectedBars.splice(i,1);
				var selectLeft = Math.round((left+2)/3);
				var selectRight =Math.round((right+2)/3);
				for (var j = selectLeft; j < selectRight+1;j++){
					delete searchItems["Row"][j];
				}
				clearSelectionMarks();
				drawColSelectionMarks();
				drawRowSelectionMarks();
				if (bar.left == selectedBar.left && bar.right == selectedBar.right && bar.height == selectedBar.height){
					addBar = false;		
				}
			}
		}
		
		var selectLeft = Math.round((left+2)/3);
		var selectRight = Math.round((right+2)/3);
		if (addBar){
			if (shift){
				for (var i = selectLeft; i < selectRight+1;i++){
					searchItems["Row"][i] = 1;
				}
				
				selectedBars.push(selectedBar);
			} else {
				clearSearchItems("Row");
				for (var i = selectLeft; i < selectRight+1;i++){
					searchItems["Row"][i] = 1;
				}
				
				selectedBars = [selectedBar];
			}
		}
	}
	
	this.getSelectedBars = function(){
		return selectedBars;
	}	
	
	this.clearSelectedBars = function(){
		selectedBars = [];
	}
	
	this.rebuildMatrix = function(){
		dendroMatrix = buildMatrix();
	}
	this.resize = function(){
		resize();
	}
	
	this.findExtremes = function(i,j){
		return findExtremes(i,j,dendroMatrix);
	}
	
	this.draw = function(){
		resize();
		dendroCanvas.height = canvas.clientHeight*summaryMatrixHeight/summaryTotalHeight;
		dendroCanvas.width = dendroConfig.height/500*sumChm.clientWidth*summaryWidthPercentage;
		draw();
	}
	this.clearSelection = function(){
		clearSelection();
	}
	
	// internal functions
	function subDendroClick(event){
		var clickX = event.offsetX, clickY = event.offsetY;
		var matrixX = Math.round(clickY/(this.height/dendroMatrix[0].length)), matrixY = Math.round((this.width-clickX)/(this.width/dendroMatrix.length));
		summaryColumnDendro.clearSelection();
		summaryRowDendro.clearSelection();
		dendroMatrix = buildMatrix();
		highlightMatrix(matrixY,matrixX);
		summaryRowDendro.draw();
		summaryColumnDendro.draw();
	}
	function clearSelection(){
		chosenBar = {};
		selectedStart = 0;
		selectedStop = 0;
		if (!isSub) {
			dendroBoxLeftTopArray = new Float32Array([0, 0]);
			dendroBoxRightBottomArray = new Float32Array([0, 0]);
			if (heatMap.showRowDendrogram("summary")) {
				dendroMatrix = buildMatrix();
			}
		}
	}
	
	function resize(){
		dendroCanvas.style.height = canvas.clientHeight*summaryMatrixHeight/summaryTotalHeight;
		dendroCanvas.style.top = canvas.offsetTop + (summaryTotalHeight - summaryMatrixHeight)/summaryTotalHeight*canvas.offsetHeight;
		if (dendroConfig.show !== "NONE"){
			dendroCanvas.style.width = dendroConfig.height/500*sumChm.clientWidth*summaryWidthPercentage;
		} else {
			dendroCanvas.style.width = 0;
		}
	}
	
	function draw(){
		var xRatio = dendroCanvas.width/dendroMatrix.length;
		var yRatio = dendroCanvas.height/dendroMatrix[0].length;
		var rowgl = dendroCanvas.getContext("2d");
		for (var i=0; i<dendroMatrix.length; i++){
			// draw the non-highlighted regions
			rowgl.fillStyle = "black";
			for (var j in dendroMatrix[i]){
				j = parseInt(j);
				// x,y,w,h
				var x = Math.floor((dendroMatrix.length-i)*xRatio), y = Math.floor(j*yRatio);
				if (dendroMatrix[i][j] == 1){rowgl.fillRect(x,y,1,1);}
				if (yRatio >= 1 && dendroMatrix[i][j+1] == 1){
					var fill = 1;
					while(fill<yRatio){rowgl.fillRect(x,y+fill,1,1),fill++;}
				}
			}
			// draw the highlighted area
		//	rowgl.fillStyle = "rgba(3,255,3,1)";
			for (var j in dendroMatrix[i]){
				j = parseInt(j);
				// x,y,w,h
				var x = Math.floor((dendroMatrix.length-i)*xRatio), y = Math.floor(j*yRatio);
				if (dendroMatrix[i][j] == 2){rowgl.fillRect(x,y,2,2);}
				if (yRatio >= 1 && dendroMatrix[i][j+1] == 2){
					var fill = 1;
					while(fill<yRatio){rowgl.fillRect(x,y+fill,2,2),fill++;}
				}
			}
		}
	}
	
	function buildMatrix(){
		bars = []; // clear out the bars array otherwise it will add more and more bars and slow everything down!
		var numNodes = dendroData.length;
		var lastRow = dendroData[numNodes-1];
		var maxHeight = Number(lastRow.split(",")[2]); // this assumes the heightData is ordered from lowest height to highest
		var matrix = new Array(normDendroMatrixHeight+1);
		for (var i = 0; i < normDendroMatrixHeight+1; i++){ // 500rows * (3xWidth)cols matrix
			matrix[i] = new Array(pointsPerLeaf*heatMap.getNumRows('d'));
		}
		for (var i = 0; i < numNodes; i++){
			var tokes = dendroData[i].split(",");
			var leftIndex = Number(tokes[0]); // index is the location of the bar in the clustered data
			var rightIndex = Number(tokes[1]);
			var height = Number(tokes[2]);
			var leftLoc = findLocationFromIndex(leftIndex); // this is the position it occupies in the dendroMatrix space
			var rightLoc = findLocationFromIndex(rightIndex);
			var normHeight = Math.round(normDendroMatrixHeight*height/maxHeight);
			bars.push({"left":leftLoc, "right":rightLoc, "height":normHeight});
			for (var j = leftLoc; j < rightLoc; j++){
				matrix[normHeight][j] = 1;
			}
			var drawHeight = normHeight-1;
			while (drawHeight > 0 && matrix[drawHeight][leftLoc] != 1){			
				matrix[drawHeight][leftLoc] = 1;
				drawHeight--;
			}
			drawHeight = normHeight;
			while (matrix[drawHeight][rightLoc] != 1 && drawHeight > 0){			
				matrix[drawHeight][rightLoc] = 1;
				drawHeight--;
			}
		}
		return matrix;
		
		// returns the position in terms of the 3N space
		function findLocationFromIndex(index){
			if (index < 0){
				index = 0-index; // make index a positive number to find the leaf
				return pointsPerLeaf*index-2; // all leafs should occupy the middle space of the 3 points available
			} else {
				index--;
				return Math.round((bars[index].left + bars[index].right)/2); // gets the middle point of the bar
			}
		}
	}
	
	function highlightMatrix(i, j){ // i-th row, j-th column of dendro matrix
		var leftExtreme, rightExtreme;
		var ip = i, id = i;
		while (dendroMatrix[id][j]==undefined && dendroMatrix[ip][j]==undefined){ id--,ip++;}
		if (dendroMatrix[id][j]!=undefined){
			i = id;
		} else {
			i = ip;
		}
		var leftAndRightExtremes = exploreToEndOfBar(i,j,dendroMatrix); // find the endpoints of the highest level node
		var thisBar = {height:i, left: leftAndRightExtremes[0], right: leftAndRightExtremes[1]};
		var sameBarClicked = true;
		for (var key in thisBar){ 
			if (thisBar[key] != chosenBar[key]){
				sameBarClicked = false;
			}
		}
		leftExtreme = leftAndRightExtremes[0], rightExtreme = leftAndRightExtremes[1];
		if (!sameBarClicked){ // new bar clicked
			chosenBar = {height:i, left: leftExtreme, right: rightExtreme};
			leftExtreme = findLeftEnd(i,leftExtreme,dendroMatrix);
			rightExtreme = findRightEnd(i,rightExtreme,dendroMatrix); // L and R extreme values are in dendro matrix coords right now
			highlightAllBranchesInRange(i,leftExtreme,rightExtreme,dendroMatrix);
			
			leftExtreme = getTranslatedLocation(leftExtreme); // L and R extreme values gets converted to heatmap locations
			rightExtreme = getTranslatedLocation(rightExtreme);
			
			// Set start and stop coordinates
			var rvRatio = heatMap.getRowSummaryRatio(MatrixManager.RIBBON_VERT_LEVEL);
			var summaryRatio = heatMap.getRowSummaryRatio(MatrixManager.SUMMARY_LEVEL);
			selectedStart = Math.round(leftExtreme*summaryRatio) +1;
			selectedStop = Math.round(rightExtreme*summaryRatio) +1;
			clearSearchItems("Row");
			changeMode('RIBBONV');
			drawRowSelectionMarks();
		}else{
			chosenBar = {};
			clearSelectionMarks();
			clearSearchItems("Row");
			drawRowSelectionMarks();
			if (getSearchLabelsByAxis("Row").length == 0){
				clearSearch();
			}
			selectedStart = 0;
			selectedStop = 0;
			dendroBoxLeftTopArray = new Float32Array([0, 0]); 
			dendroBoxRightBottomArray = new Float32Array([0, 0]);  
			changeMode('NORMAL');
		}
		
	}
	
}


/********************************************
 *  FUNCTIONS SHARED BY ROW AND COL DENDROS *
*********************************************/
var pointsPerLeaf = 3; // each leaf will get 3 points in the dendrogram array. This is to avoid lines being right next to each other

function findExtremes(i,j,matrix){
	var top = i;
	var left = j;
	var right = j;
	while (top != 0 && left != 0){ // as long as we aren't at the far left or the very bottom, keep moving
		if (matrix[top][left-1]){ // can we keep moving left?
			left--;
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){ // can we move towards the bottom?
			top--;
		}
	}
	top = i;
	while (top != 0 && right <= matrix[1].length){
		if (matrix[top][right+1]){
			right++;
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){
			top--;
		}
	}
	return [left,right];
}

function getTranslatedLocation(location){
	var summaryRatio = heatMap.getRowSummaryRatio(MatrixManager.SUMMARY_LEVEL);
	return (location/summaryRatio)/pointsPerLeaf;
}

function exploreToEndOfBar(i,j, dendroMatrix){
	var leftExtreme = j, rightExtreme = j;
	while (dendroMatrix[i][rightExtreme+1]==1 || dendroMatrix[i][rightExtreme+1]==2){ // now find the right and left end points of the line in the matrix and highlight as we go
		rightExtreme++;
	}
	while (dendroMatrix[i][leftExtreme-1]==1 || dendroMatrix[i][leftExtreme-1]==2){
		leftExtreme--;
	}
	return [leftExtreme,rightExtreme];
}

function findLeftEnd(i,j,dendroMatrix){
	dendroMatrix[i][j] = 2;
	while (i != 0 && j != 0){ // as long as we aren't at the far left or the very bottom, keep moving
		if (dendroMatrix[i][j-1] == 1 ||dendroMatrix[i][j-1] == 2){ // can we keep moving left?
			j--;
			dendroMatrix[i][j] = 2;
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){ // can we move towards the bottom?
			i--;
			dendroMatrix[i][j] = 2;
		}
	}
	return j;
}

function findRightEnd(i,j,dendroMatrix){
	dendroMatrix[i][j] = 2;
	while (i != 0 && j <= dendroMatrix[1].length){
		if (dendroMatrix[i][j+1] == 1 ||dendroMatrix[i][j+1] == 2){
			j++;
			dendroMatrix[i][j] = 2;
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){
			i--;
			dendroMatrix[i][j] = 2;
		}
	}
	return j;
}

function highlightAllBranchesInRange(height,leftExtreme,rightExtreme,dendroMatrix){
	for (var i = height; i >= 0; i--){
		for (var loc in dendroMatrix[i]){
			if (leftExtreme < loc && loc < rightExtreme){
				dendroMatrix[i][loc] = 2;
			}
		}
	}
	return dendroMatrix;
}

function clearDendroSelection(){
	//clearSearch();    //FUTA
	selectedStart = 0;
	selectedStop = 0;
	if (!isSub) {
		dendroBoxLeftTopArray = new Float32Array([0, 0]);
		dendroBoxRightBottomArray = new Float32Array([0, 0]);
		if (heatMap.showRowDendrogram("summary")) {
			summaryRowDendro.rebuildMatrix();
			summaryRowDendro.draw();
		}
		if (heatMap.showColDendrogram("summary")) {
			summaryColumnDendro.rebuildMatrix();
			summaryColumnDendro.draw();
		}
	}
}

function matrixToAsciiPrint(matrix){// this is just a debug function to see if the dendrogram looks correct. paste "line" into a text editor and decrease the font. input is the dendrogram matrix.
	var line = "";
	for (var i = matrix.length-1; i > -1; i--){
		for (var j = 0; j < matrix[i].length; j++){
			if (matrix[i][j] == 1){
				line += "=";
			}else if (matrix[i][j] == 2){
				line += "+";
			}else{
				line += ".";
			}
		}
		line += "\n";
	}
	console.log(line);
}