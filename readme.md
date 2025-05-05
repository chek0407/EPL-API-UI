# EPL API Training Interface UI

This repository contains the static web files (`index.html`, `script.js`, etc.) for a simple user interface designed to interact with a backend English Premier League (EPL) Teams and Players API.

The UI serves as a training interface to demonstrate making API calls (GET, POST, PUT, DELETE) from a web browser using JavaScript.

## Features

* **User Authentication:** Login to obtain a JSON Web Token (JWT).
* **List Teams:** Retrieve and display a list of all EPL teams.
* **Get Team Details & Players:** Fetch detailed information for a specific team, including its roster, with options to filter players by position, age range, and jersey number, and sort the player list.
* **Add New Player:** Add a new player by providing their details and the team they belong to.
* **Update Player:** Modify the details of an existing player using their team ID and jersey number.
* **Delete Player:** Remove a player from the database using their team ID and jersey number.
* **Search Teams or Players:** Search for teams or players based on various attributes (Team Name, Player Name, Position, Team ID, Stadium, Manager, Age, Number) using a generic search endpoint.

## Setup

This UI is a collection of static files and does not require a backend server to run itself. However, it **absolutely requires** the corresponding EPL Teams and Players API backend to be running and accessible from your browser.

1.  **Prerequisites:**
    * Ensure you have the [EPL Teams and Players API](LINK_TO_YOUR_API_REPO_IF_AVAILABLE) running on a server (e.g., an AWS EC2 instance) and accessible via a public URL (e.g., `http://your-api-url.compute.amazonaws.com:5000`). Make sure CORS is correctly configured on the API to allow requests from the origin where your UI is hosted.
    * You need a web server to host the static files. AWS S3 Static Website Hosting is a common and easy option.

2.  **Hosting the UI:**
    * Upload the contents of this repository (`index.html`, `script.js`, and any other assets like CSS files or libraries) to your static web server (e.g., configure an S3 bucket for static website hosting and upload the files).
    * Ensure the files are publicly accessible (via the S3 bucket policy).

3.  **Configure API Endpoint:**
    * Edit the `script.js` file.
    * Locate the `apiBaseUrl` variable at the top of the file.
    * Set its value to the public URL of your running API backend (e.g., `const apiBaseUrl = 'http://ec2-13-60-86-85.eu-north-1.compute.amazonaws.com:5000';`). Ensure the protocol (http or https) and port match your API setup and your S3 hosting protocol to avoid Mixed Content or CORS issues.

## Usage

1.  Access the hosted `index.html` file through your web server's URL.
2.  In the **User Authentication** section, enter the login credentials for your API (e.g., username: `vladi`, password: `Aa111111`).
3.  Click the "Login" button. If successful, a JWT token will be displayed, and the other API interaction sections should become available.
4.  Use the different sections of the UI to interact with the API endpoints (List Teams, Get Team Details, Add/Update/Delete Player, Search). Follow the instructions and placeholder text within each section.

## API Dependency

This UI is entirely dependent on the backend API being available. If the API is not running or is inaccessible due to network issues, firewall, security groups, or incorrect API URL configuration in `script.js`, the UI's API interaction features will not work.

## Acknowledgments

* Thanks to Gemini for assistance in developing and debugging the API and UI code, implementing features, and troubleshooting issues.

---