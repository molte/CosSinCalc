head.ready(function() {
  
  // Lookup commonly used elements.
  var calculator      = $('#calculator');
  var inputs          = $('input.number', calculator);
  var triangleImage   = $('.drawing img', calculator);
  var errorsContainer = $('#errors');
  var triangle;
  
  // Calculate triangle on form submit.
  calculator.submit(function() {
    // Clear errors.
    errorsContainer.empty();
    
    triangle = new CosSinCalc.Triangle();
    
    // Set angle unit.
    triangle.angles.unit = $("input[name='angle_unit']:checked").val();
    
    // Collect variables.
    inputs.each(function() {
      var name = this.id.split('_');
      triangle[name[0]](name[1], this.value);
    });
    
    // Execute calculation.
    var result = triangle.calculate();
    
    if (result.isValid()) {
      // Update result tab.
      writeOutput();
      
      // Enable and switch to result tab.
      tabs.eq(1).removeClass('disabled').click();
      
      // Update URL fragment.
      $.bbq.pushState(calculator.serialize(), 2);
      
      // Update origination notice to show on print.
      $('#origination_notice').text('Printed from ' + window.location.href + '.');
    }
    else {
      // Write error messages in unordered list.
      var errorList = $(document.createElement('ul'));
      for (var i = 0, n = result.exceptions.length; i < n; i++) {
        errorList.append('<li>' + result.exceptions[i] + '</li>');
      }
      errorsContainer.text('Some errors occured:').append(errorList);
      
      // Mark form fields with errors.
      inputs.each(function() {
        var name = this.id.split('_');
        if (result[name[0] + 's'][name[1]] == false) $(this).addClass('error');
      });
    }
    
    // Prevent default form submit action.
    return false;
  });
  
  function writeOutput() {
    // Write variables to result table.
    $('#result table.variables .variable').each(function() {
      var name = this.id.split('_');
      $(this).text(triangle[name[0]](name[1]));
    });
    
    $('#area_result').text(triangle.area());
    $('#circumference_result').text(triangle.circumference());
    
    $('#calculation_notice').toggle(!!triangle.alternative);
    
    // Render equations.
    var equations = triangle.formatEquations();
    $('#calculation_steps').html(equations);
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'calculation_steps']);
    
    // Draw triangle (asynchronously).
    setTimeout(function() {
      var container = $('#drawing').empty();
      var drawing   = new CosSinCalc.Triangle.Drawing(triangle, 300, 50);
      drawing.draw(container[0]);
    }, 100);
  }
  
  // Clear all text fields and remove errors on reset.
  $('#clear').click(function() {
    inputs.val('').removeClass('error');
    errorsContainer.empty();
  });
  
  // Link triangle image map to form fields.
  $('#triangle_variables_map area').click(function() {
    $($(this).attr('href')).focus();
    return false;
  });
  
  // Make all navigation tabs not linking to another page, act as tab.
  var tabs = $("#header .nav a[href^='#']");
  var tabPanes = $('#main > .pane');
  var currentTab = 0;
  
  tabs.first().addClass('active');
  
  tabs.each(function(i) {
    $(this).click(function() {
      if (i != currentTab && !$(this).hasClass('disabled')) {
        tabs.removeClass('active').eq(i).addClass('active');
        tabPanes.hide().eq(i).show();
        currentTab = i;
      }
      
      return false;
    });
  });
  
  // Change triangle image overlay on form field focus/blur.
  inputs.focus(function() {
    $(this).removeClass('error').addClass('focus').select();
    triangleImage.attr('src', overlaySource(this.id));
  }).blur(function() {
    $(this).removeClass('focus');
    triangleImage.attr('src', '/images/triangle_overlay_empty.png');
  });
  
  function overlaySource(id) {
    return '/images/triangle_overlay_' + id + '.png';
  }
  
  // Preload overlay images (asynchronously).
  setTimeout(function() {
    var overlay = new Image();
    inputs.each(function() {
      overlay.src = overlaySource(this.id);
    });
  }, 100);
  
  $('#increase_precision').click(function() {
    if (!triangle.decimals) $('#decrease_precision').removeClass('disabled');
    triangle.decimals++;
    writeOutput();
    return false;
  });
  
  $('#decrease_precision').click(function() {
    if (triangle.decimals) {
      triangle.decimals--;
      writeOutput();
      if (!triangle.decimals) $(this).addClass('disabled');
    }
    return false;
  });
  
  $('#show_alternative').click(function() {
    triangle = triangle.alternative;
    triangle.decimals = triangle.alternative.decimals;
    writeOutput();
    return false;
  });
  
  // Check if a URL to a saved calculation is passed.
  if ($.param.fragment()) {
    // Fill in form fields and calculate result.
    calculator.deserializeObject($.deparam.fragment()).submit();
  }
  else {
    // Autofocus first form field.
    inputs.first().focus();
  }
  
});
