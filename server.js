// All depandencies
import express from "express";
import mongoose from "mongoose";
import _ from "lodash";
import fs from "fs";
import formidableMiddleware from "express-formidable";
import mongodb from "mongodb";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";


// variables
let show;
let pass;
let showPassword = false;
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const d = new Date();
const fullDate = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();

const mongoURI = "mongodb+srv://admin-joseph:olisa312@todolist.vkymokh.mongodb.net/todolistDB";
const app = express();

// Middlewares
app.use(formidableMiddleware());
app.use(express.static("public"));

// connect to database
mongoose.connect(mongoURI)
  .then(() => {
   console.log("Connected to DB successsfully.");
  }).catch((err) => {
   console.log("Failed to connect to database.");
  });

let gfs;

// All Schemas
const tasksSchema = new mongoose.Schema({
   task:{
      type: String,
      required: [true, "Please type in an item."]
   }
});

const profileImageSchema = new mongoose.Schema({
   filename: String,
});

const listSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, "The custom list should have a name."]
   },
   items: [tasksSchema]
});

const userSchema = new mongoose.Schema({
   email: {
      type: String,
      required: [true, `please enter an email address`]
   },
   username: {
      type: String,
      required: [true, "Enter a username"]
   },
   password: {
      type: String,
      required: [true, "please choose a password"]
   },
   task: [tasksSchema],
   list: [listSchema], 
   profileImage: profileImageSchema

});

// Creating task model
const Task = mongoose.model("Task", tasksSchema);

// Creating default tasks/items 
const task1 = new Task({
   task: "Welcome to your todolist!"
});

const task2 = new Task({
   task: "type in an item and hit the + button to add the item."
});

const task3 = new Task({
   task: "<---- Hit this to delete an item."
});

const defaultItems = [task1, task2, task3];

// Creating List and User models
const List = mongoose.model("list", listSchema);
const User = mongoose.model("user", userSchema);

// initializing conn variable and setting to our mongoose collection
const conn = mongoose.connection;

// setting up bucket/collection where user profile images will be stored
conn.once('open', () => {
   gfs = new mongoose.mongo.GridFSBucket(conn.db, {
     bucketName: 'uploads' 
   });
 });

// home route
// renders the home page and users can login and signup from this page
app.get("/", (req, res) => {
   res.render("index.ejs", {notification: " ", show: false});
});

// user homepage
// @params username
// renders the lists that the user currently has.
app.get("/:username", async (req, res) => {
   const username = req.params.username;
   const user = await User.findOne({username: username});
   if(user){
      if(user.task.length === 0){
         for(let i = 0; i < defaultItems.length; i++){
            user.task.push(defaultItems[i]);
         }
         await user.save();
         res.redirect(`/${user.username}`);  
      } else{
         res.render("lists.ejs", {lists: user.list, todaysTask: user.task, title: fullDate, user: user, pass: pass})
      }
   } else{
      res.redirect("/");
   }
   
});

// lists route
// @param username
// Adds tasks/items to specified list
app.post("/:username/add", async (req, res) => { 
   const username = req.params.username;
   const newTask = req.fields.newTask;
   const listName = req.fields.list;
   const user = await User.findOne({username: username});

   const task = new Task({
     task: newTask
   });

   if(listName === fullDate){
      user.task.push(task);
      await user.save();
      res.redirect(`/${user.username}`);
   } else{
      const found = user.list.find((list) => list.name === listName);
      found.items.push(task);
      await user.save();
      res.redirect(`/${user.username}/lists/${listName}`);
   }
   
});

// delete route
// @param uaername
// Deletes items/task from the specified list
app.post("/:username/delete", async (req,res) => {
   const username = req.params.username;
   const user = await User.findOne({username: username});
   const checkedTask = req.fields.checkbox;
   const listName = req.fields.list;

   if(listName === fullDate){
      const index = user.task.findIndex((task) => task._id.toString() === checkedTask);
      user.task.splice(index, 1);
      await user.save();
      res.redirect(`/${user.username}`);
   } else{
      const found = user.list.findIndex((listN) => listN.name === listName);
      if (user.list[found]) {
         // rest of your code...
         const itemIndex = user.list[found].items.findIndex((task) => task._id.toString() === checkedTask);
         user.list[found].items.splice(itemIndex, 1);
         await user.save();
         res.redirect(`/${user.username}/lists/${listName}`);
       } else {
         console.log('List not found');
       }

   }
});

