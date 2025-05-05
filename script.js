let apiBaseUrl = 'http://ec2-13-60-86-85.eu-north-1.compute.amazonaws.com:5000'; // Default URL, change as needed or use the input box
let jwtToken = null;

const responseDiv = document.getElementById('response').querySelector('pre');
const loginStatusP = document.getElementById('loginStatus');
const protectedContent = document.querySelector('.protected-content');
const userTableBody = document.getElementById('userTableBody');
const getUserResultDiv = document.getElementById('getUserResult');
const addUserStatusDiv = document.getElementById('addUserStatus');
const updateUserStatusDiv = document.getElementById('updateUserStatus');
const deleteUserStatusDiv = document.getElementById('deleteUserStatus');
const searchUsersResultsDiv = document.getElementById('searchUsersResults');
const eplTeamListResultsDiv = document.getElementById('eplTeamListResults'); // Added for EPL
const eplTeamDetailsResultsDiv = document.getElementById('eplTeamDetailsResults');
const searchPlayerResultsEPLDiv = document.getElementById('searchPlayerResultsEPL');
const filterPositionInput = document.getElementById('filterPosition');
const filterMinAgeInput = document.getElementById('filterMinAge');
const filterMaxAgeInput = document.getElementById('filterMaxAge');
const filterNumberInput = document.getElementById('filterNumber');
const sortPlayersBySelect = document.getElementById('sortPlayersBy');
const sortPlayersOrderSelect = document.getElementById('sortPlayersOrder');
const searchEPLKeySelect = document.getElementById('searchEPL_Key');
const searchEPLValueInput = document.getElementById('searchEPL_Value');

// --- Helper Functions ---

function updateResponseDisplay(data) {
    responseDiv.textContent = JSON.stringify(data, null, 2);
}

function showProtectedContent() {
    protectedContent.classList.remove('hidden');
}

function hideProtectedContent() {
    protectedContent.classList.add('hidden');
}

function setApiUrl() {
    const inputUrl = document.getElementById('apiBaseUrl').value.trim();
    if (inputUrl) {
        apiBaseUrl = inputUrl;
        console.log("API Base URL set to:", apiBaseUrl);
        alert("API URL set to " + apiBaseUrl);
    } else {
        alert("Please enter a valid URL.");
    }
}


// --- API Interaction Functions ---

async function loginUser() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        updateResponseDisplay(data);

        if (response.ok) {
            jwtToken = data.access_token;
            loginStatusP.textContent = 'Login successful!';
            loginStatusP.style.color = 'green';
            showProtectedContent();
        } else {
            jwtToken = null;
            loginStatusP.textContent = 'Login failed: ' + (data.error || data.message || response.statusText);
            loginStatusP.style.color = 'red';
            hideProtectedContent();
        }

    } catch (error) {
        console.error('Login error:', error);
        loginStatusP.textContent = 'An error occurred during login.';
        loginStatusP.style.color = 'red';
        updateResponseDisplay({ error: 'Client-side error', details: error.message });
        hideProtectedContent();
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

    const options = {
        method: method,
        headers: headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
        const data = await response.json();
        updateResponseDisplay(data);

        if (!response.ok) {
             alert(`API Error (${response.status}): ${data.error || data.message || response.statusText}`);
             return null; // Indicate failure
        }

        return data; // Return the parsed JSON data
    } catch (error) {
        console.error(`API call error for ${endpoint}:`, error);
        alert('An error occurred while calling the API.');
        updateResponseDisplay({ error: 'Client-side API call error', details: error.message });
        return null; // Indicate failure
    }
}


// --- User Endpoints ---

async function getAllUsers() {
    const users = await callApi('/users_list', 'GET');

    if (users) {
        // Clear previous results
        userTableBody.innerHTML = '';

        if (Array.isArray(users)) { // Check if the response is a list
             users.forEach(user => {
                const row = userTableBody.insertRow();
                row.insertCell(0).textContent = user.UserId || '';
                row.insertCell(1).textContent = user.Name || '';
                row.insertCell(2).textContent = user.Email || '';
                row.insertCell(3).textContent = user.Status || '';
                row.insertCell(4).textContent = user.CreatedAt || '';
                // Stringify the preferences object for display, handle missing Preferences key
                row.insertCell(5).textContent = user.Preferences ? JSON.stringify(user.Preferences) : '';
             });
        } else if (users.message === 'No users found') {
            // Handle the case where the API returns a message instead of an array
            const row = userTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6; // Span across all columns
            cell.textContent = users.message;
            cell.style.textAlign = 'center';
        }
         // You might also want to handle errors returned by the API more explicitly here
    } else {
         // Handle the case where callApi returns null (due to fetch error or response.ok is false)
         userTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Failed to load users or no data received.</td></tr>';
    }
}


