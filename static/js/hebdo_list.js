

function hebdo_edit(id){
    location.href='/hebdo/'+id
}
var hebdo_to_remove=null;
function _hebdo_delete(){
    if(hebdo_to_remove){
        API.hebdo_delete(hebdo_to_remove, function(){
            $("#hebdo-entry-"+hebdo_to_remove).remove()
            hebdo_to_remove=null;
        })
    }
}

function hebdo_delete(id){
    hebdo_to_remove=id;
    confirm("Êtes-vous sur ?", "Voulez vou vraiment supprimer cet Hebdo ? Cette action est irréversible...", _hebdo_delete)
}
