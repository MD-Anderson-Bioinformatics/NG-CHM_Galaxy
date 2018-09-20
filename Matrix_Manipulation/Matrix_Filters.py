'''
Created on Jun 7, 2017 updated Feb2018

@author: rbrown and cjacoby
'''

import sys, traceback, argparse
import numpy as np
from Matrix_Validate_import import reader, Labeler
import math
import matplotlib.pyplot as plt

#Define argparse Function
def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_file_txt', help='tab delimited text file input matrix(include .txt in name)')
    parser.add_argument('choice',type=str, help='Variance Filter Method (Variance or Range)')
    parser.add_argument('thresh', help='Thershold for Variance Filtering')
    parser.add_argument('axes', help='Axes to Filter on (Either Row or Column')
    parser.add_argument('output_file_txt', help='tab delimited text file output name (include .txt in name)')
    args = parser.parse_args()
    return args

def Range_Filter_Row(matrix,thresh,row_header_list,column_header_list):
    #Create Null Set of Filtered Row(Populated Later)
    deletes = []
    minVal  = +9999999
    maxVal  = -99999
    #Loop to Determine Which Rows have sub-Threshold Range
    for i in range(0,len(matrix)):
        temp_range = np.max(matrix[i][0::]) - np.min(matrix[i][0::])

        if temp_range < minVal:    minVal = temp_range
        elif temp_range > maxVal:  maxVal = temp_range

        if temp_range <= float(thresh):
            deletes = np.append(deletes,[i],0)
            
    #Delete Rows sub-Threshold Rows       
    matrix = np.delete(matrix,deletes,0)
    filter_rows = np.delete(row_header_list,deletes,0)
    filter_cols = column_header_list
    return matrix, filter_rows, filter_cols,len(deletes),minVal,maxVal

def Range_Filter_Col(matrix,thresh,row_header_list,column_header_list):
    #Create Null Set of Filtered Row(Populated Later)
    deletes = []
    minVal  = +9999999
    maxVal  = -99999
    #Loop to Determine Which Rows have sub-Threshold Variance
    for i in range(0,len(matrix[0])):
        
        temp_range = np.max([row[i] for row in matrix]) - np.min([row[i] for row in matrix]) 

        if temp_range < minVal:    minVal = temp_range
        elif temp_range > maxVal:  maxVal = temp_range
        
        #print(temp_stdev)
        if temp_range <= float(thresh):
            deletes = np.append(deletes,[i],0)
    print(deletes)

    #Delete Rows sub-Threshold Rows       
    matrix = np.delete(matrix,deletes,1)
    filter_rows = row_header_list
    filter_cols = np.delete(column_header_list,deletes,0)
    #np.savetxt('testtest.txt',matrix,delimiter='\t')
    
    return matrix, filter_rows, filter_cols,len(deletes),minVal,maxVal

#Define Function Which Deletes Sub-Threshold Rows
def Variance_Percent_Filter_row(matrix,cutoff,row_header_list,column_header_list, create_plot= False):
# if create a plot then DO NOT remove DATA only print diagram of variance ranges !!!

