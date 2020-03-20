import React, { Component } from 'react';
import html2canvas from 'html2canvas';

import Utilities from '../Utilities/Utilities';

class TexturesGeneration extends Component {

  componentDidMount() {
    const icons = document.querySelectorAll('#textures-generation>span');
    for (let i=0; i<icons.length; ++i) {
      html2canvas(icons[i]).then(function(canvas) {
        Utilities.textures[icons[i].id] = canvas.toDataURL("image/png")
        if (Object.keys(Utilities.textures).length === Object.keys(Utilities.emoji_dictionary).length) {
          console.log(Utilities.textures);
        }
      });
    }
  }

  render() {
    return <div id="textures-generation" style={{fontSize:'1rem',position:'absolute', top:'-100px'}}>

      { Object.keys(Utilities.emoji_dictionary).map(d=>{
        console.log(d, Utilities.emoji_dictionary[d])
        return <span id={d} key={`emoji-${d}`}>{Utilities.emoji_dictionary[d]}</span>
      }) }

    </div>;
  }
}

export default TexturesGeneration;
