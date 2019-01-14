import {Fastq2BamConvertRequest, Fastq2BamParams, FastqReadInfo} from "../common/types";
import {exec, spawn} from "child_process";
import Promise from "bluebird";
import R from "ramda";
import FileExistenceChecker from "./file-existence-checker";

class Fastq2BamConverter{
    fastq2BamPath: string;

    constructor(fastq2BamPath: string) {
        this.fastq2BamPath = fastq2BamPath;
    }

    convertFastq2Bam(convertRequest: Fastq2BamConvertRequest): Promise<number> {
        return Fastq2BamConverter._convertFastq2Bam(convertRequest, this.fastq2BamPath);
    }

    assertBam(convertRequest: Fastq2BamConvertRequest): Promise<number> {
        return Fastq2BamConverter._checkBamExists(convertRequest.outputDir, convertRequest.outputName)
            .then((itExists) => {
                    if(itExists) {
                        console.log(`.bam file with name ${convertRequest.outputName} already exists at ${convertRequest.outputDir}`);
                        return Promise.resolve(0);
                    } else {
                        console.log(`Doing bam conversion for ${(R.map((read) => read.fileName, convertRequest.reads)).join(" ")}`);
                        return Fastq2BamConverter._convertFastq2Bam(convertRequest, this.fastq2BamPath);
                    }
                });
    }

    static _checkBamExists(bamDir: string, bamName: string): Promise<boolean> {
        return FileExistenceChecker.fileExists(`${bamDir}/${bamName}`);
    }

    /**
     *
     * Performs a fastq-bam conversion, returns the result code in a process
     *
     * @param convertRequest
     * @param fastq2BamPath
     */
    static _convertFastq2Bam(convertRequest: Fastq2BamConvertRequest, fastq2BamPath: string) : Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const runParams: Fastq2BamParams = Fastq2BamConverter.fastq2BamParamsFromConvertRequest(convertRequest);
            const runArgs = Fastq2BamConverter.paramsToArgs(runParams);
            console.log("converter path: " + fastq2BamPath);
            console.log("working dir: " + convertRequest.outputDir);
            console.log("run args: " + runArgs.join(" "));
            console.log("cmd to run: " + fastq2BamPath +  " " + runArgs.join(" "));

            exec(fastq2BamPath +  " " + runArgs.join(" "),
                {cwd: convertRequest.outputDir},
                (Err, stdout, stderr) => {
                    if(Err) {
                        reject(Err);
                    } else {
                        resolve(0);
                    }
            });
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

    static inputFastqParams(readsInfo: FastqReadInfo[]): Fastq2BamParams["inputFastqs"] {
        const readFilesFilterFn = (readInfo: FastqReadInfo) => readInfo.readIndex.startsWith("read");
        const indexFilesFilterFn = (readInfo: FastqReadInfo) => readInfo.readIndex.startsWith("index");
        const sortByReadIndexFn = R.sortBy(R.prop("readIndex"));

        const sortedReadFastqs = sortByReadIndexFn(R.filter(readFilesFilterFn, readsInfo));
        const sortedIndexFastqs = sortByReadIndexFn(R.filter(indexFilesFilterFn, readsInfo));

        return R.map((fastqReadInfo) => fastqReadInfo.fileName, sortedReadFastqs.concat(sortedIndexFastqs));
    }

    static paramsToArgs(params: Fastq2BamParams): string[] {
        let runArgs: string[] = [];

        runArgs = runArgs.concat(["-s", params.schema]);
        runArgs = runArgs.concat(["-b", params.outputBamFilename]);

        // args for the input fastqs
        const inputFastqs: string[] = params.inputFastqs;
        const fastqArgNums: string[] = R.map(argNum => `-${String(argNum)}`, R.range(1, inputFastqs.length + 1));
        const argNumFastqPairs: string[][] = R.zip(fastqArgNums, inputFastqs);

        runArgs = runArgs.concat(
            R.reduce(
                (acc: string[] , item: string[]) => { return acc.concat(item)},
                [],
                argNumFastqPairs
            )
        );

        return runArgs;
    }

    static fastq2BamParamsFromConvertRequest(convertRequest: Fastq2BamConvertRequest): Fastq2BamParams {
        return {
            schema: Fastq2BamConverter.bamSchemaParams(convertRequest),
            outputBamFilename: convertRequest.outputName,
            inputFastqs: Fastq2BamConverter.inputFastqParams(convertRequest.reads)
        }
    }
}

export default Fastq2BamConverter;