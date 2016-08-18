var linkouts = {};
linkouts.VISIBLE_LABELS = "visibleLabels";
linkouts.HIDDEN_LABELS = "hiddenLabels";
linkouts.FULL_LABELS = "fullLabels";
linkouts.POSITION = "position";
linkouts.SINGLE_SELECT = "singleSelection";
linkouts.MULTI_SELECT = "multiSelection";
linkouts.getAttribute = function (attribute){
	return heatMap.getMapInformation().attributes[attribute];
}
linkouts.getVisibleLabels = function (axis){
	return getSearchLabelsByAxis(axis, linkouts.VISIBLE_LABELS);
}
linkouts.getHiddenLabels = function (axis){
	return getSearchLabelsByAxis(axis, linkouts.HIDDEN_LABELS);
}
linkouts.getFullLabels = function (axis){
	return getSearchLabelsByAxis(axis, linkouts.FULL_LABELS);
}
linkouts.getPositions = function (axis){
	return axis.toLowerCase().contains("row") ? getSearchRows() : axis.toLowerCase().contains("col") ? getSearchCol() : 0;
}

function createLabelMenus(){
	if (!document.getElementById("RowLabelMenu")){
		createLabelMenu('Column'); // create the menu divs if they don't exist yet
		createLabelMenu('ColumnCovar');
		createLabelMenu('Row');
		createLabelMenu('RowCovar');
		createLabelMenu('Matrix');
		getDefaultLinkouts();
	}
}

function labelHelpClose(axis){
	var labelMenu = axis !== "Matrix" ? document.getElementById(axis + 'LabelMenu') : document.getElementById("MatrixMenu");
    var tableBody = labelMenu.getElementsByTagName("TBODY")[0];
    var tempClass = tableBody.className;
    var newTableBody = document.createElement('TBODY');
    newTableBody.className = tempClass;
    tableBody.parentElement.replaceChild(newTableBody,tableBody);
    if (labelMenu){
    	labelMenu.style.display = 'none';
    }
}

function labelHelpOpen(axis, e){
	var labelMenu =  axis !== "Matrix" ? document.getElementById(axis + 'LabelMenu') : document.getElementById("MatrixMenu");
	var labelMenuTable = axis !== "Matrix" ? document.getElementById(axis + 'LabelMenuTable') : document.getElementById('MatrixMenuTable');
    var axisLabelsLength = axis !== "Matrix" ? getSearchLabelsByAxis(axis).length : getSearchLabelsByAxis("Row").length +  getSearchLabelsByAxis("Column").length;
    var header = labelMenu.getElementsByClassName('labelMenuHeader')[0];
    var row = header.getElementsByTagName('TR')[0];
    if (axisLabelsLength > 0 && axis !== "Matrix"){
    	row.innerHTML = "Selected " + axis.replace("Covar"," Classification") + "s : " + axisLabelsLength;
    	labelMenuTable.getElementsByTagName("TBODY")[0].style.display = 'inherit';
    	populateLabelMenu(axis,axisLabelsLength);
    } else if (axisLabelsLength > 0 && axis == "Matrix"){
    	row.innerHTML = "Selected Rows: " + getSearchLabelsByAxis("Row").length + "<br>Selected Columns: " + getSearchLabelsByAxis("Column").length;
    	populateLabelMenu(axis,axisLabelsLength);
    } else {
    	row.innerHTML = "Please select a " + axis.replace("Covar"," Classification");
    	labelMenuTable.getElementsByTagName("TBODY")[0].style.display = 'none';
    }
    
    if (labelMenu){
    	labelMenu.style.display = 'inherit';
    	labelMenu.style.left = e.pageX + labelMenu.offsetWidth > window.innerWidth ? window.innerWidth-labelMenu.offsetWidth-15 : e.pageX; // -15 added in for the scroll bars
    	labelMenu.style.top = e.pageY + labelMenu.offsetHeight > window.innerHeight ? window.innerHeight-labelMenu.offsetHeight-15 : e.pageY;
    }
}

