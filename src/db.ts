import mongoose, { Mongoose, Schema, model } from "mongoose";

mongoose.connect('mongodb://localhost:27017/second-brain')
.then(res=>{
    console.log('Connected to db!')
})
.catch(err => {
    console.log(err, '  some error ')
})


const UserSchema = new Schema({
    username: {
        type: String,
        unique: true
    },
    password: String
})
export const UserModel = model('User',UserSchema)


const TagSchema = new Schema({
    title: String
})
export const TagModel = model("Tag",TagSchema)


const ContentSchema = new Schema({
    title: String,
    link: String,
    type: String,
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },  // foreign key from user table
})
export const ContentModel = model("Content",ContentSchema)


const LinkSchema = new Schema({
    hash: String,
    userId: {type: mongoose.Types.ObjectId, ref: "User", required: true}
})
export const LinkModel = model("Link",LinkSchema)