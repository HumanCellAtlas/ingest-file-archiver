import {BundleDownloadRequest} from "../common/types";
import BundleDownloader from "./bundle-downloader";

describe("bundle download tests", () => {
    it("should generate good args to the hca cli", () => {
        const mockBundleUuid = "deadbeef-dead-dead-dead-deaddeafbeef";
        const mockBundleReplica = "aws";
        const bundleDownloadRequest: BundleDownloadRequest = {
            bundleUuid: mockBundleUuid,
            cloudReplica: mockBundleReplica
        };

        const bundleDownloadParams = BundleDownloader._bundleDownloadParamsFromBundleDownloadRequest(bundleDownloadRequest);
        const bundleDownloadArgs = BundleDownloader._bundleDownloadArgsFromParams(bundleDownloadParams);
        const bundleDownloadArgsString = bundleDownloadArgs.join(" ");

        expect(bundleDownloadArgsString).toContain([`dss download --bundle-uuid ${mockBundleUuid} --replica ${mockBundleReplica}`]);
    })
});