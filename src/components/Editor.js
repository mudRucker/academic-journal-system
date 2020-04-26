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
          Hey there. What do you want?
        </div>
      </div>
      
    );
  }
}


export default Editor;