async function getUserById() {
    const userId = document.getElementById('getUserId').value;
    if (!userId) {
        alert('Please enter a User ID.');
        return;
    }
    getUserResultDiv.textContent = ''; // Clear previous result

    const user = await callApi(`/get_user/${userId}`, 'GET');

    if (user) {
         // Display the user object (you might format this more nicely)
        getUserResultDiv.textContent = JSON.stringify(user, null, 2);
    } else {
         // Handle the case where callApi returns null (user not found or error)
         getUserResultDiv.textContent = 'User not found or an error occurred.';
    }
}

async function addUser() {
    const userId = document.getElementById('addUser_UserId').value;
    const name = document.getElementById('addUser_Name').value;
    const email = document.getElementById('addUser_Email').value;
    // Get values from other potential input fields

    if (!userId || !name) {
        alert('User ID and Name are required.');
        return;
    }

    const newUser = {
        UserId: userId,
        Name: name,
        // Include other fields only if they have values or defaults
        ...(email && { Email: email }),
        // Add other fields similarly
    };

    // Your API /add_user route expects JSON payload.
    // The `callApi` function already stringifies the body object and sets Content-Type.
    const result = await callApi('/add_user', 'POST', newUser);

    if (result) {
        addUserStatusDiv.textContent = result.message || 'User added successfully';
        addUserStatusDiv.style.color = 'green';
        // Optionally clear form fields here
    } else {
         addUserStatusDiv.textContent = 'Failed to add user.';
         addUserStatusDiv.style.color = 'red';
    }
}

async function updateUser() {
    const userId = document.getElementById('updateUser_UserId').value;
    const name = document.getElementById('updateUser_Name').value;
    const email = document.getElementById('updateUser_Email').value;
    // Get values from other potential input fields

    if (!userId) {
        alert('Please enter the User ID to update.');
        return;
    }

    const updateData = {};
    if (name) updateData.Name = name;
    if (email) updateData.Email = email;
    // Add other fields similarly, check if inputs have values

    if (Object.keys(updateData).length === 0) {
        alert('Please enter at least one field to update.');
        return;
    }

    const result = await callApi(`/update_user/${userId}`, 'PUT', updateData);

     if (result) {
        updateUserStatusDiv.textContent = result.message || 'User updated successfully';
        updateUserStatusDiv.style.color = 'green';
        // Optionally clear form fields here
    } else {
         updateUserStatusDiv.textContent = 'Failed to update user.';
         updateUserStatusDiv.style.color = 'red';
    }
}

async function deleteUser() {
    const userId = document.getElementById('deleteUserId').value;
    if (!userId) {
        alert('Please enter the User ID to delete.');
        return;
    }

    const result = await callApi(`/delete_user/${userId}`, 'DELETE');

     if (result) {
        deleteUserStatusDiv.textContent = result.message || `User ${userId} deleted.`;
        deleteUserStatusDiv.style.color = 'green';
        // Optionally clear form field here
    } else {
         deleteUserStatusDiv.textContent = 'Failed to delete user.';
         deleteUserStatusDiv.style.color = 'red';
    }
}

async function searchUsers() {
    const name = document.getElementById('searchUsers_Name').value;
    const email = document.getElementById('searchUsers_Email').value;

    if (!name && !email) {
        alert('Please enter a Name or Email to search.');
        return;
    }

    let endpoint = '/search_users?';
    if (name) endpoint += `name=${encodeURIComponent(name)}&`;
    if (email) endpoint += `email=${encodeURIComponent(email)}&`;
    endpoint = endpoint.slice(0, -1); // Remove trailing & or ? if no params were added

    searchUsersResultsDiv.textContent = ''; // Clear previous results

    const result = await callApi(endpoint, 'GET');

     if (result && result.users && Array.isArray(result.users)) {
        if (result.users.length > 0) {
            // Display users - you might want a dedicated table for search results
            searchUsersResultsDiv.textContent = `Found ${result.users.length} user(s):\n` + JSON.stringify(result.users, null, 2);
        } else {
             searchUsersResultsDiv.textContent = 'No users found matching criteria.';
        }
    } else if (result && result.message) {
        // Handle case where API returns a message like 'No users found' with 404 status
         searchUsersResultsDiv.textContent = result.message;
    }
     else {
        searchUsersResultsDiv.textContent = 'Failed to search users or no results.';
    }
}


