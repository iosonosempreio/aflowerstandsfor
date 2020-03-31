import React from 'react';
import { HashRouter, Route, Link } from "react-router-dom";
import './App.css';

import Test from './Test';
import PixiViz from './PixiViz';
import VizView from './VizView';

function App() {
  return (
    <div className="App">
      <HashRouter basename="/">
        <Route exact path="/">
          {
            <nav>
              <ul>
                <li>
                  <Link to="/viz">Visualization</Link>
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
      </HashRouter>
    </div>
  );
}

export default App;
