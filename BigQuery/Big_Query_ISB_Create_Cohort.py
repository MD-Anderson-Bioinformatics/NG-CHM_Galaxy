#!/usr/bin/env python

# created by Bob Brown. 
#=========================
#DOCKERized version of Big Query to NGCHM data via ISB to create Cohorts of Participants based on metadata in Participant Table
#========================================

# by Bob Brown 7 April 2016
#v3 remove blanks and non-printable unicode from gene names and participant barcodes read from files
# v4 add user to select normal tumor or control samples only
# v5 switch from  tcga_201510_alpha to tcga_201607_beta for data -bb
#v6 switch name and loc of security file to --> GalaxyBigQuery.json


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

#from gcloud import bigtable
# import gcloud.bigquery as bq

#sys.path.append('/Users/bobbrown/google-cloud-sdk/lib/googlecloudsdk/third_party/apis/bigquery/v2/')
#sys.path.append('/Users/bobbrown/google-cloud-sdk/lib/surface/bigquery/')

#from scipy.stats.mstats import rankdata	 
#from scipy.stats import norm  
#from scipy import *	 
#from numpy
#import math	 ##v33 for the log function

###================					============
def queryDB(Study_Cohort_Table, sample_type, param, ofile, query_request, project_id):

	try:
		error = False
		sampleTypeRequest = False
# create query string
		if len(param) < 2 :		   # no parameters so get all data	   
			queryString = '\n SELECT  ParticipantBarcode FROM [isb-cgc:tcga_201607_beta.Clinical_data] WHERE ( Study = "'+Study_Cohort_Table+ '");'									   
		else:
			i= 0
			queryString = ''
			norm_tumor_low = '00'
			norm_tumor_high= '99'
#bb aug31 move sample type out of big select list into its own
# Tumor types range from 01 - 09, normal types from 10 - 19 and control samples from 20 - 29. See Code Tables Report for a complete list of sample codes
# IT IS DEFINED IN THE DB AS A STRING !!!!!!
			sampleTypeRequest = True
			if sample_type == '01':
				norm_tumor_low = '00'
				norm_tumor_high= '10'
			elif sample_type == '10':
				norm_tumor_low = '09'
				norm_tumor_high= '20'
			else: #both tumor and normal  param[i+1] == '11':
				norm_tumor_low = '00'
				norm_tumor_high= '20'


			while i < len(param)-2 and not error:
				#print '\n number param fields +outfile, i , list of params=', len(param)-2, i, param
							  
			#determine if cohort metadata column values are categorical		   (cat) one value	   OR numeric (num) with a min and max value
				if( str(param[i][0:4]) == 'cat_'):
# Tumor types range from 01 - 09, normal types from 10 - 19 and control samples from 20 - 29. See Code Tables Report for a complete list of sample codes
# IT IS DEFINED IN THE DB AS A STRING !!!!!!
# 					if str(param[i]) == 'cat_SampleTypeCode' :	  # determine sample type in a different table need to translate values
# 						sampleTypeRequest = True
# 						if param[i+1] == '01':
# 							norm_tumor_low = '00'
# 							norm_tumor_high= '10'
# 						elif param[i+1] == '10':
# 							norm_tumor_low = '09'
# 							norm_tumor_high= '20'
# 						elif param[i+1] == '11':
# 							norm_tumor_low = '00'
# 							norm_tumor_high= '20'
# 						elif param[i+1] == '20':
# 							norm_tumor_low = '19'
# 							norm_tumor_high= '30'
# 					elif (str(param[i]) != 'cat_EMPTY' and	str(param[i+1]) != 'Click cursor in middle of this text to see choices' and	 str(param[i+1]) != '' ):

 					if (str(param[i]) != 'cat_EMPTY' and	str(param[i+1]) != 'Click cursor in middle of this text to see choices' and	 str(param[i+1]) != '' ):
						temp = param[i+1].replace('_',' ')	# get underscore out of search data values before query
						if temp == 'NULL':
							queryString =queryString+ ' PA.' +param[i][4:]+' is NULL AND '
						else:
							queryString =queryString+ ' PA.' +param[i][4:]+'= "'+ temp + '" AND '
						print 'Found category -- i, param i, and i+1 ', i, param[i], param[i+1]
					else:
						print 'EMPTY category param found', param[i]
						error = True
					i= i+2
				else:
					if (str(param[i]) != 'num_EMPTY' and (str(param[i+1]) != '0.0' or str(param[i+2]) != '0.0')):
						queryString = queryString+ ' PA.' +param[i][4:] +'>='+ (param[i+1]) + ' AND ' + ' PA.' +param[i][4:]+ '<= '+ (param[i+2]) +' AND '
						#print 'Found NUMBER param ', param[i]
					else:
						print 'EMPTY NUMBER param found', param[i]
						error = True
					i= i+3
		#end while
			if not error:					 
				queryString = queryString[0:-4]		 
				saveLen = len(queryString)	  