// --- EPL Endpoints ---

async function getAllTeamsEPL() {
    const teams = await callApi('/epl/teams', 'GET');

    const eplTeamTableBody = document.getElementById('eplTeamTableBody');
   // eplTeamTableBody.innerHTML = ''; // Clear previous results

    if (teams && Array.isArray(teams)) {
        eplTeamListResultsDiv.classList.remove('hidden');
        if (teams.length > 0) {
            teams.forEach(team => {
                const row = eplTeamTableBody.insertRow();
                // Add cells for each team property you want to display
                row.insertCell(0).textContent = team.TeamID || '';
                row.insertCell(1).textContent = team.TeamName || '';
                row.insertCell(2).textContent = team.Stadium || '';
                row.insertCell(3).textContent = team.Founded || '';
                row.insertCell(4).textContent = team.Manager || '';
                // Add more cells if you display other properties
            });
        } else {
            const row = eplTeamTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5; // Adjust colspan based on number of columns above
            cell.textContent = 'No EPL teams found.';
            cell.style.textAlign = 'center';
        }
    } else if (teams && teams.message) {
         // Handle API messages like 'No users found' (if applicable to this endpoint)
         const row = eplTeamTableBody.insertRow();
         const cell = row.insertCell(0);
         cell.colSpan = 5; // Adjust colspan
         cell.textContent = teams.message;
         cell.style.textAlign = 'center';
    }
     else {
        // Handle the case where callApi returns null (fetch error, network issue, API error)
        const row = eplTeamTableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 5; // Adjust colspan
        cell.textContent = 'Failed to load EPL teams.';
        cell.style.color = 'red';
        cell.style.textAlign = 'center';
    }
}

function clearEPLTeamsList() {
    const eplTeamTableBody = document.getElementById('eplTeamTableBody');
    const eplTeamListResultsDiv = document.getElementById('eplTeamListResults');

    // Clear the table body content
    eplTeamTableBody.innerHTML = '';

    // Hide the results div
    eplTeamListResultsDiv.classList.add('hidden');

    console.log("EPL Teams list cleared.");
}

