import {Fastq2BamConvertRequest, Fastq2BamParams} from "../common/types";
import Fastq2BamConverter from "./fastq-2-bam-converter";

describe("fastq-bam conversion tests", () => {

    const mockBaseDir = "/data/mockdir";
    const mockR1Name = "mockR1.fastq.gz";
    const mockR2Name = "mockR2.fastq.gz";
    const mockIndexName = "mockI.fastq.gz";
    const mockOutputName = "mock.output.bam";


    const mockR1Path = `${mockBaseDir}/${mockR1Name}`;
    const mockR2Path = `${mockBaseDir}/${mockR2Name}`;
    const mockIndexPath = `${mockBaseDir}/${mockIndexName}`;

    const convertRequest:Fastq2BamConvertRequest = {
        r1Path: mockR1Path,
        r2Path: mockR2Path,
        indexPath: mockIndexPath,
        outputName: mockOutputName
    };

    it("should generate correct input params for fastq-bam conversion", () => {
        const fastq2BamParams: Fastq2BamParams = Fastq2BamConverter.fastq2BamParamsFromConvertRequest(convertRequest);
        expect(fastq2BamParams.inputFastqs).toEqual({r1: mockR1Path, r2: mockR2Path, index: mockIndexPath});
        expect(fastq2BamParams.schema).toEqual("10xV2");
        expect(fastq2BamParams.outputBamFilename).toEqual(mockOutputName);
    });

    it("should generate correct run args for a convert request", () => {
        const fastq2BamArgs = Fastq2BamConverter.paramsToArgs(Fastq2BamConverter.fastq2BamParamsFromConvertRequest(convertRequest));
        const fastq2BamArgsString = fastq2BamArgs.join(" ");

        expect(fastq2BamArgsString).toContain("-s 10xV2");
        expect(fastq2BamArgsString).toContain(`-b ${mockOutputName}`);

        expect(fastq2BamArgsString).toContain(`-1 ${mockR1Path}`);
        expect(fastq2BamArgsString).toContain(`-2 ${mockR2Path}`);
        expect(fastq2BamArgsString).toContain(`-3 ${mockIndexPath}`);

    })
});