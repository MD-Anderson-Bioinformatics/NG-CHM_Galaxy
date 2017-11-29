<HTML>
   <HEAD>

   </HEAD>
   
   <BODY>
    <div id='NGCHMEmbed' style="background-color: white; width:90%; margin: 0 0 0 5%; border: 2px solid gray; padding: 5px"></div>
    <script src='/plugins/visualizations/mda_heatmap_viz/static/javascript/ngchmWidget-min.js'></script>
    
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
       NgChm.galaxy = true;
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
               document.getElementById('loader').style.display = '';
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

    </script>

    </BODY >
</HTML>