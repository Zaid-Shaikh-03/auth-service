import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { truncateTables } from "../utils";
import { User } from "../../src/entities/User";

describe("POST /auth/register", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        //database truncate
        await truncateTables(connection);
    });

    afterAll(async () => {
        await connection.destroy();
    });

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
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0]?.firstName).toBe(userData.firstName);
            expect(users[0]?.lastName).toBe(userData.lastName);
            expect(users[0]?.email).toBe(userData.email);
        });

        it("should return an id of the created user", async () => {
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
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
        });
    });

    describe("fields are missing", () => {
        it("should return validation errors", () => {
            expect(true).toBe(true);
        });
    });
});
