echo "1: " $1 # tool directory
echo "2: " $2 # manipulation option
echo "3: " $3 # input file
echo "4: " $4 # output file
echo "5: " $5 # choice
echo "6: " $6 # thresh
echo "7: " $7 # axis 
echo "8: " $8 # transpose
echo "9: " $9 # input2
echo "10: " $10 # offsetvalue
echo "11: " ${11} # scalevalue
#echo "12: " ${12} 
#echo "13: " ${13} 
#echo "14: " ${14} 
#echo "15: " ${15}
#echo "16: " ${16}

echo "tool directory is: " $1
if [ "$2" = "Matrix_Filters" ]; then
	echo "filter chosen"
	#python $__tool_directory__/Matrix_Filters.py '$p_input '${manipulation.extra.choice}' '${manipulation.extra.thresh}' '${manipulation.axis}' '$output_file'
	python $1/Matrix_Filters.py $3 $5 $6 $7 $4
elif [ "$2" = "Matrix_Multiply" ]; then
	echo "multiply chosen"
	#python '$__tool_directory__/Matrix_Multiply.py' '$p_input' '${manipulation.extra.transpose}' '${manipulation.extra.input2}' '${manipulation.extra.choice}' '$output_file'
	python $1/Matrix_Multiply.py $3 $8 $9 $5 $4
elif [ "$2" = "Matrix_Statistics" ]; then
	echo "statistics chosen"
	#python '$__tool_directory__/Matrix_Statistics.py' '$p_input' '$choice' '$cutoff' '$axis' '$out_file'
	python $1/Matrix_Statistics.py $3 $5 $6 $7 $4
elif [ "$2" = "Matrix_Transformations" ]; then
	echo "transform chosen"
	#python '$__tool_directory__/Matrix_Transformations.py' '$p_input' '$choice' '$axis' '$scalevalue' '$offsetvalue' '$output_file'
	python $1/Matrix_Transformations.py $3 $5 $7 ${11} ${10} $4
elif [ "$2" = "Matrix_Validations" ]; then
	echo "validations chosen"
	#python '$__tool_directory__/Matrix_Validations.py' '$p_input' '${manipulation.extra.choice}'  '${manipulation.extra.axis}' '$output_file'
	python $1/Matrix_Validations.py $3 $5 $7 $4
else
	echo "no valid choice made"
fi

