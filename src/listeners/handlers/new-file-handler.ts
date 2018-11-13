import Promise from "bluebird";
import {IHandler, AmqpMessage} from "./handler";
import FileUploader from "../../util/file-uploader";
import TusUpload from "../../model/tus-upload";
import url from "url";

type FileUploadMessage = {s3Url: string, fileName: string, submission: string};

class NewFileHandler implements IHandler {
    fileUploader: FileUploader;

    constructor(fileUploader: FileUploader) {
        this.fileUploader = fileUploader;
    }

    handle(msg: AmqpMessage) : Promise<void> {
        try {
            const msgContent: FileUploadMessage = JSON.parse(msg.messageBytes);
            const tusUploadRequest  = NewFileHandler._uploadRequestFromUploadMessage(msgContent);
            return this.fileUploader.stageS3File(tusUploadRequest)
                .then(() => {return Promise.resolve()});
        } catch (err) {
            console.error("Failed to parse message content (ignoring): " + msg.messageBytes);
            return Promise.reject(err);
        }
    }

    static _uploadRequestFromUploadMessage(uploadMessage: FileUploadMessage) : TusUpload {
        const tusUpload = new TusUpload();

        tusUpload.setS3Url(new url.URL(uploadMessage.s3Url));
        tusUpload.submission = uploadMessage.submission;
        tusUpload.fileName = uploadMessage.fileName;

        return tusUpload;
    }
}

export default NewFileHandler;