// CustomerChat.js - Lớp chính quản lý ứng dụng chat

import { UIManager } from './UIManager.js';
import { SocketManager } from './SocketManager.js';
import { StorageManager } from './StorageManager.js';
import { NotificationManager } from './NotificationManager.js';
import { MessageManager } from './MessageManager.js';

export class CustomerChat {
    constructor() {
        // Khởi tạo các thuộc tính
        this.apiKey = document.getElementById('api-key').value;
        this.customerId = null;
        this.customerInfo = null;
        this.currentRoomId = null;
        this.availableRooms = [];
        this.joinedRooms = [];
        this.unreadMessages = {};
        this.totalUnread = 0;
        this.domainInfo = null;
        this.isRegistered = false;
        this.isConnected = false;
        this.currentView = 'welcome'; // welcome, register, direct-chat, room-list, chat-room
        
        // Khởi tạo các manager
        this.ui = new UIManager(this);
        this.socket = new SocketManager(this);
        this.storage = new StorageManager(this);
        this.notification = new NotificationManager();
        this.messageManager = new MessageManager(this);
        
        // Khởi tạo giao diện
        this.ui.initUI();
        
        // Khởi tạo kết nối socket
        this.socket.initSocket();
        
        // Kiểm tra thông tin khách hàng đã lưu
        this.checkStoredCustomerInfo();
    }
    
    /**
     * Kiểm tra thông tin khách hàng đã lưu
     */
    checkStoredCustomerInfo() {
        const storedData = this.storage.getStoredCustomerInfo();
        
        if (storedData) {
            this.customerInfo = storedData.customerInfo;
            this.customerId = storedData.customerId;
            this.isRegistered = true;
            
            
            // Khôi phục danh sách phòng chat công khai đã tham gia
            this.joinedRooms = this.storage.getStoredJoinedPublicRooms() || [];
            
            if (this.joinedRooms.length > 0) {
            }
            
            // Khôi phục trạng thái tin nhắn chưa đọc
            this.unreadMessages = this.storage.getStoredUnreadMessages() || {};
            this.updateTotalUnread();
            
            // Hiển thị giao diện chào mừng
            this.ui.showWelcomeScreen();
            
            // Kết nối lại với thông tin khách hàng
            if (this.isConnected) {
                this.socket.reconnectCustomer();
                
                // Đăng ký sự kiện khi kết nối thành công
                this.socket.once('connect', () => {
                    // Tự động tham gia lại phòng chat công khai đã tham gia trước đó
                    this.autoRejoinPublicRooms();
                });
            } else {
                // Đăng ký sự kiện khi kết nối thành công
                this.socket.once('connect', () => {
                    this.socket.reconnectCustomer();
                    
                    // Tự động tham gia lại phòng chat công khai đã tham gia trước đó
                    this.autoRejoinPublicRooms();
                });
            }
        } else {
            // Hiển thị form đăng ký
            this.ui.showRegistrationForm();
        }
    }
    
    /**
     * Tự động tham gia lại các phòng chat công khai đã tham gia trước đó
     */
    autoRejoinPublicRooms() {
        if (!this.isConnected || !this.isRegistered || !this.joinedRooms || this.joinedRooms.length === 0) {
            return;
        }
        
        
        // Nếu đang ở trong phòng chat công khai, tham gia lại phòng đó
        if (this.currentRoomId && this.currentView === 'public-chat') {
            const currentRoom = this.joinedRooms.find(room => room._id === this.currentRoomId);
            
            if (currentRoom) {
                this.joinPublicRoom(currentRoom._id);
                return;
            }
        }
        
        // Nếu không có phòng hiện tại, chỉ cập nhật danh sách phòng đã tham gia
        // Không tự động tham gia vào bất kỳ phòng nào để tránh gây khó chịu cho người dùng
    }
    
    /**
     * Lấy thông tin thiết bị
     */
    getDeviceInfo() {
        return {
            device_fingerprint: this.generateFingerprint(),
            user_agent: navigator.userAgent,
            referrer_url: document.referrer,
            current_page: window.location.href,
            screen_resolution: `${window.screen.width}x${window.screen.height}`
        };
    }
    
