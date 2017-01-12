#!/usr/bin/env python

# created by Bob Brown.     rbrown@insilico.us.com
#=========================
#DOCKER IZED version Big Query to NGCHM data via ISB API
#========================================

# by Bob Brown 31 May 2016
# Using a set of Participants (Control and Disease) plus a Study retrieve all genes.
# Perform Statistical Analysis on UNC RPKM normalized values.  
# https://cloud.google.com/bigquery/query-reference#syntax       STDDEV_SAMP(numeric_expr)
# TOP() function
# TOP is a function that is an alternative to the GROUP BY clause. It is used as simplified syntax for GROUP BY ... ORDER BY ... LIMIT .... 
#  Generally, the TOP function performs faster than the full ... GROUP BY ... ORDER BY ... LIMIT ... query, but may only return approximate results. The following is the syntax for the TOP function:


# first is Standard Deviation for each Gene across input Participants 
# bb sep13 changed HiSeq and GA  to combined tables that are in ISB Beta release


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
def GetSDforStudy(geneSDAvginfo, SDreq, study, tableType, stat_type, samp_type, query_request, project_id, datasetId, tableId):
# Loop through 1/3 of genes at a time for all participants SAMPLES
#      SELECT Gene  SD and AVG f
# or all genes in study = xx   and YES Samples will be have samp_type = Normal or Tumor all)?
# 
# Update Dictionary [ gene ]= (SD, AVG)


    try:
        queryString = ''
        norm_tumor_low = '00'
        norm_tumor_high= '99'
            #print '\n number samp_type fields +outfile, i , list of samp_types=', len(samp_type)-2, i, samp_type
                          
        #determine if cohort metadata column values are categorical           (cat) one value       OR numeric (num) with a min and max value
# Tumor types range from 01 - 09, normal types from 10 - 19 and control samples from 20 - 29. See Code Tables Report for a complete list of sample codes
# IT IS DEFINED IN THE DB AS A STRING !!!!!!

        if samp_type == '01':
            norm_tumor_low = '00'
            norm_tumor_high= '10'
        elif samp_type == '10':
            norm_tumor_low = '09'
            norm_tumor_high= '20'
        elif samp_type == '11':
            norm_tumor_low = '00'
            norm_tumor_high= '20'
        elif samp_type == '20':
            norm_tumor_low = '19'
            norm_tumor_high= '30'
        
# LOOP 3Xs to get data for all 21000ish     genes
        for k in range(3):
            if     k == 0:   geneLikeClause= 'AND HGNC_gene_symbol < "J%" '
            elif k == 1:   geneLikeClause= 'AND HGNC_gene_symbol >= "J%" AND HGNC_gene_symbol < "R%" '
            else:         geneLikeClause= 'AND HGNC_gene_symbol >= "R%" '

            if tableType == 'mRNA_BCGSC_HiSeq_RPKM':
                queryString = ' SELECT MRNA.HGNC_gene_symbol AS gene, AVG( MRNA.RPKM ) AS average, STDDEV_SAMP( MRNA.RPKM ) AS SD ' \
                    ' FROM [isb-cgc:tcga_201510_alpha.mRNA_BCGSC_HiSeq_RPKM] as MRNA JOIN [isb-cgc:tcga_201510_alpha.Biospecimen_data] as BS ' \
                   ' ON MRNA.ParticipantBarcode = BS.ParticipantBarcode WHERE  MRNA.Study = '+study+ \
                   '  AND BS.SampleTypeCode > "'+str(norm_tumor_low) + '" AND BS.SampleTypeCode < "'+str(norm_tumor_high) + '" ' +geneLikeClause+ \
                   '    Group by gene ;'
    
        #select normalized_count        <option value="mRNA_UNC_HiSeq_RSEM">mRNA_UNC_HiSeq_RSEM - requires Gene and Participant input files</option>
    
        #     ParticipantBarcode IN ( , , , )
            elif tableType == 'mRNA_UNC_HiSeq_RSEM':
                queryString = ' SELECT MRNA.HGNC_gene_symbol AS gene, AVG( MRNA.normalized_count ) AS average, STDDEV_SAMP( MRNA.normalized_count ) AS SD ' \
                    ' FROM [isb-cgc:tcga_201510_alpha.mRNA_UNC_HiSeq_RSEM] as MRNA JOIN [isb-cgc:tcga_201510_alpha.Biospecimen_data] as BS ' \
                   ' ON MRNA.ParticipantBarcode = BS.ParticipantBarcode WHERE  MRNA.Study = '+study+ \
                   '  AND BS.SampleTypeCode > "'+str(norm_tumor_low) + '" AND BS.SampleTypeCode < "'+str(norm_tumor_high) + '" ' +geneLikeClause+ \
                    '     Group by gene;' 
    
            else:
                print ' Table Type not found ', tableType
                return -1,-1
        
            #print '\nStats queryString = ', queryString,'\n'
            query_data = { 'query': ( queryString ) }
    
            query_response = query_request.query(
                projectId=project_id,
                body=query_data).execute()
    
            if 'rows' in query_response:
                rowNum= 0
                for row in query_response['rows']:                  
                    cntr= 0
                    rowNum +=1
                    for field in row['f']:
                        cntr += 1
                        if cntr == 1: gene       = field['v'] 
                        if cntr == 2: average  = field['v'] 
                        if cntr == 3: SD       = field['v'] 
                                                
