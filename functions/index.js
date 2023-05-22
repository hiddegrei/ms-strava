const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const { _onRequestWithOptions } = require("firebase-functions/v1/https");
const cors = require("cors")({ origin: true });
const app = express();
app.use(cors);
const admin = require("firebase-admin");
const { ref } = require("firebase-functions/v1/database");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
admin.initializeApp();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const myLogger = function (req, res, next) {
  // console.log(req.params.userId)
   function resolveAfterEndRefresh() {
     return new Promise((resolve) => {
      fetch(`https://us-central1-ms-strava.cloudfunctions.net/app/api/users/${req.params.userId}/token/refresh`, {
                method: "GET", // or 'PUT'
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                },
              })
                .then((res) => res.json())
                .then((json) => {
                  console.log(json,"37")
                  console.log(json.access_token,"38")
                  
                  if(json.access_token!=undefined){
                    req.accessToken = json.access_token;
                  accessToken = json.access_token;
                    admin
                    .firestore()
                    .collection("users")
                    .doc(req.params.userId)
                    .set({ accesToken: json.access_token, expires_at: json.expires_at, refresh_token: json.refresh_token })
                    .catch((err) => console.log(err));

                  }
                 
                 
                }).then(()=>{
                  resolve("succes")
                  
                })
                .catch((err) => {
                  console.log(err);
                });
              

     })}
       async function fRefresh() {
      const x = await resolveAfterEndRefresh();
    }

   
    function resolveAfterEnd() {
      return new Promise((resolve) => {
        admin
          .firestore()
          .collection("users")
          .doc(req.params.userId)
          .get()
          .then((doc) => {
            let now = Date.now();
            // console.log(now>=doc.data().expires_at,"173")
            // accessToken = doc.data().accesToken;
            if(now<=doc.data().expires_at){
              req.accessToken = doc.data().accesToken;
              resolve("succes")
              
            }else{
              fRefresh().then(()=>{
                resolve("succes")
              })
              
               
            }
            
          })
          .then(() => {
           
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
    async function f1() {
      const x = await resolveAfterEnd();
    }
    f1()
 
 
}

// app.use(myLogger)

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
      // console.log(refreshToken,"83")
    let params = {
      client_id: "74263",
      client_secret: "b388ec2403cbd89e5d10ea582266e30d28361fcb",
      refresh_token: refreshToken,
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
          

        if (json.access_token) {
          admin
            .firestore()
            .collection("users")
            .doc(req.params.userId)
            .set({ accesToken: json.access_token, expires_at: json.expires_at, refresh_token: json.refresh_token }).then((doc)=>{
              console.log(json.access_token,"163")
              
            })
            .catch((err) => console.log(err));
            res.json({
              access_token: json.access_token,
              expires_at: json.expires_at,
              refresh_token: json.refresh_token,
            });
           
          // res.json({
          //   status: "succes",

          // });
          
        }else{
          res.json({
           error:"something went werong"
          });
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
app.get("/api/users/:userId/activities/:page",myLogger, (req, res) => {
  let accessToken = "";
  // function resolveAfterEndRefresh() {
  //   return new Promise((resolve) => {
  //     fetch(`https://us-central1-ms-strava.cloudfunctions.net/app/api/users/${req.params.userId}/token/refresh`, {
  //               method: "GET", // or 'PUT'
  //               headers: {
  //                 "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  //               },
  //             })
  //               .then((res) => res.json())
  //               .then((json) => {
  //                 accessToken = json.accesToken;
  //                 admin
  //                 .firestore()
  //                 .collection("users")
  //                 .doc(req.params.userId)
  //                 .set({ accesToken: json.access_token, expires_at: json.expires_at, refresh_token: json.refresh_token })
  //                 .catch((err) => console.log(err));
  //                 resolve("succes")
  //               })
  //               .catch((err) => {
  //                 console.log(err);
  //               });
               

  //   })}

  //   async function fRefresh() {
  //     const x = await resolveAfterEndRefresh();
  //   }

   
    // function resolveAfterEnd() {
    //   return new Promise((resolve) => {
    //     admin
    //       .firestore()
    //       .collection("users")
    //       .doc(req.params.userId)
    //       .get()
    //       .then((doc) => {
    //         let now = Date.now();
    //         console.log(now>=doc.data().expires_at,"173")
    //         // accessToken = doc.data().accesToken;
           
    //           accessToken = doc.data().accesToken;

            
            
    //       })
    //       .then(() => {
    //         resolve("succes");
    //       })
    //       .catch((err) => {
    //         console.log(err);
    //       });
    //   });
    // }
    // async function f1() {
    //   const x = await resolveAfterEnd();
    // }
    async function f2() {
     

      fetch(`https://www.strava.com/api/v3/athlete/activities?page=${req.params.page}&per_page=10`, {
        method: "GET", // or 'PUT'
       headers: {
        authorization: "Bearer " + req.accessToken,
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
    // f1().then((doc) => {
      f2();
    // });
});

//get activities stream
app.get("/api/users/:userId/activities/:activityid/streams",myLogger, (req, res) => {
  let accessToken = "";
  // function resolveAfterEndRefresh() {
  //   return new Promise((resolve) => {
  //     fetch(`https://us-central1-ms-strava.cloudfunctions.net/app/api/users/${req.params.userId}/token/refresh`, {
  //               method: "GET", // or 'PUT'
  //               headers: {
  //                 "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  //               },
  //             })
  //               .then((res) => res.json())
  //               .then((json) => {
  //                 accessToken = json.accesToken;
  //                 admin
  //                 .firestore()
  //                 .collection("users")
  //                 .doc(req.params.userId)
  //                 .set({ accesToken: json.access_token, expires_at: json.expires_at, refresh_token: json.refresh_token })
  //                 .catch((err) => console.log(err));
  //                 resolve("succes")
  //               })
  //               .catch((err) => {
  //                 console.log(err);
  //               });
               

  //   })}

  //   async function fRefresh() {
  //     const x = await resolveAfterEndRefresh();
  //   }

   
    // function resolveAfterEnd() {
    //   return new Promise((resolve) => {
    //     admin
    //       .firestore()
    //       .collection("users")
    //       .doc(req.params.userId)
    //       .get()
    //       .then((doc) => {
    //         let now = Date.now();
    //         console.log(now<=doc.data().expires_at,"173")
    //         // accessToken = doc.data().accesToken;
    //         // if(now>=doc.data().expires_at){
    //           accessToken = doc.data().accesToken;

            
            
    //       })
    //       .then(() => {
    //         resolve("succes");
    //       })
    //       .catch((err) => {
    //         console.log(err);
    //       });
    //   });
    // }
    // async function f1() {
    //   const x = await resolveAfterEnd();
    // }
    async function f2() {
     

      fetch(`https://www.strava.com/api/v3/activities/${req.params.activityid}/streams?keys=watts&key_by_type=true`, {
        method: "GET", // or 'PUT'
       headers: {
        authorization: "Bearer " + req.accessToken,
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
    // f1().then((doc) => {
      f2();
    // });
});






exports.app = functions.https.onRequest(app);