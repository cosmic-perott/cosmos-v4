const teams = [
  { id: "mulchat", name: "Mulchat", color: "mulchat" },
  { id: "geomun", name: "Geomun", color: "geomun" },
  { id: "noro", name: "Noro", color: "noro" },
  { id: "sarah", name: "Sarah", color: "sarah" },
  { id: "jeoji", name: "Jeoji", color: "jeoji" }
];

function toggleLoginModal(show) {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = show ? 'flex' : 'none';
  }
}

async function handleLogin() {
  const usernameInput = document.getElementById('loginUser').value.trim();
  const passwordInput = document.getElementById('loginPass').value.trim();

  if (!usernameInput || !passwordInput) {
    alert("Please enter both username and password.");
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Save the JWT token and username in browser storage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', usernameInput);
    
    alert('Login successful!');
    toggleLoginModal(false);
    
    // Clear input fields
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';

    // Refresh scores to dynamically update the top bar layout
    loadScores(); 
  } catch (err) {
    alert(`Login Error: ${err.message}`);
  }
}

function handleLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  alert('Logged out successfully.');
  loadScores();
}

// Authenticated request helper
async function postNewScore(gameData) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:3000/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(gameData)
  });

  if (response.status === 401 || response.status === 403) {
    alert('Session expired or unauthorized. Please log in again.');
    toggleLoginModal(true);
    return;
  }
  
  return response.json();
}

