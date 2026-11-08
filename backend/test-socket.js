import { io } from "socket.io-client";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQlVTSU5FU1NfT1dORVIiLCJ0b2tlblZlcnNpb24iOjAsImlhdCI6MTc5MzkzNDQ0NiwiZXhwIjoxNzk0NTM5MjQ2LCJhdWQiOiJxdWV1ZWxlc3MtbW9iaWxlIiwiaXNzIjoicXVldWVsZXNzLWFwaSIsInN1YiI6IjZhZWI3ODllODZhZTY5YTlhYjJlMjc2YSJ9.1FUHKSAXoXCJMj52jLJYrL6jv_8wtzcV2mJ7_o1CHvM";

const socket = io("http://localhost:8000", {
  auth: { token },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit(
    "queue:join",
    { queueId: "6aed4736a041d511738ab51a" },
    (response) => {
      console.log("Queue join result:", response);
    },
  );
});

socket.on("connect_error", (error) => {
  console.log("Connection failed:", error.message);
});

socket.on("queue:entry_joined", (data) => {
  console.log("New entry:", data);
});

socket.on("queue:token_called", (data) => {
  console.log("Token called:", data);
});

socket.on("queue:position_updated", (data) => {
  console.log("Position updated:", data);
});

socket.on("queue:status_updated", (data) => {
  console.log("Queue status:", data);
});

socket.on("queue:service_completed", (data) => {
  console.log("Service completed event received:", data);
});