#        temp_stdev = np.var(matrix[i][1::])
    #cutoff is the percentile rank of the variance values
    cutoff= int(cutoff)/100.0
    if cutoff > 0.99 or cutoff < .01:
        sys.stderr.write( "ERROR illegal cutoff value= "+str(cutoff*100)+" allowed values 1 to 99")
        sys.exit(-8)
        
    deletes = []
    varianceDict = {}
    minVal  = +9999999
    maxVal  = -99999
    
    #Loop to Determine Which Rows have sub-Threshold Variance
    for i in range(len(matrix)):
        vector   = []
        for p in range(len(matrix[0])):
            if not math.isnan(matrix[i][p]): 
                vector.append(matrix[i][p])
        
        #temp_stdev = np.var(matrix[:,i])
        if len(vector) > 1:
            temp_stdev = np.var(vector)
        else:
            temp_stdev = 0.0
            
        if temp_stdev < minVal:    
            minVal = temp_stdev
        elif temp_stdev > maxVal:  
            maxVal = temp_stdev

        if temp_stdev not in varianceDict:
            varianceDict[temp_stdev] = [i]
        else:
            tmp= varianceDict[temp_stdev]
            tmp.append(i)
            varianceDict[temp_stdev] = tmp

        
    #calc how many rows to remove
    lowerLimit = int(cutoff*len(matrix) +1)
    limit      = False
    cnt        = 0
    
    for key in sorted(varianceDict.items()):
        #rows = varianceDict[key]
        rows= key[1]
        cnt += len(rows)
        if cnt < lowerLimit: #remove rows below percentile cutoff
            for j in rows:
                deletes = np.append(deletes,[j],0)
                #print(deletes)
        else:
            limit = True

    print( "Dataset Lowest Variance= %.2f" % minVal+" Highest Variance= %.2f" % maxVal+" and Percentile cutoff row = "+str(lowerLimit)+" of "+str(len(matrix))+" rows")            


    #Delete Rows sub-Threshold Rows       
    matrix = np.delete(matrix,deletes,0)
    filter_rows = np.delete(row_header_list,deletes,0)
    filter_cols = column_header_list
    #np.savetxt('testtest.txt',matrix,delimiter='\t')

    
    if create_plot:    
        numBins  = 10
        binWidth = 1
        binCat   = []
        binData  = []
        counted  = False
        incrmnt= (maxVal-minVal)/(numBins-1)
        current_bin_max = minVal + incrmnt/2     
        cnt    = 0
        for key, val in sorted(varianceDict.items()):
            if key < current_bin_max:
                cnt += len(val)   # add all  rows having that variance value
                counted  = False
            else:
                binData.append(cnt)
                cnt= len(val)
                binCat.append(str("%0.2f" % (current_bin_max - incrmnt/2.0)))
                current_bin_max += incrmnt  
                counted = True   

        if not counted:
            binData.append(cnt)
            binCat.append(str("%0.2f" % (current_bin_max - incrmnt/2.0)))
                           
        tot = sum(binData)       
        bins     = []                
        for j in range(numBins):
            bins.append(j*binWidth)
    #ttps://pythonspot.com/matplotlib-bar-chart/
        y_pos = np.arange(numBins)
        plt.xticks(y_pos, binCat)
        plt.title("Distribution of Variance Values by Row")
        plt.ylabel('Variance  Bin Totals')
        plt.xlabel('Variance Value Bins')
        #plt.legend()
        plt.bar(y_pos, binData, align='center', alpha=0.5)
    
        fig, ax = plt.subplots(num=1, figsize=(8,3))
        
        plt.show()

    
    
    return matrix,filter_rows,filter_cols ,len(deletes), minVal,maxVal
            
