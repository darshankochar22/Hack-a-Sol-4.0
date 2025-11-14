import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

// Get server URL from environment or use default
// For local network: Set REACT_APP_SERVER_URL=http://YOUR_IP:5003
// Example: REACT_APP_SERVER_URL=http://192.168.1.100:5003
// Note: Default port is 5003 for the multiplayer backend
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5003";

export const useMultiplayer = (playerId, onPlayersUpdate) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState({});
  const [roomId, setRoomId] = useState(null);
  const lastUpdateTimeRef = useRef(0);
  const UPDATE_INTERVAL = 100; // Send updates every 100ms (10 updates per second)

  // Initialize socket connection
  useEffect(() => {
    if (!playerId) return;

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to multiplayer server:", socket.id);
      console.log("📍 Server URL:", SERVER_URL);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from multiplayer server:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      console.error("📍 Attempted to connect to:", SERVER_URL);
      console.error("💡 Make sure:");
      console.error("   1. Backend server is running");
      console.error("   2. Server URL is correct (check REACT_APP_SERVER_URL)");
      console.error("   3. Firewall allows connections on port 5002");
      setIsConnected(false);
    });

    // Handle player updates from other clients
    socket.on("playerUpdate", (data) => {
      if (data.playerId !== playerId) {
        setPlayers((prev) => ({
          ...prev,
          [data.playerId]: {
            position: data.position,
            rotation: data.rotation,
            speed: data.speed,
            timestamp: data.timestamp,
          },
        }));
      }
    });

    // Handle player joined
    socket.on("playerJoined", (data) => {
      console.log("Player joined:", data.playerId);
      if (data.playerId !== playerId) {
        setPlayers((prev) => ({
          ...prev,
          [data.playerId]: {
            position: data.position || [0, 0.3, 0],
            rotation: data.rotation || { x: 0, y: 0, z: 0, w: 1 },
            speed: 0,
            timestamp: Date.now(),
          },
        }));
      }
    });

    // Handle player left
    socket.on("playerLeft", (data) => {
      console.log("Player left:", data.playerId);
      setPlayers((prev) => {
        const updated = { ...prev };
        delete updated[data.playerId];
        return updated;
      });
    });

    // Handle room assignment
    socket.on("roomAssigned", (data) => {
      console.log("Room assigned:", data.roomId);
      setRoomId(data.roomId);
    });

    // Handle all players in room
    socket.on("roomPlayers", (data) => {
      const otherPlayers = {};
      data.players.forEach((player) => {
        if (player.playerId !== playerId) {
          otherPlayers[player.playerId] = {
            position: player.position || [0, 0.3, 0],
            rotation: player.rotation || { x: 0, y: 0, z: 0, w: 1 },
            speed: player.speed || 0,
            timestamp: player.timestamp || Date.now(),
          };
        }
      });
      setPlayers(otherPlayers);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [playerId]);

  // Join a race room
  const joinRoom = useCallback(
    (raceRoomId) => {
      if (socketRef.current) {
        if (isConnected) {
          // If connected, join immediately
          socketRef.current.emit("joinRace", {
            playerId,
            roomId: raceRoomId,
          });
          setRoomId(raceRoomId);
        } else {
          // If not connected, wait for connection then join
          const connectHandler = () => {
            if (socketRef.current) {
              socketRef.current.emit("joinRace", {
                playerId,
                roomId: raceRoomId,
              });
              setRoomId(raceRoomId);
              socketRef.current.off("connect", connectHandler);
            }
          };
          socketRef.current.on("connect", connectHandler);
          setRoomId(raceRoomId); // Set roomId so we know we want to join
        }
      }
    },
    [playerId, isConnected]
  );

  // Leave the current room
  const leaveRoom = useCallback(() => {
    if (socketRef.current && roomId) {
      socketRef.current.emit("leaveRace", {
        playerId,
        roomId,
      });
      setRoomId(null);
      setPlayers({});
    }
  }, [playerId, roomId]);

  // Send player position update (throttled)
  const sendPositionUpdate = useCallback(
    (position, rotation, speed) => {
      if (!socketRef.current || !isConnected || !roomId) return;

      const now = Date.now();
      if (now - lastUpdateTimeRef.current < UPDATE_INTERVAL) return;

      lastUpdateTimeRef.current = now;

      socketRef.current.emit("playerPositionUpdate", {
        playerId,
        roomId,
        position: Array.isArray(position)
          ? position
          : [position.x, position.y, position.z],
        rotation: rotation
          ? {
              x: rotation.x || rotation._x || 0,
              y: rotation.y || rotation._y || 0,
              z: rotation.z || rotation._z || 0,
              w: rotation.w || rotation._w || 1,
            }
          : { x: 0, y: 0, z: 0, w: 1 },
        speed: speed || 0,
        timestamp: now,
      });
    },
    [playerId, roomId, isConnected]
  );

  // Notify callback when players update
  useEffect(() => {
    if (onPlayersUpdate) {
      onPlayersUpdate(players);
    }
  }, [players, onPlayersUpdate]);

  return {
    isConnected,
    players,
    roomId,
    joinRoom,
    leaveRoom,
    sendPositionUpdate,
  };
};
