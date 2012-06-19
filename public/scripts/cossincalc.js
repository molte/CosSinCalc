/**
 * CosSinCalc version 6.0.7
 * http://cossincalc.com/
 * 
 * Note: This file should be minified at http://www.refresh-sf.com/yui/ set to "Minify only, no symbol obfuscation.".
 * 
 * Copyright (c) 2010-2012 Molte Emil Strange Andersen
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


var CosSinCalc = {};
CosSinCalc.VERSION = "6.0.7";

/**
 * -------------------------------------------------------
 * The Triangle class stores information about a triangle.
 */
CosSinCalc.Triangle = function() {
  /**
   * Calculates the variables of the triangle.
   * Set skipStart to true if variable parsing, validation and calculation should be skipped (used in alternative triangle).
   * Returns an object of exceptions on failure.
   */
  this.calculate = function(skipStart) {
    var validator  = new CosSinCalc.Triangle.Validator(this);
    var calculator = new CosSinCalc.Triangle.Calculator(this);
    var validation;
    
    if (!skipStart) {
      validation = validator.validate();
      if (!validation.isValid()) return validation;
      
      this.sides.amount = validation.sides.amount;
      calculator.calculateVariables();
    }
    
    validation = validator.validateCalculation(calculator);
    if (validation.isValid()) {
      calculator.calculateAdditionalVariables();
    }
    
    return validation;
  };
  
  /**
   * Reset the sides, angles etc. to their default values.
   */
  this.resetVariables = function() {
    this.altitudes   = { a: null, b: null, c: null };
    this.medians     = { a: null, b: null, c: null };
    this.sides       = { a: null, b: null, c: null, unit: 'degree', amount: 0 };
    this.angles      = { a: null, b: null, c: null, unit: null, bisectors: { a: null, b: null, c: null } };
    this.alternative = null;
    this.decimals    = 2;
    this.steps       = [];
  };
  
  /**
   * Executes the given callback function for each variable symbol.
   * If an array of variable names is passed, only those will be iterated through.
   */
  this.each = function() {
    var callback = arguments[arguments.length - 1];
    var array    = (arguments.length > 1 ? arguments[0] : CosSinCalc.Triangle.VARIABLES);
    
    for (var i = 0, n = array.length; i < n; i++) {
      if (callback(array[i], this.rest(i)) == false) return false;
    }
  };
  
  /**
   * Returns the variable symbols except the one at the given index.
   */
  this.rest = function(index) {
    var array = CosSinCalc.Triangle.VARIABLES.concat();
    array.splice(index, 1);
    return array;
  };
  
  /**
   * Copy the triangle to to use as alternative triangle.
   */
  this.copyAsAlternative = function() {
    this.alternative             = new CosSinCalc.Triangle();
    this.alternative.angles      = this.cloneObject(this.angles);
    this.alternative.sides       = this.cloneObject(this.sides);
    this.alternative.decimals    = this.decimals;
    this.alternative.alternative = this;
  };
  
  /**
   * Adds the equation to the list of steps performed to calculate the result.
   * The equation should be written in LaTeX.
   * Furthermore $1, $2 and $3 will be replaced by sides v1, v2 and v3,
   * and @1, @2 and @3 will be replaced by their respective angles.
   * Remember to escape back-slashes!
   */
  this.equation = function(latex, v1, v2, v3) {
    var variables = [v1, v2, v3], match, beforeMatch, symbols = '', values = '';
    
    while (latex.length > 0) {
      if (match = latex.match(/(\$|@)(\d)/)) {
        beforeMatch = latex.slice(0, match.index);
        symbols    += beforeMatch;
        values     += beforeMatch;
        
        v           = variables[match[2] * 1 - 1];
        symbols    += (match[1] == '@') ? v.toUpperCase() : v;
        values     += (match[1] == '@') ? this.formatAngle(this.angles[v], this.angles.unit, this.decimals, true) : this.side(v);
        
        latex       = latex.slice(match.index + 2);
      }
      else {
        symbols    += latex;
        values     += latex;
        latex       = '';
      }
    }
    
    values = values.split('=')
    values = values[1] + '=' + values[0]
    
    this.steps.push("&" + symbols + "=" + values);
  };
  
  /**
   * Returns all steps performed to calculate the result aligned nicely.
   */
  this.formatEquations = function() {
    return ("\\begin{align*}" + this.steps.join('\\\\') + "\\end{align*}");
  };
  
  /**
   * If no value is passed, returns the angle value rounded and converted to prefered unit.
   * If a vaule is passed,  updates the angle with the given value (converted to radians) and returns the new radian value.
   */
  this.angle = function(variable, value) {
    var undefined;
    if (value === undefined) {
      return this.formatAngle(this.angles[variable], this.angles.unit, this.decimals);
    }
    else {
      return (this.angles[variable] = this.parseAngle(value, this.angles.unit));
    }
  };
  
  /**
   * If no value is passed, returns the side value rounded.
   * If a value is passed,  updates the side with the given value and returns it.
   */
  this.side = function(variable, value) {
    var undefined;
    if (value === undefined) {
      return this.format(this.sides[variable], this.decimals);
    }
    else {
      return (this.sides[variable] = this.parse(value));
    }
  };
  
  /**
   * Returns the altitude value rounded.
   * Can only be used if the altitudes have yet been calculated.
   */
  this.altitude = function(variable) {
    return this.format(this.altitudes[variable], this.decimals);
  };
  
  /**
   * Returns the median value rounded.
   * Can only be used if the medians have yet been calculated.
   */
  this.median = function(variable) {
    return this.format(this.medians[variable], this.decimals);
  };
  
  /**
   * Returns the angle bisector value rounded.
   * Can only be used if the angle bisectors have yet been calculated.
   */
  this.anglebisector = function(variable) {
    return this.format(this.angles.bisectors[variable], this.decimals);
  };
  
  /**
   * Calculates and returns the area rounded.
   * Can only be used if the sides and angles have yet been calculated.
   */
  this.area = function() {
    return this.format(this.sides.a * this.sides.b * Math.sin(this.angles.c) / 2, this.decimals);
  };
  
  /**
   * Calculates and returns the circumference rounded.
   * Can only be used if the sides have yet been calculated.
   */
  this.circumference = function() {
    return this.format(this.sides.a + this.sides.b + this.sides.c, this.decimals);
  }
  
  this.resetVariables();
};