def Variance_Percent_Filter_col(matrix,cutoff,row_header_list,column_header_list, create_plot=False):
    #cutoff is the percentile rank of the variance values
    cutoff= int(cutoff)/100.0
    if cutoff > 0.99 or cutoff < .01:
        sys.stderr.write( "ERROR illegal cutoff value= "+str(cutoff*100)+" allowed values 1 to 99")
        sys.exit(-8)
        
    deletes = []
    varianceDict = {}
    minVal  = +9999999
    maxVal  = -99999
    lenCol  = len(matrix[0])
    
    #Loop to Determine Which Rows have sub-Threshold Variance
    for i in range(lenCol):
        vector   = []
        for p in range(len(matrix)):
            if not math.isnan(matrix[p][i]): 
                vector.append(matrix[p][i])
        
        #temp_stdev = np.var(matrix[:,i])
        if len(vector) > 1:
            temp_stdev = np.var(vector)
        else:
            temp_stdev = 0.0
            
        if temp_stdev < minVal:    
            minVal = temp_stdev
        elif temp_stdev > maxVal:  
            maxVal = temp_stdev

        if temp_stdev not in varianceDict:
            varianceDict[temp_stdev] = [i]
        else:
            tmp= varianceDict[temp_stdev]
            tmp.append(i)
            varianceDict[temp_stdev] = tmp

        #print(temp_stdev)
        #if temp_stdev <= float(cutoff):
        
    #calc how many rows to remove
    lowerLimit = int(cutoff*lenCol +1)
    limit      = False
    cnt        = 0
    
    for key in sorted(varianceDict.items()):
        #rows = varianceDict[key]
        cols= key[1]
        cnt += len(cols)
        if cnt < lowerLimit: #remove rows below percentile cutoff
            for j in cols:
                deletes = np.append(deletes,[j],0)
                #print(deletes)
        else:
            limit = True

    print( "Dataset Lowest Variance= %.2f" % minVal+" Highest Variance= %.2f" % maxVal+" and Percentile cutoff column= "+str(lowerLimit)+" of "+str(lenCol)+" columns")            

    matrix = np.delete(matrix,deletes,1)
    filter_rows = row_header_list
    filter_cols = np.delete(column_header_list,deletes,0)
    #np.savetxt('testtest.txt',matrix,delimiter='\t')

    if create_plot:    
        numBins  = 10
        binWidth = 1
        binCat   = []
        binData  = []
        counted  = False
        incrmnt= (maxVal-minVal)/(numBins-1)
        current_bin_max = minVal + incrmnt/2     
        cnt    = 0
        for key, val in sorted(varianceDict.items()):
            if key < current_bin_max:
                cnt += len(val)   # add all  rows having that variance value
                counted  = False
            else:
                binData.append(cnt)
                cnt= len(val)
                binCat.append(str("%0.2f" % (current_bin_max - incrmnt/2.0)))
                current_bin_max += incrmnt  
                counted = True   

        if not counted:
            binData.append(cnt)
            binCat.append(str("%0.2f" % (current_bin_max - incrmnt/2.0)))
                           
        tot = sum(binData)       
        bins     = []                
        for j in range(numBins):
            bins.append(j*binWidth)
    #https://pythonspot.com/matplotlib-bar-chart/
        y_pos = np.arange(numBins)
        plt.xticks(y_pos, binCat)
        plt.title("Distribution of Variance Values by Column")
        plt.ylabel('Variance  Bin Totals')
        plt.xlabel('Variance Value Bins')
        #plt.legend()
        plt.bar(y_pos, binData, align='center', alpha=0.5)
    
        fig, ax = plt.subplots(num=1, figsize=(8,3))
        plt.show()

    return matrix, filter_rows, filter_cols,len(deletes),minVal,maxVal
    
def UpperLowerLimit_Filter_Row(upperLower, matrix,cutoff,row_header_list,column_header_list):
    #Create Null Set of Filtered Row(Populated Later)
    deletes = []
    minVal  = +9999999
    maxVal  = -99999
    #Loop to Determine Which Rows have sub-Threshold Range
    for i in range(0,len(matrix)):
        removeRow = False

        for j in range(len(matrix[0])):
            val= matrix[i][j]
            if not math.isnan(val):
                if val <= cutoff and upperLower == 'lower':    
                    removeRow = True
                elif val >= cutoff and upperLower == 'upper':  
                    removeRow = True
                else:
                    if val < minVal:  minVal = val
                    if val > maxVal:  maxVal = val
        
        #print(temp_stdev)
        if removeRow:  deletes = np.append(deletes,[i],0)
            
    #Delete Rows sub-Threshold Rows       
    matrix = np.delete(matrix,deletes,0)
    filter_rows = np.delete(row_header_list,deletes,0)
    filter_cols = column_header_list
    
    return matrix, filter_rows, filter_cols,len(deletes),minVal,maxVal

