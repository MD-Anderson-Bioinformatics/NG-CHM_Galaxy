//Define Namespace for NgChm Dendrogram
NgChm.createNS('NgChm.DDR');

//Class used to hold an in memory 2D boolean matrix of the dendrogram 
NgChm.DDR.DendroMatrix = function(numRows, numCols,isRow){
	// We've moved away from using a 2D matrix and have opted to use one long array for performance purposes.
	var matrixData = new Uint8Array(numRows * numCols);
	var numRows = numRows;
	var numCols = numCols;
	var isRow = isRow;
	
	this.getDataLength = function(){
		return matrixData.length;
	}
	
	this.setTrue = function(row, col, bold) {
		matrixData[(row * numCols) + col ] = bold ? 2 : 1;
	}
	
	this.isRow = function(){
		return isRow;
	}
	this.get = function(row, col){
		return (matrixData[(row * numCols) + col ]);
	}
	
	this.getArrayVal = function(i){
		return matrixData[i];
	}
	// These returns the "matrix positions" based on the index in the array
	this.getI = function(index){
		return Math.floor(index/numCols);
	}
	
	this.getJ = function(index){
		return index-Math.floor(index/numCols)*numCols;
	}
	
	this.getNumCols = function() {
		return numCols;
	};
	
	this.getNumRows = function() {
		return numRows;
	};
}

/******************************
 *  SUMMARY COLUMN DENDROGRAM *
 ******************************/
