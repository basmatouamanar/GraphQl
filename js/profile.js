const token = localStorage.getItem("jwt")

fetch("https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query: `
{
  user {
    login
    firstName
    lastName
    avatarUrl
    auditRatio
    totalUp
    totalDown

    success: audits_aggregate(
      where: { closureType: { _eq: succeeded } }
    ) {
      aggregate {
        count
      }
    }

    failed: audits_aggregate(
      where: { closureType: { _eq: failed } }
    ) {
      aggregate {
        count
      }
    }

    events(where: {cohorts: {labelName: {_is_null: false}}}) {
      cohorts {
        labelName
      }
    }
  }

  xp: transaction_aggregate(
    where: {
      type: {_eq: "xp"}
      event: {object: {name: {_eq: "Module"}}}
    }
  ) {
    aggregate {
      sum {
        amount
      }
    }
  }

  level: transaction_aggregate(
    where: {
      type: {_eq: "level"}
      event: {object: {name: {_eq: "Module"}}}
    }
  ) {
    aggregate {
      max {
        amount
      }
    }
  }

  transaction(
    where: {
      type: {_eq: "xp"}
      event: {object: {name: {_eq: "Module"}}}
      object: {type: {_eq: "project"}}
    }
    order_by: {createdAt: asc}
  ) {
    amount
    createdAt
    object {
      name
      type
    }
  }
}
        `
  })
})
  .then(res => res.json())
  .then(data => {
    console.log(data)
    // const amountXp = data.data.transaction
    const firstName = data.data.user[0].firstName
    const lastName = data.data.user[0].lastName
    const avatar = data.data.user[0].avatarUrl
    const cohort = data.data.user[0].events[0].cohorts[0].labelName
    const totalXp = data.data.xp.aggregate.sum.amount
    const level = data.data.level.aggregate.max.amount
    let rank = ""
    if (level < 10) {
      rank = "Aspiring developer"
    } else if (level > 10 && level < 20) {
      rank = "Beginner developer"
    } else if (level > 20 && level < 30) {
      rank = "Apprentice developer"
    } else if (level > 30 && level < 40) {
      rank = "Assistant developer"
    } else if (level > 40 && level < 50) {
      rank = "Basic developer"
    } else if (level > 50) {
      rank = "Junior developer"
    }
    document.getElementById("current-rank").textContent = rank
    document.getElementById("level").textContent = level
    document.getElementById("total-xp").textContent = totalXp / 1000 + ' KB'
    document.getElementById("avatar").src = avatar
    document.getElementById("cohort").textContent = cohort
    document.getElementById("username").textContent =
      firstName + " " + lastName

    const transactions = data.data.transaction.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    )
    let slice = []
    transactions.forEach(transaction => {
      slice.push({
        amount: transaction.amount,
        project: transaction.object.name,
        creatDate: transaction.createdAt
      })
    });
    drawBarChart(slice)
/*
Audit Ratio
Total Up
Total Down
Number of successful audits
Number of failed audits
*/
    const AuditRatio = data.data.user[0].auditRatio
    const TotalUp = data.data.user[0].totalUp
    const TotalDown = data.data.user[0].totalDown
    const successfulAudits = data.data.user[0].success.aggregate.count
    const failedAudits = data.data.user[0].failed.aggregate.count

    document.getElementById('Audit-Ratio').textContent = Math.round(AuditRatio * 10)/10 
    document.getElementById('Total-Up').textContent =  Math.round((TotalUp / 1000000) * 100) / 100 + ' MB'
    document.getElementById('Total-Down').textContent = Math.round((TotalDown / 1000000) * 100) / 100 + ' MB'
    document.getElementById('successful-audits').textContent = successfulAudits
    document.getElementById('failed-audits').textContent = failedAudits
  })


function drawBarChart(slice) {
  const svg = document.getElementById("xp-graph")
  const W = 900
  const H = 420
  const margin = { top: 40, right: 40, bottom: 130, left: 70 }
  const innerW = W - margin.left - margin.right
  const innerH = H - margin.top - margin.bottom

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`)
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
  svg.removeAttribute("width")
  svg.removeAttribute("height")
  svg.innerHTML = ""

  const ns       = "http://www.w3.org/2000/svg"
  const maxValue = Math.max(...slice.map(e => e.amount))
  const stepX    = innerW / (slice.length - 1)

  // ── Defs: gradient fill under the line ──
  const defs = document.createElementNS(ns, "defs")
  defs.innerHTML = `
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#00f5c4" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#00f5c4" stop-opacity="0"/>
    </linearGradient>
  `
  svg.appendChild(defs)

  // ── Y axis grid lines + labels ──
  const ySteps = 5
  for (let i = 0; i <= ySteps; i++) {
    const yVal = (maxValue / ySteps) * i
    const y    = margin.top + innerH - (yVal / maxValue) * innerH

    const line = document.createElementNS(ns, "line")
    line.setAttribute("x1",               margin.left)
    line.setAttribute("x2",               margin.left + innerW)
    line.setAttribute("y1",               y)
    line.setAttribute("y2",               y)
    line.setAttribute("stroke",           "#1e2130")
    line.setAttribute("stroke-width",     "1")
    line.setAttribute("stroke-dasharray", "5,5")
    svg.appendChild(line)

    const label = document.createElementNS(ns, "text")
    label.setAttribute("x",           margin.left - 10)
    label.setAttribute("y",           y + 4)
    label.setAttribute("text-anchor", "end")
    label.setAttribute("font-size",   "11")
    label.setAttribute("fill",        "#555d7a")
    label.textContent = formatXP(yVal)
    svg.appendChild(label)
  }

  // ── Compute points ──
  const points = slice.map((item, index) => ({
    x:    margin.left + index * stepX,
    y:    margin.top + innerH - (item.amount / maxValue) * innerH,
    item
  }))

  // ── Area fill (polygon under line) ──
  const areaPoints =
    points.map(p => `${p.x},${p.y}`).join(" ") +
    ` ${points[points.length - 1].x},${margin.top + innerH}` +
    ` ${points[0].x},${margin.top + innerH}`

  const area = document.createElementNS(ns, "polygon")
  area.setAttribute("points", areaPoints)
  area.setAttribute("fill",   "url(#areaGrad)")
  svg.appendChild(area)

  // ── Line ──
  const lineEl = document.createElementNS(ns, "polyline")
  lineEl.setAttribute("points",          points.map(p => `${p.x},${p.y}`).join(" "))
  lineEl.setAttribute("fill",            "none")
  lineEl.setAttribute("stroke",          "#00f5c4")
  lineEl.setAttribute("stroke-width",    "2.5")
  lineEl.setAttribute("stroke-linejoin", "round")
  lineEl.setAttribute("stroke-linecap",  "round")
  svg.appendChild(lineEl)

  // ── Dots + XP value above + project name below ──
  points.forEach(({ x, y, item }) => {

    // outer glow circle
    const glow = document.createElementNS(ns, "circle")
    glow.setAttribute("cx",      x)
    glow.setAttribute("cy",      y)
    glow.setAttribute("r",       "7")
    glow.setAttribute("fill",    "rgba(0,245,196,0.15)")
    svg.appendChild(glow)

    // inner dot
    const dot = document.createElementNS(ns, "circle")
    dot.setAttribute("cx",          x)
    dot.setAttribute("cy",          y)
    dot.setAttribute("r",           "4")
    dot.setAttribute("fill",        "#00f5c4")
    dot.setAttribute("stroke",      "#080910")
    dot.setAttribute("stroke-width","2")
    svg.appendChild(dot)

    // XP value above dot
    const xpLabel = document.createElementNS(ns, "text")
    xpLabel.setAttribute("x",           x)
    xpLabel.setAttribute("y",           y - 12)
    xpLabel.setAttribute("text-anchor", "middle")
    xpLabel.setAttribute("font-size",   "9")
    xpLabel.setAttribute("fill",        "#00f5c4")
    xpLabel.textContent = formatXP(item.amount)
    svg.appendChild(xpLabel)

    // project name rotated -45deg below x axis
    const labelY = margin.top + innerH + 14
    const text   = document.createElementNS(ns, "text")
    text.setAttribute("x",           x)
    text.setAttribute("y",           labelY)
    text.setAttribute("text-anchor", "end")
    text.setAttribute("font-size",   "10")
    text.setAttribute("fill",        "#555d7a")
    text.setAttribute("transform",   `rotate(-45, ${x}, ${labelY})`)
    text.textContent = item.project.length > 18
      ? item.project.slice(0, 17) + "…"
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
  xAxis.setAttribute("x1", margin.left);         xAxis.setAttribute("x2", margin.left + innerW)
  xAxis.setAttribute("y1", margin.top + innerH); xAxis.setAttribute("y2", margin.top + innerH)
  xAxis.setAttribute("stroke", "#2a2f45");        xAxis.setAttribute("stroke-width", "1")
  svg.appendChild(xAxis)
}

function formatXP(amount) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(2) + " MB"
  if (amount >= 1_000)     return (amount / 1_000).toFixed(1) + " kB"
  return amount + " B"
}