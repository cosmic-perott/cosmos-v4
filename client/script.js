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

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', usernameInput);
    
    alert('Login successful!');
    toggleLoginModal(false);
    
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';

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

function dismissCompetitionHero() {
  const hero = document.getElementById('competitionHeroOverlay');
  if (hero) {
    hero.classList.add('fade-out');
    // Wait for the 0.5s CSS transition to finish before removing/reloading
    setTimeout(() => {
      localStorage.setItem('competitionEnded', 'false');
      loadScores();
    }, 500);
  } else {
    toggleCompetitionEnded();
  }
}

// Helper functions for Competition Ended state
function isCompetitionEnded() {
  return localStorage.getItem('competitionEnded') === 'true';
}

function toggleCompetitionEnded() {
  const current = isCompetitionEnded();
  localStorage.setItem('competitionEnded', !current);
  loadScores();
}

// Helper functions for Main Standings visibility
function isMainStandingsHidden() {
  return localStorage.getItem('hide_main_standings') === 'true';
}

function toggleMainStandingsVisibility() {
  const current = isMainStandingsHidden();
  localStorage.setItem('hide_main_standings', !current);
  loadScores();
}

// Helper functions for per-game section visibility
function isGameHidden(gameKey) {
  return localStorage.getItem(`hide_game_${gameKey}`) === 'true';
}

