#!/usr/bin/env python

# created by Bob Brown.     rbrown@insilico.us.com
#=========================
#DOCKERIZED VERSION Big Query to NGCHM data via ISB API
#========================================
#v1 June2016 major change to use list of stats and ONLY compare values for a gene against values for ALL other Gene values from user supplied Partic/Sample list
# v5 switch from  tcga_201607_beta to tcga_201607_beta for data -bb

# by Bob Brown 31 May 2016
# Using a set of Participants (Control and Disease) plus a Study retrieve all genes.
# Perform Statistical Analysis on UNC RPKM normalized values.  
# https://cloud.google.com/bigquery/query-reference#syntax       STDDEV_SAMP(numeric_expr)
# TOP() function
# TOP is a function that is an alternative to the GROUP BY clause. It is used as simplified syntax for GROUP BY ... ORDER BY ... LIMIT .... 
#  Generally, the TOP function performs faster than the full ... GROUP BY ... ORDER BY ... LIMIT ... query, but may only return approximate results. The following is the syntax for the TOP function:
#
# change bb aug10
# bb sep1 TODO set not found N/A to -1 
# bb sep13 changed HiSeq and GA  to combined tables that are in ISB Beta release


# first is Standard Deviation for each Gene across input Participants 

import sys               
import traceback 
#import gcp.bigquery as bq
import os
#os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/rbrown/HM_galaxy/tools/MDA_Heatmaps/NGCHMgalaxy-34c277121883.json'
#os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/rbrown/HM_galaxy/tools/MDA_Heatmaps/isb-cgc-bq-a4d8832f7d0c.json'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/data/Galaxy_ISB_NGCHM_BigQuery.json'      # moved to /data in docker

#import pprint
import sys

sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/')
sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/rsa/')

sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/pyasn1/')
from pyasn1 import *

sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/pyasn1/pyasn1/')
from type import *

sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/pyasn1/pyasn1/codec/ber/')
# import pyasn1.codec.ber 
##bb from decoder import *

#sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/pyasn1/pyasn1/codec/ber/')

sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/pyasn1-modules/')
#from pyasn1_modules import *

sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/bq/third_party/')
import apiclient
from apiclient.discovery import build
import oauth2client 

import argparse

#from apiclient.discovery import build
from apiclient.errors import HttpError
from oauth2client.client import GoogleCredentials


sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/lib/')
sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/bin/')
#sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/lib/googlecloudsdk/api_lib/bigquery/')
sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/lib/googlecloudsdk/third_party/apis/bigquery/')
#sys.path.append('/usr/local/lib/python2.7/dist-packages/google-cloud-sdk/platform/gsutil/third_party/oauth2client/tests/data/gcloud/')

#from bigquery import *
#bbfrom gcloud import bigquery
#bbfrom gcloud.bigquery import dataset

import string

###================              ============
def GetSampleBCsForParticipants(keepNormals, pfile, study, query_request, project_id ):
    
# get sample barcodes as is from file and convert participant  barcodes to their sample barcodes

    try:
        error = False
        alreadySample = True
        sampleBarCodes    = {}
        ParticipantText = ' BS.ParticipantBarCode in ( '