    /**
     * Tạo fingerprint đơn giản cho thiết bị
     */
    generateFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            navigator.platform,
            navigator.hardwareConcurrency,
            window.screen.colorDepth,
            window.screen.width + 'x' + window.screen.height
        ];
        
        return btoa(components.join('###')).replace(/=/g, '').substring(0, 32);
    }
    
    /**
     * Đăng ký thông tin khách hàng
     */
    registerCustomer(info) {
        // Kiểm tra kết nối và thử kết nối lại nếu cần
        if (!this.isConnected) {
            
            // Hiển thị thông báo đang kết nối
            this.notification.showNotification('Đang kết nối đến server...', 'info');
            
            // Thử kết nối lại
            this.socket.connect();
            
            // Đợi kết nối thành công rồi đăng ký
            this.socket.once('connect', () => {
                this.isConnected = true;
                this.registerCustomer(info);
            });
            
            return;
        }
        
        
        // Lấy thông tin thiết bị
        const deviceInfo = this.getDeviceInfo();
        
        // Tạo thông tin khách hàng
        this.customerInfo = {
            ...info,
            ...deviceInfo,
            api_key: this.apiKey,
            origin: this.origin,
            domain: window.location.hostname // Thêm thông tin domain hiện tại
        };
        
        // Hiển thị thông báo đang đăng ký
        this.notification.showNotification('Đang đăng ký thông tin...', 'info');
        
        // Gửi thông tin đăng ký
        this.socket.emit('customer_register', this.customerInfo, (response) => {
            if (response && response.success) {
                
                // Lưu ID khách hàng
                this.customerId = response.customerId || response.customer_id;
                this.isRegistered = true;
                
                // Lưu thông tin khách hàng vào localStorage
                this.storage.storeCustomerInfo();
                
                // Hiển thị thông báo thành công
                this.notification.showNotification('Đăng ký thành công!', 'success');
                
                // Xử lý hành động tiếp theo
                if (info.nextAction === 'direct') {
                    this.startDirectChat();
                } else {
                    this.ui.showRoomSelection();
                }
            } else {
                console.error('Đăng ký thất bại:', response ? response.error : 'Không có phản hồi');
                this.notification.showNotification(response && response.error ? response.error : 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
            }
        });
    }
    
    /**
     * Cập nhật thông tin khách hàng
     */
    updateCustomerInfo(info) {
        // Kiểm tra kết nối
        if (!this.isConnected) {
            this.notification.showNotification('Không có kết nối đến server. Vui lòng thử lại sau.', 'error');
            return;
        }
        
        // Hiển thị thông báo đang cập nhật
        this.notification.showNotification('Đang cập nhật thông tin...', 'info');
        
        // Cập nhật thông tin khách hàng
        const updateData = {
            customerId: this.customerId,
            domain: window.location.hostname, // Thêm thông tin domain hiện tại
            ...info
        };
        
        // Gửi yêu cầu cập nhật
        this.socket.emit('update_customer_info', updateData, (response) => {
            if (response && response.success) {
                
                // Cập nhật thông tin khách hàng
                this.customerInfo = {
                    ...this.customerInfo,
                    ...info
                };
                
                // Lưu thông tin khách hàng vào localStorage
                this.storage.storeCustomerInfo();
                
                // Đánh dấu không cần cập nhật nữa
                this.needInfoUpdate = false;
                
                // Hiển thị thông báo thành công
                this.notification.showNotification('Cập nhật thông tin thành công!', 'success');
                
                // Xử lý hành động tiếp theo
                if (info.nextAction === 'direct') {
                    this.startDirectChat();
                } else {
                    this.ui.showRoomSelection();
                }
            } else {
                console.error('Cập nhật thông tin thất bại:', response ? response.error : 'Không có phản hồi');
                this.notification.showNotification(response && response.error ? response.error : 'Cập nhật thông tin thất bại. Vui lòng thử lại.', 'error');
            }
        });
    }
    
    /**
     * Bắt đầu chat trực tiếp với admin
     */
    startDirectChat() {
        // Kiểm tra xem đã đăng ký chưa
        if (!this.isRegistered || !this.customerId) {
            console.error('Chưa đăng ký thông tin khách hàng');
            this.notification.showNotification('Vui lòng đăng ký thông tin trước khi chat', 'error');
            this.ui.showRegistrationForm('direct');
            return;
        }
        
        // Kiểm tra xem có cần cập nhật thông tin không
        if (this.needInfoUpdate) {
            this.ui.requestInfoUpdate('direct');
            return;
        }
        
        // Hiển thị giao diện chat trực tiếp
        this.ui.showDirectChatUI();
        
        // Tham gia phòng chat trực tiếp
        this.joinDirectChatRoom();
        
        this.currentView = 'direct-chat';
    }
    
    /**
     * Tham gia phòng chat trực tiếp
     */
    joinDirectChatRoom() {
        // Kiểm tra xem đã đăng ký chưa
        if (!this.isRegistered || !this.customerId) {
            console.error('Chưa đăng ký thông tin khách hàng');
            this.notification.showNotification('Vui lòng đăng ký thông tin trước khi chat', 'error');
            this.ui.showRegistrationForm('direct');
            return;
        }
        
        // Hiển thị thông báo đang kết nối
        this.messageManager.displaySystemMessage('Đang kết nối với nhân viên hỗ trợ...');
        
        
        // Gửi yêu cầu tham gia phòng chat trực tiếp
        this.socket.emit('join_direct_chat', {
            customerId: this.customerId
        }, (response) => {
            if (response && response.success) {
                this.currentRoomId = response.roomId;
                
                // Hiển thị tin nhắn chào mừng
                this.messageManager.displaySystemMessage(response.welcomeMessage || 'Chào mừng bạn đến với phòng chat hỗ trợ. Nhân viên sẽ hỗ trợ bạn trong thời gian sớm nhất.');
                
                // Tải lịch sử chat từ server
                this.loadChatHistory(this.currentRoomId);
            } else {
                console.error('Tham gia phòng chat trực tiếp thất bại:', response ? response.error : 'Không có phản hồi');
                
                // Kiểm tra nếu lỗi là "Không tìm thấy thông tin khách hàng"
                if (response && response.error && response.error.includes('Không tìm thấy')) {
                    // Xóa thông tin cũ và yêu cầu đăng ký lại
                    this.storage.clearStoredCustomerInfo();
                    
                    // Hiển thị thông báo
                    this.notification.showNotification('Thông tin đăng nhập không còn hợp lệ. Vui lòng đăng ký lại.', 'warning');
                    
                    // Hiển thị form đăng ký
                    this.ui.showRegistrationForm('direct');
                } else {
                    // Hiển thị thông báo lỗi chung
                    this.notification.showNotification(response && response.error ? response.error : 'Không thể tham gia phòng chat. Vui lòng thử lại sau.', 'error');
                    
                    // Hiển thị tin nhắn lỗi
                    this.messageManager.displaySystemMessage('Không thể kết nối với nhân viên hỗ trợ. Vui lòng thử lại sau.');
                }
            }
        });
    }
    
    /**
     * Tải lịch sử chat từ server
     */
    loadChatHistory(roomId) {
        
        // Gửi yêu cầu lấy lịch sử chat
        this.socket.emit('get_chat_history', { roomId }, (response) => {
            if (response && response.success) {
                
                // Xóa tin nhắn cũ
                const messagesContainer = this.messageManager.getOrCreateMessagesContainer();
                messagesContainer.innerHTML = '';
                
                // Sắp xếp tin nhắn theo thời gian (cũ nhất lên trên)
                const sortedMessages = [...response.messages].sort((a, b) => {
                    const timeA = new Date(a.created_at || a.createdAt).getTime();
                    const timeB = new Date(b.created_at || b.createdAt).getTime();
                    return timeA - timeB;
                });
                
                // Hiển thị tin nhắn
                sortedMessages.forEach(msg => {
                    this.messageManager.displayMessage(msg);
                });
                
                // Cuộn xuống dưới
                this.messageManager.scrollToBottom();
            } else {
                console.error('Lấy lịch sử chat thất bại:', response ? response.error : 'Không có phản hồi');
                
                // Thử lấy lịch sử chat qua API REST
                this.loadChatHistoryViaAPI(roomId);
            }
        });
    }
    
    /**
     * Tải lịch sử chat qua API REST (phương pháp dự phòng)
     */
    loadChatHistoryViaAPI(roomId) {
        fetch(`https://vuquangduy.online/api/message/room/${roomId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Customer-ID': this.customerId
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.messages) {
                
                // Xóa tin nhắn cũ
                const messagesContainer = this.messageManager.getOrCreateMessagesContainer();
                messagesContainer.innerHTML = '';
                
                // Hiển thị tin nhắn
                data.messages.forEach(msg => {
                    this.messageManager.displayMessage({
                        id: msg._id,
                        content: msg.message_text,
                        type: msg.file_data ? 'file' : 'text',
                        sender: msg.sender_type,
                        sender_type: msg.sender_type,
                        createdAt: msg.created_at,
                        file: msg.file_data ? {
                            name: msg.file_data.originalname,
                            type: msg.file_data.mimetype,
                            data: msg.file_data.path
                        } : null
                    });
                });
                
                // Cuộn xuống dưới
                this.messageManager.scrollToBottom();
            } else {
                console.error('Lấy lịch sử chat thất bại:', data.error || 'Không có dữ liệu');
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải lịch sử chat qua API:', error);
        });
    }
    
    /**
     * Tham gia phòng chat
     */
    joinChatRoom(roomId) {
        this.socket.emit('join_room', { roomId }, (response) => {
            if (response.success) {
                this.currentRoomId = roomId;
                
                // Cập nhật danh sách phòng đã tham gia
                if (!this.joinedRooms.some(r => r.id === roomId)) {
                    const room = this.availableRooms.find(r => r.id === roomId);
                    if (room) {
                        this.joinedRooms.push(room);
                    }
                }
                
                // Hiển thị phòng chat
                this.ui.showChatRoom(response.room);
                
                // Tải lịch sử chat từ server
                this.loadChatHistory(roomId);
            } else {
                console.error('Tham gia phòng chat thất bại:', response.error);
                this.notification.showNotification(response.error || 'Không thể tham gia phòng chat. Vui lòng thử lại sau.', 'error');
            }
        });
    }
    
    /**
     * Gửi tin nhắn
     */
    sendMessage() {
        const { chatInput } = this.ui.elements;
        const input = chatInput.querySelector('input[type="text"]');
        const message = input.value.trim();
        
        if (!message) return;
        
        if (!this.currentRoomId) {
            this.notification.showNotification('Bạn chưa tham gia phòng chat nào.', 'error');
            return;
        }
        
        // Xóa nội dung input
        input.value = '';
        
        // Tạo ID tạm thời cho tin nhắn
        const tempId = 'temp-' + Date.now();
        
        // Hiển thị tin nhắn tạm thời (optimistic UI)
        const tempMessage = {
            id: tempId,
            content: message,
            type: 'text',
            sender: 'customer',
            sender_type: 'customer',
            createdAt: new Date(),
            isTemp: true
        };
        
        this.messageManager.displayMessage(tempMessage);
        
        // Cuộn xuống dưới
        this.messageManager.scrollToBottom();
        
        // Tạo đối tượng tin nhắn
        const messageObj = {
            room_id: this.currentRoomId,
            customerId: this.customerId,
            content: message,
            type: 'text'
        };
        
        
        // Gửi tin nhắn đến server
        this.socket.emit('send_message', messageObj, (response) => {
            // Tìm tin nhắn tạm thời
            const tempElement = document.querySelector(`.message[data-id="${tempId}"]`);
            
            if (response.success) {
                
                // Lưu ID tin nhắn vào cả hai Set để ngăn hiển thị lại
                if (response.message && response.message.id) {
                    this.socket.sentMessageIds.add(response.message.id);
                    this.messageManager.displayedMessageIds.add(response.message.id);
                }
                
                // Cập nhật tin nhắn tạm thời thành tin nhắn thật
                if (tempElement) {
                    tempElement.setAttribute('data-id', response.message.id);
                    tempElement.classList.remove('temp-message');
                    tempElement.removeAttribute('data-temp');
                    
                    // Cập nhật thời gian
                    const timeElement = tempElement.querySelector('.time');
                    if (timeElement && response.message.createdAt) {
                        try {
                            timeElement.textContent = this.messageManager.formatTime(response.message.createdAt);
                        } catch (error) {
                            console.error('Lỗi khi định dạng thời gian:', error);
                        }
                    }
                    
                }
            } else {
                console.error('Gửi tin nhắn thất bại:', response.error);
                this.notification.showNotification(response.error || 'Không thể gửi tin nhắn. Vui lòng thử lại.', 'error');
                
                // Đánh dấu tin nhắn lỗi
                if (tempElement) {
                    tempElement.classList.add('error');
                    tempElement.setAttribute('title', 'Không thể gửi tin nhắn');
                }
            }
        });
    }
    
    /**
     * Xử lý upload file
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Kiểm tra kích thước tệp (tối đa 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.notification.showNotification('Kích thước tệp không được vượt quá 5MB.', 'error');
            event.target.value = '';
            return;
        }
        
        // Hiển thị thông báo đang tải
        this.notification.showNotification('Đang tải tệp lên...', 'info');
        
        // Tạo ID tạm thời cho tin nhắn
        const tempId = 'temp-file-' + Date.now();
        
        // Đọc tệp dưới dạng base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            
            // Hiển thị tin nhắn tạm thời (optimistic UI)
            const tempMessage = {
                id: tempId,
                content: file.name,
                type: 'file',
                sender: 'customer',
                sender_type: 'customer',
                createdAt: new Date(),
                isTemp: true,
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64Data
                }
            };
            
            this.messageManager.displayMessage(tempMessage);
            
            // Cuộn xuống dưới
            this.messageManager.scrollToBottom();
            
            // Tạo đối tượng tin nhắn
            const messageObj = {
                room_id: this.currentRoomId,
                content: file.name,
                type: 'file',
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64Data
                }
            };
            
            
            // Gửi tin nhắn đến server
            this.socket.emit('send_message', messageObj, (response) => {
                // Tìm tin nhắn tạm thời
                const tempElement = document.querySelector(`.message[data-id="${tempId}"]`);
                
                if (response.success) {
                    
                    // Lưu ID tin nhắn vào cả hai Set để ngăn hiển thị lại
                    if (response.message && response.message.id) {
                        this.socket.sentMessageIds.add(response.message.id);
                        this.messageManager.displayedMessageIds.add(response.message.id);
                    }
                    
                    // Cập nhật tin nhắn tạm thời thành tin nhắn thật
                    if (tempElement) {
                        tempElement.setAttribute('data-id', response.message.id);
                        tempElement.classList.remove('temp-message');
                        tempElement.removeAttribute('data-temp');
                        
                        // Cập nhật thời gian
                        const timeElement = tempElement.querySelector('.time');
                        if (timeElement && response.message.createdAt) {
                            try {
                                timeElement.textContent = this.messageManager.formatTime(response.message.createdAt);
                            } catch (error) {
                                console.error('Lỗi khi định dạng thời gian:', error);
                            }
                        }
                        
                    }
                    
                    this.notification.showNotification('Tải tệp lên thành công.', 'success');
                } else {
                    console.error('Gửi tệp thất bại:', response.error);
                    this.notification.showNotification(response.error || 'Không thể gửi tệp. Vui lòng thử lại.', 'error');
                    
                    // Đánh dấu tin nhắn lỗi
                    if (tempElement) {
                        tempElement.classList.add('error');
                        tempElement.setAttribute('title', 'Không thể gửi tệp');
                    }
                }
            });
            
            // Reset input file
            event.target.value = '';
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * Tăng số tin nhắn chưa đọc
     */
    increaseUnreadCount(roomId) {
        // Tăng số tin nhắn chưa đọc cho phòng
        this.unreadMessages[roomId] = (this.unreadMessages[roomId] || 0) + 1;
        
        // Tính tổng số tin nhắn chưa đọc
        this.totalUnread = Object.values(this.unreadMessages).reduce((sum, count) => sum + count, 0);
        
        // Cập nhật badge thông báo
        this.ui.updateNotificationBadge();
        
        // Lưu trạng thái unread messages
        this.storage.storeUnreadMessages();
    }
    
    /**
     * Đánh dấu tin nhắn đã đọc
     */
    markMessageAsRead(messageId) {
        // Gửi yêu cầu đánh dấu tin nhắn đã đọc
        this.socket.emit('mark_message_read', { messageId });
    }
    
    /**
     * Hiển thị danh sách phòng chat công khai
     */
    showPublicRooms() {
        // Kiểm tra xem đã đăng ký chưa
        if (!this.isRegistered || !this.customerId) {
            console.error('Chưa đăng ký thông tin khách hàng');
            this.notification.showNotification('Vui lòng đăng ký thông tin trước khi xem phòng chat công khai', 'error');
            this.ui.showRegistrationForm('public');
            return;
        }
        
        // Kiểm tra xem có cần cập nhật thông tin không
        if (this.needInfoUpdate) {
            this.ui.requestInfoUpdate('public');
            return;
        }
        
        // Hiển thị thông báo đang tải
        this.notification.showNotification('Đang tải danh sách phòng chat công khai...', 'info');
        
        // Lấy danh sách phòng chat công khai
        this.socket.getPublicRooms((response) => {
            if (response.success) {
                
                // Lưu danh sách phòng chat công khai
                this.publicRooms = response.rooms;
                
                // Hiển thị giao diện phòng chat công khai
                this.ui.showPublicRoomsUI(this.publicRooms);
                
                // Cập nhật view hiện tại
                this.currentView = 'public-rooms';
            } else {
                console.error('Lấy danh sách phòng chat công khai thất bại:', response.error);
                this.notification.showNotification(response.error || 'Không thể lấy danh sách phòng chat công khai. Vui lòng thử lại sau.', 'error');
            }
        });
    }
    
    /**
     * Tham gia phòng chat công khai
     * @param {string} roomId - ID của phòng chat công khai
     */
    joinPublicRoom(roomId) {
        // Kiểm tra xem đã đăng ký chưa
        if (!this.isRegistered || !this.customerId) {
            console.error('Chưa đăng ký thông tin khách hàng');
            this.notification.showNotification('Vui lòng đăng ký thông tin trước khi tham gia phòng chat', 'error');
            this.ui.showRegistrationForm('public');
            return;
        }
        
        // Hiển thị thông báo đang tham gia
        this.notification.showNotification('Đang tham gia phòng chat...', 'info');
        
        // Tham gia phòng chat công khai
        this.socket.joinPublicRoom(roomId, (response) => {
            if (response.success) {
                
                // Lưu ID phòng chat hiện tại
                this.currentRoomId = roomId;
                
                // Tìm thông tin phòng từ danh sách phòng công khai
                const room = this.publicRooms.find(r => r._id === roomId);
                
                // Thêm phòng vào danh sách đã tham gia nếu chưa có
                if (room) {
                    if (!this.joinedRooms) {
                        this.joinedRooms = [];
                    }
                    
                    // Kiểm tra xem phòng đã có trong danh sách chưa
                    const existingRoomIndex = this.joinedRooms.findIndex(r => r._id === roomId);
                    
                    if (existingRoomIndex === -1) {
                        // Thêm phòng vào danh sách đã tham gia
                        this.joinedRooms.push(room);
                        
                        // Lưu danh sách phòng đã tham gia vào localStorage
                        this.storage.addJoinedPublicRoom(room);
                        this.storage.storeJoinedPublicRooms();
                    }
                }
                
                // Hiển thị giao diện phòng chat
                this.ui.showPublicChatRoom(room || { _id: roomId, name: response.roomName || 'Phòng chat công khai' });
                
                // Hiển thị tin nhắn chào mừng
                if (response.welcomeMessage) {
                    this.messageManager.displaySystemMessage(response.welcomeMessage);
                } else {
                    this.messageManager.displaySystemMessage('Chào mừng bạn đến với phòng chat công khai.');
                }
                
                // Tải lịch sử chat từ server
                this.loadChatHistory(roomId);
                
                // Cập nhật view hiện tại
                this.currentView = 'public-chat';
            } else {
                console.error('Tham gia phòng chat công khai thất bại:', response.error);
                this.notification.showNotification(response.error || 'Không thể tham gia phòng chat. Vui lòng thử lại sau.', 'error');
            }
        });
    }
    
    /**
     * Rời phòng chat công khai
     */
    leavePublicRoom() {
        if (!this.currentRoomId) {
            console.error('Không có phòng chat hiện tại');
            return;
        }
        
        // Hiển thị thông báo đang rời phòng
        this.notification.showNotification('Đang rời phòng chat...', 'info');
        
        // Rời phòng chat công khai
        this.socket.leavePublicRoom(this.currentRoomId, (response) => {
            if (response.success) {
                
                // Xóa phòng khỏi danh sách đã tham gia
                const roomId = this.currentRoomId;
                this.joinedRooms = this.joinedRooms.filter(room => room._id !== roomId);
                
                // Cập nhật localStorage
                this.storage.removeJoinedPublicRoom(roomId);
                this.storage.storeJoinedPublicRooms();
                
                // Xóa ID phòng chat hiện tại
                this.currentRoomId = null;
                
                // Hiển thị danh sách phòng chat công khai
                this.showPublicRooms();
                
                // Hiển thị thông báo thành công
                this.notification.showNotification('Đã rời phòng chat thành công.', 'success');
            } else {
                console.error('Rời phòng chat công khai thất bại:', response.error);
                this.notification.showNotification(response.error || 'Không thể rời phòng chat. Vui lòng thử lại sau.', 'error');
            }
        });
    }
    
    /**
     * Gửi tin nhắn trong phòng chat công khai
     */
    sendPublicMessage() {
        const { chatInput } = this.ui.elements;
        const input = chatInput.querySelector('input[type="text"]');
        const message = input.value.trim();
        
        if (!message) return;
        
        if (!this.currentRoomId) {
            this.notification.showNotification('Bạn chưa tham gia phòng chat nào.', 'error');
            return;
        }
        
        // Xóa nội dung input
        input.value = '';
        
        // Tạo ID tạm thời cho tin nhắn
        const tempId = 'temp-public-' + Date.now();
        
        // Hiển thị tin nhắn tạm thời (optimistic UI)
        const tempMessage = {
            id: tempId,
            content: message,
            type: 'text',
            sender: 'customer',
            sender_type: 'customer',
            createdAt: new Date(),
            isTemp: true
        };
        
        this.messageManager.displayMessage(tempMessage);
        
        // Cuộn xuống dưới
        this.messageManager.scrollToBottom();
        
        // Tạo đối tượng tin nhắn
        const messageObj = {
            room_id: this.currentRoomId,
            content: message,
            type: 'text'
        };
        
        
        // Gửi tin nhắn đến server
        this.socket.sendPublicMessage(messageObj, (response) => {
            // Tìm tin nhắn tạm thời
            const tempElement = document.querySelector(`.message[data-id="${tempId}"]`);
            
            if (response.success) {
                
                // Lưu ID tin nhắn vào cả hai Set để ngăn hiển thị lại
                if (response.message && response.message.id) {
                    this.socket.sentMessageIds.add(response.message.id);
                    this.messageManager.displayedMessageIds.add(response.message.id);
                }
                
                // Cập nhật tin nhắn tạm thời thành tin nhắn thật
                if (tempElement) {
                    tempElement.setAttribute('data-id', response.message.id);
                    tempElement.classList.remove('temp-message');
                    tempElement.removeAttribute('data-temp');
                    
                    // Cập nhật thời gian
                    const timeElement = tempElement.querySelector('.time');
                    if (timeElement && response.message.createdAt) {
                        try {
                            timeElement.textContent = this.messageManager.formatTime(response.message.createdAt);
                        } catch (error) {
                            console.error('Lỗi khi định dạng thời gian:', error);
                        }
                    }
                    
                }
            } else {
                console.error('Gửi tin nhắn thất bại:', response.error);
                this.notification.showNotification(response.error || 'Không thể gửi tin nhắn. Vui lòng thử lại.', 'error');
                
                // Đánh dấu tin nhắn lỗi
                if (tempElement) {
                    tempElement.classList.add('error');
                    tempElement.setAttribute('title', 'Không thể gửi tin nhắn');
                }
            }
        });
    }
    
    /**
     * Xử lý upload file trong phòng chat công khai
     */
    handlePublicFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Kiểm tra kích thước tệp (tối đa 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.notification.showNotification('Kích thước tệp không được vượt quá 5MB.', 'error');
            event.target.value = '';
            return;
        }
        
        // Hiển thị thông báo đang tải
        this.notification.showNotification('Đang tải tệp lên...', 'info');
        
        // Tạo ID tạm thời cho tin nhắn
        const tempId = 'temp-public-file-' + Date.now();
        
        // Đọc tệp dưới dạng base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            
            // Hiển thị tin nhắn tạm thời (optimistic UI)
            const tempMessage = {
                id: tempId,
                content: file.name,
                type: 'file',
                sender: 'customer',
                sender_type: 'customer',
                createdAt: new Date(),
                isTemp: true,
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64Data
                }
            };
            
            this.messageManager.displayMessage(tempMessage);
            
            // Cuộn xuống dưới
            this.messageManager.scrollToBottom();
            
            // Tạo đối tượng tin nhắn
            const messageObj = {
                room_id: this.currentRoomId,
                content: file.name,
                type: 'file',
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64Data
                }
            };
            
            
            // Gửi tin nhắn đến server
            this.socket.sendPublicMessage(messageObj, (response) => {
                // Tìm tin nhắn tạm thời
                const tempElement = document.querySelector(`.message[data-id="${tempId}"]`);
                
                if (response.success) {
                    
                    // Lưu ID tin nhắn vào cả hai Set để ngăn hiển thị lại
                    if (response.message && response.message.id) {
                        this.socket.sentMessageIds.add(response.message.id);
                        this.messageManager.displayedMessageIds.add(response.message.id);
                    }
                    
                    // Cập nhật tin nhắn tạm thời thành tin nhắn thật
                    if (tempElement) {
                        tempElement.setAttribute('data-id', response.message.id);
                        tempElement.classList.remove('temp-message');
                        tempElement.removeAttribute('data-temp');
                        
                        // Cập nhật thời gian
                        const timeElement = tempElement.querySelector('.time');
                        if (timeElement && response.message.createdAt) {
                            try {
                                timeElement.textContent = this.messageManager.formatTime(response.message.createdAt);
                            } catch (error) {
                                console.error('Lỗi khi định dạng thời gian:', error);
                            }
                        }
                        
                    }
                    
                    this.notification.showNotification('Tải tệp lên thành công.', 'success');
                } else {
                    console.error('Gửi tệp thất bại:', response.error);
                    this.notification.showNotification(response.error || 'Không thể gửi tệp. Vui lòng thử lại.', 'error');
                    
                    // Đánh dấu tin nhắn lỗi
                    if (tempElement) {
                        tempElement.classList.add('error');
                        tempElement.setAttribute('title', 'Không thể gửi tệp');
                    }
                }
            });
            
            // Reset input file
            event.target.value = '';
        };
        
        reader.readAsDataURL(file);
    }
} 