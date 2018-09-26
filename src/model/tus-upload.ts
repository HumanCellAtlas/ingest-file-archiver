class TusUpload {
    constructor() {
        this.filePath = null;
        this.uploadUrl = null;
        this.metadata = [];
        this.chunkSize = null;
    }

    /**
     * The JWT token should get added to metadata as the parameter for the "jwtToken"
     */
    addToken(jwtToken) {
        this.metadata.push({
            "jwtToken" : jwtToken
        });

        return this;
    }

    addSubmission(submission) {
        this.metadata.push({
            "submission": submission
        });

        return submission;
    }

}