#         error = False                  
        ParticipantList= ''
        sampfile = open(pfile,'rU') 
        rowCnt =0
        for row in sampfile:
            rowCnt +=1
            a= row[:].split('\t')  #  separate out first field
            #print 'aaaaaa    ', a
            tmp = a[0].replace('\n','') 
            tmp = tmp.replace(' ','') 
            tmp = ''.join([c for c in tmp if ord(c) > 31 or ord(c) == 9])
            #print 'len tmp ', len(tmp), tmp
            if len(tmp) == 16: 
                sampleBarCodes[tmp]='s'
                if len(sampleBarCodes) == 1: print ' First sample bar code= ', sampleBarCodes
            elif len(tmp) < 12    or len(tmp) > 12: 
                print 'Participant barcodes length too SHORT -- it may contain GENE names instead ', tmp, '.\n'
                error = True
                return {}, '', error                
            else:
                ParticipantList= ParticipantList + '"'+tmp+'",'
                alreadySample = False
    
        
        if not alreadySample :    
            ParticipantList = ParticipantText+ ParticipantList[:-1] + ' );'
        
            queryString = 'SELECT  BS.SampleBarcode FROM [isb-cgc:tcga_201607_beta.Clinical_data] as PA JOIN [isb-cgc:tcga_201607_beta.Biospecimen_data] as BS '+ \
                                        ' ON PA.ParticipantBarcode = BS.ParticipantBarcode WHERE BS.Study = '+study+ ' AND '+ParticipantList 
                                        
            query_data = { 'query': ( queryString ) }
        
            query_response = query_request.query(
                projectId=project_id,
                body=query_data).execute()
            print ' query string= ',queryString, '\n'
                            
            if 'rows' in query_response:
                for row in query_response['rows']:                  
                    for field in row['f']:
                        sampleBarCodes[field['v']] ='s'       # add sanmple BCs to dict
            else:
                print ' No Samples found for Participant Barcodes supplied'

            #print ' after reutltsasffasf= ',rowCnt, '\n'

        #STOP strip out Normal '-10A' samples from dict //bb july7- issue isn't non 01a or 10a values it is DUPLICATE values
            if not keepNormals: 
                tmpDict= sampleBarCodes
                sampleBarCodes = {}
                for key in tmpDict: 
                    #todo are axamples of samples with other tumor codes especiallyin BLCA
                    if "-0"     not in key:  sampleBarCodes[key]= tmpDict[key]      #bb aug10
#          else: # keepNormals
#              tmpDict= sampleBarCodes
#              sampleBarCodes = {}
#              for key in tmpDict: 
#                  #todo are axamples of samples with other tumor codes especiallyin BLCA
#                  if ("-01A"  in key) or ("-10A"  in key):    sampleBarCodes[key]= tmpDict[key]                
        
        print 'Sample Barcodes left', len(sampleBarCodes)
        #for key in sampleBarCodes: print key
        # create a new sample query string for next routine
        #debug for key in sampleBarCodes:  sys.stdout.write(str(key)+'\n')
        if len(sampleBarCodes) > 2:
            sampleString = ' BS.SampleBarCode in ( '
            for key in sampleBarCodes:    sampleString = sampleString + '"'+key+'",'
            sampleString = sampleString[:-1] + ' ) '
        else: 
            print rowCnt,' is less than 3 Participant/Sample barcodes needed to perform Standard Deviation ....\n'
            error = True
            return {}, '', error
        

        sampfile.close()
        #print ' output error, sampleBarCodes, sampleString= ', error, '-- ', sampleString
        #sys.stdout.write(' output error, sampleBarCodes, sampleString= '+ error+ sampleBarCodes+ ' \n'+ sampleString)
    except:
        sys.exit(-1)
 
    return sampleBarCodes, sampleString, error
                
###================              ============
def GetSDforStudy(reqCutoff, sampleString, study, tableType, query_request, project_id, datasetId, tableId):
# Loop through 1/3 of genes at a time for all participants SAMPLES
#      SELECT Gene  SD and AVG 
#  for all genes input in the list
# if normalized gene SD is above  reqCutoff percentile then add it to output matrix
# Update Dictionary [ gene ]= (SD, AVG)


    try:
        error        = False
        queryString = ''
        SDorderDict = {}
        genesOverPercentile = {}
        
