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
  })


function drawBarChart(slice) {
  const svg = document.getElementById("xp-graph")
  const W = 800
  const H = 400
  const margin = { top: 30, right: 30, bottom: 120, left: 60 }
  const innerW = W - margin.left - margin.right
  const innerH = H - margin.top - margin.bottom

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`)
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
  svg.removeAttribute("width")
  svg.removeAttribute("height")
  svg.innerHTML = ""

  const ns = "http://www.w3.org/2000/svg"
  const maxValue = Math.max(...slice.map(e => e.amount))
  const barWidth = innerW / slice.length

  // ── Y axis grid lines ──
  const ySteps = 5
  for (let i = 0; i <= ySteps; i++) {
    const yVal = (maxValue / ySteps) * i
    const y = margin.top + innerH - (yVal / maxValue) * innerH

    const line = document.createElementNS(ns, "line")
    line.setAttribute("x1", margin.left)
    line.setAttribute("x2", margin.left + innerW)
    line.setAttribute("y1", y)
    line.setAttribute("y2", y)
    line.setAttribute("stroke", "#1e2130")
    line.setAttribute("stroke-width", "1")
    svg.appendChild(line)

    const label = document.createElementNS(ns, "text")
    label.setAttribute("x", margin.left - 8)
    label.setAttribute("y", y + 4)
    label.setAttribute("text-anchor", "end")
    label.setAttribute("font-size", "10")
    label.setAttribute("fill", "#555d7a")
    label.textContent = (yVal / 1000).toFixed(0) + "k"
    svg.appendChild(label)
  }

  // ── Bars + labels ──
  slice.forEach((item, index) => {
    const barH = (item.amount / maxValue) * innerH
    const x = margin.left + index * barWidth
    const y = margin.top + innerH - barH

    // bar
    const rect = document.createElementNS(ns, "rect")
    rect.setAttribute("x", x + 2)
    rect.setAttribute("y", y)
    rect.setAttribute("width", Math.max(barWidth - 4, 1))
    rect.setAttribute("height", barH)
    rect.setAttribute("fill", "#00f5c4")
    rect.setAttribute("rx", "2")
    rect.setAttribute("opacity", "0.85")
    svg.appendChild(rect)

    // xp on top of bar
    if (barH > 16) {
      const xpLabel = document.createElementNS(ns, "text")
      xpLabel.setAttribute("x", x + barWidth / 2)
      xpLabel.setAttribute("y", y - 4)
      xpLabel.setAttribute("text-anchor", "middle")
      xpLabel.setAttribute("font-size", "8")
      xpLabel.setAttribute("fill", "#00f5c4")
      xpLabel.textContent = (item.amount / 1000).toFixed(1) + "k"
      svg.appendChild(xpLabel)
    }

    // project name rotated -45deg
    const labelX = x + barWidth / 2
    const labelY = margin.top + innerH + 12
    const text = document.createElementNS(ns, "text")
    text.setAttribute("x", labelX)
    text.setAttribute("y", labelY)
    text.setAttribute("text-anchor", "end")
    text.setAttribute("font-size", "9")
    text.setAttribute("fill", "#555d7a")
    text.setAttribute("transform", `rotate(-45, ${labelX}, ${labelY})`)
    text.textContent = item.project.length > 20
      ? item.project.slice(0, 19) + "…"
      : item.project
    svg.appendChild(text)
  })

  // ── Axes ──
  const yAxis = document.createElementNS(ns, "line")
  yAxis.setAttribute("x1", margin.left); yAxis.setAttribute("x2", margin.left)
  yAxis.setAttribute("y1", margin.top); yAxis.setAttribute("y2", margin.top + innerH)
  yAxis.setAttribute("stroke", "#2a2f45"); yAxis.setAttribute("stroke-width", "1")
  svg.appendChild(yAxis)

  const xAxis = document.createElementNS(ns, "line")
  xAxis.setAttribute("x1", margin.left); xAxis.setAttribute("x2", margin.left + innerW)
  xAxis.setAttribute("y1", margin.top + innerH); xAxis.setAttribute("y2", margin.top + innerH)
  xAxis.setAttribute("stroke", "#2a2f45"); xAxis.setAttribute("stroke-width", "1")
  svg.appendChild(xAxis)
}
