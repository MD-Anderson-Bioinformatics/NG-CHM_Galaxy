function openPdfPrefs(e){
	maxRows = 0;
	userHelpClose();
	var prefspanel = document.getElementById('pdfPrefsPanel');
	//Add prefspanel table to the main preferences DIV and set position and display
	prefspanel.style.top = e.offsetTop + 15;
	prefspanel.style.display="inherit";
	prefspanel.style.left = e.offsetLeft - prefspanel.clientWidth;
}

/**********************************************************************************
 * FUNCTION - getPDF: This function is called when the "create pdf" button is pressed.
 * It will check the checkboxes/radio buttons to see how the PDF is to be created using
 * the isChecked function. for a full list of jsPDF functions, visit here:
 * https://mrrio.github.io/jsPDF/doc/symbols/jsPDF.html#setLineCap
 **********************************************************************************/
function getPDF(){
	pdfCancelButton();	// close the PDF menu when you download
	// canvas elements need to be converted to DataUrl to be loaded into PDF
	updateSelection(); // redraw the canvases because otherwise they can show up blank
	var sumImgData = canvas.toDataURL('image/png');
	var detImgData = detCanvas.toDataURL('image/png');
	var mapsToShow = isChecked("pdfInputSummaryMap") ? "S" : isChecked("pdfInputDetailMap") ? "D" : "B";
	var doc = isChecked("pdfInputPortrait") ? new jsPDF("p","pt") :new jsPDF("l","pt"); // landscape or portrait?
	var pageHeight = doc.internal.pageSize.height;
	var pageWidth = doc.internal.pageSize.width;
	
	doc.setFont("times");
//	doc.setFont("helvetica");
	// convert longest label units to actual length (11 is the max font size of the labels)
	// these will be the bottom and left padding space for the detail Heat Map
	var allLabels = document.getElementsByClassName("DynamicLabel");
	var longestRowLabelUnits = 10, longestColLabelUnits = 5;
	for (var i = 0; i < allLabels.length; i++){ // go through all the labels and find the one that takes the most space
		var label = allLabels[i];
		if (label.getAttribute('axis') == "Row"){
			longestRowLabelUnits = Math.max(doc.getStringUnitWidth(label.innerHTML),longestRowLabelUnits);
		} else {
			longestColLabelUnits = Math.max(doc.getStringUnitWidth(label.innerHTML),longestColLabelUnits);
		}
	}
	longestColLabelUnits *= 11;
	longestRowLabelUnits *= 11;
	
	// header
	var headerCanvas = document.createElement('CANVAS'); // load the MDAnderson logo into a canvas, since you can't load an img directly
	var headerCtx = headerCanvas.getContext('2d'); 
	var header = document.getElementsByClassName('mdaServiceHeaderLogo')[0];
	headerCanvas.height = 85; // logo png's actual dimensions
	headerCanvas.width = 260;
	headerCtx.drawImage(header.children[0], 0, 0);
	var headerData = headerCanvas.toDataURL('image/png');
	var headerHeight = header.clientHeight + 5;
	createHeader();
	
	// maps
	var paddingLeft = 5, paddingTop = headerHeight+10; // these are the variables that we will be using repeatedly to place items
	var sumImgW,sumImgH,detImgW,detImgH;
	var detImgL = paddingLeft;
	if (mapsToShow == "S"){
		sumImgW = pageWidth - 2*paddingLeft, sumImgH = pageHeight - paddingTop - 2*paddingLeft;
		doc.addImage(sumImgData, 'PNG', paddingLeft, paddingTop, sumImgW,sumImgH);
	} else if (mapsToShow == "D"){
		detImgW = pageWidth - 2*paddingLeft - longestRowLabelUnits, detImgH = pageHeight - paddingTop - longestColLabelUnits;
		doc.addImage(detImgData, 'PNG', paddingLeft, paddingTop, detImgW,detImgH);
	} else {
		if (!isChecked("pdfInputPages")){
			sumImgW = (pageWidth - longestRowLabelUnits - 2*paddingLeft)/2, sumImgH = pageHeight - paddingTop - longestColLabelUnits;
			detImgW = (pageWidth - longestRowLabelUnits - 2*paddingLeft)/2, detImgH = pageHeight - paddingTop - longestColLabelUnits;
			detImgL = sumImgW + 2*paddingLeft;
			doc.addImage(sumImgData, 'PNG', paddingLeft, paddingTop, sumImgW,sumImgH);
			doc.addImage(detImgData, 'PNG', detImgL, paddingTop, detImgW,detImgH);
		} else {
			sumImgW = pageWidth - 2*paddingLeft, sumImgH = pageHeight - paddingTop - 2*paddingLeft;
			doc.addImage(sumImgData, 'PNG', paddingLeft, paddingTop, sumImgW,sumImgH);
			doc.addPage();
			createHeader();
			detImgW = pageWidth - 2*paddingLeft - longestRowLabelUnits, detImgH = pageHeight - paddingTop - longestColLabelUnits;
			doc.addImage(detImgData, 'PNG', detImgL, paddingTop, detImgW,detImgH);
		}
	}

	// labels
	var detClient2PdfWRatio = detCanvas.clientWidth/detImgW;  // scale factor to place the labels in their proper locations
	var detClient2PdfHRatio = detCanvas.clientHeight/detImgH;
	// row labels and col class bar labels (basically stolen from DetailHeatMapDisplay.js
	var headerSize = paddingTop;
	var colHeight = calculateTotalClassBarHeight("column") + detailDendroHeight;
	if (colHeight > 0) {
		headerSize += detImgH * (colHeight / (detailDataViewHeight + colHeight));
	}
	var skip = (detImgH - headerSize) / dataPerCol;
	var fontSize = Math.min(skip - 2, 11);
	doc.setFontSize(fontSize);
	for (var i = 0; i < allLabels.length; i++){
		var label = allLabels[i];
		if (label.getAttribute("axis") == "Row"){
			doc.text(label.offsetLeft/detClient2PdfWRatio+detImgL, label.offsetTop/detClient2PdfHRatio+paddingTop+fontSize, label.innerHTML, null);
		} else if (label.getAttribute("axis") == "ColumnClass"){ // change font for class bars
			var scale =  detImgH / (detailDataViewWidth + calculateTotalClassBarHeight("row")+detailDendroWidth);
			var colClassBarConfig = heatMap.getColClassificationConfig();
			var classBar0 = colClassBarConfig[Object.keys(colClassBarConfig)[0]];
			var tempFontSize = fontSize;
			fontSize = Math.min((classBar0.height - paddingHeight) * scale, 11);
			doc.setFontSize(fontSize);
			doc.text(label.offsetLeft/detClient2PdfWRatio+detImgL, label.offsetTop/detClient2PdfHRatio+paddingTop+fontSize/2, label.innerHTML, null);
			fontSize = tempFontSize
			doc.setFontSize(fontSize);
		}
	}
	
	// col labels and row class bar labels
	headerSize = 0;
	var rowHeight = calculateTotalClassBarHeight("row") + detailDendroWidth;
	if (rowHeight > 0) {
		headerSize = detImgW * (rowHeight / (detailDataViewWidth + rowHeight));
	}
	skip = (detImgW - headerSize) / dataPerRow;
	fontSize = Math.min(skip - 2, 11);
	doc.setFontSize(fontSize);
	for (var i = 0; i < allLabels.length; i++){
		var label = allLabels[i];
		if (label.getAttribute("axis") == "Column"){
			doc.text(label.offsetLeft/detClient2PdfWRatio-fontSize+detImgL, label.offsetTop/detClient2PdfHRatio+paddingTop, label.innerHTML, null, 270);
		} else if (label.getAttribute("axis") == "RowClass"){
			var scale =  detImgW / (detailDataViewWidth + calculateTotalClassBarHeight("row")+detailDendroWidth);
			var rowClassBarConfig = heatMap.getRowClassificationConfig();
			var classBar0 = colClassBarConfig[Object.keys(rowClassBarConfig)[0]];
			var tempFontSize = fontSize;
			fontSize = Math.min((classBar0.height - paddingHeight) * scale, 11);
			doc.setFontSize(fontSize);
			doc.text(label.offsetLeft/detClient2PdfWRatio-fontSize/2+detImgL, label.offsetTop/detClient2PdfHRatio+paddingTop, label.innerHTML, null, 270);
			fontSize = tempFontSize
			doc.setFontSize(fontSize);
		}
	}
	 
	// class bar legends
	var classBarHeaderSize = 20; // these are font sizes
	var classBarTitleSize = 15;
	var classBarLegendTextSize = 10;
	var classBarFigureW = 150; // figure dimensions, unless discrete with 15+ categories
	var classBarFigureH = 150;
	var topSkip = classBarFigureH + classBarHeaderSize; 
	var condenseClassBars = isChecked('pdfInputCondensed');
	paddingLeft = 5, paddingTop = headerHeight+classBarHeaderSize + 5; // reset the top and left coordinates
	
	// row
	if (isChecked('pdfInputRow')){
		doc.addPage();
		createHeader();
		doc.setFontSize(classBarHeaderSize);
		doc.text(10, paddingTop, "Row Covariate Bar Legends:" , null);
		var leftOff=10, topOff = paddingTop + classBarTitleSize;
		var rowClassBarConfig = heatMap.getRowClassificationConfig();
		var rowClassBarData = heatMap.getRowClassificationData();
		for (var key in rowClassBarConfig){
			var currentClassBar = rowClassBarConfig[key];
			doc.setFontSize(classBarTitleSize);
			var colorMap = heatMap.getColorMapManager().getColorMap("row", key);
			if (currentClassBar.show === 'Y') {
				if (colorMap.getType() == "discrete"){
					getBarGraphForDiscreteClassBar(rowClassBarData[key],colorMap,key);
				} else {
					getBarGraphForContinuousClassBar(rowClassBarData[key],colorMap,key);
				}
			}
		}
	}
	
	// column
	if (isChecked('pdfInputColumn')){
		doc.addPage();
		createHeader();
		doc.setFontSize(classBarHeaderSize);
		doc.text(10, paddingTop, "Column Covariate Bar Legends:" , null);
		var leftOff=10, topOff = paddingTop + classBarTitleSize;
		var colClassBarConfig = heatMap.getColClassificationConfig();
		var colClassBarData = heatMap.getColClassificationData();
		for (var key in colClassBarConfig){
			var currentClassBar = colClassBarConfig[key];
			doc.setFontSize(classBarTitleSize);
			var colorMap = heatMap.getColorMapManager().getColorMap("col", key);
			if (currentClassBar.show === 'Y') {
				if (colorMap.getType() == "discrete"){
					getBarGraphForDiscreteClassBar(colClassBarData[key],colorMap,key);
				} else {
					getBarGraphForContinuousClassBar(colClassBarData[key],colorMap,key);
				}
			}
		}
	}
	 
	// TODO: in case there is an empty page after the class bar legends, delete it
	
	
	doc.save( heatMap.getMapInformation().name + '.pdf');
	
	
	//==================//
	// HELPER FUNCTIONS //
	//==================//
	
	// makes the MDAnderson logo, the HM name, and the red divider line at the top of each page
	function createHeader() {
		doc.addImage(headerData, 'PNG',5,5,header.clientWidth,header.clientHeight);
		doc.setFontSize(20);
		doc.text(pageWidth/2 - doc.getStringUnitWidth(heatMap.getMapInformation().name)*20/2, headerHeight, heatMap.getMapInformation().name, null);
		doc.setFillColor(255,0,0);
		doc.setDrawColor(255,0,0);
		doc.rect(5, header.clientHeight+10, pageWidth-10, 2, "FD");
	}
	
	/**********************************************************************************
	 * FUNCTION - getBarGraphForContinousClassBar: places the classBar legend using the
	 * variables leftOff and topOff, which are updated after every classBar legend.
	 * inputs: classBar object, colorMap object, and string for name
	 **********************************************************************************/
	function getBarGraphForContinuousClassBar(classBar, colorMap,name){
		doc.text(leftOff, topOff , name, null);
		var thresholds = colorMap.getContinuousThresholdKeys();
		var numThresholds = thresholds.length-1; // the last threshold repeats for some reason :\
		var barHeight = !condenseClassBars ? classBarFigureH/(thresholds.length) : 10;		
		// get the number N in each threshold
		var counts = {}, maxCount = 0, maxLabelLength = doc.getStringUnitWidth("Missing Value")*classBarLegendTextSize;
		// get the continuous thresholds and find the counts for each bucket
		for(var i = 0; i < classBar.values.length; i++) {
		    var num = classBar.values[i];
		    for (var k = 0; k < thresholds.length; k++){
				var thresh = thresholds[k];
				if (k == 0 && num <thresholds[k]){
					counts[thresh] = counts[thresh] ? counts[thresh]+1 : 1;
				} else if (k == thresholds.length-1 && num > thresholds[thresholds.length-1]){
					counts[thresh] = counts[thresh] ? counts[thresh]+1 : 1;
				} else if (num <= thresh){
					counts[thresh] = counts[thresh] ? counts[thresh]+1 : 1;
					break;
				}
			}
		}
		// find the longest label length
		for (var val in counts){
			maxCount = Math.max(maxCount, counts[val]);
			maxLabelLength = Math.max(maxLabelLength, doc.getStringUnitWidth(val.length)*classBarLegendTextSize);
		}
		
		var bartop = topOff+5; // top location of first bar
		var missingCount = classBar.values.length; // start at total number of labels and work down
		for (var j = 0; j < thresholds.length-1; j++){
			var rgb = colorMap.getClassificationColor(thresholds[j]);
			doc.setFillColor(rgb.r,rgb.g,rgb.b);
			doc.setDrawColor(0,0,0);
			if (condenseClassBars){ // square
				var barW = 10;
				doc.rect(leftOff, bartop, barW, barHeight, "FD"); // make the square
				doc.setFontSize(classBarLegendTextSize);
				doc.text(leftOff +barW + 5, bartop + classBarLegendTextSize, thresholds[j].toString() + "   " + "n = " + counts[thresholds[j]] , null);
			} else { // histogram
				var barW = counts[thresholds[j]]/maxCount*classBarFigureW;
				doc.rect(leftOff + maxLabelLength, bartop, barW, barHeight, "FD"); // make the histo bar
				doc.setFontSize(classBarLegendTextSize);
				doc.text(leftOff + maxLabelLength - doc.getStringUnitWidth(thresholds[j].toString())*classBarLegendTextSize - 4, bartop + classBarLegendTextSize, thresholds[j].toString() , null);
				doc.text(leftOff + maxLabelLength +barW + 5, bartop + classBarLegendTextSize, "n = " + counts[thresholds[j]] , null);
			}
			missingCount -= counts[thresholds[j]]; 
			bartop+=barHeight; // adjust top position for the next bar
		}
		var rgb = colorMap.getClassificationColor("Missing Value");
		doc.setFillColor(rgb.r,rgb.g,rgb.b);
		doc.setDrawColor(0,0,0);
		if (condenseClassBars){
			var barW = 10;
			doc.rect(leftOff, bartop, barW, barHeight, "FD");
			doc.setFontSize(classBarLegendTextSize);
			doc.text(leftOff +barW + 5, bartop + classBarLegendTextSize, "Missing Value n = " + missingCount , null);
		} else {
			var barW = missingCount/maxCount*classBarFigureW;
			doc.rect(leftOff + maxLabelLength, bartop, barW, barHeight, "FD");
			doc.setFontSize(classBarLegendTextSize);
			doc.text(leftOff + maxLabelLength - doc.getStringUnitWidth("Missing Value")*classBarLegendTextSize - 4, bartop + classBarLegendTextSize, "Missing Value" , null);
			doc.text(leftOff + maxLabelLength +barW + 5, bartop + classBarLegendTextSize, "n = " + missingCount , null);
		}
		// adjust the location for the next class bar figure
		leftOff+= classBarFigureW + maxLabelLength + 50; 
		if (leftOff + classBarFigureW > pageWidth){ // if we'll go off the width of the page...
			leftOff = 10; // ...reinitialize the left side
			topOff += topSkip; // ... and move the next figure to the line below
			topSkip  = classBarFigureH + classBarHeaderSize; // return class bar height to original value in case it got changed in this row
			if (topOff + classBarFigureH > pageHeight && !isLastClassBarToBeDrawn(classBar)){ // if we'll go off the bottom of the page...
				doc.addPage();
				createHeader(); // ...create a new page and reinitialize the top
				topOff = paddingTop + 5;
			}
		}
	}


	/**********************************************************************************
	 * FUNCTION - getBarGraphForDiscreteClassBar: places the classBar legend using the
	 * variables leftOff and topOff, which are updated after every classBar legend.
	 * inputs: classBar object, colorMap object, and string for name
	 **********************************************************************************/
	function getBarGraphForDiscreteClassBar(classBar, colorMap,name){
		doc.text(leftOff, topOff , name, null);
		var thresholds = colorMap.getThresholds();
		var barHeight = !condenseClassBars ? Math.max(classBarFigureH/(thresholds.length+1),10) : 10;
		var counts = {}, maxCount = 0, maxLabelLength = doc.getStringUnitWidth("Missing Value")*classBarLegendTextSize;
		// get the number N in each threshold
		for(var i = 0; i< classBar.values.length; i++) {
		    var num = classBar.values[i];
		    counts[num] = counts[num] ? counts[num]+1 : 1;
		}
		for (var val in counts){
			maxCount = Math.max(maxCount, counts[val]);
			maxLabelLength = Math.max(maxLabelLength, doc.getStringUnitWidth(val.length)*classBarLegendTextSize);
		}
			
		var bartop = topOff+5;
		// NOTE: missingCount will contain all elements that are not accounted for in the thresholds
		// ie: thresholds = [type1, type2, type3], typeX will get included in the missingCount
		var missingCount = classBar.values.length;
		// draw the bars
		for (var j = 0; j < thresholds.length; j++){ // make a gradient stop (and also a bucket for continuous)
			var rgb = colorMap.getClassificationColor(thresholds[j]);
			doc.setFillColor(rgb.r,rgb.g,rgb.b);
			doc.setDrawColor(0,0,0);
			var count = counts[thresholds[j]] ? counts[thresholds[j]] : 0;
			if (condenseClassBars){
				var barW = 10;
				doc.rect(leftOff, bartop, barW, barHeight, "FD");
				doc.setFontSize(classBarLegendTextSize);
				doc.text(leftOff +barW + 5, bartop + classBarLegendTextSize, thresholds[j].toString() + "   " + "n = " + count, null);
			} else {
				var barW = count/maxCount*classBarFigureW;
				doc.rect(leftOff + maxLabelLength, bartop, barW, barHeight, "FD");
				doc.setFontSize(classBarLegendTextSize);
				doc.text(leftOff + maxLabelLength - doc.getStringUnitWidth(thresholds[j].toString())*classBarLegendTextSize - 4, bartop + barHeight/2, thresholds[j].toString() , null);
				doc.text(leftOff + maxLabelLength +barW + 5, bartop + barHeight/2, "n = " + count, null);
			}
			missingCount -= count;
			bartop+=barHeight;
		}
			
		var rgb = colorMap.getClassificationColor("Missing Value");
		doc.setFillColor(rgb.r,rgb.g,rgb.b);
		doc.setDrawColor(0,0,0);
		if (condenseClassBars){
			var barW = 10;
			doc.rect(leftOff, bartop, barW, barHeight, "FD");
			doc.setFontSize(classBarLegendTextSize);
			doc.text(leftOff +barW + 5, bartop + classBarLegendTextSize, "Missing Value n = " + missingCount , null);
		} else {
			var barW = missingCount/maxCount*classBarFigureW;
			doc.rect(leftOff + maxLabelLength, bartop, barW, barHeight, "FD");
			doc.setFontSize(classBarLegendTextSize);
			doc.text(leftOff + maxLabelLength - doc.getStringUnitWidth("Missing Value")*classBarLegendTextSize - 4, bartop + barHeight/2, "Missing Value" , null);
			doc.text(leftOff + maxLabelLength +barW + 5, bartop + barHeight/2, "n = " + missingCount , null);
		}
		
		if (thresholds.length * barHeight > classBarFigureH){ // in case a discrete classbar has over 15 categories, make the topOff increment bigger
			topSkip = (thresholds.length+1) * barHeight+classBarHeaderSize;
		}
		leftOff+= classBarFigureW + maxLabelLength + 50;
		if (leftOff + classBarFigureW > pageWidth){ // if the next class bar figure will go beyond the width of the page...
			leftOff = 10; // ...reset leftOff...
			topOff += topSkip; // ... and move the next figure to the line below
			topSkip  = classBarFigureH + classBarHeaderSize; // return class bar height to original value in case it got changed in this row
			if (topOff + classBarFigureH > pageHeight && !isLastClassBarToBeDrawn(classBar)){ // if the next class bar goes off the page vertically...
				doc.addPage(); // ... make a new page and reset topOff
				createHeader();
				topOff = paddingTop + 10;
			}
		}
	}
	function isChecked(el){
		if(document.getElementById(el))
		return document.getElementById(el).checked;
	}
	
	/**********************************************************************************
	 * FUNCTION - isLastClassBarToBeDrawn: checks if this is the last class bar to be 
	 * drawn. Used to determine if we add a new page when drawing class bars.
	 **********************************************************************************/
	function isLastClassBarToBeDrawn(classBar){
		if (isChecked('pdfInputRow')) {
			var classBarCount = Object.keys(heatMap.getRowClassificationConfig()).length;
		} else {
			var classBarCount = Object.keys(heatMap.getColClassificationConfig()).length;
		};
		if (isChecked("pdfInputColumn") && i === classBarCount - 1){
			return true;
		} else if (isChecked("pdfInputRow") && !isChecked("pdfInputColumn") && i === classBarCount-1){
			return true;
		}
		return false;
	}
}

function pdfCancelButton(){
	var prefspanel = document.getElementById('pdfPrefsPanel');
	prefspanel.style.display = "none";
}