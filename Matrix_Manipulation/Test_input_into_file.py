#!/usr/bin/env python

#Created on Jule 23, 2018

# @author: Bob Brown 

import sys
import os

def main():

    # Grab the inputs from the Galaxy xml interface and write to a file that is passed to the program
    # Not each of the  parameters as separate command line variables.
#    ab_gene_name_for_header={}
#    ab_rrid_for_header={}
    dir= "/Users/bobbrown/Desktop/junk/"
    accepted_extensions = ["csv", "tsv"]
    filenames = [fn for fn in os.listdir(dir) if fn.split(".")[-1] in accepted_extensions]    
    for f in filenames:
        print("filename= "+f)
        os.remove(dir+f)
        
    sys.exit(0)
    
    ab_gene_name_for_header={'abc':'geneName'}
    ab_rrid_for_header={'abc':'rrid123'}
    line=  'abc,123\n'
    
    pos= line.find(",")
    ABname= line[0:pos]
    ABnewName= ABname+ "|"+ab_gene_name_for_header[ABname]+"|"+ab_rrid_for_header[ABname]    
    line= ABnewName+line[pos:]
    line= line.replace(',','\t')
    sys.exit(0)
#    try:
    print(' \n starting Test program read params from file stored in tools dir. Arguments=')
    print(str(sys.argv[1:])+'\n')
                
    if False:
        infileName    = sys.argv[1]
    #    directory     = sys.argv[2]
        directory     = '/Users/bobbrown/Desktop/'
        outfileName   = sys.argv[3]   #use later
    #        outfile      = sys.argv[6]
        
    #sys.stdout.write
    
     #   ifile= open(directory+"/"+infileName,'rU')
        ifile= open(directory+infileName,'rU')
        ofile= open(directory+outfileName,'w')
    #    ofile= open('/Users/bobbrown/Desktop/TestOutFileVarParams.txt','w')
    
        cnt= 0
    #     for param in range(2,len(sys.argv)):
    #         cnt +=1
    #         ofile.write("param "+str(cnt)+"= "+param+"\n")
    
    
        for param in ifile:
            cnt +=1
            ofile.write("param "+str(cnt)+"= "+param)
     
        ifile.close()
    
        ofile.close()
    
        print('Fini -- rows read = '+str(cnt)+'\n')        

#    except :
#        print('Error>>> ')

    return
##
##

if __name__ == '__main__': main()
    #sys.exit(0)