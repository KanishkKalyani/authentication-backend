const jwt = require("jsonwebtoken");
const _ = require("lodash");
const nodemailer = require("nodemailer");
const User = require("../models/users.model");
const Logger = require("../utils/logger");

const AuthLogger = new Logger("auth");

const transport = nodemailer.createTransport({
	host: "smtp.mailtrap.io",
	port: 2525,
	auth: {
		user: "9b6f0422a21ad5",
		pass: "d9a39652a8a56d",
	},
});

// const transport = nodemailer.createTransport({
// 	service: "gmail",
// 	auth: {
// 		user: process.env.SEND_EMAIL_ID,
// 		pass: process.env.SEND_EMAIL_PASSWORD,
// 	},
// });

exports.signUp = (req, res) => {
	const { name, email, password } = req.body;

	User.findOne({ email }).exec((err, user) => {
		if (err) {
			return res.status(400).json({
				error: "Something went wrong",
			});
		}

		if (user) {
			return res.status(400).json({
				error: "e-mail already exists",
			});
		}

		const token = jwt.sign(
			{ name, email, password },
			process.env.JWT_ACCOUNT_ACTIVATION,
			{ expiresIn: "10m" }
		);

		const activateLink = `${process.env.CLIENT_URL}/auth/activate/${token}`;

		const emailData = {
			to: [
				{
					address: email,
				},
			],
			from: {
				address: process.env.EMAIL_FROM,
				name: "MERN, AUTH",
			},
			subject: "Account Activation Link",
			html: `
		   <div>
		      <h1>Please Use the following Link to activate the Account</h1>

		      <a href="${activateLink}" target="_blank">
				CLICK TO ACTIVATE ACCOUNT
		      </a>

		      <hr/>

				<p>This e-mail may contain sensitive information</p>
				
				<p>Follow the link below to go back to our homepage</p>

		      <a href="${process.env.CLIENT_URL}" target="_blank">
		      KANBAN BOARD HOMEPAGE
		      </a>
		   </div>
		   `,
		};

		transport.sendMail(emailData, (err, __) => {
			if (err) {
				return res.status(400).json({
					error: err,
				});
			}

			res.json({
				message: `email has been successfully sent to ${email}. Follow the instructions in email to activate the account`,
			});
		});
	});
};

exports.activateAccount = (req, res) => {
	const { token } = req.body;

	if (token) {
		return jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, err => {
			if (err) {
				return res.status(401).json({
					error: "The link has expired",
				});
			}

			const { name, email, password } = jwt.decode(token);

			const newUser = new User({ name, email, password });

			User.findOne({ email }).exec((err, user) => {
				if (err) {
					return res.status(400).json({
						error: "Something went wrong.",
					});
				}
				if (user) {
					return res.status(400).json({
						error: "The account has already been activated.",
					});
				}

				newUser.save((err, __) => {
					if (err) {
						return res.status(400).json({
							error: "Something went wrong.",
						});
					}

					res.json({
						message: `Hey ${name}, welcome to the app!!!!!!!!!!`,
					});
				});
			});
		});
	}
	return res.status(401).json({
		error: "The token is invalid",
	});
};

exports.signIn = (req, res) => {
	const { email, password } = req.body;

	AuthLogger.setLogData(email);
	AuthLogger.info("Request Received at auth/sign-in", email);

	User.findOne({ email }).exec((err, user) => {
		if (err) {
			AuthLogger.error("Something went wrong");

			return res.status(400).json({
				error: "Something went wrong",
			});
		}

		if (!user) {
			AuthLogger.error("User with the specified email does not exist.");

			return res.status(400).json({
				error: "User with the specified email does not exist.",
			});
		}

		if (!user.authenticate(password)) {
			AuthLogger.error("Incorrect Password");

			return res.status(400).json({
				error: "Incorrect Password",
			});
		}

		const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		const { name, role, _id, email } = user;

		return res.json({
			token,
			user: {
				name,
				email,
				_id,
				role,
			},
			message: "Signed In Successfully",
		});
	});
};

exports.forgotPassword = (req, res) => {
	const { email } = req.body;

	User.findOne({ email }).exec((err, user) => {
		if (err) {
			return res.status(400).json({
				error: "Something went wrong",
			});
		}

		if (!user) {
			return res.status(400).json({
				error: "User with the specified email does not exist.",
			});
		}

		const token = jwt.sign(
			{ _id: user._id, name: user.name },
			process.env.JWT_RESET_PASSWORD,
			{
				expiresIn: "10m",
			}
		);

		const link = `${process.env.CLIENT_URL}/auth/password/reset/${token}`;

		const emailData = {
			from: process.env.EMAIL_FROM,
			to: email,
			subject: "Password Reset Link",
			html: `
            <h1>Please use the following link to reset password</h1>

            <a href="${link}" target="_blank">CLICK TO RESET PASSWORD</a>

            <p>This e-mail may contain sensitive information</p>

				<p>Follow the link below to go back to our homepage</p>

		      <a href="${process.env.CLIENT_URL}" target="_blank">
		      KANBAN BOARD HOMEPAGE
		      </a>
         `,
		};

		return user.updateOne({ resetPasswordLink: token }).exec((err, __) => {
			if (err) {
				return res.status(400).json({
					error: "There was an error in saving the Reset Password Link",
				});
			}

			transport
				.sendMail(emailData)
				.then(() => {
					return res.status(200).json({
						message: `Reset Password Link sent Successfully to ${email}`,
					});
				})
				.catch(err => {
					return res.status(200).json({
						message: "Error in sending the mail:" + err,
					});
				});
		});
	});
};

exports.resetPassword = (req, res) => {
	const { resetPasswordLink, newPassword } = req.body;

	if (resetPasswordLink) {
		return jwt.verify(
			resetPasswordLink,
			process.env.JWT_RESET_PASSWORD,
			err => {
				if (err) {
					return res.status(400).json({
						error: "Expired link. Try again.",
					});
				}

				User.findOne({ resetPasswordLink }).exec((err, user) => {
					if (err || !user) {
						return res.status(400).json({
							error: "Something went wrong. Try later",
						});
					}

					const updateFields = {
						password: newPassword,
						resetPasswordLink: "",
					};

					user = _.extend(user, updateFields);

					user.save(err => {
						if (err) {
							return res.status(400).json({
								error: "Error in resetting the password",
							});
						}

						return res.json({
							message: "Great! The password has been reset.",
						});
					});
				});
			}
		);
	}

	return res.status(400).json({
		error: "We have not received the reset password link",
	});
};

exports.allUsersSearch = (req, res) => {
	const { findStr } = req.params;

	User.find({ name: { $regex: findStr, $options: "i" } })
		.select({ name: 1, _id: 1 })
		.exec((err, users) => {
			if (err) {
				return res.status(400).json({
					error: `Something went wrong ${err}`,
				});
			}
			return res.json({ users: users });
		});
};
