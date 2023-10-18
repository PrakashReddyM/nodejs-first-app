import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from 'jsonwebtoken'
import { decode } from "punycode";
import bcrypt from 'bcrypt'

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then((c) => console.log("database connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password:String,
});

const User = mongoose.model("User", userSchema);

const app = express();

//using middelwares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

//seting up view engine
app.set("view engine", "ejs");

const isAuthenticated =async (req,res,next)=> {
  const {token} = req.cookies;
  if(token){
    const decoded = jwt.verify(token,"dasfkldsfkdsf")
    req.user = await User.findById(decoded.__id)
    next()
  }
  else{
    res.redirect('/login')
  }
}

app.get("/",isAuthenticated, (req, res) => {
  console.log(req.user)
  res.render("logout",{name:req.user.name});
});

app.post("/login",async (req, res) => {
  const {email,password} = req.body;
  let user = await User.findOne({email})

  if(!user) return res.redirect('/register');

  const isMatch = user.password === password;

  if(!isMatch) return res.render('login',{message:"incorrect Password"})

  const token = jwt.sign({__id:user._id},"dasfkldsfkdsf")

  res.cookie("token",token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");

});

app.get('/login',(req,res)=> {
  res.render('login')
})

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render('register')
});

app.post("/register",async (req, res) => {
  const {name,email,password} = req.body;

  let user = await User.findOne({email})
  if(user){
    return res.redirect('/login')
  }
  const hassedPassword = await bcrypt.hash(password,10)


  user  = await User.create({
    name,
    email,
    hassedPassword,
  })

  const token = jwt.sign({__id:user._id},"dasfkldsfkdsf")

  res.cookie("token",token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});




app.listen(5000, () => {
  console.log("Server is working");
});
