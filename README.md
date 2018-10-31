# ingest-file-archiver
Service for storage of HCA sequencing data files into the EBI archives



## Setup

Requires NodeJS version 8.0+

Run `npm install`

In order to collect files from the HCA S3 buckets, the `S3_ACCESS_KEY_ID` and `S3_ACCESS_KEY_SECRET` environment variables
must be configured. These credentials must represent an AWS IAM profile in the Human Cell Atlas AWS account with read 
privileges for S3.

## Running

This component is configured to listen to serialized JSON messages from a RabbitMQ queue with the following format. Each
message should have a `submission` and `s3Url` key.
```javascript
{
    "s3Url" : string // an s3:// URL for this file
    "submission" : string // the ID of the Unified Submissions Interface(USI) submission to which the file is destined 
}
```

Environment variables for connecting to the RabbitMQ broker:
``
