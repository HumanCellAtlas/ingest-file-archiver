import * as stream from "stream";

type TusMetadata = {key: string, value: string | number | boolean}

class TusUpload {
    fileName?: string
    filePath?: string;
    uploadUrl?: string;
    metadata: TusMetadata[];
    chunkSize?: number;
    fileStream?: stream.Readable;
    submission?: string;
    s3Bucket? : string;
    s3Key? : string;
    s3Url?: URL;

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

    setS3Url(s3Url: URL) {
        this.s3Url = s3Url;
        const s3Object = TusUpload._s3BucketAndKeyFromS3url(s3Url);
        this.s3Bucket = s3Object.bucket;
        this.s3Key = s3Object.key;
    }

    static _s3BucketAndKeyFromS3url(s3Url: URL) : {bucket: string, key: string }{
        return {
          bucket: s3Url.host,
          key: s3Url.href
        };
    }

    static metadataPair(k: string, v: string | number | boolean) : TusMetadata {
        return {key: k, value: v};
    }




}
export default TusUpload;