NgChm.DDR.SummaryColumnDendrogram = function() {
	var dendroDisplaySize = NgChm.DDR.minDendroMatrixHeight; // this is a static number used to determine how big the dendro canvas will be in conjunction with the dendroConfig.heigh property
	var pointsPerLeaf = 3; // each leaf will get 3 points in the dendrogram array. This is to avoid lines being right next to each other
	var bars = [];
	var chosenBar = {}; // this is the bar that is clicked on the summary side (Subdendro selection)
	var dendroCanvas = document.getElementById('column_dendro_canvas');
	var dendroConfig = NgChm.heatMap.getColDendroConfig();
	var hasData = dendroConfig.show === 'NA' ? false : true;
	var dendroData = NgChm.heatMap.getColDendroData();
	var normDendroMatrixHeight = Math.min(Math.max(NgChm.DDR.minDendroMatrixHeight,dendroData.length),NgChm.DDR.maxDendroMatrixHeight); // this is the height of the dendro matrices created in buildDendroMatrix
	var maxHeight = dendroData.length > 0 ? getMaxHeight(dendroData) : 0; 
	var dendroMatrix;                       
	if (hasData) {
		while(dendroMatrix == undefined){dendroMatrix = buildMatrix();}
	}
	var originalDendroMatrix = dendroMatrix;
	var selectedBars = []; // these are the bars/areas that are selected from the detail side
	var sumChm = document.getElementById("summary_chm");
	dendroCanvas.addEventListener('click',subDendroClick);
	this.getDivWidth = function(){
		return parseInt(dendroCanvas.clientWidth);
	}
	this.getDivHeight = function(){
		return parseInt(dendroConfig.height)/dendroDisplaySize*sumChm.clientHeight*NgChm.SUM.heightPct;
	}
	this.getBars = function(){
		return bars;
	}
	this.getDendroMatrixHeight = function(){
		return normDendroMatrixHeight;
	}
	this.getDendroMatrix = function(){
		return dendroMatrix;
	}
	this.getPointsPerLeaf = function(){
		return pointsPerLeaf;
	}

	this.addSelectedBar = function(extremes, shift){
		var left = extremes.left;
		var right = extremes.right;
		var height = extremes.height;
		var addBar = true;
		var selectedBar = extremes;
		for (var i in selectedBars){
			var bar = selectedBars[i];
			if (bar.left >= selectedBar.left && bar.right <= selectedBar.right && bar.height <= selectedBar.height){
				selectedBars.splice(i,1);
				var selectLeft = Math.round((left+pointsPerLeaf/2)/pointsPerLeaf);
				var selectRight =Math.round((right+pointsPerLeaf/2)/pointsPerLeaf);
				for (var j = selectLeft; j < selectRight+1;j++){
					delete NgChm.SEL.searchItems["Column"][j];
				}
				NgChm.SUM.clearSelectionMarks();
				NgChm.SUM.drawColSelectionMarks();
				NgChm.SUM.drawRowSelectionMarks();
				if (bar.left == selectedBar.left && bar.right == selectedBar.right && bar.height == selectedBar.height){
					addBar = false;
				}
			}
		}
		
		var selectLeft = Math.round((left+pointsPerLeaf/2)/pointsPerLeaf);
		var selectRight = Math.round((right+pointsPerLeaf/2)/pointsPerLeaf);
		if (addBar){
			if (shift){
				for (var i = selectLeft; i < selectRight+1;i++){
					NgChm.SEL.searchItems["Column"][i] = 1;
				}
				
				selectedBars.push(selectedBar);
			} else {
				NgChm.DET.clearSearchItems("Column");
				for (var i = selectLeft; i < selectRight+1;i++){
					NgChm.SEL.searchItems["Column"][i] = 1;
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
		return NgChm.DDR.findExtremes(i,j,dendroMatrix);
	}
	
	this.resize = function(){
		resize();
	}

	this.draw = function(){
		resize();
		dendroCanvas.width = NgChm.SUM.canvas.clientWidth*NgChm.SUM.matrixWidth/NgChm.SUM.totalWidth;
		dendroCanvas.height = parseInt(dendroConfig.height)/dendroDisplaySize * sumChm.clientHeight*NgChm.SUM.heightPct;
		draw();
	}
	
	this.drawNoResize = function () {
		draw();
	}
	
	this.clearSelection = function(){
		clearSelection();
	}
	
	function subDendroClick(event){
		var clickX = event.offsetX, clickY = this.height-event.offsetY;
		var matrixX = Math.round(clickX/(this.width/dendroMatrix.getNumCols())), matrixY = Math.round(clickY/(this.height/dendroMatrix.getNumRows()));
		NgChm.SUM.clearColSelectionMarks();
		NgChm.SUM.rowDendro.clearSelection();
		NgChm.SUM.colDendro.clearSelection();
		dendroMatrix = buildMatrix();
		var newDendro = highlightMatrix(matrixY,matrixX);
		if (newDendro){   
			NgChm.SUM.rowDendro.draw();
			NgChm.SUM.colDendro.draw();
		}
	}
	
	function clearSelection(){
		chosenBar = {};
		NgChm.SEL.selectedStart = 0;
		NgChm.SEL.selectedStop = 0;
		if (!NgChm.SEL.isSub) {
			dendroBoxLeftTopArray = new Float32Array([0, 0]);
			dendroBoxRightBottomArray = new Float32Array([0, 0]);
			if (NgChm.heatMap.showColDendrogram("summary")) {
				dendroMatrix = buildMatrix();
			}
		}
	}
	function resize(){
		dendroCanvas.style.width = NgChm.SUM.canvas.clientWidth*NgChm.SUM.matrixWidth/NgChm.SUM.totalWidth;
		dendroCanvas.style.left = NgChm.SUM.canvas.offsetLeft + (1-NgChm.SUM.matrixWidth/NgChm.SUM.totalWidth)*NgChm.SUM.canvas.offsetWidth;
		if (dendroConfig.show !== "NONE"){
			dendroCanvas.style.height = parseInt(dendroConfig.height)/dendroDisplaySize*sumChm.clientHeight*NgChm.SUM.heightPct; // the dendro should take 1/5 of the height at 100% dendro height
		}else{
			dendroCanvas.style.height = 0;
		}
	}
	
	function draw(){
		if (typeof dendroMatrix !== 'undefined') {
			var xRatio = dendroCanvas.width/dendroMatrix.getNumCols();
			var yRatio = dendroCanvas.height/dendroMatrix.getNumRows();
			var colgl = dendroCanvas.getContext("2d");
			colgl.fillStyle = "black";
			for (var i=0; i<dendroMatrix.getDataLength(); i++){
				// draw the non-highlighted regions
				var val = dendroMatrix.getArrayVal(i);
				if (val > 0){
					// x,y,w,h
					var x = Math.floor(dendroMatrix.getJ(i)*xRatio), y = Math.floor((dendroMatrix.getNumRows()-dendroMatrix.getI(i))*yRatio);
					var w = 1;
					if (val == 1){ // standard draw
						colgl.fillRect(x,y,w,w);
					} else if (val == 2){ // highlight draw
						w = 2;
						colgl.fillRect(x,y,w,w);
					} 
					if (xRatio >= 1){
						var fill = 1;
						while(fill<xRatio){colgl.fillRect(x+fill,y,w,w),fill++;}
					}
				}
			}
		}
	}
	
	
	function buildMatrix(){
		bars = []; // clear out the bars array otherwise it will add more and more bars and slow everything down!
		var numNodes = dendroData.length;
		var matrixWidth = pointsPerLeaf*NgChm.heatMap.getNumColumns('d');
		if (matrixWidth < NgChm.DDR.minDendroMatrixWidth){
			pointsPerLeaf = Math.round(NgChm.DDR.minDendroMatrixWidth/NgChm.heatMap.getNumColumns('d'));
			matrixWidth = pointsPerLeaf*NgChm.heatMap.getNumColumns('d');
		} 
		var matrix = new NgChm.DDR.DendroMatrix(normDendroMatrixHeight+1, matrixWidth,false);
		
		if (normDendroMatrixHeight >= NgChm.DDR.maxDendroMatrixHeight){ // if the dendro matrix height is already at the highest possible, just build it
			for (var i = 0; i < numNodes; i++){
				var tokes = dendroData[i].split(",");
				var leftIndex = Number(tokes[0]); // index is the location of the bar in the clustered data
				var rightIndex = Number(tokes[1]);
				var height = Number(tokes[2]);
				var leftLoc = findLocationFromIndex(leftIndex); // this is the position it occupies in the dendroMatrix space
				var rightLoc = findLocationFromIndex(rightIndex);
				var normHeight = height < 0.000001*matrix.getNumRows() ? 1 : Math.round(normDendroMatrixHeight*height/maxHeight); // if the height of the bar is close enough to 0, just place it at the lowest level
				bars.push({"left":leftLoc, "right":rightLoc, "height":normHeight});
				for (var j = leftLoc; j < rightLoc; j++){
					matrix.setTrue(normHeight,j);
				}
				var drawHeight = normHeight-1;
				while (drawHeight > 0 && matrix.get(drawHeight,leftLoc) != 1){	// this fills in any spaces 		
					matrix.setTrue(drawHeight,leftLoc);
					drawHeight--;
				}
				drawHeight = normHeight;
				while (matrix.get(drawHeight,rightLoc) != 1 && drawHeight > 0){			
					matrix.setTrue(drawHeight,rightLoc);
					drawHeight--;
				}
			}
		} else { // otherwise build it and increase height as necessary
			for (var i = 0; i < numNodes; i++){
				var tokes = dendroData[i].split(",");
				var leftIndex = Number(tokes[0]); // index is the location of the bar in the clustered data
				var rightIndex = Number(tokes[1]);
				var height = Number(tokes[2]);
				var leftLoc = findLocationFromIndex(leftIndex); // this is the position it occupies in the dendroMatrix space
				var rightLoc = findLocationFromIndex(rightIndex);
				var normHeight = height < 0.000001*matrix.getNumRows() ? 1 : Math.round(normDendroMatrixHeight*height/maxHeight); // if the height of the bar is close enough to 0, just place it at the lowest level
				bars.push({"left":leftLoc, "right":rightLoc, "height":normHeight});
				for (var j = leftLoc; j < rightLoc; j++){
					if (matrix.get(normHeight,j) == 0){
						matrix.setTrue(normHeight,j);
					} else {
						normDendroMatrixHeight += 1000; // if there is a bar overlap, increase the dendro matrix height by another 500
						return;
					}
				}
				var drawHeight = normHeight-1;
				while (drawHeight > 0 && matrix.get(drawHeight,leftLoc) != 1){	// this fills in any spaces 		
					matrix.setTrue(drawHeight,leftLoc);
					drawHeight--;
				}
				drawHeight = normHeight;
				while (matrix.get(drawHeight,rightLoc) != 1 && drawHeight > 0){			
					matrix.setTrue(drawHeight,rightLoc);
					drawHeight--;
				}
			}
		}
		
		return matrix;
		
		// returns the position in terms of the 3N space
		function findLocationFromIndex(index){
			if (index < 0){
				index = 0-index; // make index a positive number to find the leaf
				return Math.round(pointsPerLeaf*index-pointsPerLeaf/2);
			} else {
				index--;
				return Math.round((bars[index].left + bars[index].right)/2); // gets the middle point of the bar
			}
		}
	}

	//Find the maximum dendro height.
	function getMaxHeight(dendroData) {
		var max = 0;
		for (var i = 0; i < dendroData.length; i++){
			var height = Number(dendroData[i].split(",")[2]);
			if (height > max)
				max = height;
		}
		return max;
	}	
	
	function highlightMatrix(i,j){
		var leftExtreme, rightExtreme;
		var vertSearchRadiusMax = Math.floor(dendroMatrix.getNumRows()/20);
		var horSearchRadiusMax = Math.floor(dendroMatrix.getNumCols()/60);
		var ip = i, id = i, jr = j, jl = j, horSearchRadius = 0,vertSearchRadius = 0;
		// search up and down for for closest dendro bar
		while (dendroMatrix.getNumRows() > ip && id > 0 && dendroMatrix.get(id,j)==0 && dendroMatrix.get(ip,j)==0 && vertSearchRadius < vertSearchRadiusMax){
			id--,ip++,vertSearchRadius++;
		}
		// search left and right for for closest dendro bar
		while (jl % dendroMatrix.getNumCols() !== 0 && jr % dendroMatrix.getNumCols() !== 0 && dendroMatrix.get(i,jl)==0 && dendroMatrix.get(i,jr)==0 && horSearchRadius < horSearchRadiusMax){
			jl--,jr++,horSearchRadius++;
		}
		if (id == 0 || ip == dendroMatrix.getNumRows() || (horSearchRadius == horSearchRadiusMax && vertSearchRadius == vertSearchRadiusMax)){
			return false;
		}
		if (dendroMatrix.get(id,j)!=0){
			i = id;
		} else if (dendroMatrix.get(ip,j)!=0){
			i = ip;
		} else if (dendroMatrix.get(i,jl)!=0){
			j = jl;
		} else if (dendroMatrix.get(i,jr)!=0){
			j = jr;
		}
		var leftAndRightExtremes = NgChm.DDR.exploreToEndOfBar(i,j,dendroMatrix); // find the endpoints of the highest level node
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
			leftExtreme = NgChm.DDR.findLeftEnd(i,leftExtreme,dendroMatrix);
			rightExtreme = NgChm.DDR.findRightEnd(i,rightExtreme,dendroMatrix); // L and R extreme values are in dendro matrix coords right now
			NgChm.DDR.highlightAllBranchesInRange(i,leftExtreme,rightExtreme,dendroMatrix);
			leftExtreme = NgChm.DDR.getTranslatedLocation(leftExtreme,"Column"); // L and R extreme values gets converted to heatmap locations
			rightExtreme = NgChm.DDR.getTranslatedLocation(rightExtreme,"Column");
									
			
			// Set start and stop coordinates
			var rhRatio = NgChm.heatMap.getColSummaryRatio(NgChm.MMGR.RIBBON_HOR_LEVEL);
			var summaryRatio = NgChm.heatMap.getRowSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL);
			NgChm.SEL.selectedStart = Math.round(leftExtreme*summaryRatio);// +1;
			NgChm.SEL.selectedStop = Math.round(rightExtreme*summaryRatio);// +1;
			NgChm.DET.clearSearchItems("Column");
			NgChm.SUM.drawColSelectionMarks();
			NgChm.SEL.changeMode('RIBBONH');
		} else { // same bar clicked
			chosenBar = {};
			NgChm.SUM.clearSelectionMarks();
			NgChm.DET.clearSearchItems("Column");
			NgChm.SUM.drawColSelectionMarks();
			if (NgChm.DET.getSearchLabelsByAxis("Column").length == 0){
				NgChm.DET.clearSearch();
			}
			NgChm.SEL.selectedStart = 0;
			NgChm.SEL.selectedStop = 0;
			NgChm.SEL.changeMode('NORMAL');
		}
		return true;
	}
}




/***************************
 *  SUMMARY ROW DENDROGRAM *
 ***************************/
NgChm.DDR.SummaryRowDendrogram = function() {
	// internal variables
	var dendroDisplaySize = NgChm.DDR.minDendroMatrixHeight; // this is a static number used to determine how big the dendro canvas will be in conjunction with the dendroConfig.heigh property
	var pointsPerLeaf = 3; // each leaf will get 3 points in the dendrogram array. This is to avoid lines being right next to each other
	var bars = [];
	var chosenBar = {};
	var dendroCanvas = document.getElementById('row_dendro_canvas');
	var dendroConfig = NgChm.heatMap.getRowDendroConfig();
	var hasData = dendroConfig.show === 'NA' ? false : true;
	var dendroData = NgChm.heatMap.getRowDendroData();
	var normDendroMatrixHeight = Math.min(Math.max(NgChm.DDR.minDendroMatrixHeight,dendroData.length),NgChm.DDR.maxDendroMatrixHeight); // this is the height of the dendro matrices created in buildDendroMatrix
	var maxHeight = dendroData.length > 0 ? Number(dendroData[dendroData.length-1].split(",")[2]) : 0; // this assumes the heightData is ordered from lowest height to highest
	var dendroMatrix;
	if (hasData) {
		while(dendroMatrix == undefined){dendroMatrix = buildMatrix();}
	}
	var originalDendroMatrix = dendroMatrix;
	var selectedBars;
	var sumChm = document.getElementById("summary_chm");
	
	// event listeners
	dendroCanvas.addEventListener('click',subDendroClick);
	
	// public functions
	this.getDivWidth = function(){
		// the dendrogram will take up 1/5 of the summary side by default (100% = 1/5 of summary_chm).
		return parseInt(dendroConfig.height)/dendroDisplaySize*sumChm.clientWidth;
	}
	this.getDivHeight = function(){
		return parseInt(dendroCanvas.clientHeight);
	}
	this.getBars = function(){
		return bars;
	}
	this.getDendroMatrixHeight = function(){
		return normDendroMatrixHeight;
	}
	this.getDendroMatrix = function(){
		return dendroMatrix;
	}
	this.getPointsPerLeaf = function(){
		return pointsPerLeaf;
	}
	
	this.addSelectedBar = function(extremes, shift){		
		var left = extremes.left;
		var right = extremes.right;
		var height = extremes.height;
		var addBar = true;
		var selectedBar = extremes;
		for (var i in selectedBars){
			var bar = selectedBars[i];
			if (bar.left >= selectedBar.left && bar.right <= selectedBar.right && bar.height <= selectedBar.height){
				selectedBars.splice(i,1);
				var selectLeft = Math.round((left+pointsPerLeaf/2)/pointsPerLeaf);
				var selectRight =Math.round((right+pointsPerLeaf/2)/pointsPerLeaf);
				for (var j = selectLeft; j < selectRight+1;j++){
					delete NgChm.SEL.searchItems["Row"][j];
				}
				NgChm.SUM.clearSelectionMarks();
				NgChm.SUM.drawColSelectionMarks();
				NgChm.SUM.drawRowSelectionMarks();
				if (bar.left == selectedBar.left && bar.right == selectedBar.right && bar.height == selectedBar.height){
					addBar = false;		
				}
			}
		}
		
		var selectLeft = Math.round((left+pointsPerLeaf/2)/pointsPerLeaf);
		var selectRight = Math.round((right+pointsPerLeaf/2)/pointsPerLeaf);
		if (addBar){
			if (shift){
				for (var i = selectLeft; i < selectRight+1;i++){
					NgChm.SEL.searchItems["Row"][i] = 1;
				}
				
				selectedBars.push(selectedBar);
			} else {
				NgChm.DET.clearSearchItems("Row");
				for (var i = selectLeft; i < selectRight+1;i++){
					NgChm.SEL.searchItems["Row"][i] = 1;
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
		return NgChm.DDR.findExtremes(i,j,dendroMatrix);
	}
	
	this.draw = function(){
		resize();
		dendroCanvas.height = NgChm.SUM.canvas.clientHeight*NgChm.SUM.matrixHeight/NgChm.SUM.totalHeight;
		dendroCanvas.width = dendroConfig.height/dendroDisplaySize*sumChm.clientWidth*NgChm.SUM.widthPct;
		draw();
	}
	
	this.drawNoResize = function(){
		draw();
	}
	
	this.clearSelection = function(){
		clearSelection();
	}
	
	// internal functions
	function subDendroClick(event){
		var clickX = event.offsetX, clickY = event.offsetY;
		var matrixX = Math.round(clickY/(this.height/dendroMatrix.getNumCols())), matrixY = Math.round((this.width-clickX)/(this.width/dendroMatrix.getNumRows()));
//		var matrixX = Math.round(clickX/(this.width/dendroMatrix.getNumCols())), matrixY = Math.round(clickY/(this.height/dendroMatrix.getNumRows()));
		NgChm.SUM.clearRowSelectionMarks();
		NgChm.SUM.colDendro.clearSelection();
		NgChm.SUM.rowDendro.clearSelection();
		dendroMatrix = buildMatrix();
		var newDendro = highlightMatrix(matrixY,matrixX);
		if (newDendro){
			NgChm.SUM.rowDendro.draw();
			NgChm.SUM.colDendro.draw();
		}
	}
	function clearSelection(){
		chosenBar = {};
		NgChm.SEL.selectedStart = 0;
		NgChm.SEL.selectedStop = 0;
		if (!NgChm.SEL.isSub) {
			dendroBoxLeftTopArray = new Float32Array([0, 0]);
			dendroBoxRightBottomArray = new Float32Array([0, 0]);
			if (NgChm.heatMap.showRowDendrogram("summary")) {
				dendroMatrix = buildMatrix();
			}
		}
	}
	
	function resize(){
		dendroCanvas.style.height = NgChm.SUM.canvas.clientHeight*NgChm.SUM.matrixHeight/NgChm.SUM.totalHeight;
		dendroCanvas.style.top = NgChm.SUM.canvas.offsetTop + (NgChm.SUM.totalHeight - NgChm.SUM.matrixHeight)/NgChm.SUM.totalHeight*NgChm.SUM.canvas.offsetHeight;
		if (dendroConfig.show !== "NONE"){
			dendroCanvas.style.width = dendroConfig.height/dendroDisplaySize*sumChm.clientWidth*NgChm.SUM.widthPct;
		} else {
			dendroCanvas.style.width = 0;
		}
	}
	
	function draw(){
		if (typeof dendroMatrix !== 'undefined') {
			var xRatio = dendroCanvas.width/dendroMatrix.getNumRows();
			var yRatio = dendroCanvas.height/dendroMatrix.getNumCols();
			var rowgl = dendroCanvas.getContext("2d");
			rowgl.fillStyle = "black";
			var i = 0;
			var index = 1;
			for (var i= 0; i < dendroMatrix.getDataLength(); i++){
				var val = dendroMatrix.getArrayVal(i);
				if (val > 0){
					// x,y,w,h
					var x = Math.floor((dendroMatrix.getNumRows()-dendroMatrix.getI(i))*xRatio), y = Math.floor(dendroMatrix.getJ(i)*yRatio);
					var w = 1;
					if (val == 1){ // standard draw
						rowgl.fillRect(x,y,w,w);
					} else if (val == 2){ // highlight draw
						w = 2;
						rowgl.fillRect(x,y,w,w);
					} 
					if (yRatio >= 1){
						var fill = 1;
						while(fill<yRatio){rowgl.fillRect(x,y+fill,w,w),fill++;}
					}
				}
			}
		}
	}
	
	function buildMatrix(){
		bars = []; // clear out the bars array otherwise it will add more and more bars and slow everything down!
		var numNodes = dendroData.length;
		var maxHeight = getMaxHeight(dendroData);
		var matrixWidth = pointsPerLeaf*NgChm.heatMap.getNumRows('d');
		if (matrixWidth < NgChm.DDR.minDendroMatrixWidth){
			pointsPerLeaf = Math.round(NgChm.DDR.minDendroMatrixWidth/NgChm.heatMap.getNumRows('d'));
			matrixWidth = pointsPerLeaf*NgChm.heatMap.getNumRows('d');
		} 
		var matrix = new NgChm.DDR.DendroMatrix(normDendroMatrixHeight+1, matrixWidth,true);
		
		if (normDendroMatrixHeight >= NgChm.DDR.maxDendroMatrixHeight){ // if the dendro matrix height is already at the highest possible, just build it
			for (var i = 0; i < numNodes; i++){
				var tokes = dendroData[i].split(",");
				var leftIndex = Number(tokes[0]); // index is the location of the bar in the clustered data
				var rightIndex = Number(tokes[1]);
				var height = Number(tokes[2]);
				var leftLoc = findLocationFromIndex(leftIndex); // this is the position it occupies in the dendroMatrix space
				var rightLoc = findLocationFromIndex(rightIndex);
				var normHeight = height < 0.000001*matrix.getNumRows() ? 1 : Math.round(normDendroMatrixHeight*height/maxHeight); // if the height of the bar is close enough to 0, just place it at the lowest level
				bars.push({"left":leftLoc, "right":rightLoc, "height":normHeight});
				for (var j = leftLoc; j < rightLoc; j++){
					matrix.setTrue(normHeight,j);
				}
				var drawHeight = normHeight-1;
				while (drawHeight > 0 && matrix.get(drawHeight,leftLoc) != 1){	// this fills in any spaces 		
					matrix.setTrue(drawHeight,leftLoc);
					drawHeight--;
				}
				drawHeight = normHeight;
				while (matrix.get(drawHeight,rightLoc) != 1 && drawHeight > 0){			
					matrix.setTrue(drawHeight,rightLoc);
					drawHeight--;
				}
			}
		} else { // otherwise build it and increase height as necessary
			for (var i = 0; i < numNodes; i++){
				var tokes = dendroData[i].split(",");
				var leftIndex = Number(tokes[0]); // index is the location of the bar in the clustered data
				var rightIndex = Number(tokes[1]);
				var height = Number(tokes[2]);
				var leftLoc = findLocationFromIndex(leftIndex); // this is the position it occupies in the dendroMatrix space
				var rightLoc = findLocationFromIndex(rightIndex);
				var normHeight = height < 0.000001*matrix.getNumRows() ? 1 : Math.round(normDendroMatrixHeight*height/maxHeight); // if the height of the bar is close enough to 0, just place it at the lowest level
				bars.push({"left":leftLoc, "right":rightLoc, "height":normHeight});
				for (var j = leftLoc; j < rightLoc; j++){
					if (matrix.get(normHeight,j) == 0){
						matrix.setTrue(normHeight,j);
					} else {
						normDendroMatrixHeight += 1000; // if there is a bar overlap, increase the dendro matrix height by another 500
						return;
					}
				}
				var drawHeight = normHeight-1;
				while (drawHeight > 0 && matrix.get(drawHeight,leftLoc) != 1){	// this fills in any spaces 		
					matrix.setTrue(drawHeight,leftLoc);
					drawHeight--;
				}
				drawHeight = normHeight;
				while (matrix.get(drawHeight,rightLoc) != 1 && drawHeight > 0){			
					matrix.setTrue(drawHeight,rightLoc);
					drawHeight--;
				}
			}
		}
	
		return matrix;
		
		// returns the position in terms of the 3N space
		function findLocationFromIndex(index){
			if (index < 0){
				index = 0-index; // make index a positive number to find the leaf
				return Math.round(pointsPerLeaf*index-pointsPerLeaf/2); // all leafs should occupy the middle space of the 3 points available
			} else {
				index--;
				return Math.round((bars[index].left + bars[index].right)/2); // gets the middle point of the bar
			}
		}
	}
	
	//Find the maximum dendro height.
	function getMaxHeight(dendroData) {
		var max = 0;
		for (var i = 0; i < dendroData.length; i++){
			var height = Number(dendroData[i].split(",")[2]);
			if (height > max)
				max = height;
		}
		return max;
	}
	
	function highlightMatrix(i, j){ // i-th row, j-th column of dendro matrix
		var leftExtreme, rightExtreme;
		var vertSearchRadiusMax = Math.floor(dendroMatrix.getNumRows()/20);
		var horSearchRadiusMax = Math.floor(dendroMatrix.getNumCols()/60);
		var ip = i, id = i, jr = j, jl = j, horSearchRadius = 0,vertSearchRadius = 0;
		// search up and down for for closest dendro bar
		while (dendroMatrix.getNumRows() > ip && id > 0 && dendroMatrix.get(id,j)==0 && dendroMatrix.get(ip,j)==0 && vertSearchRadius < vertSearchRadiusMax){
			id--,ip++,vertSearchRadius++;
		}
		// search left and right for for closest dendro bar
		while (jl % dendroMatrix.getNumCols() !== 0 && jr % dendroMatrix.getNumCols() !== 0 && dendroMatrix.get(i,jl)==0 && dendroMatrix.get(i,jr)==0 && horSearchRadius < horSearchRadiusMax){
			jl--,jr++,horSearchRadius++;
		}
		if (id == 0 || ip == dendroMatrix.getNumRows() || (horSearchRadius == horSearchRadiusMax && vertSearchRadius == vertSearchRadiusMax)){
			return false;
		}
		if (dendroMatrix.get(id,j)!=0){
			i = id;
		} else if (dendroMatrix.get(ip,j)!=0){
			i = ip;
		} else if (dendroMatrix.get(i,jl)!=0){
			j = jl;
		} else if (dendroMatrix.get(i,jr)!=0){
			j = jr;
		}
		var leftAndRightExtremes = NgChm.DDR.exploreToEndOfBar(i,j,dendroMatrix); // find the endpoints of the highest level node
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
			leftExtreme = NgChm.DDR.findLeftEnd(i,leftExtreme,dendroMatrix);
			rightExtreme = NgChm.DDR.findRightEnd(i,rightExtreme,dendroMatrix); // L and R extreme values are in dendro matrix coords right now
			NgChm.DDR.highlightAllBranchesInRange(i,leftExtreme,rightExtreme,dendroMatrix);
			
			leftExtreme = NgChm.DDR.getTranslatedLocation(leftExtreme,"Row"); // L and R extreme values gets converted to heatmap locations
			rightExtreme = NgChm.DDR.getTranslatedLocation(rightExtreme,"Row");
			
			// Set start and stop coordinates
			var rvRatio = NgChm.heatMap.getRowSummaryRatio(NgChm.MMGR.RIBBON_VERT_LEVEL);
			var summaryRatio = NgChm.heatMap.getRowSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL);
			NgChm.SEL.selectedStart = Math.round(leftExtreme*summaryRatio);// +1;
			NgChm.SEL.selectedStop = Math.round(rightExtreme*summaryRatio);// +1;
			NgChm.DET.clearSearchItems("Row");
			NgChm.SEL.changeMode('RIBBONV');
			NgChm.SUM.drawRowSelectionMarks();
		}else{
			chosenBar = {};
			NgChm.SUM.clearSelectionMarks();
			NgChm.DET.clearSearchItems("Row");
			NgChm.SUM.drawRowSelectionMarks();
			if (NgChm.DET.getSearchLabelsByAxis("Row").length == 0){
				clearSearch();
			}
			NgChm.SEL.selectedStart = 0;
			NgChm.SEL.selectedStop = 0;
			dendroBoxLeftTopArray = new Float32Array([0, 0]); 
			dendroBoxRightBottomArray = new Float32Array([0, 0]);  
			NgChm.SEL.changeMode('NORMAL');
		}
		return true;
	}
	
}


/********************************************
 *  FUNCTIONS SHARED BY ROW AND COL DENDROS *
*********************************************/
NgChm.DDR.maxDendroMatrixHeight = 3000;
NgChm.DDR.minDendroMatrixHeight = 500;
NgChm.DDR.minDendroMatrixWidth = 500;
NgChm.DDR.pointsPerLeaf = 3; // each leaf will get 3 points in the dendrogram array. This is to avoid lines being right next to each other

NgChm.DDR.findExtremes = function(i,j,matrix) {
	var searchRadiusMaxX = matrix.isRow() ? Math.round(NgChm.SEL.dataPerCol/NgChm.heatMap.getColSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL)/10) : 
											Math.round(NgChm.SEL.dataPerRow/NgChm.heatMap.getRowSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL)/10);
	var searchRadiusMaxY = matrix.isRow() ? Math.round((matrix.getNumRows()*NgChm.SEL.dataPerCol/NgChm.SUM.matrixHeight)/NgChm.heatMap.getRowSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL)/10) : 
											Math.round((matrix.getNumRows()*NgChm.SEL.dataPerRow/NgChm.SUM.matrixWidth)/NgChm.heatMap.getColSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL)/10);
	var ip = i, id = i, jr = j, jl = j, searchRadius = 0,searchRadiusX = 0,searchRadiusY = 0;
	while (matrix.getNumRows() > ip && id > 0 && matrix.get(id,j)==0 && matrix.get(ip,j)==0 && searchRadiusY < searchRadiusMaxY){
		id--,ip++,searchRadiusY++;
	}
	while (jl % matrix.getNumCols() !== 0 && jr % matrix.getNumCols() !== 0 && matrix.get(i,jl)==0 && matrix.get(i,jr)==0 && searchRadiusX < searchRadiusMaxX){
		jl--,jr++,searchRadiusX++;
	}
	if (id == 0 || ip == matrix.getNumRows() || (searchRadiusX == searchRadiusMaxX && searchRadiusY == searchRadiusMaxY)){
		return false;
	}
	if (matrix.get(id,j)!=0){
		i = id;
	} else if (matrix.get(ip,j)!=0){
		i = ip;
	} else if (matrix.get(i,jl)!=0){
		j = jl;
	} else if (matrix.get(i,jr)!=0){
		j = jr;
	}
	var top = i;
	var left = j;
	var right = j;
	while (i != 0 && left != 0){ // as long as we aren't at the far left or the very bottom, keep moving
		if (matrix.get(i,left-1) !== 0){ // can we keep moving left?
			left--;
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){ // can we move towards the bottom?
			i--;
		}
	}
	i = top;
	while (i != 0 && right <= matrix.getNumCols()){
		if (matrix.get(i,right+1) !== 0){
			right++;
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){
			i--;
		}
	}
	return {"left":left,"right":right,"height":top};
}

