let apiBaseUrl = 'https://epl-flask-api.onrender.com';
let jwtToken = null;

// --- DOM Element Cache ---
const loginSection = document.getElementById('login-section');
const protectedContent = document.getElementById('protected-content');
const responsePre = document.getElementById('response-content').querySelector('pre');

// EPL Elements
const eplTeamListResultsDiv = document.getElementById('eplTeamListResults');
const eplTeamTableBody = document.getElementById('eplTeamTableBody');
const searchEPLResultsDiv = document.getElementById('searchEPLResults');
const searchEPLTableBody = document.getElementById('searchEPLTableBody');

// --- Helper Functions ---

function updateResponseDisplay(data) {
    responsePre.textContent = JSON.stringify(data, null, 2);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    toastMessage.textContent = message;

    let icon = '';
    toast.classList.remove('bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700');

    if (type === 'success') {
        icon = '✅';
        toast.classList.add('bg-green-100', 'text-green-700');
    } else if (type === 'error') {
        icon = '❌';
        toast.classList.add('bg-red-100', 'text-red-700');
    } else {
        icon = 'ℹ️';
        toast.classList.add('bg-blue-100', 'text-blue-700');
    }
    toastIcon.textContent = icon;

    toast.classList.remove('opacity-0', 'translate-y-5');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-5');
    }, 4000);
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.querySelector(link.getAttribute('href'));
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Response Accordion
    document.getElementById('response-toggle').addEventListener('click', () => {
        document.getElementById('response-content').classList.toggle('hidden');
    });
});


// --- API Interaction ---

async function loginUser() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        updateResponseDisplay(data);

        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);
            showToast('Login successful!', 'success');
            document.getElementById("login-section").classList.add('hidden');
            document.getElementById("protected-content").classList.remove('hidden');
        } else {
            showToast(data.message || 'Login failed', 'error');
            localStorage.removeItem("access_token");
        }
    } catch (error) {
        showToast(`Client-side error: ${error.message}`, 'error');
        updateResponseDisplay({ error: 'Client-side error', details: error.message });
    }
}

async function callApi(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        showToast('You need to log in first!', 'error');
        showLoginScreen();  // Important
        return null;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
        const data = await response.json();
        updateResponseDisplay(data);

        if (!response.ok) {
            if (response.status === 401) {
                showToast("Session expired. Please log in again.", "error");
                resetSession();
                return null;
            }

            showToast(`API call error: ${data?.error || data?.msg || response.statusText}`, "error");
            return null;
        }

        return data;
    } catch (error) {
        console.error(`API error:`, error);
        showToast('A network error occurred.', 'error');
        updateResponseDisplay({ error: 'Client-side error', details: error.message });
        return null;
    }
}

function resetSession() {
    localStorage.removeItem("access_token");
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById("protected-content").classList.add("hidden");
    document.getElementById("login-section").classList.remove("hidden");
}

// --- EPL Functions ---

async function getAllTeamsEPL() {
    const teams = await callApi('/epl/teams');
    eplTeamTableBody.innerHTML = '';

    if (teams && Array.isArray(teams)) {
        if (teams.length > 0) {
            teams.forEach(team => {
                const row = eplTeamTableBody.insertRow();
                row.innerHTML = `
  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline cursor-pointer" onclick="getTeamFullDetails('${team.TeamID}')">
    ${team.TeamID}
  </td>
  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.TeamName}</td>
  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.Stadium}</td>
  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${team.Manager}</td>
`;

            });
            eplTeamListResultsDiv.classList.remove('hidden');
        } else {
            showToast('No EPL teams found in the database.', 'info');
        }
    } else {
        showToast(teams.error || 'Failed to load EPL teams.', 'error');
    }
}

function clearEPLTeamsList() {
    eplTeamTableBody.innerHTML = '';
    eplTeamListResultsDiv.classList.add('hidden');

    // Also hide team details section
    const teamDetailsSection = document.getElementById('teamFullDetailsSection');
    if (teamDetailsSection) {
        teamDetailsSection.classList.add('hidden');
    }
}