// customList route
// @param uaername
// it will be called in the newList route
// Handles the custom list and renders the necessary information to 
// the user.
app.get("/:username/lists/:customListName", async (req, res) => {
   const username = req.params.username;
   const user = await User.findOne({username: username});
   const customListName = _.capitalize(req.params.customListName);

   if(customListName === "Favicon.ico"){
      res.redirect("/favicon.ico")
   }
   else{
      try {
         const list = user.list.find((listN) => listN.name === customListName);
     
         if (list) {
           const lists = user.list;
           res.render("lists.ejs", {lists: lists, todaysTask: list.items, title: list.name, user: user, pass: pass});
    
         } else {
           const newlist = new List({
             name: customListName,
             items: defaultItems
           });
           user.list.push(newlist);
           await user.save();
           res.redirect(`/${user.username}/lists/${customListName}`);
         }
     
       } catch (err) {
         // Handle any errors that may occur during the query.
         console.log(err);
         res.status(500).send("Internal server error");
       }
   }
   
 });
 
 // newList route
 // @params username
 // the name of the custom list will be submitted here
 // if list name is "today" or "" it returns the Today list
app.post("/:username/newList", (req, res) =>{
    const username = req.params.username;
    const newListName = _.capitalize(req.fields.newList);
    if(newListName === "Today" || newListName === ""){
      res.redirect(`/${username}`)
    }
    else{
      res.redirect(`/${username}/lists/${newListName}`);
    }
    
});

// deleteList route
// @param username
// Delete custom list that was created by user
app.post("/:username/deleteList", async (req,res) => {
   const username = req.params.username;
   const user = await User.findOne({username: username});
   const listName = req.fields.listName;
   const index = user.list.findIndex((list) => list.name === listName);
   user.list.splice(index, 1);
   await user.save();
   res.redirect(`/${user.username}`);
});


// Signup route
// allow users to sign up to listMate
// stores all info in mongodb database
app.post("/signup", async (req, res) => {
   const profile = req.files.profileImage;
   const password = req.fields.password;
   const confirm = req.fields.confirm_password;
   const confirmUsername = req.fields.username;
   pass = password;
   
   const userCheck  = await User.findOne({username: confirmUsername });
   if(userCheck){
      res.render("index.ejs", {notification: "Username already taken", show: show});
      res.redirect("/");
   }
   else{
      if(password === confirm){
         // Encrypting user password. Hashing password with bycrypt
         const hash = await bcrypt.hash(password, 15);

         if(profile.name !== ""){
                     // giving profile picture a unique name
            const buf = crypto.randomBytes(16);
            const filePath = buf.toString('hex') + path.extname(profile.name);


            const readStream = fs.createReadStream(profile.path);
         
            const uploadStream = gfs.openUploadStream(filePath, {
                  chunkSizeBytes: 1048576,
                  metadata:{
                     name: profile.name,
                     size: profile.size, 
                     type: profile.type
                  }
            });
            
            readStream.pipe(uploadStream);
      
             const newUser = new User({
               username: req.fields.username,
               email: req.fields.email,
               password: hash,
               isLoggedIn: true,
               profileImage: {
                  filename: filePath,
               }
            });
            await newUser.save();
            uploadStream.on("finish", () => {
               res.redirect(`/${confirmUsername}`);
            });
            
         }
         else{
            const newUser = new User({
               username: req.fields.username,
               email: req.fields.email,
               password: hash,
               isLoggedIn: true,
               profileImage: {
                  filename: "default",
               }
            });
            await newUser.save();
            res.redirect(`/${confirmUsername}`);
         }
      } 
      else{
         console.log("please make sure that that confirm password is the same as the password");
         res.redirect("/");
      } 
   } 
});

// Login route
// Users with accounts can log in htrough this route
// Performs a check to see if user with the given username and password exists in the database
app.post("/login", async (req,res) => {
   const username = req.fields.username;
   const password = req.fields.password;
   pass = password;
   const user = await User.findOne({username: username});
   if(user){
      const isMatch = await bcrypt.hash(password, user.password);
      if(isMatch){
         res.redirect(`/${user.username}`);
      }
      else{
         show = true;
         res.render("index.ejs", {notification: "Wrong username or password", show: show});
      }
   }
   else{
      show = true;
      res.render("index.ejs", {notification: "Wrong username or password", show: show});
   }
   
});

