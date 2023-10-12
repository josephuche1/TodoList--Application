import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

let currentTab; 
let tabs = ["today", "work"];
let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let d = new Date();
let fullDate = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB")
   .then(()=>{
      console.log("Connected to DB successfully.");
   })
   .catch(()=> {
      console.log("Failed to connect to DB.");
   });

const tasksSchema = new mongoose.Schema({
   task:{
      type: String,
      required: [true, "Please type in an item."]
   }
});

const Task = mongoose.model("Task", tasksSchema);
const workTask = mongoose.model("workTask", tasksSchema);

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

app.post("/add_task_today", async (req, res) => { 
   const newTask = req.body.newTask;
    
   const task = new Task({
     task: newTask
   });
   await task.save();
   res.redirect("/");
});

app.post("/delete", async (req,res) => {
   const checkedTask = req.body.checkbox;
   await Task.deleteOne({_id: checkedTask})
       .then(() => {
         console.log("Successfully deleted task.");
       })
       .catch((err) => {
         console.log(`Failed to delete task: ${err}`);
       });
   
   res.redirect("/");
});

app.post("/add_task_work", (req, res) => {
   workTasks.push(req.body["newTask"]);
   console.log("Work: ");
   console.log(workTasks);
   res.render("work.ejs", {tab: currentTab, active: "active-tab", worksTask: workTasks, date: fullDate});
});

app.get("/work", (req,res) =>{
   currentTab = tabs[1];
   res.render("work.ejs", {tab: currentTab, active: "active-tab", worksTask: workTasks, date: fullDate});
});

app.get("/", async (req, res) => {
   currentTab = tabs[0];
   const tasks = await Task.find({});
   if(tasks.length === 0){
      Task.insertMany(defaultItems, {ordered:true})
        .then(() =>{
           console.log(`Successfully added tasks`);
        })
        .catch(() => {
           console.log(`failed to add tasks`);
        });;
       res.redirect("/");  
   } else{
      res.render("index.ejs", {tab: currentTab, active: "active-tab", todaysTask: tasks, date: fullDate});
   }
   
});

app.listen(port, ()=>{
    console.log(`Server running from port ${port}`)
});