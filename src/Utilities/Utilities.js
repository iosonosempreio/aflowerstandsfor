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
    "isolamento_domiciliare": '💮',
    "ricoverati_con_sintomi": '🌼',
    "terapia_intensiva": '🌸',
    "deceduti": '🌺'
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
