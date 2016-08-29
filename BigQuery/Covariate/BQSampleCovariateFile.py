#!/usr/bin/env python
# -*- coding: utf8 -*-

# created by Bob Brown. 
#=========================
#DOCKERIZED VERSION Big Query to NGCHM data via ISB to create Cohorts of Participants based on metadata in Participant Table
#========================================

# by Bob Brown 7 April 2016
#v3 remove blanks and non-printable unicode from gene names and participant barcodes read from files
# v4 add user to select normal tumor or control samples only

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

###================					============
def sampleCovarFileCreate( userText, param, partSampBCFile, directory, outfileID, outfile, query_request, project_id):

	try:
		error = False
# create query string
		queryString	 = 'WHERE ParticipantBarCode in ( '
		selectString = ''  # params to add to select in next routine
		covarDict	 = {}  # params for next routine
		
		samplist= {}
		samplefile = open(partSampBCFile,'rU')		

		for row in samplefile:
			a= row[:].split('\t')  #  separate out first field
			tmp = a[0].replace('\n','') 
			tmp = tmp.replace(' ','') 
			tmp = ''.join([c for c in tmp if ord(c) > 31 or ord(c) == 9])
			samplist[tmp]= tmp
 
			if len(tmp) != 12 and len(tmp) != 16 :
				error = True
				print ' Error in Participant or Sample ID value= ', tmp
			if len(tmp) == 12 :
				queryString = queryString+ '"'+str(tmp)+'", '
			else:
				queryString = queryString+ '"'+str(tmp[0:11])+ '", '

		queryString=  queryString[0:-2] +' );'

		for i in range( len(param)):
			 #print '\n number param fields +outfile, i , list of params=', len(param)-2, i, param
			 selectString += str(param[i][4:])+ ', '
			 covarDict[str(param[i][4:])] = 'c'
	#end while
		if not error:					 
			selectString= selectString[0:-2] # remove comma at end

			selectString = 'SELECT	ParticipantBarcode, '+selectString+' FROM [isb-cgc:tcga_201607_beta.Clinical_data] '
			   
			if len(queryString) > 0 : 
				queryString = selectString + queryString		
				print '\nQueryString = ', queryString,'\n'
				#print 'queryString first 100 chars & last 10= ', queryString[0:100],' ... ', queryString[-10:-1] ,'\n'
			else:
				print ' NO barcodes in input participant file'
				sys.exit(-1)

#run  query
			query_data = { 'query': ( queryString ) }
			query_response = query_request.query(
				projectId=project_id,
				body=query_data).execute()

			rowCnt= -1
			#if query_response['totalRows'] != u'0':
#-----						  
			#print ' sample dict=', samplist
			
			if 'rows' in query_response:
				rowValues= []
				covarFile= []
				userText.replace(' ', '_')
				out= open( outfile, 'w')
				i= 0
				for ckey in covarDict:
	
	##!!!!! file name is written to the outfile in the .xml	 (out below) one filename per line and they will be pulled into the HISTORY !!!!
					fileName = "primary_"+outfileID+"_"+str(i)+"_visible_txt" 
					#fileName = userText+"_"+outfileID+"_"+str(i)+"_"+ckey+"_visible_txt" 
					i+= 1
					filePath=  os.path.join(directory ,fileName)
					#bb good filePath=	os.path.join(str('/home/rbrown/HM_galaxy/tools/BigQuery/Covariate/Files'),str(userText+'-'+ckey+'.txt'))
					#print ' covariate path and file name= ', filePath
					filePtr= open(filePath,'w')	 # open file for each covariate bar
