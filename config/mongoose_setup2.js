// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var chainSchema = mongoose.Schema({

    local            : {
        color        : String,
        user_array  : Array
    }

});

// methods ======================
// generating a hash
// chainSchema.methods.generateHash = function(password) {
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// };

// // checking if password is valid
// chainSchema.methods.validPassword = function(password) {
//     return bcrypt.compareSync(password, this.local.password);
// };

// create the model for users and expose it to our app
module.exports = mongoose.model('Chain', chainSchema);
