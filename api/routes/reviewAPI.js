// a basic API for the admin functions of our program

require('dotenv').config();
var express = require("express");
var mysql = require('mysql');
var router = express.Router();

router.use(express.json({ limit: '1mb' }));  // (basic) to ensure no insane loading of the db

var pool = mysql.createPool({  // using a pool so can handle multiple queries over time
  connectionLimit: process.env.LIMIT,  // important
  host: process.env.HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  debug: false
});







router.post('/update', (req, res) => {
  let review = req.body;
  let updateQuery = "UPDATE REVIEWS  SET subID = ?, reviewerID = ?, deadline = ?, recommendation = ?, comment = ?  WHERE reviewerID = ? AND subID = ?";
  let params = [ review.subID, review.reviewerID, review.deadline, review.recommendation, escapeString(review.comment), review.originalsubID  ];
  let addQuery = mysql.format(updateQuery, params);
  pool.query(addQuery, (err, response) => {
    console.log("Connected to database...\n");
    if(err) {
      console.error(err);
      return;
    }
    console.log("review updated in REVIEWS table!");
    res.send("Review updated");
  });
})

router.get("/update", function(req, res, next){
  res.send("API for review UPDATE queries is working properly");
});






function addReview(review) {
  let theQuery = "UPDATE REVIEWS  SET recommendation = ?, comment = ?  WHERE reviewerID = ? AND subID = ?";
  let params = [ review.recommendation, escapeString(review.comment), review.reviewerID, review.subID  ];
  let preparedQuery = mysql.format(theQuery, params);
  console.log("Query about to run: " + preparedQuery);
  pool.query(preparedQuery, (err, response) => {
    console.log("Connected to database...\n");
    if (err) {
      console.error(err);
      return;
    }
    console.log("Review added to this submission!");
    console.log(response.insertId);
  });
}
// Implemented this a bit differently from the rest: has a delay and calls the above function... supposed to be a little better.
router.post('/add-review', (req, res) => {
  const review = req.body; // the input tuple
  setTimeout(() => {  // timeout avoids firing query before connection happens
    addReview(review);
    
 }, 500);

  res.send("Review added to this submission!");  // response back to client. min: response.end();
});





router.get("/", function(req, res, next) {
  res.send("reviewAPI is working properly");
});




function escapeString (st) {
  let escapedSt = "";
  const length = st.length;
  for (let i = 0 ; i < length; i++) {
    if (st[i] === "'")
      escapedSt += '\'';
    else if (st[i] === '"')
      escapedSt += "\"";
    else 
      escapedSt += st[i];
  }
  return escapedSt;
}



module.exports = router;
