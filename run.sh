#!/usr/bin/env bash

for param in "$@"
do
    case $param in
	-d=*|--base-dir=*)
	    BUNDLE_BASE_DIR=${param#*=}
	    shift
	    ;;
	-f=*|--upload-plan=*)
	    UPLOAD_PLAN_PATH=${param#*=}
	    shift
	    ;;
	-l=*|--aap-url=*)
	    AAP_URL=${param#*=}
	    shift
	    ;;
	-p=*|--aap-password=*)
	    AAP_PASSWORD=${param#*=}
	    shift
	    ;;
	-u=*|--aap-username=*)
	    AAP_USERNAME=${param#*=}
	    shift
	    ;;
    esac
done

if [ -z ${BUNDLE_BASE_DIR} ] || [ -z ${UPLOAD_PLAN_PATH} ] || [ -z ${AAP_URL} ] || \
       [ -z ${AAP_USERNAME} ] || [ -z  ${AAP_PASSWORD} ]; then
    echo "One of the required parameters is not provided."
    exit 1
fi

node /usr/src/app/dist/app.js