async function getEplTeamDetails() {
    const teamIdInput = document.getElementById('getEplTeamDetails_TeamId');
    const teamId = teamIdInput.value.trim();

    const teamDetailsArea = document.getElementById('teamDetailsArea');
    const teamPlayersArea = document.getElementById('teamPlayersArea');
    const eplTeamPlayersTableBody = document.getElementById('eplTeamPlayersTableBody');
    const eplTeamDetailsStatusDiv = document.getElementById('eplTeamDetailsStatus');
    // eplTeamListResultsDiv is defined at the top
    // eplTeamDetailsResultsDiv and searchPlayerResultsEPLDiv are defined
    // New filter and sort variables are now defined

    // Clear previous results and hide players area
    teamDetailsArea.innerHTML = '<h6>Team Details:</h6><p>Loading...</p>';
    eplTeamPlayersTableBody.innerHTML = '';
    teamPlayersArea.classList.add('hidden');
    eplTeamDetailsStatusDiv.textContent = '';
    eplTeamDetailsStatusDiv.style.color = '';

    searchPlayerResultsEPLDiv.classList.add('hidden'); // Hide search results


    if (!teamId) {
        eplTeamDetailsStatusDiv.textContent = 'Please enter a Team ID.';
        eplTeamDetailsStatusDiv.style.color = 'orange';
        teamDetailsArea.innerHTML = '<h6>Team Details:</h6><p>Enter a Team ID and click "Get Details".</p>';
        eplTeamDetailsResultsDiv.classList.remove('hidden');
        return;
    }

    eplTeamDetailsResultsDiv.classList.remove('hidden'); // Show this section


    // --- Read values from new filter and sort controls ---
    const positionFilter = filterPositionInput.value.trim();
    const minAgeFilter = filterMinAgeInput.value.trim();
    const maxAgeFilter = filterMaxAgeInput.value.trim();
    const numberFilter = filterNumberInput.value.trim();
    const sortByValue = sortPlayersBySelect.value;
    const orderValue = sortPlayersOrderSelect.value;
    // --- End of reading values ---

    // --- Construct query parameters ---
    const queryParams = new URLSearchParams();
    if (positionFilter) {
        queryParams.append('position', positionFilter);
    }
    if (minAgeFilter && !isNaN(parseInt(minAgeFilter, 10))) {
        queryParams.append('min_age', minAgeFilter);
    }
    if (maxAgeFilter && !isNaN(parseInt(maxAgeFilter, 10))) {
        queryParams.append('max_age', maxAgeFilter);
    }
    if (numberFilter && !isNaN(parseInt(numberFilter, 10))) {
        queryParams.append('number', numberFilter);
    }
    if (sortByValue) {
        queryParams.append('sort_by', sortByValue);
        // Include order only if sort_by is selected
        queryParams.append('order', orderValue);
    }
    // --- End of constructing query parameters ---


    let endpoint = `/epl/teams/${encodeURIComponent(teamId)}/details`;

    // Append query parameters if any exist
    if (queryParams.toString()) {
        endpoint += '?' + queryParams.toString();
    }

    const result = await callApi(endpoint, 'GET'); // callApi already updates the main response div

    if (result) { // Assuming success if result is not null (callApi handles basic errors)
        if (result.team) {
            // Display Team Details
            const team = result.team;
            teamDetailsArea.innerHTML = `
                <h6>Team Details:</h6>
                <p><strong>Team ID:</strong> ${team.TeamID || 'N/A'}</p>
                <p><strong>Team Name:</strong> ${team.TeamName || 'N/A'}</p>
                <p><strong>Stadium:</strong> ${team.Stadium || 'N/A'}</p>
                <p><strong>Founded:</strong> ${team.Founded || 'N/A'}</p>
                <p><strong>Manager:</strong> ${team.Manager || 'N/A'}</p>
                `;

            if (result.players && Array.isArray(result.players)) {
                const players = result.players;
                 if (players.length > 0) {
                    players.forEach(player => {
                        const row = eplTeamPlayersTableBody.insertRow();
                        row.insertCell(0).textContent = player.PlayerName || '';
                        row.insertCell(1).textContent = player.Position || '';
                        row.insertCell(2).textContent = player.Number || '';
                        row.insertCell(3).textContent = player.Age || '';
                    });
                     teamPlayersArea.classList.remove('hidden');
                 } else {
                      teamPlayersArea.classList.remove('hidden');
                     const row = eplTeamPlayersTableBody.insertRow();
                     const cell = row.insertCell(0);
                     cell.colSpan = 4;
                     cell.textContent = 'No players found for this team with applied filters.'; // Update message
                     cell.style.textAlign = 'center';
                 }

            } else {
                 teamPlayersArea.classList.remove('hidden');
                 const row = eplTeamPlayersTableBody.insertRow();
                 const cell = row.insertCell(0);
                 cell.colSpan = 4;
                 cell.textContent = 'Player data format unexpected or no players found.';
                 cell.style.textAlign = 'center';
                 cell.style.color = 'orange';
            }

        } else if (result.error || result.message) {
            eplTeamDetailsStatusDiv.textContent = result.error || result.message;
            eplTeamDetailsStatusDiv.style.color = 'red';
            teamDetailsArea.innerHTML = '<h6>Team Details:</h6><p>Error retrieving team details.</p>';
        } else {
             eplTeamDetailsStatusDiv.textContent = 'Unexpected response format for team details.';
             eplTeamDetailsStatusDiv.style.color = 'orange';
             teamDetailsArea.innerHTML = '<h6>Team Details:</h6><p>Could not display details.</p>';
        }


    } else {
         eplTeamDetailsStatusDiv.textContent = 'Failed to retrieve team details due to an API error.';
         eplTeamDetailsStatusDiv.style.color = 'red';
         teamDetailsArea.innerHTML = '<h6>Team Details:</h6><p>Could not load details.</p>';
    }
}

