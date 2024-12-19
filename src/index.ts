import express, { json } from "express"
import { ContentModel, LinkModel, TagModel, UserModel } from "./db"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken';
import { jwt_password } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";
import cors from "cors"

const app = express()
const PORT = 3000

app.use(json())
app.use(cors())

app.get("/",(req,res)=>{
    res.json({msg: "Server is running"})
})

// we have not used try catch anywhere
app.post('/api/v1/signup',async (req,res)=>{
    const { username, password } = req.body
    // server side validation 

    // main logic to signup
    // is username already exists ?
    console.log(req.body)
    
    const user = await UserModel.findOne({username})
    console.log(user,'    user !!!!!!!!!!')
    if(user){
        res.status(401).json({msg: "Username already exists"}) // apply proper status code in the end
    }else{
        // if new user
        // encrypt the password before saving
        const hashedPassword = await bcrypt.hash(password,10)
        const newUser = new UserModel({
            username,
            password: hashedPassword
        })
        newUser.save()
        res.json({msg: 'signup successful',status: 200})
    }
})



app.post('/api/v1/signin',async (req,res)=>{
    const { username, password } = req.body
    // server side validations of payload
    // main logic of signin
    // is username present ?
    const existingUser = await UserModel.findOne({username})
    if(!existingUser){
        res.status(401).json({msg: 'User does not exists'})
    }else{
        // decrypt the password and compare
        if(existingUser.password){
            const isPasswordValid = await bcrypt.compare(password,existingUser.password)
            console.log(isPasswordValid,'  ispassword valid')
            if(!isPasswordValid) res.status(401).json({msg: "Invalid Password"})
            else {
                // how we will send the jwt token here
                const token = jwt.sign({id: existingUser._id},jwt_password)
                // i think this token need to be saved to db also so that we can validate when 
                res.json({msg: 'Signin successful!',token })
            }
        }
    }
})

app.post('/api/v1/tag', async (req,res)=>{
    // create tag
    const { title } = req.body
    // payload validation
    
    // logic
    const existingTag = await TagModel.findOne({title})
    if(existingTag){
        res.json({msg: 'tag already exists'})
    }else{
        const newTag = new TagModel({title})
        newTag.save()
        res.json({msg: 'new tag created'})
    }
})

// add-content
app.post('/api/v1/content',userMiddleware,async (req,res)=>{
    try{
        console.log(req.body,'  req.body  ')
        const newContent = new ContentModel({...req.body,userId: req.userId})
        await newContent.save();
        res.status(200).json({msg: "New Content added"})
    }catch(error){
        console.log(error)
        res.status(400).json({msg: "Something went wrong"})
    }
})

app.get('/api/v1/content',userMiddleware,async (req,res) => {
    const data = await ContentModel.find({userId: req.userId})
    res.json(data)
})

app.delete('/api/v1/content/:contentId', userMiddleware,async (req,res)=>{
    const id = req.params?.contentId
    const response = await ContentModel.findByIdAndDelete({_id:id})
    console.log(response,   '   response')
    res.json({msg: 'Delete end point'}) 
})

app.patch('/api/v1/update-content/:contentId',userMiddleware, async (req,res) => {
    const { contentId: id } = req.params
    const content = await ContentModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
    )

    res.json({msg: 'Update content end point'})
})


app.post('/api/v1/brain/share',userMiddleware,async (req,res)=>{
    const share = req.body.share
    if(share){
        const existingLink = await LinkModel.findOne({userId: req.userId})
        if(existingLink){
            res.json({hash: existingLink.hash})
        }else{
            const hash = random(10)
            await LinkModel.create({hash: hash,userId: req.userId})
            res.json({hash})
        }
    }else{
        await LinkModel.deleteOne({userId: req.userId})
        res.json({msg:"Deleted the shareable link"})
    }
})
 
app.get('/api/v1/brain/:shareLink',async (req,res)=>{
    const hash = req.params.shareLink
    const linkExists = await LinkModel.findOne({hash})
    if(linkExists){
        const user = await UserModel.findOne({_id: linkExists.userId})
        if(!user){
            res.json({msg: "User does not exists for this brain"})
            return;
        }
        const content  = await ContentModel.find({userId: linkExists.userId?.toString()})
        console.log(linkExists.userId?.toString(), content )
        res.json({
            username: user.username,
            content : content
        })
    }else{
        res.status(400).json({msg: "Invalid link"})
    }

})


function filterOptions() {
//     const input = document.getElementById('search-input');
//     const filter = input.value.toLowerCase();
//        const dropdown = document.getElementById('dropdown-list');
//        const items = dropdown.getElementsByTagName('li');
//     dropdown.style.display = filter ? 'block' : 'none';
    
//     Array.from(items).forEach(item => {
//       const text = item.textContent || item.innerText;
//       item.style.display = text.toLowerCase().includes(filter) ? '' : 'none';
//       item.addEventListener('click',(e) => {
//         input.value = e.target.textContent;
//         dropdown.style.display = 'none'
//       })
        
//    });
   
}

app.listen(PORT,()=>console.log(`server started at ${PORT}`))