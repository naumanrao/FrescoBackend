const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    admin:'Boolean',
    firstName: 'String',
    lastName : 'String',
    email: 'String',
    password: 'String',
    phoneNumber: 'Number',
    imageUrl: 'String',
});

const User = mongoose.model("users", UserSchema);
module.exports = User;