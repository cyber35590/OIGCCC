
class StyleParam {
    constructor(current, fixe=[]){
        this.fixe=fixe;
        this.current=current;
        this.all_class=[]

        for(var i in this.fixe)  this.all_class.push(this.fixe[i].split(" "));
        for(var i in this.current)  this.all_class.push(this.current[i].split(" "));
        this.all_class=this.all_class.flat(1)

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
        elems.removeClass(this.all_class)
    }
}

var STYLES_PARAMS =[
    [
        new StyleParam(["article-1-col"],["article-calendrier"]),
        new StyleParam(["article-2-col style-1"])
    ],
    [
        new StyleParam(["article-1-col style-1", "article-1-col style-3"]),
        new StyleParam(["article-2-col style-2", "article-2-col style-1"])
    ],
    [
        new StyleParam(["article-2-col style-3", "article-2-col style-1"]),
        new StyleParam(["article-1-col style-1", "article-1-col style-2"])
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

function countLines(el) {
   el = el[0]
   var divHeight = el.offsetHeight
   var lineHeight = parseInt(getComputedStyle(el).lineHeight);
   var lines = divHeight / lineHeight;
   return lines;
}

function auto_size_title(elem, titre){
    var charcount = elem.html().length;
    var max_line = (charcount>70)?2:1;
    for(var  i = 19; i>=12 && countLines(elem)>max_line; i--){
        if(i!=20) elem.removeClass("font-"+(i+1));
        elem.addClass("font-"+i)
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
        var self = this;
        this.is_available_container = false;
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
        this.root.addClass("dropable")
        this.root.on("dragover", function(ev){
            var x = $(ev.target);
            x.removeClass("drag-start");
            x.addClass("drag-over");
            ev.preventDefault();
        })
        this.root.on("dragleave", function(ev){
            var x = $(ev.target)
            $(".drag-over").removeClass("drag-over")
            x.addClass("drag-start")
        })
        this.root.on("drop", function(ev){ self.drop_from(ev, self)})
    }

    send_to_available(id, remove=true){
        if(remove) this.remove(id);
        else this.update(); //if remove=false, update() method has not been called
        this.app.hebdo.available.prepend(id);
    }

    show_menu(id, x, y){
        var row = this.children_index[id];
        var menu = $(".context-menu");
        this.app.article_context_menu.show(row.data, x, y);
        var update_button = $("#context-menu-use-latest")
        if(row.data.latest){
            update_button.hide();
        }else{
            update_button.show();
        }

    }

    prepare_element(elem, data, index){
        var self = this;
        elem.data("colid", this.data_col_id);
        elem.data("id", data.id);
        elem.attr("draggable", true);
        elem.on("dragstart", function(evt){
            $(".dropable").addClass("drag-start");
            var out = { id: data.id, container: self.data_col_id};

            evt.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(out));
        });
        elem.on("dragend", function(evt){
            $(".drag-start").removeClass("drag-start")
            $("drag-over").removeClass("drag-over")
        });

        elem.on("mouseup", function(e){
             if(elem.hasClass("selected")){
                self.app.hebdo.unselect();
             }else{
                self.app.hebdo.select_article(elem, data, self);
             }
        })
        elem.on( "contextmenu", function(e) {
            e.preventDefault();
            self.show_menu(data.id, e.clientX, e.clientY);
        });
    }


    find(...params){return this.root.find(...params)}

    append(data){
        this.insert(data, this.children.length)
    }

    prepend(data){
        this.insert(data, 0)
    }

    _new_element(data, index){
        var elem = this.create_article_element(this.format_data(data), index);
        this.prepare_element(elem, data, index);
        return elem;
    }

    insert(data, index) {
        if(!data) return;
        if(this.children.length) this.root.append($('<div class="'+this.sep_class+'"></div>'))
        var elem = this._new_element(data, index);
        var dst = (index>0 && index<=this.children.length)?this.children[index-1].elem:null;
        var is_last = index>this.children.length;

        var row_data = { data: data, elem: elem, id: data.id};
        if(index<this.children.length) this.children.splice(index, 0, row_data)
        else this.children.push(row_data);

        this.children_index[row_data.id] = row_data;
        if(dst) dst.after(elem)
        else if(is_last) this.root.append(elem);
        else this.root.prepend(elem);

        if(elem.hasClass("article")){
            var titre = elem.find("h1")
            auto_size_title(titre);
        }

        this.update();

        data.collection=this;
        return true;
    }

    refresh_article(data){
        var index = -1;
        for(var i in this.children){
            if(this.children[i].id==data.id){
                index = i;
                break;
            }
        }
        var elem = this._new_element(data, index);
        this.children[index].data = Object.assign(this.children[index].data, data);
        var oldelem = this.children[index].elem;
        oldelem.replaceWith(elem);
        this.children[index].elem = elem;
        this.update();

    }

    find_index(id){
        for(var i in this.children){
            if(this.children[i].id==id) return i;
        }
        return -1;
    }


    remove(dataid){
        var data = this.children_index[dataid].data;
        var elem = this.children_index[dataid].elem;
        var i = parseInt(elem.data("index"));
        this.children.splice(i,1);
        delete this.children_index[dataid]
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

    set_json(js, articles=null){
        if(!articles) articles=this.app.hebdo.articles;
        this.clear();
        for(var i in js){
            this.append(articles[js[i].auid]);
        }
    }


    format_data(x){
        return x;
    }
    //
    on_drag_over(){}
    on_drag_leave(){}
    show_drag_items(){}
    hide_drag_items(){}
    add_sep(index){}


    create_article_element(article){}
    udpate(){}

}

class HebdoColumn extends ArticleContainer {
    constructor(root_elem, app, styleparam){
        super(root_elem, app);
        this.style_param=styleparam
        this.add_sep();
    }

    add_sep(index=null){
        if(index==null) index=this.children.length;
        var sep = $('<div class="vseparator dropable" data-host-id="'+this.data_col_id+'" data-index="'+index+'" > </div>');
        var self = this;

        sep.on("drop", function(ev){ self.drop_from(ev, sep)})
        sep.on("dragover", function(ev){
            var x = $(ev.target);
            x.removeClass("drag-start");
            x.addClass("drag-over");
            ev.preventDefault();
        })

        sep.on("dragleave", function(ev){
            var x = $(ev.target)
            $(".drag-over").removeClass("drag-over")
            x.addClass("drag-start")
        })

        if(index>0) this.children[index-1].elem.after(sep);
        else this.root.prepend(sep);
        return sep;
    }

    update(){
        var self = this;
        var i = 0;
        this.find(".vseparator").remove();

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
        if(this.get_free_space()<0){
            this.root.addClass("overflow")
        }else{
            this.root.removeClass("overflow")
        }

        var space = (this.children.length>1)?this.get_free_space()/(this.children.length-1):0;

        for(var i=0; i<this.children.length+1; i++){
            var sep = this.add_sep(i);
            if(!this.is_available_container && i>0 && i<this.children.length) sep.height(space+"px");
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
        while(!divtarget.hasClass("dropable")) divtarget=divtarget.parent()
        divtarget.removeClass("drag-over");
        divtarget.addClass("drag-start");
        var index = (divtarget[0]!=this.root[0])?parseInt(divtarget.data("index")):this.children.length;
        var data = JSON.parse(evt.originalEvent.dataTransfer.getData("text"));
        var src = this.app.hebdo.collections[data.container];

        var to_remove = src.children_index[data.id].data;
        var count =src.children.length+this.children.length;
        if(this==src){
            if( (index>0 && this.children[index-1].data.id==data.id) || divtarget[0]==this.root[0] ){
                evt.preventDefault();
                evt.stopPropagation();
                return;
            }
            src.remove(data.id);
            this.insert(to_remove, index)
        }
        else if(this.insert(to_remove, index)){
            src.remove(data.id);
        }
        if(this.root.find(".article, .hebdo-article-entry").length+src.root.find(".article, .hebdo-article-entry").length != count){
            error("Nombre d'éléments différents", "dst_index="+index)
        }
        $(".drag-start").removeClass("drag-start")
        evt.preventDefault();
        evt.stopPropagation();

    }
}

class AvailableArticleCollection extends HebdoColumn{

    constructor(root_elem, application){
        super(root_elem, application, new StyleParam([]));
        this.is_available_container = true;
    }

    create_article_element(data, index){
        return Template.instanciate("template-hebdo-article-entry", data)
    }

    format_data(data){
        data = Object.assign({}, data)
        data.date_creation=int_to_std_datetime(data.date_creation)
        data.date_modification=int_to_std_datetime(data.date_modification)
        data.date_debut=iso_to_std_date(data.date_debut)
        data.date_debut_texte=date_to_phrase(data.date_debut)
        data.date_fin=iso_to_std_date(data.date_fin)
        data.date_fin_texte=date_to_phrase(data.date_fin)
        data.contenu_txt=data.contenu?(data.contenu.replace(/<[^>]*>/g, '')):""
        data.resume=data.contenu_txt.substr(0,300)+((data.contenu_txt.length>300)?"...":"")
        data.unarchive_class=data.archived?"":"hidden"
        data.archive_class=data.archived?"hidden":""
        var tmp = ["", "", "À faire", "À modifier", "Fait"]
        data.pub_hebdo_text=tmp[data.pub_hebdo]
        data.priorite_str=Priorite.to_str(data.priorite)
        data.priorite_classe=Priorite.to_class(data.priorite)
        return data;
    }
}


class SimpleArticleContainer extends ArticleContainer{
    constructor(root_elem, app, templateid, data_fct=function (x){ return x; }){
        super(root_elem, app);
        this.data_fct = data_fct;
        this.template_id=templateid;
    }

    _drop_from(evt) {
        var divtarget = this.root;
        divtarget.removeClass("drag-over");
        divtarget.addClass("drag-start");

        var data = JSON.parse(evt.originalEvent.dataTransfer.getData("text"));
        var src = this.app.hebdo.collections[data.container];

        var to_remove = src.children_index[data.id].data;
        if(this==src){
                evt.preventDefault();
                evt.stopPropagation();
                return;
        }
        this.insert(to_remove, 0);
         src.remove(data.id);

        $(".drag-start").removeClass("drag-start")
        evt.preventDefault();
        evt.stopPropagation();

    }

    drop_from(evt){
        if(this.children.length){
           this.send_to_available(this.children[0].data)
        }
        this._drop_from(evt);

    }

    insert(data, index){
        if(this.children.length) this.remove();
        super.insert(data, index);
    }

    remove(dataid){
        if(!this.children.length) return null;
        this.root.empty();
        this.children=[]
        this.children_index={}
    }

    update(){
    }


    create_article_element(data, index){
        return Template.instanciate(this.template_id, this.data_fct(data));
    }
}

function parse_coup_de_coeur(data){
    var data = Object.assign({}, data);
    var img = /\<img.*?>/.exec(data.contenu)
    img = /src=".*?"/.exec(img)[0]
    img = img.substr(5, img.length-6)

    var out = data.contenu.replace(/\<div.*\<\/div\>/, "")

    data.contenu = out;
    data.url = img;
    return data;
}


function mediatheque_container(app) {
    return new SimpleArticleContainer($(".section-mediatheque"), app,
                                "template-hebdo-mediatheque")
}
function menus_container(app) {
    return new SimpleArticleContainer($(".section-menus"), app,
                                "template-hebdo-menus")
}
function coeur_container(app) {
    return new SimpleArticleContainer($(".section-coeur"), app,
                                "template-hebdo-coup-coeur",parse_coup_de_coeur)
}
function sudoku_container(app) {
    return new SimpleArticleContainer($(".section-sudoku"), app,
                                "template-hebdo-sudoku")
}
