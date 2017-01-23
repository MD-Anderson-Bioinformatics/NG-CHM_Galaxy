
NG-CHM Generator

Repository text


Generate a clustered Heat Map from a data matrix, with many options for clustering.  
The input matrix is required to have labels in the first column and the first row containing. 
For example, column headers could be patient IDs and row headers (first column) could contain gene symbols.  
Covariate files add additional information bars to the heat map.  For example, a patients smoking status 
could be provided as a covariate file.  Any input covariate bar files must have the same row or column  labels as in the input matrix to associate the covariate information with the appropriate row or column..
The output is a compressed ngchm file that can be displayed in the NG-CHM viewer.  To access the viewer 
in Galaxy, use the visualize icon at the bottom of the Galaxy History NG-CHM tool output file.  
Expand the History output file, then at the bottom are several icons the order being -- 
the save icon, information "I", rerun, then the Visualization (a chart looking icon).  
Hover over it, and select the 'NG-CHM Heat Map Viewer' option. The Heat Map will display in the Galaxy middle pane.

Please see our YouTube tutorial video for an overview of creating NG-CHM heat maps in galaxy <link>

Full Documentation: http://bioinformatics.mdanderson.org/main/NG-CHM-V2:Overview

The Galaxy visualization component does not install automatically.  You will need to run the following commands in terminal mode:
NOTE: The following assumes /galaxy-central is the home directory for your Galaxy instance, otherwise replace /galaxy-central with your Galaxy instance's root directory

1) mv /galaxy-central/../shed_tools/toolshed.g2.bx.psu.edu/repos/md-anderson-bioinformatics/ngchm/*/ngchm/mda_heatmap_viz  /galaxy-central/config/plugins/visualizations/
2) cd /galaxy-central/config/plugins/visualizations/
3) unzip mda_heatmap_viz.zip

Then you must restart Galaxy for the visualization portion to take effect.
4) cd /galaxy-central
5) sh run.sh   

Or if using a docker instance

4b) docker stop  <docker container name>
5b) docker start  <docker container name>

Remember you MUST be logged in to be able to see the heat map visualization component icon.  
The NG-CHM Generator will run even if you are not logged into Galaxy.


