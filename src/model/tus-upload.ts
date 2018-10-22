import {key} from "../../node_modules/aws-sdk/clients/signer";

type TusMetadata = {key: string, value: string | number | boolean}

class TusUpload {
    fileName?: string
    filePath?: string;
    uploadUrl?: string;
    metadata: TusMetadata[];
    chunkSize?: number;
    fileStream?: Buffer;

    constructor() {
        this.metadata = [];
    }

    /**
     * The JWT token should get added to metadata as the parameter for the "jwtToken"
     */
    addToken(jwtToken: string) : TusUpload {
        this.metadata.push(TusUpload.metadataPair("jwtToken", jwtToken));
        return this;
    }

    addSubmission(submission: string) : TusUpload {
        this.metadata.push(TusUpload.metadataPair("submission", submission));
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