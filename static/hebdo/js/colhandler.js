
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


class HebdoColumn {
    constructor(elem, ncol, styleparam, manager){
        this.root=elem;
        this.manager=manager;
        this.data_col_id="_"+Utils.newid(32)
        this.style_param=styleparam
        this.ncol=ncol
        this.height=elem.height();
        this.children=[]
        this.sep_class="___"+Utils.newid();
        this.root.data("colid", this.data_col_id);
        this._add_sep();
        this.current_drag=null;
    }

    find_index_by_elem_id(elemid){
        for(var i=0; i<this.children.length;i++)
            if(elemid == this.children[i].elemid) return i;
       return -1;
    }

    find_by_elem_id(elemid){
        for(var i=0; i<this.children.length;i++)
            if(elemid == this.children[i].elemid) return i;
       return null;
    }

    drop_from(evt) {
        var divtarget = $(evt.target);
        divtarget.removeClass("drag-over");
        divtarget.addClass("drag-start");
        var index = parseInt(divtarget.data("index"));
        var data = JSON.parse(evt.originalEvent.dataTransfer.getData("text"));
        var src = this.manager.get_col(data.id);

        var elemid = src.find_index_by_elem_id(data.elemid)
        var removed = src.remove(elemid);
        console.log("src id: ",elemid, "dst id", index)
        this.insert(removed, index);
    }

    _add_sep(index=null){
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

    update_styles(){
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
            if( /*data.style && data.style.force*/ true){ //vérifier si le style est forcé ou non
                this.style_param.set_class(elem, noforce_count);
                noforce_count++;
            }else{
                this.style_param.remove_class(elem);
                elem.addClass(data.style.force.split())
            }
        }
    }

    find(...params){return this.root.find(...params)}


    prepare_article(elem, index, elemid){
        var self = this;
        elem.data("colid", this.data_col_id);
        elem.data("id", data.id);
        elem.data("elem-id", elemid);
        elem.attr("draggable", true);
        elem.on("dragstart", function(evt){
            $(".draggable").addClass("drag-start");
            var data = {id: self.data_col_id,  elemid: elemid};
            evt.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(data));
        });
        elem.on("dragend", function(evt){
            $(".drag-start").removeClass("drag-start")
            $("drag-over").removeClass("drag-over")
        });

    }

    append(data){
        this.insert(data, 0)
    }

    insert(data, index) {
        if(this.children.length) this.root.append($('<div class="'+this.sep_class+'"></div>'))
        var elem = new_article(data);
        var elemid = Utils.newid(16)
        this.prepare_article(elem, index, elemid);
        var dst = this.find(".vseparator[data-index="+index+"]")

        this.children.splice(index, 0, { data: data, elem: elem, elemid: elemid})
        dst.after(elem)
        this._add_sep(index+1);
        this.update_styles();
        return true;
    }

    remove(i){
        if(!Number.isInteger(i)){
            var j;
            for(j in this.children){
                if(this.children[j].data==i || this.children[j].elem==i){
                    i=j;
                    break;
                }
            }
        }
        if(i<0 || j>=this.children.length) return null;

        console.log("this.children",this.children)
        var data = this.children[i].data;
        var elem = this.children[i].elem;
        this.children.splice(i,1);
        elem.next().remove();
        elem.remove();
        this.update_styles();
        return data;
    }

    get_free_space(){
        var left = this.height;
        this.find(".article").each(function(i, e){
            e=$(e);
            left-=e.outerHeight();
        })
        console.log("Left = ", left)
        return left;
    }
}