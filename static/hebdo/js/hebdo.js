

class Hebdo {
    constructor(data={}){
        Object.assign(this, data)
        this.pages = {}
        this.columns={}
        for(var i =1; i<=3; i++){
            this.pages[i]={}
            for(var j=1; j<=2; j++){
                var tmp = new HebdoColumn($(".page-"+i+" > .page-content > .pub-col-"+j), j, null, this);
                this.pages[i][j]=tmp;
                this.columns[tmp.data_col_id]=tmp;
            }
        }
        this.root = $("#hebdo_root")
    }

    get_col(page, which=null){
        if(which==null) return this.columns[page];
        if(typeof which == "string") which = (which.toLowerCase()=="little")?1:2;
        return this.pages[page][which];
    }


}

var hebdo;
$(document).ready(function(){
    $("#hebdo_root").append(new_hebdo(data.hebdo))
    hebdo = new Hebdo()
    hebdo.pages[1][1].add_article(data.articles[3])
    hebdo.pages[1][2].add_article(data.articles[0])
})