NgChm.DDR.getTranslatedLocation = function(location,axis) {
	var PPL = axis == "Row" ? NgChm.SUM.rowDendro.getPointsPerLeaf() : NgChm.SUM.colDendro.getPointsPerLeaf(); 
	var summaryRatio = NgChm.heatMap.getRowSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL);//  This line doesn't look right, but it works this way. This method doesn't work: axis == "Row" ? NgChm.heatMap.getRowSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL) :  NgChm.heatMap.getColSummaryRatio(NgChm.MMGR.SUMMARY_LEVEL);;
	return (location/summaryRatio)/PPL;
}

NgChm.DDR.exploreToEndOfBar = function(i,j, dendroMatrix) {
	var leftExtreme = j, rightExtreme = j;
	while (dendroMatrix.get(i,rightExtreme+1)==1 || dendroMatrix.get(i,rightExtreme+1)==2){ // now find the right and left end points of the line in the matrix and highlight as we go
		rightExtreme++;
	}
	while (dendroMatrix.get(i,leftExtreme-1)==1 || dendroMatrix.get(i,leftExtreme-1)==2){
		leftExtreme--;
	}
	return [leftExtreme,rightExtreme];
}

NgChm.DDR.findLeftEnd = function(i,j, dendroMatrix) {
	dendroMatrix.setTrue(i,j,true);
	while (i != 0 && j != 0){ // as long as we aren't at the far left or the very bottom, keep moving
		if (dendroMatrix.get(i,j-1) == 1 ||dendroMatrix.get(i,j-1) == 2){ // can we keep moving left?
			j--;
			dendroMatrix.setTrue(i,j,true);
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){ // can we move towards the bottom?
			i--;
			dendroMatrix.setTrue(i,j,true);
		}
	}
	return j;
}

