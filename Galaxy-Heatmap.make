# build a Docker Galaxy MDA Heatmap instance with visualization included  
# bob brown & mike ryan 11apr2016
# assumes this script is run form the git/ top level directory and that the MDA_Heatmap repository has been pulled
#git clone https://odin.mdacc.tmc.edu/mcryan/NGCHM_Galaxy.git

#NOTE MUST RUN IN DOCKER TERMINAL WINDOW 
#NOTE Script must be started while in the git/  directory
#NOTE need one parameter that is the docker virtualbox directory

echo ' MUST BE RUN IN DOCKER TERMINAL WINDOW '
echo ' Script must be started while in the git/  directory '
echo ' The one parameter that is the docker virtualbox directory '

#do not need sudo mount -t  '/Users/bobbrown/VirtualBox\ VMs/boot2docker-vm/zzz' '/Users/NGCHM_Galaxy'     #mount local directory to Docker



eval "$(docker-machine env default)"  #https://github.com/docker/kitematic/issues/1010

docker pull bgruening/galaxy-stable   #download galaxy instance


cp -r NGCHM_Galaxy '/Users/bobbrown/VirtualBox\ VMs/boot2docker-vm/zzz'

#cd ..


docker run --name="galaxy_heatmap" -v '/Users/bobbrown/VirtualBox VMs/boot2docker-vm/zzz':/tmp -d -p 8811:80 -p 7021:21 -e "GALAXY_CONFIG_ADMIN_USERS=mryan@insilico.us.com,rbrown@insilico.us.com" bgruening/galaxy-stable   #name prog galaxy run on IP 8888
#fails docker run --name="galaxy_heatmap" -v git:/tmp -d -p 8811:80 -p 7021:21 -e "GALAXY_CONFIG_ADMIN_USERS=mryan@insilico.us.com,rbrown@insilico.us.com" bgruening/galaxy-stable   #name prog galaxy run on IP 8888





docker-machine  ip 						# retrieve docker IP for use with mac     192.168.99.100:8888

docker exec -it galaxy_heatmap /bin/bash      #enter galaxy main directory on docker instance
cd /galaxy-central/tools


mv /tmp/NGCHM_Galaxy/mda_heatmap_gen ./MDA_Heatmaps  										 # move file up out of NGCHM dir

mv /tmp/NGCHM_Galaxy/mda_heatmap_viz /galaxy-central/config/plugins/visualizations    # move visualization to correct spot

cd /galaxy-central

		#modify tool_conf.xml  # add as 3 thur 5 lines of tool_conf.xml.main

sed -i '/<toolbox>/a   <section id="MDAheatmap" name="TCGA_Heatmap Creation">\n    <tool file="MDA_Heatmaps/mda_heatmap_gen.xml" />\n  </section>' /galaxy-central/config/tool_conf.xml.main


nohup sh run.sh &    #run in backgroup 

rm -R /Users/NGCHM_Galaxy

docker create galaxy-heatmap



#old docker run --name="galaxy" -d -p 8888:80 -p 7021:21 -e "GALAXY_CONFIG_ADMIN_USERS=mryan@insilico.us.com,rbrown@insilico.us.com" bgruening/galaxy-stable   #name prog galaxy run on IP 8888
#old docker run -v /tmp:/tmp bgruening/galaxy-stable     #mount NGCHM_Galaxy as directory in image / http://stackoverflow.com/questions/15693153/mounting-directory-from-parent-system-to-container-in-docker
#docker exec -it galaxy_heatmap /galaxy-central/tools  get permission denied but if two steps it is okay





