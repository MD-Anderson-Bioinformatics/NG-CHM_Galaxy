#!/usr/bin/env python
# -*- coding: utf8 -*-

# created by Bob Brown. 
#=========================
#DOCKER ized VERSION Big Query to NGCHM data via ISB API
#========================================

# by Bob Brown 31 May 2016
# Using a set of Participants (Control and Disease) plus a Study retrieve all genes.
# Perform Statistical Analysis on UNC RPKM normalized values.  
# https://cloud.google.com/bigquery/query-reference#syntax		 STDDEV_SAMP(numeric_expr)
# TOP() function
# TOP is a function that is an alternative to the GROUP BY clause. It is used as simplified syntax for GROUP BY ... ORDER BY ... LIMIT .... 
#  Generally, the TOP function performs faster than the full ... GROUP BY ... ORDER BY ... LIMIT ... query, but may only return approximate results. The following is the syntax for the TOP function:
# v5 switch from  tcga_201607_beta to tcga_201607_beta for data -bb


# first is Standard Deviation for each Gene across input Participants 

import sys			   
import traceback 
#import gcp.bigquery as bq
import os
#os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/rbrown/HM_galaxy/tools/MDA_Heatmaps/NGCHMgalaxy-34c277121883.json'
#os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/rbrown/HM_galaxy/tools/MDA_Heatmaps/isb-cgc-bq-a4d8832f7d0c.json'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/data/Galaxy_ISB_NGCHM_BigQuery.json'	  # moved to /data in docker

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


###================			  ============
def queryDB(project_id, query_request,userProject, userDataset, userTable, userSelectbyColName, userSelectbyColVal, ofile):

	try:
		count= 0
		error = 'false'

# create qeury string  based on one of these 4 tables
#select RPKM		<option value="mRNA_BCGSC_HiSeq_RPKM">mRNA_BCGSC_HiSeq_RPKM - requires Gene and Participant input files</option>

		if userTable == 'allonco':
			querystring = 'SELECT  symbol, geneName, otherID, species, geneID, id, version_date '
			querystring = querystring+ ' FROM [ngchm-cloud-pilot:reference.allonco] WHERE '+ userSelectbyColName+' = ' +userSelectbyColVal+ ' ;'

#select normalized_count		<option value="mRNA_UNC_HiSeq_RSEM">mRNA_UNC_HiSeq_RSEM - requires Gene and Participant input files</option>

		elif userTable == 'TBD':
#bb 2Jun   http://stackoverflow.com/questions/12323757/how-sql-query-result-insert-in-temp-table
#bb 2Jun			querystring = ' SELECT	  ParticipantBarcode , original_gene_symbol, normalized_count INTO '+datasetId+ "."+ tableId
			querystring = ' SELECT	  ParticipantBarcode , original_gene_symbol, normalized_count '
			querystring = querystring+ ' FROM [isb-cgc:tcga_201607_beta.mRNA_UNC_HiSeq_RSEM] WHERE '+ userSelectbyColName+' = ' +userSelectbyColVal+ ' ;'

#select normalized_count		<option value="miRNA_expression">miRNA_expression - requires only Participant input file</option>

		
		else:
			print '\nERROR Project Dataset Table not found = ',userProject, userDataset, userTable
			error = 'true'
			#print('Error: {}'.format(err.content))
			#raise err
			x = 6/0
			return


		if error == 'false':  
			query_data = { 'query': ( querystring ) }
					
			query_response = query_request.query(
				projectId=project_id,
				body=query_data).execute()


 #bb 31may get data from table	   https://cloud.google.com/bigquery/docs/reference/v2/tables/get#response
#	  Bigquery.Tables.Get request = bigqueryService.tables().get(projectId, datasetId, tableId);
 #	   Table response = request.execute();
	# loop results into dict

			#print('Query Results:')
			rowcnt= 0
			
			#outfile=open('/Users/bobbrown/Desktop/0_STAD_RPKM_results.txt','w')
			outfile=open(ofile,'w')

			#if query_response['totalRows'] != u'0':
			if 'rows' in query_response:
				 
				for row in query_response['rows']:
					rowcnt += 1
					for field in row['f']:	  
						outfile.write( field['v']+'\t' )
					outfile.write('\n')		   

				print '\n',rowcnt, ' result rows \n'
				outfile.close()
			else:
				print '!!!!NO records returned !!! \n\n'

			print 'querystring ', querystring ,'\n'
			
#					 print 'row,len row= ',row, len(row)
#					 for n in range(0, len(row)-1):
#						 outfile.write( row[n]	+ '\t')
#					 outfile.write( row[len(row)-1]	   + '\n')		  
				
			#end else
		
	except HttpError as err:
		print('Error: {}'.format(err.content))
		raise err

	return

