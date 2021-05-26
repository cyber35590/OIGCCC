function new_article(data){
    return Template.instanciate("template-hebdo-article", data);
}

function new_cal(data){
    return Template.instanciate("template-hebdo-cal", data);
}

function new_hebdo(data){
    return Template.instanciate("template-hebdo-root", data);
}



class HebdoColumn {
    constructor(elem){
        this.root=elem;
        this.height=elem.height();
        this.children=[]
        this.sep_class="___"+Utils.newid();

    }

    find(...params){return this.root.find(...params)}

    add_article(data) {
        if(this.children.length) this.root.append($('<div class="'+this.sep_class+'"></div>'))

        var elem = new_article(data);
        //on essaye de voir si ça passe
        this.root.append(elem);
        if(this.get_free_space()<0){
            elem.remove();
            return false;
        }
        this.children.push({ data: data, elem: elem});
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

    has_overflow(){
        var element = this.root[0]
        return element.offsetHeight < element.scrollHeight ||
            element.offsetWidth < element.scrollWidth;
    }



}