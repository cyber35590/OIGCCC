
function set_visible(x, val){
    if(val) x.show()
    else x.hide()
}

function date_to_int(str){
    str = str.split("-")
    var a = parseFloat(str[0]), m=parseInt(str[1]), j=parseInt(str[2]);
    var date = new Date(a, m-1, j, 12, 0);
    return date.getTime()/1000;
}

function int_to_date(ts){
    var date = new Date(ts*1000);
    var m =(1+date.getMonth())+"", j = date.getDate()+"";
    if(m.length<2) m="0"+m;
    if(j.length<2) j="0"+j;
    return date.getFullYear()+"-"+m+"-"+j;
}

function int_to_std_date(ts){
    var date = new Date(ts*1000);
    var m =(1+date.getMonth())+"", j = date.getDate()+"";
    if(m.length<2) m="0"+m;
    if(j.length<2) j="0"+j;
    return j+"/"+m+"/"+date.getFullYear();
}

function int_to_std_datetime(ts){
    var date = new Date(ts*1000);
    var m =(1+date.getMonth())+"", j = date.getDate()+"", h=date.getHours(), min=date.getMinutes();
    if(m.length<2) m="0"+m;
    if(j.length<2) j="0"+j;
    if(h.length<2) h="0"+h;
    if(min.length<2) min="0"+min;
    return j+"/"+m+"/"+date.getFullYear()+" "+h+":"+m;
}

function date_to_std_date(d){
    var y = d.getFullYear()+"";
    var m = (d.getMonth()+1)+"";
    var d = d.getDate()+"";
    if(m.length<2) m="0"+m;
    if(d.length<2) d="0"+d;
    return y+"-"+m+"-"+d
}
var mois = ["", "janvier", "février", "mars", "avril", "mai", "juin",
                    "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function date_to_phrase(date){
    if(!date || date=="-") return "---"
    date = date.split("/")

    return parseInt(date[0])+" "+mois[parseInt(date[1])]+" "+date[2]
}


function iso_to_std_date(ts){
   return ts?(ts.substr(8,2)+"/"+ts.substr(5,2)+"/"+ts.substr(0,4)):"-"
}

class Value {
    static SPACE=" "
    static PO="("
    static PF=")"
    static VIRGULE=","
    static INT="int"
    static FLOAT="float"
    static STRING="string"
    static IDENT="ident"
    constructor(){}
}

class Callback {

    constructor(text){
        this.text=text;
        this.index=0;
        this.left=this.text;
        this.method=""
        this.args=[]
        this.tok=null
        this.data=null
        this.re=[
            [ /^\s+/, Value.SPACE ],
            [ /^\(/, Value.PO ],
            [ /^\)/, Value.PF ],
            [ /^\,/, Value.VIRGULE ],
            [ /^\d+\.\d+/, Value.FLOAT ],
            [ /^\d+/, Value.INT ],
            [ /^\'.*?\'|\".*?\"/, Value.STRING ],
            [ /^\w+/, Value.IDENT ]
        ]
    }

    _next_token(){
        this.tok=this.data=null;
        for(var i in this.re){
            var re = this.re[i][0], tok = this.re[i][1];
            var match = re.exec(this.left);
            if(match && match.length){
                var str = match[0];
                this.left=this.left.substr(str.length);
                switch(tok){
                    case Value.INT: this.data=parseInt(str); break;
                    case Value.FLOAT: this.data=parseFloat(str); break;
                    case Value.STRING: this.data=str.substr(1, str.length-2); break;
                    case Value.SPACE: continue;
                    default: this.data=str; break;
                }
                this.tok=tok
                return tok;
            }
        }
        return null;
    }
    static parse(text){
        var x = new Callback(text);
        return x.parse_string()
    }

    parse_string(){
        var args_toks = [Value.INT, Value.FLOAT, Value.STRING, Value.IDENT]
        var sep_toks = [Value.VIRGULE, Value.PF]
        var out = { method: null, args: [] }
        if(this._next_token()!=Callback.IDENT) error("Erreur", "Erreur dans data-on : identifiant de méthode '"+this.text+"'")
        out.method=this.data;

        this._next_token();
        if(!this.tok) return out;
        if(this.tok!=Callback.PO) error("Erreur", "Erreur dans data-on : parenthese ouvrante '"+this.left+"'")

        while(this.tok!=Callback.PF && this.tok){
            this._next_token(); //argument
            if(!args_toks.includes(this.tok))
                error("Erreur", "Erreur dans data-on : argument attendu '"+this.data+"'")

            out.args.push(this.data)
            this._next_token(); //virgule ou )
            if(!sep_toks.includes(this.tok))
                error("Erreur", "Erreur dans data-on : ')' ou ',' attendu '"+this.data+"'")
        }
        return out;
    }

    call(object){

    }

}
var __ident_re = /^\w+/
var __params_re = /\(.*\)/

function parse_callback(text){
    text=text+""
    var outargs=[]
    var name = __ident_re.exec(text);
    var args = __params_re.exec(text);
    if(name && name.length) name=name[0]
    if(args && args.length) args=args[0];
    if(args) outargs=eval("["+args.substr(1,args.length-2)+"]")
    return {
        name: name,
        args: outargs
    }
}

class DataBind {
    /*
        data-bind="NAME[:TYPE]" -> this.NAME (TYPE: default str)
        data-on="METOD:EVENT" -> this.METHOD(elem)
    */
    static __events=[null, "change", "keyup", "keydown", "click", "paste"]
    constructor(domid){
        this.__id=domid
        this.updateBind();
    }