async function getPlayersFromTeam() {
    const teamId = document.getElementById("getPlayers_TeamID").value.trim();
    if (!teamId) {
        showToast("Please enter a Team ID.", "error");
        return;
    }

    const endpoint = `/epl/teams/${encodeURIComponent(teamId)}/details`;
    const data = await callApi(endpoint);

    const section = document.getElementById("teamPlayersOnlySection");
    const tableBody = document.getElementById("teamPlayersOnlyTableBody");

    section.classList.add("hidden");
    tableBody.innerHTML = "";

    if (data && Array.isArray(data.players)) {
        if (data.players.length === 0) {
            showToast("This team has no players.", "info");
            return;
        }

        data.players.forEach(player => {
            const row = tableBody.insertRow();
            row.innerHTML = `
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${player.PlayerName}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Position}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Number}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Age}</td>
            `;
        });

        section.classList.remove("hidden");
        showToast(`Loaded ${data.players.length} players from team ${teamId}.`, "success");
    } else {
        showToast(data?.error || "Failed to fetch players.", "error");
    }
}

function clearPlayersFromTeam() {
    document.getElementById("getPlayers_TeamID").value = "";
    document.getElementById("teamPlayersOnlyTableBody").innerHTML = "";
    document.getElementById("teamPlayersOnlySection").classList.add("hidden");
}


async function getTeamFullDetails(teamId) {
    const endpoint = `/epl/teams/${encodeURIComponent(teamId)}/details`;
    const data = await callApi(endpoint);

    const section = document.getElementById("teamFullDetailsSection");
    const infoDiv = document.getElementById("teamInfoSummary");
    const tableBody = document.getElementById("teamFullDetailsTableBody");

    section.classList.add("hidden");
    tableBody.innerHTML = "";
    infoDiv.innerHTML = "";

    if (data && data.team) {
        const team = data.team;
        const players = data.players || [];

        infoDiv.innerHTML = `
          <strong>ID:</strong> ${team.TeamID}<br/>
          <strong>Name:</strong> ${team.TeamName}<br/>
          <strong>Stadium:</strong> ${team.Stadium}<br/>
          <strong>Founded:</strong> ${team.Founded}<br/>
          <strong>Manager:</strong> ${team.Manager}
        `;

        if (players.length === 0) {
            showToast("No players found for this team.", "info");
        }

        players.forEach(player => {
            const row = tableBody.insertRow();
            row.innerHTML = `
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${player.PlayerName}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Position}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Number}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Age}</td>
            `;
        });

        section.classList.remove("hidden");
        showToast(`Loaded team "${team.TeamName}" details.`, "success");
    } else {
        showToast(data?.error || "Failed to fetch team details.", "error");
    }
}

