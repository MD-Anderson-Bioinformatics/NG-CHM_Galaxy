'''
Created on Jun 7, 2017 modified Feb2018

@author: Bob Brown and cjacoby
'''
 
import sys, traceback, argparse
import numpy as np
import os
from Matrix_Validate_import import reader

#Define The Four Arguments Used in the Program
def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_file_txt', help='tab delimited text file input matrix(include .txt in name)')
    parser.add_argument('replacement', type=str, help='Choose Replacement for Missing Value. Valid Choices are strings: "Mean" or "Zero"')
    parser.add_argument('axes', type=str, help='Choose Axes to Normalize On (Either "Row" or "Column"')
    parser.add_argument('output_file_txt' ,help='tab delimited text file output name (include .txt in name)')
    args = parser.parse_args()
    return args


#Define Function to Replace Null Values with Row Mean
def nan_replacer_mean_rows(matrix):

    nonNumCnt= 0
    nanCnt   = 0   #valid NANs are "NA","N/A","-","?"

    #Loop Replacing all Null Values with Row Mean
    for i in range(0,len(matrix)):
        temp_mean = np.nanmean(matrix[i])
        for j in range(0,len(matrix[0])):
            if matrix[i][j] == "NA": #np.isnan(matrix[i][j]) == True:
                matrix[i][j] = temp_mean     
    return matrix, nonNumCnt, nanCnt

#Define Function to Replace Null Values with Column Mean
def nan_replacer_mean_columns(matrix):

    nonNumCnt= 0
    nanCnt   = 0   #valid NANs are "NA","N/A","-","?"
    
    #Loop Replacing all Null Values with Column Mean
    for i in range(0,len(matrix[0])):
        col = [row[i] for row in matrix]
        temp_mean = np.nanmean(col)
        for j in range(0,len(matrix)):
            if matrix[i][j] == "NA": #elif np.isnan(matrix[j][i]) == True:
                matrix[j][i] = temp_mean     
    
    return matrix, nonNumCnt, nanCnt

#Define Function to Replace Null Values with Zero (axis orientation is irrelevant)
def nan_replacer_zero(matrix):

    nonNumCnt= 0
    nanCnt   = 0   #valid NANs are "NA","N/A","-","?"
    
    #Loop Replacing all Null Values with Row Range
    for i in range(0,len(matrix)):
        for j in range(0,len(matrix[0])):
            if matrix[i][j] =="NA":
               matrix[i][j] = 0

    return matrix, nonNumCnt, nanCnt

#Define Function to Re-Label Output Matrix
#!!!! not needed no output matrix from Validate tool
def OLD_labeler(matrix, og_cols, og_rows, output_file_txt): 
    #Write Data to Specified Text File Output
    with open(output_file_txt,'w') as f:
        f.write("Use original input file for further processing\n")
    f.close()
#        f.write("")
#         for k in range(0,len(og_cols)):
#                 f.write('\t' + str(og_cols[k]))
#         f.write('\n')
#         for i in range(0,len(og_rows)):
#                 f.write(og_rows[i])
#                 for j in range(0,len(matrix[0])):
#                         f.write('\t' + format(matrix[i][j]))
#                 f.write('\n') 
    
#Main Function
def main():
    args = get_args()
    #print(args)
    #sys.stdout.write(str(args))
    #sys.stdout.write( '\nValid NAN identifiers are "NA","N/A","-", and "?"')
    
    matrix,og_cols,og_rows = reader(args.input_file_txt)

#     if nonNumCnt > 0:
#         print('\nERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
#         #sys.stderr.write('\nERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
#         if nanCnt > 0:
#             print('\nWARNING Matrix has '+str(nanCnt)+'  that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
#         sys.exit(-1)
#     else:
#         if nanCnt > 0:
#             print('\nWARNING Matrix has NO unknown non-numbers in matrix, but contains '+str(nanCnt)+' that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
#         else:
#             print('Matrix is Good-to-Go -- all numbers in data area. ')

    with open(args.output_file_txt,'w') as f:
        f.write("Use original input file for further processing\n")
    f.close()
    sys.exit(0)
    
# TODO !!!!!  Below if MDA decides to use it  TURNED OFF FOR NOW
# TODO !!!!!  Below if MDA decides to use it  TURNED OFF FOR NOW
"""
    if args.replacement == "Mean":
        if args.axes == "Row":
            matrix, nonNumCnt, nanCnt = nan_replacer_mean_rows(matrix)
            #OLD_labeler(matrix, og_cols, og_rows, args.output_file_txt)
            #print('Mean,Row')
            if nonNumCnt > 0:
                print('ERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
                sys.stderr.write('ERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
                if nanCnt > 0:
                    print('WARNING Matrix has '+str(nanCnt)+'  that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
                sys.exit(-1)
            else:
                if nanCnt > 0:
                    print('\nWARNING Matrix has '+str(nanCnt)+'  that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
                else:
                    print('\nMatrix is Good-to-Go -- all numbers in matrix. ')
                sys.exit(0)
        elif args.axes == "Column":
            matrix, nonNumCnt, nanCnt = nan_replacer_mean_columns(matrix)
            #OLD_labeler(matrix, og_cols, og_rows, args.output_file_txt)
            #print('Mean,Column')
            if nonNumCnt > 0:
                print('\nERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
                sys.stderr.write('\nERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
                if nanCnt > 0:
                    print('\nWARNING Matrix has '+str(nanCnt)+'  that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
                sys.exit(-1)
            else:
                if nanCnt > 0:
                    print('\nWARNING Matrix has '+str(nanCnt)+'  that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
                else:
                    print('\nMatrix is Good-to-Go -- all numbers in matrix. ')
                sys.exit(0)
        else:
            print('Mean, but given Invalid Axis= '+str(args.axes))
            sys.stderr.write('Mean, but given Invalid Axis= '+str(args.axes))
    elif args.replacement == "Zero":
        matrix, nonNumCnt, nanCnt = nan_replacer_zero(matrix)
        #OLD_labeler(matrix, og_cols, og_rows, args.output_file_txt)
        if nonNumCnt > 0:
            print('\nERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
            sys.stderr.write('\nERROR Matrix has non-numbers that are non-NAN identifiers in matrix. Total and percent unknown strings found = '+str(nonNumCnt)+ ',  %.2f' % (100.0*nonNumCnt/(1.0*len(og_cols)*len(og_rows)))+'%' )
            if nanCnt > 0:
                print('\nWARNING Matrix has '+str(nanCnt)+'  that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
            sys.exit(-1)
        else:
            if nanCnt > 0:
                print('\nWARNING Matrix has '+str(nanCnt)+'  that is  %.2f' % (100.0*nanCnt/(1.0*len(og_cols)*len(og_rows)))+'% known NAN identifiers')
            else:
                print('\nMatrix is Good-to-Go -- all numbers in matrix. ')
            sys.exit(0)
    else:
        print('zero, but given Invalid Axis= '+str(args.axes))
        sys.stderr.write('zero, but given Invalid Axis= '+str(args.axes))
        sys.exit(-2)
"""
       
if __name__ == '__main__':
    main()
    print("done")
