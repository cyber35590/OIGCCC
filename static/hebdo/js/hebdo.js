

class Hebdo {
    constructor(data={}){
        Object.assign(this, data)
        this.pages = {}
        this.columns={}
        for(var i =1; i<=3; i++){
            this.pages[i]={}
            for(var j=1; j<=2; j++){
                var page_root = $(".page-"+i+" > .page-content > .pub-col-"+j);
                var tmp = new HebdoColumn(page_root, j, STYLES_PARAMS[i-1][j-1], this);
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
var panel;
var hebdo;
$(document).ready(function(){
    $("#hebdo_root").append(new_hebdo(data.hebdo))
    hebdo = new Hebdo()
    hebdo.pages[1][1].append(data.articles[3])
    hebdo.pages[1][2].append(data.articles[1])
    hebdo.pages[1][2].append(data.articles[2])
    hebdo.pages[1][2].append(data.articles[4])


const BORDER_SIZE = 100;
panel = $("#hebdo_root")[0]
var sep = $(".sep")[0]
let m_pos;
function resize(e){
  const dx = e.x - m_pos;
  m_pos = e.x;
  panel.style.width = (parseInt(getComputedStyle(panel, '').width) + dx) + "px";
}

sep.addEventListener("mousedown", function(e){
  console.log("ici");
    m_pos = e.x;
    document.addEventListener("mousemove", resize, false);
}, false);

document.addEventListener("mouseup", function(){
    document.removeEventListener("mousemove", resize, false);
}, false);


})


