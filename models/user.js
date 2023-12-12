const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
    },
    passwordHash: {
        type: String,
        require: true,
    },
    phone: {
        type: String,
        require: true,
    },
    isAdmin: {
        type: Boolean,
        deafult: false,
    },
    street: {
        type: String,
        deafult: '',
    },
    apartment: {
        type: String,
        deafult: '',
    },
    zip: {
        type: String,
        deafult: '',
    },
    city: {
        type: String,
        deafult: '',
    },
    country: {
        type: String,
        deafult: '',
    },
});

userSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);
