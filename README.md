# ingest-file-archiver
Service for storing HCA sequencing data in the EBI archives.

## Setup

Requires NodeJS version 8.0+

Run `npm install`

## Running

This component is configured to listen to serialized JSON messages from an AMQP queue with the following format. Each
message should have a `submission` and `s3Url` key.
```javascript
{
    "s3Url" : string // an s3:// URL for this file
    "submission" : string // the ID of the Unified Submissions Interface(USI) submission to which the file is destined 
}
```

Environment variables for connecting to the RabbitMQ broker:

 `ARCHIVER_RABBIT_SCHEME`: protocol to use for connecting to the RabbitMQ broker. Either "amqp" or "amqps" expected
 
 `ARCHIVER_RABBIT_HOST`: hostname of the server running the AMQP broker
 
 `ARCHIVER_RABBIT_PORT`: hostname of the server running the AMQP broker
 
 `ARCHIVER_EXCHANGE`: name of the amqp exchange for the listener queue
 
 `ARCHIVER_EXCHANGE_TYPE`: the exchange type...
 
 `ARCHIVER_QUEUE_NAME`: queue name
 
 ## Running in bundle-download mode with Docker
 
 In this mode the file-archiver will read a .json file specifying bundles to be archived 
 as well as any necessary fastq->bam conversions.
 
 `docker run -e BUNDLE_BASE_DIR=<provide> -e UPLOAD_PLAN_PATH=<provide> -e AAP_USERNAME=<provide> -e AAP_PASSWORD=<provide> -e AAP_URL=<provide> <image id>`
 
 The bundle-spec .json file should adhere to the following format:
 
 
```javascript
{
    "jobs": [
        "usi_api_url": string,
        "ingest_api_url": string,
        "submission_url": string,
        "files": string[],
        "bundle_uuid": string,
        "conversion": {
            "output_name": string,
            "inputs": [{
                "name": string,
                "read_index": string
            }]
        }
    ]
}
```
Note: The metadata archiver outputs a spec matching the above .json when attempting to 
archive the metadata in a HCA submission

Environment variables must be set when running in the mode:

`AAP_URL`: URL of the AAP authn endpoint

`AAP_PASSWORD`:	password for the HCA AAP user account

`AAP_USERNAME`: username of HCA AAP user account

`UPLOAD_PLAN_PATH`:	Full path of the bundle specification .json

`BUNDLE_BASE_DIR`: Full path of the base working directory space for downloading and bam-converting bundle data