    __clear_callback(){
        for(var i in this.__callbacks_list){
            var d = this.__callbacks_list[i]
            d.element.off(d.event, null, d.callback);
        }
    }

    updateBind(){
        this.__clear_callback();
        this.fields={}
        this.__cb_object={}
        this.__cb_callbacks={}
        this.__if_cb={}
        this.__callbacks_list=[]
        if(typeof this.__id == "string") this._root=$("#"+this.__id)
        else this._root=this.__id
        this.pre_init()
        this._updateBind()
        this._set_if_cb()
    }

    find(x){
        return this._root.find(x)
    }

    pre_init(){
    }

    _refresh_if_cb(){
        for(var name in this.__if_cb[name]){
            var arr = this.__if_cb[name];
            for(var i in arr){
                arr[i]();
            }
        }
    }

    __set_if_cb(self, trigger, inv){
        var fct = function(){
            var val = trigger.is(":checked");
            set_visible(self, val);
        }
        fct();
        var name = trigger.data("bind").split(":")[0]
        if(this.__if_cb[name]==undefined){
            this.__if_cb[name]=[]
        }
        this.__if_cb[name].push(fct)

        this.__callbacks_list.push({
            element: trigger,
            event: "change",
            callback: fct
        })
        trigger.on("change", null, null, fct)
    }

    _set_if_cb(){
        var self=this;
        var root = this._root;
        $("[data-if]").each(function(i,e){
            e=$(e)
            var element =  e.data("if")
            if(element.length==0) return;
            var inv =false;
            if(element && element.length>1 && element[0]=="!"){
                inv=true;
                element=element.substring(1,element.length-1)
            }

            self.__set_if_cb($(e), $("[data-bind^='"+element+"']"), inv)
        })

    }

    __get_callback(e){
        if(!("length" in e)) e=$(e)
        var elem = e[0]
        for(const id in this.__cb_object){
            if(elem==this.__cb_object[id]) return this.__cb_callbacks[id]
        }
        var id = Utils.randomId()
        this.__cb_callbacks[id] = {
        }
        this.__cb_object[id] = elem
        return this.__cb_callbacks[id]
    }

    on(e, event, src, fct){
        var self = this
        if(!("length" in e)) e=$(e)
        var self = this
        var cbo = this.__get_callback(e)
        if(!(event in cbo) ){
            self.__set_base_callback(e, event);
        }
        cbo[event][src]=fct
    }

    __set_base_callback(e, event){
        if(!("length" in e)) e=$(e)
        var self = this
        var cbo = this.__get_callback(e)
        if(!(event in cbo) ){
            cbo[event]={}
            var tmpcb = function(){
                var cb = cbo[event];
                if("bind" in cb){
                    cb["bind"](e)
                }
                for(const key in cb){
                    if(key!="bind"){
                        cb[key](e)
                    }
                }
            }
            this.__callbacks_list.push({
                element: e,
                event: event,
                callback: tmpcb
            })
            e.on(event, null, null, tmpcb)
        }
    }


    _updateBind(){
        var self = this
        for(const i in DataBind.__events){
            var evt = DataBind.__events[i]
            var suffix =(evt)?("-"+evt):""
            this._root.find("[data-bind"+suffix+"]").each(function(i,e){
                self._bindData($(e), evt, suffix)
            })
            this._root.find("[data-on"+suffix+"]").each(function(i,e){
                self._bindOn($(e), evt, suffix)
            })
        }
        this.updateFields()
    }

    __get_field(e){
        var tag = e.prop("tagName").toLowerCase()
        var bind = e.data("bind").split(":")
        var type = (bind.length>1)?bind[1]:"string"
        var value = null

        switch(tag){
            case "textarea":
            case "input":
                switch(e.attr("type")){
                    case "checkbox":
                        value=e.is(":checked")
                        type="bool"
                        break;
                    default:
                        if(e.hasClass("datepicker")){
                            type="date"
                        }
                        value=e.val()
                        if(value=="") value=null;
                        break

                }break;
            case "select":
                value=e.val()
                break
            default:
                value=e.html()
        }

        switch(type){
            case "int":
                value=parseInt(value)
                break;
            case "float":
                value=parseFloat(value)
                break;
            case "bool":
                value=((""+value).toLowerCase()!="false") && (value!="0")
                break;
        }

        //this.fields[bind[0]]=value
        //if(isNaN(value)) value=null;
        this._set_data_by_path(bind[0], value)
    }


