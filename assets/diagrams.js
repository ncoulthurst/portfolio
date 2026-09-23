/* Renders Mermaid diagrams in the site's theme colours.
   Markup: <div class="diagram" role="img" aria-label="…"><script type="text/plain">flowchart DIR …</script></div>
   "DIR" becomes LR on wide screens and TB on narrow ones. Re-renders on theme toggle. */
(function () {
    if (!window.mermaid) return;
    var diagrams = Array.prototype.slice.call(document.querySelectorAll('.diagram'));
    if (!diagrams.length) return;

    diagrams.forEach(function (el) {
        var src = el.querySelector('script[type="text/plain"]');
        el.dataset.src = src ? src.textContent.trim() : '';
        var out = document.createElement('div');
        out.className = 'diagram-out';
        el.appendChild(out);
    });

    function token(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    // Mermaid's style syntax can't take rgba(), so flatten translucent tokens onto a base colour
    function solid(color, base) {
        var m = color.match(/rgba?\(([^)]+)\)/);
        if (!m) return color;
        var c = m[1].split(',').map(parseFloat), a = c.length > 3 ? c[3] : 1;
        var b = [1, 3, 5].map(function (i) { return parseInt(base.substr(i, 2), 16); });
        return '#' + [0, 1, 2].map(function (i) {
            return ('0' + Math.round(c[i] * a + b[i] * (1 - a)).toString(16)).slice(-2);
        }).join('');
    }
    function direction() {
        return window.innerWidth >= 900 ? 'LR' : 'TB';
    }

    var renderCount = 0;
    var lastDir = null;

    function render() {
        lastDir = direction();
        var ink = token('--ink'), mute = token('--mute'), surface = token('--surface'),
            bg = token('--bg'), bg2 = token('--bg-2'), accent = token('--accent'),
            hi = token('--surface-hi'), rule = solid(token('--rule-strong'), bg2);

        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'base',
            fontFamily: 'Geist, system-ui, sans-serif',
            flowchart: { curve: 'basis', htmlLabels: true, padding: 14, nodeSpacing: 36, rankSpacing: 44 },
            themeVariables: {
                fontFamily: 'Geist, system-ui, sans-serif',
                fontSize: '15px',
                background: bg,
                primaryColor: hi,
                primaryTextColor: ink,
                primaryBorderColor: rule,
                secondaryColor: surface,
                tertiaryColor: bg2,
                lineColor: mute,
                textColor: ink,
                clusterBkg: bg2,
                clusterBorder: rule,
                edgeLabelBackground: bg2,
                nodeTextColor: ink
            }
        });

        diagrams.forEach(function (el) {
            var src = el.dataset.src.replace(/\bDIR\b/, lastDir) +
                '\nclassDef accent fill:' + hi + ',stroke:' + accent + ',stroke-width:2px,color:' + ink +
                '\nclassDef quiet fill:' + bg2 + ',stroke:' + rule + ',stroke-dasharray:4 3,color:' + mute;
            var id = 'diagram-' + (++renderCount);
            mermaid.render(id, src).then(function (res) {
                var out = el.querySelector('.diagram-out');
                out.innerHTML = res.svg;
                // On small screens keep text readable: don't shrink below 520px (or the natural width), scroll instead
                var svg = out.querySelector('svg'), vb = svg && svg.viewBox.baseVal;
                if (vb && vb.width) svg.style.minWidth = Math.min(vb.width, 520) + 'px';
            }).catch(function (err) {
                console.error('Diagram failed to render', err);
            });
        });
    }

    render();

    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    var t;
    window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () { if (direction() !== lastDir) render(); }, 200);
    });
})();
