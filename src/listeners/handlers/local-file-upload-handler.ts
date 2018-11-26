import Promise from "bluebird";
import {IHandler, AmqpMessage} from "./handler";
import FileUploader from "../../util/file-uploader";
import TusUpload from "../../model/tus-upload";
import url from "url";
import {Fastq2BamConvertRequest, FileUploadMessage} from "../../common/types";

class LocalFileUploadHandler implements IHandler {
    fileUploader: FileUploader;

    constructor(fileUploader: FileUploader, fastq2BamConverter: Fastq2BamConverter) {
        this.fileUploader = fileUploader;
    }

    handle(msg: AmqpMessage) : Promise<void> {
        try {
            const msgContent: FileUploadMessage = JSON.parse(msg.messageBytes);

            const tusUploadRequest  = LocalFileUploadHandler._uploadRequestFromUploadMessage(msgContent);
            return this.fileUploader.stageLocalFile(tusUploadRequest)
                .then(() => {return Promise.resolve()});
        } catch (err) {
            console.error("Failed to parse message content (ignoring): " + msg.messageBytes);
            return Promise.reject(err);
        }
    }

    doBamConversion(bamConvertRequest: Fastq2BamConvertRequest) : Promise<void> {

        return new Promise<void>(() => {});
    }

    static _uploadRequestFromUploadMessage(uploadMessage: FileUploadMessage) : TusUpload {
        const tusUpload = new TusUpload({fileName: uploadMessage.fileName}, uploadMessage.uploadUrl);

        tusUpload.setS3Url(new url.URL(uploadMessage.s3Url));
        tusUpload.submission = uploadMessage.submission;
        tusUpload.fileName = uploadMessage.fileName;

        return tusUpload;
    }
}

export default LocalFileUploadHandler;