# LOOP 3Xs to get data for all 21000ish     genes
        for k in range(3):     #TODO debug showld be 3  bb
            if     k == 0:   geneLikeClause= ' AND HGNC_gene_symbol < "J%" '
            elif k == 1:   geneLikeClause= ' AND HGNC_gene_symbol >= "J%" AND HGNC_gene_symbol < "R%" '
            else:         geneLikeClause= ' AND HGNC_gene_symbol >= "R%" '

            if tableType == 'mRNA_BCGSC_HiSeq_RPKM':
                queryString = ' SELECT MRNA.HGNC_gene_symbol AS gene, AVG( MRNA.RPKM ) AS average, STDDEV_SAMP( MRNA.RPKM ) AS SD ' \
                    ' FROM [isb-cgc:tcga_201607_beta.mRNA_BCGSC_HiSeq_RPKM] as MRNA JOIN [isb-cgc:tcga_201607_beta.Biospecimen_data] as BS ' \
                   ' ON MRNA.ParticipantBarcode = BS.ParticipantBarcode WHERE  MRNA.Study = '+study+ \
                     '    AND     '+ sampleString +geneLikeClause+ \
                   '    Group by gene ;'
    
        #select normalized_count        <option value="mRNA_UNC_HiSeq_RSEM">mRNA_UNC_HiSeq_RSEM - requires Gene and Participant input files</option>
    
        #     ParticipantBarcode IN ( , , , )
            elif tableType == 'mRNA_UNC_HiSeq_RSEM':
                queryString = ' SELECT MRNA.HGNC_gene_symbol AS gene, AVG( MRNA.normalized_count ) AS average, STDDEV_SAMP( MRNA.normalized_count ) AS SD ' \
                    ' FROM [isb-cgc:tcga_201607_beta.mRNA_UNC_HiSeq_RSEM] as MRNA JOIN [isb-cgc:tcga_201607_beta.Biospecimen_data] as BS ' \
                   ' ON MRNA.ParticipantBarcode = BS.ParticipantBarcode WHERE  MRNA.Study = '+study+ \
                     '    AND     '+ sampleString +geneLikeClause+ \
                    '     Group by gene;' 
    
            else:
                print '\n Table Type not found ', tableType
                error = True
                return {},"", error
        
            #print '\n Stats queryString = ', queryString,'\n'
            query_data = { 'query': ( queryString ) }
    
            query_response = query_request.query(
                projectId=project_id,
                body=query_data).execute()
    
            rowNum= 0
            if 'rows' in query_response:
                for row in query_response['rows']:                  
                    cntr= 0
                    rowNum +=1
                    for field in row['f']:
                        cntr += 1
                        if cntr == 1: gene       = field['v'] 
                        if cntr == 2: average  = field['v'] 
                        if cntr == 3: SD       = field['v'] 
                                                
                        #if not( gene in genesOverPercentile): print ' Found gene we did not have initially ', gene, '\n'
                    if float(average) <> 0 :
                        normSD = float(SD)* 100.0 /float(average)
                    else:
                        normSD = 0.0  # put at bottom of list
                    SDorderDict[str('%.2f' % normSD)+"-"+gene] = gene
                           
                    #if len(SDorderDict) < 6:  #todo debug or not? 
                    #     print 'For study= '+ study+ ' Gene AVG SD =', gene, "%.2f" % float(average), "%.2f" % float(SD), "%.2f" % float(normSD)


        #only put genes with SD %tile above cutoff in output list
        sortedSDs = sorted(SDorderDict.items())
        cutRow      = (len(SDorderDict) * reqCutoff/100.0) -1
    
        print 'Length of SDorderDict rowNum * reqCutoff= cutRow ', len(SDorderDict), rowNum, reqCutoff, cutRow, '\n'
        
        for j in range(len(sortedSDs)): 
            #if j < 5 or j > ( len(sortedSDs) -5): print ' count and norm SD values =', j, '-', sortedSDs[j][0]
            
            if j >= cutRow: 
                genesOverPercentile[sortedSDs[j][1]]= sortedSDs[j][0]  # get gene name
            
        if len(genesOverPercentile) < 1:
            print 'ERROR NO Gene results Found \n'
            error = True
            sys.exit(-1)
                

    except HttpError as err:
        print('Error: {}'.format(err.content))
        raise err
    #print 'out lengths genesOverPercentile, sampleString, sampleDict= ',len(genesOverPercentile), len(sampleString), len(sampleDict), '\n'
    
    return genesOverPercentile, error


