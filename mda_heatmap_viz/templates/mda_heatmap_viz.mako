<HTML>
   <HEAD>
      <link rel="stylesheet" href="/plugins/visualizations/mda_heatmap_viz/static/css/NGCHM.css">
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/zip.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/lib/inflate.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/NGCHM_Util.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/SelectionManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/MatrixManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/ColorMapManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/SummaryHeatMapDisplay.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/DetailHeatMapDisplay.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/UserHelpManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/UserPreferenceManager.js"></script>
      <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/PdfGenerator.js"></script>
 	 <script src="/plugins/visualizations/mda_heatmap_viz/static/javascript/Linkout.js"></script>

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
               initDetailDisplay()
           }
       };
       xmlhttp.send();

       function chmResize() {
          detailResize();
       }

    </script>

    <div class="mdaServiceHeader">
        <div class="mdaServiceHeaderLogo">
            <img src="/plugins/visualizations/mda_heatmap_viz/static/images/mdandersonlogo260x85.png" alt="">
        </div>
        <div id="mapName" onmouseover='detailDataToolHelp(this,heatMap.getMapInformation().description)'></div>
	   <div id='detail_buttons' align="center" style="display:none">
 		    <img id='zoomOut_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/zoom-out.png' alt='Zoom Out' onmouseover='detailDataToolHelp(this,"Zoom Out")' onclick='detailDataZoomOut();'   align="top"   />
		    <img id='zoomIn_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/zoom-in.png' alt='Zoom In' onmouseover='detailDataToolHelp(this,"Zoom In")' onclick='detailDataZoomIn();' align="top"   />
		    <img id='full_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/full_selected.png' alt='Full' onmouseover='detailDataToolHelp(this,"Normal View")' onclick='detailNormal();' align="top"   />
		    <img id='ribbonH_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/ribbonH.png' alt='Ribbon H' onmouseover='detailDataToolHelp(this,"Horizontal Ribbon View")' onclick='detailHRibbonButton();' align="top"  />
		    <img id='ribbonV_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/ribbonV.png' alt='Ribbon V' onmouseover='detailDataToolHelp(this,"Vertical Ribbon View")' onclick='detailVRibbonButton();'  align="top"  />
   		    <span style='display: inline-block;'><b>Search: </b><input type="text" id="search_text" name="search" onkeypress='clearSrchBtns();' onchange='detailSearch();'
   			                                                     onmouseover='detailDataToolHelp(this,"Search Row/Column Labels. Separate search terms with spaces or commas. Use * for wild card matching. Hit enter or Go to run the search. If the search box turns red none of the search terms were found. If it turns yellow only some of the search terms were found.", 200)' ></span>	
		    <img id='go_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/go.png' alt='Go' onmouseover='detailDataToolHelp(this,"Search Row/Column Labels")'  onclick='detailSearch();' align="top"  />
		    <img id='prev_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/prev.png' alt='Previous' onmouseover='userHelpClose();' style="display:none;" onclick='searchPrev();'  align="top"  />
		    <img id='next_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/next.png' alt='Next' onmouseover='userHelpClose();' style="display:none;" onclick='searchNext();'  align="top"  />
		    <img id='cancel_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/cancel.png' alt='Cancel' onmouseover='detailDataToolHelp(this,"Clear current search")' style="display:none;" onclick='clearSearch();'  align="top"  />
       </div>
	 <div id='buttons'>
		    <img id='pdf_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/pdf.png' alt='go' onmouseover='detailDataToolHelp(this,"Save as PDF")' onclick='openPdfPrefs(this,null);'  align="top" />
 	    	    <img id='gear_btn' src='/plugins/visualizations/mda_heatmap_viz/static/images/gear.png' alt='Modify Map' onmouseover='detailDataToolHelp(this,"Modify Map Preferences")' onclick='editPreferences(this,null);'/>
	 </div>
    </div>

    <div id="container">

       <div id='summary_chm' style='position: relative;'>
          <canvas id='summary_canvas'></canvas>
		<div id='sumlabelDiv' style="display: inline-block"></div>
       </div>

	  <div id= 'divider' style='position: relative;' onmousedown="dividerStart()" ontouchstart="dividerStart()">
	  </div>

       <div id='detail_chm' style='position: relative;'>
          <canvas id='detail_canvas' style='display: inline-block'></canvas>
          <div id='labelDiv' style="display: inline-block"></div>
       </div>
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
</BODY >
</HTML>