function clearEPLTeamDetails() {
    const teamDetailsArea = document.getElementById('teamDetailsArea');
    const teamPlayersArea = document.getElementById('teamPlayersArea');
    const eplTeamPlayersTableBody = document.getElementById('eplTeamPlayersTableBody');
    const eplTeamDetailsStatusDiv = document.getElementById('eplTeamDetailsStatus');
    const teamIdInput = document.getElementById('getEplTeamDetails_TeamId');

    // --- Add these lines to clear filter and sort inputs ---
    filterPositionInput.value = '';
    filterMinAgeInput.value = '';
    filterMaxAgeInput.value = '';
    filterNumberInput.value = '';
    sortPlayersBySelect.value = ''; // Reset dropdown to the default empty option
    sortPlayersOrderSelect.value = 'asc'; // Reset order dropdown to 'asc'
    // --- End of lines to add ---


    // Clear the input field (Team ID)
    teamIdInput.value = '';

    // Reset the details and hide players table
    teamDetailsArea.innerHTML = '<h6>Team Details:</h6><p>Select a team and click "Get Details" to see information here.</p>';
    eplTeamPlayersTableBody.innerHTML = '';
    teamPlayersArea.classList.add('hidden');
    eplTeamDetailsStatusDiv.textContent = '';
    eplTeamDetailsStatusDiv.style.color = '';

    // Hide the entire details results div
    eplTeamDetailsResultsDiv.classList.add('hidden');

    console.log("EPL Team Details cleared.");
}

async function addPlayerEPL() {
    const playerNameInput = document.getElementById('addPlayer_PlayerName');
    const teamIdInput = document.getElementById('addPlayer_TeamID');
    const positionInput = document.getElementById('addPlayer_Position');
    const numberInput = document.getElementById('addPlayer_Number');
    const ageInput = document.getElementById('addPlayer_Age');
    // Get other input values if you added them

    const addPlayerStatusEPLDiv = document.getElementById('addPlayerStatusEPL');
    addPlayerStatusEPLDiv.textContent = ''; // Clear previous status
    addPlayerStatusEPLDiv.style.color = ''; // Clear previous color

    const playerName = playerNameInput.value.trim();
    const teamId = teamIdInput.value.trim();
    const position = positionInput.value.trim();
    const number = parseInt(numberInput.value.trim(), 10); // Convert to number
    const age = parseInt(ageInput.value.trim(), 10);       // Convert to number
    // Get other values...

    // Basic validation
    if (!playerName || !teamId || !position || isNaN(number) || isNaN(age)) {
        addPlayerStatusEPLDiv.textContent = 'Please fill in all required fields (Name, Team ID, Position, Number, Age). Number and Age must be numbers.';
        addPlayerStatusEPLDiv.style.color = 'orange';
        return;
    }

    // Construct the payload matching your player_model structure
    // BASED ON YOUR NOTE, EntityType IS PLAYER#<Number> and TeamID is the PK
    const newPlayerData = {
        "TeamID": teamId.toUpperCase(), // This is likely the Partition Key (PK)
        "EntityType": `PLAYER#${number}`, // <-- Corrected: This is likely the Sort Key (SK) based on your note
        "PlayerName": playerName,
        "Position": position.toUpperCase(),
        "Number": number, // Still include Number attribute separately for convenience
        "Age": age,
        // Include other attributes if they have inputs
        // "Nationality": document.getElementById('addPlayer_Nationality').value.trim(), // If you added nationality input
    };

    // Call the API using the POST method
    const result = await callApi('/epl/players', 'POST', newPlayerData);

    if (result) { // callApi returns the parsed JSON data on success
        addPlayerStatusEPLDiv.textContent = result.message || 'Player added successfully!';
        addPlayerStatusEPLDiv.style.color = 'green';
        // Optionally clear the form fields on success
        playerNameInput.value = '';
        teamIdInput.value = '';
        positionInput.value = '';
        numberInput.value = '';
        ageInput.value = '';
        // Clear other fields...
    } else {
        // callApi will show an alert for API errors (non-2xx status) or fetch errors
        addPlayerStatusEPLDiv.textContent = 'Failed to add player.'; // Generic failure message
        addPlayerStatusEPLDiv.style.color = 'red';
    }
}


