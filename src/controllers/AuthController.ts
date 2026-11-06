import fs from "fs";
import path from "path";
import { NextFunction, Response } from "express";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload, sign } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Config } from "../config";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entities/RefreshToken";
import { CredentialService } from "../services/CredentialService";
import { User } from "../entities/User";

type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export const loadPrivateKey = (configuredKey?: string): string | Buffer => {
    try {
        return (
            configuredKey ??
            fs.readFileSync(path.join(__dirname, "../../certs/private.pem"))
        );
    } catch {
        throw createHttpError(500, "Error while reading private key");
    }
};

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private credentialService: CredentialService,
    ) {}

    private getPrivateKey(): string | Buffer {
        return loadPrivateKey(Config.PRIVATE_KEY);
    }

    private async createTokens(user: User): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: String(user.id),
            role: user.role,
        };
        const accessToken = sign(payload, this.getPrivateKey(), {
            algorithm: "RS256",
            expiresIn: "1h",
            issuer: "auth-service",
        });
        const refreshTokenRepository =
            AppDataSource.getRepository(RefreshToken);
        const newRefreshToken = await refreshTokenRepository.save({
            user,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: "1y",
            issuer: "auth-service",
            jwtid: String(newRefreshToken.id),
        });
        return { accessToken, refreshToken };
    }

    private sendAuthCookies(res: Response, tokens: AuthTokens): void {
        res.cookie("accessToken", tokens.accessToken, {
            domain: "localhost",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
        });
        res.cookie("refreshToken", tokens.refreshToken, {
            domain: "localhost",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 60 * 365,
            httpOnly: true,
        });
    }

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, password } = req.body;
        this.logger.debug("New request to register a user", {
            firstName,
            lastName,
            email,
            password: "*****",
        });
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });
            this.logger.info("User has been registered", { id: user.id });
            this.sendAuthCookies(res, await this.createTokens(user));
            res.status(201).json({
                id: user.id,
            });
        } catch (err) {
            next(err);
            return;
        }
    }

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { email, password } = req.body;
        this.logger.debug("request to login a user", {
            email,
            password: "*****",
        });

        try {
            const user = await this.userService.findbyEmail(email);

            if (!user) {
                const error = createHttpError(
                    400,
                    "Email and Password doesn't match",
                );
                next(error);
                return;
            }
            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            );

            if (!passwordMatch) {
                const error = createHttpError(
                    400,
                    "Email and Password doesn't match",
                );
                next(error);
                return;
            }

            this.sendAuthCookies(res, await this.createTokens(user));

            this.logger.info("User has been logged in", { id: user.id });
            res.status(200).json({
                id: user.id,
            });
        } catch (err) {
            next(err);
            return;
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findbyId(Number(req.auth.sub));
        res.status(200).json({ ...user, password: undefined });
    }
}
