import { checkSchema } from "express-validator";

export default checkSchema({
    // firstName: {
    //     errorMessage: "First Name is required",
    //     isEmpty: true,
    // },
    // lastName: {
    //     errorMessage: "Last Name is required",
    //     isEmpty: true,
    // },
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
    },
    // password: {
    //     isLength: {
    //         options: { min: 8 },
    //         errorMessage: "Password should be at least 8 chars",
    //     },
    // },
});

// export default [
//     body("email").notEmpty().withMessage("email is required"),
//     body("firstName").notEmpty().withMessage("firstName is required"),
//     body("lastName").notEmpty().withMessage("lastName is required"),
//     body("password").notEmpty().withMessage("password is required"),
// ];
