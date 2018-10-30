import tus, {Upload} from "tus-js-client";
import TokenManager from "./token-manager";
import TusUpload from "../model/tus-upload";
import Promise from "bluebird";
import fs from "fs";
import AWS, {S3} from "aws-sdk";
import configuration from "config";

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
    stageLocalFile(tusUpload: TusUpload) : Promise<Upload> {
        tusUpload.fileSize = fs.statSync(tusUpload.filePath!).size;
        tusUpload.fileStream = fs.createReadStream(tusUpload.filePath!);

        return this.doUpload(tusUpload);
    }

    /**
     *
     * Uploads a file from S3, referenced in the TusUpload obj
     *
     * @param tusUpload
     */
    stageS3File(tusUpload: TusUpload) : Promise<Upload> {
        const bucket = tusUpload.s3Bucket!;
        const key = tusUpload.s3Key!;

        return new Promise((resolve, reject) => {
            const config = this._aws_config();
            const s3Service = new S3(config);

            s3Service.headObject({Bucket: bucket, Key: key}).promise()
                .then((s3Obj) => {
                    tusUpload.fileSize = s3Obj.ContentLength!.valueOf();
                    tusUpload.fileStream = s3Service.headObject({Bucket: bucket, Key: key}).createReadStream();

                    this.doUpload(tusUpload).then((upload) => {
                        resolve(upload);
                    })
                });
        })
    }

    /**
     * Performs the upload, resolves when the upload finishes successfully
     *
     * @param tusUpload
     * @private
     */
    doUpload(tusUpload: TusUpload) : Promise<Upload>{
        return this._getToken()
            .then(token => {return FileUploader._insertToken(tusUpload, token)})
            .then(tusUpload => {return FileUploader._insertSubmission(tusUpload, tusUpload.submission!)})
            .then(tusUpload => {return this._doUpload(tusUpload)});
    }

    _doUpload(tusUpload: TusUpload) : Promise<Upload>{
        return new Promise<Upload>((resolve, reject) => {
            // TODO: maintainers of tus-js-client need to add streams as an allowable type for tus file sources
            // @ts-ignore TODO: tus.io typescript maintainers need to allow fileStreams here
            const fileStream:Blob = tusUpload.fileStream!;

            let upload: Upload;

            upload = new tus.Upload(fileStream, {
                endpoint: tusUpload.uploadUrl!,
                retryDelays: [0, 1000, 3000, 5000],
                headers: tusUpload.metadataToDict(),
                chunkSize: 50,
                uploadSize: tusUpload.fileSize,
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
                    resolve(upload);
                }
            });

            upload.start();
        });
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

    _aws_config() : AWS.Config {
        const accessKeyId: string = configuration.get("AUTH.s3.accessKeyId");
        const accessKeySecret: string = configuration.get("AUTH.s3.accessKeySecret");
        const config: AWS.Config = new AWS.Config();

        config.update({
            credentials: new AWS.Credentials(accessKeyId, accessKeySecret),
            region: "us-east-1"
        });

        return config;
    }
}

export default FileUploader;