CosSinCalc.Triangle.VARIABLES      = ['a', 'b', 'c'];
CosSinCalc.Triangle.ERROR_MESSAGES = {
  notEnoughVariables: '3 values must be specified. Please fill in 3 of the text boxes.',
  tooManyVariables:   'Only 3 values should be specified. Please leave the rest of the text boxes empty.',
  noSides:            'At least one side must be given.',
  invalidSide:        'Only numbers (above zero) are accepted values for a side.',
  invalidAngle:       'Only numbers (above zero) are accepted values for an angle. Furthermore the angle must remain inside the scope of the sum of all angles in the triangle.',
  invalidTriangle:    'The specified values do not match a valid triangle.'
};

/**
 * ------------------------------------------------------------------
 * The Parser object handles parsing, converting and rounding actions.
 */
CosSinCalc.Parser = {
  /**
   * Converts an input value to a number.
   */
  parse: function(value) {
    if (value * 1 === value) return value;
    if (value == null || value == '') return null;
    value = value.replace(/[^\d\.,]+/g, '').split(/[^\d]+/);
    if (value.length > 1) {
      value.push('.' + value.pop());
    }
    return value.join('') * 1
  },
  
  /**
   * Converts an input angle value in some unit to a radian number.
   */
  parseAngle: function(value, fromUnit) {
    return this.convertAngle(this.parse(value), fromUnit);
  },
  
  /**
   * Converts a degree value to radians.
   */
  degreesToRadians: function(degrees) {
    return Math.PI * degrees / 180;
  },
  
  /**
   * Converts a gon value to radians.
   */
  gonToRadians: function(gon) {
    return Math.PI * gon / 200;
  },
  
  /**
   * Converts a radian value to degrees.
   */
  radiansToDegrees: function(radians) {
    return 180 * radians / Math.PI;
  },
  
  /**
   * Converts a radian value to gon.
   */
  radiansToGon: function(radians) {
    return 200 * radians / Math.PI;
  },
  
  /**
   * Converts the given value from the unit specified to radians.
   * If reverse is true, the value will be converted from radians to the specified unit.
   */
  convertAngle: function(value, unit, reverse) {
    if (value == null) return null;
    
    switch (unit) {
      case 'degree':
        return (reverse ? this.radiansToDegrees(value) : this.degreesToRadians(value));
      case 'gon':
        return (reverse ? this.radiansToGon(value) : this.gonToRadians(value));
      default:
        return value;
    }
  },
  
  /**
   * Rounds the value down to the specified amount of decimals.
   */
  round: function(value, decimals) {
    var multiplier = Math.pow(10, decimals);
    return (Math.round(value * multiplier) / multiplier);
  },
  
  /**
   * Formats the given value to improve human readability.
   */
  format: function(value, decimals) {
    value = this.round(value, decimals) + '';
    
    if (decimals) {
      var index = value.indexOf('.');
      if (index == -1) {
        value += '.';
        index = value.length - 1;
      }
      
      while (value.length - index - 1 < decimals) {
        value += '0';
      }
    }
    
    return value;
  },
  
  /**
   * Converts and formats the given angle value.
   */
  formatAngle: function(value, unit, decimals, isLatex) {
    value = this.format(this.convertAngle(value, unit, true), decimals);
    switch (unit) {
      case 'degree':
        return (value + (isLatex ? "^{\\circ}" : '\xb0'));
      case 'gon':
        return (value + (isLatex ? '\\text{ gon}' : ' gon'));
      default:
        return (value + (isLatex ? '\\text{ rad}' : ' rad'));
    }
  },
  
  /**
   * Returns a clone of an object.
   */
  cloneObject: function(source) {
    var clone = {};
    
    for (key in source) {
      clone[key] = source[key];
    }
    
    return clone;
  },
  
  /**
   * Returns whether the given angle value is acute or not.
   */
  isAcute: function(value) {
    return (value < Math.PI / 2);
  },
  
  /**
   * Returns whether the given angle value is obtuse or not.
   */
  isObtuse: function(value) {
    return (value > Math.PI / 2);
  }
};

