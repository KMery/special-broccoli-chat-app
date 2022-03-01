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

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true});

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    });
    $chatMessages.insertAdjacentHTML('beforeend', html);
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
    console.log(url);
    const html = Mustache.render(locationTemplate, {
        url: url.url,
        createdAt: moment(url.createdAt).format('HH:mm')
    });
    $chatMessages.insertAdjacentHTML('beforeend', html);
});

socket.emit('join', { username, room })