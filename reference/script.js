const teams = [
  {name:"Sarah", color:"sarah", page:"houses/sarah.html"},
  {name:"Jeoji", color:"jeoji", page:"houses/jeoji.html"},
  {name:"Mulchat", color:"mulchat", page:"houses/mulchat.html"},
  {name:"Geomun", color:"geomun", page:"houses/geomun.html"},
  {name:"Noro", color:"noro", page:"houses/noro.html"}
]

const sections = [
  {title:"Game 1", scores:[6.2,8.9,7.1,5.4,6.8], stats:"Round 1 results"},
  {title:"Game 2", scores:[7.5,6.3,9.1,5.8,7.0], stats:"Round 2 results"},
  {title:"Game 3", scores:[5.9,7.2,6.8,8.4,6.1], stats:"Round 3 results"},
  {title:"Game 4", scores:[6.4,7.7,6.9,5.3,9.2], stats:"Round 4 results"},
  {title:"Game 5", scores:[8.1,6.5,7.3,6.0,7.9], stats:"Round 5 results"}
]

const container = document.getElementById("container")

function goToHouse(index){
  window.location.href = teams[index].page
} 

const totals = new Array(teams.length).fill(0)

sections.forEach(sec=>{
  sec.scores.forEach((score,i)=>{
    totals[i] += score
  })
})

const maxTotal = Math.max(...totals)


const totalBoard = document.createElement("div")
totalBoard.className = "total-board"

teams.forEach((team,i)=>{

  const item = document.createElement("div")
  item.className = "total-item"

  const name = document.createElement("div")
  name.className = "team"
  name.textContent = team.name

  const box = document.createElement("div")
  box.className = "total-box"
  box.textContent = totals[i].toFixed(1)

  if(totals[i] === maxTotal){
    box.classList.add(team.color)
  }

  box.onclick = () => goToHouse(i)

  item.appendChild(name)
  item.appendChild(box)
  totalBoard.appendChild(item)

})

container.appendChild(totalBoard)
const credit = document.createElement("div")
credit.className = "credit"
credit.textContent = "Powered by COSMOS"

container.appendChild(credit)

/* GAME SECTIONS */

sections.forEach(sectionData => {

  const wrapper = document.createElement("div")

  const title = document.createElement("div")
  title.className = "section-title"
  title.textContent = sectionData.title

  const section = document.createElement("div")
  section.className = "section"

  const max = Math.max(...sectionData.scores)

  sectionData.scores.forEach((score,i)=>{

    const item = document.createElement("div")
    item.className = "item"

    const team = document.createElement("div")
    team.className = "team"
    team.textContent = teams[i].name

    const box = document.createElement("div")
    box.className = "box"
    box.textContent = score

    if(score === max){
      box.classList.add(teams[i].color)
    }

    box.onclick = () => goToHouse(i)

    item.appendChild(team)
    item.appendChild(box)
    section.appendChild(item)

  })

  /* STATS BOX */

  const stats = document.createElement("div")
  stats.className = "stats"
  stats.textContent = sectionData.stats

  wrapper.appendChild(title)
  wrapper.appendChild(section)
  wrapper.appendChild(stats)

  container.appendChild(wrapper)

})
