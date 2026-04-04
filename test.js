

function drawBarChart(slice) {
    const svg    = document.getElementById("xp-graph")
    const W      = 800
    const H      = 400
    const margin = { top: 30, right: 30, bottom: 120, left: 60 }
    const innerW = W - margin.left - margin.right
    const innerH = H - margin.top  - margin.bottom

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`)
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
    svg.removeAttribute("width")
    svg.removeAttribute("height")
    svg.innerHTML = ""

    const ns       = "http://www.w3.org/2000/svg"
    const maxValue = Math.max(...slice.map(e => e.amount))
    const barWidth = innerW / slice.length

    // ── Y axis grid lines ──
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
        const yVal = (maxValue / ySteps) * i
        const y    = margin.top + innerH - (yVal / maxValue) * innerH

        const line = document.createElementNS(ns, "line")
        line.setAttribute("x1",           margin.left)
        line.setAttribute("x2",           margin.left + innerW)
        line.setAttribute("y1",           y)
        line.setAttribute("y2",           y)
        line.setAttribute("stroke",       "#1e2130")
        line.setAttribute("stroke-width", "1")
        svg.appendChild(line)

        const label = document.createElementNS(ns, "text")
        label.setAttribute("x",           margin.left - 8)
        label.setAttribute("y",           y + 4)
        label.setAttribute("text-anchor", "end")
        label.setAttribute("font-size",   "10")
        label.setAttribute("fill",        "#555d7a")
        label.textContent = (yVal / 1000).toFixed(0) + "k"
        svg.appendChild(label)
    }

    // ── Bars + labels ──
    slice.forEach((item, index) => {
        const barH = (item.amount / maxValue) * innerH
        const x    = margin.left + index * barWidth
        const y    = margin.top  + innerH - barH

        // bar
        const rect = document.createElementNS(ns, "rect")
        rect.setAttribute("x",       x + 2)
        rect.setAttribute("y",       y)
        rect.setAttribute("width",   Math.max(barWidth - 4, 1))
        rect.setAttribute("height",  barH)
        rect.setAttribute("fill",    "#00f5c4")
        rect.setAttribute("rx",      "2")
        rect.setAttribute("opacity", "0.85")
        svg.appendChild(rect)

        // xp on top of bar
        if (barH > 16) {
            const xpLabel = document.createElementNS(ns, "text")
            xpLabel.setAttribute("x",           x + barWidth / 2)
            xpLabel.setAttribute("y",           y - 4)
            xpLabel.setAttribute("text-anchor", "middle")
            xpLabel.setAttribute("font-size",   "8")
            xpLabel.setAttribute("fill",        "#00f5c4")
            xpLabel.textContent = (item.amount / 1000).toFixed(1) + "k"
            svg.appendChild(xpLabel)
        }

        // project name rotated -45deg
        const labelX = x + barWidth / 2
        const labelY = margin.top + innerH + 12
        const text   = document.createElementNS(ns, "text")
        text.setAttribute("x",           labelX)
        text.setAttribute("y",           labelY)
        text.setAttribute("text-anchor", "end")
        text.setAttribute("font-size",   "9")
        text.setAttribute("fill",        "#555d7a")
        text.setAttribute("transform",   `rotate(-45, ${labelX}, ${labelY})`)
        text.textContent = item.project.length > 20
            ? item.project.slice(0, 19) + "…"
            : item.project
        svg.appendChild(text)
    })

    // ── Axes ──
    const yAxis = document.createElementNS(ns, "line")
    yAxis.setAttribute("x1", margin.left); yAxis.setAttribute("x2", margin.left)
    yAxis.setAttribute("y1", margin.top);  yAxis.setAttribute("y2", margin.top + innerH)
    yAxis.setAttribute("stroke", "#2a2f45"); yAxis.setAttribute("stroke-width", "1")
    svg.appendChild(yAxis)

    const xAxis = document.createElementNS(ns, "line")
    xAxis.setAttribute("x1", margin.left);          xAxis.setAttribute("x2", margin.left + innerW)
    xAxis.setAttribute("y1", margin.top + innerH);  xAxis.setAttribute("y2", margin.top + innerH)
    xAxis.setAttribute("stroke", "#2a2f45"); xAxis.setAttribute("stroke-width", "1")
    svg.appendChild(xAxis)
}