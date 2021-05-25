
class Methode {
    constructor(object, method=null){
        if(method==null){
            method=object;
            object=null;
        }
        this.object=object;
        this.method=method;
    }

    call(...params){
        if(this.object){
            this.method.apply(this.object, params);
        }else{
            this.method(...params);
        }
    }
}


class OigccAPI
{
    constructor(){
        this.url_base="/api"
    }

    url(x){
        var sep = ""
        if(x[0]!='/') sep = "/"
        return  this.url_base+sep+x
    }

    _ajax(url, ajax={}, headers={}, success=null, errorFct=null, errorText=null, customUrl=false){
        if(customUrl) return this.__ajax(url, ajax, headers, success, errorFct, errorText)
        return this.__ajax(this.url(url), ajax, headers, success, errorFct, errorText)
    }

    __ajax(url, ajax={}, headers={}, success=null, errorFct=null, errorText=null){
        var async=(success || errorFct || errorText)?true:false
        if(typeof success=="function") success=new Methode(success)
        if(typeof errorFct=="function") errorFct=new Methode(errorFct)
        if(typeof errorText=="function") errorText=new Methode(errorText)
        if(errorFct){
            var oldfct=errorFct;
            errorFct=new Methode(function(_a, _b, _c) {
                if(!(!_a && _b=="error" && _c==""))
                {
                    var resp=null
                    try{
                        resp = JSON.parse(_a.responseText);
                        oldfct(resp, true, _c)
                    }catch(err){
                        resp=_a.responseText
                console.log("la")
                        oldfct(resp, false, _c)
                    }

                }else{
                    oldfct(null, _b, _c)
                }
            })
        }
        else{
            errorFct=new Methode(function(_a, _b, _c) {
                if(!(!_a && _b=="error" && _c==""))
                {
                    var resp=""
                    try{
                        resp = JSON.parse(_a.responseText);
                        modal_alert("Erreur", (errorText?errorText:"Erreur")+ "( "+resp.code+" : '"+resp.message+"') : " + JSON.stringify(resp.data))
                    }catch(err){
                        resp=_a.responseText
                        toast_error(errorText?errorText:("Le serveur a répondu : '"+resp+"'"))
                    }

                }else{
                    toast_error( "Erreur : Le serveur a clos la connexion")

                }
                Loading.close()
            })
        }
        if(success){
            var oldsuccess=success;
            success=new Methode(function(x) { return oldsuccess.call(x.data) })
        }

        var param = Object.assign({}, {
            type: 'get',
            url: url,
            async: async,
            dataType : "json",
            headers: headers,
            success :  function(...params){success.call(...params)},
            error : function(...params){errorFct.call(...params)}
        }, ajax)
        //console.log("Request : ",param)

        var out = $.ajax(param)
        if(!async){
            return JSON.parse(out.responseText)
        }
        return out
    }

    ajax_get(url, opt={}){
        if((opt instanceof Methode) || (typeof opt == "function")) opt={success: opt}
        opt=Object.assign({
            headers : {}, ajax: {}, success : null, errorFct : null, errorText :null}, opt)

        return this._ajax(url, opt.ajax, opt.headers, opt.success, opt.errorFct, opt.errorText)
    }

    _ajax_get(url, opt={}){
        if((opt instanceof Methode) || (typeof opt == "function")) opt={success: opt}
        opt=Object.assign({
            headers : {}, ajax: {}, success : null, errorFct : null, errorText :null}, opt)
        console.log("URL ='"+url+"'")
        return this._ajax(url, opt.ajax, opt.headers, opt.success, opt.errorFct, opt.errorText, true)
    }

    ajax_delete(url, opt={}){
        if((opt instanceof Methode) || (typeof opt == "function")) opt={success: opt}
        opt=Object.assign({headers : {}, ajax: {}, success : null, errorFct : null, errorText :null}, opt)
        return this._ajax(url, Object.assign({type: 'delete'}, opt.ajax), opt.headers, opt.success, opt.errorFct, opt.errorText)
    }

