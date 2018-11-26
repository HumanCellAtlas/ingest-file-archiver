import {Fastq2BamConvertRequest} from "../common/types";
import {spawn} from "child_process";
import Promise from "bluebird";

type Fastq2BamParams = {
    schema: string,
    outputBamFilename: string,
    inputFastqs: {
        r1: string,
        r2: string,
        index?: string
    }
}

const _10XV2 = "10xV2";

class Fastq2BamConverter{
    fastq2BamPath: string;

    constructor(fastq2BamPath: string) {
        this.fastq2BamPath = fastq2BamPath;
    }

    /**
     *
     * Performs a fastq-bam conversion, returns the result code in a process
     *
     * @param convertRequest
     * @param fastq2BamPath
     * @private
     */
    _convertFastq2Bam(convertRequest: Fastq2BamConvertRequest, fastq2BamPath: string) : Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const runParams: Fastq2BamParams = {
                schema: Fastq2BamConverter.bamSchemaParams(),
                outputBamFilename: convertRequest.outputName,
                inputFastqs: Fastq2BamConverter.inputFastqParams(convertRequest.r1Path, convertRequest.r2Path, convertRequest.indexPath)
            };
            const runArgs = Fastq2BamConverter.paramsToArgs(runParams);

            const fastq2BamProcess = spawn(fastq2BamPath, runArgs);

            fastq2BamProcess.on("exit", (code: number, signal: string) => {
                resolve(code);
            });

            fastq2BamProcess.on("error", err => {
                reject(err);
            })
        });
    }


    /**
     * Assuming 10xV2 for now
     */
    static bamSchemaParams(): string {
        return _10XV2;
    }

    static inputFastqParams(r1Path: string, r2Path: string, indexPath?: string): Fastq2BamParams["inputFastqs"] {
        return {
            r1: r1Path,
            r2: r2Path,
            index: indexPath
        }
    }

    static paramsToArgs(params: Fastq2BamParams): string[] {
        const runArgs: string[] = [];

        runArgs.concat(["-s", params.schema]);
        runArgs.concat(["-b", params.outputBamFilename]);

        if(params.inputFastqs.index) {
            runArgs.concat(["-1", params.inputFastqs.r1, "-2", params.inputFastqs.r2, "-3", params.inputFastqs.index]);
        } else {
            runArgs.concat(["-1", params.inputFastqs.r1, "-2", params.inputFastqs.r2]);
        }

        return runArgs;
    }

}