function createLabelMenu(axis){ // creates the divs for the label menu
	var labelMenu = axis !== "Matrix" ? getDivElement(axis + 'LabelMenu') : getDivElement(axis + 'Menu');
	document.body.appendChild(labelMenu);
	labelMenu.style.position = 'absolute';
	labelMenu.classList.add('labelMenu');
	var topDiv = document.createElement("DIV");
	topDiv.classList.add("labelMenuCaption");
	topDiv.innerHTML = axis !== "Matrix" ? axis.replace("Covar"," Classification") + ' Label Menu:' : axis + ' Menu';
	var closeMenu = document.createElement("IMG");
	closeMenu.src = staticPath +"images/closeButton.png";
	closeMenu.classList.add('labelMenuClose')
	closeMenu.addEventListener('click', function(){labelHelpClose(axis)},false);
	var table = document.createElement("TABLE");
	table.id = axis !== "Matrix" ? axis + 'LabelMenuTable' : axis+'MenuTable';
	var tableHead = table.createTHead();
	tableHead.classList.add('labelMenuHeader');
	var row = tableHead.insertRow();
	labelMenu.appendChild(topDiv);
	labelMenu.appendChild(table);
	labelMenu.appendChild(closeMenu);
	var tableBody = table.createTBody();
	tableBody.classList.add('labelMenuBody');
	var labelHelpCloseAxis = function(){ labelHelpClose(axis)};
    document.addEventListener('click', labelHelpCloseAxis);
}

function populateLabelMenu(axis, axisLabelsLength){ // adds the row linkouts and the column linkouts to the menus
	var table = axis !== "Matrix" ? document.getElementById(axis + 'LabelMenuTable') : document.getElementById("MatrixMenuTable");
	var labelType = axis == "Row" ? heatMap.getRowLabels()["label_type"] : 
					axis == "Column" ? heatMap.getColLabels()["label_type"] : axis == "ColumnCovar" ? "ColumnCovar" : axis == "RowCovar"  ? "RowCovar" : "Matrix";
	for (i = 0; i < linkouts[labelType].length; i++){
		var clickable;
		if (labelType == "ColumnCovar" && getSearchLabelsByAxis("Column").length == 0){
			clickable = false;
		} else if (labelType == "RowCovar" && getSearchLabelsByAxis("Row").length == 0){
			clickable = false;
		} else if (linkouts[labelType][i].selectType == linkouts.SINGLE_SELECT && axisLabelsLength > 1){
			clickable = false;
		} else {
			clickable = true;
		}
		addMenuItemToTable(axis, table, linkouts[labelType][i], clickable);
	}
}


function addMenuItemToTable(axis, table, linkout,clickable){
	var body = table.getElementsByClassName('labelMenuBody')[0];
	var row = body.insertRow();
	var cell = row.insertCell();
	
	var functionWithParams = function(){ // this is the function that gets called when the linkout is clicked
		var input;
		switch (linkout.inputType){ // TO DO: make the function input types (ie: labels, index, etc) global constants. Possibly add more input types?
			case linkouts.VISIBLE_LABELS: input = linkouts.getVisibleLabels(axis); break;
			case linkouts.HIDDEN_LABELS: input = linkouts.getHiddenLabels(axis); break;
			case linkouts.FULL_LABELS: input = linkouts.getFullLabels(axis); break;
			case linkouts.POSITION: input = linkouts.getPositions(axis); break;
		}
		linkout.callback(input,axis); // all linkout functions will have these inputs!
	};
	if (linkout.reqAttributes == null){
		if (clickable){
			cell.innerHTML = linkout.title;
			cell.addEventListener('click', functionWithParams);
		} else{
			cell.innerHTML = linkout.title;
			cell.classList.add('unclickable');
			cell.addEventListener("click", selectionError)
		}
	} else {
		if (linkouts.getAttribute(linkout.reqAttributes)){
			if (clickable){
				cell.innerHTML = linkout.title;
				cell.addEventListener('click', functionWithParams);
			} else{
				cell.innerHTML = linkout.title;
				cell.classList.add('unclickable');
				cell.addEventListener("click", selectionError)
			}
		}
	}
}

function selectionError(e){
	var message = "Please select only one label in this axis to use the following linkout:\n\n" + e.currentTarget.innerHTML;
	alert(message);
}

