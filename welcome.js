const clientId = '454235B3B68F4B158C9ED03700E0D7B6';
const redirectUri = encodeURIComponent('https://api.dropentry.com/auth'); // https://api.dropentry.com/dev/auth // https://7wgnegmbs3.execute-api.ap-southeast-2.amazonaws.com/dev/auth // http://localhost:5500/auth.html
const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid profile email files accounting.transactions accounting.attachments accounting.contacts accounting.settings offline_access`;


// https://7wgnegmbs3.execute-api.ap-southeast-2.amazonaws.com/dev/token


const authenticate = () => {
    console.log("Initiating authentication");
    // Redirect the user to the authorization URL
    window.location.href = authUrl;
}

const authButton = document.getElementById("authButton");
authButton.addEventListener("click", authenticate);
console.log("welcome.js"); 