###================              ============
def GetResults( genesOverPercentile, sampleDict, sampleString, ofile, study, tableType, query_request,project_id ):
#
# Loop through all genes 1/3 at a time for user supplied participants ONLY to get NORMALIZED VALUES (NV) for all SAMPLES in study = xx 
# if cohort Id > 12 THEN is sample ID  instead    !!!!
#       SELECT  gene NV
#       WHERE   
#            user supplied Participants IN ( 1,2,3,4)   OR IF Samples   SampleBarcode IN (1,2,3,4)
# AND    Gene In (genesOverPercentile 1,2,3,4) Group by Gene
#  
# Get  NV match to Dict
#            Dict    AVG(Gene[i]) +(SD(Gene[i])    < NV  or   > NV       => output Gene


    try:
        lenGenesOverPercentile= len(genesOverPercentile)
        print 'GetResults # genesOverPercentile & # samples= ',lenGenesOverPercentile,    len(sampleDict), '\n'
        sampleString =    sampleString[4:]
        rowCnt= 0

        #Big Query limits each result list to 10,000 hits so break query up by expected number of results
        
        hits = lenGenesOverPercentile * len(sampleDict) 
        runs = (hits/9000)+1
        genesPerRun = lenGenesOverPercentile/runs
        print 'genesPerRun /result rows / queryloops =', genesPerRun, hits, runs,'\n'
        
        for k in range(runs):
            start = k*genesPerRun    # range of gene names to include in this query
            end      = start+ genesPerRun -1
            if end > lenGenesOverPercentile: end= lenGenesOverPercentile-1
            if start <= end: 
            
                geneLikeClause= ' AND HGNC_gene_symbol in ('
                n= -1
                tempGene= {}  # save for writing results for this subset of genes
                for key in genesOverPercentile:
                    n +=1 
                    if n >= start and n <= end: 
                        geneLikeClause += '"'+key+'",'
                        tempGene[key]= key
                geneLikeClause = geneLikeClause[:-1]
                geneLikeClause += ' ) '
            
                print '>>>>> start end # runs geneLikeClause= ', start, end, runs, geneLikeClause, '\n'
                
    #          else:
    #              runs = 3
    #          for k in range(runs): 
    #              if runs <> 1:     #todo fix geneLikeClause for specific genes in that range only not all genes as is now
    #                  if   k == 0:     geneLikeClause= 'AND HGNC_gene_symbol < "J%" '
    #                  elif k == 1:     geneLikeClause= 'AND HGNC_gene_symbol >= "J%" AND HGNC_gene_symbol < "R%" '
    #                  else:             geneLikeClause= 'AND HGNC_gene_symbol >= "R%" '
    
                if tableType == 'mRNA_BCGSC_HiSeq_RPKM':
    
                    queryString = 'SELECT  HGNC_gene_symbol as gene, SampleBarcode, RPKM as NV '\
                          ' FROM [isb-cgc:tcga_201607_beta.mRNA_BCGSC_RPKM] WHERE     Study = '+study+ \
                         '    AND     '+ sampleString +geneLikeClause+ \
                          '       Order by gene, SampleBarcode;'
        
        #select normalized_count        <option value="mRNA_UNC_HiSeq_RSEM">mRNA_UNC_HiSeq_RSEM - requires Gene and Participant input files</option>
        
                elif tableType == 'mRNA_UNC_HiSeq_RSEM':
        #bb 2Jun   http://stackoverflow.com/questions/12323757/how-sql-query-result-insert-in-temp-table
        #bb 2Jun             queryString = ' SELECT     ParticipantBarcode , original_gene_symbol, normalized_count INTO '+datasetId+ "."+ tableId
    #                 if stat_type == 'STDDEV_SAMP':
                     queryString = 'SELECT    HGNC_gene_symbol as gene, SampleBarcode, normalized_count as NV '\
                        ' FROM [isb-cgc:tcga_201607_beta.mRNA_UNC_RSEM]    WHERE  Study = '+study+ \
                         '    AND     '+ sampleString +geneLikeClause+ \
                        '     Order by gene,     SampleBarcode;' 
    
                else:
                    print '\nERROR RETURN Table Type not found = ', tableType
                    error = 'true'
                    print('Error: {}'.format(err.content))
                    return 
    
               #todo if k == 0:     
                #todo     print 'MATRIX final queryString = ', queryString, '\n' # [0:100],' ... ', queryString[-10:-1] ,'\n'
    
                query_data = { 'query': ( queryString ) }
                        
                #for key in sampleDict: print ' key ', key    #todo remove is debug
    
    #bb 31may  how to get response to go into table below
    #     https://cloud.google.com/bigquery/docs/reference/v2/tables/update#response
    #     Bigquery.Tables.Update request = bigqueryService.tables().update(project_id, datasetId, tableId, content);
    #     Bigquery.Tables.Update request = bigqueryService.tables().update(project_id, datasetId, tableId, content);
     #     Table response = request.execute();
    
    
                query_response = query_request.query(
                    projectId=project_id,
                    body=query_data).execute()
    
    
     #bb 31may get data from table     https://cloud.google.com/bigquery/docs/reference/v2/tables/get#response
    #     Bigquery.Tables.Get request = bigqueryService.tables().get(projectId, datasetId, tableId);
     #     Table response = request.execute();
        # loop results into dict
    
                #print('Query Results:')
                #if query_response['totalRows'] != u'0':
                if 'rows' in query_response:
                    #not used uniqueSDGenes = {}
    
                    if k == 0:    # first time open output and write sample bcs in first row
                        outgene=open(ofile,'w')
                        outgene.write('\t')     # move sample barcodes over one column
                        
                        sortedSamples = sorted(sampleDict.items())
                        lenSortedSamples = len(sortedSamples) 
        
                        for s in range(lenSortedSamples-1):
                            outgene.write(str(sortedSamples[s][0]) +'\t')
                        outgene.write(str(sortedSamples[lenSortedSamples-1][0])+'\n')
                            
                    #rowCnt=  0
                    sampleCnt=    -1
                    prevGene    = ''
                    prevSample = ''
                    NVdict       =  {}
                    loopCnt       = 0
                    for row in query_response['rows']:
    #bb jul7                    sampleCnt +=1
                        rowCnt    +=1
                        loopCnt +=1
                        #if rowCnt < 5:          print('\t'.join(str(field['v']) for field in row['f']))
                    
                        cntr = 0
                        for field in row['f']:
                            cntr += 1
                            if cntr == 1: 
                                gene  = field['v']
                            elif cntr == 2: sampleBC = field['v']
                                #                         if cntr == 3: # value for NV                            
                            elif cntr == 3 : # value for NV and check if dup NV for gene sample pair               
                                #only using the last NV value for a gene sample 
                                NVdict[str(sampleBC) +'-'+str(gene)] = str("%0.2f" % float(field['v']))
                            elif( cntr <> 3): 
                                print '*** unexpected extra field in query hit list for cntr, row, & value=',cntr, rowCnt, str(field['v']) 
                                print "no mRNA expression data for    gene sample pair", gene, sampleBC+'\t'    
                                print 'sampleBC sortedSamples[sampleCnt][0]', sampleBC,     sortedSamples[sampleCnt][0], '\n'
    #                         else: print 'Dup NV for gene sample pair not stored and prevSample = ', gene, sampleBC, prevSample
                    
                    print' RESULT for loop= ', k, ' query results for genes = ', tempGene,'new result rows=', loopCnt, ' \n'
    
                    if loopCnt > 0:
    #                         for g in sorted(genesOverPercentile.items()):
                        sortedGenes = sorted(tempGene.items())
                        
                        for g in range(0,len(tempGene)):
                            outgene.write(str(sortedGenes[g][0]) +'\t')
    
                            for s in range(0,lenSortedSamples-1):
                                key=  str(sortedSamples[s][0])+'-'+str(sortedGenes[g][0])
                                if key in NVdict:    
                                    outgene.write(NVdict[key]+'\t')
                                else:
                                    outgene.write('-1\t')  #bb Sep1  TODO what should it be???
                            
                            # last column value
                            key=  str(sortedSamples[lenSortedSamples-1][0])+'-'+str(sortedGenes[g][0])
                            if key in NVdict:    
                                outgene.write(NVdict[key]+'\n')
                            else:
                                outgene.write('NA\n')
    
                    else:
                        print '!!!!ERROR NO individual result records returned !!!'
                        outgene.close()
                        sys.exit(-1)
                        
        print ' ',rowCnt,' Gene result rows processed \n'
        outgene.close()
                
        
    except HttpError as err:
        outgene.close()
        print('Error: {}'.format(err.content))
        raise err

    return


