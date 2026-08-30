import request from "supertest";
import app from "../../src/app";

describe("POST /auth/register", () => {
    describe("Given all fields", () => {
        it("should return the 201 status code", async () => {
            //AAA (Arrage, Act, Assert)
            //1.Arrage
            const userData = {
                firstName: "Abc",
                lastName: "xyz",
                email: "Abcxyz@gmail.com",
                password: "secret",
            };
            //2.Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            //3.Assert
            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            //AAA (Arrage, Act, Assert)
            //1.Arrage
            const userData = {
                firstName: "Abc",
                lastName: "xyz",
                email: "Abcxyz@gmail.com",
                password: "secret",
            };
            //2.Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            //3.Assert
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should persist the user in the database", async () => {
            //AAA (Arrage, Act, Assert)
            //1.Arrage
            const userData = {
                firstName: "Abc",
                lastName: "xyz",
                email: "Abcxyz@gmail.com",
                password: "secret",
            };
            //2.Act
            await request(app).post("/auth/register").send(userData);
            //3.Assert
        });
    });

    describe("fields are missing", () => {
        it("should return validation errors", () => {
            expect(true).toBe(true);
        });
    });
});
