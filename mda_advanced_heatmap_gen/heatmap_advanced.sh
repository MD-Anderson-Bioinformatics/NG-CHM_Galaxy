#echo "1: " $1  " 2: " $2 " 3: " $3 " 4: " $4  " 5: " $5 " 6: " $6 " 7: " $7 " 8: " $8 " 9: " $9 " 10: " ${10} 
#echo "11: " ${11} " 12: " ${12} 13: " ${13} 14: " ${14} " 15: " ${15} " 16: " ${16} " 17: " ${17} " 18: " ${18} " 19: " ${19} " 20: " ${20} 
#echo "21: "${21}" 22: "${22}" 23: "${23}" 24: "${24}" 25: "${25}" 26: "${26}" 27: "${27}" 28: "${28}" 29: "${29}" 30: "${30}

#Count total number of parameters, dataLayer parameters, and classification parameters
parmSize=0
classSize=0
dataLayerSize=0
attribSize=0
for i in "$@"; do
	currParm=$(cut -d'|' -f1 <<< $i)
	parmSize=$((parmSize+1))
	if [ $currParm = "classification" ]
	then
		classSize=$((classSize+1))
  	fi
	if [ $currParm = "matrix_files" ]
	then
		dataLayerSize=$((dataLayerSize+1))
  	fi
	if [ $currParm = "attribute" ]
	then
		attribSize=$((attribSize+1))
  	fi
done

if [ $dataLayerSize -lt 1 ]
then
	noDataLayer="ERROR: No Heat Map Matrices provided.  Please add at least one Heat Map Matrix to your request and try again."
   	echo $noDataLayer
   	exit $noDataLayer
fi

#Get tool data and tool install directories
tooldir=$1
tooldata=$2
#create temp directory for row and col order and dendro files.
tdir=$tooldata/$(date +%y%m%d%M%S)
mkdir $tdir
#echo "tdir: "$tdir

#Extract parameters for row and column order and dendro files
rowOrderFile=$tdir/ROfile.txt
rowDendroFile=$tdir/RDfile.txt
colOrderFile=$tdir/COfile.txt
colDendroFile=$tdir/CDfile.txt
rowOrderJson='"order_file": "'$rowOrderFile'",'
rowDendroJson='"dendro_file": "'$rowDendroFile'",'
colOrderJson='"order_file": "'$colOrderFile'",'
colDendroJson='"dendro_file": "'$colDendroFile'",'

#BEGIN: Construct JSON for all non-repeating parameters
parmJson='{'
rowConfigJson='"row_configuration": {'
colConfigJson='"col_configuration": {'

