const express = require('express');
const { check, body } = require('express-validator');

const router = express.Router();

const authController = require('../controllers/auth');
const User = require('../models/user');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
		body('email')
			.isEmail()
			.withMessage('Please enter a valid email.')
			.normalizeEmail(),
		body('password', 'Please enter a valid password')
			.isLength({ min: 5 })
			.isAlphanumeric()
			.trim()
	], authController.postLogin
);

router.post('/signup', [
		check('email')
			.isEmail()
			.withMessage('Please enter a valid email.')
			.custom((value, {req}) => {
				return User.findOne({ email: value })
					.then(userDoc => {
						if (userDoc) {
							return Promise.reject(
								'Email exists already, please pick a different one!'
							);
						}
					});
			})
			.normalizeEmail(),
		body('password', 'Please enter a valid password with length more than 5 and only numbers and text')
			.isLength({ min: 5 })
			.isAlphanumeric()
			.trim(),
		body('confirmPassword')
			.trim()
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error('Password have to match!');
				}
				return true;
			})
	], authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', [
	body('password', 'Please enter a valid password with length more than 5 and only numbers and text')
		.isLength({ min: 5 })
		.isAlphanumeric()
		.trim()
	], authController.postNewPassword
);

module.exports = router;