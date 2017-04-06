#!/usr/bin/env python
# -*- coding: utf-8 -*-
# python shell program to validate ng-chm heat map input matrix file and covariate file formats before calling java shell -- bob brown

import subprocess           #you must import subprocess so that python can talk to the command line
import sys
import os
import re
#import config
import traceback
#import commons

#ConfigVals = config.Config("../rppaConf.txt")

def main():
    
    try:
        print '\nStarting Heat Map file validation ......' 
        #print "\nheat map sys args len and values = ",len(sys.argv), str(sys.argv)   #, '++',argvals

      
        #error=              False
        endCovarParam=  len(sys.argv)-2 # IF any ending of loc for covar triplet info 
        startCovarParam=    17 # beginning loc for covar triplet info
        inMatrix=           sys.argv[3]

        for i in range( endCovarParam, 15, -3):
            if len(sys.argv[i]) > 6:
                if sys.argv[i][0:4].find('row_') == 0 or sys.argv[i][0:7].find('column_') == 0:  # 0 is match start position
                    startCovarParam= i-2                
                    #print "\nHeat map arg 3 and start covariate index on = " ,str(sys.argv[3]),' - ', startCovarParam, ' covar name= ',str(sys.argv[startCovarParam:])
                #else: print '\nCovariate param row or column not found at i', i, str(sys.argv[i])

    #test        inMatrix= "/Users/bobbrown/Desktop/NGCHM-Galaxy-Test-Files/400x400firstRowShift.txt"
    #test        covarFN= '/Users/bobbrown/Desktop/400x400-column-covariate-continuous-TestingErrors.txt'
    #test        row_col_cat_contin= 'column_continuous'
    #test        row_col_cat_contin= 'column_categorical'  
    #test        covarLabel = 'bob test'
    #test        numCovariates= 1
        
        errorInMatrix,inMatrixRowLabels,inMatrixColLabels= ValidateHMInputMatrix(inMatrix)   # verify input matrix
    
        print "\nFirst & last Row labels ", inMatrixRowLabels[0],inMatrixRowLabels[-1]," and Columns ", inMatrixColLabels[0],inMatrixColLabels[-1], " number Rows= ",len(inMatrixRowLabels)," number Columns= ",len(inMatrixColLabels)
            
    # continue reviewing covariates to catch any errors in any of the input info
        if errorInMatrix == False: print "\n++++ SUCCESS the Input Matrix looks good\n\n"
    
    
        i= startCovarParam
        while i < (len(sys.argv)-2):  # todo verify this works with advances tool is one other 0->n param after this
            covarLabel=         sys.argv[i]
            covarLabel=         covarLabel.replace(' ','')
            covarFN=            sys.argv[i+1]
            covarFN=            covarFN.replace(' ','')
            row_col_cat_contin=  sys.argv[i+2]
            row_col_cat_contin=  row_col_cat_contin.replace(' ','')
            i +=3
                                         
            print "\nSTART Validating covariate file with label= ", covarLabel, " and type= ",row_col_cat_contin
    
            error= ValidateHMCorvarFile(covarLabel, covarFN, row_col_cat_contin,inMatrixRowLabels,inMatrixColLabels)  # check covariate files
    
            if error or errorInMatrix:
                print"\n---ERROR issues found in input or covariate files\n "
                sys.stderr.write( "ERROR issues found in input or covariate files see errors in Standard Output\n\n ") 
                sys.exit(-1)
                
                
        print"\n FINISHED -- Validation of the Input Matrix and Covariate files (if any)\n\n"
        
        #print" next running the clustered heat map generator \n",str(sys.argv[11])+"/heatmap.sh "+ str(sys.argv[1:])
    #            p = subprocess.Popen([str(sys.argv[1])+"/heatmap.sh "+ argvals], shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            #p = subprocess.Popen([str(sys.argv[11])+"/heatmap.sh "+ str(sys.argv[1:])], shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
     
            #retval = p.wait()  
            #print ' Cluster and Viewer returned\n'
            #for line in p.stdout.readlines():
            #    print line
                     
#         else: 
#             sys.stderr.write("\nERROR -- The Heat Map Generator encountered the above errors with the input file(s)\n\n")
#             sys.exit(-1) # this will error it out :)
#     except:
#         sys.stderr.write(str(traceback.format_exc()))
#         sys.exit(-1) # this will error it out :)
    except Exception, err:
        sys.stderr.write('ERROR: %sn' % str(err))

    return 

#+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

