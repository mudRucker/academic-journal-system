import React from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allQueriesComplete: false,
      changesMade: false,
      currentPage: "main"
    };

    
    this.submissions = {
      data: null,               // retrieved
      needingAssignments: [],   // calculated, contains indexes of .data
      needingDecision: [],      // calculated, contains indexes of .data
      withRemovalRequests: []   // calculated, contains indexes of .data
    } 
    this.reviews = null;        // retrieved
    this.nominated = null;      // retrieved
    this.requests = null;       // retrieved
    this.users = null;          // retrieved
    this.reviewers = [];        // calculated

    this.dbChangeQueries = "";  // gets built

    this.submissionsCopy = null;// used for undoing changes
  }



  // grab all the needed data from the db when page first loads
  componentDidMount = () => {
    // ToFix: there's probably a way to query the db once where all the info appears in one super table.
    // Need to brush up on my SQL to figure that out. For now, I'll do the select queries separately.

    // retrieve all submissions
    let myQuery = "SELECT * FROM SUBMISSION, USERS WHERE author = email"  //"SELECT * FROM SUBMISSION";
    fetch('http://localhost:9000/select', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: myQuery})   
    }).then(response => {
      response.json().then(data => {
        // this.setState({serverResponse: JSON.parse(JSON.stringify(data))});
        //console.log("server response for SUBMISSION query: \n");
        //console.log(data);
        this.submissions.data = data;
        this.addExtraAttributesToSubs();

        // retrieve all reviewer records
        myQuery = "SELECT * FROM REVIEWS, USERS WHERE reviewerID = email";  //"SELECT * FROM REVIEWS";
        fetch('http://localhost:9000/select', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: myQuery})   
        }).then(response => {
          response.json().then(data => {
            //console.log("server response for REVIEWS query: \n");
            //console.log(data);
            this.reviews = data;

            // add the rev to the sub they belong to
            this.reviews.forEach((rev, revIndex, revArr) => {
              this.submissions.data.forEach((sub, subIndex, subArr) => {
                if (rev.subID === sub.subID)
                  sub.revs.push(rev);
              });
            });

            this.calcSubStatsForMainPage();

            // FIX: TRYING to do it more efficiently (got confusing, so do it later. Brute force for now ^)
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

        // retrieve all reviewer nominations (and add in the nominated user's name)
        myQuery = "SELECT subID, reviewerID, fName, lName FROM NOMINATED, USERS WHERE reviewerID = email";  //"SELECT * FROM NOMINATED";
        fetch('http://localhost:9000/select', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: myQuery})   
        }).then(response => {
          response.json().then(data => {
            //console.log("server response for NOMINATED query: \n");
            //console.log(data);
            this.nominated = data;

            // add the nominated revs to the sub they belong to
            this.nominated.forEach((nom, i, arr) => {
              this.submissions.data.forEach((sub, j, arr2) => {
                if (nom.subID === sub.subID)
                  sub.noms.push(nom);
              });
            });  // FIX: could also do this the more efficient way, attempted above ^

            if(this.checkIfAllQueriesComplete()) 
              this.setState({allQueriesComplete: true});
          });
        });

        // retrieve all review requests (and add in the requestor's name)
        myQuery = "SELECT subID, reviewerID, fName, lName FROM REQUESTS, USERS WHERE reviewerID = email";  //"SELECT * FROM REQUESTS";
        fetch('http://localhost:9000/select', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: myQuery})   
        }).then(response => {
          response.json().then(data => {
            //console.log("server response for REQUESTS query: \n");
            //console.log(data);
            this.requests = data;

            // add the requested revs to the sub they belong to
            this.requests.forEach((req, i, arr) => {
              this.submissions.data.forEach((sub, j, arr2) => {
                if (req.subID === sub.subID)
                  sub.reqs.push(req);
              });
            });  // FIX: could also do this the more efficient way, attempted above ^

            if(this.checkIfAllQueriesComplete()) 
              this.setState({allQueriesComplete: true});
          });
        });

        // retrieve all users... not sure I'll actually use this
        myQuery = "SELECT * FROM USERS";
        fetch('http://localhost:9000/select', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: myQuery})   
        }).then(response => {
          response.json().then(data => {
            //console.log("server response for USERS query: \n");
            //console.log(data);
            this.users = data;
            this.getReviewers();
            
            if(this.checkIfAllQueriesComplete()) 
              this.setState({allQueriesComplete: true});
          });
        });

      });
    });
  }


  addExtraAttributesToSubs = () => {
    this.submissions.data.forEach((sub, i, arr) => { 
      sub.revs = [];  sub.noms = [];  sub.reqs = [];
    });
  }

  
  calcSubStatsForMainPage = () => {
    this.submissions.data.forEach((sub, index, arr) => {

      if (sub.revs.length < 3)  
        this.submissions.needingAssignments.push(index);
     
      else if (sub.revs.length > 4)  // just in case something went wrong elsewhere in the system
        alert("uh oh.. submission ID " + sub.subID + " has " + 
              sub.revs.length + " reviewers assigned to it.");  

      else if (sub.revDeadline === null)
        this.submissions.needingAssignments.push(index);

      else {  // sub.revs.length >= 3
        console.log(`nice: Submission ID '${sub.subID}' has 3+ reviewers already :)`);
        // check to see if all reviewers have completed their reviews
        // ...and therefore if this submission needs an editorial decision
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

      if (sub.status === "Author requests removal")
        this.submissions.withRemovalRequests.push(index);
    });
  }


  checkIfAllQueriesComplete = () => {
    if (this.submissions.data != null &&
        this.reviews != null &&
        this.nominated != null &&
        this.requests != null &&
        this.users != null)
      return true;

    return false;
  }




  mainMenuComp = () => {
    return (
      <div id="editorMainMenu">
        <h1>Welcome, Editor</h1>
        <br/>
        <button onClick = { (ev) => this.setState({currentPage: "articlesNeedingAssignments"})
                          } >{this.submissions.needingAssignments.length} articles need to have reviewers/dates assigned to them</button>
        <br/>
        <br/>
        {this.submissions.withRemovalRequests.length} Articles have removal requests
        <br/>
        <br/>
        {this.submissions.needingDecision.length} {this.submissions.needingDecision.length === 1 ? 
          "Article requires" : "Articles require"} your editorial decision (also need to account for expired review deadline ones)
        <br/>
        <br/>
        <br/>
        __God mode edit view of all articles__
        <br/>
        <br/>
        __Publish a completed academic journal__
        <br/>
        <br/>
        <br/>
        <br/>
        (cody: also make sure this guy has a special view of the article pages that lets him edit everything about it)
      </div>
    );
  }


  articlesNeedingAssignmentsComp = () => {
    if (! this.state.changesMade)  // only make this copy when initially loading page or after submitting changes
      this.submissionsCopy = JSON.parse(JSON.stringify(this.submissions));

    return (
      <>
        { this.state.changesMade && 
          <div style={{position: "fixed", top: "100px", right: "15px"}}> 
            <button onClick={ (evnt) => {this.applyChanges()} }>Apply Changes</button>
            <br/>
            <button onClick={ (evnt) => {this.undoChanges()} }>Undo Changes</button>
          </div> 
        }

        <div id="articlesNeedingAssignments">
          <br/>
          <h2>Articles that need reviewers/deadlines assigned to them:</h2>
          <br/>
          <Container style={{maxWidth: "1100px"}}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th style={{padding: '0 0 8px 10px'}}>#</th>
                  <th><button onClick={ (ev) => this.getTable("title") }>Title</button></th>
                  <th><button onClick={ (ev) => this.getTable("status") }>Status</button></th>
                  <th style={{maxWidth: '220px'}}><button onClick={ 
                                        (ev) => this.getTable("nominatedRevs") }>Nominated Reviewers</button></th>
                  <th style={{maxWidth: '220px'}}><button onClick={ 
                                        (ev) => this.getTable("requestedRevs") }>Requesting to Review</button></th>                      
                  <th style={{maxWidth: '260px'}}><button onClick={ (ev) => this.getTable("assignedRevs") }>Assigned Reviewers</button></th>
                  <th><button onClick={ (ev) => this.getTable("deadline") }>Review Deadline</button></th>
                </tr>
              </thead>
              <tbody>
                { this.getTable("") }
              </tbody>
            </Table>
          </Container>
        </div>
      </>
    );
  }


  applyChanges = () => {
    // retrieve all users... not sure I'll actually use this
    const myQuery = this.dbChangeQueries;
    fetch('http://localhost:9000/general', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: myQuery})   
    }).then(response => {
      response.text().then(msg => {
        console.log("server response from applying changes: \n" + msg);
        this.dbChangeQueries = "";
        this.setState({changesMade: false});
      });
    });
  }


  undoChanges = () => {
    this.submissions = JSON.parse(JSON.stringify(this.submissionsCopy));
    this.dbChangeQueries = "";
    console.log("changes undone; information reset!");
    this.setState({changesMade: false, currentPage: "reloadANAcomp"});
  }


  getTable = (sortBy) => {
    let tableRows = [];
    let rowIndex = 1;
    let subs = this.submissions.data;
    let subsCopyForDisplaying = this.submissionsCopy.data;
    let nom, req;
    let nomList = [], reqList = [];
    // FIX THIS: the below line was used to ensure sub's author didn't appear in the revs list to choose from (removed for speed)
    // let revOptionsForThisSub = this.reviewers.filter((x) => {return x.email !== sub.author});
    let revOptions = this.getRevDropdown(this.reviewers);
    let i;
    for (i of this.submissions.needingAssignments) {
      let index = i;  // important: had to use for the function defined below, to avoid it always binding i to last value.
      for (nom of subs[i].noms)
        nomList.push(<div key={nom.fName}>{nom.fName} {nom.lName},</div>);
      for (req of subs[i].reqs)
        reqList.push(<div key={req.fName}>{req.fName} {req.lName},</div>);
      tableRows.push(
        <tr key={rowIndex}>
          <td>{rowIndex++}</td>
          <td><a href={'comments?subID=' + subs[i].subID}>{subs[i].title}</a></td>
          <td>{subs[i].status}</td>
          <td style={{maxWidth: '220px'}}>{nomList}</td>
          <td style={{maxWidth: '220px'}}>{reqList}</td>
          <td style={{maxWidth: '260px'}}>{this.displayAssignedRevsCell(subs[i], subsCopyForDisplaying[i], revOptions)}</td> 
          <td style={{paddingTop: '25px'}}>{subsCopyForDisplaying[i].revDeadline === null ? <><div style={{textAlign: 'left'}}>Assign deadline: </div><input type="date" id="revDeadline" 
               onChange={(ev) => {this.myChangeHandler(subs[index], ev)}} name="revDeadline" min="2020-01-01" 
               max="9999-01-01"/></> : String(subsCopyForDisplaying[i].revDeadline).substring(0,10)}</td> 
        </tr> 
      );
      nomList = []; reqList = [];
    }
    return tableRows;
  }


  // show revs AND (4 - subs[i].revs.length) input select boxes of reviewers to select
  displayAssignedRevsCell = (sub, subsCopyForDisplaying, revOptions) => {
    let currentRevs = [];
    for (let rev of subsCopyForDisplaying.revs)
      currentRevs.push(<div key={rev.fName}>{rev.fName} {rev.lName},</div>);
    let maxRevsLeftToAssign = (4 - subsCopyForDisplaying.revs.length);
    let revSelect = [];
    for (let i = 0; i < maxRevsLeftToAssign; i++) {
      revSelect.push(
        <select key={'cal'+i} type='email' name='revToAdd' defaultValue='selectMsg' 
                onChange={(ev) => {this.myChangeHandler(sub, ev)}}> 
          {revOptions}
        </select>
      );
    }
    return ( <>{currentRevs} {revSelect}</> );
  }


  getRevDropdown(revOptions) {
    let optionRows = [];
    optionRows.push(<option key={"selectMsg"} value={'selectMsg'} disabled> &nbsp; - select reviewer -&nbsp; &nbsp; </option>);
    optionRows.push(<option key={"blankLine"} value={'blankLine'} disabled></option>);
    let keyTag = 1;
    for (let reviewer of revOptions)
      optionRows.push(<option key={"rev" + keyTag++} value={reviewer.email}>{reviewer.fName} {reviewer.lName}</option>);

    return optionRows;
  }


  getReviewers = () => {
    let user;
    for (user of this.users)
      if (user.isReviewer)
        this.reviewers.push(user);
  }


