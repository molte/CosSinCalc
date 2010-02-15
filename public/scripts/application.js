$(function() {
  
  $('.slideable > h3').click(function() {
    $(this).next('.pane').slideToggle().parent().toggleClass('collapsed');
  });
  
  $('#header .nav li a').click(function() {
    if ($(this).hasClass('disabled')) return false;
  });
  
  $('#main a[title]').tooltip({
    position: 'bottom center',
    opacity: 0.7,
    tip: '#tooltip',
    offset: [10, 0]
  }).dynamic();
  
  $('#print').click(function() {
    window.print();
    return false;
  });
  
});
