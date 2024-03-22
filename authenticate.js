/*const currentUrl = window.location.href;
const params = new URLSearchParams(window.location.search);

console.log(currentUrl);
console.log(params);

params.forEach((value, key) => {
    console.log(`${key}: ${value}`);
});*/

const handleRequest = () => {
    console.log("Request started");
    fetch('https://api.dropentry.com/request', { // https://7wgnegmbs3.execute-api.ap-southeast-2.amazonaws.com/dev/request'
        method: 'POST',
        credentials: 'include', // Needed to include cookies in a cross-origin request
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "test": "this is a test"
            // Your expected "arguments" payload here
        })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}





const requestButton = document.getElementById("requestButton");
requestButton.addEventListener("click", handleRequest);
