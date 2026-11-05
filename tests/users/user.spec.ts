import request from "supertest";
import app from "../../src/app";
import createJWKSMock from "mock-jwks";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { Roles } from "../../src/constants";

describe("Get /auth/self", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
        await connection.synchronize(true);
    });

    beforeEach(async () => {
        jwks.start();
        await connection.query(
            'TRUNCATE TABLE "refresh_token", "user" RESTART IDENTITY CASCADE',
        );
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        if (connection?.isInitialized) {
            await connection.destroy();
        }
    });

    const userData = {
        firstName: "Abc",
        lastName: "xyz",
        email: "Abcxyz@gmail.com",
        password: "secret",
    };

    // const createUser = async () => {
    //     const userRepository = connection.getRepository(User);
    //     return await userRepository.save({
    //         ...userData,
    //         password: await bcrypt.hash(userData.password, 10),
    //         role: Roles.CUSTOMER,
    //     });
    // };

    describe("Given all fields", () => {
        it("should return the 200 status code", async () => {
            const userRepository = connection.getRepository(User);
            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            const accessToken = jwks.token({
                sub: String(user.id),
                role: Roles.CUSTOMER,
            });
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);
            expect(response.statusCode).toBe(200);
        });

        it("should return user data", async () => {
            //regiter user
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            //generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();

            expect((response.body as Record<string, string>).id).toBe(data.id);
        });

        it("should not return the password field", async () => {
            //regiter user
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            //generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();

            expect(response.body as Record<string, string>).not.toHaveProperty(
                "password",
            );
        });
    });

    describe("Invalid credentials", () => {});

    describe("Fields are missing", () => {});

    describe("Fields are not in proper format", () => {});
});
