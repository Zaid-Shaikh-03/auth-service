/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import fs from "fs";
import { Response } from "express";
import { validationResult } from "express-validator";
import {
    AuthController,
    loadPrivateKey,
} from "../../src/controllers/AuthController";
import { AppDataSource } from "../../src/config/data-source";
import { Roles } from "../../src/constants";
import { User } from "../../src/entities/User";

jest.mock("../../src/config/data-source", () => ({
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));
jest.mock("express-validator", () => ({
    validationResult: jest.fn(),
}));

describe("AuthController", () => {
    const mockedValidationResult = validationResult as unknown as jest.Mock;
    const user = {
        id: 1,
        firstName: "Abc",
        lastName: "xyz",
        email: "abc@example.com",
        password: "hashed-password",
        role: Roles.CUSTOMER,
    } as User;
    const logger = {
        debug: jest.fn(),
        info: jest.fn(),
    };
    const userService = {
        create: jest.fn(),
        findbyEmail: jest.fn(),
        findbyId: jest.fn(),
    };
    const credentialService = {
        comparePassword: jest.fn(),
    };
    const repository = {
        save: jest.fn(),
    };
    const response = () => {
        const res = {
            cookie: jest.fn(),
            json: jest.fn(),
            status: jest.fn(),
        };
        (res.status as jest.Mock).mockReturnValue(res);
        return { res, expressRes: res as unknown as Response };
    };
    const request = (body: Record<string, string>) =>
        ({ body }) as unknown as never;
    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedValidationResult.mockReturnValue({
            isEmpty: () => true,
            array: () => [],
        });
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(repository);
        repository.save.mockResolvedValue({ id: 2 });
        userService.create.mockResolvedValue(user);
        userService.findbyEmail.mockResolvedValue(user);
        userService.findbyId.mockResolvedValue(user);
        credentialService.comparePassword.mockResolvedValue(true);
    });

    it("registers a user and sets both auth cookies", async () => {
        const { res, expressRes } = response();
        const controller = new AuthController(
            userService as never,
            logger as never,
            credentialService as never,
        );

        await controller.register(
            request({
                firstName: "Abc",
                lastName: "xyz",
                email: "abc@example.com",
                password: "secret",
            }),
            expressRes,
            next,
        );

        expect(res.cookie).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: user.id });
        expect(next).not.toHaveBeenCalled();
    });

    it("returns validation errors without creating a user", async () => {
        const { res, expressRes } = response();
        const controller = new AuthController(
            userService as never,
            logger as never,
            credentialService as never,
        );
        mockedValidationResult.mockReturnValueOnce({
            isEmpty: () => false,
            array: () => [{ msg: "invalid" }],
        });

        await controller.register(request({}), expressRes, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(userService.create).not.toHaveBeenCalled();
    });

    it("rejects login when the user does not exist", async () => {
        const { expressRes } = response();
        userService.findbyEmail.mockResolvedValueOnce(undefined);
        const controller = new AuthController(
            userService as never,
            logger as never,
            credentialService as never,
        );

        await controller.login(
            request({ email: "missing@example.com", password: "secret" }),
            expressRes,
            next,
        );

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 400 }),
        );
    });

    it("rejects login when the password does not match", async () => {
        const { expressRes } = response();
        credentialService.comparePassword.mockResolvedValueOnce(false);
        const controller = new AuthController(
            userService as never,
            logger as never,
            credentialService as never,
        );

        await controller.login(
            request({ email: user.email, password: "wrong" }),
            expressRes,
            next,
        );

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 400 }),
        );
    });

    it("logs in a user and returns the user id", async () => {
        const { res, expressRes } = response();
        const controller = new AuthController(
            userService as never,
            logger as never,
            credentialService as never,
        );

        await controller.login(
            request({ email: user.email, password: "secret" }),
            expressRes,
            next,
        );

        expect(res.cookie).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ id: user.id });
    });

    it("passes token persistence errors to the error handler", async () => {
        const { expressRes } = response();
        const persistenceError = new Error("database unavailable");
        repository.save.mockRejectedValueOnce(persistenceError);
        const controller = new AuthController(
            userService as never,
            logger as never,
            credentialService as never,
        );

        await controller.login(
            request({ email: user.email, password: "secret" }),
            expressRes,
            next,
        );

        expect(next).toHaveBeenCalledWith(persistenceError);
    });

    it("returns the authenticated user without the password", async () => {
        const { res, expressRes } = response();
        const controller = new AuthController(
            userService as never,
            logger as never,
            credentialService as never,
        );

        await controller.self(
            { auth: { sub: String(user.id), role: Roles.CUSTOMER } } as never,
            expressRes,
        );

        expect(res.json).toHaveBeenCalledWith({ ...user, password: undefined });
    });

    it("loads a configured private key without reading the filesystem", () => {
        expect(loadPrivateKey("configured-key")).toBe("configured-key");
    });

    it("loads the private key from disk when configuration is absent", () => {
        const readFileSync = jest.spyOn(fs, "readFileSync");
        readFileSync.mockReturnValueOnce(Buffer.from("file-key"));

        expect(loadPrivateKey()).toEqual(Buffer.from("file-key"));
    });

    it("reports a private key read failure", () => {
        jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
            throw new Error("missing key");
        });

        expect(() => loadPrivateKey()).toThrow(
            "Error while reading private key",
        );
    });
});