async function loadScores() {
  const container = document.getElementById("container");
  try {
    const response = await fetch('http://localhost:3000/api/scores');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="top-island-bar">
          <div class="island-left">COSMOS Games <span>Beta Version</span></div>
          <div class="island-right">Cosmos</div>
        </div>
        <div class='page-subtitle' style='margin-top: 40px;'>No data available. Database is empty.</div>
      `;
      return;
    }
    
    buildPage(data);
  } catch (error) {
    console.error("Frontend Fetch Error:", error);
    container.innerHTML = `
      <div class="top-island-bar">
        <div class="island-left">COSMOS Games <span>[Beta]</span></div>
        <div class="island-right">Cosmos</div>
      </div>
      <div class='page-subtitle' style='color: var(--sarah); margin-top: 40px;'>Connection lost to local backend API.</div>
    `;
  }
}

function buildPage(games) {
  const container = document.getElementById("container");
  container.innerHTML = ""; 

  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('authUser');

  const topIsland = document.createElement("div");
  topIsland.className = "top-island-bar";

  // Dynamically render either the Admin Login button or user profile/logout controls
  if (token) {
    topIsland.innerHTML = `
      <div class="island-left">COSMOS Games <span>[Beta]</span></div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">${username}</span>
        <button onclick="handleLogout()" style="background: #e11d48; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase;">Logout</button>
      </div>
    `;
  } else {
    topIsland.innerHTML = `
      <div class="island-left">COSMOS Games <span>[Beta]</span></div>
      <button onclick="toggleLoginModal(true)" style="background: #111; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase;">Admin Login</button>
    `;
  }
  container.appendChild(topIsland);

  const totals = {};
  teams.forEach(team => totals[team.id] = 0);

  games.forEach(game => {
    teams.forEach(team => {
      const houseRank = game.total_house_rank && game.total_house_rank[team.id] !== undefined
        ? Number(game.total_house_rank[team.id])
        : 5;
      totals[team.id] += (6 - houseRank);
    });
  });
  
  const maxTotal = Math.max(...Object.values(totals));

  const header = document.createElement("div");
  header.className = "header";
  
  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = "House Standings";
  
  const subtitle = document.createElement("p");
  subtitle.className = "page-subtitle";
  subtitle.textContent = "Live competition analytics and player rankings.";
  
  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  const leaderboardList = document.createElement("div");
  leaderboardList.className = "leaderboard-list";

  const sortedLeaderboard = [...teams].sort((a, b) => totals[b.id] - totals[a.id]);

  sortedLeaderboard.forEach(team => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const identity = document.createElement("div");
    identity.className = "team-identity";

    const dot = document.createElement("div");
    dot.className = `color-dot dot-${team.color}`;

    const name = document.createElement("div");
    name.className = "team-name";
    name.textContent = team.name;

    identity.appendChild(dot);
    identity.appendChild(name);

    const score = document.createElement("div");
    score.className = "team-score";
    score.textContent = `${totals[team.id].toFixed(0)} pts`;

    if (totals[team.id] === maxTotal && maxTotal > 0) {
      score.classList.add(`winner-${team.color}`);
    }

    row.appendChild(identity);
    row.appendChild(score);
    leaderboardList.appendChild(row);
  });
  
  container.appendChild(leaderboardList);

  games.forEach(game => {
    const gameSection = document.createElement("div");
    gameSection.className = "game-section";

    const titleBar = document.createElement("div");
    titleBar.className = "game-title-bar";

    const gameTitle = document.createElement("div");
    gameTitle.className = "game-title";
    gameTitle.textContent = game.game_name || "Untitled Event";
    titleBar.appendChild(gameTitle);

    const rankSquaresGrid = document.createElement("div");
    rankSquaresGrid.className = "house-rank-squares-grid";

    teams.forEach(team => {
      const teamRank = game.total_house_rank && game.total_house_rank[team.id] !== undefined
        ? game.total_house_rank[team.id]
        : "-";
      
      const squareCard = document.createElement("div");
      squareCard.className = "rank-square-card";
      
      if (teamRank === 1) {
        squareCard.classList.add("square-winner-border");
      }

      const rankNum = document.createElement("div");
      rankNum.className = `square-rank-number winner-${team.color}`;
      rankNum.textContent = teamRank;

      const teamLabel = document.createElement("div");
      teamLabel.className = "square-team-label";
      teamLabel.textContent = team.name;

      squareCard.appendChild(rankNum);
      squareCard.appendChild(teamLabel);
      rankSquaresGrid.appendChild(squareCard);
    });
    titleBar.appendChild(rankSquaresGrid);

    if (game.ranking) {
      const gameStatus = document.createElement("div");
      gameStatus.className = "game-status";
      gameStatus.textContent = `🤖 AI Analysis: ${game.ranking}`;
      titleBar.appendChild(gameStatus);
    }

    gameSection.appendChild(titleBar);

    const playerRankList = document.createElement("div");
    playerRankList.className = "player-rank-list";

    let allPlayers = [];
    teams.forEach(team => {
      const teamPlayers = game.teams && game.teams[team.id] ? game.teams[team.id] : [];
      teamPlayers.forEach(p => {
        allPlayers.push({
          name: p.player_name,
          score: p.score,
          rank: p.rank || "-",
          unit: game.unit || p.unit || "",
          teamId: team.id,
          teamName: team.name
        });
      });
    });

    allPlayers.sort((a, b) => (parseInt(a.rank) || 99) - (parseInt(b.rank) || 99));

    if (allPlayers.length > 0) {
      allPlayers.forEach(p => {
        const pRow = document.createElement("div");
        pRow.className = "player-rank-row";
        
        const rankDiv = document.createElement("div");
        rankDiv.className = "p-rank";
        rankDiv.textContent = `P${p.rank}`;
        
        const nameDiv = document.createElement("div");
        nameDiv.className = "p-name";
        nameDiv.textContent = p.name;
        
        const teamDiv = document.createElement("div");
        teamDiv.className = `p-team winner-${p.teamId}`;
        teamDiv.textContent = p.teamName;
        
        const scoreDiv = document.createElement("div");
        scoreDiv.className = "p-score";
        scoreDiv.textContent = `${p.score} ${p.unit}`;

        pRow.appendChild(rankDiv);
        pRow.appendChild(nameDiv);
        pRow.appendChild(teamDiv);
        pRow.appendChild(scoreDiv);
        playerRankList.appendChild(pRow);
      });
    } else {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "player-rank-row";
      emptyDiv.style.color = "var(--text-muted)";
      emptyDiv.style.fontStyle = "italic";
      emptyDiv.textContent = "No individual competitor match metrics populated.";
      playerRankList.appendChild(emptyDiv);
    }

    gameSection.appendChild(playerRankList);
    container.appendChild(gameSection);
  });

  const footer = document.createElement("div");
  footer.className = "footer-credits";
  footer.innerHTML = `
    Powered By COSMOS<br>
    Made by Junyoung (Jun) Kim for Computer Science HL IA
  `;
  container.appendChild(footer);
}

loadScores();

const eventSource = new EventSource('http://localhost:3000/events');
eventSource.onmessage = function(event) {
  console.log("⚡ Live update broadcast from backend server caught!");
  loadScores();
};
