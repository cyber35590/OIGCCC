
class StyleParam {
    constructor(current, fixe=[]){
        this.fixe=fixe;
        this.current=current;
        this.all_class=[]

        for(var i in this.fixe)  this.all_class.push(this.fixe[i].split(" "));
        for(var i in this.current)  this.all_class.push(this.current[i].split(" "));

    }

    set_class(elem, no_forced_count){
        //elems.removeClass(this.all_class);
        if(no_forced_count<this.fixe.length){
            elem.addClass(this.fixe[no_forced_count].split(" "));
            return;
        }
        if(!this.current.length) return;
        elem.addClass(this.current[(no_forced_count-this.fixe.length)%this.current.length].split(" "));
    }


    remove_class(elems){

    }
}

var STYLES_PARAMS =[
    [
        new StyleParam(["article-1-col"],["article-calendrier"]),
        new StyleParam(["article-2-col style-1"])
    ],
    [
        new StyleParam(["article-1-col style-1", "article-2-col style-3"]),
        new StyleParam(["article-2-col style-2", "article-2-col style-1"])
    ],
    [
        new StyleParam(["article-1-col style-1", "article-2-col style-2"]),
        new StyleParam(["article-2-col style-1", "article-2-col style-1"])
    ]
]

class  StyledArticle {

    constructor(data){
        Object.assign(this, data.article);
        this.style=Object.assign({
                style: {
                    force: null
                },
                image : {
                    show: null,
                    fileid: null,
                    placement: null
                }
            }, data.style)
    }

    get_json(){
        return this.style;
    }

}


class StyleManager{
    constructor(app, data){
        this.app = app;
        this.pages=[ [[], []], [[], []], [[], []] ]
    }

    //
    add(auid_or_srtyle){
        if(Number.isInteger(auid_or_srtyle)){
            var article = this.app.get_raw_article(auid_or_srtyle);
            this.styles[article.id] = new StyledArticle({article: article});
        }else{
            this.styles[article.id] = new StyledArticle(auid_or_srtyle)
        }
    }

    get(id){

    }

}


function new_cal(data){
    return Template.instanciate("template-hebdo-cal", data);
}

function date_interval_to_string(debut, fin){
    var date = "Du ";
    debut = debut.split("-");
    fin = fin.split("-");
    date+=debut[2]+" ";
    fin[2]=parseInt(fin[2])
    debut[2]=parseInt(debut[2])
    if(debut[1]!=fin[1]){
        date+=mois[parseInt(debut[1])]+" "
    }
    if(debut[0]!=fin[0]){
        date+=debut[0]+" "
    }
    date+="au "+fin[2]+" "+mois[parseInt(fin[1])]+" "+fin[0];

    return date;
}

function new_hebdo(data){
    var date = date_interval_to_string(data.date_debut, data.date_fin);
    var data = Object.assign({}, data)
    data = Object.assign(data, {date_interval: date})
    return Template.instanciate("template-hebdo-root", data);
}

function get_article(id){

}

function _get_col_from_id(manager, id){
    return manager.get_col(id);
}

function get_col_width(elem){
    if(elem.hasClass("pub-col-1")) return 1;
    if(elem.hasClass("pub-col-2")) return 2;
    if(elem.hasClass("pub-col-3")) return 3;
    return 0;
}

class ArticleContainer{
    constructor(elem, app){
        this.root=elem;
        this.app=app;
        this.root=elem;
        this.app=app;
        this.data_col_id="_"+Utils.newid(32)
        this.ncol=get_col_width(elem)
        this.height=elem.height();
        this.sep_class="___"+Utils.newid();
        this.root.data("colid", this.data_col_id);
        this.children=[]
        this.children_index={}
    }

    find_index_by_elem_id(elemid){
        for(var i=0; i<this.children.length;i++)
            if(elemid == this.children[i].elemid) return i;
       return -1;
    }

    find_by_id(elemid){
        for(var i=0; i<this.children.length;i++)
            if(elemid == this.children[i].elemid) return i;
       return null;
    }

