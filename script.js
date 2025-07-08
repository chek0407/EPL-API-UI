let apiBaseUrl = 'https://epl-flask-api.onrender.com'; // Default URL
let jwtToken = null;

// --- DOM Element Cache ---
const responseDiv = document.getElementById('response').querySelector('pre');
const loginStatusDiv = document.getElementById('loginStatus');
const protectedContent = document.querySelector('.protected-content');

// EPL Elements
const eplTeamListResultsDiv = document.getElementById('eplTeamListResults');
const eplTeamTableBody = document.getElementById('eplTeamTableBody');
const eplTeamDetailsResultsDiv = document.getElementById('eplTeamDetailsResults');
const teamDetailsArea = document.getElementById('teamDetailsArea');
const teamPlayersArea = document.getElementById('teamPlayersArea');
const eplTeamPlayersTableBody = document.getElementById('eplTeamPlayersTableBody');
const eplTeamDetailsStatusDiv = document.getElementById('eplTeamDetailsStatus');
const searchEPLResultsDiv = document.getElementById('searchEPLResults');
const searchEPLTableBody = document.getElementById('searchEPLTableBody');
const searchEPLStatusDiv = document.getElementById('searchEPLStatus');


// --- Helper Functions ---

function updateResponseDisplay(data) {
    responseDiv.textContent = JSON.stringify(data, null, 2);
}

function showStatus(div, message, type = 'info') {
    div.textContent = message;
    div.className = `status-message status-${type}`;
    div.classList.remove('hidden');
}

function hideStatus(div) {
    div.classList.add('hidden');
}


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
            jwtToken = data.access_token;
            showStatus(loginStatusDiv, 'Login successful!', 'success');
            protectedContent.classList.remove('hidden');
        } else {
            jwtToken = null;
            showStatus(loginStatusDiv, `Login failed: ${data.message || 'Unknown error'}`, 'error');
            protectedContent.classList.add('hidden');
        }
    } catch (error) {
        showStatus(loginStatusDiv, `Client-side error: ${error.message}`, 'error');
        updateResponseDisplay({ error: 'Client-side error', details: error.message });
        protectedContent.classList.add('hidden');
    }
}

async function callApi(endpoint, method = 'GET', body = null) {
    if (!jwtToken) {
        alert('You need to log in first!');
        return null;
    }

    const headers = {
        'Authorization': `Bearer ${jwtToken}`,
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
            // The message is now handled by the specific function calling this
            return data; // Return error data for specific handling
        }
        return data; // Return success data
    } catch (error) {
        console.error(`API call error for ${endpoint}:`, error);
        alert('A network error occurred while calling the API.');
        updateResponseDisplay({ error: 'Client-side API call error', details: error.message });
        return { error: `A network error occurred: ${error.message}` }; // Return error object
    }
}


// --- EPL Functions ---

async function getAllTeamsEPL() {
    const teams = await callApi('/epl/teams');
    eplTeamTableBody.innerHTML = '';

    if (teams && Array.isArray(teams)) {
        if (teams.length > 0) {
            teams.forEach(team => {
                const row = eplTeamTableBody.insertRow();
                row.insertCell(0).textContent = team.TeamID || '';
                row.insertCell(1).textContent = team.TeamName || '';
                row.insertCell(2).textContent = team.Stadium || '';
                row.insertCell(3).textContent = team.Founded || '';
                row.insertCell(4).textContent = team.Manager || '';
            });
            eplTeamListResultsDiv.classList.remove('hidden');
        } else {
            const row = eplTeamTableBody.insertRow();
            row.insertCell(0).textContent = 'No EPL teams found.';
            row.cells[0].colSpan = 5;
            eplTeamListResultsDiv.classList.remove('hidden');
        }
    } else {
        const row = eplTeamTableBody.insertRow();
        row.insertCell(0).textContent = teams.error || 'Failed to load EPL teams.';
        row.cells[0].colSpan = 5;
        eplTeamListResultsDiv.classList.remove('hidden');
    }
}

function clearEPLTeamsList() {
    eplTeamTableBody.innerHTML = '';
    eplTeamListResultsDiv.classList.add('hidden');
}