def UpperLowerLimit_Filter_Col(upperLower,matrix,cutoff,row_header_list,column_header_list):
    #Create Null Set of Filtered Row(Populated Later)
    deletes = []
    minVal  = +9999999
    maxVal  = -99999
    #Loop to Determine Which Rows have sub-Threshold Variance

    for i in range(0,len(matrix[0])):
        removeRow = False

        for j in range(len(matrix)):
            val= matrix[j][i]
            if not math.isnan(val):
                if val <= cutoff and upperLower == 'lower':    
                    removeRow = True
                elif val >= cutoff and upperLower == 'upper':  
                    removeRow = True
                else:
                    if val < minVal:  minVal = val
                    if val > maxVal:  maxVal = val
        
        #print(temp_stdev)
        if removeRow:  deletes = np.append(deletes,[i],0)

    #Delete Rows sub-Threshold Rows       
    matrix = np.delete(matrix,deletes,1)
    filter_rows = row_header_list
    filter_cols = np.delete(column_header_list,deletes,0)
    #np.savetxt('testtest.txt',matrix,delimiter='\t')
    
    return matrix, filter_rows, filter_cols,len(deletes),minVal,maxVal

#=========  remove rows with too many NANs in cells 
def NAN_Filter_Row(matrix,nanList,maxAllowedNANs,row_header_list,column_header_list):

    try:       
        #Create Null Set of Filtered Row(Populated Later)
        maxFoundNANs = 0
        deletes = []
        #Loop to Determine Which Rows have sub-Threshold Range
        for i in range(0,len(matrix)):
            #matches= [s for s in matrix[i][0::] if any(nan == s.upper() for nan in nanList)]
            #matches= [s for s in matrix[i][:] if s in nanList]
            matches= []
            for s in matrix[i]:
                if str(s) in nanList: matches.append(s)
                
            
            lenMatches = len(matches)
            if lenMatches > maxFoundNANs:   maxFoundNANs = lenMatches
    
            if lenMatches >= maxAllowedNANs:
                deletes = np.append(deletes,[i],0)
                
        #Delete Rows sub-Threshold Rows       
        matrix = np.delete(matrix,deletes,0)
        filter_rows = np.delete(row_header_list,deletes,0)
        filter_cols = column_header_list

    except Exception as err:
        traceback.print_exc()
        sys.exit(-4)
    
    return matrix, filter_rows, filter_cols,len(deletes),maxFoundNANs

#=========  remove Cols with too many NANs

def NAN_Filter_Column(matrix,nanList,maxAllowedNANs,row_header_list,column_header_list):
    
    #Create Null Set of Filtered Row(Populated Later)
    minNumNANs = 0
    maxFoundNANs = 0
    deletes = []
    #Loop to Determine Which Rows have sub-Threshold Variance
    for i in range(0,len(matrix[0])):
        matches= []
        for j in range(len(matrix)):
            if str(matrix[j][i]) in nanList:  matches.append(matrix[j][i])
           
        lenMatches = len(matches)
        if lenMatches > maxFoundNANs:   
            maxFoundNANs = lenMatches

        if lenMatches >= maxAllowedNANs:
            deletes = np.append(deletes,[i],0)
        
    #Delete cols with too many NANs     
    matrix = np.delete(matrix,deletes,1)
    filter_rows = row_header_list
    filter_cols = np.delete(column_header_list,deletes,0)
    #np.savetxt('testtest.txt',matrix,delimiter='\t')
    return matrix, filter_rows, filter_cols,len(deletes),maxFoundNANs


#MAD Median Absolute Deviation  median (|Xi - Xmedian|) > X
def Row_Value_MAD(matrix,cutoff,row_header_list,column_header_list):
#MAD Median Absolute Deviation  median (|Xi - Xmedian|) > X
# cutoff is MAX value used to meant to minimize the impact of one outlier

    deletes = []
    minVal  = +9999999
    maxVal  = -99999
    #Loop to Determine Which Rows have sub-Threshold Range
    for i in range(0,len(matrix)):
        medianRow = np.median(matrix[i])
        temp = np.median(abs(matrix[i]- medianRow))
# median (|Xi - Xmedian|) > X => meant to minimize the impact of one outlier
        if temp < cutoff:
            deletes = np.append(deletes,[i],0)
            
        if temp < minVal:  minVal = temp
        if temp > maxVal:  maxVal = temp
            
    #Delete Rows sub-Threshold Rows       
    matrix = np.delete(matrix,deletes,0)
    filter_rows = np.delete(row_header_list,deletes,0)
    filter_cols = column_header_list
    print( "INFO Row MAD - Matrix min MAD value= "+str(minVal)+" and the max MAD value= "+str(maxVal) )
    
    return matrix, filter_rows, filter_cols,len(deletes),maxVal

