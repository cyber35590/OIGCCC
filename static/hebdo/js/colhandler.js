

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


function vseparator_on_drop(ev, id){
    console.log("vseparator_on_drop")
}

function vseparator_ondragover(ev, id){
    console.log("vseparator_ondragover")
    ev.preventDefault();
}

function new_sep(id){
    return $(Mustache.render(`
        <div class="vseparator" ondragover="vseparator_ondragover(event, '[[id]]')" ondrop="vseparator_on_drop(event, '[[i]]')"> </div>
    `, {id: id}));
}

class HebdoColumn {
    constructor(elem, ncol, styleparam, manager){
        this.root=elem;
        this.manager;
        this.data_col_id="_"+Utils.newid(32)
        this.style_param=styleparam
        this.ncol=ncol
        this.height=elem.height();
        this.children=[]
        this.sep_class="___"+Utils.newid();
        this.root.data("colid", this.data_col_id);
        this._add_sep();
    }

    _add_sep(){
        this.root.append(new_sep(this.data_col_id));
    }

    find(...params){return this.root.find(...params)}

    add_article(data, force=true) {
        if(this.children.length) this.root.append($('<div class="'+this.sep_class+'"></div>'))

        var elem = new_article(data);
        //on essaye de voir si ça passe}
        console.log(elem)
        elem.data("colid", this.data_col_id);
        elem.data("id", data.id);
        elem.attr("draggable", true);
        console.log(elem)
        this.root.append(elem);
        if(this.get_free_space()<0 && !force){
            elem.remove();
            return false;
        }

        this.children.push({ data: data, elem: elem});
        this._add_sep();
        return true;
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