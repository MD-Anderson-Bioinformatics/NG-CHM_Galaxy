#!/usr/bin/env python

# created by Bob Brown. 
#=========================
#Big Query to NGCHM data via ISB API
#========================================

# by Bob Brown 11 March 2016
#v3 remove blanks and non-printable unicode from gene names and participant barcodes read from files
# v5 switch from  tcga_201607_beta to tcga_201607_beta for data -bb


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


###================				 ============
def queryDB(first, genelist, samplist, outfile, study, tableType, query_request,project_id):


#hardcode them in program as a query of ORs and ANDs

	try:
		error = 'false'
#		  samplist= {}
#		  samplefile = open(sfile,'rU')		  
#		  for row in samplefile:
#				  a= row[:].split('\t')	 #	separate out first field
#				  tmp = a[0].replace('\n','') 
#				  tmp = tmp.replace(' ','') 
#				  tmp = ''.join([c for c in tmp if ord(c) > 31 or ord(c) == 9])
#				  samplist[tmp]= tmp
#		  if len(tmp) < 13 :
#			  sampleIsParticipant = True
#		  else:
#			  sampleIsParticipant = False	  # is a sample barcode




# Create hardcode Dict key = s-g   prefill w 'undef'
#			sampgenedict = { 'TCGA-04-1348-01A'-g1': 'undef', 's2-g2': 'undef',}

		sampgenedict = {}
		count= 0
		for g in genelist:
			for s in samplist:
				count += 1
				#sampgenedict[samplist[s]+'-'+genelist[g]] = 'undef'
				#aug31 bb sampgenedict[s+'-'+g] = 'N/A'
				sampgenedict[s+'-'+g] = -1
		if count == 0:
			print '\nERROR -Gene name file or Sample/Participant Name file is empty'
			error = 'true'
			print('Error: {}'.format(err.content))
			raise err
			return
			
		else:
# create qeury string  based on one of these 4 tables
#select RPKM		 <option value="mRNA_BCGSC_HiSeq_RPKM">mRNA_BCGSC_HiSeq_RPKM - requires Gene and Participant input files</option>

			if tableType == 'mRNA_BCGSC_HiSeq_RPKM':
				querystring = 'SELECT  SampleBarcode , HGNC_gene_symbol, RPKM	   '
				querystring = querystring+ ' FROM [isb-cgc:tcga_201607_beta.mRNA_BCGSC_HiSeq_RPKM] WHERE Study = ' + study 

	#select normalized_count		<option value="mRNA_UNC_HiSeq_RSEM">mRNA_UNC_HiSeq_RSEM - requires Gene and Participant input files</option>

			elif tableType == 'mRNA_UNC_HiSeq_RSEM':
				querystring = 'SELECT  SampleBarcode , HGNC_gene_symbol, normalized_count	   '
				querystring = querystring+ ' FROM [isb-cgc:tcga_201607_beta.mRNA_UNC_HiSeq_RSEM] WHERE Study = ' + study 

	#select normalized_count		 <option value="miRNA_expression">miRNA_expression - requires only Participant input file</option>

	# below 2 do not use HGNC_gene_symbol for gene id so.... wait till later

	#		   elif tableType == 'miRNA_expression':
	#			   querystring = 'SELECT	 SampleBarcode , original_gene_symbol, normalized_count	   '
	#			   querystring = querystring+ ' FROM [isb-cgc:tcga_201607_beta.miRNA_expression] WHERE Study = ' + study 
	# 
	# #select Protein_Expression		 <option value="Protein_RPPA_data">Protein_RPPA_data - requires Gene and Participant input files</option>
	# 
	#		   elif tableType == 'Protein_RPPA_data':
	#			   querystring = 'SELECT	 SampleBarcode , original_gene_symbol, Protein_Expression	   '
	#			   querystring = querystring+ ' FROM [isb-cgc:tcga_201607_beta.Protein_RPPA_data] WHERE Study = ' + study 
			
			else:
				print '\nERROR Table Type not found = ', tableType
				error = 'true'
				print('Error: {}'.format(err.content))
				raise err


# queries not implemented follow
#		   <option value="Somatic_Mutation_calls">Somatic_Mutation_calls - requires Gene and Participant input files</option>
#		   <option value="Annotations">Annotations - requires only Participant input file</option>
#		   <option value="Biospecimen_data">Biospecimen_data - requires only Participant input file</option>
#		   <option value="Copy_Number_segments">Copy_Number_segments - requires only Participant input file</option>
#		   <option value="DNA_Methylation_betas">DNA_Methylation_betas - requires only Participant input file</option>


		if error == 'false':  
			querystring =querystring+ ' AND HGNC_gene_symbol IN ('
			for g in genelist:
				 querystring =querystring+	  '"'+g + '", '
			querystring = querystring[:-2] + ' )'
		
			querystring = querystring+ ' AND SampleBarcode IN ('
				
			for s in samplist:
				  querystring = querystring+ '"'+ s + '", '
			querystring = querystring[:-2] + ');'
		 
			print 'querystring = ', querystring,'\n'
			#print 'querystring first 100 chars & last 10= ', querystring[0:100],' ... ', querystring[-10:-1] ,'\n'
			query_data = { 'query': ( querystring ) }
					

			query_response = query_request.query(
				projectId=project_id,
				body=query_data).execute()

	# loop results into dict

			#print('Query Results:')
			rowcnt= 0
 
			#if query_response['totalRows'] != u'0':
			if 'rows' in query_response:
				print'\n the first 5 query results for ', len(samplist),' unique participants and ', len(genelist), ' unique genes \n'
				fldcnt= 0
				
				for row in query_response['rows']:
					rowcnt += 1
					if rowcnt < 5:		 print('\t'.join(str(field['v']) for field in row['f']))
				
					cntr = 0
					for field in row['f']:
						fldcnt +=1
						cntr += 1
						if cntr == 1: s = field['v']
						if cntr == 2: g = field['v'] 
