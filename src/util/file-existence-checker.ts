import Promise from "bluebird";
import {spawn} from "child_process";

class FileExistenceChecker {
    constructor() {

    }

    static fileExists(filePath: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const checkFileExistsProcess = spawn("ls", [filePath]);

            checkFileExistsProcess.on("exit", (code: number, signal: string) => {
                resolve(code == 0);
            });

           checkFileExistsProcess.on("error", err => {
                reject(err);
            });
        });
    }
}

export default FileExistenceChecker;