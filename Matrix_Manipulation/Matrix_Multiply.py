'''
Created on March 6, 2018

@author: Bob Brown based on John Weinstein's algorithm
'''

import os
import re
import shutil
import traceback
import sys, traceback, argparse
import numpy as np
import warnings
#import scipy.stats as ss
from Matrix_Validate_import import reader, Labeler, MatchLabels
import math
warnings.filterwarnings('error')

# John Weinsteins algorithm  by bob brown   https://discover.nci.nih.gov/CorrelateMatrices/help.do
#http://www.blog.pythonlibrary.org/2014/04/30/reading-excel-spreadsheets-with-python-and-xlrd/

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_file1', help='text file input matrix(include .txt in name)')
    parser.add_argument('transpose', type=str, help='transpose matrix 1?')
    parser.add_argument('input_file2', help='text file input matrix(include .txt in name)')
    parser.add_argument('choice', type=str, help='Choose Normalization Method: 1 = Z-score, 2 = Mean Centered, 3 = log2, 4= rank')
#    parser.add_argument('scaleValue', help='optional scaling factor for matrix)')
    parser.add_argument('out_fileName', help='text file output matrix(include .txt in name)')
    args = parser.parse_args()
    if args.transpose == "": args.transpose = 'n'
    return args


def Matrix_Multiply(matrix1, matrix2):

    try: 
#TODO handle NANs

        matrixOut= np.dot(matrix1, matrix2)
    

    except Exception as err:
        traceback.print_exc()
        sys.exit(-5)

    return(matrixOut)


#CorrelateMatrices  correlation acorss 2 martices   https://discover.nci.nih.gov/CorrelateMatrices/home.do
def Correlate_Matrices(matrix1, matrix2):

    #try:    
    # Leave both matrices as size axn and bxn and treat a is column and b as row
    #matrix1T = Transpose(matrix1) 
    
#TODO handle NANs
    numRows1,numColumns1= np.shape(matrix1)
    
    numRows2,numColumns2= np.shape(matrix2)
    matrixOut= []

    if numColumns1 != numRows2:
        print("ERROR number columns Matrix 1 ", str(numColumns1), " not equal number rows for Matrix 2 ",str(numRows2))
        sys.exit(-1)
#TODO need to look for NANs??

    for i in range(numRows1):
        vectorM1 = matrix1[i][:]
        meanVec1 = np.nanmean(vectorM1)
        varStdDev1  = np.nanstd(vectorM1, ddof=1)
        lowStdDev1  = False
         #if equals zero
        if abs(varStdDev1) < .000001:
            print("ERROR Variance value almost zero", str(varStdDev1), " for Matrix 1 Row ",str(i+1))
            lowStdDev1= True
        correlationRow= []
        
        for j in range(numColumns2):
            vectorM2 = []
            for t in range(numRows2):
                vectorM2.append(matrix2[t][j])
            meanVec2 = np.nanmean(vectorM2)
            varStdDev2  = np.nanstd(vectorM2, ddof=1)
            lowStdDev2= False
            #if equals zero
            if abs(varStdDev2) < .000001:
                print("ERROR Variance value almost zero", str(varStdDev2), " for Matrix 2 Column ",str(j+1))
                lowStdDev2= True

            covarStdDev12= 0
            
            if not lowStdDev1 and not lowStdDev2:
                #try:
                for pos in range(len(vectorM1)):
                    covarStdDev12 += ((vectorM1[pos]-meanVec1)/varStdDev1)*((vectorM2[pos]-meanVec2)/varStdDev2)
#                bottom= (numColumns1 -1)*(varStdDev1*varStdDev2)   
#                correlationRow.append( covarStdDev12/bottom)
                correlationRow.append( covarStdDev12/(numColumns1 -1))
                #except:  bad value because of NAN or other
            else:
                correlationRow.append("divide by 0")   # cannot calculate correlation  var too small
                    
        matrixOut.append(correlationRow)
            
#     except Exception as err:
#         traceback.print_exc()
#         sys.exit(-6)

    return(matrixOut)

#----------------------------------------------------------------------
def Transpose(in_mat):
    out_mat     = []
    numRows,numColumns= np.shape(in_mat)
    
    for i in range(numColumns):
        temp= []
        for j in range(numRows):
            temp.append(in_mat[j][i])
        out_mat.append(temp)
    #print( str(out_mat))
    return out_mat


#----------------------------------------------------------------------
if __name__ == "__main__":
    
#     input_file1 = "/Users/bobbrown/Desktop/Gene-by-var.txt"
#     input_file2 = "/Users/bobbrown/Desktop/var-by-sample.txt"
#     out_fileName = "/Users/bobbrown/Desktop/MatixMult-1-2-Out.txt"
#     selection   = "MatrixMultiply"
#TODO address NANs ???

    try:
        args = get_args()
        selection= args.choice
            
        matrix1,column_labels1,row_labels1 = reader(args.input_file1)  # to be transposed later
        matrix2,column_labels2,row_labels2 = reader(args.input_file2)


        if args.transpose == 'y' or args.input_file1 == args.input_file2:
            matrix1 = Transpose(matrix1)
            print("\n>>>NOTICE Transposed first matrix so matrix 1 columns =  Matrix 2 number rows ")
            temp          = row_labels1 #swap labels for output matrix
            row_labels1   = column_labels1 #swap labels for output matrix
            column_labels1= temp #swap labels for output matrix

        MatchLabels(column_labels1,row_labels2)  # verfiy labels and their  order match
        
        if len(column_labels1) != len(row_labels2):
            print("\n>>> ERROR attempting to multiple Matrices of incompatible dimensions ")
            print("First Matrix is "+str(len(row_labels1))+" by "+str(len(column_labels1))+" where second Matrix is "+str(len(og_row2))+" by "+str(len(column_labels2))+"\n")
            print("Matrices must have dimensions  AxB and BxC.  A can equal C (square matrices)")
            sys.exit(-1)
    
        if selection == "MatrixMultiply":
            matrixOut= Matrix_Multiply(matrix1, matrix2 )
        
        elif selection == "Corr2Matrices" or selection == "Corr1Matrix":
            matrixOut = Correlate_Matrices(matrix1, matrix2)

        Labeler(matrixOut,column_labels2,row_labels1,args.out_fileName)
        
        print("Matrix Multiply  "+str(len(row_labels1))+" by "+str(len(column_labels1))+" Matrix 1 by "+str(len(row_labels2))+" by "+str(len(column_labels2))+" matrix 2")
        print("Output Matrix dimensions are "+str(len(row_labels1))+" by "+str(len(column_labels2))+"\n")
            
    except Exception as err:
        traceback.print_exc()
        sys.exit(-3)
    
    sys.exit(0)