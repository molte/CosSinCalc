jQuery.fn.deserializeObject = function(hash){

	t = this;
    map = {};
	
    find = function(selector){
		return t.is("form") ? t.find(selector) : t.filter(selector);
	};
    
	
	//Get map of values
    jQuery.each(hash.split("&"), function(){
        section = this.split("=");
        name = decodeURIComponent(section[0]);
        value = section.length > 1 ? decodeURIComponent(section[1]) : null;
        
		if (!(name in map)) {
            map[name] = [];
        }
       
	   map[name].push(value);
    })
	
	
    //Set values for all form elements in the data
    jQuery.each(map, function(name, value){
        find("[name='" + name + "']").val(value);
    })
	
	
    //Clear all form elements not in form data
    find("input:text,select,textarea").each(function(){
        if (!(jQuery(this).attr("name") in map)){
            jQuery(this).val("");
        }
    })
    find("input:checkbox:checked,input:radio:checked").each(function(){
        if (!(jQuery(this).attr("name") in map)){
            this.checked = false;
        }
    })
    return this;
};