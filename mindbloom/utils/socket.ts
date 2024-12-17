import { io } from "'socket.io-client'";

export const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "'https://your-heroku-app-name.herokuapp.com'", {
  reconnectionDelayMax: 10000,
});