def ValidateHMInputMatrix(inputMatrixPath):           # This sub routine ensures that the slide design input by the user matches a slide design on record

     try:
        error= True
    
        inputMatrixPath= inputMatrixPath.replace(' ','')

        inMatrixFH= open( inputMatrixPath, 'rU')
        
        #print "\nInput matrix path and name ", inputMatrixPath,"\n"
        error= False

        countRow=   0
        lenRow1=    0
        lenAllRows= 0
        inMatrixRowLabels= []
        inMatrixColLabels= []
        
        for rawRow in inMatrixFH:
            countRow +=1
            
            rawRow= rawRow.replace('\n','')
            eachRow=  rawRow.split('\t')
            if countRow < 2: print 'Input Matrix start 1 to 10= ',eachRow[:10], '\n'
            
            if countRow == 1: 
                lenRow1= len(eachRow)
                inMatrixColLabels= eachRow
                if lenRow1 < 3:  # likely is covariate file not input matrix
                    print"----ERROR Input  number of columns" , lenRow1," is too few likely input matrix is really a covariate file"
                    SystemError ("----ERROR Input  number of columns" , str(lenRow1)," is too few likely input matrix is really a covariate file")
                    error= True
                    sys.err= -1
            elif countRow == 2: 
                lenAllRows= len(eachRow)
                if (lenAllRows == lenRow1):  #or (lenAllRows- lenRow1 == 1): 
                    print"Validating Input matrix,  number of Labeled Columns = ", lenAllRows
                    inMatrixRowLabels.append(eachRow[0])
                    if (lenAllRows == lenRow1) and (inMatrixColLabels[0]==''): inMatrixColLabels.pop(0)  #remove blank first cell
                else: 
                    print"\n--ERROR  Input matrix number columns= ", lenRow1," in first row and second row= ", lenAllRows," mismatch "
                    sys.stderr.write( "\n--ERROR  Input matrix number columns= "+str(lenRow1)+" in first row and the second row= "+str(lenAllRows)+" mismatch ")
                    error= True
                    sys.err= -1
            elif lenRow1 != len(eachRow):
                    print"\n--ERROR Input Row ",countRow," number of columns" , len(eachRow)," length mismatch with row 2 length ", lenAllRows
                    sys.stderr.write ("\n--ERROR  Input Row "+ str(countRow)+" number of columns"+str(len(eachRow))+" length mismatch with row 2 length "+str( lenAllRows))
                    error= True
                    sys.err= -1
            else:
                inMatrixRowLabels.append(eachRow[0])
                
            if (inMatrixColLabels[-1] =='') or (inMatrixColLabels[-1] =='\n'): inMatrixColLabels.pop()
     
        inMatrixFH.close()

            #print error, lenAllRows, len(eachRow), eachRow[0]
     except:
        #inMatrixFH.close()
        sys.stderr.write(str(traceback.format_exc()))
        error= True
    
     return error,inMatrixRowLabels,inMatrixColLabels

 #+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

def ValidateHMCorvarFile(covarLabel, covariateFilePath, row_col_cat_contin, inMatrixRowLabels,inMatrixColLabels):           # This sub routine ensures that the slide design input by the user matches a slide design on record

# verify 
# 1 That covar file labels match the col or row labels 1 to 1
# 2 That if a continuous covar file that the 2nd field is not all text hard to tell if '-' or 'e exponent'
# 3 That the length of the covar file matches the row or col length of the input matrix 

    error= True
    try:
    
        covFH= open( covariateFilePath, 'rU')
        countRow= 0

        error= False
        
        for rawRow in covFH:
            countRow +=1
            rawRow= rawRow.replace('\n','')
            eachRow=  rawRow.split('\t')
            if countRow== 0: print "\nCovariance file info - label ",covarLabel," row/col categorical or continous",row_col_cat_contin," first row ",eachrow
    
            if len(eachRow) < 2:
                print"----ERROR Input Row ",countRow," less than two TAB delimited columns ", eachRow, " Or maybe empty rows in file"
                sys.stderr.write("----ERROR Input Row "+str(countRow)+" covariance label and input matrix label mismatch "+ str(eachRow[0])+" not = "+ str(inMatrixColLabels[countRow-1]))
                error= True
                sys.err= -1
                #return error
            
            if row_col_cat_contin[0:6] == 'column':
                if eachRow[0] != inMatrixColLabels[countRow-1]: 
#                     if eachRow[0] == inMatrixRowLabels[countRow-1]:  # if no 
#                         print"ERROR Input COLUMN ",countRow," covariance column label and input matrix column label matches Row instead ", eachRow[0]," not = ", inMatrixColLabels[countRow-1],inMatrixRowLabels[countRow-1]
#                         SystemError ("ERROR Input COLUMN "+str(countRow)+" covariance column label and input matrix column matches Row instead  "+ str(eachRow[0])+" not = "+ str(inMatrixColLabels[countRow-1]+inMatrixRowLabels[countRow-1]))                        
#                     else:   
                    print"----ERROR Input COLUMN ",countRow," covariance column label and input matrix column label mismatch ", eachRow[0]," not = ", inMatrixColLabels[countRow-1]
                    sys.stderr.write("----ERROR Input COLUMN "+str(countRow)+" covariance column label and input matrix column label mismatch "+ str(eachRow[0])+" not = "+ str(inMatrixColLabels[countRow-1]))
                    error= True
                    sys.err= -1
            else: #row covar
                if eachRow[0] != inMatrixRowLabels[countRow-1]: 
                    print"----ERROR Input ROW ",countRow," covariance row label and input matrix row label mismatch ", eachRow[0]," not = ", inMatrixRowLabels[countRow-1]
                    SystemError ("----ERROR Input ROW "+str(countRow)+" covariance row label and input row matrix label mismatch "+ str(eachRow[0])+" not = "+str(inMatrixRowLabels[countRow-1]))
                    error= True
                    sys.err= -1

            if not error:
                if row_col_cat_contin[-4:] == 'uous':  # verify continuous is number-ish
                    tmp= re.search('[+-.0123456789eE]',eachRow[1])
                    try:
                        if tmp.group(0) == '':
                            tmp= tmp
                    except Exception as e:
                        print"-+-+- WARNING Input Row ",countRow," covariance continuous value appears to be non-numeric --", eachRow[1],"--"
                        sys.stderr.write("\n-+-+-WARNING Input Row "+str(countRow)+" covariance continuous value appears to be non-numeric --"+ str(eachRow[1])+"--")
                        #error= True
    except:
        sys.stderr.write(str(traceback.format_exc()))

    covFH.close()

    return error


if __name__ == "__main__":
    main()


