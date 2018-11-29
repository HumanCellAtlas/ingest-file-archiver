import * as stream from "stream";

namespace ts {

    /***
     *
     * describes how to convert fastqs into bams
     */
    export type ConversionMap = {
        inputs: FastqReadInfo[],
        outputName: string
    }

    export type Fastq2BamConvertRequest = {
        reads: FastqReadInfo[],
        outputName: string,
        outputDir: string;
    }

    export type FastqReadInfo = {
        readIndex: string,
        fileName: string
    }

    export type FileUploadMessage = {
        fileNames: string[],
        bundleUuid: string,
        submissionUrl: string,
        usiUrl: string,
        conversionMap? : ConversionMap
    }

    export type ConnectionProperties = {
        scheme: string,
        host: string,
        port: string
    }

    export type S3Location = {
        s3Bucket: string,
        s3Key: string,
        s3Url?: URL
    }

    export type S3Auth = {
        accessKeyId: string,
        secret?: string,
        sessionToken?: string
    }

    export type S3Info = {
        s3Location: S3Location,
        s3AuthInfo? : S3Auth
    }


    export type TusMetadata = {
        key: string,
        value: string | number | boolean
    }

    export type FileInfo = {
        fileName: string,
        filePath: string,
        fileSize?: number,
        fileStream?: stream.Readable
    }

    export type AAPCredentials = {
        username: string,
        password: string
    }

    export type TokenCache = {
        token?: string,
        tokenDurationMs: number,
        cachedTimeMs?: number,
        refreshPeriodMs: number
    }

    export type Fastq2BamParams = {
        schema: string,
        outputBamFilename: string,
        inputFastqs: string[]
    }

    export type BundleDownloadRequest = {
        bundleUuid: string,
        cloudReplica: "aws"| "gcp",
        bundleBaseDir: string,
        environment? : string
    }

    export type BundleDownloadParams = {
        bundleUuid: string,
        replica: string
    }
}

export = ts;