import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    userName:{
        required:true,
        type:String,
        minlength:3,
        maxlength:30,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    role:{
        type:String,
        enum:['customer', 'seller', 'deliveryPatner'],
        default:'customer'
    }
})
const User = mongoose.model('User', userSchema);
export default User;