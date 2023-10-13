import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";


let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let d = new Date();
let fullDate = days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate();

const app = express();
// const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-joseph:olisa312@todolist.vkymokh.mongodb.net/todolistDB")
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

const listSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, "The custom list should have a name."]
   },
   items: [tasksSchema]
});

const List = mongoose.model("list", listSchema);

app.get("/", async (req, res) => {
   const tasks = await Task.find({});
   const lists = await List.find({});
   if(tasks.length === 0){
      Task.insertMany(defaultItems, {ordered:true})
        .then(() =>{
           console.log(`Successfully added tasks`);
        })
        .catch((error) => {
           console.log(`failed to add tasks: ${error}`);
        });;
       res.redirect("/");  
   } else{
      res.render("lists.ejs", {lists: lists, todaysTask: tasks, title: fullDate})
   }
   
});

app.post("/", async (req, res) => { 
   const newTask = req.body.newTask;
   const listName = req.body.list;
    
   const task = new Task({
     task: newTask
   });
   if(listName === fullDate){
      await task.save();
      res.redirect("/");
   } else{
      const listToEdit = await List.findOne({name: listName});
      listToEdit.items.push(task);
      await listToEdit.save()
      res.redirect(`/${listName}`);
   }
   
});

app.post("/delete", async (req,res) => {
   const checkedTask = req.body.checkbox;
   const listName = req.body.list;

   if(listName === fullDate){
      await Task.findByIdAndDelete({_id: checkedTask})
      .then(() => {
        console.log("Successfully deleted task.");
      })
      .catch((err) => {
        console.log(`Failed to delete task: ${err}`);
      });
  
       res.redirect("/");
   } else{
      List.findOneAndUpdate(
         {name: listName},
         {$pull: {items: {_id: checkedTask}}}
      ).then(() => {
         res.redirect(`/${listName}`);
         console.log("Successfully deleted task.");
   }).catch((err) => {
      res.send(err);
      console.log(`Failed to delete task: ${err}`);
   })
      
   }
});

app.get("/:customListName", async (req, res) => {
   const customListName = _.capitalize(req.params.customListName);
 
   try {
     const list = await List.findOne({ name: customListName });
 
     if (list) {
       const lists = await List.find({});
       res.render("lists.ejs", {lists: lists, todaysTask: list.items, title: list.name});

     } else {
       console.log(`List with name '${customListName}' not found. Creating newlist`);
       const newlist = new List({
         name: customListName,
         items: defaultItems
       });
       await newlist.save();
       res.redirect(`/${customListName}`);
     }
 
   } catch (err) {
     // Handle any errors that may occur during the query.
     console.log(err);
     res.status(500).send("Internal server error");
   }
 });
 
 app.post("/newList", (req, res) =>{
    const newListName = _.capitalize(req.body.newList);
    if(newListName === "Today"){
      res.redirect("/")
    }
    else{
      res.redirect(`/${newListName}`);
    }
    
 });

 app.post("/deleteList", async (req,res) => {
    const listName = req.body.listName;
    await List.findOneAndDelete({name: listName})
       .then(()=>{
         console.log("Successfully deleted list.");
         res.redirect("/");
       }).catch(() => {
         console.log("Failed to delete list. Try Again");
       })
 });


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, ()=>{
    console.log(`Server has started successfully`)
});