###================              ============
def main():

    # Grab the application's default credentials from the environment.
    # check the command line
    #outFile = "/Users/bobbrown/Desktop/bobMatrixOut.txt"

    try:
        name                 = '"'+sys.argv[1]+'"'
        pfile                 =     sys.argv[2]
        study                 = '"'+sys.argv[3]+'"'            
        tableType             =     sys.argv[4]         
        ofile                 =     sys.argv[5]          # list of unique gene names that outside sd range 
        reqType                 =     sys.argv[6]
        reqCutoff             =     float(sys.argv[7])
        #keepNormals          =      sys.argv[8]  below keep Normals in final matrix 

        keepNormals= False
        if sys.argv[8] == "Y": keepNormals= True
        
        credentials = GoogleCredentials.get_application_default()

        # Construct the service object for interacting with the BigQuery API.
        bigquery_service = build('bigquery', 'v2', credentials=credentials)

#         project_id= 'ngchmgalaxy'
#        project_id= 'isb-cgc-bq'
        projfile= '/data/Galaxy_ISB_NGCHM_BigQuery_Project_ID.txt' #should only contain one row with id in docker dir /data
        pxxxfile=open(projfile,'rU')
        cnt= 0

        for row in pxxxfile:
            cnt +=1
            if cnt == 1: 
                a= row[:].split('\t')  #  separate out first field
                project_id = a[0].replace('\n','') 

        sys.stdout.write('Project ID supplied from directory mapped to /export/credentials/Galaxy_ISB_NGCHM_BigQuery_Project_ID.txt= '+ project_id+ '\n')
        pxxxfile.close()

        datasetId = "Gene_Filtering"
        tableId      = "Gene_RPKM_Results"      # (Created via the Web)

        # check the command line
        sys.stdout.write(' starting Statitical Gene Analysis on Genes in Sample List. Arguments=')
        sys.stdout.write(str(sys.argv[1:])+'\n')

        #outFile = '/Users/bobbrown/Desktop/bobMatrixOut.txt'

