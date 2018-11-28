/***
 *
 * Wrapper class around the hca command line tool for downloading bundles
 */

import Promise from "bluebird";
import {spawn} from "child_process";
import {BundleDownloadParams, BundleDownloadRequest} from "../common/types";

class BundleDownloader {
    hcaCliPath: string;

    constructor(hcaCliPath: string) {
        this.hcaCliPath = hcaCliPath;
    }

    downloadBundle(bundleDownloadRequest: BundleDownloadRequest): Promise<void> {
        return BundleDownloader._downloadBundle(this.hcaCliPath, bundleDownloadRequest);
    }

    static _downloadBundle(hcaCliPath: string, bundleDownloadRequest: BundleDownloadRequest) : Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const runParams: BundleDownloadParams = BundleDownloader._bundleDownloadParamsFromBundleDownloadRequest(bundleDownloadRequest);
            const runArgs = BundleDownloader._bundleDownloadArgsFromParams(runParams);

            const bundleDownloadProcess = spawn(hcaCliPath, runArgs);

            bundleDownloadProcess.on("exit", (code: number, signal: string) => {
                resolve();
            });

            bundleDownloadProcess.on("error", err => {
                reject(err);
            })
        });
    }

    static _bundleDownloadParamsFromBundleDownloadRequest(downloadRequest: BundleDownloadRequest): BundleDownloadParams {
        return {
            bundleUuid: downloadRequest.bundleUuid,
            replica: downloadRequest.cloudReplica
        }
    }

    static _dssDownloadArgs(): string[] {
        return ["dss", "download"];
    }

    static _bundleDownloadArgsFromParams(downloadParams: BundleDownloadParams) : string[] {
        const bundleUuid = downloadParams.bundleUuid;
        const replica = downloadParams.replica;
        return BundleDownloader._dssDownloadArgs().concat(["--bundle-uuid", bundleUuid, "--replica", replica]);
    }
}

export default BundleDownloader;