// SocketManager.js - Quản lý kết nối socket

export class SocketManager {
    constructor(chatApp) {
        this.chatApp = chatApp;
        this.socket = null;
        this.eventHandlers = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3 giây
        this.sentMessageIds = new Set(); // Lưu trữ ID của các tin nhắn đã gửi
    }
    
    /**
     * Khởi tạo kết nối socket
     */
    initSocket() {
        // Kiểm tra xem đã có thư viện socket.io chưa
        if (typeof io === 'undefined') {
            this.loadSocketIOScript(() => {
                this.connect();
            });
        } else {
            this.connect();
        }
    }
    
    /**
     * Tải thư viện socket.io
     */
    loadSocketIOScript(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.4.1/socket.io.min.js';
        script.onload = callback;
        script.onerror = () => {
            console.error('Không thể tải thư viện Socket.IO');
            this.chatApp.notification.showNotification('Không thể kết nối đến server. Vui lòng thử lại sau.', 'error');
        };
        document.head.appendChild(script);
    }
    
    /**
     * Kết nối đến server
     */
    connect() {
        try {
            // Lấy URL server từ API key
            const serverUrl = this.getServerUrl();
            
            // Tạo kết nối socket
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                query: {
                    api_key: this.chatApp.apiKey,
                    domain: window.location.hostname
                }
            });
            
