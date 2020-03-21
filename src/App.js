import React from 'react';
import { HashRouter, Route, Link } from "react-router-dom";
import './App.css';

import Test from './Test';
import PixiViz from './PixiViz';

function App() {
  return (
    <div className="App">
      <HashRouter basename="/">
        <Route exact path="/">
          {
            <nav>
              <ul>
                <li>
                  <Link to="/svg">SVG Version</Link>
                </li>
                <li>
                  <Link to="/pixi">PIXIjs version</Link>
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
      </HashRouter>
    </div>
  );
}

export default App;
