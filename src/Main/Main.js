import React, { Component } from 'react';
import { HashRouter, Route, Link, useLocation } from "react-router-dom";

import Test from '../Test';
import PixiViz from '../PixiViz';
import VizView from '../VizView';
import PIXIPerformancesTest from '../PIXIPerformancesTest';
import Italy from '../Italy';

class Main extends Component {
  render() {
    const lang = navigator.language
    console.log(lang)
    return <div className="main">
      <HashRouter basename="/">
        <Route exact path="/">
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
              </ul>
            </nav>
          }
        </Route>
        <Route path="/svg">
          <Test />
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
      </HashRouter>
    </div>;
  }
}

export default Main;