###================		   https://cloud.google.com/bigquery/exporting-data-from-bigquery#avro-format
def export_table(bigquery, cloud_storage_path,
				 project_id, dataset_id, table_id,
				 export_format="CSV",
				 num_retries=5,
				 compression="NONE"):
	"""
	Starts an export job

	Args:
		bigquery: initialized and authorized bigquery
			google-api-client object.
		cloud_storage_path: fully qualified
			path to a Google Cloud Storage location.
			e.g. gs://mybucket/myfolder/
		export_format: format to export in;
			"CSV", "NEWLINE_DELIMITED_JSON", or "AVRO".
		compression: format to compress results with,
			"NONE" (default) or "GZIP".

	Returns: an extract job resource representing the
		job, see https://cloud.google.com/bigquery/docs/reference/v2/jobs
	"""
	# Generate a unique job_id so retries
	# don't accidentally duplicate export
	job_data = {
		'jobReference': {
			'projectId': project_id,
			'jobId': str(uuid.uuid4())
		},
		'configuration': {
			'extract': {
				'sourceTable': {
					'projectId': project_id,
					'datasetId': dataset_id,
					'tableId': table_id,
				},
				'destinationUris': [cloud_storage_path],
				'destinationFormat': export_format,
				'compression': compression
			}
		}
	}
	return bigquery.jobs().insert(
		projectId=project_id,
		body=job_data).execute(num_retries=num_retries)
		
###================			  https://cloud.google.com/bigquery/docs/reference/v2/jobs/insert#response
def create_job(bigquery, project):
# needed if we are going to store query results in a cloud project table for later analysis
#	  Job content = new Job();
#	  // TODO: Add code here to assign values to desired fields of the 'content' object

#	  Bigquery.Jobs.Insert request = bigqueryService.jobs().insert(projectId, content);
#	  Job response = request.execute();
	return
	
###================			  ============	   https://cloud.google.com/bigquery/docs/managing_jobs_datasets_projects#dataset-location
def list_datasets(bigquery, project):
	try:
		datasets = bigquery.datasets()
		list_reply = datasets.list(projectId=project).execute()
		print('Dataset list:')
		pprint(list_reply)

	except HTTPError as err:
		print('Error in list_datasets: %s' % err.content)
		raise err
	
	return
		
###================			  ============
def main():

	# Grab the application's default credentials from the environment.
	# check the command line
	#outFile = "/Users/bobbrown/Desktop/bobMatrixOut.txt"

	try:
		name				= '"'+sys.argv[1]+'"'
		userProject			   =	sys.argv[2]
		userDataset			   =	sys.argv[3]
		userTable			 =	  sys.argv[4]
		userSelectbyColName =	 sys.argv[5]
		userSelectbyColVal	  ='"'+sys.argv[6]+'"'
		outfile				   =	sys.argv[7]			

		#		   gfile= '/Users/bobbrown/Desktop/STAD-Genes418.txt'
		#		   sfile= '/Users/bobbrown/Desktop/STAD-Participants300.txt'
		#		   study = '"STAD"'
		#		   ofile= '/Users/bobbrown/Desktop/STAD-Ouput414&300.txt'

		credentials = GoogleCredentials.get_application_default()

		# Construct the service object for interacting with the BigQuery API.
		bigquery_service = build('bigquery', 'v2', credentials=credentials)

#		 project_id= 'ngchmgalaxy'
#		 project_id= 'isb-cgc-bq'
		projfile= '/data/Galaxy_ISB_NGCHM_BigQuery_Project_ID.txt' #should only contain one row with id in docker dir /data
		pfile=open(projfile,'rU')
		cnt= 0

		for row in pfile:
			cnt +=1
			if cnt == 1: 
				a= row[:].split('\t')  #  separate out first field
				project_id = a[0].replace('\n','') 

		sys.stdout.write('Project ID supplied from directory mapped to /export/credentials/Galaxy_ISB_NGCHM_BigQuery_Project_ID.txt= '+ project_id+ '\n')
		pfile.close()

		datasetId = "Gene_Filtering"
		tableId		 = "Gene_RPKM_Results"		# (Created via the Web)

		# check the command line
		sys.stdout.write(' starting new ISB Big Query. Arguments=')
		sys.stdout.write(str(sys.argv[1:])+'\n')

		#outFile = '/Users/bobbrown/Desktop/bobMatrixOut.txt'

#bb 31may add table to store query output to NGCHMgalaxy project  (Created via the Web)
#	 https://cloud.google.com/bigquery/docs/reference/v2/tables#methods
#		 POST https://www.googleapis.com/bigquery/v2/projects/NGCHMgalaxy/datasets/datasetId/tableId
#	  Bigquery.Tables.Insert request = bigqueryService.tables().insert(projectId, datasetId, content);
#	 Table response = request.execute();

# -- The table of predefined gene lists is under the 
# -- project "ngchm-cloud-pilot", dataset "reference", table "allonco".
# -- Use column "authority" to select specific lists: e.g. Vogelstein or sanger etc.
# -- It should be viewable by all logged in users.	  Let me if you have any issues accessing it.	  Bradley

		query_request = bigquery_service.jobs()
				
#bb 3jun changes
		queryDB(project_id, query_request, userProject, userDataset, userTable, userSelectbyColName, userSelectbyColVal, outfile)
 

		
	except HttpError as err:
		print('Error: {}'.format(err.content))
		raise err


	return
##
##

if __name__ == '__main__': main()
