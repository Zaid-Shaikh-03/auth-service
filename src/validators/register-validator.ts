import { checkSchema } from "express-validator";

export default checkSchema({
    firstName: {
        errorMessage: "First Name is required",
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: "Last Name is required",
        notEmpty: true,
        trim: true,
    },
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        trim: true,
    },
    password: {
        isLength: {
            options: { min: 6 },
            errorMessage: "Password should be at least 6 chars",
        },
        trim: true,
    },
});

// export default [
//     body("email").notEmpty().withMessage("email is required"),
//     body("firstName").notEmpty().withMessage("firstName is required"),
//     body("lastName").notEmpty().withMessage("lastName is required"),
//     body("password").notEmpty().withMessage("password is required"),
// ];