    __set_field(e, value){
        var tag = e.prop("tagName").toLowerCase()

        var bind = e.data("bind").split(":")
        var type = (bind.length>1)?bind[1]:"string"
        //this.fields[bind[0]]=value
        this._set_data_by_path(bind[0], value)

        switch(tag){
            case "textarea":
            case "input":
                switch(e.prop("type")){
                    case "checkbox":
                        e.prop("checked", value)
                        break;
                    default:
                        if(e.hasClass("datepicker")){
                            type="date"
                            value=e.val(value)
                        }
                        else {
                            value=e.val(value)
                        }
                        break

                }break;
            case "select":
                value=e.val(value)
                break
            default:
                value=e.html(value)
        }
        var arr = this.__if_cb[bind[0]]
        for(var i in arr){
            arr[i]()
        }
    }

    getElemByBind(f){
        for(const key in DataBind.__events){
            var evt = DataBind.__events[key]
            var suffix = (evt)?("-"+evt):""
            var tmp = this._root.find("[data-bind"+suffix+"="+f+"]")
            if(tmp.length) return tmp
        }
        return null
    }


    _bindData(e, event=null, suffix){
        var self = this
        event=this.__find_evt(e, event)

        if(!event) event="change"
        this.on(e, event, "bind", function(){
            self.__get_field(e)
        })
    }

    _bindOn(e, evt=null, suffix){
        var self = this
        evt=this.__find_evt(e, evt)
        this.on(e, evt, "on" ,function(){
            var cb = parse_callback(e.data("on"+suffix))
            var root=self;
            if(self[cb.name]) root[cb.name](e, evt, ...cb.args)
            else throw "La méthode '"+cb.name+"' est introuvable dans la classe '"+root.constructor.name+"'"
        })
    }

    /*
    _bindOn(e, evt=null, suffix){
        var self = this
        var method = e.data("on"+suffix)

        evt=this.__find_evt(e, event)

        this.on(e, evt, "on" ,function(){
            var x = e.data("args")
            var root=self;

            if(method[0]=="."){
                root=window;
                var m=method.substr(1)
                if(!x){
                    try{
                        root[m](self, e, evt)
                    }catch(error){
                        throw "La fonction '"+method+"' est introuvable : "+error
                    }
                }else{
                    x=eval(x)
                    if(Array.isArray(x)){
                        try{
                            root[m](self, ...x)
                        }catch(error){
                            throw "La fonction '"+method+"' est introuvable : "+error
                        }
                    }else{
                        try{
                            root[m](self, x)
                        }catch(error){
                            throw "La fonction '"+method+"' est introuvable : "+error
                        }
                    }
                }
            }
            else
            {
                if(!x){

                    if(root[method]) root[method](e, evt)
                    else throw "La méthode '"+method+"' est introuvable dans la classe '"+root.constructor.name+"'"
                }else{
                    x=eval(x)
                    if(Array.isArray(x)){
                        if(root[method]) root[method](...x)
                        else throw "La méthode '"+method+"' est introuvable dans la classe '"+root.constructor.name+"'"
                    }else{
                        if(root[method]) root[method](x)
                        else throw "La méthode '"+method+"' est introuvable dans la classe '"+root.constructor.name+"'"
                    }
                }
            }
        })
    }*/


    __find_evt(e, evt){
        var tag = e.prop("tagName").toLowerCase()
        if(evt) return evt
        switch(tag){
            case "a":
            case "i":
            case "button":
                evt = "click"
            break;
            case "input":
                switch(e.attr("type")){
                    case "text":
                    case "number":
                    case "email":
                    case "password":
                    case "search":
                    case "tel":
                    case "url":
                        evt = "keyup"
                        if(e.hasClass("datepicker")) evt="change";
                        break;
                    default:
                        evt = "change"
                }
                break;
            default:
                evt = "change"
        }
        return evt

    }

    _get_path_root(path){
        path = path.split(".")
        var acc = this.fields;
        for(var i=0; i<path.length-1; i++){
            var name = path[i];
            if(!(name in acc)){
                acc[name]={}
            }
            acc=acc[name]
        }
        return [acc, path[path.length-1]]
    }

    _set_data_by_path(path, value){
        var tmp = this._get_path_root(path)
        tmp[0][tmp[1]]=value;
    }

    _get_data_by_path(path){
        var tmp = this._get_path_root(path)
        return tmp[0][tmp[1]];
    }


    field(name, val){

        if(typeof name == "string"){
            var e = this._root.find("[data-bind='"+name+"']")
            if(!e.length){
                e= this._root.find("[data-bind^='"+name+":']")
            }

            if(e.length){
                if(val==undefined){
                    this.__get_field(e)
                }else{
                    this.__set_field(e, val)
                }
            }
        }else{
            for(const key in name){
                this.field(key, name[key])
            }
        }
    }

    _set_field_recurs(path, obj){
        path=(path=="")?path:(path+".")
        for(const key in obj){
            if($.isPlainObject(obj[key])){
                this._set_field_recurs(path+key, obj[key])
            }
            else
            {
                this.field(path+key, obj[key])
            }
        }
    }

    set_fields(obj){
        this._set_field_recurs("", obj)
    }

    updateFields(){
        var self = this
        this._root.find("[data-bind]").each(function(i,e){
            self.__get_field($(e))
        })
        return this.fields
    }

    cb(e, f){
        alert("--- "+e+" "+f)
    }
}