NgChm.DDR.findRightEnd = function(i,j, dendroMatrix) {
	dendroMatrix.setTrue(i,j,true);
	while (i != 0 && j <= dendroMatrix.getNumCols()){
		if (dendroMatrix.get(i,j+1) == 1 ||dendroMatrix.get(i,j+1) == 2){
			j++;
			dendroMatrix.setTrue(i,j,true);
		} else {//if (dendroMatrix[i-1][j] == 1 ||dendroMatrix[i-1][j] == 2){
			i--;
			dendroMatrix.setTrue(i,j,true);
		}
	}
	return j;
}

NgChm.DDR.highlightAllBranchesInRange = function(height,leftExtreme,rightExtreme,dendroMatrix) {
	for (var i = 0; i < height; i++){
		for (var j = leftExtreme; j < rightExtreme; j++){
			if (dendroMatrix.get(i,j) !== 0){
				dendroMatrix.setTrue(i,j,true);
			}
		}
	}
	return dendroMatrix;
}

NgChm.DDR.clearDendroSelection = function() {
	NgChm.SEL.selectedStart = 0;
	NgChm.SEL.selectedStop = 0;
	if (!NgChm.SEL.isSub) {
		dendroBoxLeftTopArray = new Float32Array([0, 0]);
		dendroBoxRightBottomArray = new Float32Array([0, 0]);
		if (NgChm.heatMap.showRowDendrogram("summary")) {
			NgChm.SUM.rowDendro.rebuildMatrix();
			NgChm.SUM.rowDendro.draw();
		}
		if (NgChm.heatMap.showColDendrogram("summary")) {
			NgChm.SUM.colDendro.rebuildMatrix();
			NgChm.SUM.colDendro.draw();
		}
	}
}

NgChm.DDR.matrixToAsciiPrint = function(matrix) { // this is just a debug function to see if the dendrogram looks correct. paste "line" into a text editor and decrease the font. input is the dendrogram matrix.
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