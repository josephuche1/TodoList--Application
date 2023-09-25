import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

let currentTab; 
let tabs = ["today", "work"];
let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

let todayTasks = [];
let workTasks = [];
let d = new Date();
let month = months[d.getMonth()];
let day = days[d.getDay()];
let dateNum = d.getDate();
let fullDate = day + ", "+month+" "+dateNum;

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