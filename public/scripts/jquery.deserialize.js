jQuery.fn.deserializeObject = function(hash) {
  for (name in hash) {
    var elem = $("[name='" + name + "']", this);
    if (elem.is('select[multiple], :radio, :checkbox')) {
      elem.val([hash[name]]);
    }
    else{
      elem.val(hash[name]);
    }
  }
  return $(this);
};
