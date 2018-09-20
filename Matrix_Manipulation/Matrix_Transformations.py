'''
Created on Jun 6, 2017  updated Feb 2018

@author: cjacoby and Bob Brown
'''
import os
import sys, traceback, argparse
import numpy as np
from numpy import size, array
import warnings
from Matrix_Validate_import import reader
#import scipy.stats as ss
warnings.filterwarnings('error')

#Define argparse Function
def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_file_txt', help='text file input matrix(include .txt in name)')
    parser.add_argument('choice', type=str, help='Choose normalization Method: 1 = Z-score, 2 = Mean Centered, 3 = log2, 4= rank')
    parser.add_argument('axes', type=str, help='Choose Axis to normalize On (Row or Column)')
    parser.add_argument('scalevalue', help='optional scaling factor for matrix)')
    parser.add_argument('offsetvalue', help='optional offset for matrix')
    parser.add_argument('output_file_txt', help='text file output matrix(include .txt in name)')
    args = parser.parse_args()
    return args


def Zscore_row(matrix):

    #Loop To Perform Z-Score normalization
    for i in range(0,len(matrix)):
        temp_mean = np.nanmean(matrix[i])
        temp_stdev = np.nanstd(matrix[i],ddof=1)
        for j in range(0,len(matrix[0])):
            matrix[i][j] = (matrix[i][j]-temp_mean)/temp_stdev
    return(matrix)

#Define Z-Score normalization Function
def Zscore_col(matrix):

    #Loop To Perform Z-Score normalization
    for i in range(len(matrix[0])):
#            matrix[:][i] = [scaleValue*x+offset for x in matrix[i]] 
        temp_mean = np.nanmean([row[i] for row in matrix])
        temp_stdev = np.nanstd([row[i] for row in matrix],ddof=1)
        #Probably Should Have if statement checking if stdev equals zero, although this implies the data is already Z-score normalized
        for j in range(len(matrix)):
            matrix[j][i] = (matrix[j][i]-temp_mean)/temp_stdev
    return(matrix)


#Define Mean Centered or Median centered normalization Function
def MeanMedianCenter_row(matrix,type):

    
    #Loop To Perform mean or median center
    for i in range(0,len(matrix)):
        if type == "mean": 
            temp_type = np.nanmean(matrix[i][1::])
        else:
            temp_type = np.nanmedian(matrix[i][1::])
            
        for j in range(0,len(matrix[0])):
            matrix[i][j] = (matrix[i][j]-temp_type)
    return(matrix)


#Define mean or median
def MeanMedianCenter_col(matrix,type):

    #Loop To Perform mean or median center
    for i in range(0,len(matrix[0])):
        if type == "mean": 
            temp_type = np.nanmean([row[i] for row in matrix])
        else:
            temp_type = np.nanmedian([row[i] for row in matrix])
        #Probably Should Have if statement checking if stdev equals zero, although this implies the data is already Z-score normalized
        for j in range(0,len(matrix)):
            matrix[j][i] = (matrix[j][i]-temp_type)
    return(matrix)

#Divide by sum of the Row Function
def Divide_By_Sum_row(matrix):
 
    #Loop To Perform mean or median center
    numRow,numCol= np.shape(matrix)
    
    for i in range(numRow):
        sumValue = sum(matrix[i][:])

        #if equals zero
        if abs(sumValue) > .0001:
            for j in range(numCol):
                matrix[i][j] = matrix[i][j]/sumValue
        else: 
            print("ERROR Cannot divide by Sum almost zero", str(sumValue), " for Row ",str(i+1))
    return(matrix)


#Divide by sum of the Column Function
def Divide_By_Sum_col(matrix):

    #Loop To Perform mean or median center
    numRow,numCol= np.shape(matrix)
    
    for i in range(numCol):
        sumValue= 0

        #if equals zero
        if abs(sumValue) > .0001:
            for j in range(numRow):
                matrix[j][i] = (matrix[j][i]/sumValue)
        else: 
            print("ERROR Cannot divide by Sum almost zero", str(sumValue), " for Column ",str(i+1))
    return(matrix)

#scale or add offset to matrix by row 
def ScaleOffset_row(matrix,scaleValue,offset):

    #Loop To Perform scale and offset do one or the other per request
    if abs(scaleValue) > 0.0001:
        for i in range(0,len(matrix)):
            matrix[i][:] = [scaleValue*x+offset for x in matrix[i]] 
    else:
        print (" Scale facter "+str(scaleValue)+" too small")
    return(matrix)

#scale or add offset to matrix by column
def ScaleOffset_col(matrix,scaleValue,offset):

    #Loop To Perform scale and offset do one or the other per request
    if abs(scaleValue) > 0.0001:
        for i in range(0,len(matrix[0])):
            matrix[:][i] = [scaleValue*x+offset for x in matrix[i]] 
    else:
        print (" Scale facter "+str(scaleValue)+" too small")
    return(matrix)

