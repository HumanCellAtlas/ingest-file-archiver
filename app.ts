import * as fs from "fs";
import config from "config";

import LocalFileUploadHandler from "./src/listeners/handlers/local-file-upload-handler";
import FileUploader from "./src/util/file-uploader";
import AapTokenClient from "./src/util/aap-token-client";
import {
    AAPCredentials,
    ConversionMap,
    FileUploadMessage,
    UploadJob,
    UploadJobConversion,
    UploadPlan
} from "./src/common/types";
import Fastq2BamConverter from "./src/util/fastq-2-bam-converter";
import BundleDownloader from "./src/util/bundle-downloader";
import R from "ramda";
import Promise from "bluebird";
import TokenManager from "./src/util/token-manager";
import UploadPlanParser from "./src/util/upload-plan-parser";

const args = process.argv;

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
    return new Fastq2BamConverter("/app/fastq/bin/fastq2bam");
})();

const bundleDownloader = (() => {
    return new BundleDownloader("hca");
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

let processUploadJobsSequential: (uploadJobs: UploadJob[]) => Promise<void>;
processUploadJobsSequential = (uploadJobs: UploadJob[]) : Promise<void> => {
    if(uploadJobs.length == 0) {
        return Promise.resolve();
    } else {
        const uploadJob: UploadJob = R.head(uploadJobs)!;
        const uploadMessage = UploadPlanParser.uploadMessageForJob(uploadJob);

        return localFileUploadHandler.doLocalFileUpload(uploadMessage)
            .then(() => {
                return processUploadJobsSequential(R.tail(uploadJobs))
            });
    }
};

const start = () => {
    processUploadJobsSequential(uploadPlan.jobs)
        .then(() => {
            console.log("Finshed");
            process.exit(0)
        })
        .catch(error => {
            console.error("Error: " + error.toString());
            process.exit(1)
        });
};

start();