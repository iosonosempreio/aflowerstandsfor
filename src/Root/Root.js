import React, { Component } from 'react';
import { HashRouter, Route, Link, useLocation } from "react-router-dom";

import './Root.css';

import Test from '../Test';
import PixiViz from '../PixiViz';
import VizView from '../VizView';
import PIXIPerformancesTest from '../PIXIPerformancesTest';
import Italy from '../Italy';
import Info from '../Info';

import 'victormono';

class Root extends Component {
  constructor(props){
    super(props);
    this.state = {
      language:this.props.language
    }
    this.changeLanguage = this.changeLanguage.bind(this);
  }
  changeLanguage(lang) {
    this.setState({language:lang})
  }
  render() {
    // console.log(this.props.language)
    return <HashRouter basename="/">
        <Route exact path="/">

          <div className="header">
            <Link to="/"><h6 style={{textAlign: 'left'}}>Home</h6></Link>
            <h4 style={{textAlign: 'center'}}>aflowerstandsfor</h4>
            <Link to="/info"><h6 style={{textAlign: 'right'}}>Info</h6></Link>
          </div>

          <div className="selector languages">
            <button type="button" onClick={()=>{this.changeLanguage('hi-HI')}}>hindi</button>
            <button type="button" onClick={()=>{this.changeLanguage('it-IT')}}>italian</button>
            <button type="button" className="active" onClick={()=>{this.changeLanguage('en-US')}}>english</button>
          </div>

          <div className="title-box">
            <h1>A flower stands for a CoronaVirus Diseaese - 19 case in</h1>
          </div>

          <Link className="country" to="/india"><h3>India</h3></Link>
          <Link className="country" to="/italy"><h3>Italy</h3></Link>
          <Link className="country" to="/canada"><h3>Canada</h3></Link>

        </Route>
        <Route path="/menumenu">
          {
            <nav>
              <ul>
                <li>
                  <Link to="/performances">Testing PIXIjs performances</Link>
                </li>
                <li>
                  <Link to="/viz">Visualization</Link>
                </li>
                <li>
                  <Link to="/italy">Italy</Link>
                </li>
                <li>
                  <Link to="/styles">Styles</Link>
                </li>
              </ul>
            </nav>
          }
        </Route>
        <Route path="/svg">
          <Test />
        </Route>
        <Route path="/info">
          <Info />
        </Route>
        <Route path="/pixi">
          <PixiViz />
        </Route>
        <Route path="/viz">
          <VizView />
        </Route>
        <Route path="/performances">
          <PIXIPerformancesTest />
        </Route>
        <Route path="/italy">
          <Italy />
        </Route>
        <Route path="/styles">
          <h1>Header 1</h1>
          <h2>Header 2</h2>
          <h3>Header 3</h3>
          <h4>Header 4</h4>
          <h5>Header 5</h5>
          <h6>Header 6</h6>
        </Route>
      </HashRouter>;
  }
}

export default Root;
