import React from 'react';


class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allQueriesComplete: false
    };
    this.submissions = {
      data: null,
      needingRevs: [],
      //haveAllRevs: [],
      needingDeadline: [],
      needingDecision: [],
      withRemovalRequests: []
    }
    this.reviews = null;
    this.nominated = null;
    this.requests = null;
  }



  componentDidMount = () => {
    // ToFix: there's probably a way to query the db once where all the info appears in one super table.
    // Need to brush up on my SQL to figure that out. For now, I'll do the select queries separately.

    // retrieve all submissions
    let myQuery = "SELECT * FROM SUBMISSION";
    fetch('http://localhost:9000/select', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: myQuery})   
    }).then(response => {
      response.json().then(data => {
        // this.setState({serverResponse: JSON.parse(JSON.stringify(data))});
        console.log("server response for SUBMISSION query: \n");
        console.log(data);
        this.submissions.data = data;
        this.addRevsAttributeToSubs();

        // retrieve all reviewer records
        myQuery = "SELECT * FROM REVIEWS";
        fetch('http://localhost:9000/select', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: myQuery})   
        }).then(response => {
          response.json().then(data => {
            console.log("server response for REVIEWS query: \n");
            console.log(data);
            this.reviews = data;

            // add the rev to the sub they belong to
            this.reviews.forEach((rev, revIndex, revArr) => {
              this.submissions.data.forEach((sub, subIndex, subArr) => {
                if (rev.subID === sub.subID)
                  sub.revs.push(rev);
              });
            });

            this.calcSubStats();

            // BLAH TRYING to do it more efficiently (got confusing, so do it later. Brute force for now ^)
            // trying to keep track of a found review's submission's index in the this.submissions.data array so 
            // that a review for the same submission wouldn't need to search for that submission agian...abs

            // let thisRevsSubIndex = {};
            // this.reviews.forEach((rev, revIndex, revArr) => {
            //   if (eval('thisRevsSubIndex.s' + rev.subID + ' === undefined')) {
            //     this.submissions.data.forEach((sub, subIndex, subArr) => {
            //       if (rev.subID === sub.subID)
            //         eval('thisRevsSubIndex.s' + rev.subID + '=' + subIndex);
            //       // more shit...
            //     });
            //   }
            //   
            
            if (this.checkIfAllQueriesComplete()) 
              this.setState({allQueriesComplete: true});
          });
        });

        // retrieve all reviewer nominations
        myQuery = "SELECT * FROM NOMINATED";
        fetch('http://localhost:9000/select', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: myQuery})   
        }).then(response => {
          response.json().then(data => {
            console.log("server response for NOMINATED query: \n");
            console.log(data);
            this.nominated = data;


            if(this.checkIfAllQueriesComplete()) 
              this.setState({allQueriesComplete: true});
          });
        });

        // retrieve all review requests
        myQuery = "SELECT * FROM REQUESTS";
        fetch('http://localhost:9000/select', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: myQuery})   
        }).then(response => {
          response.json().then(data => {
            console.log("server response for REQUESTS query: \n");
            console.log(data);
            this.requests = data;


            if(this.checkIfAllQueriesComplete()) 
              this.setState({allQueriesComplete: true});
          });
        });

      });
    });
  }



  addRevsAttributeToSubs = () => {
    this.submissions.data.forEach((sub, i, arr) => { sub.revs = [] });
  }



  calcSubStats = () => {
    this.submissions.data.forEach((sub, index, arr) => {

      if (sub.revs.length < 3)  
        this.submissions.needingRevs.push(index);
      else {
        //this.submissions.haveAllRevs.push(index);
        console.log(`nice: Submission ID '${sub.subID}' has 3+ reviewers already :)`);

        // check to see if all reviewers have completed their reviews
        let allRevsFinished = true;
        let rev;
        for (rev of sub.revs) {
          if ( !(rev.recommendation === "Accept" || 
                 rev.recommendation === "Minor Review" || 
                 rev.recommendation === "Major Review") ) {
            allRevsFinished = false;
            break;
          }
        }
        if (allRevsFinished)
          this.submissions.needingDecision.push(index);
      }

      if (sub.revDeadline === null)
        this.submissions.needingDeadline.push(index);

      if (sub.status === "Author requests removal")
        this.submissions.withRemovalRequests.push(index);

      // moved this above to avoid unneccessary work.
      // Don't think I need the this.submissions.haveAllRevs property anymore.
      // if (this.submissions.haveAllRevs.includes(index)) {
      //   let allRevsFinished = true;
      //   let rev;
      //   for (rev of sub.revs) {
      //     if ( !(rev.recommendation === "Accept" || 
      //            rev.recommendation === "Minor Review" || 
      //            rev.recommendation === "Major Review") ) {
      //       allRevsFinished = false;
      //       break;
      //     }
      //   }
      //   if (allRevsFinished)
      //     this.submissions.needingDecision.push(index);
      // }

      if (sub.revs.length > 4)
        alert("shit: submission ID " + sub.subID + " has " + 
              sub.revs.length + " reviewers assigned to it.");        
    });

  }



  checkIfAllQueriesComplete = () => {
    if(this.submissions.data != null &&
       this.reviews != null &&
       this.nominated != null &&
       this.requests != null)
      return true;

    return false;
  }



  render() {
    return (
      <div>
        <div style={{width: "700px", textAlign: "center", margin: "100px auto"}}>
          <br/>
          {this.submissions.needingRevs.length} Articles need Reviewers assigned to them
          <br/>
          {this.submissions.needingDeadline.length} Articles need a deadline set
          <br/>
          {this.submissions.withRemovalRequests.length} Articles have removal requests
          <br/>
          <br/>
          {this.submissions.needingDecision.length} {this.submissions.needingDecision.length === 1 ? 
            "Article requires" : "Articles require"} your editorial decision (also need to account for expired review deadline ones)
          <br/>
          <br/>
          <br/>
          <br/>
          __Publish a completed academic journal__
          <br/>
          <br/>
          (cody: make sure this guy has a special view of the article pages that lets him edit everything about it)
        </div>
      </div>
      
    );
  }
}


export default Editor;