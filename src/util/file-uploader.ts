import tus, {UploadOptions} from "tus-js-client";
import TokenManager from "./token-manager";
import TusUpload from "../model/tus-upload";
import Promise from "bluebird";
import fs from "fs";

/**
 *
 * Stages a File for archiving in the EBI using a tus.io client
 *
 */
class FileUploader {
    tokenManager: TokenManager;

    constructor(tokenManager: TokenManager) {
        this.tokenManager = tokenManager;
    }

    /**
     *
     * Given a TusUpload object, uploads the specified file
     */
    stageFile(tusUpload: TusUpload, submission: string) : Promise<void> {

        return this._getToken()
            .then(token => {return FileUploader._insertToken(tusUpload, token)})
            .then(tusUpload => {return FileUploader._insertSubmission(tusUpload, submission)})
            .then(tusUpload => {return this._doUpload(tusUpload)});
    }

    /**
     * Performs the upload, resolves when the upload finishes successfully
     *
     * @param tusUpload
     * @private
     */
    _doUpload(tusUpload: TusUpload) : Promise<void>{
        return new Promise<void>((resolve, reject) => {
            const fileStream = fs.createReadStream(tusUpload.filePath!);
            fs.readFile(tusUpload.filePath!, {encoding: 'utf-8'}, (err, data) => {
                const dataBuffer = Buffer.from(data);

                // TODO: maintainers of tus-js-client need to add streams as an allowable type for tus file sources
                // @ts-ignore
                const upload = new tus.Upload(fileStream, {
                    endpoint: tusUpload.uploadUrl!,
                    retryDelays: [0, 1000, 3000, 5000],
                    headers: tusUpload.metadataToDict(),
                    onError: (error: any) => {
                        console.log("Failed because: " + error);
                        reject(error);
                    },
                    onProgress: (bytesUploaded: number, bytesTotal: number) => {
                        const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                        console.log(bytesUploaded, bytesTotal, percentage + "%");
                    },
                    onSuccess: () => {
                        console.log("Download complete");
                        resolve();
                    }
                });
            });
        });
    }

    stageS3File(s3FileLocatorObj: any) {
        return null; // TODO: do this
    }

   static _insertToken(tusUpload: TusUpload, token: string) : Promise<TusUpload> {
        return Promise.resolve(tusUpload.addToken(token));
    }

    static _insertSubmission(tusUpload: TusUpload, submission: string) : Promise<TusUpload> {
        return Promise.resolve(tusUpload.addSubmission(submission));
    }

    _getToken() : Promise<string> {
        return this.tokenManager.getToken();
    }

}