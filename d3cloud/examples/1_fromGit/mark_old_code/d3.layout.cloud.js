// Word cloud layout by Jason Davies, http://www.jasondavies.com/word-cloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf
// 典型的自执行匿名函数，exports首选为d3.layout, 次选择为exports
(function(exports) {
  function cloud() {
    var size = [256, 256],
        text = cloudText,
        font = cloudFont,
        fontSize = cloudFontSize,
        rotate = cloudRotate,
        padding = cloudPadding,
        spiral = archimedeanSpiral,//阿基米德曲线
        words = [],//存储我们传入的数据
        timeInterval = Infinity,
        event = d3.dispatch("word", "end"),//事件分发器
        timer = null,
        cloud = {};

    cloud.start = function() {
      // board是返回一个值全部为0,长度为2048的数组
      var board = zeroArray((size[0] >> 5) * size[1]),
          bounds = null,
          n = words.length,
          i = -1,
          tags = [],
          data = words.map(function(d, i) {
            console.log('words:', d, i);
            return {
              text: text.call(this, d, i),
              font: font.call(this, d, i),
              rotate: rotate.call(this, d, i),
              size: ~~fontSize.call(this, d, i),//两个波浪线取正
              padding: cloudPadding.call(this, d, i),
              rx: typeof d['rx'] == 'undefined' ? undefined : d['rx'],
              ry: typeof d['ry'] == 'undefined' ? undefined : d['ry']
            };
          }).sort(function(a, b) { return b.size - a.size; });

      if (timer) clearInterval(timer);
      timer = setInterval(step, 0);
      step();

      return cloud;

      function step() {
        var start = +new Date,
            d;
        // 在时间轮询周期内，遍历每一个单词，且timer存在，这个时候timeInterval其实已经设定为无限大，timer为一个时间间隔为0秒的定时器，n为单词的个数， i 的初始值为-1
        while (+new Date - start < timeInterval && ++i < n && timer) {
          d = data[i];
          // 标签的坐标在这里确定
          // d.x = (size[0] * (Math.random() + .5)) >> 1;
          // d.y = (size[1] * (Math.random() + .5)) >> 1;
          d_px = typeof d.rx != 'undefined' && d.rx >= 0 && d.rx <= 1 ? d.rx : (Math.random() + .5);
          d_py = typeof d.ry != 'undefined' && d.ry >= 0 && d.ry <= 1 ? d.ry : (Math.random() + .5);
          if(typeof d.rx == 'undefined') {
            // 如果没有定义，d_px和d_py随机范围为0.5~1.5
            d.x = (size[0] * d_px) >> 1;
            d.y = (size[1] * d_py) >> 1;
            // 在通过右移一位，得到的范围为0.25~0.75, 即分别除以了2得到的范围，让单词的初始位置位于中心
          } else {
            d.x = (size[0] * d_px);
            d.y = (size[1] * d_py);
          } 
          //暂时不清楚是做什么的
          cloudSprite(d, data, i); // 这里还函数使用canvas来实现，并给x1\y1\xoff\yoff赋值
          
          if (place(board, d, bounds)) {
            tags.push(d);
            event.word(d);
            if (bounds) cloudBounds(bounds, d);
            else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
            // Temporary hack
            d.x -= size[0] >> 1;
            d.y -= size[1] >> 1;
          }
        }
        if (i >= n) {
          cloud.stop();
          event.end(tags, bounds);
        }
      }
    }

    cloud.stop = function() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return cloud;
    };

    cloud.timeInterval = function(x) {
      if (!arguments.length) return timeInterval;
      timeInterval = x == null ? Infinity : x;
      return cloud;
    };

    function place(board, tag, bounds) {
      // console.log(tag);
      var perimeter = [{x: 0, y: 0}, {x: size[0], y: size[1]}],
          startX = tag.x,
          startY = tag.y,
          maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),//对角线的长度
          s = spiral(size), // 阿基米德螺线
          dt = Math.random() < .5 ? 1 : -1,
          t = -dt,
          dxdy,
          dx,
          dy;
      while (dxdy = s(t += dt)) {
        // dx dy 为阿基米德线上的点
        dx = ~~dxdy[0];
        dy = ~~dxdy[1];

        if (Math.min(dx, dy) > maxDelta) break;
        // 在这里确定了点的位置，通过startx和starty来确定的，但是startx和starty都是tag的x和y值
        tag.x = startX + dx;
        tag.y = startY + dy;
        // 如果单词超出边界，则放弃
        if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
            tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
        // TODO only check for collisions within current bounds.
        if (!bounds || !cloudCollide(tag, board, size[0])) {
          if (!bounds || collideRects(tag, bounds)) {
            var sprite = tag.sprite,
                w = tag.width >> 5,
                sw = size[0] >> 5,
                lx = tag.x - (w << 4),
                sx = lx & 0x7f,
                msx = 32 - sx,
                h = tag.y1 - tag.y0,
                x = (tag.y + tag.y0) * sw + (lx >> 5),
                last;
            for (var j = 0; j < h; j++) {
              last = 0;
              for (var i = 0; i <= w; i++) {
                board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
              }
              x += sw;
            }
            delete tag.sprite;
            return true;
          }
        }
      }
      return false;
    }

    cloud.words = function(x) {
      if (!arguments.length) return words;
      words = x;
      return cloud;
    };

    cloud.size = function(x) {
      if (!arguments.length) return size;
      size = [+x[0], +x[1]];
      return cloud;
    };

    cloud.font = function(x) {
      if (!arguments.length) return font;
      font = d3.functor(x);
      return cloud;
    };

    cloud.rotate = function(x) {
      if (!arguments.length) return rotate;
      rotate = d3.functor(x);
      return cloud;
    };

    cloud.text = function(x) {
      if (!arguments.length) return text;
      text = d3.functor(x);
      return cloud;
    };

    cloud.spiral = function(x) {
      if (!arguments.length) return spiral;
      spiral = spirals[x + ""] || x;
      return cloud;
    };

    cloud.fontSize = function(x) {
      // console.log('cloud: fontSize:', x);
      if (!arguments.length) return fontSize;
      fontSize = d3.functor(x);
      return cloud;
    };

    cloud.padding = function(x) {
      // console.log('cloud: padding:', x);
      if (!arguments.length) return padding;
      padding = d3.functor(x);
      return cloud;
    };
    // https://github.com/mbostock/d3/wiki/%E5%86%85%E9%83%A8#rebind
    return d3.rebind(cloud, event, "on");
  }

  function cloudText(d) {
    return d.text;
  }

  function cloudFont() {
    return "serif";
  }

  function cloudFontSize(d) {
    // console.log('cloudFontSize: ', d);
    return Math.sqrt(d.value);
  }

  function cloudRotate() {
    return (~~(Math.random() * 6) - 3) * 30;
  }

  function cloudPadding() {
    // console.log('padding:');
    return 1;
  }

  // Fetches a monochrome sprite bitmap for the specified text.翻译为 获取指定文本黑白精灵位图。
  // Load in batches for speed.
  function cloudSprite(d, data, di) {
    if (d.sprite) return;
    // 清楚canvas所指定区域内的内容, 指定区域为整个canva区域
    c.clearRect(0, 0, cw << 5, ch);
    var x = 0,
        y = 0,
        maxh = 0,
        n = data.length;
    di--;
    // 遍历从这个单词开始往后面的单词
    while (++di < n) {
      d = data[di];
      c.save();// 用来保存Canvas的状态。save之后，可以调用Canvas的平移、放缩、旋转、错切、裁剪等操作。
      c.font = (d.size + 1) + "px " + d.font;
      var w = c.measureText(d.text + "m").width,// 返回包含指定文本的对象
          h = d.size << 1;// 这里暂时不清楚为什么么要左移一位，乘以了2，但是后面写入时右移抵消了
      if (d.rotate) {
        // 暂时不懂计算的原理是什么
        var sr = Math.sin(d.rotate * cloudRadians),
            cr = Math.cos(d.rotate * cloudRadians),
            wcr = w * cr,
            wsr = w * sr,
            hcr = h * cr,
            hsr = h * sr;
        w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
        h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
      } else {
        // 如果没有旋转则加上0x1f,即加上31，这里暂时不懂
        w = (w + 0x1f) >> 5 << 5;
      }
      if (h > maxh) maxh = h;
      // 如果字符串超出canvas的宽度，将x坐标重置为0，高度加上最高的，从这里可以知道应该是将所有的单词一行行地排列下去 
      if (x + w >= (cw << 5)) {
        x = 0;
        y += maxh;
        maxh = 0;
      }
      // 超出了canvas的高度，跳出循环
      if (y + h >= ch) break;
      // 将画布的位置移动
      c.translate(x + (w >> 1), y + (h >> 1));// 前面的左移h抵消掉了，但是w没有抵消，
      if (d.rotate) c.rotate(d.rotate * cloudRadians);
      c.fillText(d.text, 0, 0);//相对于画布0,0位置填充字符串
      c.restore(); // 用来恢复Canvas之前保存的状态。防止save后对Canvas执行的操作对后续的绘制有影响。

      d.width = w;
      d.height = h;
      d.xoff = x;
      d.yoff = y;
      d.x1 = w >> 1;//x1 y1 x0 y0 暂不清楚是做什么的
      d.y1 = h >> 1;
      d.x0 = -d.x1;
      d.y0 = -d.y1;
      x += w;
    }
    // pixels 为像素数组，一维数组，每四位代表一个像素点，分别代表rgba, 分别是从左上角到右下角的
    var pixels = c.getImageData(0, 0, cw << 5, ch).data,
        sprite = [];
    // 这个循环也不清楚是做什么的，从上面获取了pixels，感觉下面的循环是计算出每个字符串的掩模，即字符的形状
    while (--di >= 0) {//di 为单词的索引
      d = data[di];
      var w = d.width,
          w32 = w >> 5,
          h = d.y1 - d.y0,
          p = d.padding;
      // Zero the buffer
      for (var i = 0; i < h * w32; i++) sprite[i] = 0;
      x = d.xoff;
      if (x == null) return;
      y = d.yoff;
      var seen = 0,
          seenRow = -1;
      for (var j = 0; j < h; j++) {
        for (var i = 0; i < w; i++) {
          var k = w32 * j + (i >> 5),
              m = (pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 : 0) << (31 - (i % 32));
          if (p) {
            if (j) sprite[k - w32] |= m;
            if (j < w - 1) sprite[k + w32] |= m;
            m |= (m << 1) | (m >> 1);
          }
          sprite[k] |= m;
          seen |= m;
        }
        if (seen) seenRow = j;
        else {
          d.y0++;
          h--;
          j--;
          y++;
        }
      }
      d.y1 = d.y0 + seenRow;
      d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
    }
  }

  // Use mask-based collision detection.
  function cloudCollide(tag, board, sw) {
    // tag 是单词的属性
    // board是一个数组
    // sw 为设定的宽度
    // console.log(tag.sprite, board, sw);
    sw >>= 5;
    var sprite = tag.sprite,//也是数组
        w = tag.width >> 5,// 300 >> 5 ==> 9
        lx = tag.x - (w << 4),
        sx = lx & 0x7f,
        msx = 32 - sx,
        h = tag.y1 - tag.y0,
        x = (tag.y + tag.y0) * sw + (lx >> 5),
        last;
    // console.log('lx:', lx, ' sx: ', sx, ' msx: ', msx, ' h: ', h, ' x: ', x);
    for (var j = 0; j < h; j++) {
      last = 0;
      for (var i = 0; i <= w; i++) {
        // 这一段在判断什么呢
        // console.log('last << msx:', last, msx, last << msx, sprite[j * w + i]);
        if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
            & board[x + i]) return true;
      }
      x += sw;
    }
    return false;
  }
  // 扩展bounds
  function cloudBounds(bounds, d) {
    var b0 = bounds[0],
        b1 = bounds[1];
    if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
    if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
    if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
    if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
  }
  // a为tag， b为bounds
  function collideRects(a, b) {
    // 判断是否相交
    // console.log(a, b);
    return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
  }
  // 阿基米德螺线
  function archimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function(t) {
      return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
    };
  }

  function rectangularSpiral(size) {
    var dy = 4,
        dx = dy * size[0] / size[1],
        x = 0,
        y = 0;
    return function(t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
        case 0:  x += dx; break;
        case 1:  y += dy; break;
        case 2:  x -= dx; break;
        default: y -= dy; break;
      }
      return [x, y];
    };
  }

  // TODO reuse arrays?
  function zeroArray(n) {
    var a = [],
        i = -1;
    // n 为2的11次方，2048， 也就是返回一个值全部为0,长度为2048的数组
    while (++i < n) a[i] = 0;
    return a;
  }

  var cloudRadians = Math.PI / 180,
      cw = 1 << 11 >> 5,
      ch = 1 << 11,
      canvas;

  if (typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = cw << 5;
    canvas.height = ch;
  } else {
    // node-canvas support
    var Canvas = require("canvas");
    // 这里的canvas为长度2^11,宽度为2^11的矩形
    canvas = new Canvas(cw << 5, ch);
  }

  var c = canvas.getContext("2d"),
      spirals = {
        archimedean: archimedeanSpiral,
        rectangular: rectangularSpiral
      };
  c.fillStyle = "red";
  c.textAlign = "center";

  exports.cloud = cloud;//通过这里想外暴露为d3.layout.cloud
})(typeof exports === "undefined" ? d3.layout || (d3.layout = {}) : exports);
// d3.layout包括捆布局、弦布局、簇布局、力布局。。。