CosSinCalc.Triangle.prototype = CosSinCalc.Parser;


/**
 * -----------------------------------------------------------------------
 * The Calculator class makes calculations on the variables of a triangle.
 * The t param should be the triangle object.
 */
CosSinCalc.Triangle.Calculator = function(t) {
  /**
   * Calculates the unknown variables.
   * Returns true on success. False otherwise.
   */
  this.calculateVariables = function() {
    switch (t.sides.amount) {
      case 3:
        calculateThreeAngles(); break;
      case 2:
        calculateTwoAngles(); break;
      case 1:
        calculateTwoSides(); break;
      default:
        return false;
    }
    return true;
  };
  
  /**
   * Calculates the last unkown angle and side.
   * This function is public so it is directly callable (used with ambiguous case).
   */
  this.calculateSideAndAngle = function() {
    calculateTwoSides();
  };
  
  /**
   * Calculates some additional variables like altitudes.
   */
  this.calculateAdditionalVariables = function() {
    calculateAltitudes();
    calculateMedians();
    calculateAngleBisectors();
  };
  
  /**
   * Calculates the angle based on the sides.
   * Used in Validator to validation the calculation.
   */
  this.calculateAngle = function(v, rest) {
    return calculateAngleBySides(v, rest);
  };
  
  /**
   * Calculates all three angles when all three sides are known.
   */
  function calculateThreeAngles() {
    t.each(function(v, rest) {
      if (!t.angles[v]) {
        t.angles[v] = calculateAngleBySides(v, rest);
        t.equation("@1=\\cos^{-1}\\left(\\frac{$2^2+$3^2-$1^2}{2\\cdot $2\\cdot $3}\\right)", v, rest[0], rest[1]);
      }
    });
  }
  
  /**
   * Calculates the value of an angle when all the sides are known.
   */
  function calculateAngleBySides(v, rest) {
    return Math.acos(
      (square(t.sides[rest[0]]) + square(t.sides[rest[1]]) - square(t.sides[v])) /
      (2 * t.sides[rest[0]] * t.sides[rest[1]])
    );
  }
  
  /**
   * Calculates two unkown angles when two sides and one angle are known.
   */
  function calculateTwoAngles() {
    t.each(function(v, rest) {
      if (t.angles[v]) {
        if (!t.sides[v]) {
          t.sides[v] = Math.sqrt(
            square(t.sides[rest[0]]) + square(t.sides[rest[1]]) -
            2 * t.sides[rest[0]] * t.sides[rest[1]] * Math.cos(t.angles[v])
          );
          t.equation("$1=\\sqrt{$2^2+$3^2-2\\cdot $2\\cdot $3\\cdot \\cos(@1)}", v, rest[0], rest[1]);
          calculateThreeAngles();
          return false;
        }
        
        t.each(rest, function(v2) {
          if (t.sides[v2]) {
            t.angles[v2] = Math.asin( Math.sin(t.angles[v]) * t.sides[v2] / t.sides[v] );
            t.equation("@2=\\sin^{-1}\\left(\\frac{\\sin(@1)\\cdot $2}{$1}\\right)", v, v2);
            
            if (isAmbiguousCase(v, v2)) {
              t.copyAsAlternative();
              t.alternative.angles[v2] = Math.PI - t.angles[v2];
              t.alternative.equation("@2=" + t.formatAngle(Math.PI, t.angles.unit, t.decimals, true) + "-\\sin^{-1}\\left(\\frac{\\sin(@1)\\cdot $2}{$1}\\right)", v, v2);
              
              var alternativeCalculator = new CosSinCalc.Triangle.Calculator(t.alternative);
              alternativeCalculator.calculateSideAndAngle();
              t.alternative.calculate(true);
            }
            
            calculateTwoSides();
            return false;
          }
        });
        return false;
      }
    });
  };
  
  /**
   * Calculates up to two unkown sides when at least one side and two angles are known.
   */
  function calculateTwoSides() {
    calculateLastAngle();
    
    t.each(function(v, rest) {
      if (t.sides[v]) {
        t.each(rest, function(v2) {
          if (!t.sides[v2]) {
            t.sides[v2] = Math.sin(t.angles[v2]) * t.sides[v] / Math.sin(t.angles[v]);
            t.equation("$2=\\frac{\\sin(@2)\\cdot $1}{\\sin(@1)}", v, v2);
          }
        });
        return false;
      }
    });
  }
  
  /**
   * Calculates the last unkown angle.
   */
  function calculateLastAngle() {
    t.each(function(v, rest) {
      if (!t.angles[v]) {
        t.angles[v] = Math.PI - t.angles[rest[0]] - t.angles[rest[1]];
        t.equation("@1=" + t.formatAngle(Math.PI, t.angles.unit, t.decimals, true) + "-@2-@3", v, rest[0], rest[1]);
        return false;
      }
    });
  }
  
  /**
   * Calculates and returns whether the triangle has multiple solutions.
   * See http://en.wikipedia.org/wiki/Law_of_sines#The_ambiguous_case
   */
  function isAmbiguousCase(v1, v2) {
    return (t.isAcute(t.angles[v1]) && t.sides[v1] < t.sides[v2] && t.sides[v1] > t.sides[v2] * Math.sin(t.angles[v1]));
  }
  
  /**
   * Calculates the square of a number.
   */
  function square(number) {
    return number * number;
  }
  
  /**
   * Calculates the altitude for each angle.
   */
  function calculateAltitudes() {
    t.each(function(v, rest) {
      t.altitudes[v] = Math.sin(t.angles[rest[0]]) * t.sides[rest[1]];
    });
  }
  
  /**
   * Calculates the median for each side.
   */
  function calculateMedians() {
    t.each(function(v, rest) {
      t.medians[v] = Math.sqrt( ( 2 * square(t.sides[rest[0]]) + 2 * square(t.sides[rest[1]]) - square(t.sides[v]) ) / 4 );
    });
  }
  
  /**
   * Calculates the angle bisectors of each angle.
   */
  function calculateAngleBisectors() {
    t.each(function(v, rest) {
      t.angles.bisectors[v] = Math.sin(t.angles[rest[0]]) * t.sides[rest[1]] / Math.sin(t.angles[rest[1]] + t.angles[v] / 2);
    });
  }
};

