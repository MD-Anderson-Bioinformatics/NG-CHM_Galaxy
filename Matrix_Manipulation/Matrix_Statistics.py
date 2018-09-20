'''
Created on Feb2018

@author: bob brown 
'''

import sys, traceback, argparse
import numpy as np
from Matrix_Validate_import import reader
import matplotlib.pyplot as plt
from Matrix_Filters import Variance_Percent_Filter_row, Variance_Percent_Filter_col

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


#Define Function Which Labels Rows/Columns on Output
def labeler(matrix,filter_rows,filter_cols,output_file_txt):

    #Write Data to Specified Text File Output
    with open(output_file_txt,'w') as f:
        f.write("")
        for k in range(0,len(filter_cols)):
                f.write('\t' + filter_cols[k])
        f.write('\n')
        for i in range(0,len(filter_rows)):
                f.write(filter_rows[i])
                for j in range(0,len(matrix[0])):
                        f.write('\t' + format(matrix[i][j]))
                f.write('\n')


def Histo(matrix):
    numBins= 20
    data = []
#    numRow,numCol= np.shape(matrix)
    for i in range(len(matrix[0])):
        data.append(np.nanmean([row[i] for row in matrix]))
         
#        print(str(np.nanmean([row[i] for row in matrix])))

#https://stackoverflow.com/questions/5328556/histogram-matplotlib
    #bins = [0, 40, 60, 75, 90, 110, 125, 140, 160, 200]
    minBin = int(min(data)-0.5)
    maxBin = int(max(data)+0.5)
    binWidth = float(maxBin-minBin)/numBins
    bins= []
    
    for j in range(numBins):
        bins.append(minBin+ j*binWidth)
    #bins= 20
    n, bins, patches = plt.hist(data,bins, normed=False)
    #n, bins, patches = plt.hist(data,bins, normed=1, color='green')
    #hist, bins = np.histogram(data, bins=bins)
    width = np.diff(bins)
    center = (minBin + bins[1:]) / 2
    
    cm = plt.cm.get_cmap('RdYlBu_r')
    #col = (n-n.min())/(n.max()-n.min())
    for c, p in zip(bins, patches):
        plt.setp( p, 'facecolor', cm(c/numBins))
    fig, ax = plt.subplots(num=1, figsize=(8,3))
    ax.set_title("Distribution of Column Means")
    #ax.bar(center,bins, align='center', width=width)
    #ax.bar(center, hist, align='center', width=width)
    #ax.set_xticks(bins)
#    fig.savefig("/Users/bobbrown/Desktop/Matrix-tools-Test-output/Column_Mean_Histogram.png")
    
    plt.show()
    
    return()

#========== test create variable number output files in Galaxy
def CreateFiles(output_file_info):    
    
        for i in range(3):
            fd= open( output_file_info, 'w')
            fd.write('File number = '+ str(i)+"\n")
            fd.close()
            
        return()
    
#==================
    
    #Define Main Function
def main():
    try:
        args = get_args()
        #sys.stdout.write(str(args)+"\n")
        nanList= ["NAN", "NA", "N/A", "-","?","nan", "na", "n/a"]

        matrix, og_cols,og_rows = reader(args.input_file_txt)
        #old_reader  matrix, og_rows, og_cols = reader(args.input_file_txt)
#         if float(args.thresh) < 0.000001:
#             print('Invalid negative threshold chosen = '+str(args.thresh)+" choose positive value")
#             sys.exit(-4)
            
        if args.choice == "Histogram":
            Histo(matrix)
        elif args.choice == "CreateFiles":
            CreateFiles(args.output_file_info)
            
        elif args.choice == "Variance":
            if args.axes == "Row":
                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = Variance_Percent_Filter_row(matrix,1,og_rows,og_cols,True)
                labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
#                 if delCnt < 1:
#                     print('\nNO Filtering occurred for rows using variance < '+str(args.thresh)+ ' by row. Matrix row minimum variance=  %.2f' % minVal+' and maximum variance=  %.2f' % maxVal)
#                     sys.stderr.write('\nFiltering out rows using variance < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
#                     sys.exit(-1)
#                 else:   
#                     print('\nFiltering out rows using variance < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
            elif args.axes == "Column":
                matrix, filter_rows, filter_cols,delCnt,minVal,maxVal = Variance_Percent_Filter_col(matrix,1,og_rows,og_cols,True)
                labeler(matrix,filter_rows,filter_cols,args.output_file_txt)
#                 if delCnt < 1:
#                     print('\nNO Filtering occurred for columns using variance < '+str(args.thresh)+ ' by columns. Matrix columns minimum variance=  %.2f' % minVal+' and maximum variance=  %.2f' % maxVal)
#                     sys.stderr.write('\nFiltering out rows using variance < '+str(args.thresh)+ ' removed '+str(delCnt)+' rows')
#                     sys.exit(-1)
#                 else:   
#                     print('\nFiltering out columns using variance < '+str(args.thresh)+ ' removed '+str(delCnt)+' columns')
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
    print("\nFini")
    sys.exit(0)