function toggleGameVisibility(gameKey) {
  const current = isGameHidden(gameKey);
  localStorage.setItem(`hide_game_${gameKey}`, !current);
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

  if (token) {
    const compEnded = isCompetitionEnded();
    const compBtnText = compEnded ? "Resume Competition" : "End Competition";

    topIsland.innerHTML = `
      <div class="island-left">COSMOS Games <span>[Beta]</span></div>
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">${username}</span>
        <button onclick="toggleCompetitionEnded()" style="background: #2563eb; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; text-transform: uppercase;">${compBtnText}</button>
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
  const mainHidden = isMainStandingsHidden();
  const sortedLeaderboard = [...teams].sort((a, b) => totals[b.id] - totals[a.id]);
  const winningTeam = sortedLeaderboard[0];
  const competitionEnded = isCompetitionEnded();

  // Render Full-Screen Hero Overlay with scroll-to-fade effect
  // Render Full-Screen Hero Overlay with clean slide-up effect
  // Render Full-Screen Hero Overlay with clean slide-up effect and confetti
  // Render Full-Screen Hero Overlay with clean slide-up effect and matching house confetti
  // Render Full-Screen Hero Overlay with house-specific messages and color-matched confetti
  if (competitionEnded && winningTeam) {
    const houseMessages = {
  sarah: "Go Phoenixes!",
  jeoji: "Go Sun Lions!",
  mulchat: "Go Dragons!",
  geomun: "Go Griffins!",
  noro: "Go Wolves!"
};
    // Get unique message for the winning house, with a fallback just in case
    const customMessage = houseMessages[winningTeam.color] || "The competition has officially concluded.";

    const heroSection = document.createElement("div");
    heroSection.id = "competitionHeroOverlay";
    heroSection.className = `competition-hero hero-${winningTeam.color}`;
    heroSection.innerHTML = `
      <h1 style="font-size: 56px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.03em; text-transform: uppercase;">Congratulations, ${winningTeam.name}!</h1>
      <p style="font-size: 22px; font-weight: 500; margin: 0 0 30px 0; opacity: 0.9; max-width: 600px; line-height: 1.4;">${customMessage}</p>
      <div style="font-size: 13px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em;">↓ Scroll down to view final scoreboard</div>
    `;
    container.appendChild(heroSection);

    // Trigger the color-matched confetti celebration!
    launchConfetti(winningTeam.color);

    let isSlidingUp = false;

    window.addEventListener('wheel', (e) => {
      const hero = document.getElementById('competitionHeroOverlay');
      if (hero && !isSlidingUp && e.deltaY > 0) {
        isSlidingUp = true;
        hero.classList.add('slide-up');
        setTimeout(() => {
          hero.remove();
        }, 600);
      }
    }, { passive: true });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const hero = document.getElementById('competitionHeroOverlay');
      if (hero && !isSlidingUp) {
        const touchEndY = e.touches[0].clientY;
        if (touchStartY - touchEndY > 30) {
          isSlidingUp = true;
          hero.classList.add('slide-up');
          setTimeout(() => {
            hero.remove();
          }, 600);
        }
      }
    }, { passive: true });
  }
// House-specific custom conclusion messages

  // Function to trigger celebration confetti
// Function to trigger celebration confetti matching the house color
function launchConfetti(teamColorId) {
  // Map team colors to custom palettes for the confetti
  const colorPalettes = {
    sarah: ['#e11d48', '#f43f5e', '#fb7185', '#ffe4e6'], // Rose / Red shades
    jeoji: ['#d97706', '#f59e0b', '#fbbf24', '#fef3c7'], // Purple shades
    mulchat: ['#16a34a', '#22c55e', '#4ade80', '#dcfce7'], // Blue shades
    geomun: ['#2563eb', '#3b82f6', '#60a5fa', '#dbeafe'], // Green shades
    noro: ['#9333ea', '#a855f7', '#c084fc', '#f3e8ff']  // Amber / Yellow shades
  };

  const colors = colorPalettes[teamColorId] || ['#ffffff', '#e5e7eb', '#9ca3af'];

  if (typeof confetti === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
    script.onload = () => {
      startConfettiBurst(colors);
    };
    document.head.appendChild(script);
  } else {
    startConfettiBurst(colors);
  }
}

function startConfettiBurst(colors) {
  const duration = 3.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 10005, colors: colors };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 40 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}

  // Header / Main Standings Section
  const header = document.createElement("div");
  header.className = "header";
  
  const titleRow = document.createElement("div");
  titleRow.style.display = "flex";
  titleRow.style.justifyContent = "space-between";
  titleRow.style.alignItems = "center";

  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = "House Standings";
  titleRow.appendChild(title);

  if (token) {
    const mainHideBtn = document.createElement("button");
    mainHideBtn.textContent = mainHidden ? "Reveal" : "Hide";
    mainHideBtn.style.cssText = "background: #4b5563; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; text-transform: uppercase;";
    mainHideBtn.onclick = () => toggleMainStandingsVisibility();
    titleRow.appendChild(mainHideBtn);
  }

  header.appendChild(titleRow);
  
  const subtitle = document.createElement("p");
  subtitle.className = "page-subtitle";
  subtitle.textContent = "Live competition analytics and player rankings.";
  header.appendChild(subtitle);
  container.appendChild(header);

  // Main Leaderboard List
  // Main Leaderboard List
  const leaderboardList = document.createElement("div");
  leaderboardList.className = "leaderboard-list";
  leaderboardList.id = "mainLeaderboardContainer"; // Added ID for targeting

  if (mainHidden) {
    leaderboardList.classList.add("hidden-scoreboard-text");
  }

  sortedLeaderboard.forEach((team, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    // Stagger each row's animation delay by 150ms
    row.style.transitionDelay = `${index * 150}ms`;

    const identity = document.createElement("div");
    identity.className = "team-identity";

    const dot = document.createElement("div");
    dot.className = `color-dot dot-${team.color}`;

    const name = document.createElement("div");
    name.className = "team-name";
    name.textContent = mainHidden ? "HOUSE" : team.name;

    identity.appendChild(dot);
    identity.appendChild(name);

    const score = document.createElement("div");
    score.className = "team-score";
    score.textContent = mainHidden ? "000 pts" : `${totals[team.id].toFixed(0)} pts`;

    if (totals[team.id] === maxTotal && maxTotal > 0) {
      score.classList.add(`winner-${team.color}`);
    }

    row.appendChild(identity);
    row.appendChild(score);
    leaderboardList.appendChild(row);
  });
  
  container.appendChild(leaderboardList);

  // Trigger line-by-line reveal using Intersection Observer when it comes into view
  setTimeout(() => {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const rows = entry.target.querySelectorAll('.leaderboard-row');
          rows.forEach(r => r.classList.add('revealed'));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const targetList = document.getElementById("mainLeaderboardContainer");
    if (targetList) observer.observe(targetList);
  }, 100);

  // Individual Games Sections
  games.forEach((game, index) => {
    const gameKey = game.game_name ? game.game_name.replace(/\s+/g, '_') : `game_${index}`;
    const gameHidden = isGameHidden(gameKey);

    const gameSection = document.createElement("div");
    gameSection.className = "game-section";

    const titleBar = document.createElement("div");
    titleBar.className = "game-title-bar";

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.alignItems = "center";

    const gameTitle = document.createElement("div");
    gameTitle.className = "game-title";
    gameTitle.textContent = game.game_name || "Untitled Event";
    titleRow.appendChild(gameTitle);

    if (token) {
      const sectionHideBtn = document.createElement("button");
      sectionHideBtn.textContent = gameHidden ? "Reveal" : "Hide";
      sectionHideBtn.style.cssText = "background: #4b5563; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; text-transform: uppercase;";
      sectionHideBtn.onclick = () => toggleGameVisibility(gameKey);
      titleRow.appendChild(sectionHideBtn);
    }

    titleBar.appendChild(titleRow);
    gameSection.appendChild(titleBar);

    const contentWrapper = document.createElement("div");
    contentWrapper.style.display = "flex";
    contentWrapper.style.flexDirection = "column";
    contentWrapper.style.gap = "16px";

    if (gameHidden) {
      contentWrapper.classList.add("hidden-scoreboard-text");
    }

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
    contentWrapper.appendChild(rankSquaresGrid);

    if (game.ranking) {
      const gameStatus = document.createElement("div");
      gameStatus.className = "game-status";
      gameStatus.textContent = `🤖 AI Analysis: ${game.ranking}`;
      contentWrapper.appendChild(gameStatus);
    }

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

    contentWrapper.appendChild(playerRankList);
    gameSection.appendChild(contentWrapper);
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
