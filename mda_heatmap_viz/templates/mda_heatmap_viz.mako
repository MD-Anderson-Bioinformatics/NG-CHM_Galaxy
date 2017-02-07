<HTML>
   <HEAD>
      <link rel="stylesheet" href="/plugins/visualizations/mda_heatmap_viz/static/css/NGCHM.css">
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/zip.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/deflate.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/inflate.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/MatrixManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/NGCHM_Util.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/SelectionManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/ColorMapManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/SummaryHeatMapDisplay.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/DetailHeatMapDisplay.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/Dendrogram.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/UserHelpManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/UserPreferenceManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/PdfGenerator.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/Linkout.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/CompatibilityManager.js"></script>

      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/jspdf.debug.js"></script>
 
      <meta id='viewport' name ="viewport" content="">

   </HEAD>
   
   <BODY onresize="chmResize()">
    <%
       from galaxy import model
       users_current_history = trans.history
       url_dict = { }
       dataset_ids = [ trans.security.encode_id( d.id ) for d in users_current_history.datasets ]
       output_datasets = hda.creating_job.output_datasets
       for o in output_datasets:
              url_dict[ o.name ] = trans.security.encode_id( o.dataset_id )
    %>

    <script>
       NgChm.heatMap = null;  //global - heatmap object.
       NgChm.staticPath = "/plugins/visualizations/mda_heatmap_viz/static/"; //path for static web content - changes in galaxy.

       var url_dict = ${ h.dumps( url_dict ) };
       var hdaId   = '${trans.security.encode_id( hda.id )}';
       var hdaExt  = '${hda.ext}';
       var ajaxUrl = "${h.url_for( controller='/datasets', action='index')}/" + hdaId + "/display?to_ext=" + hdaExt;

       var xmlhttp=new XMLHttpRequest();
       xmlhttp.open("GET", ajaxUrl, true);
       xmlhttp.responseType = 'blob';
       xmlhttp.onload = function(e) {
           if (this.status == 200) {
               var blob = new Blob([this.response], {type: 'compress/zip'});
               zip.useWebWorkers = false;
               var matrixMgr = new NgChm.MMGR.MatrixManager(NgChm.MMGR.FILE_SOURCE);
               var name = this.getResponseHeader("Content-Disposition");
               if (name.indexOf('[') > -1) {
                 name = name.substring(name.indexOf('[')+1, name.indexOf(']'));
               }               
               NgChm.heatMap = matrixMgr.getHeatMap(name,  NgChm.SUM.processSummaryMapUpdate, blob);
               NgChm.heatMap.addEventListener(NgChm.DET.processDetailMapUpdate);
               NgChm.SUM.initSummaryDisplay();
               NgChm.DET.initDetailDisplay();
               document.getElementById("container").addEventListener('wheel', NgChm.SEL.handleScroll, false);
               document.getElementById("detail_canvas").focus();
           }
       };
       xmlhttp.send();

       function chmResize() {
 	  NgChm.SUM.summaryResize();
 	  NgChm.DET.detailResize();
 	  NgChm.UPM.prefsResize();
       }

    </script>

    <div class="mdaServiceHeader" id="mdaServiceHeader">
        <div class="mdaServiceHeaderLogo">
           <a href="https://www.mdanderson.org/education-and-research/departments-programs-and-labs/departments-and-divisions/bioinformatics-and-computational-biology/index.html"  target="_blank">
               <img src="/plugins/visualizations/mda_heatmap_viz/static/images/mdabcblogo262x108.png" alt=""/>
           </a>
        </div>
        <div id='detail_buttons' style="display:none;" onmouseout='NgChm.UHM.userHelpClose();'>
	   <div id='top_buttons'>
       	      <div id="mapName" onmouseover='NgChm.UHM.detailDataToolHelp(this,"Map Name: " + NgChm.heatMap.getMapInformation().name + "<br><br>Description: " + NgChm.heatMap.getMapInformation().description,350,"left")' style="font-size: 14px;color: rgb(51, 51, 51);"></div>
           </div>
           <div id='bottom_buttons' >
 	      <img id='zoomOut_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/zoom-out.png' alt='Zoom Out' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Zoom Out")' onclick='NgChm.DET.detailDataZoomOut();'   align="top"   />
	      <img id='zoomIn_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/zoom-in.png' alt='Zoom In' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Zoom In")' onclick='NgChm.DET.detailDataZoomIn();' align="top"   />
	      <img id='full_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/full_selected.png' alt='Full' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Normal View")' onclick='NgChm.DET.detailNormal();' align="top"   />
	      <img id='ribbonH_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/ribbonH.png' alt='Ribbon H' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Horizontal Ribbon View")' onclick='NgChm.DET.detailHRibbonButton();' align="top"  />
	      <img id='ribbonV_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/ribbonV.png' alt='Ribbon V' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Vertical Ribbon View")' onclick='NgChm.DET.detailVRibbonButton();'  align="top"  />
   	      <span style='display: inline-block;'><b>Search: </b><input type="text" id="search_text" name="search" onkeyup='NgChm.DET.clearSrchBtns(event);' onchange='NgChm.DET.detailSearch();'
                                               onmouseover='NgChm.UHM.detailDataToolHelp(this,"Search row and column labels.  Enter search term and click Go. The search will find labels that partially match the search text. To find exact matches only, put \"\" characters around the search term.  Multiple search terms can be separated by spaces.  If the search box turns red, none of the search terms were found.  If it turns yellow, only some of the search terms were found.", 400)' /></span>	
	      <img id='go_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/go.png' alt='Go' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Search Row/Column Labels")'  onclick='NgChm.DET.detailSearch();' align="top"  />
	      <img id='prev_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/prev.png' alt='Previous' onmouseover='userHelpClose();' style="display:none;" onclick='NgChm.DET.searchPrev();'  align="top"  />
	      <img id='next_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/next.png' alt='Next' onmouseover='userHelpClose();' style="display:none;" onclick='NgChm.DET.searchNext();'  align="top"  />
	      <img id='cancel_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/cancel.png' alt='Cancel' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Clear current search")' style="display:none;" onclick='NgChm.DET.clearSearch(event);'  align="top"  />
           </div>
           <div id="pdf_gear" align="right" style="position: absolute;right:15;top:5">
              <div id="flicks" style="display: none;">
                 <div id="noFlickViews" style="display: none;">
                    <table><tr><td><img id='flickOff' src='/plugins/visualizations/mda_heatmap_viz/static/images/layersOff.png' onclick="NgChm.SEL.flickToggleOn();" onmouseout='NgChm.UHM.userHelpClose();' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Open Data Layer Control")'/></td></tr></table>
                 </div>
                 <div id="flickViews" style="display: none;">
                    <table><tr>
                       <td><table><tr><td rowspan="2"><img id='flick_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/toggleUp.png' alt='Flick' onmouseout='NgChm.UHM.userHelpClose();' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Toggle Between Selected Data Layers (F2)")' onclick='NgChm.SEL.flickChange();'/></td><td><select name="flick1" id="flick1" onchange="NgChm.SEL.flickChange('flick1');"></select></td></tr><tr><td><select name="flick2" id="flick2" onchange="NgChm.SEL.flickChange('flick2');"></select></td></tr></table></td>
                       <td><img id='flickOn_pic' src='/plugins/visualizations/mda_heatmap_viz/static/images/layersOn.png'  onclick="NgChm.SEL.flickToggleOff();" onmouseout='NgChm.UHM.userHelpClose();' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Close Data Layer Control")'/></td>
                    </tr></table>
                 </div>
              </div>
              <img id='pdf_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/pdf.png' alt='go' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Save as PDF")' onclick='NgChm.PDF.openPdfPrefs(this,null);' align="top"/>
              <img id='gear_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/gear.png' alt='Modify Map' onmouseover='NgChm.UHM.detailDataToolHelp(this,"Modify Map Preferences")' onclick='NgChm.UPM.editPreferences(this,null);' align="top"/>
              <img id='help_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/questionMark.png' alt='Help' onmouseover='NgChm.UHM.detailDataToolHelp(this,"NgChm Help",160)' onclick='NgChm.UHM.openHelp(this);' align="top"/>
           </div>
        </div>
    </div>

    <div id="container">
       <div id='summary_chm' style='position: relative;'>
   	  <img id='messageOpen_btn' style="position:absolute; display: none;" src='/plugins/visualizations/mda_heatmap_viz/static/images/messageButton.png' alt='Open Alert' onclick='NgChm.SUM.displayInfoMessage();' align="top"   />
          <canvas id='column_dendro_canvas' width='1200' height='500'></canvas>
          <canvas id='row_dendro_canvas' width='1200' height='500'></canvas>
          <canvas id='summary_canvas'></canvas>
          <canvas id='summary_box_canvas' ></canvas>
          <canvas id='summary_col_select_canvas' class='selection_canvas'></canvas>
			<canvas id='summary_row_select_canvas' class='selection_canvas' ></canvas>
	  <div id='sumlabelDiv' style="display: inline-block"></div>
       </div>

       <div id= 'divider' style='position: relative;' onmousedown="NgChm.SUM.dividerStart()" ontouchstart="NgChm.SUM.dividerStart()">
       </div>

       <div id='detail_chm' style='position: relative;'>
          <canvas id='detail_canvas' style='display: inline-block'></canvas>
          <canvas id='detail_box_canvas' ></canvas>
	<!--		<div id='detSizer' style='position:absolute'  onmousedown="NgChm.DET.detSizerStart()" ontouchstart="NgChm.DET.detSizerStart()"></div> -->
          <div id='labelDiv' style="display: inline-block"></div>
       </div>
   </div>
   <div id='insilico_footer' style="left:10px; bottom:15px;position:absolute">
      <a href="http://insilico.us.com/"  target="_blank">
         <img id='insilicologo' src='/plugins/visualizations/mda_heatmap_viz/static/images/insilicologo.png' alt='insilico' height="28px"/>
      </a>
   </div>

   <div id="pdfPrefsPanel" style="display: none; position: absolute; background-color: rgb(203, 219, 246);">
      <div class="prefsHeader" id="pdfPrefsHeader">PDF Generation</div>
         <table>
            <tbody>
               <tr>
                  <td>
                     <div id="pdfprefprefs" style="display: block; background-color: rgb(203, 219, 246);">
                        <div style="display: inherit; width: 220px; height: 220px;">
                           <h3 style="margin-bottom:0px;">Show maps:</h3>
                           <input id="pdfInputSummaryMap" type="radio" name="pages" value="summary"> Summary<br>
                           <input id="pdfInputDetailMap" type="radio" name="pages" value="detail"> Detail<br>
                           <input id="pdfInputBothMaps" type="radio" name="pages" value="both" checked> Both<br><br>
						<!--  		<input id="pdfInputPages" type="checkbox" name="pages" value="separate"> Show maps on separate pages<br>	-->							
                           <input id="pdfInputPortrait" type="radio" name="orientation" value="portrait"> Portrait 
                           <input id="pdfInputLandscape" type="radio" name="orientation" value="Landscape" checked> Landscape <br>							
                           <h3 style="margin-bottom:0px;">Show classification bars:</h3>							
                           <input id="pdfInputCondensed" type="radio" name="condensed" value="condensed"> Condensed 
                           <input id="pdfInputHistogram" type="radio" name="condensed" value="histogram" checked> Histogram <br>							
                           <input id="pdfInputColumn" type="checkbox" name="class" value="row" checked> Column<br>							
                           <input id="pdfInputRow" type="checkbox" name="class" value="column" checked> Row
                        </div>
                        <table>
                           <tbody>
                              <tr>
                                 <td style="font-weight: bold;">
                                    <div id="pref_buttons" align="right">
                                       <img id="prefCancel_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/prefCancel.png" alt="Cancel changes" onclick="NgChm.PDF.pdfCancelButton();" align="top">&nbsp;&nbsp;
                                       <img id="prefCreate_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/createPdf.png" alt="Create PDF" onclick="NgChm.PDF.getPDF();" align="top">
                                    </div>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  </td>
               </tr>
            </tbody>
         </table>
      </div>
      <div id="msgBox" style="top: 150;left: 300; display: none; position: absolute; background-color: rgb(230, 240, 255);">
         <div class="msgBoxHdr" id="msgBoxHdr"></div>  
         <table>
            <tbody>
               <tr>
                  <td>
                     <div id="msgBoxTxt" style="display: inherit;font-size: 12px; background-color: rgb(230, 240, 255); width: 400px; height: 80px;"></div>
                     <table>
                        <tbody>
                           <tr>
                              <td align="left">
                                 <img id="msgBoxBtnImg_1" align="top" style="display: inherit;">
                              </td>
                              <td align="left">
                                 <img id="msgBoxBtnImg_2" align="top" style="display: inherit;">
                              </td>
                              <td align="right">
                                 <img id="msgBoxBtnImg_3" align="top" style="display: inherit;">
                              </td>
                              <td align="right">
                                 <img id="msgBoxBtnImg_4" align="top" style="display: inherit;">
                              </td>
                           </tr>
                        </tbody>
                     </table> 
                  </td>
               </tr>
            </tbody>
         </table>
      </div>
      <div id="prefsPanel" style="display: none;">
         <div id="prefsHeader">Heat Map Display Properties<img id="redX_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/redX.png" alt="Cancel changes" onclick="NgChm.UPM.prefsCancelButton();" align="right"></div>
         <div style="height: 20px;"></div>
         <div id="prefTabButtons">&nbsp;<img id="prefRowsCols_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/rowsColsOn.png" alt="Edit Rows &amp; Columns" onclick="NgChm.UPM.showRowsColsPrefs();" align="top">&nbsp;<img id="prefLayer_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/dataLayersOff.png" alt="Edit Data Layers" onclick="NgChm.UPM.showLayerPrefs();" 	align="top">&nbsp;<img id="prefClass_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/covariateBarsOff.png" alt="Edit Classifications" onclick="NgChm.UPM.showClassPrefs();" align="top"></div>
         <div id="prefPrefs" class="prefSubPanel" style="display: block; height: 70"></div>
      </div>
   </BODY >
</HTML>