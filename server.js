import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
const port = 3000;

mongoose.connect("mongodb://localhost:27017/todolistDB");

const tasksSchema = new mongoose.Schema({
   task:{
      type: String,
      required: [true, "Please type in an item."]
   }
});

const Task = mongoose.model("Task", tasksSchema);
const workTask = mongoose.model("workTask", tasksSchema);

let currentTab; 
let tabs = ["today", "work"];
let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let d = new Date();
let fullDate = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.post("/add_task_today", (req, res) => {
   todayTasks.push(req.body["newTask"]);
   console.log("Today: ")
   console.log(todayTasks);
   res.render("index.ejs", {tab: currentTab, active: "active-tab", todaysTask: todayTasks, date: fullDate});
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

app.get("/", (req, res) => {
   currentTab = tabs[0];
   res.render("index.ejs", {tab: currentTab, active: "active-tab", todaysTask: todayTasks, date: fullDate});
});

app.listen(port, ()=>{
    console.log(`Server running from port ${port}`)
});