async function searchEPLEntities() {
    const key = document.getElementById('searchEPL_Key').value;
    const value = document.getElementById('searchEPL_Value').value.trim();

    if (!key || !value) {
        showToast('Please select an attribute and enter a search value.', 'error');
        return;
    }

    searchEPLResultsDiv.classList.add('hidden');
    searchEPLTableBody.innerHTML = '';

    const endpoint = `/epl/search?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`;
    const data = await callApi(endpoint);

    if (data && data.results) {
        if (data.results.length === 0) {
            showToast('No results found matching your criteria.', 'info');
            return;
        }

        data.results.forEach(team => {
            const players = team.Players || [];
            if (players.length > 0) {
                players.forEach(player => {
                    const row = searchEPLTableBody.insertRow();
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${team.TeamName}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.PlayerName}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Position}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Number}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${player.Age}</td>
                    `;
                });
            } else {
                const row = searchEPLTableBody.insertRow();
                row.innerHTML = `<td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${team.TeamName} (Team Match)</td>`;
            }
        });
        searchEPLResultsDiv.classList.remove('hidden');
        showToast(`Found ${data.results.length} matching team(s).`, 'success');
    } else {
        showToast(data.error || 'Failed to perform search.', 'error');
    }
}

function clearEPLEntitySearch() {
    document.getElementById('searchEPL_Key').value = '';
    document.getElementById('searchEPL_Value').value = '';
    searchEPLTableBody.innerHTML = '';
    searchEPLResultsDiv.classList.add('hidden');
}

// --- Manage Teams ---
async function addTeamEPL() {
    const newTeam = {
        TeamID: document.getElementById('addTeam_TeamID').value.trim(),
        TeamName: document.getElementById('addTeam_TeamName').value.trim(),
        Stadium: document.getElementById('addTeam_Stadium').value.trim(),
        Founded: document.getElementById('addTeam_Founded').value.trim(),
        Manager: document.getElementById('addTeam_Manager').value.trim()
    };

    if (!newTeam.TeamID || !newTeam.TeamName) {
        showToast('Team ID and Team Name are required.', 'error');
        return;
    }

    const result = await callApi('/epl/teams', 'POST', newTeam);
    if (result && !result.error) {
        showToast(result.message || 'Team added successfully!', 'success');
        getAllTeamsEPL();
    } else {
        showToast(result.error || 'Failed to add team.', 'error');
    }
}

async function deleteTeamEPL() {
    const teamId = document.getElementById('deleteTeam_TeamID').value.trim();
    if (!teamId) {
        showToast('Please enter the Team ID to delete.', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete team ${teamId}? This action cannot be undone.`)) {
        return;
    }

    const result = await callApi(`/epl/teams/${teamId}`, 'DELETE');
    if (result && !result.error) {
        showToast(result.message, 'success');
        getAllTeamsEPL();
    } else {
        showToast(result.error || 'Failed to delete team.', 'error');
    }
}

// --- Manage Players ---
async function addPlayerEPL() {
    const teamId = document.getElementById('addPlayer_TeamID').value.trim();
    const newPlayer = {
        PlayerID: document.getElementById('addPlayer_PlayerID').value.trim(),
        PlayerName: document.getElementById('addPlayer_PlayerName').value.trim(),
        Position: document.getElementById('addPlayer_Position').value.trim(),
        Number: parseInt(document.getElementById('addPlayer_Number').value, 10),
        Age: parseInt(document.getElementById('addPlayer_Age').value, 10)
    };

    if (!teamId || !newPlayer.PlayerID || !newPlayer.PlayerName) {
        showToast('Team ID, Player ID, and Player Name are required.', 'error');
        return;
    }

    const endpoint = `/epl/players?team_id=${encodeURIComponent(teamId)}`;
    const result = await callApi(endpoint, 'POST', newPlayer);

    if (result && !result.error) {
        showToast(result.message || 'Player added successfully!', 'success');
    } else {
        showToast(result.error || 'Failed to add player.', 'error');
    }
}
async function transferPlayerEPL() {
    const fromTeamId = document.getElementById("transfer_from_team").value.trim();
    const toTeamId = document.getElementById("transfer_to_team").value.trim();
    const playerId = document.getElementById("transfer_player_id").value.trim();
    const newPlayerId = document.getElementById("transfer_new_id").value.trim();
    const newNumber = document.getElementById("transfer_new_number").value.trim();

    if (!fromTeamId || !toTeamId || !playerId) {
        showToast("From Team ID, To Team ID, and Player ID are required", "error");
        return;
    }

    const payload = {
        from_team_id: fromTeamId,
        to_team_id: toTeamId,
        player_id: playerId
    };

    if (newPlayerId) payload.new_player_id = newPlayerId;
    if (newNumber) payload.new_number = parseInt(newNumber);

    const response = await callApi("/epl/transfer_player", "POST", payload);

    if (response && !response.error) {
        showToast("Player transferred successfully!", "success");
    }
}

async function updatePlayerEPL() {
    const teamId = document.getElementById('updatePlayer_TeamID').value.trim();
    const playerId = document.getElementById('updatePlayer_PlayerID').value.trim();

    if (!teamId || !playerId) {
        showToast('Team ID and Player ID are required.', 'error');
        return;
    }

    const updatedPlayerData = {};
    const playerName = document.getElementById('updatePlayer_PlayerName').value.trim();
    const position = document.getElementById('updatePlayer_Position').value.trim();
    const number = document.getElementById('updatePlayer_Number').value;
    const age = document.getElementById('updatePlayer_Age').value;

    if (playerName) updatedPlayerData.PlayerName = playerName;
    if (position) updatedPlayerData.Position = position;
    if (number) updatedPlayerData.Number = parseInt(number, 10);
    if (age) updatedPlayerData.Age = parseInt(age, 10);

    if (Object.keys(updatedPlayerData).length === 0) {
        showToast('Please enter at least one field to update.', 'error');
        return;
    }

    const endpoint = `/epl/players/${encodeURIComponent(teamId)}/${encodeURIComponent(playerId)}`;
    const result = await callApi(endpoint, 'PUT', updatedPlayerData);

    if (result && !result.error) {
        showToast(result.message || 'Player updated successfully!', 'success');
    } else {
        showToast(result.error || 'Failed to update player.', 'error');
    }
}

async function deletePlayerEPL() {
    const teamId = document.getElementById('deletePlayer_TeamID').value.trim();
    const playerId = document.getElementById('deletePlayer_PlayerID').value.trim();

    if (!teamId || !playerId) {
        showToast('Team ID and Player ID are required.', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete player ${playerId} from team ${teamId}?`)) {
        return;
    }

    const endpoint = `/epl/players/${encodeURIComponent(teamId)}/${encodeURIComponent(playerId)}`;
    const result = await callApi(endpoint, 'DELETE');

    if (result && !result.error) {
        showToast(result.message, 'success');
    } else {
        showToast(result.error || 'Failed to delete player.', 'error');
    }
}

function clearAddTeamForm() {
    document.getElementById("addTeam_TeamID").value = "";
    document.getElementById("addTeam_TeamName").value = "";
    document.getElementById("addTeam_Stadium").value = "";
    document.getElementById("addTeam_Founded").value = "";
    document.getElementById("addTeam_Manager").value = "";
}

function clearDeleteTeamForm() {
    document.getElementById("deleteTeam_TeamID").value = "";
}

function clearAddPlayerForm() {
    document.getElementById("addPlayer_TeamID").value = "";
    document.getElementById("addPlayer_PlayerID").value = "";
    document.getElementById("addPlayer_PlayerName").value = "";
    document.getElementById("addPlayer_Position").value = "";
    document.getElementById("addPlayer_Number").value = "";
    document.getElementById("addPlayer_Age").value = "";
}

function clearUpdatePlayerForm() {
    document.getElementById("updatePlayer_TeamID").value = "";
    document.getElementById("updatePlayer_PlayerID").value = "";
    document.getElementById("updatePlayer_PlayerName").value = "";
    document.getElementById("updatePlayer_Position").value = "";
    document.getElementById("updatePlayer_Number").value = "";
    document.getElementById("updatePlayer_Age").value = "";
}

function clearTransferPlayerForm() {
    document.getElementById("transfer_from_team").value = "";
    document.getElementById("transfer_to_team").value = "";
    document.getElementById("transfer_player_id").value = "";
    document.getElementById("transfer_new_id").value = "";
    document.getElementById("transfer_new_number").value = "";
}

// 🔁 Background session timeout checker (runs every 60 seconds)
setInterval(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return;

    try {
        const payload = JSON.parse(atob(payloadBase64));
        const exp = payload.exp;  // Expiration time in seconds (Unix timestamp)
        const now = Math.floor(Date.now() / 1000);

        if (exp && now >= exp) {
            // Token expired — log out
            localStorage.removeItem("access_token");
            document.getElementById("protected-content").classList.add("hidden");
            document.getElementById("login-section").classList.remove("hidden");
            showToast("Session expired. Please log in again.", "error");
        }
    } catch (e) {
        console.error("Error decoding token:", e);
    }
}, 60000); // Checks every 60 seconds