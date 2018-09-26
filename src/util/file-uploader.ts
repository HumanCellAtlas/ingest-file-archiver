var tus = require("tus-js-client");


/**
 *
 * Stages a File for archiving in the EBI using a tus.io client
 *
 */
class FileUploader {
    constructor(tokenManager) {
        this.tokenManager = tokenManager;
    }

    /**
     *
     * Given a TusUpload object, uploads the specified file
     */
    stageFile(tusUpload, submission) {

        this._getToken()
            .then(token => {return this._insertToken(tusUpload, token)})
            .then(tusUpload => {return FileUploader._insertSubmission(tusUpload, submission)})
            .then(tusUpload => {return this._doUpload(tusUpload)});
    }

    _doUpload(tusUpload) {
        const upload = new tus.Upload(tusUpload.filePath, {
            endpoint: tusUpload.uploadUrl,
            retryDelays: [0, 1000, 3000, 5000],
            metadata: tusUpload.metadata,
            onError: function(error) {
                console.log("Failed because: " + error)
            },
            onProgress: function(bytesUploaded, bytesTotal) {
                var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
                console.log(bytesUploaded, bytesTotal, percentage + "%")
            },
            onSuccess: function() {
                console.log("Download %s from %s", upload.file.name, upload.url)
            }
        });

        return Promise.resolve(upload.start());
    }

    stageS3File(s3FileLocatorObj) {
        return null; // TODO: do this
    }

    _insertToken(tusUpload, token) {
        return Promise.resolve(tusUpload.addToken(token));
    }

    _insertSubmission(tusUpload, submission) {
        return Promise.resolve(tusUpload.addSubmission(submission));
    }

    _getToken() {
        return this.tokenManager.getToken();
    }

}