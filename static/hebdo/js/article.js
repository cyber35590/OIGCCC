
function new_article(data){
    console.log("new_article", data)
    return Template.instanciate("template-hebdo-article", data);
}



/**
    Les propriétés pour placer automatiquement un article
*/
class ArticlePlacementConfig {
    constructor(data={}){
        this.flags={}
        this.articleid=null;
        this.style = null;
        this.height = {

        }
        Object.assign(this, data);

    }
}

class PlacementConfig {
    constructor(data={}){


    }
}

class Article {
    constructor(data) {
        Object.assign(this, data);
    }
}


class Placement {
    constructor(){

    }
}

