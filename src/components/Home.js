import React from 'react';
import CommentsTable from '../components/CommentsTable.js';
import ListSubs from './ListSubs.js';
//import { render } from '@testing-library/react';


class Home extends React.Component {

  render() {
    return (
        <div id="outer-container">
          
          <div id="submission-summary" className="pt-5">
            <CommentsTable userEmail={this.props.userEmail}/>
          </div>

          <div style={{margin: '120px auto 30px', textAlign: 'center'}}><h2>Viewing: &nbsp;All Research Submissions</h2></div>
          <ListSubs />
          <br/>
          <br/>
          <br/>
          <br/>

        </div>
    );
  }
}

export default Home;