/**
 * ----------------------------------------------------------------------------------------
 * The Validator class validates the variables of a triangle, before and after calculation.
 * The t param should be the triangle object.
 */
CosSinCalc.Triangle.Validator = function(t) {
  var NOT_ENOUGH_VARIABLES = '3 values must be specified. Please fill in 3 of the text boxes.',
      TOO_MANY_VARIABLES   = 'Only 3 values should be specified. Please leave the rest of the text boxes empty.',
      NO_SIDES             = 'At least one side must be given.',
      INVALID_SIDE         = 'Only numbers (above zero) are accepted values for a side.',
      INVALID_ANGLE        = 'Only numbers (above zero) are accepted values for an angle. Furthermore the angle must remain inside the scope of the sum of all angles in the triangle.',
      INVALID_TRIANGLE     = 'The specified values do not match a valid triangle.';
  
  var validation = {
    sides:      { a: null, b: null, c: null, amount: 0 },
    angles:     { a: null, b: null, c: null, amount: 0 },
    exceptions: [],
    isValid:    function() {
      return (!this.exceptions.length);
    },
    total:      function() {
      return (this.sides.amount + this.angles.amount);
    }
  };
  
  /**
   * Validates the sides and angles.
   * Returns full validation result.
   */
  this.validate = function() {
    t.each(function(v) {
      if (t.sides[v]  != null) validateSide(v);
      if (t.angles[v] != null) validateAngle(v);
    });
    
    if (validation.isValid()) {
      validateAmount();
    }
    
    return validation;
  };
  
  /**
   * Checks if the calculation was successfull and the variable values given match a triangle.
   * Returns full validation result.
   */
  this.validateCalculation = function(calculator) {
    var proceed = t.each(function(v, rest) {
      if (!sideIsValid(t.sides[v]))   return false;
      if (!angleIsValid(t.angles[v])) return false;
      
      var validatorAngle = calculator.calculateAngle(v, rest);
      if (validatorAngle > t.angles[v] + 0.01 || validatorAngle < t.angles[v] - 0.01) return false;
    });
    if (proceed == false) raiseException(INVALID_TRIANGLE);
    
    return validation;
  };
  
  /**
   * Validates the amount of variables given corresponds to the amount required to calculate the rest.
   */
  function validateAmount() {
    if (validation.total() < 3)      return raiseException(NOT_ENOUGH_VARIABLES);
    if (validation.total() > 3)      return raiseException(TOO_MANY_VARIABLES);
    if (validation.sides.amount < 1) return raiseException(NO_SIDES);
  }
  
  /**
   * Validates a side.
   */
  function validateSide(variable) {
    if (sideIsValid(t.sides[variable])) {
      validation.sides.amount++;
      validation.sides[variable] = true;
    }
    else {
      validation.sides[variable] = false;
      raiseException(INVALID_SIDE);
    }
  }
  
  /**
   * Returns true if the value is a valid side. Otherwise false.
   */
  function sideIsValid(value) {
    return (!isNaN(value) && isFinite(value) && value && value > 0);
  }
  
  /**
   * Validates an angles.
   */
  function validateAngle(variable) {
    if (angleIsValid(t.angles[variable])) {
      validation.angles.amount++;
      validation.angles[variable] = true;
    }
    else {
      validation.angles[variable] = false;
      raiseException(INVALID_ANGLE);
    }
  }
  
  /**
   * Returns true if the value is a valid angle. Otherwise false.
   */
  function angleIsValid(value) {
    return (sideIsValid(value) && value < Math.PI);
  }
  
  /**
   * Stores the error message for later reference.
   * Returns full validation result.
   */
  function raiseException(message) {
    if (validation.exceptions[validation.exceptions.length - 1] != message) validation.exceptions.push(message);
    return validation;
  }
};


