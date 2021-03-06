(function(w, d){

  var gid = function(id){return d.getElementById(id);};
  var canv = gid('drawing');
  var bsave = gid('save');
  var bnew = gid('new');
  var img = gid('img');
  var form = gid('form');
  var ndrawing = gid('new_drawing');
  var settings = gid('settings');
  var about = gid('about');
  var minWidth = 0;
  var minHeight = 0;
  var drew = false;
  var ctx = null;
  var copyCanv = null;
  var copyCtx = null;
  var canvMargin = null;
  var canvBackground = null;
  var canvForeground = null;
  var canvWidth = null;
  var canvHeight = null;
  var canvClassList = [];
  var canvLeft = 0;
  var canvTop = 0;
  var pxRatio = w.devicePixelRatio || 1;

  if (!canv.getContext) {
    w.alert('Your browser does not support canvas, you need to update it before using scri.ch.');
    return;
  }

  ctx = canv.getContext('2d');
  copyCanv = d.createElement('canvas');
  copyCtx = copyCanv.getContext('2d');

  // Init settings
  canvMargin = w.SCRICH_SETTINGS.margin || 0;
  canvBackground = w.SCRICH_SETTINGS.background || 'transparent';
  canvForeground = w.SCRICH_SETTINGS.foreground || '#000000';
  if (w.SCRICH_SETTINGS.size) {
    canvWidth = w.SCRICH_SETTINGS.size.width || null;
    canvHeight = w.SCRICH_SETTINGS.size.height || null;
    canvMargin = 0; // If a size is defined, no margin
  }

  // Webkit fix
  d.onselectstart = function(){return false;};

  function resizeCanvas(toWidth, toHeight) {

    // Save img data
    var imgData = ctx.getImageData(0, 0, canv.width, canv.height);

    // Resize canvas
    canv.width  = canvWidth  || toWidth  || ((w.innerWidth-canvMargin*2 > minWidth)?    w.innerWidth-canvMargin*2 :  minWidth);
    canv.height = canvHeight || toHeight || ((w.innerHeight-canvMargin*2 > minHeight)?  w.innerHeight-canvMargin*2 : minHeight);

    if (canvWidth) {
      canvLeft = (w.innerWidth/2 - canvWidth/2);
      canv.style.left = canvLeft + 'px';
    }
    if (canvHeight) {
      canvTop = (w.innerHeight/2 - canvHeight/2);
      canv.style.top = canvTop + 'px';
    }

    // Restore img data
    // ctx.putImageData(imgData, 0, 0);

    // Firefox fix, need to copy it to another canvas
    copyCanv.width = imgData.width;
    copyCanv.height = imgData.height;
    copyCtx.putImageData(imgData, 0, 0);
    if (canvBackground !== 'transparent') {
      ctx.fillStyle = canvBackground;
      ctx.fillRect(0, 0, canv.width, canv.height);
    }
    ctx.drawImage(copyCanv, 0, 0);
  }

  function mousemove(e) {
    e.preventDefault();
    var c = getCoords(e);
    drawLine(c.x, c.y);
  }

  function startDraw(e) {
    var c = getCoords(e);
    drawPoint(c.x, c.y); // Draw a point on click

    // Prepare for line drawing
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);

    showBtns();

    w.addEventListener('mousemove', mousemove, false);
    canv.addEventListener('touchmove', mousemove, false);
  }

  function endDraw() {
    ctx.stroke();
    w.removeEventListener('mousemove', mousemove, false);
    canv.removeEventListener('touchmove', mousemove, false);
  }

  function updateMinDims(width, height) {
    if (width > canv.width) {
      width = canv.width;
    }
    if (height > canv.height) {
      height = canv.height;
    }
    if (width > minWidth) {
      minWidth = width;
    }
    if (height > minHeight) {
      minHeight = height;
    }
  }

  function drawPoint(x, y) {
    updateMinDims(x+1, y+1);
    ctx.fillStyle = canvForeground;
    ctx.fillRect(x-1, y-1, 2, 2);
  }

  function drawLine(x, y) {
    updateMinDims(x+1, y+1);
    ctx.strokeStyle = canvForeground;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function showBtns() {
    if (!drew) {
      drew = true;
      var btns = [bsave, bnew, about];
      var preventFn = function(e){e.stopPropagation();};
      while (btns.length) {
        var btn = btns.shift();
        btn.style.display = 'block';
        btn.addEventListener('mousedown', preventFn, false);
      }
    }
  }

  function getCoords(e) {
    return {
      x: ((e.touches)? e.touches[0].pageX : e.pageX) - canvMargin - canvLeft,
      y: ((e.touches)? e.touches[0].pageY : e.pageY) - canvMargin - canvTop
    };
  }

  function helpTimer() {
    var baseTitle = d.title;
    var nbsp = '\u00a0';
    var pen = '\u270e';
    var left = true;
    var timer;

    function loop(){
      d.title = 'Draw! ' + (left? '':nbsp) + pen + (left? nbsp:'');
      left = !left;
      timer = w.setTimeout(loop, 300);
    }

    timer = w.setTimeout(loop, 4000);

    return {
      stop: function(){
        w.clearTimeout(timer);
        d.title = baseTitle;
      }
    };
  }

  function start(help) {

    // Margin parameter
    if (canvMargin > 0) {
      canvClassList.push('margin');
      canv.style.left = canvMargin+'px';
      canv.style.top = canvMargin+'px';
    }

    // Background parameter
    if (canvBackground) {
      canvClassList.push('margin');
      canv.style.left = canvMargin+'px';
      canv.style.top = canvMargin+'px';
    }

    // Set classes on the canvas element
    if (canvClassList.length > 0) {
      canv.className = canvClassList.join(' ');
    }

    w.addEventListener('resize', function(){
      resizeCanvas();
    }, false);
    resizeCanvas();

    // Disable the touchmove event
    d.body.addEventListener('touchmove', function(e){
      e.preventDefault();
    }, false);

    // Down
    canv.addEventListener('mousedown', function(e){
      if (e.button === 0) {
        startDraw(e);
        if (help) {
          help.stop();
          help = null;
        }
      }
    }, true);
    canv.addEventListener('touchstart', function(e){
      e.preventDefault();
      startDraw(e);
      if (help) {
        help.stop();
        help = null;
      }
    }, false);

    // Up
    w.addEventListener('mouseup', endDraw, false);
    canv.addEventListener('touchend', endDraw, false);

    // Save
    bsave.onclick = function() {
      var canvCurrentWidth = canv.width,
          canvCurrentHeight = canv.height;
      resizeCanvas(minWidth, minHeight);
      if (minWidth > 0 && minHeight > 0) {
        settings.value = JSON.stringify(w.SCRICH_SETTINGS);
        ndrawing.value = canv.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
        form.submit();
      }
      resizeCanvas(canvCurrentWidth, canvCurrentHeight);
    };

    // New
    bnew.onclick = function() {
      w.location = w.SCRICH_URL;
    };
  }

  var loadImg = w.loadImg = function(src, callback) {
    var cImg = new w.Image();
    cImg.onload = function() {
      canv.width = minWidth = cImg.width;
      canv.height = minHeight = cImg.height;
      try {
        ctx.drawImage(cImg, 0, 0);
      } catch (err) { // Firefox 3.6 loading bug
        w.setTimeout(function(){
          loadImg(src, callback);
        }, 300);
      }

      if (callback) {
        callback();
      }
    };
    cImg.src = src;
  };

  if (img) {
    loadImg(img.src, start);
  } else {
    start(helpTimer());
  }

})(this, this.document);