async function searchEPLEntities() {
    // Reuse the existing div for search results
    const searchPlayerTableBody = document.getElementById('searchPlayerTableBodyEPL');
    const searchPlayerStatusDiv = document.getElementById('searchPlayerStatusEPL');

    // Clear previous table results and status message
    searchPlayerTableBody.innerHTML = '';
    searchPlayerStatusDiv.textContent = '';
    searchPlayerStatusDiv.style.color = '';

    // --- Hide other EPL results sections when performing a search ---
    // Make sure eplTeamListResultsDiv and eplTeamDetailsResultsDiv are defined at the top
    if (eplTeamListResultsDiv) eplTeamListResultsDiv.classList.add('hidden');
    if (eplTeamDetailsResultsDiv) eplTeamDetailsResultsDiv.classList.add('hidden');
    // --- End of hiding other sections ---


    // --- Get values from the new search controls ---
    // Make sure searchEPLKeySelect and searchEPLValueInput are defined at the top
    const searchKey = searchEPLKeySelect.value; // Get the selected attribute (e.g., 'PlayerName', 'Position')
    const searchValue = searchEPLValueInput.value.trim(); // Get the text entered by the user
    // --- End of getting values ---


    if (!searchKey || !searchValue) {
        searchPlayerStatusDiv.textContent = 'Please select an attribute and enter a value to search.';
        searchPlayerStatusDiv.style.color = 'orange';
         // --- Ensure this section is visible even if validation fails after user interaction ---
         // Make sure searchPlayerResultsEPLDiv is defined at the top
        if (searchPlayerResultsEPLDiv) searchPlayerResultsEPLDiv.classList.remove('hidden');
         // --- End of showing section ---
        return;
    }

    // --- Ensure this section is visible when a valid search request is made ---
     if (searchPlayerResultsEPLDiv) searchPlayerResultsEPLDiv.classList.remove('hidden');
    // --- End of showing section ---


    // --- Construct the API endpoint URL with key and value parameters ---
    // The API endpoint is /epl/search and expects query params ?key=...&value=...
    const endpoint = `/epl/search?key=${encodeURIComponent(searchKey)}&value=${encodeURIComponent(searchValue)}`;
    // --- End of URL construction ---

    // Call the API using the GET method
    // Assuming the API returns an object like { "results": [...] } on success
    const result = await callApi(endpoint, 'GET');

    if (result && result.results && Array.isArray(result.results)) {
        const items = result.results; // Get the array of found items (can be teams or players)

        if (items.length > 0) {
            items.forEach(item => {
                const row = searchPlayerTableBody.insertRow();
                // --- Update how you display the search results ---
                // Since the search can return both Teams and Players,
                // display general information or the full item JSON.
                row.insertCell(0).textContent = item.TeamID || ''; // Display TeamID
                row.insertCell(1).textContent = item.EntityType || ''; // Display EntityType (TEAM or PLAYER#...)

                // For the details column, you can show different things based on EntityType
                const detailsCell = row.insertCell(2);
                if (item.EntityType === 'TEAM') {
                    detailsCell.textContent = `Team: ${item.TeamName || 'N/A'}, Manager: ${item.Manager || 'N/A'}, Stadium: ${item.Stadium || 'N/A'}`;
                } else if (item.EntityType && item.EntityType.startsWith('PLAYER#')) {
                     detailsCell.textContent = `Player: ${item.PlayerName || 'N/A'}, Position: ${item.Position || 'N/A'}, Number: ${item.Number || 'N/A'}, Age: ${item.Age || 'N/A'}`;
                } else {
                     // Fallback for other EntityTypes or unexpected format
                     detailsCell.textContent = JSON.stringify(item, null, 2); // Show full item JSON
                }
                // --- End of displaying search results ---
            });
             searchPlayerStatusDiv.textContent = `Found ${items.length} item(s) matching "${searchValue}" in "${searchKey}".`;
             searchPlayerStatusDiv.style.color = 'green';

        } else {
            // API returned an empty array in results.results
            searchPlayerStatusDiv.textContent = `No teams or players found matching "${searchValue}" in "${searchKey}".`;
            searchPlayerStatusDiv.style.color = 'orange';
        }
    } else if (result && (result.error || result.message)) {
         searchPlayerStatusDiv.textContent = result.error || result.message;
         searchPlayerStatusDiv.style.color = 'red';
    }
    else {
        searchPlayerStatusDiv.textContent = 'Failed to perform search.';
        searchPlayerStatusDiv.style.color = 'red';
    }
}
// --- End of new searchEPLEntities function ---


