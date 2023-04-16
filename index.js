import express from 'express'
import path from 'path'
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

mongoose.connect("mongodb://127.0.0.1:27017", {
    dbname: "backend",
})
    .then(() =>
        console.log("DataBase connected"))
    .catch(e => console.log(e) )

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String
});

const User = mongoose.model("User",userSchema)






const app = express();

app.use(express.static(path.join(path.resolve(), 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const isAuthenticate = async(req,res,next)=>{
    const {token} = req.cookies;
    if(token){
       const decoded = jwt.verify(token,"sjfdhkasjfssdd")
       req.user = await User.findById(decoded.id)
       next()
    }
    else{
        res.redirect('/login')
    }
}

app.get("/", isAuthenticate ,(req,res) => {
    res.render('logout.ejs',{name:req.user.name})
})
app.get("/register",(req,res) => {
    res.render('register.ejs')
})
app.get('/login',(req,res)=>{
    res.render('login.ejs')
})

app.post('/login',async(req,res)=>{
    const {email,password} = req.body;

    let user = await User.findOne({email})
    if(!user) return res.redirect('/register')
    const isMatched = bcrypt.compare(password,user.password);
    if(!isMatched) return res.render('login.ejs',{email,message:"Incorrect Password"})
    const token = jwt.sign({id:user._id},"sjfdhkasjfssdd")

    res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now() + 60*1000)
    })
    res.redirect('/')
})


app.post('/register',async (req,res)=>{
 
    const {name,email,password}= req.body
    
    let user  = await User.findOne({email})
    if(user){
        return res.redirect('/login')
        
    }
    const hashedPass = await bcrypt.hash(password,10)

      user = await User.create({
        name,
        email,
        password: hashedPass,
    })
    
    const token = jwt.sign({id:user._id},"sjfdhkasjfssdd")

    res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now() + 60*1000)
    })
    res.redirect('/')
})
app.get('/logout',(req,res)=>{
    res.cookie("token","",{
        expires: new Date(Date.now())
    })
    res.redirect('/')
})



app.listen(3000, () => {
    console.log("Server is working")
})