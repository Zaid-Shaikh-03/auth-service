import bcrypt from "bcrypt";
import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { RefreshToken } from "../../src/entities/RefreshToken";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";

describe("POST /auth/login", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    const userData = {
        firstName: "Abc",
        lastName: "xyz",
        email: "Abcxyz@gmail.com",
        password: "secret",
    };

    const createUser = async () => {
        const userRepository = connection.getRepository(User);
        return await userRepository.save({
            ...userData,
            password: await bcrypt.hash(userData.password, 10),
            role: Roles.CUSTOMER,
        });
    };

    describe("Given all fields", () => {
        it("should return the 200 status code", async () => {
            await createUser();

            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            expect(response.statusCode).toBe(200);
        });

        it("should return valid json response", async () => {
            await createUser();

            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return an id of the logged-in user", async () => {
            const user = await createUser();

            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            expect(response.body).toHaveProperty("id", user.id);
        });

        it("should return the access token and refresh token inside a cookie", async () => {
            await createUser();

            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            interface CookieHeaders {
                ["set-cookie"]: string[];
            }

            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            const cookies =
                (response.headers as unknown as CookieHeaders)["set-cookie"] ||
                [];
            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0]?.split("=")[1] || null;
                }
                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0]?.split("=")[1] || null;
                }
            });

            expect(accessToken).not.toBe(null);
            expect(refreshToken).not.toBe(null);
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });

        it("should store the refresh token in the database", async () => {
            const user = await createUser();

            await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: user.id,
                })
                .getMany();

            expect(tokens).toHaveLength(1);
        });

        it("should trim the email field", async () => {
            await createUser();

            const response = await request(app)
                .post("/auth/login")
                .send({
                    email: ` ${userData.email} `,
                    password: userData.password,
                });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Invalid credentials", () => {
        it("should return 400 status code if email does not exist", async () => {
            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: userData.password,
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 status code if password is incorrect", async () => {
            await createUser();

            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: "incorrect",
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("Fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            await createUser();

            const response = await request(app).post("/auth/login").send({
                email: "",
                password: userData.password,
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 status code if password field is missing", async () => {
            await createUser();

            const response = await request(app).post("/auth/login").send({
                email: userData.email,
                password: "",
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("Fields are not in proper format", () => {
        it("should return 400 status code if email field is not valid email", async () => {
            const response = await request(app).post("/auth/login").send({
                email: "abcxyzgmail.com",
                password: userData.password,
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return an array of error messages if fields are missing", async () => {
            const response = await request(app).post("/auth/login").send({
                email: "",
                password: "",
            });
            const responseBody = response.body as { errors?: unknown };

            expect(response.statusCode).toBe(400);
            expect(responseBody.errors).toBeDefined();
            expect(responseBody.errors).toBeInstanceOf(Array);
        });
    });
});
