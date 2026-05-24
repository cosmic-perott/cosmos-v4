import { supabase } from './supabase.js'


let sections = []

  async function loadScores(){

  const { data, error } = await supabase
    .from('scores')
    .select('*')

  if(error){
    console.error(error)
    return
  }

  console.log(data)

  sections = data.map(row => ({
    title: row.game_name,

 scores: [
  Number(row.sarah_score),
  Number(row.jeoji_score),
  Number(row.mulchat_score),
  Number(row.geomun_score),
  Number(row.noro_score)
],

    stats: `Ranking: ${row.ranking}`
  }))

  buildPage()
}

loadScores()


function buildPage(){


  const teams = [
  "sarah",
  "jeoji",
  "mulchat",
  "geomun",
  "noro"
]

sections = data.map(row => ({

  title: row.game_name,

  scores: teams.map(team =>
    Number(row[`${team}_score`])
  ),

  stats: `Ranking: ${row.ranking}`

}))

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

const title = document.createElement("div")
title.className = "page-title"
title.textContent = "Current Standings"

container.appendChild(title)
container.appendChild(totalBoard)

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

  const stats = document.createElement("div")
  stats.className = "stats"
  stats.textContent = sectionData.stats
  wrapper.appendChild(title)
  wrapper.appendChild(section)
  wrapper.appendChild(stats)
  container.appendChild(wrapper)
})
}
