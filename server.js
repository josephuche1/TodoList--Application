import express from "express";

const app = express();
const port = 3000;
let tabs = ["today", "work"];
let classNames = ["active-tab"]

app.use(express.static("public"));

app.get("/work", (req,res) =>{
   res.render("work.ejs", {tab: tabs[1], active: classNames[0]});
});

app.get("/", (req, res) => {
   res.render("index.ejs", {tab: tabs[0], active: classNames[0]});
});

app.listen(port, ()=>{
    console.log(`Server running from port ${port}`)
});