#					 covarFile.append(open('./Covariate/'+userText+'-'+str(ckey)+'.txt','w'))  # open file for each covariate bar
					covarFile.append(filePtr)
					covarFile[-1].write( '{\n' )
					#out.write( ' covariate category '+ckey+ ' Filename '+filePath+"\n")
					out.write( fileName+"\n")  # filename is in tmp directory and pulled into history !!!!
					 
				#print 'start query len covar=', len(covarFile)
								
				for row in query_response['rows']:	  
					rowCnt += 1

					tmp= []			   
					#print ' Row=', row, '\n'
					for field in row['f']:
						tmp.append(str(field['v'] ))  # add sanmple BCs to dict
					#print 'TMP >>>>', tmp
					rowValues.append(tmp)
					if rowCnt < 3:	print rowCnt,' len and row values= ',len(rowValues[rowCnt]), rowValues[rowCnt]
										
					partBC= str(rowValues[rowCnt][0])
					for skey in samplist:
						if partBC in skey:
							#print 'found sample= length(covarFile)', partBC, skey, len(covarFile)
							#debig fileptr.write( str(skey)+':\t'+str(rowValues[rowCnt][fileCnt+1])+'\n')
							for fileCnt in range( len(covarFile)):	
								#print ' wrote to file ',fileCnt, '-',skey+':\t'+rowValues[rowCnt][fileCnt+1]+'\n'
								if rowCnt < len(samplist)-1: 
									covarFile[fileCnt].write( '"'+str(skey)+'":"'+str(rowValues[rowCnt][fileCnt+1])+'",\n')
								else:	
									covarFile[fileCnt].write( '"'+str(skey)+'":"'+str(rowValues[rowCnt][fileCnt+1])+'"\n')
			else:
				print '!!!!NO records returned !!!'
				sys.exit(-1)

			for f in range(len(covarFile)):
				covarFile[f].write( '}' )
				covarFile[f].close()  # open file for each covariate bar

			print '\n',len(rowValues), ' result rows \n'

		else:
			print '!!!! Some selected Parameter values not filled-in !!!'
			sys.exit(-1)
			
	except Exception as e:
		print( 'Usage: create covariate files failed', e	)	  
		print traceback.format_exc()
		sys.exit(-1)

	return 

###================			  ============
def main():

	# Grab the application's default credentials from the environment.
	# check the command line
#	  sys.argv[0] = 'prog'
#	  sys.argv[1] = 'bob'
#	  sys.argv[2] = '/usr/share/Desktop/out_partitcipant_cohort.txt'
#	  sys.argv[3] = 'S'
#	  sys.argv[4] = 'gender'
	   
#	  sys.stdout.write(' starting Create Cohort. Arguments=')
#	  sys.stdout.write(str(sys.argv[1:])+'\n')
	len_sysarg = len(sys.argv)
	param = []
	
	#outFile = "/usr/share/Desktop/bobMatrixOut.txt"
		
	try:
#  xmlparams -- $user_cohortname '$Participant_cohort'	$Covariate_Type	 "$__new_file_path__" "$outputfile.id" $outputfile
				
		userText		   = sys.argv[1]
		partSampBCFile	   = sys.argv[2]
		CovarSorG		   = sys.argv[3]
		# "$__new_file_path__" "$outputfile.id"	 for mulitple file outputs
		directory		   = sys.argv[4]
		outfileID		   = sys.argv[5]
		outfile			   = sys.argv[6]
		
		credentials = GoogleCredentials.get_application_default()

		# Construct the service object for interacting with the BigQuery API.
		bigquery_service = build('bigquery', 'v2', credentials=credentials)

#		 project_id= 'ngchmgalaxy'
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
		sys.stdout.write(' \n starting new Covariate file creation. Arguments=')
		sys.stdout.write(str(sys.argv[1:])+'\n')
# 
		#bboutFile = '/User/bobbrown/Desktop/bobCovariateCreate_Out.txt'

		query_request = bigquery_service.jobs()
		
		if CovarSorG == "S":
			sampleCovarFileCreate( userText, sys.argv[7:], partSampBCFile, directory, outfileID, outfile, query_request, project_id)
   
#		else:
#			 geneCovarFileCreate( userText, sys.argv[4:], partSampBCFile, query_request, project_id)
		

	except HttpError as err:
		print('Error: {}'.format(err.content))
		raise err


	return
##
##

if __name__ == '__main__': main()
