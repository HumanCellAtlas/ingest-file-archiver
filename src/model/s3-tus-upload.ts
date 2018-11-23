import TusUpload from "./tus-upload";

type S3Location = {s3Bucket: string, s3Key: string, s3Url?: URL}
export type S3Auth = {accessKeyId: string, secret?: string, sessionToken?: string}
export type S3Info = {s3Location: S3Location, s3AuthInfo? : S3Auth}

class S3TusUpload {
    s3Info: S3Info;
    tusUpload: TusUpload;

    constructor(s3Info:S3Info, tusUpload:TusUpload) {
        this.s3Info = s3Info;
        this.tusUpload = tusUpload;
    }

    static _s3LocationFromPresignedUrl(presignedUrl: URL) : S3Location {
        return {
            s3Url: presignedUrl,
            s3Bucket: S3TusUpload._s3BucketFromPresignedUrl(presignedUrl),
            s3Key: S3TusUpload._s3KeyFromPresignedUrl(presignedUrl)
        }
    }

    static _s3BucketFromPresignedUrl(presignedUrl: URL) : string {
        return presignedUrl.host.split(".")[0];
    }

    static _s3KeyFromPresignedUrl(presignedUrl: URL) : string {
        return presignedUrl.pathname.substr(1);
    }

    static _s3AuthFromPresignedUrl(presignedUrl: URL): S3Auth {
        return {
            accessKeyId: S3TusUpload._s3AccessKeyIdFromPresignedUrl(presignedUrl),
            secret: S3TusUpload._s3SessionTokenFromPresignedUrl(presignedUrl)
        }
    }

    static _s3AccessKeyIdFromPresignedUrl(presignedUrl: URL) : string {
        const accessKeyId = presignedUrl.searchParams.get("AWSAccessKeyId") || undefined;
        return accessKeyId!;
    }

    static _s3SessionTokenFromPresignedUrl(presignedUrl: URL): string {
        const sessionToken = presignedUrl.searchParams.get("x-amz-security-token") || undefined;

        return sessionToken!
    }
}

export {S3TusUpload};