#MAD Median Absolute Deviation  median (|Xi - Xmedian|) > X
def Col_Value_MAD(matrix,cutoff,row_header_list,column_header_list):
#MAD Median Absolute Deviation  median (|Xi - Xmedian|) > X
# cutoff is MAX value used to meant to minimize the impact of one outlier
    deletes = []
    minVal  = +9999999
    maxVal  = -99999
    #Loop to Determine Which Rows have sub-Threshold Range
    for i in range(0,len(matrix[0])):
        matrixCol= []
        for j in range(len(matrix)):
            matrixCol.append(matrix[j][i])

        medianCol = np.median(matrixCol)
        temp = np.median(abs(matrixCol- medianCol))
# median (|Xi - Xmedian|) > X  meant to minimize the impact of one outlier
        if temp < cutoff:
            deletes = np.append(deletes,[i],0)
            
        if temp < minVal:  minVal = temp
        if temp > maxVal:  maxVal = temp
            
    #Delete Rows sub-Threshold Rows       
    matrix = np.delete(matrix,deletes,1)
    filter_rows = row_header_list
    filter_cols = np.delete(column_header_list,deletes,0)
    print( "INFO Column MAD - Matrix min MAD value= "+str(minVal)+" and the max MAD value= "+str(maxVal) )
    
    return matrix, filter_rows, filter_cols,len(deletes),maxVal


# if covariance of the data in two columns exceeds a thresehold remove one row list the rows in a separate output    
# def CoVariance_Percent_Filter_row_col(matrix,thresh,row_header_list,column_header_list):
# xv= array([8., 9.5, 7.8, 4.2, -7.7, -5.4, 3.2])
# yv= array([8.9, 2.0, 4.8, -4.2, 2.7, -3.4, -5.9])
# 
# def cov(x,y):
#     if (len(x) != len(y)
#         [Stop] 
#         x.bar = mean(x) 
#         y.bar = mean(y) 
#         N = len(x)      
#     Cov = (sum((x-x.bar)*(y-y.bar))) / (N-1.0) 
#     return(Cov) 

#     #Create Null Set of Filtered Row(Populated Later)
#     deletes = []
#     
#     temp_mean = np.nanmean(matrix[i])
#     temp_stdev = np.nanstd(matrix[i])
#     
#     get stddev of each row the calc xi -xj sq 
#     
#     for i in range(0,len(matrix)):
#         temp_range = np.max(matrix[i][0::]) - np.min(matrix[i][0::])
#         if temp_range <= float(thresh):
#             deletes = np.append(deletes,[i],0)
#             
#     #Delete Rows sub-Threshold Rows       
#     matrix = np.delete(matrix,deletes,0)
#     filter_rows = np.delete(row_header_list,deletes,0)
#     filter_cols = column_header_list
#     return(matrix,filter_rows,filter_cols)
# 
#     #np.savetxt('testtest.txt',matrix,delimiter='\t')
#     return(matrix,filter_rows,filter_cols)
#     

#Define Function Which Labels Rows/Columns on Output
#below replace
# def labeler(matrix,filter_rows,filter_cols,output_file_txt):
# 
#     #Write Data to Specified Text File Output
#     with open(output_file_txt,'w') as f:
#         f.write("")
#         for k in range(0,len(filter_cols)):
#                 f.write('\t' + filter_cols[k])
#         f.write('\n')
#         for i in range(0,len(filter_rows)):
#                 f.write(filter_rows[i])
#                 for j in range(0,len(matrix[0])):
#                         f.write('\t' + format(matrix[i][j]))
#                 f.write('\n')


#Define Main Function
def main():
    try:
        args = get_args()
        #sys.stdout.write(str(args)+"\n")
