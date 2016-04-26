// This string contains the entire configuration.json file.  This was previously located in a JSON file stored with the application code
// but has been placed here at the top of the CompatibilityManager class so that the configuration can be utilized in File Mode.
var jsonConfigStr = "{\"row_configuration\": {\"classifications\": {\"show\": \"Y\",\"height\": 15},\"organization\": {\"agglomeration_method\": \"unknown\","+
			"\"order_method\": \"unknown\",\"distance_metric\": \"unknown\"},\"dendrogram\": {\"show\": \"ALL\",\"height\": \"100\"}},"+
			"\"col_configuration\": {\"classifications\": {\"show\": \"Y\",\"height\": 15},"+
		    "\"organization\": {\"agglomeration_method\": \"unknown\",\"order_method\": \"unknown\",\"distance_metric\": \"unknown\"},"+
		    "\"dendrogram\": {\"show\": \"ALL\",\"height\": \"100\"}},\"data_configuration\": {\"map_information\": {\"data_layer\": {"+
		    "\"name\": \"Data Layer\",\"grid_show\": \"Y\",\"grid_color\": \"#FFFFFF\"},\"name\": \"CHM Name\",\"description\": \"Full length description of this heatmap\"}}}";

/**********************************************************************************
 * FUNCTION - CompatibilityManager: The purpose of the compatibility manager is to 
 * find any standard configuration items that might be missing from the configuration 
 * of the heat map that is currrently being opened.  There is a "current" configuration
 * default file (configuration.json) stored in the projects WebContent folder. At
 * startup this file is loaded by chm.html.  
 * 
 * This function retrieves that JSON object and constructs a comparison object tree 
 * (jsonpath/default value).  Then another comparison object tree is created from 
 * the mapConfig JSON object (jsonpath/value) representing the heatmap being opened.  
 * 
 * For each element in the default configuration object tree, the heatmap configuration
 * object tree is searched.  If no matching object is found, one is created in the
 * heatmap configuration file.  If an edit was required during the comparison process,
 * the heatmaps mapConfig file is updated to permanently add the new properties.
 **********************************************************************************/
function CompatibilityManager(mapConfig){
	var foundUpdate = false;
	var jsonConfig = JSON.parse(jsonConfigStr);
	//Construct comparison object tree from default configuration
	var configObj = {}
	buildConfigComparisonObject(jsonConfig, '', configObj, mapConfig);
	//Construct comparison object tree from the heatmap's configuration
	var mapObj = {}
	buildConfigComparisonObject(mapConfig, '', mapObj);
	//Loop thru the default configuration object tree searching for matching
	//config items in the heatmap's config obj tree.
	for (var key in configObj) {
		var searchItem = key;
		var searchValue = configObj[key];
		var found = false;
		for (var key in mapObj) {
			if (key === searchItem) {
				found = true;
				break;
			}
		}
		//If config object not found in heatmap config, add object with default
		if (found === false) {
			var searchPath = searchItem.substring(1, searchItem.lastIndexOf("."));
			var newItem = searchItem.substring(searchItem.lastIndexOf(".")+1, searchItem.length);
			var parts = searchPath.split(".");
			var obj = mapConfig;
			for (i=0;i<parts.length;i++) {
				obj = obj[parts[i]];
			}
			obj[newItem] = searchValue;
			foundUpdate = true;
		}
	}
	//If any new configs were added to the heatmap's config, save the config file.
	if (foundUpdate === true) {
		var success = heatMap.saveHeatMapProperties(1);
	}
}

/**********************************************************************************
 * FUNCTION - buildConfigComparisonObject: The purpose of this function is to construct
 * a 2 column "comparison" object from either the default heatmap properties OR the
 * heatmap properties of the map that is currently being opened.
 * 
 * For the current map, the full path to each configuration item is added, along 
 * with its associated value, to the comparison object.
 * 
 * For the default configuration, an additional step is performed using the contents
 * of the current map.  The default configuration does not know how many data layers
 * and/or classification bars that the current heatmap has.  So we loop thru the 
 * current heatmap's list of layers/classes and add a default layer/class config for 
 * each layer/class to the default configuration comparison tree.
 **********************************************************************************/
function buildConfigComparisonObject(obj, stack, configObj, mapConfig) {
    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] == "object") {
            	buildConfigComparisonObject(obj[property], stack + '.' + property, configObj, mapConfig);
            } else {
               var jsonPath = stack+"."+property;
                //If we are processing the default config object tree, use the heatmap's config object to retrieve
                //and insert keys for each data layer or classification bar that exists in the heatmap.
                if (typeof mapConfig !== 'undefined') {
	                if (stack.indexOf("row_configuration.classifications") > -1) {
		    			var classes = mapConfig.row_configuration.classifications;
		    			for (key in classes) {
							var jsonPathNew = stack+"."+key+"."+property;
	                		configObj[jsonPathNew] = obj[property];
		    			}
	                } else if (stack.indexOf("col_configuration.classifications") > -1) {
		    			var classes = mapConfig.col_configuration.classifications;
		    			for (key in classes) {
							var jsonPathNew = stack+"."+key+"."+property;
	                		configObj[jsonPathNew] = obj[property];
		    			}
	                } else if (stack.indexOf("data_layer") > -1) {
		    			var layers = mapConfig.data_configuration.map_information.data_layer;
		    			for (key in layers) {
							var jsonPathNew = stack+"."+key+"."+property;
							var value = obj[property];
							if (property === 'name') {
								value = value + " " + key;
							}
	                		configObj[jsonPathNew] = value;
		    			}
	                } else {
						configObj[jsonPath] = obj[property];
	                }
                } else {
					configObj[jsonPath] = obj[property];
                }
            }
        }
    }
}

