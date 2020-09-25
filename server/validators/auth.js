const { check } = require("express-validator");

const MIN = 6;

exports.userSignUpValidator = [
	check("name").not().isEmpty().withMessage("The name field is required"),
	check("email").isEmail().withMessage("Must be a valid e-mail"),
	check("password")
		.isLength({ min: MIN })
		.withMessage(`Password must be at least ${MIN} characters long`),
];

exports.userSignInValidator = [
	check("email").isEmail().withMessage("Must be a valid e-mail"),
	check("password")
		.isLength({ min: MIN })
		.withMessage(`Password must be at least ${MIN} characters long`),
];

exports.userForgotPasswordValidator = [
	check("email").isEmail().withMessage("Must be a valid e-mail"),
];

exports.userResetPasswordValidator = [
	check("newPassword")
		.isLength({ min: MIN })
		.withMessage(`Password must be at least ${MIN} characters long`),
];
