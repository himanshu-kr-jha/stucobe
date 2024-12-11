const mongoose = require('mongoose');
const Society = require('./society');
const { Schema, model } = mongoose;

const SocietyAdminSchema = new Schema({
    societyAdmin:{ 
        type: Schema.Types.ObjectId, ref: 'User', required: true 
    },
    society:{
        type: Schema.Types.ObjectId, ref: 'Society', required: true 
    }

});

const SocietyAdmin = model('SocietyAdmin', SocietyAdminSchema);

module.exports = SocietyAdmin;