    prepare_element(elem, data, index){
        var self = this;
        elem.data("colid", this.data_col_id);
        elem.data("id", data.id);
        elem.attr("draggable", true);
        elem.on("dragstart", function(evt){
            $(".draggable").addClass("drag-start");
            var out = {id: self.data_col_id,  id: data.id, container: self.data_col_id};
            evt.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(out));
        });
        elem.on("dragend", function(evt){
            $(".drag-start").removeClass("drag-start")
            $("drag-over").removeClass("drag-over")
        });
    }


    find(...params){return this.root.find(...params)}

    append(data){
        this.insert(data, this.children.length)
    }

    _new_element(data, index){
        var elem = this.create_article_element(data, index);
        this.prepare_element(elem, data, index);
        return elem;
    }

    insert(data, index) {
        if(this.children.length) this.root.append($('<div class="'+this.sep_class+'"></div>'))
        var elem = this._new_element(data, index);
        var dst = this.find(".vseparator[data-index="+index+"]")

        var row_data = { data: data, elem: elem, id: data.id};
        this.children.splice(index, 0, row_data)
        this.children_index[row_data.id] = row_data;
        dst.after(elem)
        this.add_sep(index+1);
        this.update();
        return true;
    }

    remove(dataid){
        var data = this.children_index[dataid].data;
        var elem = this.children_index[dataid].elem;
        var i = parseInt(elem.data("index"));
        this.children.splice(i,1);
        delete this.children_index[dataid]
        elem.next().remove();
        elem.remove();
        this.update();
        return data;
    }

    get_json(){
        var out = []
        for(var i in this.children){
            var data = this.children[i].data;
            out.push({
                auid: data.id, //article unique id
                placement: data.placement
            })
        }
        return out;
    }


    clear(){
        this.root.empty();
        this.children=[]
        this.children_index={}
    }

    set_json(js){
        this.clear();
        for(var i in js){
            this.append(js);
        }
    }

    //
    on_drag_over(){}
    on_drag_leave(){}
    show_drag_items(){}
    hide_drag_items(){}


    create_article_element(article){}
    udpate(){}

}

class HebdoColumn extends ArticleContainer {
    constructor(root_elem, styleparam, app){
        super(root_elem, app);
        this.style_param=styleparam
        this.add_sep();
    }

    add_sep(index=null){
        if(index==null) index=this.children.length;
        var sep = $('<div class="vseparator draggable" data-host-id="'+this.data_col_id+'" data-index="'+index+'" > </div>');
        var self = this;

        sep.on("drop", function(ev){ self.drop_from(ev)})
        sep.on("dragover", function(ev){
            var x = $(ev.target);
            x.removeClass("drag-start");
            x.addClass("drag-over");
            ev.preventDefault();
        })

        sep.on("dragleave", function(ev){
            var x = $(ev.target)
            x.removeClass("drag-over")
            x.addClass("drag-start")
        })

        if(index>0) this.children[index-1].elem.after(sep);
        else this.root.append(sep);
    }

    update(){
        var self = this;
        var i = 0;
        this.find(".vseparator").each(function(_, e){
            $(e).data("index", i);
            i+=1;
        });

        var noforce_count = 0;
        for(var i in this.children){
            var data = this.children[i].data;
            var elem = this.children[i].elem;
            this.style_param.remove_class(elem);
            this.children[i].elem.data("index", i);
            if( /*data.style && data.style.force*/ true){ //vérifier si le style est forcé ou non
                this.style_param.set_class(elem, noforce_count);
                noforce_count++;
            }else{
                this.style_param.remove_class(elem);
                elem.addClass(data.style.force.split())
            }
        }
    }


    create_article_element(data, index){
        return Template.instanciate("template-hebdo-article", data);
    }

    get_free_space(){
        var left = this.height;
        this.find(".article").each(function(i, e){
            e=$(e);
            left-=e.outerHeight();
        })
        return left;
    }

    clear(){ super.clear(); this.add_sep(); }

    drop_from(evt) {
        var divtarget = $(evt.target);
        divtarget.removeClass("drag-over");
        divtarget.addClass("drag-start");
        var index = parseInt(divtarget.data("index"));
        var data = JSON.parse(evt.originalEvent.dataTransfer.getData("text"));
        console.log(data, this.app.hebdo)
        var src = this.app.hebdo.collections[data.container];
        var removed = src.remove(data.id);
        this.insert(removed, index);
    }
}

class SimpleArticleContainer extends ArticleContainer{

    constructor(root_elem, app){
        super(root_elem, app);
    }

    drop_from(evt){

    }

    insert(data, index){
        //envoyer l'ancien à not_used avant d'appeler super
    }

    remove(dataid){
        //vider plutot que de supprimer
    }

    create_article_element(data, index){
    }
}

