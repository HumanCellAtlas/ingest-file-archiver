import * as stream from "stream";
import {FileInfo, TusMetadata} from "../common/types";

class TusUpload {
    fileInfo: FileInfo;
    uploadUrl: string;
    metadata: TusMetadata[];
    chunkSize?: number;
    submission?: string;

    constructor(fileInfo: FileInfo, uploadUrl: string) {
        this.fileInfo = fileInfo;
        this.uploadUrl = uploadUrl;
        this.metadata = [];
    }

    /**
     * The JWT token should get added to metadata as the parameter for the "jwtToken"
     */
    addToken(jwtToken: string) : TusUpload {
        this.metadata.push(TusUpload.metadataPair("jwtToken", `'${jwtToken}'`));
        return this;
    }

    addSubmission(submission: string) : TusUpload {
        this.metadata.push(TusUpload.metadataPair("submissionID", `'${submission}'`));
        return this;
    }

    addFileName(name: string) : TusUpload {
        this.metadata.push(TusUpload.metadataPair("name", name));
        return this;
    }

    metadataToDict() : any {
        const metadataDict: any = {};
        this.metadata.forEach(metadataPair => {metadataDict[metadataPair.key] = metadataPair.value});

        return metadataDict;
    }

    static metadataPair(k: string, v: string | number | boolean) : TusMetadata {
        return {key: k, value: v};
    }
}
export default TusUpload;