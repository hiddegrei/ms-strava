const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const { _onRequestWithOptions } = require("firebase-functions/v1/https");
const cors = require("cors")({ origin: true });
const app = express();
app.use(cors);
const admin = require("firebase-admin");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
admin.initializeApp();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });


//exchange auth token for access token
app.post("/api/users/:userId/token/auth",urlencodedParser, (req, res) => {

    let params = {
  client_id: "74263",
  client_secret: "b388ec2403cbd89e5d10ea582266e30d28361fcb",
  code: req.body.code,
  grant_type: "authorization_code",
};

fetch("https://www.strava.com/oauth/token", {
  method: "POST", // or 'PUT'
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(params),
})
  .then((res) => res.json())
  .then((json) => {
    //   console.log(json);

    if (json.access_token) {
         admin
           .firestore()
           .collection("users")
           .doc(req.params.userId)
           .set({ accesToken: json.access_token, expires_at: json.expires_at, refresh_token: json.refresh_token })
           .catch((err) => console.log(err));
    //   res.json({
    //     accesToken: json.access_token,
    //     expires_at: json.expires_at,
    //     refresh_token: json.refresh_token,
    //   });
    res.json({
        status:"succes"
    })
    
    }
  }).catch((err)=>{
    res.json(err)
  });
});

app.get("/api/users/:userId/token/refresh", (req, res) => {
    let refreshToken="";
    function resolveAfterEnd() {
      return new Promise((resolve) => {
        admin
          .firestore()
          .collection("users")
          .doc(req.params.userId)
          .get()
          .then((doc) => {
           
            refreshToken=doc.data().refresh_token
          })
          .then(() => {

            resolve("succes");
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
    async function f1() {
      const x = await resolveAfterEnd();
    }
    async function f2(){
    let params = {
      client_id: "74263",
      client_secret: "b388ec2403cbd89e5d10ea582266e30d28361fcb",
      code: refreshToken,
      grant_type: "refresh_token",
    };

    fetch("https://www.strava.com/oauth/token", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })
      .then((res) => res.json())
      .then((json) => {
           console.log(json);

        if (json.access_token) {
          admin
            .firestore()
            .collection("users")
            .doc(req.params.userId)
            .set({ accesToken: json.access_token, expires_at: json.expires_at, refresh_token: json.refresh_token })
            .catch((err) => console.log(err));
            res.json({
              accesToken: json.access_token,
              expires_at: json.expires_at,
              refresh_token: json.refresh_token,
            });
          // res.json({
          //   status: "succes",

          // });
        }
      })
      .catch((err) => {
        res.json(err);
      });
    }
    f1().then((doc)=>{
        f2()
    })
});

//get activities
app.get("/api/users/:userId/activities", (req, res) => {
    let accessToken = "";
    function resolveAfterEnd() {
      return new Promise((resolve) => {
        admin
          .firestore()
          .collection("users")
          .doc(req.params.userId)
          .get()
          .then((doc) => {
            let now = Date.now();
            if(now<=doc.data().expires_at){
              accessToken = doc.data().accesToken;

            }else{
              fetch(`https://us-central1-ms-strava.cloudfunctions.net/app/api/users/${req.params.userId}/token/refresh`, {
                method: "GET", // or 'PUT'
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                },
              })
                .then((res) => res.json())
                .then((json) => {
                  accessToken = json.accesToken;
                })
                .catch((err) => {
                  console.log(err);
                });
            }
            
          })
          .then(() => {
            resolve("succes");
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
    async function f1() {
      const x = await resolveAfterEnd();
    }
    async function f2() {
     

      fetch("https://www.strava.com/api/v3/athlete/activities?page=1&per_page=30", {
        method: "GET", // or 'PUT'
       headers: {
        authorization: "Bearer " + accessToken,
        accept: "application/json",
      },
      })
        .then((res) => res.json())
        .then((json) => {
          //   console.log(json);

         
            res.json({
              status: "succes",
              data:json
            });
          
        })
        .catch((err) => {
          res.json(err);
        });
    }
    f1().then((doc) => {
      f2();
    });
});

exports.app = functions.https.onRequest(app);