// --- Replace your existing clearEPLPlayerSearch function with this ---
function clearEPLEntitySearch() {
    // Reuse the existing status and results divs
    const searchPlayerTableBody = document.getElementById('searchPlayerTableBodyEPL');
    const searchPlayerStatusDiv = document.getElementById('searchPlayerStatusEPL');

    // --- Clear the new input fields ---
    // Make sure searchEPLKeySelect and searchEPLValueInput are defined at the top
    if (searchEPLKeySelect) searchEPLKeySelect.value = ''; // Reset dropdown
    if (searchEPLValueInput) searchEPLValueInput.value = ''; // Clear text input
    // --- End of clearing input fields ---


    // Clear the table body content
    searchPlayerTableBody.innerHTML = '';

    // Clear status message
    searchPlayerStatusDiv.textContent = '';
    searchPlayerStatusDiv.style.color = '';

    // Hide the entire search results div
     if (searchPlayerResultsEPLDiv) searchPlayerResultsEPLDiv.classList.add('hidden');

    console.log("EPL Entity search results cleared.");
}
// --- End of new clearEPLEntitySearch function ---

async function updatePlayerEPL() {
    // --- Get values for URL Path (using CORRECT IDs) ---
    const teamIdInputURL = document.getElementById('updatePlayer_TeamID_URL');
    // **CORRECTED:** Get Jersey Number input for URL using its correct ID
    const numberInputURL = document.getElementById('updatePlayer_Number_URL'); // This should now exist in HTML

    // --- Get values for Request Body (using CORRECT IDs) ---
    const playerNameInputBody = document.getElementById('updatePlayer_PlayerName_Body');
    const positionInputBody = document.getElementById('updatePlayer_Position_Body');
    const ageInputBody = document.getElementById('updatePlayer_Age_Body');
    const numberInputBody = document.getElementById('updatePlayer_Number_Body'); // Jersey Number as an attribute in the body
    // Get other body input values if you added them

    const updatePlayerStatusEPLDiv = document.getElementById('updatePlayerStatusEPL');
    updatePlayerStatusEPLDiv.textContent = ''; // Clear previous status
    updatePlayerStatusEPLDiv.style.color = ''; // Clear previous color

    const teamIdURL = teamIdInputURL.value.trim();
    const numberValueURL = numberInputURL.value.trim(); // Get Jersey Number string from URL input

    // --- Basic Validation: Team ID and Jersey Number are required for the URL ---
    const numberURL = parseInt(numberValueURL, 10); // Parse Jersey Number from URL input as integer
    if (!teamIdURL || !numberValueURL || isNaN(numberURL)) {
        updatePlayerStatusEPLDiv.textContent = 'Please enter a valid Team ID and Jersey Number for the player you want to update.';
        updatePlayerStatusEPLDiv.style.color = 'orange';
        return;
    }

    // --- Construct the API Endpoint URL (using /epl/players and Jersey Number) ---
    // Example: /epl/players/LFC/66
    // Note: We use the parsed integer numberURL here in the URL path
    const endpoint = `/epl/players/${encodeURIComponent(teamIdURL)}/${numberURL}`;


    // --- Construct the Request Body (Include only fields with values, using CORRECT IDs) ---
    const updateData = {};
    const playerNameBody = playerNameInputBody.value.trim();
    const positionBody = positionInputBody.value.trim();
    const ageValueBody = ageInputBody.value.trim();
    const numberValueBody = numberInputBody.value.trim(); // Jersey Number as an attribute value


    if (playerNameBody) {
        updateData.PlayerName = playerNameBody;
    }
    if (positionBody) {
        updateData.Position = positionBody;
    }

    // Check if Age was entered and is a valid number
    const ageNumberBody = parseInt(ageValueBody, 10);
    if (ageValueBody !== '' && !isNaN(ageNumberBody)) {
        updateData.Age = ageNumberBody;
    }

    // Check if Jersey Number in body was entered and is a valid number (if updating number attribute)
    const numberNumberBody = parseInt(numberValueBody, 10);
     if (numberValueBody !== '' && !isNaN(numberNumberBody)) {
        updateData.Number = numberNumberBody;
     }

    // Add other fields similarly...

    // --- Optional: Check if any update fields were provided ---
    if (Object.keys(updateData).length === 0) {
        updatePlayerStatusEPLDiv.textContent = 'Please fill in at least one field you want to update.';
        updatePlayerStatusEPLDiv.style.color = 'orange';
        return;
    }

    // --- Call the API using the PUT method ---
    const result = await callApi(endpoint, 'PUT', updateData);

    if (result) { // callApi returns the parsed JSON data on success
        updatePlayerStatusEPLDiv.textContent = result.message || 'Player updated successfully!';
        // If your API returns updated attributes in 'updatedAttributes' key:
        // updatePlayerStatusEPLDiv.textContent += ' Updated fields: ' + JSON.stringify(result.updatedAttributes);
        updatePlayerStatusEPLDiv.style.color = 'green';
        // Optionally clear the update fields on success
        playerNameInputBody.value = '';
        positionInputBody.value = '';
        ageInputBody.value = '';
        numberInputBody.value = '';
        // Clear other body fields...
        // Keep TeamID and Number inputs for URL filled
    } else {
        // callApi will show an alert for API errors (non-2xx status) or fetch errors
        updatePlayerStatusEPLDiv.textContent = 'Failed to update player.';
        updatePlayerStatusEPLDiv.style.color = 'red';
    }
}

