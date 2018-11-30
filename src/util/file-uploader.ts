import tus, {Upload, UploadOptions} from "tus-js-client";
import TokenManager from "./token-manager";
import TusUpload from "../model/tus-upload";
import Promise from "bluebird";
import fs from "fs";
import {S3, Credentials, Config} from "aws-sdk";
import configuration from "config";
import * as stream from "stream";
import * as https from "https";
import {RequestOptions} from "https";
import {S3TusUpload} from "../model/s3-tus-upload";
import {S3Auth} from "../common/types";

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
        tusUpload.fileInfo.fileSize = fs.statSync(tusUpload.fileInfo.filePath!).size;
        tusUpload.fileInfo.fileStream = fs.createReadStream(tusUpload.fileInfo.filePath!);

        return this.doUpload(tusUpload);
    }

    /**
     *
     * Uploads a file from S3, referenced in the TusUpload obj
     *
     * @param s3TusUpload
     */
    stageS3File(s3TusUpload: S3TusUpload) : Promise<tus.Upload> {
        const bucket = s3TusUpload.s3Info.s3Location.s3Bucket;
        const key = s3TusUpload.s3Info.s3Location.s3Bucket!;

        return new Promise((resolve, reject) => {
            const requestReadablePromise = this.fetchS3(s3TusUpload.s3Info.s3Location.s3Url!);
            requestReadablePromise.then(requestReadable => {
               s3TusUpload.tusUpload.fileInfo.fileStream = requestReadable;
                this.doUpload(s3TusUpload.tusUpload).then(upload => {resolve(upload)});
            });
        });
    }

    fetchS3(s3Url: URL) : Promise<stream.Readable> {
        return new Promise<stream.Readable>(((resolve, reject) => {
            https.get(s3Url, (res: stream.Readable) => {
                resolve(res);
            });
        }));
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
            .then(tusUpload => {return FileUploader._insertFileName(tusUpload, tusUpload.fileInfo.fileName!)})
            .then(tusUpload => {return this._doUpload(tusUpload)});
    }

    _doUpload(tusUpload: TusUpload) : Promise<Upload>{
        return new Promise<Upload>((resolve, reject) => {
            // TODO: maintainers of tus-js-client need to add streams as an allowable type for tus file sources
            // @ts-ignore TODO: tus.io typescript maintainers need to allow Readable streams here
            const fileStream:Blob = tusUpload.fileInfo.fileStream!;

            let upload: Upload;

            upload = new tus.Upload(fileStream, {
                endpoint: tusUpload.uploadUrl!,
                retryDelays: [0, 1000, 3000, 5000],
                // @ts-ignore: TODO: tus-js-client typescript not being maintained
                metadata: tusUpload.metadataToDict(),
                chunkSize: 100000,
                uploadSize: tusUpload.fileInfo.fileSize,
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

    static _insertFileName(tusUpload: TusUpload, fileName: string) : Promise<TusUpload> {
        return Promise.resolve(tusUpload.addFileName(fileName));
    }

    _getToken() : Promise<string> {
        return this.tokenManager.getToken();
    }

    _awsConfigFromS3AuthInfo(s3Auth: S3Auth) : AWS.Config {
        const config: AWS.Config = new Config();

        config.update({
            credentials: FileUploader._awsCredentialsFromSessionToken(s3Auth.accessKeyId, s3Auth.secret!),
            region: "us-east-1"
        });

        return config;
    }

    static _awsCredentialsFromSessionToken(accessKeyId: string, securityToken: string) : AWS.Credentials {
        return new Credentials({
            accessKeyId: accessKeyId!,
            sessionToken: securityToken,
            secretAccessKey: ""
        });
    }

    _aws_config() : AWS.Config {
        const accessKeyId: string = configuration.get("AUTH.s3.accessKeyId");
        const accessKeySecret: string = configuration.get("AUTH.s3.accessKeySecret");
        const config: AWS.Config = new Config();

        config.update({
            credentials: new Credentials(accessKeyId, accessKeySecret),
            region: "us-east-1"
        });

        return config;
    }
}

export default FileUploader;