<HTML>
   <HEAD>
      <link rel="stylesheet" href="/plugins/visualizations/mda_heatmap_viz/static/css/NGCHM.css">
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/zip.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/deflate.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/inflate.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/NGCHM_Util.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/SelectionManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/MatrixManager.js"></script>
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
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/custom.js"></script>

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
       heatMap = null;  //global - heatmap object.
       staticPath = "/plugins/visualizations/mda_heatmap_viz/static/"; //path for static web content - changes in galaxy.

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
               var matrixMgr = new MatrixManager(MatrixManager.FILE_SOURCE);
               var name = this.getResponseHeader("Content-Disposition");
               if (name.indexOf('[') > -1) {
                 name = name.substring(name.indexOf('[')+1, name.indexOf(']'));
               }               heatMap = matrixMgr.getHeatMap(name,  processSummaryMapUpdate, blob);
               heatMap.addEventListener(processDetailMapUpdate);
               initSummaryDisplay();
               initDetailDisplay();
               document.getElementById("container").addEventListener('wheel', handleScroll, false);
           }
       };
       xmlhttp.send();

       function chmResize() {
 	  summaryResize();
 	  detailResize();
 	  prefsResize();
       }

    </script>

    <div class="mdaServiceHeader" id="mdaServiceHeader">
        <div class="mdaServiceHeaderLogo">
           <a href="https://www.mdanderson.org/education-and-research/departments-programs-and-labs/departments-and-divisions/bioinformatics-and-computational-biology/index.html"  target="_blank">
               <img src="/plugins/visualizations/mda_heatmap_viz/static/images/mdabcblogo262x108.png" alt=""/>
           </a>
        </div>
        <div id='detail_buttons' style="display:none;" onmouseout='userHelpClose();'>
	   <div id='top_buttons'>
       	      <div id="mapName" onmouseover='detailDataToolHelp(this,heatMap.getMapInformation().description)'></div>
           </div>
           <div id='bottom_buttons' >
     	      <img id='back_btn' style="display: none;" src='/plugins/visualizations/mda_heatmap_viz/static/images/returnArrow.png' alt='Return to previous screen' onmouseover='detailDataToolHelp(this,"Return To Previous Screen")' onclick='returnToHome();' align="top"   />
 	      <img id='zoomOut_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/zoom-out.png' alt='Zoom Out' onmouseover='detailDataToolHelp(this,"Zoom Out")' onclick='detailDataZoomOut();'   align="top"   />
	      <img id='zoomIn_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/zoom-in.png' alt='Zoom In' onmouseover='detailDataToolHelp(this,"Zoom In")' onclick='detailDataZoomIn();' align="top"   />
	      <img id='full_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/full_selected.png' alt='Full' onmouseover='detailDataToolHelp(this,"Normal View")' onclick='detailNormal();' align="top"   />
	      <img id='ribbonH_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/ribbonH.png' alt='Ribbon H' onmouseover='detailDataToolHelp(this,"Horizontal Ribbon View")' onclick='detailHRibbonButton();' align="top"  />
	      <img id='ribbonV_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/ribbonV.png' alt='Ribbon V' onmouseover='detailDataToolHelp(this,"Vertical Ribbon View")' onclick='detailVRibbonButton();'  align="top"  />
   	      <span style='display: inline-block;'><b>Search: </b><input type="text" id="search_text" name="search" onkeyup='clearSrchBtns(event);' onchange='detailSearch();'
                                               onmouseover='detailDataToolHelp(this,"Search Row/Column Labels. Separate search terms with spaces or commas. Use * for wild card matching. Hit enter or Go to run the search. If the search box turns red none of the search terms were found. If it turns yellow only some of the search terms were found.", 200)' /></span>	
	      <img id='go_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/go.png' alt='Go' onmouseover='detailDataToolHelp(this,"Search Row/Column Labels")'  onclick='detailSearch();' align="top"  />
	      <img id='prev_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/prev.png' alt='Previous' onmouseover='userHelpClose();' style="display:none;" onclick='searchPrev();'  align="top"  />
	      <img id='next_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/next.png' alt='Next' onmouseover='userHelpClose();' style="display:none;" onclick='searchNext();'  align="top"  />
	      <img id='cancel_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/cancel.png' alt='Cancel' onmouseover='detailDataToolHelp(this,"Clear current search")' style="display:none;" onclick='clearSearch(event);'  align="top"  />
           </div>
           <div id="pdf_gear" align="right" style="position: absolute;right:0;top:0">
              <div id="flicks" style="display: none;">
                 <div id="noFlickViews" style="display: none;">
                    <table><tr><td><img id='flickOff' src='/plugins/visualizations/mda_heatmap_viz/static/images/layersOff.png' onclick="flickToggleOn();" onmouseout='userHelpClose();' onmouseover='detailDataToolHelp(this,"Open Data Layer Control")'/></td></tr></table>
                 </div>
                 <div id="flickViews" style="display: none;">
                    <table><tr>
                       <td><table><tr><td rowspan="2"><img id='flick_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/toggleUp.png' alt='Flick' onmouseout='userHelpClose();' onmouseover='detailDataToolHelp(this,"Toggle Between Selected Data Layers (F2)")' onclick='flickChange();'/></td><td><select name="flick1" id="flick1" onchange="flickChange('flick1');"></select></td></tr><tr><td><select name="flick2" id="flick2" onchange="flickChange('flick2');"></select></td></tr></table></td>
                       <td><img id='flickOn_pic' src='/plugins/visualizations/mda_heatmap_viz/static/images/layersOn.png'  onclick="flickToggleOff();" onmouseout='userHelpClose();' onmouseover='detailDataToolHelp(this,"Close Data Layer Control")'/></td>
                    </tr></table>
                 </div>
              </div>
              <img id='pdf_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/pdf.png' alt='go' onmouseover='detailDataToolHelp(this,"Save as PDF")' onclick='openPdfPrefs(this,null);' align="top"/>
              <img id='gear_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/gear.png' alt='Modify Map' onmouseover='detailDataToolHelp(this,"Modify Map Preferences")' onclick='editPreferences(this,null);' align="top"/>
           </div>
        </div>
    </div>

    <div id="container">
       <div id='summary_chm' style='position: relative;'>
          <canvas id='column_dendro_canvas' width='1200' height='500'></canvas>
          <canvas id='row_dendro_canvas' width='1200' height='500'></canvas>
          <canvas id='summary_canvas'></canvas>
          <canvas id='summary_box_canvas' ></canvas>
	  <div id='sumlabelDiv' style="display: inline-block"></div>
       </div>

       <div id= 'divider' style='position: relative;' onmousedown="dividerStart()" ontouchstart="dividerStart()">
       </div>

       <div id='detail_chm' style='position: relative;'>
          <canvas id='detail_canvas' style='display: inline-block'></canvas>
          <canvas id='detail_box_canvas' ></canvas>
          <div id='detSizer' style='position:absolute'  onmousedown="detSizerStart()" ontouchstart="detSizerStart()"></div>
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
                           <input id="pdfInputPages" type="checkbox" name="pages" value="separate"> Show maps on separate pages<br>							
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
                                       <img id="prefCancel_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/prefCancel.png" alt="Cancel changes" onclick="pdfCancelButton();" align="top">&nbsp;&nbsp;
                                       <img id="prefCreate_btn" src="/plugins/visualizations/mda_heatmap_viz/static/images/createPdf.png" alt="Create PDF" onclick="getPDF();" align="top">
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
         <div id="prefsHeader">Heat Map Display Properties<img id="redX_btn" src="images/redX.png" alt="Cancel changes" onclick="prefsCancelButton();" align="right"></div>
         <div style="height: 20px;"></div>
         <div id="prefTabButtons">&nbsp;<img id="prefRowsCols_btn" src="images/rowsColsOn.png" alt="Edit Rows &amp; Columns" onclick="showRowsColsPrefs();" align="top">&nbsp;<img id="prefLayer_btn" src="images/dataLayersOff.png" alt="Edit Data Layers" onclick="showLayerPrefs();" 	align="top">&nbsp;<img id="prefClass_btn" src="images/covariateBarsOff.png" alt="Edit Classifications" onclick="showClassPrefs();" align="top"></div>
         <div id="prefPrefs" class="prefSubPanel" style="display: block; height: 70"></div>
      </div>
   </BODY >
</HTML>