import React from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allQueriesComplete: false,
      currentPage: "main",
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



  // grab all the data from the db when the page first loads
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

            this.calcSubStatsForMainPage();

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


  calcSubStatsForMainPage = () => {
    this.submissions.data.forEach((sub, index, arr) => {

      if (sub.revs.length < 3)  
        this.submissions.needingRevs.push(index);
      else {
        //this.submissions.haveAllRevs.push(index);
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

      if (sub.revDeadline === null)
        this.submissions.needingDeadline.push(index);

      if (sub.status === "Author requests removal")
        this.submissions.withRemovalRequests.push(index);

      // just in case something went wrong elsewhere in the system
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




  mainMenuComp = () => {
    return (
      <>
        <button onClick = { (ev) => this.setState({currentPage: "articlesNeedingRevsTable"})} >{this.submissions.needingRevs.length} Articles need Reviewers assigned to them</button>
        <br/>
        {this.submissions.needingDeadline.length} Articles need a deadline set
        <br/>
        {this.submissions.withRemovalRequests.length} Articles have removal requests
        <br/>
        <br/>
        X Reviewer nominations require your attention
        <br/>
        X Review requests require your attention
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
      </>
    );
  }


  articlesNeedingRevsTableComp = () => {
    return (<>remove this when you uncomment the below stuff</>
      // <Container className='container-override'>
      //   <Table striped bordered hover>
      //     <thead>
      //       <tr>
      //         <th style={{padding: '0 0 8px 10px'}}>#</th>
      //         <th><button onClick={ (ev) => this.getTable("title") }>Research Title</button></th>
      //         <th><button onClick={ (ev) => this.getTable("status") }>Status</button></th>
      //         <th><button onClick={ (ev) => this.getTable("nominatedRevs") }>Nominated Reviewers</button></th>
      //         <th><button onClick={ (ev) => this.getTable("assignedRevs") }>Assigned Reviewers</button></th>
      //         <th><button onClick={ (ev) => this.getTable("deadline") }>Deadline</button></th>
      //       </tr>
      //     </thead>
      //     <tbody>
      //       { this.getTable("") }
      //     </tbody>
      //   </Table>
      // </Container>
    );
  }


  getTable = (sortBy) => { // BOOKMARK. gotta mod this so it works for this Component (taken from ListSubs)
    let myQuery = "";
    switch(sortBy) {
      case "title":
        myQuery = "SELECT S.subID, S.title, S.description, S.status, S.fileURL, T.subID AS TopicID," +
                  "T.topic FROM SUBMISSION S LEFT JOIN TOPICS T ON S.subID = T.subID ORDER BY S.title";
        break;
      case "description":
        myQuery = "SELECT S.subID, S.title, S.description, S.status, S.fileURL, T.subID AS TopicID," +
                  "T.topic FROM SUBMISSION S LEFT JOIN TOPICS T ON S.subID = T.subID ORDER BY S.description";
        break;
      case "topic": 
        myQuery = "SELECT S.subID, S.title, S.description, S.status, S.fileURL, T.subID AS TopicID," +
                  "T.topic FROM SUBMISSION S LEFT JOIN TOPICS T ON S.subID = T.subID ORDER BY T.topic";
        break;
      case "status":
        myQuery = "SELECT S.subID, S.title, S.description, S.status, S.fileURL, T.subID AS TopicID," +
                  "T.topic FROM SUBMISSION S LEFT JOIN TOPICS T ON S.subID = T.subID ORDER BY S.status";
        break;
      default:
        myQuery = "SELECT S.subID, S.title, S.description, S.status, S.fileURL, T.subID AS TopicID," +
                  "T.topic FROM SUBMISSION S LEFT JOIN TOPICS T ON S.subID = T.subID ORDER BY S.title";
    }
    if (sortBy === this.currentSort) {
      this.toggleCount++;
      if (this.toggleCount % 2 === 1)
        myQuery += " DESC";
    } else {
      this.toggleCount = 0;
      this.currentSort = sortBy;
    }
    
    fetch('http://localhost:9000/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: myQuery })
    }).then(response => {
      response.json().then(data => {
        let subInfo = JSON.parse(JSON.stringify(data));
        //console.log(data);
        const numSubs = subInfo.length;
        let tableRows = [];
        let origIndex = 0;
        let rowIndex = 1;
        for (let i = 0; i < numSubs; i++) {
          origIndex = i;
          this.setState({subID: subInfo[origIndex].subID});
          while ( (i+1 < numSubs)  &&  (subInfo[i+1].subID === subInfo[origIndex].subID) ) {
            subInfo[origIndex].topic += ", " + subInfo[i+1].topic;
            i++;
          }

        tableRows.push(
          <tr key={rowIndex}>
            <td>{rowIndex}</td>

            <td><a href={'comments?subID=' + subInfo[origIndex].subID}>{subInfo[origIndex].title}</a></td>
            {/* <Nav.Link href="/comments">{subInfo[origIndex].title}</Nav.Link> */}
            <td style={{maxWidth: '570px'}}>{subInfo[origIndex].description}</td>
            <td>{subInfo[origIndex].topic}</td>
            <td>{subInfo[origIndex].status}</td>
            <td><a href={subInfo[origIndex].fileURL}>download</a></td>
          </tr>);
          rowIndex++;
        }
        this.setState({tableRows: tableRows});
      });
    });
  }


  menuSwitch = () => {
    switch(this.state.currentPage) {
      case "main":
        return this.mainMenuComp();
      case "articlesNeedingRevsTable":
        return this.articlesNeedingRevsTableComp();
      default: 
        return this.mainMenuComp();
    }
  }




  render() {
    return (
      <div id="editor-page">
        <div style={{width: "700px", textAlign: "center", margin: "50px auto"}}>
          <h1>Welcome, Editor (name)</h1>
          <br/>
          { this.state.allQueriesComplete && this.menuSwitch() }
        </div>
      </div>
    );
  }


} export default Editor;