            // Đăng ký các sự kiện
            this.registerEvents();
            
        } catch (error) {
            console.error('Lỗi khi kết nối socket:', error);
            this.chatApp.notification.showNotification('Không thể kết nối đến server. Vui lòng thử lại sau.', 'error');
        }
    }
    
    /**
     * Lấy URL server từ API key
     */
    getServerUrl() {
        // Mặc định sử dụng localhost cho phát triển
        return 'https://vuquangduy.online';
    }
    
    /**
     * Đăng ký các sự kiện socket
     */
    registerEvents() {
        if (!this.socket) return;
        
        // Sự kiện kết nối thành công
        this.socket.on('connect', () => {
            this.chatApp.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Nếu đã đăng ký, gửi thông tin khách hàng
            if (this.chatApp.isRegistered && this.chatApp.customerId) {
                this.reconnectCustomer();
            }
        });
        
        // Sự kiện mất kết nối
        this.socket.on('disconnect', (reason) => {
            this.chatApp.isConnected = false;
            
            // Hiển thị thông báo
            this.chatApp.notification.showNotification('Mất kết nối đến server. Đang thử kết nối lại...', 'warning');
            
            // Thử kết nối lại nếu không phải do người dùng ngắt kết nối
            if (reason !== 'io client disconnect') {
                this.attemptReconnect();
            }
        });
        
        // Sự kiện lỗi
        this.socket.on('connect_error', (error) => {
            console.error('Lỗi kết nối socket:', error);
            this.chatApp.isConnected = false;
            
            // Hiển thị thông báo
            this.chatApp.notification.showNotification('Không thể kết nối đến server. Đang thử kết nối lại...', 'error');
            
            // Thử kết nối lại
            this.attemptReconnect();
        });
        
        // Sự kiện nhận tin nhắn mới
        this.socket.on('new_message', (message) => {
            
            // Xử lý tin nhắn mới
            this.handleNewMessage(message);
        });
        
        // Sự kiện nhận danh sách phòng chat
        this.socket.on('room_list', (data) => {
            
            // Cập nhật danh sách phòng
            if (data.rooms) {
                this.chatApp.availableRooms = data.rooms;
                
                // Hiển thị danh sách phòng nếu đang ở màn hình danh sách phòng
                if (this.chatApp.currentView === 'room-list') {
                    this.chatApp.ui.showAvailableRooms();
                }
            }
        });
        
        // Sự kiện nhận thông tin domain
        this.socket.on('domain_info', (data) => {
            
            // Lưu thông tin domain
            this.chatApp.domainInfo = data;
        });
        
        // Sự kiện nhận danh sách người dùng trong phòng chat công khai
        this.socket.on('room_users_list', (data) => {
            
            // Cập nhật danh sách người dùng
            if (data.users && this.chatApp.currentView === 'public-chat') {
                this.chatApp.ui.updateRoomUsersList(data.users);
            }
        });
    }
    
    /**
     * Thử kết nối lại
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Đã vượt quá số lần thử kết nối lại tối đa');
            this.chatApp.notification.showNotification('Không thể kết nối đến server sau nhiều lần thử. Vui lòng tải lại trang.', 'error');
            return;
        }
        
        this.reconnectAttempts++;
        
        
        // Thử kết nối lại sau một khoảng thời gian
        setTimeout(() => {
            if (!this.chatApp.isConnected) {
                this.connect();
            }
        }, this.reconnectDelay);
        
        // Tăng thời gian chờ cho lần kết nối tiếp theo
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // Tối đa 30 giây
    }
    
    /**
     * Kết nối lại với thông tin khách hàng đã lưu
     */
    reconnectCustomer() {
        if (!this.socket || !this.chatApp.isConnected) {
            console.error('Không thể kết nối lại: Socket chưa được khởi tạo hoặc chưa kết nối');
            return;
        }
        
        if (!this.chatApp.customerId || !this.chatApp.customerInfo) {
            console.error('Không thể kết nối lại: Thiếu thông tin khách hàng');
            return;
        }
        
        
        // Gửi thông tin khách hàng để kết nối lại
        this.emit('customer_reconnect', {
            customerId: this.chatApp.customerId,
            api_key: this.chatApp.apiKey,
            domain: window.location.hostname
        }, (response) => {
            if (response && response.success) {
                
                // Cập nhật thông tin nếu có
                if (response.customerInfo) {
                    this.chatApp.customerInfo = response.customerInfo;
                }
                
                // Cập nhật danh sách phòng đã tham gia nếu có
                if (response.joinedRooms) {
                    this.chatApp.joinedRooms = response.joinedRooms;
                }
                
                // Hiển thị thông báo thành công
                this.chatApp.notification.showNotification('Kết nối lại thành công!', 'success');
                
                // Nếu đang trong phòng chat, tham gia lại phòng đó
                if (this.chatApp.currentRoomId) {
                    if (this.chatApp.currentView === 'direct-chat') {
                        this.chatApp.joinDirectChatRoom();
                    } else if (this.chatApp.currentView === 'chat-room') {
                        this.chatApp.joinChatRoom(this.chatApp.currentRoomId);
                    }
                }
            } else {
                console.error('Kết nối lại thất bại:', response ? response.error : 'Không có phản hồi');
                
                // Kiểm tra nếu lỗi là "Không tìm thấy thông tin khách hàng"
                if (response && response.error && response.error.includes('Không tìm thấy')) {
                    // Xóa thông tin cũ và yêu cầu đăng ký lại
                    this.chatApp.storage.clearStoredCustomerInfo();
                    
                    // Hiển thị thông báo
                    this.chatApp.notification.showNotification('Thông tin đăng nhập không còn hợp lệ. Vui lòng đăng ký lại.', 'warning');
                    
                    // Hiển thị form đăng ký
                    this.chatApp.ui.showRegistrationForm();
                } else {
                    // Hiển thị thông báo lỗi chung
                    this.chatApp.notification.showNotification(response && response.error ? response.error : 'Kết nối lại thất bại. Vui lòng thử lại sau.', 'error');
                }
            }
        });
    }
    
    /**
     * Gửi sự kiện socket
     */
    emit(event, data, callback) {
        if (!this.socket) {
            console.error('Không thể gửi sự kiện: Socket chưa được khởi tạo');
            if (callback) callback({ success: false, error: 'Không có kết nối đến server' });
            return;
        }
        
        if (!this.chatApp.isConnected) {
            console.error('Không thể gửi sự kiện: Chưa kết nối đến server');
            if (callback) callback({ success: false, error: 'Không có kết nối đến server' });
            return;
        }
        
        this.socket.emit(event, data, callback);
    }
    
    /**
     * Đăng ký một lần cho sự kiện
     */
    once(event, callback) {
        if (!this.socket) {
            console.error('Không thể đăng ký sự kiện: Socket chưa được khởi tạo');
            return;
        }
        
        this.socket.once(event, callback);
    }
    
    /**
     * Đăng ký cho sự kiện
     */
    on(event, callback) {
        if (!this.socket) {
            console.error('Không thể đăng ký sự kiện: Socket chưa được khởi tạo');
            return;
        }
        
        // Lưu handler để có thể gỡ bỏ sau này
        this.eventHandlers[event] = callback;
        this.socket.on(event, callback);
    }
    
    /**
     * Hủy đăng ký sự kiện
     */
    off(event) {
        if (!this.socket) {
            console.error('Không thể hủy đăng ký sự kiện: Socket chưa được khởi tạo');
            return;
        }
        
        if (this.eventHandlers[event]) {
            this.socket.off(event, this.eventHandlers[event]);
            delete this.eventHandlers[event];
        }
    }
    
    /**
     * Ngắt kết nối socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.chatApp.isConnected = false;
        }
    }
    
    /**
     * Lấy danh sách phòng chat công khai
     * @param {function} callback - Hàm callback khi lấy danh sách phòng chat xong
     */
    getPublicRooms(callback) {
        
        this.emit('get_public_rooms', { include_global: true }, (response) => {
            if (response && response.success) {
                callback(response);
            } else {
                console.error('Lấy danh sách phòng chat công khai thất bại:', response ? response.error : 'Không có phản hồi');
                callback({
                    success: false,
                    error: response && response.error ? response.error : 'Không thể lấy danh sách phòng chat công khai'
                });
            }
        });
    }
    
    /**
     * Tham gia phòng chat công khai
     * @param {string} roomId - ID của phòng chat công khai
     * @param {function} callback - Hàm callback khi tham gia phòng chat xong
     */
    joinPublicRoom(roomId, callback) {
        
        this.emit('join_public_room', { room_id: roomId }, (response) => {
            if (response && response.success) {
                callback(response);
            } else {
                console.error('Tham gia phòng chat công khai thất bại:', response ? response.error : 'Không có phản hồi');
                callback({
                    success: false,
                    error: response && response.error ? response.error : 'Không thể tham gia phòng chat công khai'
                });
            }
        });
    }
    
    /**
     * Rời phòng chat công khai
     * @param {string} roomId - ID của phòng chat công khai
     * @param {function} callback - Hàm callback khi rời phòng chat xong
     */
    leavePublicRoom(roomId, callback) {
        
        this.emit('leave_public_room', { room_id: roomId }, (response) => {
            if (response && response.success) {
                callback(response);
            } else {
                console.error('Rời phòng chat công khai thất bại:', response ? response.error : 'Không có phản hồi');
                callback({
                    success: false,
                    error: response && response.error ? response.error : 'Không thể rời phòng chat công khai'
                });
            }
        });
    }
    
    /**
     * Gửi tin nhắn trong phòng chat công khai
     * @param {object} messageObj - Đối tượng tin nhắn cần gửi
     * @param {function} callback - Hàm callback khi gửi tin nhắn xong
     */
    sendPublicMessage(messageObj, callback) {
        
        this.emit('send_public_message', messageObj, (response) => {
            if (response && response.success) {
                
                // Lưu ID tin nhắn đã gửi vào cả hai Set để ngăn hiển thị lại
                if (response.message && response.message.id) {
                    this.sentMessageIds.add(response.message.id);
                    this.chatApp.messageManager.displayedMessageIds.add(response.message.id);
                }
                
                callback(response);
            } else {
                console.error('Gửi tin nhắn trong phòng chat công khai thất bại:', response ? response.error : 'Không có phản hồi');
                callback({
                    success: false,
                    error: response && response.error ? response.error : 'Không thể gửi tin nhắn'
                });
            }
        });
    }
    
    /**
     * Xử lý tin nhắn mới
     * @param {object} message - Tin nhắn mới nhận từ server
     */
    handleNewMessage(message) {
        
        // Kiểm tra xem tin nhắn có ID không
        if (!message.id) {
            this.chatApp.messageManager.handleNewMessage(message);
            return;
        }
        
        // Kiểm tra xem tin nhắn có phải từ khách hàng không
        const isFromCustomer = message.sender === 'customer' || message.sender_type === 'customer';
        
        // Kiểm tra xem tin nhắn đã được gửi từ client này chưa
        const isInSentMessageIds = this.sentMessageIds.has(message.id);
        const isInDisplayedMessageIds = this.chatApp.messageManager.displayedMessageIds.has(message.id);
        
        
        // Kiểm tra xem tin nhắn đã tồn tại trong DOM chưa
        const messagesContainer = this.chatApp.messageManager.getOrCreateMessagesContainer();
        const existsInDOM = messagesContainer.querySelector(`.message[data-id="${message.id}"]`);
        
        // Nếu tin nhắn đã tồn tại trong DOM hoặc đã được lưu trong một trong hai Set, bỏ qua
        if (existsInDOM || isInSentMessageIds || isInDisplayedMessageIds) {
            return;
        }
        
        // Kiểm tra xem có phải tin nhắn tạm thời không
        const tempMessage = messagesContainer.querySelector(`.message[data-temp="true"]`);
        if (tempMessage && isFromCustomer) {
            // Nếu là tin nhắn từ khách hàng và có tin nhắn tạm thời, cập nhật tin nhắn tạm thời
            tempMessage.setAttribute('data-id', message.id);
            tempMessage.classList.remove('temp-message');
            tempMessage.removeAttribute('data-temp');
            
            // Thêm ID vào Set để tránh hiển thị lại
            this.sentMessageIds.add(message.id);
            this.chatApp.messageManager.displayedMessageIds.add(message.id);
            
            return;
        }
        
        // Nếu là tin nhắn mới, xử lý bình thường
        this.chatApp.messageManager.handleNewMessage(message);
    }
    
    /**
     * Xử lý gửi tin nhắn
     * @param {object} messageObj - Đối tượng tin nhắn cần gửi
     * @param {function} callback - Hàm callback khi gửi tin nhắn xong
     */
    handleSendMessage(messageObj, callback) {
        
        // Gửi tin nhắn đến server
        this.emit('send_message', messageObj, (response) => {
            if (response.success) {
                
                // Lưu ID tin nhắn đã gửi vào cả hai Set để ngăn hiển thị lại
                if (response.message && response.message.id) {
                    this.sentMessageIds.add(response.message.id);
                    this.chatApp.messageManager.displayedMessageIds.add(response.message.id);
                }
            }
            
            // Gọi callback với kết quả
            if (callback) callback(response);
        });
    }
} 