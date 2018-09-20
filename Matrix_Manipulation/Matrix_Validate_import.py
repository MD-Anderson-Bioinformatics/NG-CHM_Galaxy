'''
Created on Jun 7, 2017 modified Feb2018

@author: cjacoby and Bob Brown
'''
 
import sys, traceback, argparse
import numpy as np
import os
#import matplotlib.pyplot as plt
import matplotlib.pyplot as plt; plt.rcdefaults()

# Define the Reading Function Which Pulls the Data from a .txt file
def reader(input_file_txt, create_plot= False):
    #Read Matrix, Preserving String Values for Headers first row and first column (both minus first cell) 
    #Read Matrix, Converting all values to Float for Data Processing    
        
    f = open(input_file_txt, "rU")

    print( 'Valid NAN identifiers are: empty cells, cells with blanks,"NA","N/A","-", and "?"')

    column_labels = []
    row_labels = []
    matrix  = []
    firstLine= True
    
    line = f.readline()
    
#    "NA","N/A","-","?","NAN","NaN","Na","na","n/a","null",EMPTY/Null, SPACE (blank char) 

    nanList    = ["", " ","NAN", "NA", "N/A", "-","?"]
    binCatDict = {"":0, " ":0, "Text":0, "NA":0, "-":0,"NAN":0, "N/A":0,"?":0}
    row       = 0
    nanCnt    = 0
    nonNumCnt = 0
    
    while line:
        line = line.strip("\n")
        line = line.split('\t')

        row += 1
        
        if firstLine: 
            lengthRow = len(line)
            column_labels   = line[1:]
        else:
            if lengthRow != len(line):
                print("\nERROR matrix row lengths unequal for row 0 and row "+str(row)+"\n" )
                sys.exit(-1)
            
            temp  = []
#            column= 0
            row_labels.append(str(line[0]))
           
            #for item in line[1:]:  use enumerate
            for column, item in enumerate(line[1:],1):
#                column += 1
                try:
                    temp.append(float(item))
                except ValueError:
                    temp.append(np.nan)
                    itemUC= item.upper()
                    
                    if itemUC in nanList:
                        nanCnt += 1
                        binCatDict[itemUC]= binCatDict[itemUC]+1
                        #print( 'Legit nans= ',str(item))
                    else:
                        if nonNumCnt == 0:  sys.stderr.write("Start List of up to first 50 Invalid cell values \n")
                        nonNumCnt +=1
                        if nonNumCnt < 50:  sys.stderr.write("At row_column= "+str(row)+"_"+str(column)+' invalid data cell value '+ item+"\n")

                
            matrix.append(temp)
            
        line = f.readline()
        firstLine= False
                   
    #sys.stdout.write("\n\n")
    f.close()
    binCatDict["Text"]= nonNumCnt

# plot results of NAN counts above

    binCat = ["null", "blank", 'hyphen', '?','NA','N/A' ,'NAN', 'text']
    orderDict= {0:"", 1:"", 2:'-', 3:'?',4:'NA',  5:'N/A' ,6:'NAN', 7:'Text'}
#TODO verify dict orde for data    
        #print("> key value  =",key, str(value))
    print">>> NAN type and counts =",str(binCatDict)
    
    if create_plot:    
        numBins = len(binCat)
        binWidth = 1
        bins     = []
        binData  = []
        
        for key in sorted(orderDict):
            value= binCatDict[orderDict[key]]   # place items on chart in order and with data value for item
            if value < 1:
                binData.append(value+0.01)
            else:
                binData.append(value)
                
        for j in range(numBins):
            bins.append(j*binWidth)
    #ttps://pythonspot.com/matplotlib-bar-chart/
        y_pos = np.arange(numBins)
        plt.yticks(y_pos, binCat)
        plt.title("Distribution of NAN types (UPPER & lower & MiXeD case combined)")
        plt.ylabel('NAN Types')
        plt.xlabel('Occurrences')
        #plt.legend()
        plt.barh(y_pos, binData, align='center', alpha=0.5)
    
        fig, ax = plt.subplots(num=1, figsize=(8,3))
        ax.set_title("Data Cell Counts of Not A Number (NAN) Types")
        #ax.bar(center,bins, align='center', width=width)
        #ax.bar(center, hist, align='center', width=width)
        #ax.set_xticks(bins)
    #    fig.savefig("/Users/bobbrown/Desktop/Matrix-tools-Test-output/NAN-plot.png")
        
    #    fig, ax = plt.subplots(num=1, figsize=(8,3))
    #    fig.savefig("/Users/bobbrown/Desktop/Matrix-tools-Test-output/hist-out.png")
        
        plt.show()

#after plot error?
    x,y=np.shape(matrix)
    if nanCnt > 0: print("WARNING -- Found "+str(nanCnt)+" Valid Non-numbers. Their percent of total matrix data cell values = "+str((100*nanCnt)/(x*y))+"% ")
    if nonNumCnt > 0:  sys.exit(-1)
    
    return matrix,column_labels,row_labels

#----------------------------------------------------------------------
# Verify Matrix A  column_labels match Matrix B row_labels in name and order for A*B 
def MatchLabels(column_labels,row_labels):
     
        if len(column_labels) != len(row_labels):
            sys.err("ERROR 1st matrix column count "+str(len(column_labels))+" not equal 2nd Matrix number row count "+str(len(row_labels))+"\n" )
        else:
            cnt= 0
            for k in range(0,len(column_labels)):
                if column_labels[k] != row_labels[k] and cnt < 20:
                    cnt += 1
                    sys.err("ERROR At column & row position "+str(k)+" Matrix 1 column value "+str(column_labels)+" not equal 2nd Matrix row value "+str(row_labels)+"\n" )
            
            if cnt > 0: 
                sys.exit(-11)
#----------------------------------------------------------------------
# restores row and column labels in ouput
def Labeler(matrix,column_labels,row_labels,output_file_txt):
    #Define Null Sets For Col and Row Headers
    with open(output_file_txt,'w') as f:
        f.write("")
        for k in range(0,len(column_labels)):
                f.write('\t' + str(column_labels[k]) )
        f.write('\n')
        for i in range(0,len(row_labels)):
                f.write(str(row_labels[i]) )
                for j in range(0,len(matrix[0])):
                        f.write('\t' + format(matrix[i][j]))
                f.write('\n')


#----------------------------------------------------------------------
if __name__ == '__main__':
    input_file_txt = str(sys.argv[1])
                                 
    matrix,column_labels,row_labels = reader(input_file_txt)
    print("Done")

