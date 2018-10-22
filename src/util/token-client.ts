import Promise from "bluebird";

interface ITokenClient {
    retrieveToken() : Promise<string>
}

export default ITokenClient;