import Promise from "bluebird";
import {IHandler, AmqpMessage} from "./handler";
import FileUploader from "../../util/file-uploader";
import TusUpload from "../../model/tus-upload";
import url from "url";
import {ConversionMap, Fastq2BamConvertRequest, FileUploadMessage} from "../../common/types";
import Fastq2BamConverter from "../../util/fastq-2-bam-converter";
import R from "ramda";
import BundleDownloader from "../../util/bundle-downloader";
import {Upload} from "tus-js-client";

class LocalFileUploadHandler implements IHandler {
    fileUploader: FileUploader;
    fastq2BamConverter: Fastq2BamConverter;
    bundleDownloader: BundleDownloader;
    bundleDirBasePath: string;

    constructor(fileUploader: FileUploader, fastq2BamConverter: Fastq2BamConverter, bundleDownloader: BundleDownloader, bundleDirBasePath: string) {
        this.fileUploader = fileUploader;
        this.fastq2BamConverter = fastq2BamConverter;
        this.bundleDownloader = bundleDownloader;
        this.bundleDirBasePath = bundleDirBasePath;
    }

    handle(msg: AmqpMessage) : Promise<void> {
            return new Promise<void>((resolve, reject) => {
                LocalFileUploadHandler._parseAmqpMessage(msg)
                    .then((msgContent) => {return this.doLocalFileUpload(msgContent)});
            });
    }

    doLocalFileUpload(fileUploadMessage: FileUploadMessage): Promise<void>{
        return LocalFileUploadHandler._maybeDownloadBundle(fileUploadMessage, this.bundleDirBasePath, this.bundleDownloader)
            .then(() => { return LocalFileUploadHandler._maybeBamConvert(fileUploadMessage, this.bundleDirBasePath, this.fastq2BamConverter)})
            .then(() => { return LocalFileUploadHandler._upload(fileUploadMessage, this.fileUploader, this.bundleDirBasePath)})
            .then(() => { return Promise.resolve()});
    }

    static _parseAmqpMessage(msg: AmqpMessage) : Promise<FileUploadMessage> {
        try {
            return Promise.resolve(JSON.parse(msg.messageBytes) as FileUploadMessage);
        } catch (err) {
            console.error("Failed to parse message content (ignoring): " + msg.messageBytes);
            return Promise.reject(err);
        }
    }

    static _maybeDownloadBundle(fileUploadMessage: FileUploadMessage, fileDirBasePath: string, bundleDownloader: BundleDownloader): Promise<void> {
        return bundleDownloader.assertBundle(fileUploadMessage.bundleUuid, fileDirBasePath);
    }

    static _maybeBamConvert(fileUploadMessage: FileUploadMessage, fileDirBasePath: string, fastq2BamConverter: Fastq2BamConverter) : Promise<void> {
        if(! fileUploadMessage.conversionMap) {
            return Promise.resolve();
        } else {
            const bamConvertRequest = LocalFileUploadHandler._generateBamConvertRequest(fileUploadMessage.conversionMap!, `${fileDirBasePath}/${fileUploadMessage.bundleUuid}`);
            return LocalFileUploadHandler._doBamConversion(fastq2BamConverter, bamConvertRequest);
        }
    }

    static _doBamConversion(fastq2BamConverter: Fastq2BamConverter, bamConvertRequest: Fastq2BamConvertRequest) : Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fastq2BamConverter.convertFastq2Bam(bamConvertRequest)
                .then((exitCode: number) => {
                    if(exitCode ===  1) {
                        resolve();
                    } else {
                        console.error("ERROR: fastq2Bam converter returned non-successful error code: " + String(exitCode));
                        reject();
                    }
                })
        });
    }

    static _generateBamConvertRequest(uploadMessageConversionMap: ConversionMap, fileDirBasePath: string) : Fastq2BamConvertRequest {
        const inputsFastqs = uploadMessageConversionMap.inputs;
        const numInputFastqs: number = inputsFastqs.length;
        if(numInputFastqs > 3) {
            throw new Error(`ERROR: Bam conversion must have at most 3 input files, but ${numInputFastqs} found: ${String(uploadMessageConversionMap.inputs)}`)
        } else if(numInputFastqs < 2) {
            throw new Error(`ERROR: Bam conversion must have at least 2 input files, but ${numInputFastqs} found: ${String(uploadMessageConversionMap.inputs)}`)
        } else {
            return {
                r1Path: `${fileDirBasePath}/${inputsFastqs[0]}`,
                r2Path:  `${fileDirBasePath}/${inputsFastqs[1]}`,
                outputName:  `${fileDirBasePath}/${uploadMessageConversionMap.outputName}`,
                indexPath: (numInputFastqs === 3) ? `${fileDirBasePath}/${inputsFastqs[2]}` : undefined,
                outputDir: fileDirBasePath
            }
        }
    }

    static _upload(fileUploadMessage: FileUploadMessage, fileUploader: FileUploader, fileDirBasePath: string): Promise<Upload[]> {
        const tusUploads = LocalFileUploadHandler._uploadRequestsFromUploadMessage(fileUploadMessage, fileDirBasePath);
        const fn = (tusUpload: TusUpload) => fileUploader.stageLocalFile(tusUpload);
        const uploadPromises = R.map(fn, tusUploads);
        return Promise.all(uploadPromises);
    }

    static _uploadRequestsFromUploadMessage(uploadMessage: FileUploadMessage, fileDirBasePath: string) : TusUpload[] {
        const tusUploads: TusUpload[] = [];
        const uploadFileEndpoint = `${uploadMessage.usiUrl}/files`;

        for(let i = 0; i < uploadMessage.fileNames.length; i ++) {
            const fileName = uploadMessage.fileNames[i];
            const tusUpload = new TusUpload({fileName: fileName, filePath: `${fileDirBasePath}/${fileName}`}, uploadFileEndpoint);
            tusUpload.submission = LocalFileUploadHandler._submissionUuidFromSubmissionUri(new url.URL(uploadMessage.submissionUrl));
            tusUploads.push(tusUpload);
        }

        return tusUploads;
    }

    static _submissionUuidFromSubmissionUri(submissionUri: url.URL): string {
        const splitPath: string[] = submissionUri.pathname.split("/");
        return splitPath[splitPath.length - 1];
    }
}

export default LocalFileUploadHandler;