#                         if not( gene in geneSDAvginfo): print ' Found gene we did not have initially ', gene, '\n'
                    geneSDAvginfo[gene]= [average,SD]
                           
                    if k == 0 and rowNum < 5: print 'For study= '+ study+ ' Gene AVG SD =', gene, average, SD, '\n'
                if k == 2: print 'Length of geneSDAvginfo= ', len(geneSDAvginfo), '\n'
            else:
                print 'ERROR NO Gene results Found \n'

    except HttpError as err:
        print('Error: {}'.format(err.content))
        raise err

    return geneSDAvginfo


###================              ============
def GetResults(SDreq, geneSDAvginfo, pfile, ofile, study, tableType, stat_type, query_request,project_id, datasetId, tableId ):

# Loop through all genes 1/3 at a time for user supplied participants ONLY to get NORMALIZED VALUES (NV) for all SAMPLES in study = xx 
# if cohort Id > 12 THEN is sample ID  instead    !!!!
#       SELECT  gene NV
#       WHERE   
#            user supplied Participants IN ( 1,2,3,4)   OR IF Samples   SampleBarcode IN (1,2,3,4)
# AND    Gene In (geneSDAvginfo 1,2,3,4) Group by Gene
#  
# Get  NV match to Dict
#            Dict    AVG(Gene[i]) +(SD(Gene[i])    < NV  or   > NV       => output Gene


    try:
        ParticipantText = 'ParticipantBarCode'
#         error = False                  
        sampleList= ''
        sampfile = open(pfile,'rU')               
        for row in sampfile:
            a= row[:].split('\t')  #  separate out first field
            #print 'aaaaaa    ', a
            tmp = a[0].replace('\n','') 
            tmp = tmp.replace(' ','') 
            tmp = ''.join([c for c in tmp if ord(c) > 31 or ord(c) == 9])
            
            sampleList= sampleList + '"'+tmp+'",'
        sampleList = sampleList[:-1]
        if len(tmp) > 12: ParticipantText = 'SampleBarCode' # then ids are Participant barcodes      else are    sample    barcodes

        #print 'sampleList/ ParticipantList= ',sampleList

        rowcnt= 0
        
        outfile=open(ofile,'w')
#         outfile.write( 'Gene\tRPKM or Normalized Value\tAverage\tStdDev\tBound of StdDevs=\t'+str(SDreq)+' * SD\tStudy '+study+'DB Table'+tableType+'\n' )

        for k in range(3):
            if     k == 0:   geneLikeClause= 'AND HGNC_gene_symbol < "J%" '
            elif k == 1:   geneLikeClause= 'AND HGNC_gene_symbol >= "J%" AND HGNC_gene_symbol < "R%" '
            else:           geneLikeClause= 'AND HGNC_gene_symbol >= "R%" '

            if tableType == 'mRNA_BCGSC_HiSeq_RPKM':
                if k == 0:
                    outfile.write( 'Gene\tRPKM\tAverage\tStdDev\tBound of StdDevs= '+str(SDreq)+' *SD\t\tStudy '+study+'\tDB Table'+tableType+'\n' )

                queryString = 'SELECT  HGNC_gene_symbol as gene, RPKM as NV '\
                         ' FROM [isb-cgc:tcga_201510_alpha.mRNA_UNC_RSEM]     WHERE    Study = '+ study+ \
                         '    AND     '+ParticipantText+' in ( ' + sampleList + ') ' +geneLikeClause+ \
                          '     Group by gene, NV;'
    
    #select normalized_count        <option value="mRNA_UNC_HiSeq_RSEM">mRNA_UNC_HiSeq_RSEM - requires Gene and Participant input files</option>
    
            elif tableType == 'mRNA_UNC_HiSeq_RSEM':
    #bb 2Jun   http://stackoverflow.com/questions/12323757/how-sql-query-result-insert-in-temp-table
    #bb 2Jun             queryString = ' SELECT     ParticipantBarcode , original_gene_symbol, normalized_count INTO '+datasetId+ "."+ tableId
#                 if stat_type == 'STDDEV_SAMP':
                if k == 0:
                    outfile.write( 'Gene\tNormalized Value\tAverage\tStdDev\tBound of StdDevs= '+str(SDreq)+' *SD\t\tStudy '+study+'\tDB Table '+tableType+'\n' )
                queryString = 'SELECT  HGNC_gene_symbol as gene, normalized_count as NV '\
                     ' FROM [isb-cgc:tcga_201510_alpha.mRNA_UNC_RSEM]     WHERE    Study = '+ study+ \
                     '    AND     '+ParticipantText+' in ( ' + sampleList + ') ' +geneLikeClause+ \
                      ' Group by gene, NV;'

            else:
                print '\nERROR RETURN Table Type not found = ', tableType
                error = 'true'
                print('Error: {}'.format(err.content))
                return 