#bb 31may add table to store query output to NGCHMgalaxy project  (Created via the Web)
#     https://cloud.google.com/bigquery/docs/reference/v2/tables#methods
#         POST https://www.googleapis.com/bigquery/v2/projects/NGCHMgalaxy/datasets/datasetId/tableId
#     Bigquery.Tables.Insert request = bigqueryService.tables().insert(projectId, datasetId, content);
#    Table response = request.execute();

#         query_request = bigquery_service.jobs()
      
 # determine the request type made sys.argv[6] is type and sys.argv[7] is value
        if reqCutoff < 0 : reqCutoff= 0
        if reqCutoff > 100: reqCutoff= 100
        
        if      reqType == "Stat_STDDEV_SAMP":
        
            query_request = bigquery_service.jobs()

            sampleDict, sampleString, error = GetSampleBCsForParticipants(keepNormals, pfile, study, query_request, project_id )
            
            if not error:  
            
                query_request = bigquery_service.jobs()
                 
                genesOverPercentile, error= GetSDforStudy(reqCutoff, sampleString, study, tableType, query_request,project_id, datasetId, tableId)
    #        
                if not error:  # not used 
                    query_request = bigquery_service.jobs()
                 
                    GetResults(genesOverPercentile, sampleDict,sampleString, ofile, study, tableType, query_request,project_id)
                else:
                    print' error returned from genesOverPercentile \n'
                    sys.exit(-1)
            else:
                print' error returned from Get Sample Barcodes \n'
                sys.exit(-1)
        else:
            print '\n **** did not recognize statistic request type ***'
            sys.exit(-1)
            
    except HttpError as err:
        print('Error: {}'.format(err.content))
        raise err


    return
##
##

if __name__ == '__main__': main()