async function deletePlayerEPL() {
    const teamIdInput = document.getElementById('deletePlayer_TeamID');
    const numberInput = document.getElementById('deletePlayer_Number');
    const deletePlayerStatusEPLDiv = document.getElementById('deletePlayerStatusEPL');

    // Clear previous status
    deletePlayerStatusEPLDiv.textContent = '';
    deletePlayerStatusEPLDiv.style.color = ''; // Clear previous color

    const teamId = teamIdInput.value.trim();
    const numberValue = numberInput.value.trim(); // Get value as string initially

    // --- Basic Validation: Team ID and Jersey Number are required for the URL ---
    const number = parseInt(numberValue, 10); // Parse Jersey Number as integer
    if (!teamId || !numberValue || isNaN(number)) {
        deletePlayerStatusEPLDiv.textContent = 'Please enter a valid Team ID and Jersey Number for the player you want to delete.';
        deletePlayerStatusEPLDiv.style.color = 'orange';
        return;
    }

    // --- Construct the API Endpoint URL ---
    // Example: /epl/players/LFC/66
    // Use the parsed integer 'number' in the URL
    const endpoint = `/epl/players/${encodeURIComponent(teamId)}/${number}`;

    // --- Call the API using the DELETE method ---
    // DELETE requests typically don't have a body
    const result = await callApi(endpoint, 'DELETE');

    // Handle the response
    // callApi returns the parsed JSON data on success, or null on fetch error/non-ok status
    if (result) { // callApi returned data (likely success message)
        deletePlayerStatusEPLDiv.textContent = result.message || 'Player deleted successfully!';
        deletePlayerStatusEPLDiv.style.color = 'green';
        // Optionally clear input fields on success
        teamIdInput.value = '';
        numberInput.value = '';
    } else {
        // callApi handles showing alert for API errors (non-2xx status) or fetch errors
        deletePlayerStatusEPLDiv.textContent = 'Failed to delete player.'; // Generic failure message
        deletePlayerStatusEPLDiv.style.color = 'red';
    }
}
// --- Placeholder Functions for Other Endpoints ---
// Add functions here for:
// - addTeamEPL() -> POST /epl/teams
// - getPlayersByTeamIdEPL() -> GET /epl/teams/<team_id> (Similar to getEplTeamDetails but simpler)
// - updateTeamEPL() -> PUT /epl/teams/<team_id>
// - deleteTeamEPL() -> DELETE /epl/teams/<team_id>
// - addPlayerEPL() -> POST /epl/players
// - updatePlayerEPL() -> PUT /epl/players/<team_id>/<player_name>
// - deletePlayerEPL() -> DELETE /epl/players/<team_id>/<player_name>
// - searchEPL() -> GET /epl/search?key=...&value=...

// Example structure for addTeamEPL:
/*
async function addTeamEPL() {
    // Get values from input fields
    const teamId = document.getElementById('addEplTeam_TeamId').value; // You need to add this input in HTML
    const teamName = document.getElementById('addEplTeam_TeamName').value; // You need to add this input in HTML
    // ... get other fields

    if (!teamId || !teamName) {
        alert('Team ID and Team Name are required.');
        return;
    }

    const newTeamData = {
        TeamID: teamId,
        TeamName: teamName,
        EntityType: 'TEAM' // Assuming 'TEAM' EntityType for teams
        // ... include other optional fields
    };

    const result = await callApi('/epl/teams', 'POST', newTeamData);

    // Handle result and update UI status div (you need to add status divs in HTML)
    if (result) {
         // success message
    } else {
         // error message
    }
}
*/


// --- Initial State ---
hideProtectedContent(); // Hide protected content until logged in