async function getEplTeamDetails() {
    const teamId = document.getElementById('getEplTeamDetails_TeamId').value.trim();
    if (!teamId) {
        alert('Please enter a Team ID.');
        return;
    }
    
    hideStatus(eplTeamDetailsStatusDiv);
    eplTeamDetailsResultsDiv.classList.add('hidden');

    const result = await callApi(`/epl/teams/${teamId}/details`);

    if (result && result.team) {
        const team = result.team;
        teamDetailsArea.innerHTML = `
            <h4>Team Details</h4>
            <p><strong>Team ID:</strong> ${team.TeamID || 'N/A'}</p>
            <p><strong>Name:</strong> ${team.TeamName || 'N/A'}</p>
            <p><strong>Stadium:</strong> ${team.Stadium || 'N/A'}</p>
            <p><strong>Founded:</strong> ${team.Founded || 'N/A'}</p>
            <p><strong>Manager:</strong> ${team.Manager || 'N/A'}</p>
        `;

        eplTeamPlayersTableBody.innerHTML = '';
        if (result.players && Array.isArray(result.players) && result.players.length > 0) {
            result.players.forEach(player => {
                const row = eplTeamPlayersTableBody.insertRow();
                row.insertCell(0).textContent = player.PlayerID || '';
                row.insertCell(1).textContent = player.PlayerName || '';
                row.insertCell(2).textContent = player.Position || '';
                row.insertCell(3).textContent = player.Number ?? 'N/A';
                row.insertCell(4).textContent = player.Age ?? 'N/A';
            });
            teamPlayersArea.classList.remove('hidden');
        } else {
            teamPlayersArea.classList.add('hidden');
        }
        eplTeamDetailsResultsDiv.classList.remove('hidden');
    } else {
        showStatus(eplTeamDetailsStatusDiv, result.error || 'Team not found or an error occurred.', 'error');
    }
}

function clearEPLTeamDetails() {
    document.getElementById('getEplTeamDetails_TeamId').value = '';
    eplTeamDetailsResultsDiv.classList.add('hidden');
    hideStatus(eplTeamDetailsStatusDiv);
}

async function searchEPLEntities() {
    const key = document.getElementById('searchEPL_Key').value;
    const value = document.getElementById('searchEPL_Value').value.trim();

    if (!key || !value) {
        alert('Please select an attribute and enter a search value.');
        return;
    }

    hideStatus(searchEPLStatusDiv);
    searchEPLResultsDiv.classList.add('hidden');
    searchEPLTableBody.innerHTML = '';

    const endpoint = `/epl/search?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`;
    const data = await callApi(endpoint);

    if (data && data.results && Array.isArray(data.results)) {
        if (data.results.length === 0) {
            showStatus(searchEPLStatusDiv, 'No results found matching your criteria.', 'info');
            return;
        }

        data.results.forEach(team => {
            if (team.Players && team.Players.length > 0) {
                team.Players.forEach(player => {
                    const row = searchEPLTableBody.insertRow();
                    row.insertCell(0).textContent = `${team.TeamName} (${team.TeamID})`;
                    row.insertCell(1).textContent = player.PlayerName || 'N/A';
                    row.insertCell(2).textContent = player.Position || 'N/A';
                    row.insertCell(3).textContent = player.Number ?? 'N/A';
                    row.insertCell(4).textContent = player.Age ?? 'N/A';
                });
            } else {
                 // This handles searches for teams (like by TeamName) where we want to show the team itself
                const row = searchEPLTableBody.insertRow();
                row.insertCell(0).textContent = `${team.TeamName} (${team.TeamID})`;
                row.cells[0].colSpan = 5;
                row.cells[0].style.fontWeight = 'bold';
            }
        });
        searchEPLResultsDiv.classList.remove('hidden');

    } else {
        showStatus(searchEPLStatusDiv, data.error || 'Failed to perform search.', 'error');
    }
}


function clearEPLEntitySearch() {
    document.getElementById('searchEPL_Key').value = '';
    document.getElementById('searchEPL_Value').value = '';
    searchEPLTableBody.innerHTML = '';
    searchEPLResultsDiv.classList.add('hidden');
    hideStatus(searchEPLStatusDiv);
}

