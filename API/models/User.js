const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	firstName: {
		type: String,
		required: true
	},
	lastName: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	username: {
		type: String,
		required: true,
		unique: true,
		dropDups: true
	},
	profilePicture: {
		type: Buffer
	},
	subscribedChannels: [{
		type: Schema.Types.ObjectId,
		ref: 'Channel'
	}]
});

// Create a new user
UserSchema.statics.create = function(user) {
	return new Promise((resolve, reject) => {
		const newUser = new this(user);
		// Encrypt the password and save
		newUser.changePassword(newUser.password).then(saltedPassword => {
			resolve(newUser);
		}).catch(err => {
			reject(err);
		})
	});
 };

// Authenticate user
UserSchema.statics.authenticate = function(username, password) {
	return new Promise((resolve, reject) => {
		this.findOne({
			username: username,
		}).then(user => {
			if(!user) {
				reject({message: 'Username does not exist'});
			}

			// Match password
			bcrypt.compare(password, user.password, (err, isMatch) => {
				if(err) throw err;
				if (isMatch) {
					resolve(user);
				}
				else {
					reject({message: 'Password is incorrect'});
				}
			});
		});
	});
}

// Update a user
UserSchema.methods.update = function(updatedUserData) {
	return new Promise((resolve, reject) => {
		this.firstName = updatedUserData.firstName;
		this.lastName = updatedUserData.lastName;
		this.username = updatedUserData.username;
		this.profilePicture = updatedUserData.profilePicture;
		this.subscribedChannels = updatedUserData.subscribedChannels;

		this.save().then(user => {
			 resolve(user);
		})
		.catch(err => {
			reject(err);
		});
	});
};

// Change a users password
UserSchema.methods.changePassword = function(newPassword) {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(newPassword, salt, (err, hash) => {
				if (err) {
					reject(err);
				}
				else {
					this.password = hash;
					this.save().then(user => {
						 resolve(hash);
					})
					.catch(err => {
						reject(err);
					});
				}
			});
		});
	});
};

mongoose.model('User', UserSchema);