// FIX THIS: things are generally working well now, but there's a problem here: 
// if I choose from a dropdown menu, then I change my mind and change my selection from that same dropdown, it has now
// called this method twice, and two entries will be entered into the db and the internal data structure, which we don't want.

// ALSO: it should check to make sure that reviewer you've selected hasn't already been assinged to that submission (isn't a member of sub.revs)
  myChangeHandler = (sub, event) => {
    let val =  event.target.value;
    if (event.target.name === "revDeadline") {
      sub.revDeadline = val;
      this.dbChangeQueries += `UPDATE SUBMISSION SET revDeadline = '${val}' WHERE subID = ${sub.subID}; `;
      // BOOKMARK:  right here, it also needs to update the revDeadline for any REVIEWS entries that share this subID!
    } else {  // else new reviewer assigned to sub
      const user = this.users.find(u => u.email === val);
      const rev = {subID: sub.subID, reviewerID: val, deadline: sub.revDeadline, recommendation: null, comment: null, fName: user.fName, lName: user.lName};
      sub.revs.push(rev);
      this.dbChangeQueries += `INSERT INTO REVIEWS VALUES (${sub.subID}, '${val}', '${sub.revDeadline}', NULL, NULL); `;
    }
    if (! this.state.changesMade)
      this.setState({changesMade: true});
  }