ctr=0
for i in "$@"; do
	if [ $ctr -gt 1 ]
	then
		currParm=$(cut -d'|' -f1 <<< $i)
		if [ $currParm != "matrix_files" ] && [ $currParm != "row_configuration" ] && [ $currParm != "col_configuration" ] && [ $currParm != "classification" ] && [ $currParm != "attribute" ] && [ $currParm != "chm_name" ]
		then
			#Parse pipe-delimited parameter parameter
			parmJson=$parmJson' "'$(cut -d'|' -f1 <<< $i)'":"'$(cut -d'|' -f2 <<< $i)'",'
	  	fi
		if [ $currParm = "chm_name" ]
		then
			currVal=$(cut -d'|' -f2 <<< $i)
			currEdit=$(echo "$currVal"  | sed 's/\//_/g')		
			parmJson=$parmJson' "'$(cut -d'|' -f1 <<< $i)'":"'$currEdit'",'
	  	fi
		if [ $currParm = "row_configuration" ]
		then
			rowOrder=$(cut -d'|' -f3 <<< $i)
			rowDistance=$(cut -d'|' -f5 <<< $i)
			rowAgglomeration=$(cut -d'|' -f7 <<< $i)
			rowCuts=$(cut -d'|' -f9 <<< $i)
			rowLabels=$(cut -d'|' -f11 <<< $i)
			rowDataTypeJson='"'$(cut -d'|' -f10 <<< $i)'":["'$rowLabels'"],'
			rowCutType=$(cut -d'|' -f16 <<< $i)
			rowTopItemsJson=''
			rowTopItems=$(cut -d'|' -f13 <<< $i)
			if [ $rowTopItems != "None" ] && [ $rowTopItems != "" ]
			then
				rowTopItemsJson='"'$(cut -d'|' -f12 <<< $i)'": ['
				rowTopItems=${rowTopItems//,/'","'}
				rowTopItemsJson=$rowTopItemsJson'"'$rowTopItems'"],'
			fi
			rowCutsJson=''
			if [ $rowCutType != "none" ]
			then
				cutValues=$(cut -d'|' -f15 <<< $i) 
				if [ $cutValues != "None" ] && [ $cutValues != "0" ]
				then
					if [ $rowCutType = "treecuts" ]
					then
						rowCutsJson=$rowCutsJson'"tree_cuts": "'$cutValues'",' 
						rowCutsJson=$rowCutsJson'"cut_width": "5",' 
					fi
					if [ $rowCutType = "positional" ]
					then
						rowCutErrorVal=0
						[[ $cutValues != ?(-)+([0-9,]) ]] && rowCutErrorVal=$((rowCutErrorVal+1))
						if [ $rowCutErrorVal -gt 0 ]
						then
	   						echo "GALAXY PARAMETER WARNING: Non-numeric values found for Row Fixed Gap Locations. Ignoring parameter value: "$cutValues
						else
							rowCutsJson=$rowCutsJson'"cut_locations": ['$cutValues'],' 
							rowCutsJson=$rowCutsJson'"cut_width": "5",' 
						fi
					fi
				fi
			fi
			rowConfigJson=$rowConfigJson$rowDataTypeJson$rowCutsJson$rowTopItemsJson
			if [ $rowOrder = 'Hierarchical' ]
			then
				rowConfigJson=$rowConfigJson$rowOrderJson$rowDendroJson
			fi
			rowConfigJson=$rowConfigJson' "'$(cut -d'|' -f2 <<< $i)'":"'$(cut -d'|' -f3 <<< $i)'","'$(cut -d'|' -f4 <<< $i)'":"'$(cut -d'|' -f5 <<< $i)'","'$(cut -d'|' -f6 <<< $i)'":"'$(cut -d'|' -f7 <<< $i)'","'$(cut -d'|' -f17 <<< $i)'":"'$(cut -d'|' -f18 <<< $i)'","'$(cut -d'|' -f19 <<< $i)'":"'$(cut -d'|' -f20 <<< $i)'"},'
	  	fi
		if [ $currParm = "col_configuration" ]
		then
			colOrder=$(cut -d'|' -f3 <<< $i)
			colDistance=$(cut -d'|' -f5 <<< $i)
			colAgglomeration=$(cut -d'|' -f7 <<< $i)
			colCuts=$(cut -d'|' -f9 <<< $i)
			colLabels=$(cut -d'|' -f11 <<< $i)
			colDataTypeJson='"'$(cut -d'|' -f10 <<< $i)'":["'$colLabels'"],'
			colCutType=$(cut -d'|' -f16 <<< $i)
			colTopItemsJson=''
			colTopItems=$(cut -d'|' -f13 <<< $i)
			if [ $colTopItems != "None" ] && [ $colTopItems != "" ]
			then
				colTopItemsJson='"'$(cut -d'|' -f12 <<< $i)'": ['
				colTopItems=${colTopItems//,/'","'}
				colTopItemsJson=$colTopItemsJson'"'$colTopItems'"],'
			fi
			colCutsJson=''
			if [ $colCutType != "none" ]
			then
				cutValues=$(cut -d'|' -f15 <<< $i) 
				if [ $cutValues != "None" ] && [ $cutValues != "0" ]
				then
					if [ $colCutType = "treecuts" ]
					then
						colCutsJson=$colCutsJson'"tree_cuts": "'$cutValues'",' 
						colCutsJson=$colCutsJson'"cut_width": "5",' 
					fi
					if [ $colCutType = "positional" ]
					then
						colCutErrorVal=0
						[[ $cutValues != ?(-)+([0-9,]) ]] && colCutErrorVal=$((colCutErrorVal+1))
						if [ $colCutErrorVal -gt 0 ]
						then
	   						echo "GALAXY PARAMETER WARNING: Non-numeric values found for Column Fixed Gap Locations. Ignoring parameter value: "$cutValues
						else
							colCutsJson=$colCutsJson'"cut_locations": ['$cutValues'],' 
							colCutsJson=$colCutsJson'"cut_width": "5",' 
						fi
					fi
				fi
			fi
			colConfigJson=$colConfigJson$colDataTypeJson$colCutsJson$colTopItemsJson
			if [ $colOrder = 'Hierarchical' ]
			then
				colConfigJson=$colConfigJson$colOrderJson$colDendroJson
			fi
			colConfigJson=$colConfigJson' "'$(cut -d'|' -f2 <<< $i)'":"'$(cut -d'|' -f3 <<< $i)'","'$(cut -d'|' -f4 <<< $i)'":"'$(cut -d'|' -f5 <<< $i)'","'$(cut -d'|' -f6 <<< $i)'":"'$(cut -d'|' -f7 <<< $i)'","'$(cut -d'|' -f17 <<< $i)'":"'$(cut -d'|' -f18 <<< $i)'","'$(cut -d'|' -f19 <<< $i)'":"'$(cut -d'|' -f20 <<< $i)'"},'
	  	fi
	 fi
	 ctr=$((ctr+1))
done

#END: Construct JSON for all non-repeating parameters
#echo "rowOrder: "$rowOrder
#echo "rowDistance: "$rowDistance
#echo "rowAgglomeration: "$rowAgglomeration
#echo "rowCuts: "$rowCuts
#echo "rowLabels: "$rowLabels
#echo "ROW CONFIG JSON: "$rowConfigJson
#echo "colOrder: "$colOrder
#echo "colDistance: "$colDistance
#echo "colAgglomeration: "$colAgglomeration
#echo "colCuts: "$colCuts
#echo "colLabels: "$colLabels
#echo "COL CONFIG JSON: "$colConfigJson

#BEGIN: Construct JSON for data layers
matrixJson='"matrix_files": [ '
inputMatrix=''
dataLayerIter=0
dataLayerNames=''
for i in "$@"; do
	currParm=$(cut -d'|' -f1 <<< $i)
	if [ $currParm = "matrix_files" ]
	then
		if [ $dataLayerIter -lt 1 ]		
		then
			inputMatrix=$(cut -d'|' -f3 <<< $i)
		fi
		currMatrixName=$(cut -d'|' -f5 <<< $i)
		dataLayerIter=$((dataLayerIter+1))
  		if [[ $dataLayerNames =~ $currMatrixName ]]
		then
   			currMatrixName=$currMatrixName$dataLayerIter
		fi 
  		dataLayerNames=$dataLayerNames$currMatrixName
  		colorPref=$(cut -d'|' -f16 <<< $i)
  		colorMapJson=''
  		if [ $colorPref = "defined" ]
		then
			#validations to place leading zero on first breakpoint (if necessary)
			b1=$(cut -d'|' -f20 <<< $i)
			b1first=$(cut -d'.' -f1 <<< $b1)
			if [ $b1first = "-" ]
			then 
				b1="-0."$(cut -d'.' -f2 <<< $b1)
			fi
			if [ "$b1first" = "" ]
			then 
				b1="0"$b1
			fi
			#validations to place leading zero on second breakpoint (if necessary)
			b2=$(cut -d'|' -f21 <<< $i)
			b2first=$(cut -d'.' -f1 <<< $b2)
			if [ $b2first = "-" ]
			then 
				b2="-0."$(cut -d'.' -f2 <<< $b2)
			fi
			if [ "$b2first" = "" ]
			then 
				b2="0"$b2
			fi
			#validations to place leading zero on third breakpoint (if necessary)
			b3=$(cut -d'|' -f22 <<< $i)
			b3first=$(cut -d'.' -f1 <<< $b3)
			if [ $b3first = "-" ]
			then 
				b3="-0."$(cut -d'.' -f2 <<< $b3)
			fi
			if [ "$b3first" = "" ]
			then 
				b3="0"$b3
			fi
			#validation to ensure that all entered breakpoints are numeric values
			regExp='^[+-]?([0-9]+\.?|[0-9]*\.[0-9]+)$'
		    if [[ $b1 =~ $regExp ]] && [[ $b2 =~ $regExp ]] && [[ $b3 =~ $regExp ]]
		    then
				colorMapJson=$colorMapJson'"color_map": {"colors": ["'$(cut -d'|' -f17 <<< $i)'","'$(cut -d'|' -f18 <<< $i)'","'$(cut -d'|' -f19 <<< $i)'"],'
				colorMapJson=$colorMapJson'"thresholds": ['$b1','$b2','$b3'],'
				colorMapJson=$colorMapJson'"missing":"'$(cut -d'|' -f23 <<< $i)'"},'
		    else
		        echo "GALAXY PARAMETER WARNING: Not all user-defined breakpoints are numbers. Defined breakpoints and colors will be ignored."
		    fi
		fi  		
		#Parse pipe-delimited parameter parameter
		matrixJson=$matrixJson' {'$colorMapJson'"'$(cut -d'|' -f2 <<< $i)'":"'$(cut -d'|' -f3 <<< $i)'","'$(cut -d'|' -f4 <<< $i)'":"'$currMatrixName'","'$(cut -d'|' -f6 <<< $i)'":"'$(cut -d'|' -f7 <<< $i)'","'$(cut -d'|' -f8 <<< $i)'":"'$(cut -d'|' -f9 <<< $i)'","'$(cut -d'|' -f10 <<< $i)'":"'$(cut -d'|' -f11 <<< $i)'","'$(cut -d'|' -f12 <<< $i)'":"'$(cut -d'|' -f13 <<< $i)'","'$(cut -d'|' -f14 <<< $i)'":"'$(cut -d'|' -f15 <<< $i)'"}'
		if [ $dataLayerIter -lt $dataLayerSize ]		
		then
			matrixJson=$matrixJson','
		fi
  	fi
done
matrixJson=$matrixJson"],"
#END: Construct JSON for data layers
#echo "DATA LAYER JSON: "$matrixJson
#echo "INPUT MATRIX: "$inputMatrix

#BEGIN: Construct JSON for attributes
attribJson='"chm_attributes": [ '
attribIter=0
for i in "$@"; do
	currParm=$(cut -d'|' -f1 <<< $i)
	if [ $currParm = "attribute" ]
	then
		attribIter=$((attribIter+1))
		attribParam=$(cut -d'|' -f2 <<< $i)
		#Parse pipe-delimited 2-part data layer parameter
		attribJson=$attribJson' {"'$(cut -d':' -f1 <<< $attribParam)'":"'$(cut -d':' -f2 <<< $attribParam)'"}'
		if [ $attribIter -lt $attribSize ]		
		then
			attribJson=$attribJson','
		fi
  	fi
done
attribJson=$attribJson'],'
#END: Construct JSON for attributes
#echo "ATTRIB JSON: "$attribJson

#BEGIN: Construct JSON for classification files
classJson='"classification_files": [ '
colCutClass=''
rowCutClass=''
if [ $rowCuts -gt 1 ]
then
	rowCutClass='{"name": "Class", "path": "'$tdir'/ROfile.txt.cut","position": "row", "color_map": {"type": "discrete"}, "bar_type": "color_plot"}'
fi

if [ $colCuts -gt 1 ]
then
	if [ $rowCuts -gt 1 ] 
	then
		rowCutClass=$rowCutClass','
	fi
	colCutClass='{"name": "Class", "path": "'$tdir'/COfile.txt.cut","position": "column", "color_map": {"type": "discrete"}, "bar_type": "color_plot"}'
	if [ $classSize -gt 0 ] 
	then
		colCutClass=$colCutClass','
	fi
else
	if [ $rowCuts -gt 1 ] && [ $classSize -gt 0 ] 
	then
		rowCutClass=$rowCutClass','
	fi
fi

classJson=$classJson$rowCutClass$colCutClass
classIter=0
for i in "$@"; do
	currParm=$(cut -d'|' -f1 <<< $i)
	if [ $currParm = "classification" ]
	then
		classIter=$((classIter+1))
		className=$(cut -d'|' -f3 <<< $i)
		#Parse pipe-delimited 3-part classification bar parameter
		if [[ -z "$className" ]]; then
		   className="covar"$classIter
		fi
		classJson=$classJson' {"'$(cut -d'|' -f2 <<< $i)'":"'$className'","'$(cut -d'|' -f4 <<< $i)'":"'$(cut -d'|' -f5 <<< $i)'","'$(cut -d'|' -f8 <<< $i)'":"'$(cut -d'|' -f9 <<< $i)'","'$(cut -d'|' -f12 <<< $i)'":"'$(cut -d'|' -f13 <<< $i)'","'$(cut -d'|' -f14 <<< $i)'":"'$(cut -d'|' -f15 <<< $i)'"'
		classCat=$(cut -d'|' -f7 <<< $i)
		classColorType=$(cut -d'_' -f2 <<< $classCat)
		classJson=$classJson','
		classHeight=$(cut -d'|' -f11 <<< $i)
		heightErrorVal=0
		[[ $classHeight != ?(-)+([0-9]) ]] && heightErrorVal=$((heightErrorVal+1))
		if [ $heightErrorVal -gt 0 ]
		then
			echo 'GALAXY PARAMETER WARNING: Non-numeric values found for covariate bar ('$className') height.  Height value ignored and default of 15 used: '$classHeight
		else
			classJson=$classJson'"height": "'$classHeight'",' 
		fi
		classJson=$classJson' "position":"'$(cut -d'_' -f1 <<< $classCat)'","color_map": {"type":"'$classColorType'"}}'
		if [ $classIter -lt $classSize ]		
		then
			classJson=$classJson','
		fi
  	fi
done
classJson=$classJson']'
#END: Construct JSON for classification files
#echo "CLASSIFICATION JSON: "$classJson

#Complete construction of Parameter JSON file by adding all JSON sections created above
parmJson=$parmJson$rowConfigJson$colConfigJson$attribJson$matrixJson$classJson
parmJson=$parmJson'}'
#echo "COMPLETED PARAMETER JSON: "$parmJson

#run R to cluster matrix
output="$(R --slave --vanilla --file=$tooldir/CHM_Advanced.R --args $inputMatrix $rowOrder $rowDistance $rowAgglomeration $colOrder $colDistance $colAgglomeration $rowOrderFile $colOrderFile $rowDendroFile $colDendroFile $rowCuts $colCuts $rowLabels $colLabels 2>&1)"
# Check for errors from R step, log them if found, and exit script
rc=$?;
if [ $rc != 0 ]
then
  echo $output;
  if [ `echo "$output" | grep -c "Inf in foreign function call"` -gt 0 ]
  then
    echo "";
    echo "";
    echo "R CLUSTERING: Error in clustering the matrix provided (View Details  stdout).   "
    echo "Note: This error can occur when:"
    echo "   1. There is invalid numeric data in the matrix provided. Try using Matrix Manipulation tools to fix invalid data.";
    echo "   2. There is no variation in a row or column in the matrix.  Try a different distance measure or remove rows/columns without variation using Matrix Manipulation tools.";
    echo "   3. A covariate file has inadvertently been selected as an Input Matrix.  Check your Input Matrix entry.";
  fi
  exit $rc;
fi
 
#Call java program to generate NGCHM viewer files.
java -jar $tooldir/GalaxyMapGen.jar "$parmJson"
#clean up tempdir
rm -rf $tdir
