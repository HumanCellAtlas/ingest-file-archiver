import {Fastq2BamParams} from "../common/types";
import Fastq2BamConverter from "./fastq-2-bam-converter";

describe("fastq-bam conversion tests", () => {
    it("should generate correct input params for fastq-bam conversion", () => {

        const mockBaseDir = "/data/mockdir";
        const mockR1Name = "mockR1.fastq.gz";
        const mockR2Name = "mockR2.fastq.gz";
        const mockIndexName = "mockI.fastq.gz";


        const mockR1Path = `${mockBaseDir}/${mockR1Name}`;
        const mockR2Path = `${mockBaseDir}/${mockR2Name}`;
        const mockIndexPath = `${mockBaseDir}/${mockIndexName}`;



    });

    it();
});