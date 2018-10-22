import TokenManager from "./token-manager";
import ITokenClient from "./token-client";
import AapTokenClient from "./aap-token-client";

describe("Token manager tests", () => {
    test("it should retrieve a token on initial getToken()", () => {
        const x:string = "hello";

        let tokenClient: ITokenClient = new AapTokenClient();
        let tokenManager = new TokenManager();
    };
});