import { Server as SocketIOServer, Socket } from 'socket.io';

export interface SplitExecutedPayload {
  splitId: string;
  /** Raw sender address — anonymization is done on the frontend */
  sender: string;
  amount: string;
  token: string;
  recipientCount: number;
  timestamp: string;
}

export interface StreamEventPayload {
  streamId: string;
  sender: string;
  receiver: string;
  amount?: string;
  status?: string;
  timestamp: string;
}

export interface BalanceUpdatePayload {
  address: string;
  newBalance: string;
  timestamp: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private userRooms: Map<string, Set<string>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.on('join-stream-room', (userAddress: string) => {
        this.joinUserRoom(socket, userAddress);
      });

      socket.on('join-split-feed', () => {
        socket.join('split-feed');
      });

      socket.on('leave-stream-room', (userAddress: string) => {
        this.leaveUserRoom(socket, userAddress);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  private joinUserRoom(socket: Socket, userAddress: string): void {
    const roomName = `stream-${userAddress}`;
    socket.join(roomName);
    
    if (!this.userRooms.has(userAddress)) {
      this.userRooms.set(userAddress, new Set());
    }
    this.userRooms.get(userAddress)!.add(socket.id);
    
    console.log(`📱 Socket ${socket.id} joined room for user: ${userAddress}`);
    socket.emit('joined-room', { userAddress, roomName });
  }

  private leaveUserRoom(socket: Socket, userAddress: string): void {
    const roomName = `stream-${userAddress}`;
    socket.leave(roomName);
    
    const userSockets = this.userRooms.get(userAddress);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.userRooms.delete(userAddress);
      }
    }
    
    console.log(`📱 Socket ${socket.id} left room for user: ${userAddress}`);
    socket.emit('left-room', { userAddress, roomName });
  }

  private handleDisconnect(socket: Socket): void {
    for (const [userAddress, sockets] of this.userRooms.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userRooms.delete(userAddress);
        }
        break;
      }
    }
  }

  emitNewStream(userAddress: string, payload: StreamEventPayload): void {
    const roomName = `stream-${userAddress}`;
    this.io.to(roomName).emit('new-stream', payload);
    console.log(`🚀 Emitted NEW_STREAM to room ${roomName}:`, payload);
  }

  emitBalanceUpdate(userAddress: string, payload: BalanceUpdatePayload): void {
    const roomName = `stream-${userAddress}`;
    this.io.to(roomName).emit('balance-update', payload);
    console.log(`💰 Emitted BALANCE_UPDATE to room ${roomName}:`, payload);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userRooms.keys());
  }

  getUserSocketCount(userAddress: string): number {
    return this.userRooms.get(userAddress)?.size || 0;
  }

  broadcastToAll(event: string, payload: any): void {
    this.io.emit(event, payload);
    console.log(`📢 Broadcasted ${event} to all clients:`, payload);
  }

  emitSplitExecuted(payload: SplitExecutedPayload): void {
    this.io.to('split-feed').emit('SPLIT_EXECUTED', payload);
    console.log(`✂️  Emitted SPLIT_EXECUTED to split-feed:`, payload);
  }
}

export type WebSocketServiceType = WebSocketService;
