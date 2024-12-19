import express, { json, NextFunction, Request, Response } from "express"
import { ContentModel, LinkModel, TagModel, UserModel } from "./db"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken';
import { jwt_password } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";
import cors from "cors"
import { z } from "zod"
import mongoose from "mongoose";

const app = express()
const PORT = 3000

app.use(json())
app.use(cors())

app.get("/", (req, res) => {
    res.json({ msg: "Server is running" })
})

// we have not used try catch anywhere
app.post('/api/v1/signup', async (req, res) => {
    const requiredBody = z.object({
        username: z.string().min(3).max(20),
        password: z.string().min(3).max(20).refine(
            (password) => 
                /[A-Z]/.test(password) && // Alteast one upper case character
                /[a-z]/.test(password) && // Atleast one lower case character
                /[\W_]/.test(password) // Atleast one special character
            ,
            {
                message: "Password must include atleast one uppercase letter, one lowercase letter, and one special character."
            }
        )
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: "Incorrect Format",
            error: parsedDataWithSuccess.error
        })
        return
    }
    const { username, password } = req.body

    console.log(req.body)
    try {
        const user = await UserModel.findOne({ username })
        console.log(user, '    user !!!!!!!!!!')
        if (user) {
            res.status(401).json({ msg: "Username already exists" }) // apply proper status code in the end
        } else {
            // if new user
            // encrypt the password before saving
            const hashedPassword = await bcrypt.hash(password, 10)
            const newUser = new UserModel({
                username,
                password: hashedPassword
            })
            newUser.save()
            res.json({ msg: 'signup successful', status: 200 })
        }
    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }
})



app.post('/api/v1/signin', async (req, res) => {
    const requiredBody = z.object({
        username: z.string().min(3).max(20),
        password: z.string().min(3).max(20)
    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: "Invalid input"
        })
        return 
    }
    const { username, password } = req.body
    
    try {
        const existingUser = await UserModel.findOne({ username })
        if (!existingUser) {
            res.status(401).json({ msg: 'User does not exists' })
        } else {
            // decrypt the password and compare
            if (existingUser.password) {
                const isPasswordValid = await bcrypt.compare(password, existingUser.password)
                console.log(isPasswordValid, '  ispassword valid')
                if (!isPasswordValid) res.status(401).json({ msg: "Invalid Password" })
                else {
                    // how we will send the jwt token here
                    const token = jwt.sign({ id: existingUser._id }, jwt_password)
                    // i think this token need to be saved to db also so that we can validate when 
                    res.json({ msg: 'Signin successful!', token })
                }
            }
        }
    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }
})

app.post('/api/v1/tag', async (req, res) => {
    const requiredBody = z.object({
        title: z.string().max(100)
    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: "Invalid Input"
        })
        return
    }
    const { title } = req.body
    
    try {
        const existingTag = await TagModel.findOne({ title })
        if (existingTag) {
            res.json({ msg: 'tag already exists' })
        } else {
            const newTag = new TagModel({ title })
            newTag.save()
            res.json({ msg: 'new tag created' })
        }
    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }
})

// add-content
app.post('/api/v1/content', userMiddleware, async (req, res) => {
    const requiredBody = z.object({
        title: z.string().min(3).max(100),
        link: z.string(),
        type: z.string().min(3).max(30),
        userId: z.string()
        .refine((value) => mongoose.Types.ObjectId.isValid(value),
        {
            message: "Invalid ObjectId format",
        })
    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: "Invalid Input"
        })
        return
    }
    try {
        console.log(req.body, '  req.body  ')
        const newContent = new ContentModel({ ...req.body, userId: req.userId })
        await newContent.save();
        res.status(200).json({ msg: "New Content added" })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: "Something went wrong" })
    }
})

app.get('/api/v1/content', userMiddleware, async (req, res) => {
    
    try {
        const data = await ContentModel.find({ userId: req.userId })
        res.json(data)
    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }
})

app.delete('/api/v1/content/:contentId', userMiddleware, async (req, res) => {
    const id = req.params?.contentId
    try {
        const response = await ContentModel.findByIdAndDelete({ _id: id })
        console.log(response, '   response')
        res.json({ msg: 'Delete end point' })
    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }
})

app.patch('/api/v1/update-content/:contentId', userMiddleware, async (req, res) => {
    const { contentId: id } = req.params
    const content = await ContentModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
    )

    res.json({ msg: 'Update content end point' })
    try {

    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }
})


app.post('/api/v1/brain/share', userMiddleware, async (req, res) => {
    const requiredBody = z.object({share: z.boolean()})
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if(!parsedDataWithSuccess.success){
        res.status(400).json({message: "Invalid input"})
        return
    }
    const share = req.body.share

    try {
        if (share) {
            const existingLink = await LinkModel.findOne({ userId: req.userId })
            if (existingLink) {
                res.json({ hash: existingLink.hash })
            } else {
                const hash = random(10)
                await LinkModel.create({ hash: hash, userId: req.userId })
                res.json({ hash })
            }
        } else {
            await LinkModel.deleteOne({ userId: req.userId })
            res.json({ msg: "Deleted the shareable link" })
        }
    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }
})

app.get('/api/v1/brain/:shareLink', async (req, res) => {
    const hash = req.params.shareLink
    try {
        const linkExists = await LinkModel.findOne({ hash })
        if (linkExists) {
            const user = await UserModel.findOne({ _id: linkExists.userId })
            if (!user) {
                res.json({ msg: "User does not exists for this brain" })
                return;
            }
            const content = await ContentModel.find({ userId: linkExists.userId?.toString() })
            console.log(linkExists.userId?.toString(), content)
            res.json({
                username: user.username,
                content: content
            })
        } else {
            res.status(400).json({ msg: "Invalid link" })
        }
    } catch (error) {
        res.status(500).json({ msg: "Something went wrong" })
    }


})

app.all('*',(req,res,next) =>{
    res.status(404).json({
        status:'fail',
        message: `Can't find ${req.originalUrl} on the server!`
    })
})



app.listen(PORT, () => console.log(`server started at ${PORT}`))