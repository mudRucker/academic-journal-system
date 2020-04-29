import React from 'react';



class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
    this.submissions = {
      data: null,
      needingRevs: -1,
      needingDeadline: -1,
      needingDecision: -1,
      withRemovalRequests: -1
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
        this.calcStats();
      });
    });

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
      });
    });
  }



  calcStats = () => {
    this.submissions.needingRevs = 0;
    this.submissions.needingDeadline = 0;
    this.submissions.needingDecision = 0;
    this.submissions.withRemovalRequests = 0;

    this.submissions.data.forEach((item, index, arr) => {
      console.log(item.title);  // BOOKMARK. perform your actual stats calculations here
    });                         // (and not this dummy, test one)
  }



  render() {
    return (
      <div>
        <div style={{width: "700px", textAlign: "center", margin: "100px auto"}}>
          <br/>
          __X Articles need Reviewers assigned to them__
          <br/>
          __Y Articles need to have a deadline set__
          <br/>
          __Z Articles require your editorial decision__
          <br/>
          __W Articles have a removal request from their author__
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