#Define Log2 normalization Method
def Convert2Logs(matrix,logValue, offset):
    import warnings
    warnings.filterwarnings('error')

    #Loop To Perform Z-Score normalization
    for i in range(0,len(matrix)):
        for j in range(0,len(matrix[0])):
            try:
                if logValue == "log2":
                    matrix[i][j] = np.log2(matrix[i][j]+offset)
                else:
                    matrix[i][j] = np.log10(matrix[i][j]+offset)
                    
            except RuntimeWarning:
                print(logValue+" normalization Failed: Encountered elements <= 0, which are invalid inputs for a Log normalization")
                break
        else:
            continue
        break
    return(matrix) 

#transpose matrix
def Transpose(in_mat):
    out_mat     = []
    numRow,numCol= np.shape(in_mat)
    
    for i in range(numCol):
        temp= []
        for j in range(numRow):
            temp.append(in_mat[j][i])
        out_mat.append(temp)
    #print( str(out_mat))
    return out_mat

# restores row and column labels in ouput
def labeler(matrix,og_cols,og_rows,output_file_txt):
    #Define Null Sets For Col and Row Headers
    with open(output_file_txt,'w') as f:
        f.write("")
        for k in range(0,len(og_cols)):
                f.write('\t' + str(og_cols[k]) )
        f.write('\n')
        for i in range(0,len(og_rows)):
                f.write(str(og_rows[i]) )
                for j in range(0,len(matrix[0])):
                        f.write('\t' + format(matrix[i][j]))
                f.write('\n')

#Define Main Function
def main():

    try:
        args = get_args()
        scaleValue = float(args.scalevalue)
        offsetValue= float(args.offsetvalue)
        #print(args)
        #sys.stdout.write(str(args)+"\n")

        matrix,og_cols,og_rows = reader(args.input_file_txt)
        if args.choice == "z_score_normalization":
            if args.axes == "Row":
                matrix = Zscore_row(matrix)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("zcore, row")
            elif args.axes == "Column":
                matrix = Zscore_col(matrix)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("zscore, column")
            else:
                print("zscore, invalid axis")
        elif args.choice == "mean_center_normalization":
            if args.axes == "Row":
                matrix = MeanMedianCenter_row(matrix,"mean")
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("mean-center by row")
            elif args.axes == "Column":
                matrix = MeanMedianCenter_col(matrix,"mean")
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("mean-center by column")
            else:
                print("meancenter, invalid axis")
        elif args.choice == "median_center_normalization":
            if args.axes == "Row":
                matrix = MeanMedianCenter_row(matrix,"median")
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("median-center by row")
            elif args.axes == "Column":
                matrix = MeanMedianCenter_col(matrix,"median")
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("median-center by column")
            else:
                print("meancenter, invalid axis")
        elif args.choice == "add_offset":
            if args.axes == "Row":
                #offset = -100 #!!!! TODO REMOVE AND ADD WHEN clause to xml to get value                
                matrix = ScaleOffset_row(matrix,1.0,offsetValue)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("offset of "+str(offsetValue)+" by row")
            elif args.axes == "Column":
                matrix = ScaleOffset_col(matrix,1.0,offsetValue)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("offset of "+str(offsetValue)+" by column")
            else:
                print("offset"+str(offsetValue)+" invalid axis -not row or column")
        elif args.choice == "scale":
            if args.axes == "Row":
                #scaleValue = 1000 #!!!! TODO REMOVE AND ADD WHEN clause to xml to get value
                matrix = ScaleOffset_row(matrix,scaleValue,0.0)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("scaling "+str(scaleValue)+" by row")
            elif args.axes == "Column":
                matrix = ScaleOffset_col(matrix,scaleValue,0.0)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("scaling "+str(scaleValue)+" by column")
            else:
                print("scaling "+scale+" invalid axis")
        elif args.choice == "transpose":
            matrix = Transpose(matrix)  #issue using same  matrix? 
            labeler(matrix,og_rows,og_cols,args.output_file_txt) #swapped row&col labels
            print("transpose mxn matrix to nxm size")
        elif args.choice == "ln_normalization":
            matrix = Convert2Logs(matrix,"log2",offsetValue)
            labeler(matrix,og_cols,og_rows,args.output_file_txt)
            print("log2 plus "+str(offsetValue)+" normalization for all values")
        elif args.choice == "log_normalization":
            matrix = Convert2Logs(matrix,"log10",offsetValue)
            labeler(matrix,og_cols,og_rows,args.output_file_txt)
            print("log10 normalization for all values")
        elif args.choice == "rank":
            if args.axes == "Row":
                matrix = Rankdata_ByRow(matrix)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("performed rank normalization by row")
            elif args.axes == "Column":
                matrix = Rankdata_ByColumn(matrix)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("performed rank normalization by column")
            else:
                print("rank, invalid axis")
        elif args.choice == "divide_by_sum":
            if args.axes == "Row":
                matrix = Divide_By_Sum_row(matrix)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("performed divide row N values by row N's sum")
            elif args.axes == "Column":
                matrix = Divide_By_Sum_col(matrix)
                labeler(matrix,og_cols,og_rows,args.output_file_txt)
                print("performed divide column N values by column N's sum")
            else:
                print("divide_by_sum, invalid axis")

        else:
            print("Invalid normalization Choice")
       
    except Exception as err:
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
    print("Done")
