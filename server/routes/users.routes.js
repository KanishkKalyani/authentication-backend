const express = require("express");
const router = express.Router();
const {
	signUp,
	activateAccount,
	signIn,
	forgotPassword,
	resetPassword,
	allUsersSearch,
} = require("../controllers/users.controllers");

const {
	userSignUpValidator,
	userSignInValidator,
	userForgotPasswordValidator,
	userResetPasswordValidator,
} = require("../validators/auth");
const { runValidation } = require("../validators/index");

router.post("/sign-up", userSignUpValidator, runValidation, signUp);

router.post("/account-activation", activateAccount);

router.post("/sign-in", userSignInValidator, runValidation, signIn);

router.post(
	"/forgot-password",
	userForgotPasswordValidator,
	runValidation,
	forgotPassword
);

router.post(
	"/reset-password",
	userResetPasswordValidator,
	runValidation,
	resetPassword
);

router.get("/users-search/:findStr", allUsersSearch);

module.exports = router;
