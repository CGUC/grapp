const nodemailer = require('nodemailer');
const crypto = require('crypto');

const config = require('../config/options');

const url = 'https://www.skybunk.xyz';


module.exports = {
	sendPasswordResetEmail(user, email){
		return new Promise((res, rej) => {
			const token = crypto.randomBytes(20).toString('hex');

			var mailOptions;
			if(user.info.email == undefined || user.info.email == ''){ //send email to webmasters and tell them to verify the password reset was requested
				mailOptions = {
					to: config.webmasterEmail,
					subject: `Skybunk Password Reset for ${user.firstName} ${user.lastName}`,
					text:
					`You are receiving this because ${user.firstName} ${user.lastName}  has requested the reset of the password for your Skybunk account. `
					+ `They do not have a registered email address, so the password reset request must be manually verified.\n\n`
					+ `Please manually verify ${user.firstName} requested this reset. If they did, forward this email to ${email}\n\n\n`
					+ '-------------------------\n\n'
					+ 'You are receiving this because you have requested the reset of the password for your Skybunk account.\n\n'
					+ 'Please click on the following link, or paste this into your browser to complete the process within two days of receiving it:\n\n'
					+ `${url}/users/reset/${user._id}/${token}\n\n`
					+ `Username: ${user.username}\n\n`
					+ 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
				};

				user.resetPasswordExpiration = Date.now() + 48*60*60*1000; //48 hours from now
			}else{
				mailOptions = {
					to: user.info.email,
					subject: 'Skybunk Password Reset',
					text:
					'You are receiving this because you have requested the reset of the password for your Skybunk account.\n\n'
					+ 'Please click on the following link, or paste this into your browser to complete the process within two hours of receiving it:\n\n'
					+ `${url}/users/reset/${user._id}/${token}\n\n`
					+ `Username: ${user.username}\n\n`
					+ 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
				};

				user.resetPasswordExpiration = Date.now() + 2*60*60*1000; //2 hours from now
			}

			const transporter = nodemailer.createTransport({
				service:'gmail',
				auth: config.skybunkEmail
			});

			user.resetPasswordToken = token;

			user.update(user);

			transporter.sendMail(mailOptions, (err, response) => {
			if (err) {
				console.error(err);
				rej(err);
			} else {
				res('Successfully sent email');
			}
			});
		});
	},
}