    ajax_post(url, data=null, opt={}){
        if((opt instanceof Methode) || (typeof opt == "function")) opt={success: opt}
        opt=Object.assign({ ajax : {}, headers : {}, success : null, errorFct : null, errorText :null}, opt)
        return this._ajax(url, Object.assign({type: 'post', data: JSON.stringify(data)}, opt.ajax),
                Object.assign({"Content-Type": "application/json"}, opt.headers), opt.success, opt.errorFct, opt.errorText)
    }

    ajax_put(url, data=null, opt={}){
        if((opt instanceof Methode) || (typeof opt == "function")) opt={success: opt}
        opt=Object.assign({ ajax : {}, headers : {}, success : null, errorFct : null, errorText :null}, opt)
        return this._ajax(url, Object.assign({type: 'put', data: JSON.stringify(data)}, opt.ajax),
                Object.assign({"Content-Type": "application/json"}, opt.headers), opt.success, opt.errorFct, opt.errorText)
    }


    article_edit(data, opt){
        var out = {
            article: data,
            action: "edit"
        }
        return this.ajax_post("article/"+data.id, out, opt)
    }

    article_new_revision(data, opt){
        var out = {
            article: data,
            action: "new_revision"
        }
        return this.ajax_post("article/"+data.id, out, opt)
    }


    article_search_query(data, opt){
        return this.ajax_post("articles/query", data, opt)
    }

    articles_batch(ids, data, opt){
        var tmp = {
            ids: ids,
            modifications: data
        }
        return this.ajax_post("articles/batch", tmp, opt)
    }


    article_search_query_check(data, opt){
        return this.ajax_post("articles/query/check", data, opt)
    }

    article_set(id, key, val, opt){
        return this.ajax_get("article/"+id+"/"+key+"/"+val, opt)
    }

    article_get(id, key, opt){
        return this.ajax_get("article/"+id+"/"+key, opt)
    }

    article_remove(id, only_revision, opt){
        return this.ajax_get("article/"+id+"/delete/"+(only_revision?"revision":"article"), opt)
    }

    hebdo_list(opt){
        return this.ajax_get("hebdo/list", opt);
    }

    hebdo_list_custom(data, opt){
        return this.ajax_post("hebdo/list", data, opt);
    }

    hebdo_delete(id, opt){
        return this.ajax_get("hebdo/"+id+"/delete", opt);
    }

    hebdo_get(id, opt){
        return this.ajax_get("hebdo/"+id, opt);
    }

    hebdo_set(data, opt){
        return this.ajax_post("hebdo/"+data.id, data, opt);
    }

    hebdo_add(id, article, opt){
        return this.ajax_get("hebdo/"+id+"/add/"+article, opt);
    }

    hebdo_add_batch(id, articles, opt){
        return this.ajax_post("hebdo/"+id+"/add", articles, opt);
    }

    hebdo_remove(id, article, opt){
        return this.ajax_get("hebdo/"+id+"/remove/"+article, opt);
    }



