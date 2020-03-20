const Utilities = {}

Utilities.emoji = {
    size: 20
}

Utilities.clampZoomOptions = {
    minScale:0.5,
    maxScale:10
}

Utilities.emoji_dictionary = {
    "dimessi_guariti": '🍀',
    "isolamento_domiciliare": '🏠',
    "ricoverati_con_sintomi": '🌼',
    "terapia_intensiva": '🌸',
    "deceduti": '🌷'
};

Utilities.emoji_images_dictionary = {
    "dimessi_guariti": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/four-leaf-clover_1f340.png',
    "isolamento_domiciliare": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/blossom_1f33c.png',
    "ricoverati_con_sintomi": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/sunflower_1f33b.png',
    "terapia_intensiva": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/cherry-blossom_1f338.png',
    "deceduti": 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/144/whatsapp/238/hibiscus_1f33a.png'
};

Utilities.categories = [
    "ricoverati_con_sintomi",
    "terapia_intensiva",
    // "totale_ospedalizzati",
    "isolamento_domiciliare",
    // "totale_attualmente_positivi",
    // "nuovi_attualmente_positivi",
    "dimessi_guariti",
    "deceduti",
    // "tamponi"
  ]

Utilities.map = {
    width: 768,
    height:1024
}

export default Utilities;