// --- Manage Teams ---
async function addTeamEPL() {
    const statusDiv = document.getElementById('addTeamStatus');
    const newTeam = {
        TeamID: document.getElementById('addTeam_TeamID').value.trim(),
        TeamName: document.getElementById('addTeam_TeamName').value.trim(),
        Stadium: document.getElementById('addTeam_Stadium').value.trim(),
        Founded: document.getElementById('addTeam_Founded').value.trim(),
        Manager: document.getElementById('addTeam_Manager').value.trim()
    };

    if (!newTeam.TeamID || !newTeam.TeamName) {
        alert('Team ID and Team Name are required.');
        return;
    }

    const result = await callApi('/epl/teams', 'POST', newTeam);
    if (result && result.team) {
        showStatus(statusDiv, result.message || 'Team added successfully!', 'success');
        getAllTeamsEPL(); // Refresh the list
    } else {
        showStatus(statusDiv, result.message || result.error || 'Failed to add team.', 'error');
    }
}

async function deleteTeamEPL() {
    const statusDiv = document.getElementById('deleteTeamStatus');
    const teamId = document.getElementById('deleteTeam_TeamID').value.trim();
    if (!teamId) {
        alert('Please enter the Team ID to delete.');
        return;
    }

    if (!confirm(`Are you sure you want to delete team ${teamId}? This action cannot be undone.`)) {
        return;
    }

    const result = await callApi(`/epl/teams/${teamId}`, 'DELETE');
    if (result && result.message) {
        showStatus(statusDiv, result.message, 'success');
        getAllTeamsEPL(); // Refresh the list
    } else {
        showStatus(statusDiv, result.message || result.error || 'Failed to delete team.', 'error');
    }
}

// --- Manage Players ---
async function addPlayerEPL() {
    const statusDiv = document.getElementById('addPlayerStatus');
    const teamId = document.getElementById('addPlayer_TeamID').value.trim();
    const newPlayer = {
        PlayerID: document.getElementById('addPlayer_PlayerID').value.trim(),
        PlayerName: document.getElementById('addPlayer_PlayerName').value.trim(),
        Position: document.getElementById('addPlayer_Position').value.trim(),
        Number: parseInt(document.getElementById('addPlayer_Number').value, 10),
        Age: parseInt(document.getElementById('addPlayer_Age').value, 10)
    };

    if (!teamId || !newPlayer.PlayerID || !newPlayer.PlayerName) {
        alert('Team ID, Player ID, and Player Name are required.');
        return;
    }

    const endpoint = `/epl/players?team_id=${encodeURIComponent(teamId)}`;
    const result = await callApi(endpoint, 'POST', newPlayer);

    if (result && result.player) {
        showStatus(statusDiv, result.message || 'Player added successfully!', 'success');
    } else {
        showStatus(statusDiv, result.message || result.error || 'Failed to add player.', 'error');
    }
}

async function updatePlayerEPL() {
    const statusDiv = document.getElementById('updatePlayerStatus');
    const teamId = document.getElementById('updatePlayer_TeamID').value.trim();
    const playerId = document.getElementById('updatePlayer_PlayerID').value.trim();
    
    if (!teamId || !playerId) {
        alert('Team ID and Player ID are required to identify the player to update.');
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
        alert('Please enter at least one field to update.');
        return;
    }
    
    const endpoint = `/epl/players/${encodeURIComponent(teamId)}/${encodeURIComponent(playerId)}`;
    const result = await callApi(endpoint, 'PUT', updatedPlayerData);

    if (result && result.updatedAttributes) {
        showStatus(statusDiv, result.message || 'Player updated successfully!', 'success');
    } else {
        showStatus(statusDiv, result.message || result.error || 'Failed to update player.', 'error');
    }
}

async function deletePlayerEPL() {
    const statusDiv = document.getElementById('deletePlayerStatus');
    const teamId = document.getElementById('deletePlayer_TeamID').value.trim();
    const playerId = document.getElementById('deletePlayer_PlayerID').value.trim();

    if (!teamId || !playerId) {
        alert('Team ID and Player ID are required to delete a player.');
        return;
    }

    if (!confirm(`Are you sure you want to delete player ${playerId} from team ${teamId}?`)) {
        return;
    }

    const endpoint = `/epl/players/${encodeURIComponent(teamId)}/${encodeURIComponent(playerId)}`;
    const result = await callApi(endpoint, 'DELETE');

    if (result && result.message.includes('deleted')) {
        showStatus(statusDiv, result.message, 'success');
    } else {
        showStatus(statusDiv, result.message || result.error || 'Failed to delete player.', 'error');
    }
}