const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInputMessage = $messageForm.querySelector('#message');
const $messageFormButtonSendMessage = $messageForm.querySelector('#send-message');
const $locationButton = document.getElementById('send-location');
const $chatMessages = document.getElementById('chat-messages');

//Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

//Options
//Get the username and room from the "location.search"
// const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true}); --> Qs not working!
let listQuerySearch = [];
location.search.split('&').forEach(search => listQuerySearch.push(search.split('=')[1]));
const autoscroll = () => {
    //get height and margin from message
    const $newMessage = $chatMessages.lastElementChild;
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    //Make visible height
    const visibleHeight = $chatMessages.offsetHeight;
    //Height of messages container
    const containerHeight = $chatMessages.scrollHeight;
    //How far have I scrolled?
    const scrollOffset = $chatMessages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $chatMessages.scrollTop = $chatMessages.scrollHeight;
    };
};

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    });
    $chatMessages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButtonSendMessage.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (err) => {
        //Cleanning input message
        $messageFormButtonSendMessage.removeAttribute('disabled');
        $messageFormInputMessage.value = '';
        $messageFormInputMessage.focus();
        if ( err) {
            return console.log(err);
        };
        console.log('The message was delivered!');//setting up acknowledgements
    });
});

$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    };
    //Get geolocation from navigator (check mdn geolocation)
    navigator.geolocation.getCurrentPosition((position) => {
        $locationButton.setAttribute('disabled', 'disabled');
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared!');//setting up acknowledgements
            $locationButton.removeAttribute('disabled');
        });
    });
});

socket.on('locationMessage', (url) => {
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('HH:mm')
    });
    $chatMessages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

const username = listQuerySearch[0];
const room = listQuerySearch[1];
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    };
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.getElementById('sidebar').innerHTML = html;
});