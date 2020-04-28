import React from 'react';



class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <div style={{width: "700px", textAlign: "center", margin: "100px auto"}}>
          <br/>
          (try to make all of these SQl calls right when the component first loads... use that special method)
          <br/>
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