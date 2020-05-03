import React from 'react';
import './App.css';
import Root from './Root/Root'
import Info from './Info/Info'

function App() {
  return (
    <div className="App">
      <Root language={navigator.language}/>
    </div>
  );
}

export default App;
