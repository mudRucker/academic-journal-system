import React from 'react';
import Container from 'react-bootstrap/Container';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
//import commentsJson from '../data/test_data.json';


class CommentsTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      user: props.userEmail,
      queriesFinished: false
    };
    this.mySubsReviewData = null;
  }



  componentDidMount() {
    // I want all subs from this author + the reviews for each of those subs
    const myQuery = "SELECT S.*, R.subID as rSubID, R.reviewerID, R.deadline, R.recommendation, " +
                    "R.comment, U.fName, U.lName   FROM SUBMISSION S   LEFT JOIN REVIEWS R ON S.subID = R.subID " +
                    "LEFT JOIN USERS U ON R.reviewerID = U.email   WHERE S.author = '" + this.state.user + "'" +
                    "ORDER BY S.subID";                                 
    fetch('http://localhost:9000/select', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: myQuery})   
    }).then(response => {
      response.json().then(data => {
        this.mySubsReviewData = this.combineRelatedRevData(data);
        console.log(this.mySubsReviewData);
        this.setState({queriesFinished: true})
      });
    });
  }

  combineRelatedRevData(dbTuples) {
    let subID = -1;
    let revsCombinedData = [];
    let revsOfASubmission = [];
    let entry;
    for (entry of dbTuples) {
      if (entry.subID !== subID) {
        subID = entry.subID;
        revsCombinedData.push(revsOfASubmission);
        revsOfASubmission = [];
      }
      revsOfASubmission.push(entry);
    }
    revsCombinedData.push(revsOfASubmission);  // handle the last one
    revsCombinedData.shift();  // remove the first element (it's empty)
    return revsCombinedData;
  }



  GetCommentBody(index) {
    let revs = this.mySubsReviewData;
    let comments = [];
    for (let i = 0; i < revs[index].length; i++) {
      comments.push(<Tab.Pane key={i} eventKey={"#link" + revs[index][i].subID + "-" + i.toString()}>{revs[index][i].comment}<br/>
                <strong className="d-inline">Recommendation: </strong><u className="d-inline">
                {revs[index][i].recommendation}</u></Tab.Pane>);
    }
    return comments;
  }

  GetReviewerNameDate(index) {
    let revs = this.mySubsReviewData;
    let reviewers = [];
    for (let i = 0; i < revs[index].length; i++) {
      reviewers.push(<ListGroup.Item action key={i} href={"#link" + revs[index][i].subID + "-" + i.toString()}>{revs[index][i].fName + 
        " " + revs[index][i].lName + " - Rev. deadline: " + String(revs[index][i].deadline).substring(0,10)}</ListGroup.Item>);
    }
    return reviewers;
  }

  GetSubmitDate(index) {
    return String(this.mySubsReviewData[index][0].subDate).substring(0,10);
  }

  GetJournalStatus(index) {
    return this.mySubsReviewData[index][0].status;
  }

  showCommentsMadeOnMySubmissions() {
    let everything = [];
    for (let i = 0; i < this.mySubsReviewData.length; i++) {
      everything.push(
        <Container className="comment-container" key={"k"+ String(i)}>
          <Row>
            <Col className="text-right">Submission date:</Col>
            <Col>{ this.GetSubmitDate(i) }</Col>
          </Row>

          <Row>
            <Col className="text-right">Status:</Col>
            <Col>{ this.GetJournalStatus(i) }</Col>
          </Row><br/>

          <h4 className="pt-5, text-center">Reviewer feedback</h4><br/>

          <Tab.Container id="list-group-tabs-example" defaultActiveKey="#link1">
            <Row>
              <Col xl={{ span: 4, offset: 2}} lg={{ span: 4, offset: 2 }} className="text-center">
                <ListGroup className="">
                  { this.GetReviewerNameDate(i) }
                </ListGroup>
              </Col>

              <Col xl={4} lg={4}>
                <Tab.Content>
                  { this.GetCommentBody(i) }
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Container>
      );
    }
    return everything;
  }



  render () {
    return (
      <>
      <h1 className="text-center">Your submissions:</h1><br/>
      { this.state.queriesFinished && this.showCommentsMadeOnMySubmissions() }
      </>
    );
  }

}

export default CommentsTable;

// I want it to look like this, btw:

// Your submissions:

// -------- 1st ---------------------
// Title:  x
// Submission date:  x
// Status:  x

// Review comments to date:

// XXX


// ------- 2nd -----------------------