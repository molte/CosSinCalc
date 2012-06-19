head.ready(function() {
  
  $('.slideable > h3').click(function() {
    $(this).next('.pane').toggle().parent().toggleClass('collapsed');
  });
  
  $('#header .nav a.disabled').click(function() {
    return false;
  });
  
});
