# NGCHM Galaxy Viewer
Code for a Galaxy tool that creates NGCHM clustered heat maps and a galaxy plugin for dynamically viewing NGCHMs in galaxy.

Also contains a docker make file for building a galaxy server with the NGCHM tool installed.

To build the docker image from the base project directory:
```
docker build -t ngchm_galaxy .
```

To start a docker container with the galaxy image:
```
$ docker run --name="galaxy_test" -d -p 8888:80 -p 7021:21 -e "GALAXY_CONFIG_ADMIN_USERS=user@domain.com" ngchm_galaxy
```

If you want to use local space to preserve galaxy data outside of the container, mount the local volue in the run command with:
-v /some/local/directory/:/export/


# NGCHM Cloud Data Galaxy Viewer 
Code for a Galaxy tool that queries the NGCHM ISB Cloud Pilot Database for Samples and Genes based on statistical or parametric data
and as the Viewer above creates NGCHM clustered heat maps and a galaxy plugin for dynamically viewing NGCHMs in galaxy.

Also contains a docker make file for building a galaxy server with the NGCHM tool installed.

To build the docker image from the base project directory:
```
docker build -f Dockerfile-Cloud  -t  bq_cred_docker  .
```

To start a docker container with the galaxy image:
```
$ docker run -d -p 8888:80 -p 8021:21 --name="MDAGalaxyCloudNGCHM" -e "GALAXY_CONFIG_ADMIN_USERS=Admin"  -e "GALAXY_CONFIG_BRAND='MDACloudGalaxy'"  -v  /<your directory here>/:/data/   bq_cred_docker
```

If you want to use local space to preserve galaxy data outside of the container, mount the local volue in the run command with:
-v /some/local/directory/:/export/

NOTE:  Access to the NGCHM Cloud data requires one to have a Google Big Query security json file and a user project that references the NGCHM ISB project.
These can be created by following the information from the hyperlinks below.

https://developers.google.com/identity/protocols/application-default-credentials

https://console.developers.google.com/projectselector/apis/credentials

1. The Big Query supplied json credential file name must be renamed "Galaxy_ISB_NGCHM_BigQuery.json"            Multiple lines of incomprehensible text
2. The NGCHM project name you create must be in a file called       "Galaxy_ISB_NGCHM_BigQuery_Project_ID.txt"  Only one line with the project id
 

The two files must have the following names AND be mapped from your local computer be replacing the <your directory here> 
in the <your directory here>/:/Data volume in you docker run command above, for example  '/user/drwatson/ngchmfiles/:/data'
user/drwatson/ngchmfiles/ must contain the .json and .txt files above.