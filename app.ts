import * as fs from "fs";
import config from "config";

import LocalFileUploadHandler from "./src/listeners/handlers/local-file-upload-handler";
import FileUploader from "./src/util/file-uploader";
import AapTokenClient from "./src/util/aap-token-client";
import {AAPCredentials, FileUploadMessage} from "./src/common/types";
import Fastq2BamConverter from "./src/util/fastq-2-bam-converter";
import BundleDownloader from "./src/util/bundle-downloader";
import R from "ramda";
import Promise from "bluebird";
import TokenManager from "./src/util/token-manager";

const args = process.argv;


/* ----------------------------------- */

type UploadJob = {
    usi_api_url: string,
    ingest_api_url: string,
    submission_url: string,
    files: string[],
    bundle_uuid: string,
    conversion: {
        output_name: string,
        inputs: {
            "name": string,
            "read_index": string
        }[]
    }
}

type UploadPlan = {
    jobs: UploadJob[]
}

/* ----------------------------------- */

const tokenClient = (() => {
    const aapCredentials: AAPCredentials = config.get("AUTH.usi.credentials");
    const authUrl: string = config.get("AUTH.usi.authUrl");

    return new AapTokenClient(aapCredentials, authUrl);
})();

const tokenManager = (() => {
    return new TokenManager(tokenClient, 10*60*1000, 2*60*1000);
})();

const fileUploader = (() => {
    return new FileUploader(tokenManager);
})();

const fastq2BamConverter = (() => {
    return new Fastq2BamConverter("fastq2bam");
})();

const bundleDownloader = (() => {
    return new BundleDownloader("/Users/rolando/development/hca/ingestion-infrastructure/ingestion/ingest-file-archiver/hca-cli/bin/hca");
})();

const bundleDirBasePath = (() => {
    return config.get("FILES.bundleBaseDir") as string;
})();

const localFileUploadHandler = (() => {
    return new LocalFileUploadHandler(fileUploader, fastq2BamConverter, bundleDownloader, bundleDirBasePath);
})();


const uploadPlanFilePath: string = config.get("FILES.uploadPlanPath");
const uploadPlanFileData: Buffer = fs.readFileSync(uploadPlanFilePath);
const uploadPlan: UploadPlan = JSON.parse(uploadPlanFileData.toString());

/* ----------------------------------- */

const uploadMessageForJob = (uploadJob: UploadJob): FileUploadMessage => {
    return {
        bundleUuid: uploadJob.bundle_uuid,
        submissionUrl: uploadJob.submission_url,
        fileNames: uploadJob.files,
        usiUrl: uploadJob.usi_api_url,
        conversionMap: {
            inputs: R.map((conversionInput) => {return {readIndex: conversionInput.read_index, fileName: conversionInput.name} } , uploadJob.conversion.inputs),
            outputName: uploadJob.conversion.output_name
        }
    }
};

let processUploadJobsSequential: (uploadJobs: UploadJob[]) => Promise<void>;
processUploadJobsSequential = (uploadJobs: UploadJob[]) : Promise<void> => {
    if(uploadJobs.length == 0) {
        return Promise.resolve();
    } else {
        const uploadJob: UploadJob = R.head(uploadJobs)!;
        const uploadMessage = uploadMessageForJob(uploadJob);

        return new Promise<void>(resolve => {
            localFileUploadHandler.doLocalFileUpload(uploadMessage)
                .then(() => {return processUploadJobsSequential(R.tail(uploadJobs))});
        });
    }
};

const start = () => {
    processUploadJobsSequential(uploadPlan.jobs)
        .then(() => process.exit(0));
};

start();