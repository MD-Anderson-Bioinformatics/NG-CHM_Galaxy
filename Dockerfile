##### BASE #####

FROM bgruening/galaxy-stable

##### APT-GET #####
#RUN apt-get update

##### Place MDA software in Tools and Visualization directories #####
ADD ./mda_heatmap_gen/* /galaxy-central/tools/MDA_Heatmaps/
RUN  chmod +x /galaxy-central/tools/MDA_Heatmaps/heatmap.sh
RUN  chmod 777 /galaxy-central/tools/MDA_Heatmaps

COPY ./mda_heatmap_viz/  /galaxy-central/config/plugins/visualizations/mda_heatmap_viz/
RUN  chmod 777 /galaxy-central/config/plugins/visualizations/mda_heatmap_viz/

##### Modify Tool_Conf to include MDA Heatmap #####
RUN sed -i '/<toolbox monitor="true">/a \\t<section id="MDAheatmap" name="TCGA_Heatmap Creation">\n\t\t<tool file="MDA_Heatmaps/mda_heatmap_gen.xml" />\n\t</section>' /galaxy-central/config/tool_conf.xml.sample