// image route
// @params username
// handles the displaying of the users profile picture
app.get("/:username/image", async (req,res) => {
   try{
       const user = await User.findOne({username: req.params.username});
       if(user){
         const profilePicture = user.profileImage.filename;
         const file = await gfs.find({filename: profilePicture}).toArray();
         if(!file || file.length === 0){
            res.sendStatus(204);
         }
         else{
            if(file[0].metadata.type === "image/jpeg" || file[0].metadata.type === "image/png"){
               const readStream = gfs.openDownloadStreamByName(profilePicture);
               readStream.pipe(res);
            }
            else{
               res.sendStatus(204);
            }
         }
       }
   }catch(err){
       res.status(404).send({Error: err.message});
   }
});


// profile route
// @params username
// renders the user's profile page
app.get("/:username/profile", async (req,res) => {
   const user = await User.findOne({username: req.params.username});
   res.render("profile.ejs", {notification: "", show: false, user: user, showPassword: false, pass: pass });
});

// change profile picture route
// @params username
// replaces the old profile image of the user in the database
app.post("/:username/edit/change-profile-pic", async (req, res) => {
   const profile = req.files.profileImage;
   const user = await User.findOne({username: req.params.username});

   if(user){
      // find and delete old profile picture from database
      const oldPic = user.profileImage.filename;
      if(oldPic !== "default"){
         const file = await gfs.find({filename: oldPic}).toArray();
         gfs.delete(file[0]._id);
      }
      
      
      // Rename and save new profile picture
      const buf = crypto.randomBytes(16);
      const filePath = buf.toString('hex') + path.extname(profile.name);
      const readStream = fs.createReadStream(profile.path);
         
      const uploadStream = gfs.openUploadStream(filePath, {
               chunkSizeBytes: 1048576,
               metadata:{
                  name: profile.name,
                  size: profile.size, 
                  type: profile.type
               }
      });
            
      readStream.pipe(uploadStream);
      uploadStream.on("finish", async () => {
         user.profileImage.filename = filePath;
         await user.save();
         res.redirect(`/${user.username}/profile`);
      });
   }
});

// Change email route
// @param username
// updates the username of the user in the database
app.post("/:username/edit/change-email", async (req,res) => {
   const newEmail = req.fields.newEmail;
   const confirmEmail = req.fields.confirmEmail;
   const user = await User.findOne({username: req.params.username})

   if(newEmail === confirmEmail){
      await User.findOneAndUpdate({username: req.params.username}, {email: newEmail});
      res.redirect(`/${req.params.username}/profile`);
   }
   else{
      res.render("profile.ejs", {notification: "Emails don't match", show: true, user: user, showPassword: false});
   }
});


// change username route
// @params username
// changes the username of the user from the old one to the new 
// username if it is not yet taken
app.post("/:username/edit/change-username", async (req, res) => {
   const user = await User.findOne({username: req.params.username});
   const newUsername = req.fields.newUsername;
   const checkForUser = await User.findOne({username: newUsername});

   if(checkForUser){
      res.render("profile.ejs", {notification: "Username Already taken", show: true, user: user, showPassword: false});
   }
   else{
      user.username = newUsername;
      await user.save();
      res.redirect(`/${user.username}/profile`);
   }
});

// Change password route
// @params username
// Changes the user's password. Used bcrypt to encrypt the password
// and improve security
app.post("/:username/edit/change-password", async(req, res) => {
    const newPassword = req.fields.newPassword;
    const confirmPassword = req.fields.confirmPassword;
    const user = await User.findOne({username: req.params.username});
    if(newPassword === confirmPassword){
       pass = newPassword;
       // Hashing password with bycrypt
       const hash = await bcrypt.hash(newPassword, 15);

       user.password = hash;
       await user.save();
       res.redirect(`/${user.username}/profile`);
    }
    else{
      res.render("profile.ejs", {notification: "Make sure the passwords are the same. Try again", show: true, user: user, showPassword: false });
    }
});

// show password
// @param username
// handles the display and hiding of user password 
app.get("/:username/profile/show-password", async (req, res) => {
   const user = await User.findOne({username: req.params.username});
   if(!showPassword){
      showPassword = true;
      res.render("profile.ejs", {notification: "", show: false, user: user, showPassword: showPassword, pass: pass});
   }else{
      showPassword = false;
      res.render("profile.ejs", {notification: "", show: false, user: user, showPassword: showPassword, pass: pass});
   }
   
})

// sign out route
// redirects user back to the landing page
app.get("/signout", (req, res) => {
   res.redirect("/");
})










app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Server connection
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, ()=>{
    console.log(`Server has started successfully`)
});