/*String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }
    return str;
};*/



class Utils
{
    static CHARACTERS="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPRQSTUVWXYZ0123456789";

    static  getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }

    static randomId(n=16){
        var out=""
        var m = Utils.CHARACTERS.length;
        for(var i=0; i<n; i++) out+=Utils.CHARACTERS[Utils.getRandomInt(m)];
        return out+Date.now();
    }

    static formatDurationHMS(n){
        var out = "";
        n=Math.ceil(n)
        if(n>=3600){
            var h = Math.floor(n/3600)
            out+=h+"h "
            n=n%3600;
        }
        if(n>=60){
            var m = Math.floor(n/60)
            out+=m+"min "
            n=n%60;
        }
        if(n>0){
            out+=n+"s"
        }
        return out;
    }


    static newid(length=16) {
        var result           = [];
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result.push(characters.charAt(Math.floor(Math.random() *
     charactersLength)));
       }
       return result.join('');
    }


    static zeroPadding(s, n){
        var prefix="";
        s=s+"";
        n-=s.length;
        while(n>0){
            prefix+="0";
            n--;
        }
        return prefix+s;
    }

    static timestampToStr(UNIX_timestamp){
        var a = new Date(UNIX_timestamp * 1000);
        var year = a.getFullYear();
        var month = a.getMonth()+1;
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        date=Utils.zeroPadding(date, 2);
        month=Utils.zeroPadding(month, 2);
        year=Utils.zeroPadding(year, 2);
        hour=Utils.zeroPadding(hour, 2);
        min=Utils.zeroPadding(min, 2);
        sec=Utils.zeroPadding(sec, 2);
        var time = date + '/' + month + '/' + year + ' - ' + hour + ':' + min + ':' + sec ;
        return time;
    }

    static dictToParams(obj){
        var str = [];
        for(var p in obj)
         str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        return str.join("&");
    }
}

class Template {
    static callbacks=[]
    static is_init=false
    static parameter_to_json(x="", data={}){
        if(Array.isArray(data)) return data;
        var out ={}
        x=x.split(";")
        for(var i in x){
            var tmp = x[i].split("=")
            if(tmp.length==2){
                out[tmp[0]]=tmp[1];
            }else if(tmp[0].length){
                out[tmp[0]]=true;
            }
        }
        return Object.assign(out, data)
    }

    static instanciate(templateid, data={}){
        if(templateid=="template-artist"){
            //console.log(data)
        }
        if(!$("#"+templateid).length){
            console.log("ERREUR: le template '"+templateid+"' est introuvable")
            return null;
        }

        data=Template.parameter_to_json($("#"+templateid).data("param"), data);
        var templateText = $("#"+templateid)[0].innerHTML
        templateText=Mustache.render(templateText, data)
        var root =$(templateText)

        //find ne regarde pas dans l'lélement racine il faut passer par un parent pour l'utiliser
        var fakeroot=$("<div></div>");

        fakeroot.append(root)
        fakeroot.find("[data-template]").each(function(i,e){
            var elem =$(e)
            var attr=elem.attr("data-var")
            var ndata = attr=="."?data:(data?data[attr]:null);
            if(ndata!=undefined){

                if(Array.isArray(ndata)){
                    var src = elem;
                    for(var j in ndata){
                        var nndata = ndata[j];
                        var dst = Template.instanciate(src.attr("data-template"), nndata)
                        if(dst)
                            dst.insertBefore(src)
                    }
                    src.remove()
                }else{
                    Template.replace(elem, ndata)
                }
            }else{
                Template.replace(elem, data)
            }
        })
        return fakeroot.children()
    }

    static replace(src, data={}, templateid=null){
        var tid = templateid?templateid:src.attr("data-template")
        data=Template.parameter_to_json(src.data("param"), data)
        var dst = Template.instanciate(tid, data)
        if(!dst) return;
        dst.insertAfter(src)
        src.remove()
    }

    static append(root, data, templateid=null){
        if(typeof(root)=="string"){
            if(root[0]!="#") root="#"+root;
            root=$(root)
        }
        var tid = Utils.newid(32);
        var temp = $('<a id="'+tid+'"></a>')
        root.append(temp)
        Template.replace(temp, data, templateid)
    }

    static init(){
        Mustache.tags = ['[[', ']]'];
        $("[data-template]").each(function(i,e){
            e = $(e)
            var tid = e.data("template")
            Template.replace(e)
        })
        Template.is_init=true
        for(var i in Template.callbacks){
            Template.callbacks[i]();
        }
    }

    static ready(fct){
        if(Template.is_init){
            fct();
        }else{
            Template.callbacks.push(fct)
        }
    }
}

$(document).ready(function(){
    Template.init();
})