# queries not implemented follow
#          <option value="Somatic_Mutation_calls">Somatic_Mutation_calls - requires Gene and Participant input files</option>
#          <option value="Annotations">Annotations - requires only Participant input file</option>
#          <option value="Biospecimen_data">Biospecimen_data - requires only Participant input file</option>
#          <option value="Copy_Number_segments">Copy_Number_segments - requires only Participant input file</option>
#          <option value="DNA_Methylation_betas">DNA_Methylation_betas - requires only Participant input file</option>

       
#              queryString = queryString+ ' AND ParticipantBarcode IN ('
#              for s in sampleList:
#                    queryString = queryString+ '"'+ s + '", '
#              queryString = queryString[:-2] + ');'
         
            if k == 0: print '\nRESULT routine queryString = ', queryString,'\n'
            #print 'queryString first 100 chars & last 10= ', queryString[0:100],' ... ', queryString[-10:-1] ,'\n'
            query_data = { 'query': ( queryString ) }
                    


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
                #print' RESULT the first 5 query results for ', len(sampleList),' unique samples or participants and ', len(geneSDAvginfo), ' unique genes \n'
            #if TRUE:
                for row in query_response['rows']:
                    rowcnt += 1
                    #degug if rowcnt < 5:        print('\t'.join(str(field['v']) for field in row['f']))
                
                    cntr = 0
                    for field in row['f']:
                        cntr += 1
                        if cntr == 1: gene = field['v'] 
                        if cntr == 2: NV = field['v'] 
                                            
                    if gene in geneSDAvginfo:
                        upperBound = float(geneSDAvginfo[gene][0]) +float(SDreq)* float(geneSDAvginfo[gene][1])
                        lowerBound = float(geneSDAvginfo[gene][0]) -float(SDreq)* float(geneSDAvginfo[gene][1])
                        
                        if(float(NV) < lowerBound  or float(NV) > upperBound ):
                            outfile.write( gene+'\t'+NV+'\t'+geneSDAvginfo[gene][0]+'\t'+geneSDAvginfo[gene][1]+'\t'+str(lowerBound)+'\t'+str(upperBound)+'\n' )
                        else:  #TODO Debug print
                            if k == 0 and rowcnt < 10: print( gene+'\t'+NV+'\t'+str(lowerBound)+'\t NV not outside limits\t'+str(upperBound)+'\n' )
                    else:
                        print(gene +'\tNot found in geneSDAvginfo dictionary\n')
                        #outfile.write(gene +'\tNot found in geneSDAvginfo dictionary\n')
                        #loop dict into file for g = 0 to n:             
            
            else:
                print '!!!!NO records returned !!!'

        print ' ',rowcnt,' Gene result rows processed \n'
                
        outfile.close()
        
    except HttpError as err:
        print('Error: {}'.format(err.content))
        raise err

    return


###================              ============
def main():

    # Grab the application's default credentials from the environment.
    # check the command line
    #outFile = "/Users/bobbrown/Desktop/bobMatrixOut.txt"

    try:
        name                = '"'+sys.argv[1]+'"'
        pfile                 =     sys.argv[2]
        study                 = '"'+sys.argv[3]+'"'            
        tableType             =     sys.argv[4]
        stat_type             =     sys.argv[5]         
        SDreq                 =     sys.argv[6]
        samp_type             =     sys.argv[7]  # tumor or normal
        ofile                 =     sys.argv[8]         


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
        sys.stdout.write(' starting new ISB Big Query. Arguments=')
        sys.stdout.write(str(sys.argv[1:])+'\n')

        #outFile = '/Users/bobbrown/Desktop/bobMatrixOut.txt'

#bb 31may add table to store query output to NGCHMgalaxy project  (Created via the Web)
#     https://cloud.google.com/bigquery/docs/reference/v2/tables#methods
#         POST https://www.googleapis.com/bigquery/v2/projects/NGCHMgalaxy/datasets/datasetId/tableId
#     Bigquery.Tables.Insert request = bigqueryService.tables().insert(projectId, datasetId, content);
#    Table response = request.execute();

#         query_request = bigquery_service.jobs()
      
        geneSDAvginfo = {}
        
        query_request = bigquery_service.jobs()
        
        geneSDAvginfo= GetSDforStudy(geneSDAvginfo, SDreq, study, tableType, stat_type, samp_type, query_request,project_id, datasetId, tableId)
#        
        query_request = bigquery_service.jobs()
        
        GetResults(SDreq, geneSDAvginfo, pfile, ofile, study, tableType, stat_type, query_request,project_id, datasetId, tableId )
 
        
    except HttpError as err:
        print('Error: {}'.format(err.content))
        raise err


    return
##
##

if __name__ == '__main__': main()
