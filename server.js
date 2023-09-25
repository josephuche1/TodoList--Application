import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

let currentTab; 
let tabs = ["today", "work"];

let todayTasks = [];
let workTasks = [];


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.post("/add_task_today", (req, res) => {
   todayTasks.push(req.body["newTask"]);
   console.log(todayTasks);
   res.render("index.ejs", {tab: currentTab, active: "active-tab", todaysTask: todayTasks});
});

app.post("/add_task_work", (req, res) => {
   workTasks.push(req.body["newTask"]);
   console.log(workTasks);
   res.render("work.ejs", {tab: currentTab, active: "active-tab", worksTask: workTasks});
});

app.get("/work", (req,res) =>{
   currentTab = tabs[1];
   res.render("work.ejs", {tab: currentTab, active: "active-tab", worksTask: workTasks});
});

app.get("/", (req, res) => {
   currentTab = tabs[0];
   res.render("index.ejs", {tab: currentTab, active: "active-tab", todaysTask: todayTasks});
});

app.listen(port, ()=>{
    console.log(`Server running from port ${port}`)
});