import { getDatabaseSsl } from "../../src/config/data-source";

describe("getDatabaseSsl", () => {
    it("disables SSL for localhost", () => {
        expect(getDatabaseSsl("localhost")).toBe(false);
        expect(getDatabaseSsl("127.0.0.1")).toBe(false);
    });

    it("enables non-verifying SSL for remote databases", () => {
        expect(getDatabaseSsl("db.example.com")).toEqual({
            rejectUnauthorized: false,
        });
    });
});
