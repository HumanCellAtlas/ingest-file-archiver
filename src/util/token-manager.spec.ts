import TokenManager from "./token-manager";
import ITokenClient from "./token-client";
import AapTokenClient from "./aap-token-client";
import Promise from "bluebird";

describe("Token manager tests", () => {
    const mockTokenClient: ITokenClient = new AapTokenClient({
        username: "blah",
        password: "blah"
    }, "http://mock-auth-url");
    const mockToken = "mocktoken";
    const mockToken2 = "mockToken2";

    test("it should retrieve a token on initial getToken()", () => {
        const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
        retrieveTokenMock.mockImplementation(() => {
            return Promise.resolve(mockToken)
        });

        const tokenManager = new TokenManager(mockTokenClient, 20 * 6 * 1000, 5 * 6 * 1000);

        return tokenManager.getToken().then(token => {
            expect(retrieveTokenMock).toBeCalledTimes(1);
            expect(token).toEqual(mockToken);
        });
    });

    test("it should cache a token", () => {
        const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
        retrieveTokenMock.mockImplementation(() => {
            return Promise.resolve(mockToken)
        });

        const tokenManager = new TokenManager(mockTokenClient, 20 * 6 * 1000, 5 * 6 * 1000);

        return tokenManager.getToken().then(() => {
            retrieveTokenMock.mockImplementation(() => {
                return Promise.resolve(mockToken2)
            });
            return tokenManager.getToken().then(token => {
                expect(token).toEqual(mockToken);
            });
        });
    });

    test("it should re-retrieve a token upon cache expiry", () => {
        const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
        retrieveTokenMock.mockImplementation(() => {
            return Promise.resolve(mockToken)
        });

        const tokenManager = new TokenManager(mockTokenClient, 1000, 500);
        return tokenManager.getToken()
            .then(() => {
                retrieveTokenMock.mockImplementation(() => {
                    return Promise.resolve(mockToken2);
                })
            })
            .then(() => {
                return Promise.delay(0)
            })
            .then(() => {
                return tokenManager.getToken()
            })
            .then(token => {
                expect(token).toEqual(mockToken);
                return Promise.resolve();
            }) // assert using cached token after 0ms delay
            .then(() => {
                return Promise.delay(600)
            })
            .then(() => {
                return tokenManager.getToken()
            })
            .then(token => {
                return expect(token).toEqual(mockToken2)
            }); // assert using re-retrieved after 2000ms delay
    });
});

