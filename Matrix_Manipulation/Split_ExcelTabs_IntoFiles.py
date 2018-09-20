import sys
import os
#import MySQLdb
#import config
import subprocess
import re
import shutil
import traceback
#import xlsxwriter
import xlrd

#http://www.blog.pythonlibrary.org/2014/04/30/reading-excel-spreadsheets-with-python-and-xlrd/

def File_From_Tab(infileName, outfileName, tabName,tabNumber):
    """
    Open and read an Excel file
    """
    book = xlrd.open_workbook(infileName)
    # print number of sheets
    #print book.nsheets
 
    # print sheet names
    tabList= book.sheet_names()
    #print tabList
    #print book.sheet_names()
    if tabName == "" and (tabNumber <1 or tabNumber > len(tabList)):
        sys.stderr.write("\n>>>ERROR illegal tab number "+str(tabNumber)+" input when no tab name was specified\n")
        sys.stderr.write("\n>>>Allowed tab numbers, or tab names, for this file with "+str(len(tabList))+" total tabs are:")
        
        for i in range(len(tabList)):
            sys.stderr.write("\n>>>   tab number "+str(i+1)+" is named "+str(tabList[i]))
        sys.exit(-1)

    if tabName != "":   # use name instead of tab number
        found = False
        i = 0
        while (i < len(tabList)) and not found:
            i += 1
            if tabName == str(tabList[i-1]):
                tabNumber = i
                found = True
        if not found:
            sys.stderr("\n>>> ERROR -- Input Tab name "+tabName+" was not found\n")
            sys.exit(-1)
    # get the first worksheet
    #first_sheet = book.sheet_by_index(0)
    worksheet = book.sheet_by_index(tabNumber-1)
 
    outFile = open(outfileName+str(tabList[tabNumber-1]+".tsv"), 'w')
   
    #https://stackoverflow.com/questions/14944623/python-xrld-read-rows-and-columns
    #workbook = xlrd.open_workbook('my_workbook.xls')
    #worksheet = workbook.sheet_by_name('Sheet1')
    num_rows = worksheet.nrows - 1
    num_cells = worksheet.ncols - 1
    curr_row = -1
    while curr_row < num_rows:
      curr_row += 1
      row = worksheet.row(curr_row)
      
      if curr_row == 0:
          endOfLine= False
          allRowNumCols= len(row)
          i= len(row)-1
          # find length of matrix and covariates using first row 
          # Cell Types: 0=Empty, 1=Text, 2=Number, 3=Date, 4=Boolean, 5=Error, 6=Blank
          while i <= len(row)-1 and not endOfLine:
               cell_type = worksheet.cell_type(curr_row, i)
               #temp = str(worksheet.cell_value(curr_row, i))
               #print( " pos and cell type row one ",cell_type, i)
               
               if cell_type == 0 or cell_type == 6:
                  allRowNumCols -= 1
                  i -= 1
               else:
                  endOfLine=  True
         
      if allRowNumCols < 5:
          sys.stderr.write("\nERROR First row number of columns= "+str(allRowNumCols)+" is too short, so all rows will be ignored\n")
          sys.exit(-1)
      elif curr_row == 0: 
          sys.stdout.write("\nALL Rows must all have the same number of columns as the First row's number columns = "+ str(allRowNumCols) +"\n")
          
      temp= ''
      rowLen= 0
      endOfLine= False
          
      while rowLen < allRowNumCols and not endOfLine:
          temp += str(worksheet.cell_value(curr_row, rowLen))+"\t"
          #temp += str(row[rowLen])+"\t"
          rowLen += 1
              
      temp = temp[:-1]+"\n"
      #print 'Row:', curr_row, len(row), rowLen
      outFile.write(temp)  #TODO check if rows are all same length
    
    sys.stdout.write("File created with "+str(curr_row)+" rows and "+str(allRowNumCols)+" columns\n")
#       curr_cell = -1
#       while curr_cell < num_cells:
#         curr_cell += 1
#         # Cell Types: 0=Empty, 1=Text, 2=Number, 3=Date, 4=Boolean, 5=Error, 6=Blank
#         cell_type = worksheet.cell_type(curr_row, curr_cell)
#         cell_value = worksheet.cell_value(curr_row, curr_cell)
#         print ' ', cell_type, ':', cell_value 
    #     # read a row
