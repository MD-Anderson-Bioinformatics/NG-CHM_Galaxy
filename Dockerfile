##### BASE #####

FROM bgruening/galaxy-stable

##### APT-GET #####
#RUN apt-get update

##### Place MDA software in Tools and Visualization directories #####
ADD ./mda_heatmap_gen/* /galaxy-central/tools/Heat_Map_Creation/
RUN  chmod +x /galaxy-central/tools/Heat_Map_Creation/heatmap.sh
RUN  chmod 777 /galaxy-central/tools/Heat_Map_Creation

COPY ./mda_heatmap_viz/  /galaxy-central/config/plugins/visualizations/mda_heatmap_viz/
RUN  chmod 777 /galaxy-central/config/plugins/visualizations/mda_heatmap_viz/

##### Modify Tool_Conf to include MDA Heatmap #####
RUN sed -i '/<toolbox monitor="true">/a \\t<section id="Heat_Map_Creation" name="Heat Map Creation">\n\t\t<tool file="Heat_Map_Creation/mda_heatmap_gen.xml" />\n\t</section>' /galaxy-central/config/tool_conf.xml.sample

##### Place MDA and Insilico logo on the Welcome Page #####
RUN  chmod -777  /etc/galaxy/web/welcome_image.png
COPY ./mda_heatmap_viz/static/images/MDA&InSilico&Docker.png  /etc/galaxy/web/welcome_image.png
RUN  chmod 775 /galaxy-central/static

##### Place MDA test input and output files in ~/test-data directory #####
ADD ./ngchm-matrix-functional-test-data/400x400.txt                   /galaxy-central/test-data/
ADD ./ngchm-matrix-functional-test-data/400x400-row-covariate.txt     /galaxy-central/test-data/
ADD ./ngchm-matrix-functional-test-data/400x400-column-covariate.txt  /galaxy-central/test-data/
ADD ./ngchm-matrix-functional-test-data/Galaxy400x400-noCovariates.ngchm  /galaxy-central/test-data/
