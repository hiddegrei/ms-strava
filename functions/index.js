const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const { _onRequestWithOptions } = require("firebase-functions/v1/https");
const cors = require("cors")({ origin: true });
const app = express();
app.use(cors);
const admin = require("firebase-admin");

admin.initializeApp();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });


//exchange auth token for access token
app.post("/api/users/:userId/oauth/token",urlencodedParser, (req, res) => {
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
      res.json({
        accesToken: json.access_token,
        expires_at: json.expires_at,
        refresh_token: json.refresh_token,
      });
     admin
       .firestore()
       .collection("users")
       .doc(req.params.userId)
       .set({ accesToken: json.access_token, expires_at: json.expires_at, refresh_token: json.refresh_token })
       .catch((err) => console.log(err));
    }
  });
});

app.get("/api/users/:userId/oauth/refreshtoken", (req, res) => {});

//get activities
app.get("/api/users/:userId/activities", (req, res) => {});