    /*
    count(opt={}){
        return this.ajax_get("count", opt)
    }
    running(opt={}){
        return this.ajax_get("running", opt)
    }
    done(opt={}){
        return this.ajax_get("done", opt)
    }

    queue(opt={}){
        return this.ajax_get("queue", opt)
    }

    running(opt={}){
        return this.ajax_get("queue/running", opt)
    }

    add_url(url, opt={}){
        return this.ajax_get("add/"+url, opt)
    }

    list(url, opt={}){
        return this.ajax_get("list/"+url, opt)
    }

    cancel_running(url, opt={}){
        return this.ajax_get("running/cancel/"+url, opt)
    }

    restart_running(url, opt={}){
        return this.ajax_get("running/restart/"+url, opt)
    }

    remove_queue(url, opt={}){
        return this.ajax_get("queue/remove/"+url, opt)
    }

    clear_queue(opt={}){
        return this.ajax_get("clear/queue", opt)
    }

    clear_all(opt={}){
        return this.ajax_get("clear/all", opt)
    }

    clear_errors(opt={}){
        return this.ajax_get("clear/errors", opt)
    }

    remove_errors(i, opt={}){
        return this.ajax_get("remove/errors/"+i, opt)
    }

    remove_done(i, opt={}){
        return this.ajax_get("remove/done/"+i, opt)
    }


    clear_done(opt={}){
        return this.ajax_get("clear/done", opt)
    }

    add_post(data, opt={}){
        return this.ajax_post("add", data, opt)
    }

    list_file(url, opt={}){
        return this.ajax_post("list", data, opt)
    }

    set_config(data, opt={})
    {
        return this.ajax_post("config", data, opt)
    }

    get_config(data, opt={})
    {
        return this.ajax_get("config",opt)
    }

    subsonic_start_scan(opt={})
    {
        return this.ajax_get("subsonic/scan/start", opt)
    }

    subsonic_status_scan(opt={})
    {
        return this.ajax_get("subsonic/scan/status", opt)
    }

    subsonic_test(data, opt={})
    {
        return this.ajax_post("subsonic/test", data, opt)
    }

    restart_error(index, opt={})
    {
        return this.ajax_get("restart/error/"+index,opt)
    }

    manual_error(index, url, opt={})
    {
        return this.ajax_post("restart/error/"+index, {url: url},opt)
    }

    get_logs(data, opt={})
    {

        return this.ajax_get("user/logs?"+Utils.dictToParams(data),opt)
    }

    ping(url, opt={})
    {
        opt=Object.assign({
            ajax: {
                timeout: 1000
            }
        }, opt)
        this._ajax_get(url, opt)
    }
    exit(opt={})
    {

        if(dump) return this.ajax_get("exit/true",opt)
        return this.ajax_get(url,opt)
    }
    restart(opt={})
    {
        return this.ajax_get("restart",opt)
    }

    static SEARCH_ALBUM="album"
    static SEARCH_ALBUM="track"
    static SEARCH_ARTIST="artist"

    search(text, data, opt={}){
        data=Object.assign({type: "artist,track,album", offset: 0, limit: 10}, data)
        return this.ajax_get("search/"+text+"?type="+data.type+"&offset="+data.offset+"&limit="+data.limit, opt)
    }*/
}

class PublicationStatus {
    static IGNORE = 0;
    static A_FAIRE = 2;
    static A_MODIFIER = 3;
    static FAIT = 4;
    static to_str(x){
        switch(x){
            case PublicationStatus.IGNORE: return "Ne pas faire"
            case PublicationStatus.A_FAIRE: return "À faire"
            case PublicationStatus.A_MODIFIER: return "À modifier"
            case PublicationStatus.FAIT: return "Fait"
        }
    }

    static to_class(x){
        switch(x){
            case PublicationStatus.IGNORE: return "theme-5"
            case PublicationStatus.A_FAIRE: return "theme-1"
            case PublicationStatus.A_MODIFIER: return "theme-3"
            case PublicationStatus.FAIT: return "theme-2"
        }
    }
}

class Priorite {
    static IMPERATIF = 2;
    static IMPORTANT = 1;
    static SECONDAIRE = 0;

    static to_str(x){
        switch(x){
            case Priorite.IMPERATIF: return "Impératif"
            case Priorite.IMPORTANT: return "Important"
            case Priorite.SECONDAIRE: return "Secondaire"
        }
    }

    static to_class(x){
        switch(x){
            case Priorite.IMPERATIF: return "theme-1"
            case Priorite.IMPORTANT: return "theme-3"
            case Priorite.SECONDAIRE: return "theme-2"
        }
    }
}

var API = new OigccAPI()