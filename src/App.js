import React from 'react';
import './App.css';
import Root from './Root/Root'

function App() {
  return (
    <div className="App">
      <Root language={navigator.language}/>
    </div>
  );
}

export default App;