function getDefaultLinkouts(){
	addLinkout("Copy " + heatMap.getColLabels().label_type +" to Clipboard", heatMap.getColLabels().label_type, linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS, copyToClipBoard,null,0);
	if (heatMap.getRowLabels().label_type !== heatMap.getColLabels().label_type){
		addLinkout("Copy " + heatMap.getRowLabels().label_type + " to Clipboard", heatMap.getRowLabels().label_type, linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS, copyToClipBoard,null,0);
	}
	addLinkout("Copy bar data for all labels", "ColumnCovar", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS,copyEntireClassBarToClipBoard,null,0);
	addLinkout("Copy bar data for selected labels", "ColumnCovar", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS,copyPartialClassBarToClipBoard,null,1);
	addLinkout("Copy bar data for all labels", "RowCovar", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS,copyEntireClassBarToClipBoard,null,0);
	addLinkout("Copy bar data for selected labels", "RowCovar", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS,copyPartialClassBarToClipBoard,null,1);
	addLinkout("Copy selected items to clipboard", "Matrix", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS,copySelectionToClipboard,null,1);
}

function linkout (title, inputType, selectType, reqAttributes, callback){ // the linkout object
	this.title = title;
	this.inputType = inputType; // input type of the callback function
	this.selectType = selectType;
	this.reqAttributes = reqAttributes;
	this.callback = callback;
}

function addLinkout(name, labelType, selectType, inputType, callback, reqAttributes, index){ // adds linkout objects to the linkouts global variable
	if (!linkouts[labelType]){
		linkouts[labelType] = [new linkout(name, inputType, selectType,reqAttributes, callback)];
	} else {
		if (index !== undefined){
			linkouts[labelType].splice(index, 0, new linkout(name,inputType, selectType, reqAttributes, callback)); 
		}else {
			linkouts[labelType].push(new linkout(name,inputType,selectType, reqAttributes, callback));
		}
	}
}

//===================//
// DEFAULT FUNCTIONS //
//===================//


function copyToClipBoard(labels,axis){
	window.open("","",'width=335,height=330,resizable=1').document.write(labels.join(", "));
}

function copyEntireClassBarToClipBoard(labels,axis){
	var newWindow = window.open("","",'width=335,height=330,resizable=1');
	var newDoc = newWindow.document;
	var axisLabels = axis == "ColumnCovar" ? heatMap.getColLabels()["labels"] : heatMap.getRowLabels()["labels"]; 
	var classBars = axis == "ColumnCovar" ? heatMap.getColClassificationData() : heatMap.getRowClassificationData(); 
	newDoc.write("Sample&emsp;" + labels.join("&emsp;") + ":<br>");
	for (var i = 0; i < axisLabels.length; i++){
		newDoc.write(axisLabels[i].split("|")[0] + "&emsp;");
		for (var j = 0; j < labels.length; j++){
			newDoc.write(classBars[labels[j]].values[i] + "&emsp;");
		}
		newDoc.write("<br>");
	}
}

function copyPartialClassBarToClipBoard(labels,axis){
	var newWindow = window.open("","",'width=335,height=330,resizable=1');
	var newDoc = newWindow.document;
	var axisLabels = axis == "ColumnCovar" ? getSearchLabelsByAxis("Column") : getSearchLabelsByAxis("Row");
	var labelIndex = axis == "ColumnCovar" ? getSearchCols() : getSearchRows(); 
	var classBars = axis == "ColumnCovar" ? heatMap.getColClassificationData() : heatMap.getRowClassificationData(); 
	newDoc.write("Sample&emsp;" + labels.join("&emsp;") + ":<br>");
	for (var i = 0; i < axisLabels.length; i++){
		newDoc.write(axisLabels[i].split("|")[0] + "&emsp;");
		for (var j = 0; j < labels.length; j++){
			newDoc.write(classBars[labels[j]].values[labelIndex[i]-1] + "&emsp;");
		}
		newDoc.write("<br>");
	}
}

function copySelectionToClipboard(labels,axis){
	console.log(labels,axis);
	window.open("","",'width=335,height=330,resizable=1').document.write("Rows: " + labels["Row"].join(", ") + "<br><br> Columns: " + labels["Column"].join(", "));
}