#     print first_sheet.row_values(0)
#  
#     # read a cell
#     cell = first_sheet.cell(0,0)
#     print cell
#     print cell.value
#  
#     # read a row slice
#     print first_sheet.row_slice(rowx=0,
#                                 start_colx=0,
#                                 end_colx=2)
 
    return tabList


#======================
# from RPPA callInSilicoReportWriter.py
# def write_xlsx_for_report(directory_for_reports, report_name, report_id, dict_cf2_values):
#     
#     
#     error_write_xlsx = ""
#     error_occurred = 0
#     
#     try:
#         path_to_dir_when_writing = os.path.join(directory_for_reports, report_name)
#         header_path = os.path.join(directory_for_reports, report_name, "header.csv")    
#         raw_log_2_path = os.path.join(directory_for_reports, report_name, "RawLog2.csv")
#         norm_linear_path = os.path.join(directory_for_reports, report_name, "NormLinear.csv")
#         norm_log_2_path = os.path.join(directory_for_reports, report_name, "NormLog2.csv")
#         norm_log_2_median_centered_path = os.path.join(directory_for_reports, report_name, "NormLog2_MedianCentered.csv")
#         
# #         put the cf2 values in the NormLinear file
#         error_put_cf2_in_normLinear = write_new_normLinear_csv_file_with_cf2_values(path_to_dir_when_writing, norm_linear_path, dict_cf2_values)
#         
#         
#         excel_workBook = xlsxwriter.Workbook(os.path.join(directory_for_reports, report_name,report_name + ".xlsx"), {'strings_to_numbers': True})
#     
#         rawLog2_worksheet = excel_workBook.add_worksheet("RawLog2")
#         error_rawLog2 = construct_worksheet_for_xlsx(rawLog2_worksheet, header_path, "RawLog2", raw_log_2_path)
#     
#         norm_linear_worksheet = excel_workBook.add_worksheet("NormLinear")
#         error_norm_linear = construct_worksheet_for_xlsx(norm_linear_worksheet, header_path, "NormLinear", norm_linear_path)
#     
#         norm_log_2_worksheet = excel_workBook.add_worksheet("NormLog2")
#         error_norm_log_2 = construct_worksheet_for_xlsx(norm_log_2_worksheet, header_path, "NormLog2", norm_log_2_path)
#     
#         norm_log_2_median_centered_worksheet = excel_workBook.add_worksheet("NormLog2_MedianCentered")
#         error_norm_log_2_median_centered = construct_worksheet_for_xlsx(norm_log_2_median_centered_worksheet, header_path, "Median-Centered", norm_log_2_median_centered_path)
#     
#         errors_array = [error_put_cf2_in_normLinear, error_rawLog2, error_norm_linear, error_norm_log_2, error_norm_log_2_median_centered]
#         for error in errors_array:
#             if error != "":
#                 error_write_xlsx = error_write_xlsx + error
#                 error_occurred = 1
#         if error_occurred == 1:
#             error_write_xlsx + "\nThe excel workbook for the report "+report_name+" was not written successfully.\n\n"
#         
#         excel_workBook.close()
#     except Exception, e:
#         error_occurred = 1
#         error_write_xlsx += str(repr(e)) + "\n\n"
#         error_write_xlsx + "\nThe excel workbook for the report "+report_name+" was not written successfully.\n\n"
#         try:
#             excel_workBook.close()
#         except Exception, f:
#             sys.stderr.write("An unforeseen problem has occurred in write_xlsx_for_report()\n")
#             sys.stderr.write(str(repr(f)) + "\n\n")
#         
#     
#     return error_occurred, error_write_xlsx
# 
# 
# def write_new_normLinear_csv_file_with_cf2_values(path_to_dir, norm_linear_path, dict_cf2_values):
#     errors = ""
#     try:
#         titles = {}
#         new_lines_normLinear_with_cf2 = []
#     #     read old norm linear file
#         rf_normLinear = open(norm_linear_path, 'rU')
#         line_num = 0
#         for line in rf_normLinear:
#             line = strip_new_line_from_right_side(line)
#             toks = line.split(",")
#             line_num += 1
#             if line_num == 1:
#                 line += "1,CF2"
#                 new_lines_normLinear_with_cf2.append(line)
#                 titles = toks
#                 continue
#             pos_rf = int(toks[titles.index('Order')])
#             line += "," + str(dict_cf2_values[pos_rf])
#             new_lines_normLinear_with_cf2.append(line)
#         rf_normLinear.close()
#     #     rename the old normLinear file
#         os.rename(norm_linear_path, os.path.join(path_to_dir, 'before_cf2_NormLinear.csv'))
#         
#     #     write new normLinear with cf2
#         wf_new_normLinear = open(norm_linear_path, 'w')
#         for line_writing in new_lines_normLinear_with_cf2:
#             wf_new_normLinear.write(line_writing + "\n")
#         wf_new_normLinear.close()
#     except Exception, err_write_normLinear_with_cf2_values:
#         errors = str(repr(err_write_normLinear_with_cf2_values))
# 
#     return errors
# 
# 
# # This function constructs the worksheet for each tab in the excel file for a report
# # It puts these things in this order:
# #     1. Title of the tab
# #     2. Header for the tab
# #     3. Content of the tab
# def construct_worksheet_for_xlsx(worksheet, header_path, title_top_of_tab, tab_input_path):
# 
#     reload(sys)  
#     sys.setdefaultencoding('utf8')
#     errors = ""
#     
#     try:
# #         Write the title at the top of the tab
#         worksheet.write(0,0,title_top_of_tab)
# 
# #         Variable to keep track of the rows
#         row_num = 1
#         
# #         Write the header stuff
#         header_file = open(header_path, 'rU')
#         for head_line in header_file:
#             head_line = strip_new_line_from_right_side(head_line)
#             head_toks = head_line.split(",")
#             col_num = 0
#             for tok in head_toks:
#                 worksheet.write(row_num, col_num, tok)
#                 col_num += 1
#             row_num += 1
#         
# #         Write the content stuff
#         tab_input_file = open(tab_input_path, 'rU')
#         for tab_line in tab_input_file:
#             tab_line = strip_new_line_from_right_side(tab_line)
#             tab_toks = tab_line.split(",")
#             col_num = 0
#             for tok in tab_toks:
#                 tok = tok.decode('iso-8859-1').encode('utf-8')
#                 worksheet.write(row_num, col_num, tok)
#                 col_num += 1
#             row_num += 1        
#         
#         header_file.close()
#         tab_input_file.close()
#     except Exception, e:
#         errors = errors + "\n\nAn error occurred while constructing the "+title_top_of_tab+" tab for the excel file.\n"
#         errors = errors + "The error was :\n\t" + str(e) + "\n\n"
#         try:
#             header_file.close()
#             tab_input_file.close()
#         except NameError:
#             x = 5
#     
    return errors

#----------------------------------------------------------------------
if __name__ == "__main__":
    
    #try:
    if len(sys.argv) > 4:
        infileName            = '"'+sys.argv[1]+'"'
        tabName               = '"'+sys.argv[2]+'"' 
        tabNumber = 0           
        if tabName == '':  tabNumber = int(sys.argv[3])           
        outfileName           = '"'+sys.argv[4]+'"'  #TODO Later multiple outputs one per tab
          
        sys.stdout.write( "\nInput parameters ",str(sys.argv[1:4]),"\n" )
        
    #infileName = "/Users/bobbrown/Desktop/01_Gordon_Mills__Zhiyong_Ding.xlsx"
    #outfileName= "/Users/bobbrown/Desktop/01_Gordon_Mills__Zhiyong_Ding-Tab-Out-"
    #tabName ="NormLog2"
    #tabName =""
    #tabNumber= 10
        
    status=  File_From_Tab(infileName, outfileName, tabName, tabNumber )
    #except
        #sys.exit(-1)
    
    sys.exit(0)