#						 if cntr == 3: r = str(field['v']) 
						if cntr == 3: 
							sampgenedict[s+'-'+g]= field['v'] 
							#if fldcnt <15:
							 #	 print 'after s and g and sampgenedict', s, g,	 sampgenedict[s+'-'+g]
						if cntr > 3:  print 'error cntr > 3 \n'
					 
#					 sampgenedict[s+'-'+g] = r
	 
					#loop dict into file for g = 0 to n:
	 
				#print 'total fldcnt= ', fldcnt, '--- ',rowcnt,' result rows \n'
				#print ' samp gene dict =', sampgenedict
			 
				if first :	  #	 print header row of sample ids
					outrow = '\t'
					for s in samplist:
						outrow = outrow + s +'\t'				   
					outrow = outrow[:-1] + '\n'
					outfile.write( outrow )			  #leave first cell empty
		 
				for g in genelist:
					outrow = g +'\t'
				 
					for s in samplist:
						#print 'RKPM= ', str(sampgenedict[s+'-'+g])
						outrow = outrow +  str(sampgenedict[s+'-'+g]) +'\t'
					 
					outrow = outrow[:-1] + '\n'
					outfile.write( outrow )
			 
			else:
				print '!!!!NO records returned !!!'

			
			#end else
		
	except HttpError as err:
		print('Error: {}'.format(err.content))
		raise err

	return outfile

###================				 ============
def main():

	# Grab the application's default credentials from the environment.
	# check the command line
	#outFile = "/Users/bobbrown/Desktop/bobMatrixOut.txt"

	try:
		gfile				  = sys.argv[1]
		sfile				  = sys.argv[2]
		study				  = '"'+sys.argv[3]+'"'			   
		tableType			  = sys.argv[4]
		ofile				  = sys.argv[5]			  

		#			gfile= '/Users/bobbrown/Desktop/STAD-Genes418.txt'
		#			sfile= '/Users/bobbrown/Desktop/STAD-Participants300.txt'
		#			study = '"STAD"'
		#			ofile= '/Users/bobbrown/Desktop/STAD-Ouput414&300.txt'

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

		query_request = bigquery_service.jobs()

		# check the command line
		#sys.stdout.write(' starting new ISB Big Query. Arguments=')
		#sys.stdout.write(str(sys.argv[1:])+'\n')

		#outFile = '/Users/bobbrown/Desktop/bobMatrixOut.txt'

		 #outfile=open('/Users/bobbrown/Desktop/0_STAD_RPKM_results.txt','w')
		outfile=open(ofile,'w')

		samplist= {}
		samplefile = open(sfile,'rU')		
		for row in samplefile:
				a= row[:].split('\t')  #  separate out first field
				tmp = a[0].replace('\n','') 
				tmp = tmp.replace(' ','') 
				tmp = ''.join([c for c in tmp if ord(c) > 31 or ord(c) == 9])
				samplist[tmp]= tmp
		if len(tmp) < 13 :
			print 'ERROR NO Sample ID is to short -- may be Participant ID \n'
			error = True
			sys.exit(-1)

		genefile = open(gfile,'rU')				  

		genelist= {}
		count = 0
		first = True
		for row in genefile:
			a= row[:].split('\t')  #  separate out first field
			tmp = a[0].replace('\n','') 
			if tmp <> '':		 #aug11 if cell empty skip
				count +=1
				tmp = tmp.replace(' ','') 
				tmp = ''.join([c for c in tmp if ord(c) > 31 or ord(c) == 9])
				genelist[tmp] = tmp
			
			if count == 100 :
				print 'first  len genes= ', first, len(genelist)				
#				 query_request = bigquery_service.jobs()
				outfile= queryDB(first, genelist, samplist, outfile, study, tableType, query_request,project_id)
				genelist= {}
				count= 0
				first= False
			   
		if count > 0 :
			print 'len last genes= ', len(genelist)
			query_request = bigquery_service.jobs()
			outfile= queryDB(first, genelist, samplist, outfile, study, tableType, query_request,project_id)

		outfile.close()
		genefile.close()

	
	except HttpError as err:
		print('Error: {}'.format(err.content))
		raise err


	return
##
##

if __name__ == '__main__': main()
