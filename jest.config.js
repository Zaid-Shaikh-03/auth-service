const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
    testEnvironment: "node",
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    testTimeout: 30000,
    transform: {
        ...tsJestTransformCfg,
    },
    transformIgnorePatterns: ["node_modules/(?!(jose|jwks-rsa))"],
    verbose: true,
};
