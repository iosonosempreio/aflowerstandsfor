import React, { Component } from 'react';
import { HashRouter, Route, Link, useLocation } from "react-router-dom";

class Info extends Component {
  render() {
    return <div>
    <div className="header">
      <Link to="/"><h6 style={{textAlign: 'left'}}>Home</h6></Link>
      <h4 style={{textAlign: 'center'}}>aflowerstandsfor</h4>
      <Link to="/info"><h6 style={{textAlign: 'right'}}>Info</h6></Link>
    </div>

    <div className="title-box">
      <h1>A flower stands for a CoronaVirus Diseaese - 19 case in</h1>
    </div>
    </div>;
  }
}

export default Info;
