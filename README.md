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