#          <option value="LowerLimit">Minimum Absolute(Cell) Values to remove row/column</option>
#          <option value="UpperLimit">Maximum Absolute(Cell) Values to remove row/column</option>
#          <option value="NANnumber">NAN Number Cells Limit to remove row/column</option>
#          <option value="NANpercent">NAN Percent Cells Limit to remove row/column</option>
        nanList= ["NAN", "NA", "N/A", "-","?","nan", "na", "n/a"]

        matrix, column_header_list,row_header_list = reader(args.input_file_txt)
        #old_reader  matrix, row_header_list, column_header_list = reader(args.input_file_txt)
        threshold = float(args.thresh)
        if threshold < 0.000001:
            print('Invalid negative or near-zero threshold chosen = '+str(args.thresh)+" choose positive value")
            sys.exit(-4)

#VariancePercent            
        if args.choice == "VariancePercent" or args.choice == "VarianceCount":  # > percent variance
            
            if args.axes == "Row":
                if args.choice == "VarianceCount":  threshold= len(row_header_list)*threshold/100.0

                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = Variance_Percent_Filter_row(matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for rows using variance percentile < '+str(args.thresh)+ ' by row. Matrix row minimum variance=  %.2f' % minVal+' and maximum variance=  %.2f' % maxVal)
                    sys.stderr.write('\nFiltering out rows using variance percentile < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
                    sys.exit(-1)
                else:   
                    print('\nFiltering out rows using variance percentile < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
            elif args.axes == "Column":
                if args.choice == "VarianceCount":  threshold= len(column_header_list)*threshold/100.0
                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = Variance_Percent_Filter_col(matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for columns using variance percentile < '+str(args.thresh)+ ' by columns. Matrix columns minimum variance=  %.2f' % minVal+' and maximum variance=  %.2f' % maxVal)
                    sys.stderr.write('\nNO Filtering out rows using variance percentile < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
                    sys.exit(-1)
                else:   
                    print('\nFiltering out columns using variance percentile < '+str(args.thresh)+ ' removed '+str(delCnt)+' columns')
            else:
                print('Invalid Axes ='+str(args.thresh))
                sys.exit(-1)
#LowerLimit
        elif args.choice == "LowerLimit":  #!! todo is NOT lower or upper limit but range of values
            if args.axes == "Row":
                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = UpperLowerLimit_Filter_Row('lower',matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for rows using LowerLimit < '+str(args.thresh)+ ' by row. Matrix row minimum range=  %.2f' % minVal+' and maximum range=  %.2f' % maxVal)
                    sys.stderr.write('\nNO Filtering out rows using LowerLimit < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' rows with Lower Limit < '+str(args.thresh))
            elif args.axes == "Column":
                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = UpperLowerLimit_Filter_Col('lower', matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for columns using Lower Limit < '+str(args.thresh)+ ' by columns. Matrix columns minimum range=  %.2f' % minVal+' and maximum range=  %.2f' % maxVal)
                    sys.stderr.write('\nNO Filtering out rows using Lower Limit < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' columns with Lower Limit < '+str(args.thresh))
#UpperLimit
        elif args.choice == "UpperLimit":  #!! todo is NOT lower or upper limit but range of values
            if args.axes == "Row":
                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = UpperLowerLimit_Filter_Row('upper',matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for rows using Upper Limit < '+str(args.thresh)+ ' by row. Matrix row minimum range=  %.2f' % minVal+' and maximum range=  %.2f' % maxVal)
                    sys.stderr.write('\nNO Filtering out rows using Upper Limit < '+str(args.thresh)+ ' by row. Matrix row minimum range=  %.2f' % minVal+' and maximum range=  %.2f' % maxVal)
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' rows with UpperLimit < '+str(args.thresh))
            elif args.axes == "Column":
                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = UpperLowerLimit_Filter_Col('upper', matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for columns using UpperLimit < '+str(args.thresh)+ ' by columns. Matrix columns minimum range=  %.2f' % minVal+' and maximum range=  %.2f' % maxVal)
                    sys.stderr.write('\nFiltering out rows using UpperLimit < '+str(args.thresh)+ ' by columns. Matrix columns minimum range=  %.2f' % minVal+' and maximum range=  %.2f' % maxVal)
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' columns with UpperLimit < '+str(args.thresh))
#MADlimit
        elif args.choice == "MADcount" or args.choice == "MADpercent":  #!! is lowerlimit of median absolute deviation medians
            threshold= threshold
            if args.axes == "Row":
                if args.choice == "MADpercent":  threshold= len(row_header_list)*threshold/100.0

                matrix, filter_rows, filter_cols,delCnt,maxVal = Row_Value_MAD(matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for rows using MAD < '+str(threshold)+ ' by row. Matrix row MAD maximum value=  %.2f' % maxVal)
                    sys.stderr.write('\nFiltering out rows using MAD < '+str(threshold)+ ' by row. Matrix row  MAD maximum value=  %.2f' % maxVal)
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' rows using  MAD maximum value > '+str(threshold))
            elif args.axes == "Column":
                if args.choice == "MADpercent":  threshold= len(column_header_list)*threshold/100.0

                matrix, filter_rows, filter_cols,delCnt,maxVal = Col_Value_MAD(matrix,threshold,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for columns using MAD < '+str(threshold)+ ' by columns. Matrix columns MAD maximum value=  %.2f' % maxVal)
                    sys.stderr.write('\nFiltering out columns using MAD < '+str(threshold)+ ' by columns. Matrix columns  MAD maximum value=  %.2f' % maxVal)
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' columns using  MAD maximum value > '+str(threshold))
#NANlimit
        elif args.choice == "NANlimit" or args.choice == "NANpercent":  
            maxNANs= int(args.thresh)
            val= ' '
            if args.choice == "NANpercent":
                n,m = np.shape(matrix)
                maxNANs= int(int(args.thresh)*n/100)
                val= '%'  
            if args.axes == "Row":
                matrix, filter_rows, filter_cols,delCnt, maxFoundNANs = NAN_Filter_Row(matrix,nanList,maxNANs,row_header_list,column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for rows using NAN limit = or > '+str(args.thresh)+val+ ' by row. Matrix row max NAN count is =' + str(maxFoundNANs ))
                    sys.stderr.write('\nNO Filtering out rows using NAN limit = or >  '+str(args.thresh)+val+ ' by row. Matrix row max NAN count is =' + str(maxFoundNANs ))
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' rows using NAN limit = or >  '+str(args.thresh)+val)
            elif args.axes == "Column":
                matrix, filter_rows, filter_cols,delCnt, maxFoundNANs = NAN_Filter_Column(matrix, nanList, maxNANs, row_header_list, column_header_list)
                Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
                if delCnt < 1:
                    print('\nNO Filtering occurred for columns using NAN limit = or > '+str(args.thresh)+val+ ' by columns. Matrix columns max NAN count is = '+ str(maxFoundNANs))
                    sys.stderr.write('\nNO Filtering out columns using NAN limit = or > '+str(args.thresh)+val+ ' by columns. Matrix columns max NAN count is = '+ str(maxFoundNANs))
                    sys.exit(-1)
                else:   
                    print('\nFiltered out '+str(delCnt)+' columns using NAN limit = or >  '+str(args.thresh)+val )

#         elif args.choice == "covariance":
#             if args.axes == "Row":
#                 matrix, filter_rows, filter_cols = CoVariance_Percent_Filter_row(matrix,args.thresh,row_header_list,column_header_list)
#                 Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
#                 print('Covariance_Filter on row')
#             elif args.axes == "Column":
#                 matrix, filter_rows, filter_cols = CoVariance_Percent_Filter_col(matrix,args.thresh,row_header_list,column_header_list)
#                 Labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
#                 print('Covariance_Filter on column')
            else:
                print('Invalid Axes = '+str(args.axes))
                sys.exit(-1)
        else:
            print("Invalid Filter Choice = "+str(args.choice))
            sys.exit(-2)    
        
             
    except Exception as err:
        traceback.print_exc()
        sys.exit(-3)

if __name__ == '__main__':
    main()
    print("\ndone")
    sys.exit(0)