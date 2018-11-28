import {Fastq2BamConvertRequest, Fastq2BamParams} from "../common/types";
import {spawn} from "child_process";
import Promise from "bluebird";

class Fastq2BamConverter{
    fastq2BamPath: string;

    constructor(fastq2BamPath: string) {
        this.fastq2BamPath = fastq2BamPath;
    }

    convertFastq2Bam(convertRequest: Fastq2BamConvertRequest) : Promise<number> {
        return this._convertFastq2Bam(convertRequest, this.fastq2BamPath);
    }

    /**
     *
     * Performs a fastq-bam conversion, returns the result code in a process
     *
     * @param convertRequest
     * @param fastq2BamPath
     */
    _convertFastq2Bam(convertRequest: Fastq2BamConvertRequest, fastq2BamPath: string) : Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const runParams: Fastq2BamParams = Fastq2BamConverter.fastq2BamParamsFromConvertRequest(convertRequest);
            const runArgs = Fastq2BamConverter.paramsToArgs(runParams);

            const fastq2BamProcess = spawn(fastq2BamPath, runArgs, {cwd: convertRequest.outputDir});

            fastq2BamProcess.on("exit", (code: number, signal: string) => {
                resolve(code);
            });

            fastq2BamProcess.on("error", err => {
                reject(err);
            })
        });
    }

    /**
     * Just assuming 10xV2 for now
     */
    static bamSchemaParams(convertRequest: Fastq2BamConvertRequest): string {
        return Fastq2BamConverter._10XV2Schema();
    }

    static _10XV2Schema(): string {
        return "10xV2";
    }

    static inputFastqParams(r1Path: string, r2Path: string, indexPath?: string): Fastq2BamParams["inputFastqs"] {
        return {
            r1: r1Path,
            r2: r2Path,
            index: indexPath
        }
    }

    static paramsToArgs(params: Fastq2BamParams): string[] {
        let runArgs: string[] = [];

        runArgs = runArgs.concat(["-s", params.schema]);
        runArgs = runArgs.concat(["-b", params.outputBamFilename]);

        if(params.inputFastqs.index) {
            runArgs = runArgs.concat(["-1", params.inputFastqs.r1, "-2", params.inputFastqs.r2, "-3", params.inputFastqs.index]);
        } else {
            runArgs = runArgs.concat(["-1", params.inputFastqs.r1, "-2", params.inputFastqs.r2]);
        }

        return runArgs;
    }

    static fastq2BamParamsFromConvertRequest(convertRequest: Fastq2BamConvertRequest): Fastq2BamParams {
        return {
            schema: Fastq2BamConverter.bamSchemaParams(convertRequest),
            outputBamFilename: convertRequest.outputName,
            inputFastqs: Fastq2BamConverter.inputFastqParams(convertRequest.r1Path, convertRequest.r2Path, convertRequest.indexPath)
        }
    }
}

export default Fastq2BamConverter;