const Utilities = {}

Utilities.emoji = {
    size: 20
}

Utilities.clampZoomOptions = {
    minScale:0.01,
    maxScale:7
}

Utilities.emoji_dictionary = {
    "dimessi_guariti": '🍀',
    "isolamento_domiciliare": '⚪️',
    "ricoverati_con_sintomi": '🌼',
    "terapia_intensiva": '🌸',
    "deceduti": '🌺'
};

Utilities.emoji_images_dictionary = {
    "dimessi_guariti": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/four-leaf-clover_1f340.png',
    "isolamento_domiciliare": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/blossom_1f33c.png',
    "ricoverati_con_sintomi": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/sunflower_1f33b.png',
    "terapia_intensiva": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/cherry-blossom_1f338.png',
    "deceduti": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/hibiscus_1f33a.png'
};

// categories names cant start with same 4 beginning letters so that substring(0,4) returns all different values
Utilities.categories = [
    "deceduti",
    "terapia_intensiva",
    "ricoverati_con_sintomi",
    "isolamento_domiciliare",
    "dimessi_guariti",
]

Utilities.categories_en = [
    "deceased",
    "intensive_care",
    "hospitalized",
    "home_isolation",
    "recovered"
]

Utilities.category2english = {
    "deceduti":"deceased",
    "terapia_intensiva":"intensive_care",
    "ricoverati_con_sintomi":"hospitalized",
    "isolamento_domiciliare":"home_isolation",
    "dimessi_guariti":"recovered"
}

Utilities.map = {
    width:768,
    height:1024,
    scale:30000
}

Utilities.easeInOutCubic=function(t){
    return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
}

export default Utilities;
