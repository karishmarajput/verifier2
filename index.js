const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const sgMail = require('@sendgrid/mail');
const fileUpload = require("express-fileupload");
const fs = require('fs')
const pdfParse = require('pdf-parse')
var SHA256 = require("crypto-js/sha256");

const app = express()
app.use(fileUpload());
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())

app.set('view engine','ejs')
console.log('hello')
mongoose.connect("mongodb+srv://dbUser:dbUser@cluster0.vzl6l7a.mongodb.net/dbUser",{ useNewUrlParser:true},{useUnifiedTopology:true},()=>{
    console.log("database connected")
    console.log('yo')
})
mongoose.Promise = global.Promise;
mongoose.connection.on('error',(err)=>{
    console.log(err)
})


const userSchema = new mongoose.Schema({
    name : String,
    username :String,
    password : String,
    email : String,
    gender : String,
})
const studentSchema = new mongoose.Schema({
    name : String,
    rollno : Number,
    email : String,
    mark1 : Number,
    mark2 : Number,
    mark3 : Number,
    mark4 : Number,
    mark5 : Number
})

const User = new mongoose.model("users",userSchema)
const Student = new mongoose.model("students",studentSchema)

let p1,p2;

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname+'/webpages/homepage.html'))
})
app.get('/signup',(req,res)=>{
    res.sendFile(path.join(__dirname+'/webpages/signup.html'))
})
app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname+'/webpages/index.html'))
})
app.get('/verify',(req,res)=>{
    res.sendFile(path.join(__dirname +'/webpages/verify.html'))
})
app.post("/login",(req,res)=>{
    const {username,password} = req.body
    console.log(req.body)
    UserAdminHardCoded = 'admin';
    UserAdminPasswordHardCoded  = 'admin'
    /*User.findOne({username:username},(err,user)=>{
        if(user){
            if(password===user.password){
                console.log(user)
                res.render('user',{data:user})
            }
            else{
                res.send({message:"Password didn't match"})
            }
        }
        else{
            res.send({message:"User not registered"})
        }
    }) */
    if(username == UserAdminHardCoded && password == UserAdminPasswordHardCoded){
        res.sendFile(path.join(__dirname+'/webpages/addstudent.html'))
    }
    else{
        res.send('Admin not approved')
    }
})
app.post('/addstudent',(req,res)=>{
    const {name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5} = req.body;
    console.log(name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5)
    Student.findOne({rollno:Rollno},(err,student)=>
    {
        if(student)
        {
            res.send('student already exists');
        }
        else
        {
            let totContent = Rollno + Mark1 + Mark2 + Mark3 + Mark4 + Mark5;
            console.log(totContent)
            let hash = SHA256(totContent)
            console.log(hash);
            //store in blockchain if success send mail
            const studentnew = new Student
            ({
                name : name,
                rollno : Rollno,
                email : Email,
                mark1 : Mark1,
                mark2 : Mark2,
                mark3 : Mark3,
                mark4 : Mark4,
                mark5 : Mark5
            })
            studentnew.save(err=>
                {
                if(err)
                {
                    res.send(err)
                }
                else
                {
                    res.send('Added the student in the database')
                    sgMail.setApiKey('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');
                    let HTMLContent = `
                    <h1> Marksheet 2022-23</h1><br>
                    <strong> Name : ${name}</strong><br>
                    <strong> Rollno : ${Rollno}</strong><br>
                    <strong> Mark1 : ${Mark1} </strong> <br>
                    <strong> Mark2 : ${Mark2} </strong> <br>
                    <strong> Mark3 : ${Mark3} </strong> <br>
                    <strong> Mark4 : ${Mark4} </strong> <br>
                    <strong> Mark5 : ${Mark5} </strong> <br>`;
                    const sendPDF = async() =>{
 
                        var html_to_pdf = require('html-pdf-node');
                        let file = { content: HTMLContent };
                        let options = { format: "A4" };
                        const pdfBuffer = await html_to_pdf.generatePdf(file, options);
                        const msg = {
                        to: Email,
                        from: 'karrajput3948@gmail.com', // Use the email address or domain you verified above
                        subject: 'Marksheet 2022-23',
                        text: 'Marksheet',
                        Attachments : [
                        {
                            content: pdfBuffer.toString("base64"),
                            filename: "Certificate.pdf",
                            type: "application/pdf",
                            disposition: "attachment",
                    
                        }],
                        html:  HTMLContent,
                        
                        };
                        //ES6
                        sgMail
                        .send(msg)
                        .then(() => {}, error => {
                            console.error(error);

                            if (error.response) {
                            console.error(error.response.body)
                            }
                        });
                        //ES8
                        (async () => {
                        try {
                            await sgMail.send(msg);
                        } catch (error) {
                            console.error(error);

                            if (error.response) {
                            console.error(error.response.body)
                            }
                        }
                        })();
                    }                            
                    sendPDF();
                }
            })
        }
    })
})
app.post('/verifyMarksheet',(req,res)=>{
    let content = "";
    if(!req.files && !req.files.pdfFile){
        res.status(400);
        res.send('pdf not found')
    }
    pdfParse(req.files.pdfFile).then(result =>{
        console.log(result.text)
        res.send(result.text)
        content = result.text;
        let contentArray = content.split(" ");
        let rollno = parseInt(contentArray[7]);
        let mark1 = contentArray[10];
        let mark2 = contentArray[13];
        let mark3 = contentArray[16];
        let mark4 = contentArray[19];
        let mark5 = contentArray[22];
        // console.log(`${rollno} = ${mark1} = ${mark2} = ${mark3} = ${mark4} = ${mark5}`);
        let totContent = rollno + mark1 + mark2 + mark3 + mark4 + mark5;
        console.log(totContent)
        let hash = SHA256(totContent)
        console.log(hash);
        // compare the hash if same res.send(true)
    })

})

app.post("/register", (req, res)=> {
    const { name, username, password,email,gender} = req.body
    console.log(req.body)
    User.findOne({username: username}, (err, user) => {
        if(user){
            res.send({message: "User already registerd"})
        } else {
            const user1 = new User({
                name : name,
                username : username,
                password : password,
                email : email,
                gender:gender,
            })
            user1.save(err => {
                if(err) {
                    res.send(err)
                    console.log(err)
                } else {
                    res.render('gotologin',{data :{ message: "Successfully Registered, Go to login page now." }})
                }
            })
        }
    })
    
}) 

app.listen(3001,()=>{
    console.log("server is listening")
})