/**
 * ------------------------------------------------------------------------------------------------------
 * The Drawing class calculates the coordinates of the points and the code required to draw the triangle.
 * The parameter t should be the triangle object.
 * Depedencies: Raphaël (http://raphaeljs.com/)
 */
CosSinCalc.Triangle.Drawing = function(t, canvasSize, padding) {
  if (!canvasSize) canvasSize = 500;
  if (!padding)    padding    =  25;
  var coords = {}, canvasHeight = canvasSize;
  
  this.draw = function(container) {
    calculateCoords();
    resize();
    canvasHeight = coords.b[1];
    invertCoords();
    applyPadding();
    
    var paper   = Raphael(container, canvasSize + padding * 2, canvasHeight + padding * 2);
    var polygon = paper.path("M " + coords.a.join(' ') + " L " + coords.b.join(' ') + " L " + coords.c.join(' ') + " Z");
    polygon.attr({
      'fill': '#f5eae5',
      'stroke': '#993300',
      'stroke-width': 1
    });
    
    drawLabel(paper, coords.a[0], coords.a[1] + 10, "A = " + t.angle('a'));
    drawLabel(paper, coords.b[0], coords.b[1] - 10, "B = " + t.angle('b'));
    drawLabel(paper, coords.c[0], coords.c[1] + 10, "C = " + t.angle('c'));
    
    drawLabel(paper, (coords.c[0] - coords.b[0]) / 2 + coords.b[0], (coords.c[1] - coords.b[1]) / 2 + coords.b[1], "a = " + t.side('a')).attr('fill', '#333');
    drawLabel(paper, (coords.c[0] - coords.a[0]) / 2 + coords.a[0], coords.a[1], "b = " + t.side('b')).attr('fill', '#333');
    drawLabel(paper, (coords.b[0] - coords.a[0]) / 2 + coords.a[0], (coords.c[1] - coords.b[1]) / 2 + coords.b[1], "c = " + t.side('c')).attr('fill', '#333');
  };
  
  /**
   * Draws a label with the specified text and a background (to improve readability) at the given position.
   */
  function drawLabel(paper, x, y, text) {
    var label      = paper.text(x, y, text).attr({
      'font-size': 12,
      'font-family': 'Verdana'
    });
    var dimensions = label.getBBox();
    var background = paper.rect(dimensions.x - 4, dimensions.y - 2, dimensions.width + 8, dimensions.height + 4).attr({
      'fill': '#fff',
      'fill-opacity': 0.5,
      'stroke': 'none'
    }).insertBefore(label);
    
    return label;
  }
  
  /**
   * Calculates the coordinates for the corners of the triangle.
   */
  function calculateCoords() {
    coords.a = [0, 0];
    coords.c = [t.sides.b, 0];
    coords.b = [Math.sqrt(t.sides.c * t.sides.c - t.altitudes.b * t.altitudes.b), t.altitudes.b];
    if (t.isObtuse(t.angles.a)) {
      coords.b[0] *= -1;
      moveCoords();
    }
  }
  
  /**
   * Scales the coordinates to fit the size of the canvas.
   */
  function resize() {
    var width  = Math.max(coords.c[0] - coords.b[0], coords.b[0], coords.c[0]);
    var height = coords.b[1];
    
    scaleCoords(canvasSize / Math.max(width, height));
  }
  
  /**
   * Scale the coordinates with the given amount.
   */
  function scaleCoords(scaleFactor) {
    t.each(function(v) {
      coords[v][0] *= scaleFactor;
      coords[v][1] *= scaleFactor;
    });
  }
  
  /**
   * Moves the corners of the triangle so that the most left one will be placed at the very left of the canvas, if that does not already apply.
   * Should only be called if angle A is obtuse.
   */
  function moveCoords() {
    var distance = coords.b[0] * -1;
    
    t.each(function(v) {
      coords[v][0] += distance;
    });
  }
  
  /**
   * Switches between coordinate system with origin in bottom-left and top-left.
   */
  function invertCoords() {
    t.each(function(v) {
      coords[v][1] = canvasHeight - coords[v][1];
    });
  }
  
  /**
   * Adds a padding to the coordinates.
   */
  function applyPadding() {
    t.each(function(v) {
      coords[v][0] += padding;
      coords[v][1] += padding;
    });
  }
};