#bb aug31 				if sampleTypeRequest:		 #then want sample barcodes		   
				tempString = 'SELECT  BS.SampleBarcode FROM [isb-cgc:tcga_201607_beta.Clinical_data] as PA JOIN [isb-cgc:tcga_201607_beta.Biospecimen_data] as BS ' 

#bb aug31  				else:
#					tempString = 'SELECT  PA.ParticipantBarcode FROM [isb-cgc:tcga_201607_beta.Clinical_data] as PA JOIN [isb-cgc:tcga_201607_beta.Biospecimen_data] as BS '
				
				tempString= tempString+ ' ON PA.ParticipantBarcode = BS.ParticipantBarcode WHERE ( PA.Study = "'+Study_Cohort_Table+ \
					 '"		AND BS.SampleTypeCode > "'+str(norm_tumor_low) + '" AND BS.SampleTypeCode < "'+str(norm_tumor_high) + '" ' 
				   
				if saveLen > 0 : 
					queryString = tempString+ ' AND ' + queryString + ' );'		   
				else: 
					queryString = tempString+ ' );'		   # only occurs if user selects only sample type -- tumor, normal, etc -- and NO other metadata
				
				print 'QueryString = ', queryString,'\n'
				#print 'queryString first 100 chars & last 10= ', queryString[0:100],' ... ', queryString[-10:-1] ,'\n'

#run  query
		if not error:					 
			query_data = { 'query': ( queryString ) }
			query_response = query_request.query(
				projectId=project_id,
				body=query_data).execute()

	# loop results into output file

			rowcnt= 0

			#if query_response['totalRows'] != u'0':
			if 'rows' in query_response:
				outfile=open(ofile,'w')

				for row in query_response['rows']:
					rowcnt += 1
					if rowcnt < 6:		   print(' The first 5 row values \t'.join(str(field['v']) for field in row['f']))
				
					# for field in row['f']:	outfile.write( field['v']+'\n' )

					for field in row['f']:	  
						outfile.write( field['v']+'\t' )
					outfile.write('\n')		   
					
				print '\n',rowcnt, ' result rows \n'
				outfile.close()

			else:
				print '!!!!NO records returned !!!'
		else:
			print '!!!! Some selected Parameter values not filled-in !!!'
			err.content = '!!!! Some selected Parameter values not filled-in !!!'
			print('Error: {}'.format(err.content))
			raise err
			
		#end else
		if error:
			rowcnt = rowncnt /0
			
	except HttpError as err:
		print('Error: {}'.format(err.content))
		raise err

	return

###================					============
def main():

	# Grab the application's default credentials from the environment.
	# check the command line
#	   sys.argv[0] = 'prog'
#	   sys.argv[1] = 'xx'
#	   sys.argv[2] = 'OV'
#	   sys.argv[3] = 'gender'
#	   sys.argv[4] = 'FEMALE'
#	   sys.argv[5] = '/Users/bobbrown/Desktop/out_partitcipant_cohort.txt'
	   
#	  sys.stdout.write(' starting Create Cohort. Arguments=')
#	  sys.stdout.write(str(sys.argv[1:])+'\n')
	len_sysarg = len(sys.argv)
	param = []
	
	#outFile = "/Users/bobbrown/Desktop/bobMatrixOut.txt"


#v6 switch name and loc of security file to --> GalaxyBigQuery.json
		
	try:
		ignore					  = sys.argv[1]
		Study_Cohort_Table		  = sys.argv[2]
		sample_type				  = sys.argv[3]

		
		ofile				   = sys.argv[len_sysarg-1]			   

		credentials = GoogleCredentials.get_application_default()

		# Construct the service object for interacting with the BigQuery API.
		bigquery_service = build('bigquery', 'v2', credentials=credentials)

#		project_id= 'ngchmgalaxy'
#		project_id= 'isb-cgc-bq'
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

		# check the command line
#		   sys.stdout.write(' \n starting new ISB Big Cohort Query. Arguments=')
#		   sys.stdout.write(str(sys.argv[1:])+'\n')
# 
#		   sys.stdout.write(' Params for ISB Big Cohort Query. Arguments=')
#		   sys.stdout.write(str(sys.argv[3:]) +'\n')

		#outFile = '/Users/bobbrown/Desktop/bobParticipantsOut.txt'

		query_request = bigquery_service.jobs()
		
		queryDB( Study_Cohort_Table, sample_type, sys.argv[4:], ofile, query_request, project_id)
		
		

	except HttpError as err:
		print('Error: {}'.format(err.content))
		raise err


	return
##
##

if __name__ == '__main__': main()
