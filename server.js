import express from "express";
// import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import fs from "fs";
import formidableMiddleware from "express-formidable";
import mongodb from "mongodb";
import path from "path";
import crypto from "crypto";
// import { Readable } from "stream";


const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const d = new Date();
const fullDate = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();

const mongoURI = "mongodb+srv://admin-joseph:olisa312@todolist.vkymokh.mongodb.net/todolistDB";
const app = express();
// const port = 3000;
app.use(formidableMiddleware());
// app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(mongoURI)
  .then(() => {
   console.log("Connected to DB successsfully.");
  }).catch((err) => {
   console.log("Failed to connect to database.");
  });

let gfs;

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
   isLoggedIn: Boolean,
   list: [listSchema], 
   profileImage: profileImageSchema

});


const Task = mongoose.model("Task", tasksSchema);

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

const List = mongoose.model("list", listSchema);
const User = mongoose.model("user", userSchema);

const conn = mongoose.connection;

conn.once('open', () => {
   gfs = new mongoose.mongo.GridFSBucket(conn.db, {
     bucketName: 'uploads' 
   });
 });

app.get("/", async (req, res) => {
   const tasks = await Task.find({});
   const lists = await List.find({});
   const user = await User.findById("6533afd674853633b3e425c7");
   if(user.task.length === 0){
      user.task.push(task1);
      user.task.push(task2);
      user.task.push(task3);
      await user.save();
      res.redirect("/");  
   } else{
      res.render("lists.ejs", {lists: user.list, todaysTask: user.task, title: fullDate})
   }
   
});

app.post("/", async (req, res) => { 
   console.log(req.fields);
   const newTask = req.fields.newTask;
   const listName = req.fields.list;
   const user = await User.findById("6533afd674853633b3e425c7");

   const task = new Task({
     task: newTask
   });

   if(listName === fullDate){
      user.task.push(task);
      await user.save();
      res.redirect("/");
   } else{
      const found = user.list.find((list) => list.name === listName);
      found.items.push(task);
      await user.save();
      res.redirect(`/lists/${listName}`);
   }
   
});

app.post("/delete", async (req,res) => {
   const user = await User.findById("6533afd674853633b3e425c7");
   const checkedTask = req.fields.checkbox;
   const listName = req.fields.list;

   if(listName === fullDate){
      const index = user.task.findIndex((task) => task._id === checkedTask);
      user.task.splice(index, 1);
      await user.save();
      console.log("Item deleted");
      res.redirect("/");
   } else{
      const found = user.list.findIndex((listN) => listN.name === listName);
      const itemIndex = user.list[found].items.findIndex((task) => task._id = checkedTask);
      user.list[found].items.splice(itemIndex, 1);
      await user.save();
      console.log("Item deleted");
      res.redirect(`/lists/${listName}`);
   }
});

app.get("/lists/:customListName", async (req, res) => {
   const user = await User.findById("6533afd674853633b3e425c7");
   const customListName = _.capitalize(req.params.customListName);

   if(customListName === "Favicon.ico"){
      res.redirect("/favicon.ico")
   }
   else{
      try {
         const list = user.list.find((listN) => listN.name === customListName);
     
         if (list) {
           const lists = user.list;
           res.render("lists.ejs", {lists: lists, todaysTask: list.items, title: list.name});
    
         } else {
           console.log(`List with name '${customListName}' not found. Creating newlist`);
           const newlist = new List({
             name: customListName,
             items: defaultItems
           });
           user.list.push(newlist);
           await user.save();
           res.redirect(`/lists/${customListName}`);
         }
     
       } catch (err) {
         // Handle any errors that may occur during the query.
         console.log(err);
         res.status(500).send("Internal server error");
       }
   }
   
 });
 
app.post("/newList", (req, res) =>{
    const newListName = _.capitalize(req.fields.newList);
    if(newListName === "Today" || newListName === ""){
      res.redirect("/")
    }
    else{
      res.redirect(`/lists/${newListName}`);
    }
    
});

app.post("/deleteList", async (req,res) => {
   const user = await User.findById("6533afd674853633b3e425c7");
   const listName = req.fields.listName;
   const index = user.list.findIndex((list) => list.name === listName);
   user.list.splice(index, 1);
   await user.save();
   console.log(`${listName} has been deleted`);
   res.redirect("/");
});


app.post("/signup", async (req, res) => {
   const profile = req.files.profileImage;
   const password = req.fields.password;
   const confirm = req.fields.confirm_password;
   const confirmUsername = req.fields.username;
   let filePath;
   
   const userCheck  = await User.find({username: confirmUsername });
   if(userCheck){
      console.log("Username already taken");
      res.redirect("/");
   }
   else{
      if(password === confirm){
         if(profile){
            const buf = crypto.randomBytes(16);
            filePath = buf.toString('hex') + path.extname(profile.name);
         }
         else{
            filePath = "person.svg";
         }
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
            password: req.fields.password,
            isLoggedIn: true,
            profileImage: {
               filename: filePath,
            }
         });
         await newUser.save();
         uploadStream.on("finish", () => {
            res.redirect("/");
         });
      } 
      else{
         console.log("please make sure that that confirm password is the same as the password");
         res.redirect("/");
      } 
   } 
});

// app.get("/images/:filename", async (req,res) => {
//    try{
//        const file = await gfs.find({filename: req.params.filename}).toArray();
//        if(!file || file.length === 0){
//            res.json({error: "No file found"});
//        }
//        else{
//            if(file[0].metadata.type == "image/jpeg" || file[0].metadata.type == "image/png"){
//                const readstream = gfs.openDownloadStreamByName(req.params.filename);
//                readstream.pipe(res);
//            }
//            else{
//                res.json({NotImage: "Not an image"});
//            }
//        }
//    }catch(err){
//        res.status(404).send({Error: err.message});
//    }
// });


app.get('/favicon.ico', (req, res) => res.sendStatus(204));

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, ()=>{
    console.log(`Server has started successfully`)
});