// DO SOMETHING LIKE THIS WHEN USER CLICKS AN APPLY BUTTON SOMEHWERE ON THE PAGE
//   applyChanges = (ev) => {
//     const myQuery = "UPDATE SUBMISSION  SET status = 'Author requests removal' WHERE subID = " + this.state.subID;
//     fetch('http://localhost:9000/update', {
//     method: 'POST',
//     headers: {'Content-Type': 'application/json'},
//     body: JSON.stringify({query: myQuery})  // convert the state to JSON and send it as the POST body 
//   }).then(response => {
//       response.text().then(msg => {
//         this.setState({serverResponse: JSON.stringify(msg)});
//         console.log("Result of UPDATE query on SUBMISSION: " + msg);
//       });
//     });
// }



// good place for handling side-effect logic, like doing something based on the current state, apparently
  componentDidUpdate = () => {
    if (this.state.currentPage === "reloadANAcomp")
      this.setState({currentPage: "articlesNeedingAssignments"});
  }


  menuSwitch = () => {
    switch(this.state.currentPage) {
      case "main":
        return this.mainMenuComp();
      case "articlesNeedingAssignments":
        return this.articlesNeedingAssignmentsComp();
      case "reloadANAcomp":
        // this.setState({currentPage: "articlesNeedingAssignments"});  
        // ^ moved this to componentDidUpdate() (above) to handle the warning
        break;
      default: 
        return this.mainMenuComp();
    }
  }




  render() {
    return (
      <div id="editor-page">
        { this.state.allQueriesComplete && this.menuSwitch() }
      </div>
    );
  }


} export default Editor;