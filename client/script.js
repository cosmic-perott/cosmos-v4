const teams = [
  { id: "sarah", name: "Sarah", color: "sarah", page: "sarah.html" },
  { id: "jeoji", name: "Jeoji", color: "jeoji", page: "jeoji.html" },
  { id: "mulchat", name: "Mulchat", color: "mulchat", page: "mulchat.html" },
  { id: "geomun", name: "Geomun", color: "geomun", page: "geomun.html" },
  { id: "noro", name: "Noro", color: "noro", page: "noro.html" }
];

async function loadScores() {
  const container = document.getElementById("container");
  try {
    const response = await fetch('http://localhost:3000/api/scores');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();

    if (!data || data.length === 0) {
      container.innerHTML = "<div class='page-subtitle'>No data available. database is empty.</div>";
      return;
    }
    
    const sections = data.map(row => ({
      title: row.game_name || "Untitled Event",
      scores: teams.map(team => Number(row[`${team.id}_score`] || 0)),
      stats: row.ranking || ''
    }));

    buildPage(sections);
  } catch (error) {
    console.error("Frontend Fetch Error:", error);
    container.innerHTML = `<div class='page-subtitle' style='color: var(--sarah);'>Connection lost to local backend API.</div>`;
  }
}

function buildPage(sections) {
  const container = document.getElementById("container");
  container.innerHTML = ""; 

  const totals = new Array(teams.length).fill(0);
  sections.forEach(sec => {
    sec.scores.forEach((score, i) => {
      totals[i] += score;
    });
  });
  
  const maxTotal = Math.max(...totals);

  const header = document.createElement("div");
  header.className = "header";
  
  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = "House Standings";
  
  const subtitle = document.createElement("p");
  subtitle.className = "page-subtitle";
  subtitle.textContent = "Live competition analytics and aggregate scores.";
  
  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  const leaderboardList = document.createElement("div");
  leaderboardList.className = "leaderboard-list";

  const sortedLeaderboard = teams.map((team, i) => ({
    team: team,
    index: i,
    total: totals[i]
  })).sort((a, b) => b.total - a.total);

  sortedLeaderboard.forEach(item => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.onclick = () => window.location.href = item.team.page;

    const identity = document.createElement("div");
    identity.className = "team-identity";

    const dot = document.createElement("div");
    dot.className = `color-dot dot-${item.team.color}`;

    const name = document.createElement("div");
    name.className = "team-name";
    name.textContent = item.team.name;

    identity.appendChild(dot);
    identity.appendChild(name);

    const score = document.createElement("div");
    score.className = "team-score";
    score.textContent = item.total.toFixed(1);

    if (item.total === maxTotal && maxTotal > 0) {
      score.classList.add(`winner-${item.team.color}`);
    }

    row.appendChild(identity);
    row.appendChild(score);
    leaderboardList.appendChild(row);
  });
  
  container.appendChild(leaderboardList);

  sections.forEach(sectionData => {
    const gameSection = document.createElement("div");
    gameSection.className = "game-section";

    const titleBar = document.createElement("div");
    titleBar.className = "game-title-bar";

    const gameTitle = document.createElement("div");
    gameTitle.className = "game-title";
    gameTitle.textContent = sectionData.title;

    const gameStatus = document.createElement("div");
    gameStatus.className = "game-status";
    gameStatus.textContent = sectionData.stats;

    titleBar.appendChild(gameTitle);
    titleBar.appendChild(gameStatus);
    gameSection.appendChild(titleBar);

    const gameGrid = document.createElement("div");
    gameGrid.className = "game-grid";

    const maxScore = Math.max(...sectionData.scores);

    teams.forEach((team, i) => {
      const currentScore = sectionData.scores[i];
      
      const cell = document.createElement("div");
      cell.className = "game-cell";
      if (currentScore === maxScore && maxScore > 0) {
        cell.classList.add("cell-winner");
      }
      cell.onclick = () => window.location.href = team.page;

      const cellName = document.createElement("div");
      cellName.className = "cell-name";
      cellName.textContent = team.name;

      const cellScore = document.createElement("div");
      cellScore.className = "cell-score";
      cellScore.textContent = currentScore;
      
      if (currentScore === maxScore && maxScore > 0) {
        cellScore.classList.add(`winner-${team.color}`);
      }

      cell.appendChild(cellName);
      cell.appendChild(cellScore);
      gameGrid.appendChild(cell);
    });

    gameSection.appendChild(gameGrid);
    container.appendChild(gameSection);
  });
}

loadScores();
