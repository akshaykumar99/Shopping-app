const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
// const sendgridTrasport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');
const Mailgen = require('mailgen');

const User = require('../models/user');

// const transporter = nodemailer.createTransport(sendgridTrasport({
// 	auth: {
// 		api_key: ''
// 	}
// }));

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
	  user: process.env.EMAIL,
	  pass: process.env.EPASS
	}
});

exports.getLogin = (req, res, next) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		errorMessage: message,
		oldInput: {
			email: '',
			password: '',
			confirmPassword: ''
		},
		validationErrors: []
	});
};

exports.getSignup = (req, res, next) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		errorMessage: message,
		oldInput: {
			email: '',
			password: '',
			confirmPassword: ''
		},
		validationErrors: []
	});
};

exports.postLogin = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/login', {
			path: '/login',
			pageTitle: 'login',
			errorMessage: errors.array()[0].msg,
			oldInput: {email: email, 
				password: password, 
			},
			validationErrors: errors.array()
		});
	}
	User.findOne({ email: email })
		.then(user => {
			if (!user) {
				return res.status(422).render('auth/login', {
					path: '/login',
					pageTitle: 'login',
					errorMessage: 'Invalid email or password.',
					oldInput: {email: email, 
						password: password, 
					},
					validationErrors: [{param: 'password'}, {param: 'email'}]
				});
			}
			bcrypt.compare(password, user.password)
				.then(doMatch => {
					if (doMatch) {
						req.session.isLoggedIn = true;
						req.session.user = user;
						return req.session.save((err) => {
							console.log(err);
							res.redirect('/');
						});
					}
					return res.status(422).render('auth/login', {
						path: '/login',
						pageTitle: 'login',
						errorMessage: 'Invalid email or password.',
						oldInput: {email: email, 
							password: password, 
						},
						validationErrors: [{param: 'email', param: 'password'}]
					});
				})
				.catch(err => {
					console.log(err);
					res.redirect('/login');
				})
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postSignup = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			errorMessage: errors.array()[0].msg,
			oldInput: {email: email, 
				password: password, 
				confirmPassword: req.body.confirmPassword
			},
			validationErrors: errors.array()
		});
	}
	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const user = new User({
				email: email,
				password: hashedPassword,
				cart: { item: [] }
			})
			return user.save();
		})
		.then(result => {
			res.redirect('/login');
			// return transporter.sendMail({
			// 	to: email,
			// 	from: 'deltacart@gmail.com@gmail.com',
			// 	subject: 'Signup successfull',
			// 	html: '<h1>You successfully signed up!</h1>'
			// });
			var mailOptions = {
				from: 'deltacart@test.com',
				to: email,
				subject: 'Signup successfull',
				html: `
					<b>Welcome to Deltacart Shopping App</b>
					<hr>
					<p>You successfully signed up!</p>
				`
			  };
			  
			return transporter.sendMail(mailOptions, function(error, info){
				if (error) {
				  console.log(error);
				} else {
				  console.log('Email sent: ' + info.response);
				}
			  });
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		})
};

exports.postLogout = (req, res, next) => {
	req.session.destroy((err) => {
		console.log(err);
		res.redirect('/');
	});
};

exports.getReset = (req, res, next) => {
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}
	res.render('auth/reset', {
		path: '/reset',
		pageTitle: 'Reset',
		errorMessage: message
	});
};

exports.postReset = (req, res, next) => {
	
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			return res.redirect('/reset');
		}
		const token = buffer.toString('hex');
		User.findOne({ email: req.body.email })
			.then(user => {
				if (!user) {
					req.flash('error', 'No account with that email found.');
					return res.redirect('/reset');
				}
				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 3600000;
				user.save();
				res.redirect('/');
				// return transporter.sendMail({
				// 	to: req.body.email,
				// 	from: 'deltacart@gmail.com',
				// 	subject: 'Password reset',
				// 	html: `
				// 		<p>You requested a password reset</p>
				// 		<p>Click this <a href="http://localhost:3000/reset/${token}>Link</a> to set a new password."></p>
				// 	`
				// });
				// console.log(process.env.APP_URL);
				var mailOptions = {
					from: 'deltacart@test.com',
					to: req.body.email,
					subject: 'Password reset',
					html: `
						<b> Deltacart Shopping App </b>
						<p>You requested a password reset</p>
						<hr>
						<p>Click this <a href="${process.env.APP_URL}/reset/${token}">Link</a> to set a new password.</p>
					`
				  };
				  
				return  transporter.sendMail(mailOptions, function(error, info){
					if (error) {
					  console.log(error);
					} else {
					  console.log('Email sent: ' + info.response);
					}
				  });
			})
			.catch(err => {
				const error = new Error(err);
				error.httpStatusCode = 500;
				return next(error);
			})
	})
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;
	User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
		.then(user => {
			let message = req.flash('error');
			if (message.length > 0) {
				message = message[0];
			} else {
				message = null;
			}
			res.render('auth/new-password', {
				path: '/new-password',
				pageTitle: 'New Password',
				errorMessage: message,
				userId: user._id.toString(),
				passwordToken: token
			});
		})
		.catch(err => {
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		})
};

exports.postNewPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const userId = req.body.userId;
	const errors = validationResult(req);
	const passwordToken = req.body.passwordToken;
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/new-password', {
			path: '/new-password',
			pageTitle: 'New- Password',
			errorMessage: errors.array()[0].msg,
			oldInput: { 
				password: newPassword, 
			},
			userId: userId,
			passwordToken: passwordToken,
			validationErrors: errors.array()
		});
	}
	let resetUser;

	User.findOne({
		resetToken: passwordToken,
		resetTokenExpiration: { $gt: Date.now() },
		_id: userId
	})
	.then(user => {
		resetUser = user;
		return bcrypt.hash(newPassword, 12);
	})
	.then(hashedPassword => {
		resetUser.password = hashedPassword;
		resetUser.resetToken = undefined;
		resetUser.resetTokenExpiration = undefined;
		return resetUser.save();
	})
	.then(result => {
		res.redirect('/login');
	})
	.catch(err => {
		const error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	})
};